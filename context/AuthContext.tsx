"use client";

import {
  createContext,
  useCallback,
  useMemo,
} from "react";
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";
import type { AuthUser, UserRole } from "@/types";
import { signUp as backendSignUp } from "@/lib/api/auth";
import { apiFetch } from "@/lib/api/client";

export type SignInOptions = {
  /** If set, only these roles may complete sign-in (others get a portal hint error). */
  allowedRoles?: UserRole[];
};

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  signIn: (
    email: string,
    password: string,
    options?: SignInOptions
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  signUp: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { name?: string; phone?: string }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();

  const ready = status !== "loading";

  const user = useMemo<AuthUser | null>(() => {
    if (!session?.user) return null;
    return {
      id: session.user.id,
      name: session.user.name ?? "",
      email: session.user.email ?? "",
      role: (session.user.role as UserRole) || "customer",
      phone: session.user.phone ?? undefined,
    };
  }, [session]);

  const signIn = useCallback<AuthContextValue["signIn"]>(
    async (email, password, options) => {
      const allowedRoles = options?.allowedRoles ?? ["customer"];
      try {
        const res = await nextAuthSignIn("credentials", {
          email,
          password,
          allowedRoles: allowedRoles.join(","),
          redirect: false,
        });

        if (res?.error) {
          const message =
            res.code === "role-not-allowed"
              ? "This account isn't set up for this portal."
              : "Incorrect email or password.";
          return { ok: false, error: message };
        }
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err?.message || "Sign in failed" };
      }
    },
    []
  );

  const signUp = useCallback<AuthContextValue["signUp"]>(
    async (name, email, password) => {
      try {
        await backendSignUp(name, email, password);
        // Automatically sign in the user as customer
        const res = await nextAuthSignIn("credentials", {
          email,
          password,
          allowedRoles: "customer",
          redirect: false,
        });
        if (res?.error) {
          return { ok: false, error: "Account created but sign in failed. Please log in manually." };
        }
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err?.message || "Sign up failed" };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    await nextAuthSignOut({ redirect: false });
  }, []);

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(
    async (updates) => {
      try {
        await apiFetch("/users/me", {
          method: "PATCH",
          body: updates,
        });
        await update(updates);
      } catch (err: any) {
        console.error("Failed to update profile", err);
        throw err;
      }
    },
    [update]
  );

  const value = useMemo(
    () => ({
      user,
      ready,
      signIn,
      signUp,
      signOut,
      updateProfile,
    }),
    [user, ready, signIn, signUp, signOut, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
