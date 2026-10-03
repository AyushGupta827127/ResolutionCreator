/**
 * Deployment self-check: open /api/auth-check on the deployed site to see which server settings are in place.
 * Returns only yes/no flags, never the values themselves.
 */
export default defineEventHandler((event) => {
  const config = serverConfig(event);
  const yes = (v) => Boolean(v && String(v).trim());
  const host = getRequestHost(event);
  return {
    nodeEnv: process.env.NODE_ENV || "unknown",
    host,
    // needed to send sign-up / password-reset OTP e-mails
    smtpConfigured: yes(config.SMTP_USER) && yes(config.SMTP_PASS),
    // needed for password reset, and to verify who is saving a resolution / spending credits
    firebaseAdminConfigured: yes(config.FIREBASE_SERVICE_ACCOUNT),
    // needed to read/write credits and history in Directus when it is not public
    directusTokenConfigured: yes(config.DIRECTUS_API_TOKEN),
    paymentsConfigured: yes(config.RAZORPAY_KEY_ID) && yes(config.RAZORPAY_KEY_SECRET),
    aiConfigured: yes(config.ANTHROPIC_API_KEY),
    strictAuth: String(config.REQUIRE_VERIFIED_AUTH || "").toLowerCase() === "true",
    reminder:
      "Google sign-in also needs this host listed in Firebase console → Authentication → Settings → Authorized domains: " + host,
  };
});
