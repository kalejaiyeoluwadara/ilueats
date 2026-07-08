import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { signIn as backendSignIn } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { BackendRole } from "@/lib/api/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/account" },
  providers: [
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
          if (err instanceof ApiError) return null;
          throw err;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
        token.phone = user.phone;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.id = token.id as string;
      session.user.role = token.role as BackendRole;
      session.user.phone = token.phone as string | null;
      return session;
    },
  },
});
