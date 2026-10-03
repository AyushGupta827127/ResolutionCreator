// Turns Firebase / server auth errors into something a person (or whoever deploys the app) can act on.
// The two "deployment" errors name the exact thing to change, using the real hostname of the page.

export function friendlyAuthError(error) {
  const code = error?.code || "";
  const host = typeof window !== "undefined" ? window.location.hostname : "this domain";
  const serverMessage = error?.data?.statusMessage;
  if (serverMessage) return serverMessage;

  switch (code) {
    case "auth/unauthorized-domain":
      return `Sign-in is not enabled for ${host} yet. In the Firebase console go to Authentication → Settings → Authorized domains and add "${host}".`;
    case "auth/operation-not-allowed":
      return "This sign-in method is switched off. Enable it in the Firebase console under Authentication → Sign-in method.";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
      return "The Firebase API key was rejected. Check the key in utils/firebase.js and its restrictions in Google Cloud Console.";
    case "auth/network-request-failed":
      return "Couldn't reach the sign-in service. Check your internet connection and try again.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "The Google sign-in window was closed before finishing.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes or reset your password.";
    case "auth/email-already-in-use":
      return "That email already has an account — sign in instead.";
    case "auth/weak-password":
      return "Choose a stronger password (at least 6 characters).";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
  }
  // Firebase's "requests from referer <url> are blocked" = the browser API key is restricted to other websites
  if (/requests-from-referer|referer .* are blocked/i.test(`${code} ${error?.message || ""}`)) {
    return `The Firebase API key doesn't allow requests from ${host}. In Google Cloud Console → APIs & Services → Credentials, add "${host}/*" to the key's allowed websites.`;
  }
  return error?.message || "Something went wrong. Please try again.";
}
