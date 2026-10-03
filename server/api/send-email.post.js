import nodemailer from "nodemailer";
import { requireUser } from "../utils/auth";

/**
 * Transactional email to the signed-in user's OWN address only (used for the
 * "your password" mail after Google sign-in / password change). It is not a
 * general mail relay, and attachments can only be fetched from https URLs —
 * never from the server's local disk.
 */
export default defineEventHandler(async (event) => {
  const caller = await requireUser(event);
  const { to, subject, text, filename, fileurl } = (await readBody(event)) || {};

  if (!to || !subject || !text) {
    throw createError({ statusCode: 400, statusMessage: "Missing required fields: to, subject, text" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(to))) {
    throw createError({ statusCode: 400, statusMessage: "Invalid recipient" });
  }
  if (!caller.unverified && String(to).toLowerCase() !== caller.email) {
    throw createError({ statusCode: 403, statusMessage: "You can only email your own address." });
  }
  if (String(subject).length > 200 || String(text).length > 20000) {
    throw createError({ statusCode: 413, statusMessage: "Message too large" });
  }

  const config = serverConfig(event);
  if (!config.SMTP_USER || !config.SMTP_PASS) {
    throw createError({ statusCode: 500, statusMessage: "Email service is not configured" });
  }

  try {
    const port = Number(config.SMTP_PORT) || 465;
    const transporter = nodemailer.createTransport({
      host: config.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
    });

    // Text is never treated as HTML; line breaks are preserved.
    const html = String(text)
      .replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))
      .replace(/\n/g, "<br>");
    const mailOptions = { from: config.SMTP_FROM || config.SMTP_USER, to, subject: String(subject), html };
    if (filename && fileurl && /^https:\/\//i.test(String(fileurl))) {
      mailOptions.attachments = [{ filename: String(filename).slice(0, 120), path: String(fileurl) }];
    }

    await transporter.sendMail(mailOptions);
    return { message: "Email sent successfully." };
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw createError({ statusCode: 500, statusMessage: "Error sending email" });
  }
});
