import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  updatePassword,
  reauthenticateWithCredential,
  linkWithCredential,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  EmailAuthProvider,
} from "firebase/auth";

// Same Firebase project as the `template` app — this app shares accounts,
// credits, and login with it by design. The web config is not a secret
// (Firebase's own guidance); the real security boundary is Firebase Auth
// rules + server-side checks, same as `template`.
const firebaseConfig = {
  apiKey: "AIzaSyDplstUT1pRaTnvi_7eSxdJEt1qu_nv76g",
  authDomain: "finaceindia-1d8d3.firebaseapp.com",
  projectId: "finaceindia-1d8d3",
  storageBucket: "finaceindia-1d8d3.firebasestorage.app",
  messagingSenderId: "508629902072",
  appId: "1:508629902072:web:a31e76c4016c6388d9910d",
  measurementId: "G-L5MR1KTEYT",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export {
  auth,
  GoogleAuthProvider,
  linkWithCredential,
  updatePassword,
  reauthenticateWithCredential,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  EmailAuthProvider,
};
