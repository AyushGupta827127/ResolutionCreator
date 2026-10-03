import { verifyOtp } from "../utils/otpStore";

export default defineEventHandler(async (event) => {
  const { email, purpose = "signup", code } = await readBody(event);

  if (!email || !code) throw createError({ statusCode: 400, statusMessage: "Missing email or code" });

  const result = verifyOtp(email, purpose, code);
  if (!result.ok) throw createError({ statusCode: 400, statusMessage: result.reason });

  return { valid: true };
});
