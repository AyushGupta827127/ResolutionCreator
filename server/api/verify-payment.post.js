import crypto from "node:crypto";
import Razorpay from "razorpay";
import { amountPaiseFor } from "../utils/creditPackages";

/**
 * Verifies a Razorpay payment and credits the SAME `user` collection that
 * `template` reads/writes — same account, shared balance across both apps.
 * Credits/amount are read back from the Razorpay order, never trusted from
 * the client.
 */
export default defineEventHandler(async (event) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email } = await readBody(event);
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !email) {
      throw createError({ statusCode: 400, statusMessage: "Missing required fields" });
    }

    const config = serverConfig(event);
    const razorpaySecret = config.RAZORPAY_KEY_SECRET;
    const razorpayKeyId = config.RAZORPAY_KEY_ID;
    if (!razorpaySecret || !razorpayKeyId) {
      throw createError({ statusCode: 500, statusMessage: "Server configuration error" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (expectedSignature !== razorpay_signature) {
      throw createError({ statusCode: 400, statusMessage: "Invalid payment signature" });
    }

    const razorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpaySecret });
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== "captured" && payment.status !== "authorized") {
      throw createError({ statusCode: 400, statusMessage: `Payment not completed (${payment.status})` });
    }
    if (payment.order_id !== razorpay_order_id) {
      throw createError({ statusCode: 400, statusMessage: "Payment does not match order" });
    }

    const credits = parseInt(order.notes?.credits, 10);
    const amountPaid = Number(order.amount) / 100;
    if (!Number.isFinite(credits) || credits <= 0) {
      throw createError({ statusCode: 400, statusMessage: "Order is missing a valid credits value" });
    }

    // The paid amount must match our own price for that pack (an order created
    // with a tampered amount can't earn the full credits).
    if (order.currency !== "INR" || Number(order.amount) !== amountPaiseFor(credits)) {
      throw createError({ statusCode: 400, statusMessage: "Order amount doesn't match the credit pack." });
    }

    const dbUrl = config.DB_API_URL || "https://temp.finaceindia.com";
    const readHeaders = {};
    if (config.DIRECTUS_API_TOKEN) readHeaders.Authorization = `Bearer ${config.DIRECTUS_API_TOKEN}`;
    const jsonHeaders = { "Content-Type": "application/json", ...readHeaders };

    // Idempotency: one Razorpay payment can only ever be credited once.
    const dupRes = await fetch(
      `${dbUrl}/items/payment?filter[payment_id][_eq]=${encodeURIComponent(razorpay_payment_id)}&limit=1&fields=id`,
      { headers: readHeaders }
    );
    if (dupRes.ok && (await dupRes.json())?.data?.length) {
      throw createError({ statusCode: 409, statusMessage: "This payment has already been credited." });
    }

    const API_URL = `${dbUrl}/items/user`;
    const response = await fetch(`${API_URL}?filter[email][_eq]=${encodeURIComponent(email)}`, { headers: readHeaders });
    const data = await response.json();
    if (!data.data || data.data.length === 0) {
      throw createError({ statusCode: 404, statusMessage: "User not found in database" });
    }

    const userProfile = data.data[0];
    const currentCredits = Number(userProfile.credits) || 0;
    const newBalance = currentCredits + credits;

    const updateResponse = await fetch(`${API_URL}/${userProfile.id}`, {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify({ credits: newBalance }),
    });
    if (!updateResponse.ok) {
      throw createError({ statusCode: 500, statusMessage: "Failed to update credits in database" });
    }

    try {
      await fetch(`${dbUrl}/items/payment`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          user_id: userProfile.id,
          email,
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
          credits_purchased: credits,
          amount_paid: amountPaid,
          credits_before: currentCredits,
          credits_after: newBalance,
          payment_status: "success",
          payment_method: "razorpay",
          transaction_date: new Date().toISOString(),
          signature_verified: true,
          razorpay_signature,
          notes: `User purchased ${credits} credits via Razorpay (Resolution Creator)`,
        }),
      });
    } catch (histErr) {
      console.error("Failed to save payment history:", histErr.message);
    }

    return {
      success: true,
      message: `Successfully credited ${credits} credits to your account`,
      payment_id: razorpay_payment_id,
      credits,
      current_balance: currentCredits,
      new_balance: newBalance,
      user_id: userProfile.id,
      email,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    if (error.statusCode) throw error;
    console.error("Payment verification error:", error.message || error);
    throw createError({ statusCode: 500, statusMessage: error.message || "Payment verification failed" });
  }
});
