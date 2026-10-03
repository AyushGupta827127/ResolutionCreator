import nodemailer from "nodemailer";
import { issueOtp, canIssueOtp } from "../utils/otpStore";

/**
 * Body: { email, purpose: "signup" | "reset" }
 * The OTP is never returned to the client — only checkable via /api/verify-otp.
 */
export default defineEventHandler(async (event) => {
  const { email, purpose = "signup" } = await readBody(event);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
  if (!emailOk) throw createError({ statusCode: 400, statusMessage: "Invalid email" });
  if (!["signup", "reset"].includes(purpose)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid purpose" });
  }

  const config = useRuntimeConfig(event);
  if (!config.SMTP_USER || !config.SMTP_PASS) {
    throw createError({ statusCode: 500, statusMessage: "Email service is not configured" });
  }

  if (!canIssueOtp(email, purpose)) {
    throw createError({ statusCode: 429, statusMessage: "Too many OTP requests. Please wait a few minutes and try again." });
  }
  const code = issueOtp(email, purpose);

  try {
    const port = Number(config.SMTP_PORT) || 465;
    const transporter = nodemailer.createTransport({
      host: config.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
    });

    const label = purpose === "reset" ? "password reset" : "email verification";
    await transporter.sendMail({
      from: config.SMTP_FROM || config.SMTP_USER,
      to: email,
      subject: `Your OTP Code - ${purpose === "reset" ? "Password Reset" : "Sign Up"}`,
      html: `Your ${label} OTP is <b>${code}</b>. It is valid for 10 minutes.`,
    });

    return { success: true, message: "OTP sent" };
  } catch (error) {
    console.error("[send-otp] failed:", error.message);
    throw createError({ statusCode: 500, statusMessage: "Failed to send OTP" });
  }
});
