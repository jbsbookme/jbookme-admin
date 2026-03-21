"use client";

import {
  onAuthStateChanged,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import type { UserRole } from "@/lib/types";

type AuthState = {
  user: FirebaseUser | null;
  role: UserRole | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({
  user: null,
  role: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);
      setUser(nextUser);

      if (nextUser) {
        console.log("[auth] onAuthStateChanged uid:", nextUser.uid);
      } else {
        console.log("[auth] onAuthStateChanged signed out");
      }

      if (!nextUser) {
        setRole(null);
        setLoading(false);
        return;
      }
      try {
        const userRef = doc(db, COLLECTIONS.users, nextUser.uid);
        const snapshot = await getDoc(userRef);
        const nextRole = snapshot.exists()
          ? (snapshot.data().role as UserRole | undefined)
          : undefined;

        console.log("[auth] role document exists:", snapshot.exists());
        console.log("[auth] role value:", nextRole ?? "(missing)");

        if (nextRole !== "admin") {
          console.log("[auth] role is not admin, signing out");
          await signOut(auth);
          setUser(null);
          setRole(null);
          setLoading(false);
          return;
        }

        setRole(nextRole ?? null);
      } catch (error) {
        console.log("[auth] failed to load role:", error);
        await signOut(auth);
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({ user, role, loading }),
    [user, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
