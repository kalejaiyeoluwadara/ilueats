"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BuildingStorefrontIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  PhotoIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
  TruckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const nav = [
  { href: "/admin", label: "Overview", icon: ChartPieIcon, end: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBagIcon },
  { href: "/admin/riders", label: "Riders", icon: TruckIcon },
  { href: "/admin/stores", label: "Stores", icon: BuildingStorefrontIcon },
  { href: "/admin/items", label: "Items", icon: Squares2X2Icon },
  { href: "/admin/banners", label: "Banners", icon: PhotoIcon },
  { href: "/admin/settings", label: "Settings", icon: Cog6ToothIcon },
] as const;

function AdminLogo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const isDark = variant === "dark";
  return (
    <Link
      href="/admin"
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
        isDark ? "text-white ring-offset-zinc-950" : "text-[var(--color-ink)] ring-offset-[var(--color-bg)]"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)] text-[14px] font-extrabold tracking-tight text-white",
          isDark && "shadow-lg shadow-orange-950/40"
        )}
      >
        IE
      </span>
      <div className="leading-tight">
        <p className="text-[13px] font-bold tracking-tight">IluEats</p>
        <p
          className={cn(
            "text-[11px] font-medium",
            isDark ? "text-zinc-400" : "text-[var(--color-ink-muted)]"
          )}
        >
          Admin
        </p>
      </div>
    </Link>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const onSignOut = async () => {
    await signOut();
    router.push("/admin/login");
  };

  const onSwitchToRider = async () => {
    await signOut();
    router.push("/rider/login");
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] lg:flex lg:min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 lg:flex">
        <div className="flex h-16 items-center border-b border-zinc-800 px-5">
          <AdminLogo />
        </div>
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
                    ? "bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    active ? "text-[var(--color-primary)]" : "text-zinc-500"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-800 p-3">
          <p className="px-3 pb-1.5 pt-2 text-[10.5px] font-bold uppercase tracking-wide text-zinc-600">
            Switch account
          </p>
          <button
            type="button"
            onClick={onSwitchToRider}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-200"
          >
            <TruckIcon className="h-5 w-5 text-zinc-500" />
            Rider console
          </button>

          <div className="my-2 h-px bg-zinc-800" />

          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-200"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 text-zinc-500" />
            Sign out
          </button>
          <Link
            href="/"
            className="mt-1 block rounded-xl px-3 py-2 text-center text-[12px] font-semibold text-zinc-500 hover:text-zinc-300"
          >
            ← Back to IluEats
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex min-h-screen min-w-0 flex-col lg:min-h-0 flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-bg)]/90 px-4 backdrop-blur-md lg:hidden">
          <AdminLogo variant="light" />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-700 hover:bg-black/5"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </header>

        {/* Mobile drawer */}
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
                className="ml-auto flex h-full w-[min(320px,92vw)] flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl"
              >
                <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
                  <span className="text-[13px] font-bold text-white">Menu</span>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 hover:bg-white/[0.06]"
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
                            ? "bg-white/[0.08] text-white"
                            : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            active
                              ? "text-[var(--color-primary)]"
                              : "text-zinc-500"
                          )}
                        />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="border-t border-zinc-800 p-3">
                  <p className="px-3 pb-1.5 pt-2 text-[10.5px] font-bold uppercase tracking-wide text-zinc-600">
                    Switch account
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      onSwitchToRider();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold text-zinc-400 hover:bg-white/[0.04]"
                  >
                    <TruckIcon className="h-5 w-5" />
                    Rider console
                  </button>

                  <div className="my-2 h-px bg-zinc-800" />

                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      onSignOut();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold text-zinc-400 hover:bg-white/[0.04]"
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
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
