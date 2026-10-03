import bcrypt from "bcrypt";
import { consumeVerifiedOtp } from "../utils/otpStore";
import { getAdminAuth } from "../utils/firebaseAdmin";

/**
 * Password reset. Body: { email, otp, newPassword }
 * Same model as `template`: consume a verified OTP, update Firebase Auth
 * (what login actually checks), best-effort sync the Directus bcrypt hash.
 */
export default defineEventHandler(async (event) => {
  const { email, otp, newPassword } = (await readBody(event)) || {};

  if (!email || !otp || !newPassword) {
    throw createError({ statusCode: 400, statusMessage: "Missing email, otp or newPassword" });
  }
  if (String(newPassword).length < 8) {
    throw createError({ statusCode: 400, statusMessage: "Password must be at least 8 characters long" });
  }

  const otpResult = consumeVerifiedOtp(email, "reset", otp);
  if (!otpResult.ok) {
    throw createError({ statusCode: 401, statusMessage: otpResult.reason || "OTP verification failed" });
  }

  const config = serverConfig(event);
  const dbUrl = config.DB_API_URL || "https://temp.finaceindia.com";

  try {
    const adminAuth = getAdminAuth();
    let firebaseUser;
    try {
      firebaseUser = await adminAuth.getUserByEmail(email);
    } catch {
      throw createError({ statusCode: 404, statusMessage: "No account found for that email" });
    }
    await adminAuth.updateUser(firebaseUser.uid, { password: newPassword });

    try {
      const listRes = await fetch(`${dbUrl}/items/user?filter[email][_eq]=${encodeURIComponent(email)}`);
      const listJson = await listRes.json();
      const user = listJson?.data?.[0];
      if (user) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await fetch(`${dbUrl}/items/user/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: hashedPassword }),
        });
      }
    } catch (syncErr) {
      console.warn("[admin-reset] Directus sync failed:", syncErr.message);
    }

    return { success: true, message: "Password updated successfully", email };
  } catch (err) {
    if (err.statusCode) throw err;
    console.error("[admin-reset] Error:", err);
    throw createError({ statusCode: 500, statusMessage: err.message || "Failed to update password" });
  }
});
