import Razorpay from "razorpay";
import { amountPaiseFor } from "../utils/creditPackages";

/**
 * Body: { credits }. The price is looked up server-side — any `amount` the
 * browser sends is ignored, so a tampered request can't buy credits cheaply.
 */
export default defineEventHandler(async (event) => {
  const { credits } = (await readBody(event)) || {};
  const amount = amountPaiseFor(credits);
  if (!amount) {
    throw createError({ statusCode: 400, statusMessage: "Choose one of the available credit packs." });
  }

  const config = useRuntimeConfig(event);
  const keyId = config.RAZORPAY_KEY_ID;
  const keySecret = config.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw createError({ statusCode: 500, statusMessage: "Server configuration error. Please contact support." });
  }

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `order_${Date.now()}`,
      notes: { credits: String(Number(credits)), description: `${Number(credits)} Credits` },
    });
    return { order_id: order.id, amount: order.amount, currency: order.currency };
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw createError({ statusCode: 500, statusMessage: "Failed to create payment order" });
  }
});
