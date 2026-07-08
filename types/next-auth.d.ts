import type { BackendRole } from "@/lib/api/auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: BackendRole;
    phone: string | null;
    accessToken: string;
  }

  interface Session {
    accessToken: string;
    user: DefaultSession["user"] & {
      id: string;
      role: BackendRole;
      phone: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    role?: BackendRole;
    phone?: string | null;
    id?: string;
  }
}
