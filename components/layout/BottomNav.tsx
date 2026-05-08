"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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

export function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  // Hide bottom nav on checkout flow (focused page)
  if (pathname?.startsWith("/checkout")) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-4 px-2">
        {items.map((it) => {
          const active = it.matchPrefix
            ? pathname?.startsWith(it.matchPrefix)
            : pathname === it.href;
          const Icon = active ? it.Solid : it.Outline;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className="relative flex flex-col items-center gap-0.5 py-2.5"
                aria-current={active ? "page" : undefined}
              >
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
                <span
                  className={cn(
                    "text-[10.5px] font-semibold tracking-tight transition-colors",
                    active
                      ? "text-[var(--color-primary)]"
                      : "text-[var(--color-ink-soft)]",
                  )}
                >
                  {it.label}
                </span>
                {active && (
                  <motion.span
                    layoutId="bottom-nav-indicator"
                    className="absolute -top-px h-0.5 w-7 rounded-full bg-[var(--color-primary)]"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
