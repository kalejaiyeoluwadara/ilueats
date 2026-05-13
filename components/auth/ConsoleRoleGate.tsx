"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/ui/Loaders";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";

export function ConsoleRoleGate({
  role,
  loginHref,
  children,
}: {
  role: UserRole;
  loginHref: string;
  children: React.ReactNode;
}) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user || user.role !== role) {
      router.replace(loginHref);
    }
  }, [ready, user, role, loginHref, router]);

  if (!ready) {
    return <PageLoader message="Checking your session…" />;
  }

  if (!user || user.role !== role) {
    return null;
  }

  return <>{children}</>;
}
