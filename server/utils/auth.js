import { getAdminAuth } from "./firebaseAdmin";

/**
 * Verifies the caller's Firebase ID token (`Authorization: Bearer <token>`).
 * Returns { uid, email }.
 *
 * - FIREBASE_SERVICE_ACCOUNT configured -> the token is required and verified.
 * - Not configured                      -> allowed with a warning, `unverified: true`
 *                                          (set REQUIRE_VERIFIED_AUTH=true to refuse instead — recommended in production).
 */
export async function requireUser(event) {
  const config = serverConfig(event);

  if (!config.FIREBASE_SERVICE_ACCOUNT) {
    // Can't verify tokens without the service account. Production is strict only when REQUIRE_VERIFIED_AUTH=true
    // (otherwise saving / credits would stop working on a server that simply hasn't been given the key yet).
    if (String(config.REQUIRE_VERIFIED_AUTH || "").toLowerCase() === "true") {
      throw createError({ statusCode: 503, statusMessage: "Sign-in verification is not configured on the server (FIREBASE_SERVICE_ACCOUNT is missing)." });
    }
    if (!globalThis.__warnedUnverifiedAuth) {
      globalThis.__warnedUnverifiedAuth = true;
      console.warn("[auth] FIREBASE_SERVICE_ACCOUNT is not set: requests are NOT verified. Set it (and REQUIRE_VERIFIED_AUTH=true) in production.");
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
