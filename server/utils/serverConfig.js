/**
 * Runtime configuration for server code.
 *
 * nuxt.config.ts reads `process.env.SMTP_USER` etc. when the app is BUILT, so a deployed server that only has
 * those variables at RUNTIME (the normal hosting setup) would see empty values — SMTP, Firebase Admin, Razorpay
 * and AI keys would all look "not configured" in production while working locally. This returns a copy of the
 * runtime config with the plain environment variables layered on top (the runtime config itself is read-only).
 */
const KEYS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "DIRECTUS_API_TOKEN",
  "FIREBASE_SERVICE_ACCOUNT",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_MODEL",
  "REQUIRE_VERIFIED_AUTH",
];

export function serverConfig(event) {
  const base = useRuntimeConfig(event);
  const out = { ...base };
  for (const key of KEYS) {
    const value = process.env[key];
    if (value !== undefined && value !== "") out[key] = value;
  }
  if (process.env.NUXT_DB_API_URL) out.DB_API_URL = process.env.NUXT_DB_API_URL;
  return out;
}
