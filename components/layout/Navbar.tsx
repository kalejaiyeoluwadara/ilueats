"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useSearch } from "@/context/SearchContext";

const desktopLinks = [
  { href: "/", label: "Home" },
  { href: "/orders", label: "Orders" },
  { href: "/favorites", label: "Favourites" },
  { href: "/account", label: "Account" },
];

interface NavbarProps {
  variant?: "home" | "page";
  title?: string;
  showSearch?: boolean;
  className?: string;
  /** Override the back button behavior */
  onBack?: () => void;
}

export function Navbar({
  variant = "home",
  title,
  showSearch = true,
  className,
  onBack,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { count, bump } = useCart();
  const { openSearch } = useSearch();

  const isHome = variant === "home";
  const isCartPage = pathname === "/cart" || pathname === "/checkout";

  return (
    <header
        className={cn(
          "sticky top-0 z-40 w-full border-b border-transparent bg-[var(--color-bg)]/85 backdrop-blur-md",
          "supports-[backdrop-filter]:bg-[var(--color-bg)]/70",
          className
        )}
      >
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4 lg:h-16 lg:max-w-6xl lg:px-6">
          {isHome ? (
            <Link
              href="/"
              className="flex items-center gap-2"
              aria-label="IluEats home"
            >
              <Logo />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => (onBack ? onBack() : router.back())}
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-ink)] hover:bg-black/5 active:bg-black/10"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
          )}

          {!isHome && title && (
            <h1 className="font-display flex-1 truncate text-[15.5px] font-bold tracking-tight">
              {title}
            </h1>
          )}

          {isHome && (
            <div className="flex flex-1 items-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)]/70 px-2.5 py-1.5 text-[12px] font-medium text-[var(--color-ink-muted)]">
                <MapPinIcon className="h-4 w-4 text-[var(--color-primary)]" />
                <span className="hidden sm:inline">Delivering to </span>
                <span className="font-bold text-[var(--color-ink)]">Ilisan</span>
              </span>
            </div>
          )}

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 lg:flex"
          >
            {desktopLinks.map((l) => {
              const active =
                l.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-[13.5px] font-semibold tracking-tight transition-colors",
                    active
                      ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                      : "text-[var(--color-ink-muted)] hover:bg-black/5 hover:text-[var(--color-ink)]"
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {showSearch && (
            <button
              type="button"
              onClick={() => openSearch()}
              aria-label="Open search"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-ink)] shadow-[0_1px_0_rgb(0_0_0/0.04)] ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-surface)] hover:ring-[var(--color-primary)]/20 active:scale-[0.97]"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          )}

          {!isCartPage && (
            <Link
              href="/cart"
              aria-label={`Cart, ${count} items`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-ink)] hover:bg-black/5 active:bg-black/10"
            >
              <motion.div
                key={bump}
                initial={{ scale: 0.6, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 480, damping: 18 }}
              >
                <ShoppingBagIcon className="h-5 w-5" />
              </motion.div>
              {count > 0 && (
                <motion.span
                  key={`badge-${count}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-white ring-2 ring-[var(--color-bg)]"
                >
                  {count > 99 ? "99+" : count}
                </motion.span>
              )}
            </Link>
          )}
        </div>
      </header>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="font-display text-[19px] font-extrabold leading-none tracking-tight">
        ìlú<span className="text-[var(--color-primary)]">Eats</span>
        <span className="text-[var(--color-primary)]">.</span>
      </span>
    </div>
  );
}
