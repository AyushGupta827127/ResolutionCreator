import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/utils/firebase";

export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return;

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user ? undefined : navigateTo("/"));
    });
  });
});
