"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";

/** Branded splash shown while the session resolves — no jarring status text. */
function ConsoleSplash() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-4"
      role="status"
      aria-label="Loading"
    >
      <span className="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[20px] font-extrabold tracking-tight text-white shadow-lg shadow-orange-950/20">
        IE
      </span>
    </div>
  );
}

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
    return <ConsoleSplash />;
  }

  if (!user || user.role !== role) {
    return null;
  }

  return <>{children}</>;
}
