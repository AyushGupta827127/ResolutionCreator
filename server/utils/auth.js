import { getAdminAuth } from "./firebaseAdmin";

/**
 * Verifies the caller's Firebase ID token (`Authorization: Bearer <token>`).
 * Returns { uid, email }.
 *
 * - FIREBASE_SERVICE_ACCOUNT configured -> the token is required and verified.
 * - Not configured, development        -> allowed (so the app runs with no secrets), `unverified: true`.
 * - Not configured, production         -> refused: never trust the client's word in production.
 */
export async function requireUser(event) {
  const config = useRuntimeConfig(event);

  if (!config.FIREBASE_SERVICE_ACCOUNT) {
    if (process.env.NODE_ENV === "production") {
      throw createError({ statusCode: 503, statusMessage: "Authentication is not configured on the server." });
    }
    return { uid: null, email: null, unverified: true };
  }

  const header = getHeader(event, "authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw createError({ statusCode: 401, statusMessage: "Please sign in." });

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return { uid: decoded.uid, email: String(decoded.email || "").toLowerCase(), unverified: false };
  } catch {
    throw createError({ statusCode: 401, statusMessage: "Your session has expired — please sign in again." });
  }
}

/** The signed-in caller must be the Directus user `userRecord` (matched by email). */
export function assertSameUser(caller, userRecord) {
  if (caller.unverified) return;
  if (!caller.email || String(userRecord?.email || "").toLowerCase() !== caller.email) {
    throw createError({ statusCode: 403, statusMessage: "That account doesn't belong to you." });
  }
}
