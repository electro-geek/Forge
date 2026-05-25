"use client";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import { verifyToken } from "@/lib/api";

export function useAuth() {
  const { setFirebaseUser, setDbUser, setIdToken, setLoading, logout } = useAuthStore();

  useEffect(() => {
    // Safety net: if Firebase never responds (invalid config, offline, etc.)
    // force isLoading to false after 4 s so the page doesn't stay blank.
    const timeout = setTimeout(() => setLoading(false), 4000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout);
      if (firebaseUser) {
        setFirebaseUser(firebaseUser);
        try {
          const token = await firebaseUser.getIdToken();
          setIdToken(token);
          const result = await verifyToken(token);
          setDbUser(result.user);
        } catch (err) {
          console.error("Token verification failed:", err);
          logout();
        }
      } else {
        logout();
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  return useAuthStore();
}
