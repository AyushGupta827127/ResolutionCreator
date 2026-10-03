import { randomInt } from "node:crypto";

/**
 * In-memory OTP store for signup / password-reset flows.
 * Ported from `template` — same interface, so it could later be swapped
 * for the exact same Redis-backed implementation if that ships there.
 * NOTE: in-memory means it doesn't survive restarts or span multiple
 * instances; use a shared store when running more than one server.
 */

const store = new Map(); // key -> { code, expiresAt, attempts, verified }
const issued = new Map(); // key -> [timestamps] (rate limiting)

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const MAX_ISSUES = 3; // OTP emails per address/purpose per window
const ISSUE_WINDOW_MS = 10 * 60 * 1000;

const keyFor = (email, purpose) => `${purpose}:${String(email || "").trim().toLowerCase()}`;

/** true if another OTP email may be sent to this address right now. */
export function canIssueOtp(email, purpose) {
  const key = keyFor(email, purpose);
  const now = Date.now();
  const recent = (issued.get(key) || []).filter((t) => now - t < ISSUE_WINDOW_MS);
  issued.set(key, recent);
  return recent.length < MAX_ISSUES;
}

export function issueOtp(email, purpose) {
  const key = keyFor(email, purpose);
  const code = String(randomInt(100000, 1000000)); // cryptographically random, 6 digits
  store.set(key, { code, expiresAt: Date.now() + TTL_MS, attempts: 0, verified: false });
  issued.set(key, [...(issued.get(key) || []), Date.now()]);
  return code;
}

function check(entry, key, code) {
  if (!entry) return { ok: false, reason: "No OTP requested" };
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return { ok: false, reason: "OTP expired" };
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    store.delete(key);
    return { ok: false, reason: "Too many attempts" };
  }
  entry.attempts += 1;
  if (String(code).trim() !== entry.code) return { ok: false, reason: "Incorrect OTP" };
  return { ok: true };
}

export function verifyOtp(email, purpose, code) {
  const key = keyFor(email, purpose);
  const entry = store.get(key);
  const result = check(entry, key, code);
  if (result.ok) entry.verified = true;
  return result;
}

// Same attempt limit as verifyOtp, otherwise the reset endpoint could be used to brute-force the 6 digits.
export function consumeVerifiedOtp(email, purpose, code) {
  const key = keyFor(email, purpose);
  const result = check(store.get(key), key, code);
  if (result.ok) store.delete(key);
  return result;
}

if (!globalThis.__otpSweep) {
  globalThis.__otpSweep = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store.entries()) if (now > v.expiresAt) store.delete(k);
    for (const [k, list] of issued.entries()) {
      const recent = list.filter((t) => now - t < ISSUE_WINDOW_MS);
      if (recent.length) issued.set(k, recent);
      else issued.delete(k);
    }
  }, TTL_MS).unref?.();
}
