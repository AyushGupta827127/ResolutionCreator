import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

/**
 * Lazily initialises the Firebase Admin SDK for the SAME `finaceindia-1d8d3`
 * project as `template`. Set FIREBASE_SERVICE_ACCOUNT to that project's
 * service-account JSON (raw or base64) — see .env.example.
 */
function loadServiceAccount() {
  const raw = serverConfig().FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw createError({
      statusCode: 500,
      statusMessage: "Firebase Admin is not configured (FIREBASE_SERVICE_ACCOUNT missing)",
    });
  }

  let jsonStr = raw.trim();
  if (!jsonStr.startsWith("{")) jsonStr = Buffer.from(jsonStr, "base64").toString("utf8");

  try {
    return JSON.parse(jsonStr);
  } catch {
    throw createError({ statusCode: 500, statusMessage: "FIREBASE_SERVICE_ACCOUNT is not valid JSON" });
  }
}

let cachedAuth = null;

export function getAdminAuth() {
  if (cachedAuth) return cachedAuth;
  const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(loadServiceAccount()) });
  cachedAuth = getAuth(app);
  return cachedAuth;
}
