import { auth } from "@/utils/firebase";

/** `{ Authorization: "Bearer <Firebase ID token>" }` for the signed-in user, or {} when signed out. */
export async function getAuthHeaders() {
  try {
    const token = await auth.currentUser?.getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
