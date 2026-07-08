"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  HomeIcon as HomeOutline,
  ShoppingBagIcon as BagOutline,
  ClockIcon as ClockOutline,
  UserIcon as UserOutline,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeSolid,
  ShoppingBagIcon as BagSolid,
  ClockIcon as ClockSolid,
  UserIcon as UserSolid,
} from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";

interface NavItem {
  href: string;
  label: string;
  Outline: React.ElementType;
  Solid: React.ElementType;
  matchPrefix?: string;
}

const items: NavItem[] = [
  { href: "/", label: "Home", Outline: HomeOutline, Solid: HomeSolid },
  {
    href: "/cart",
    label: "Cart",
    Outline: BagOutline,
    Solid: BagSolid,
    matchPrefix: "/cart",
  },
  {
    href: "/orders",
    label: "Orders",
    Outline: ClockOutline,
    Solid: ClockSolid,
    matchPrefix: "/orders",
  },
  {
    href: "/account",
    label: "Account",
    Outline: UserOutline,
    Solid: UserSolid,
    matchPrefix: "/account",
  },
];

const spring = { type: "spring", stiffness: 420, damping: 34 } as const;

export function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  // Hide bottom nav on checkout flow (focused page)
  if (pathname?.startsWith("/checkout")) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-3 z-40 px-4 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex w-fit items-center gap-1 rounded-full border border-[var(--color-line)] bg-white/90 p-1.5 shadow-[var(--shadow-lift)] backdrop-blur-xl">
        {items.map((it) => {
          const active = it.matchPrefix
            ? pathname?.startsWith(it.matchPrefix)
            : pathname === it.href;
          const Icon = active ? it.Solid : it.Outline;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-label={it.label}
                aria-current={active ? "page" : undefined}
                className="relative flex h-11 items-center gap-1.5 rounded-full px-4"
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-pill"
                    className="absolute inset-0 rounded-full bg-[var(--color-primary-soft)]"
                    transition={spring}
                  />
                )}
                <span className="relative">
                  <Icon
                    className={cn(
                      "h-[22px] w-[22px] transition-colors",
                      active
                        ? "text-[var(--color-primary)]"
                        : "text-[var(--color-ink-soft)]",
                    )}
                  />
                  {it.href === "/cart" && count > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[9px] font-bold text-white ring-2 ring-white">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </span>
                <AnimatePresence initial={false}>
                  {active && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={spring}
                      className="relative overflow-hidden whitespace-nowrap text-[12px] font-bold tracking-tight text-[var(--color-primary-dark)]"
                    >
                      {it.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
