import NextAuth from "next-auth";
import { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { signIn as backendSignIn } from "@/lib/api/auth";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { BackendRole } from "@/lib/api/auth";

/**
 * Auth.js deliberately strips the authorize() error message for credentials
 * providers (to avoid leaking account existence), only passing through a
 * `code`. We map our backend's actual failure reason onto a code here so the
 * sign-in form can show something more useful than "sign in failed".
 */
class WrongCredentials extends CredentialsSignin {
  code = "invalid-credentials";
}
class RoleNotAllowed extends CredentialsSignin {
  code = "role-not-allowed";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/account" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "dummy-id",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "dummy-secret",
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        allowedRoles: { label: "Allowed roles", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const allowedRolesRaw = credentials?.allowedRoles as
          | string
          | undefined;
        if (!email || !password) return null;

        const allowedRoles = allowedRolesRaw
          ? (allowedRolesRaw.split(",") as BackendRole[])
          : undefined;

        try {
          const { user, token } = await backendSignIn(
            email,
            password,
            allowedRoles,
          );
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            accessToken: token,
          };
        } catch (err) {
          if (err instanceof ApiError) {
            if (err.status === 403) throw new RoleNotAllowed();
            throw new WrongCredentials();
          }
          throw err;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const syncResult = await apiFetch<{ token: string; user: any }>("/auth/google-sync", {
            method: "POST",
            body: {
              email: user.email,
              name: user.name,
            },
          });
          user.accessToken = syncResult.token;
          user.role = syncResult.user.role;
          user.phone = syncResult.user.phone;
          user.id = syncResult.user.id;
          return true;
        } catch (err) {
          console.error("Backend OAuth sync failed", err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
        token.phone = user.phone;
        token.id = user.id;
      }
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.phone !== undefined) token.phone = session.phone;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.id = token.id as string;
      session.user.role = token.role as BackendRole;
      session.user.phone = token.phone as string | null;
      if (token.name) session.user.name = token.name;
      return session;
    },
  },
});
