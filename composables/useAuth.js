import { ref, watch } from "vue";
import {
  auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  linkWithCredential,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
} from "@/utils/firebase";
import { useGlobalStore } from "@/stores/useGlobalStore";
import { getAuthHeaders } from "@/composables/useAuthHeaders";

// Module-level singleton, same pattern as `template`'s useAuth — one shared
// `user` ref, one auth-state listener per session.
const user = ref(null);
const API_URL = "https://temp.finaceindia.com/items/user";

const generateRandomPassword = () => Math.random().toString(36).slice(-10);

const checkUserExists = async (email) => {
  try {
    const response = await fetch(`${API_URL}?filter[email][_eq]=${email}`);
    const data = await response.json();
    return data?.data?.length > 0;
  } catch (error) {
    console.error("Error checking user:", error);
    return false;
  }
};

const saveUserToDirectus = async (email, name) => {
  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, credits: 25 }),
    });
  } catch (error) {
    console.error("Error saving user:", error);
  }
};

const sendPasswordEmail = async (email, password) => {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
      body: JSON.stringify({
        to: email,
        subject: "Your Account Password",
        text: `Hello,\n\nYour new password is: ${password}\n\nYou can now log in using this password.\n\n— Resolution Creator`,
      }),
    });
    if (!response.ok) console.error("Failed to send password email:", await response.text());
  } catch (error) {
    console.error("Error sending password email:", error);
  }
};

const signIn = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  user.value = userCredential.user;
  if (!(await checkUserExists(email))) await saveUserToDirectus(email, userCredential.user.displayName || "");
  await useGlobalStore().initializeStores();
  return user.value;
};

const signUp = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  user.value = userCredential.user;
  if (!(await checkUserExists(email))) await saveUserToDirectus(email, userCredential.user.displayName || "");
  await useGlobalStore().initializeStores();
  return user.value;
};

const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const globalStore = useGlobalStore();

  const userCredential = await signInWithPopup(auth, provider);
  user.value = userCredential.user;

  if (!(await checkUserExists(user.value.email))) {
    await saveUserToDirectus(user.value.email, user.value.displayName || "");
  }

  try {
    const randomPassword = generateRandomPassword();
    const emailCredential = EmailAuthProvider.credential(user.value.email, randomPassword);
    const googleCredential = GoogleAuthProvider.credentialFromResult(userCredential);
    await reauthenticateWithCredential(user.value, googleCredential);
    await linkWithCredential(user.value, emailCredential);
    await sendPasswordEmail(user.value.email, randomPassword);
  } catch (linkError) {
    if (linkError.code !== "auth/credential-already-in-use" && linkError.code !== "auth/requires-recent-login") {
      console.error("Error linking credentials:", linkError);
    }
  }

  await globalStore.initializeStores();
  return user.value;
};

let authListenerRegistered = false;
const monitorAuthState = () => {
  if (authListenerRegistered) return;
  authListenerRegistered = true;
  const globalStore = useGlobalStore();
  onAuthStateChanged(auth, async (currentUser) => {
    user.value = currentUser;
    if (currentUser) await globalStore.initializeStores();
  });
};

const changePassword = async (currentPassword, newPassword) => {
  if (!user.value) throw new Error("User not signed in");
  const credential = EmailAuthProvider.credential(user.value.email, currentPassword);
  await reauthenticateWithCredential(user.value, credential);
  await updatePassword(user.value, newPassword);
  await sendPasswordEmail(user.value.email, newPassword);
  return true;
};

const signOutUser = async () => {
  await signOut(auth);
  user.value = null;
};

if (typeof window !== "undefined") {
  watch(user, (newValue) => {
    if (newValue) {
      localStorage.setItem("user_email", newValue.email);
      localStorage.setItem("userId", newValue.uid);
    } else {
      localStorage.removeItem("user_email");
      localStorage.removeItem("userId");
    }
  });
}

export const useAuth = () => ({
  user,
  signIn,
  signUp,
  signInWithGoogle,
  signOutUser,
  monitorAuthState,
  checkUserExists,
  changePassword,
});
