import { create } from "zustand";
import { User as FirebaseUser } from "firebase/auth";
import { User } from "@/types";

interface AuthState {
  firebaseUser: FirebaseUser | null;
  dbUser: User | null;
  idToken: string | null;
  isLoading: boolean;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setDbUser: (user: User | null) => void;
  setIdToken: (token: string | null) => void;
  setLoading: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  dbUser: null,
  idToken: null,
  isLoading: true,

  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setDbUser: (user) => set({ dbUser: user }),
  setIdToken: (token) => set({ idToken: token }),
  setLoading: (v) => set({ isLoading: v }),

  logout: () =>
    set({ firebaseUser: null, dbUser: null, idToken: null }),
}));
