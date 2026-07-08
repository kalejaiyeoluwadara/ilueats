"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRightOnRectangleIcon,
  BanknotesIcon,
  Bars3Icon,
  HomeModernIcon,
  MapPinIcon,
  TruckIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const nav = [
  { href: "/rider", label: "Today", icon: HomeModernIcon },
  { href: "/rider/deliveries", label: "Deliveries", icon: TruckIcon },
  { href: "/rider/earnings", label: "Earnings", icon: BanknotesIcon },
  { href: "/rider/profile", label: "Profile", icon: UserCircleIcon },
] as const;

function RiderLogo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const isDark = variant === "dark";
  return (
    <Link
      href="/rider"
      className={cn(
        "flex items-center gap-2.5 ml-4 rounded-xl px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
        isDark ? "text-white ring-offset-emerald-950" : "text-[var(--color-ink)] ring-offset-[var(--color-bg)]"
      )}
    >
      <div className="leading-tight">
        <p className="text-[13px] font-bold tracking-tight">IluEats</p>
        <p
          className={cn(
            "text-[11px] font-medium",
            isDark ? "text-emerald-400/90" : "text-[var(--color-ink-muted)]"
          )}
        >
          Rider
        </p>
      </div>
    </Link>
  );
}

export function RiderShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const onSignOut = async () => {
    await signOut();
    router.push("/rider/login");
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] lg:flex lg:min-h-screen w-full">
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-emerald-950 py-4 bg-emerald-950 lg:flex">
        <RiderLogo />
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => {
            const active = linkActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-colors",
                  active
                    ? "bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
                    : "text-emerald-200/80 hover:bg-white/[0.05] hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    active ? "text-emerald-300" : "text-emerald-500/90"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-emerald-900/80 p-3">
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-emerald-200/80 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 text-emerald-500/90" />
            Sign out
          </button>
          <Link
            href="/"
            className="mt-1 block rounded-xl px-3 py-2 text-center text-[12px] font-semibold text-emerald-400/80 hover:text-emerald-200"
          >
            ← Customer app
          </Link>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col lg:min-h-0 flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-bg)]/90 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-emerald-900 hover:bg-emerald-50"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </header>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
                onClick={(e) => e.stopPropagation()}
                className="ml-auto flex h-full w-[min(320px,92vw)] flex-col border-l border-emerald-900 bg-emerald-950 shadow-2xl"
              >
                <div className="flex h-14 items-center justify-between border-b border-emerald-900/80 px-4">
                  <span className="text-[13px] font-bold text-white">Menu</span>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-emerald-200 hover:bg-white/[0.06]"
                    aria-label="Close menu"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <nav className="flex flex-1 flex-col gap-1 p-3">
                  {nav.map((item) => {
                    const active = linkActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-semibold",
                          active
                            ? "bg-white/[0.1] text-white"
                            : "text-emerald-200/80 hover:bg-white/[0.05] hover:text-white"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            active ? "text-emerald-300" : "text-emerald-500/90"
                          )}
                        />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="border-t border-emerald-900/80 p-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      onSignOut();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold text-emerald-200/80 hover:bg-white/[0.05]"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    Sign out
                  </button>
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-2xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
