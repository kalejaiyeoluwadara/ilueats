"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  motion,
  useReducedMotion,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import {
  ArrowLeftIcon,
  MapPinIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useSearch } from "@/context/SearchContext";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();

  const isHome = variant === "home";
  const isCartPage = pathname === "/cart" || pathname === "/checkout";

  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));

  useEffect(() => {
    if (!showSearch) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSearch, openSearch]);

  const enter = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: -10 },
          animate: { opacity: 1, y: 0 },
          transition: {
            delay,
            type: "spring" as const,
            stiffness: 380,
            damping: 30,
          },
        };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full backdrop-blur-md transition-[background-color,box-shadow,border-color] duration-300",
        "border-b bg-[var(--color-bg)]/80 supports-[backdrop-filter]:bg-[var(--color-bg)]/65",
        scrolled
          ? "border-[var(--color-line)] shadow-[0_12px_32px_-20px_rgb(35_21_18/0.35)] supports-[backdrop-filter]:bg-[var(--color-bg)]/80"
          : "border-transparent",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-2xl items-center gap-3 px-4 transition-[height] duration-300 lg:max-w-6xl lg:px-6",
          scrolled ? "h-12 lg:h-14" : "h-14 lg:h-16"
        )}
      >
        {isHome ? (
          <motion.div {...enter(0)}>
            <Link
              href="/"
              className="group flex items-center gap-2"
              aria-label="IluEats home"
            >
              <Logo />
            </Link>
          </motion.div>
        ) : (
          <motion.button
            {...enter(0)}
            type="button"
            onClick={() => (onBack ? onBack() : router.back())}
            aria-label="Go back"
            whileTap={reduceMotion ? undefined : { scale: 0.92, x: -2 }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-ink)] transition-colors hover:bg-black/5 active:bg-black/10"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </motion.button>
        )}

        {!isHome && title && (
          <motion.h1
            {...enter(0.05)}
            className="font-display flex-1 truncate text-[15.5px] font-bold tracking-tight"
          >
            {title}
          </motion.h1>
        )}

        {isHome && (
          <motion.div {...enter(0.06)} className="flex flex-1 items-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)]/70 py-1.5 pl-2 pr-3 text-[12px] font-medium text-[var(--color-ink-muted)] ring-1 ring-inset ring-[var(--color-primary)]/10">
              <motion.span
                initial={
                  reduceMotion ? undefined : { y: -8, scale: 0.5, opacity: 0 }
                }
                animate={{ y: 0, scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.25,
                  type: "spring",
                  stiffness: 460,
                  damping: 14,
                }}
              >
                <MapPinIcon className="h-4 w-4 text-[var(--color-primary)]" />
              </motion.span>
              <span className="hidden sm:inline">Delivering to </span>
              <span className="font-bold text-[var(--color-ink)]">Ilisan</span>
            </span>
          </motion.div>
        )}

        <motion.nav
          {...enter(0.1)}
          aria-label="Primary"
          className="hidden items-center gap-1 lg:flex"
        >
          {desktopLinks.map((l) => {
            const isAccount = l.href === "/account";
            const showEllipse = isAccount && user;
            const active =
              l.href === "/" ? pathname === "/" : pathname?.startsWith(l.href);

            const initial = user?.name
              ? user.name.trim().charAt(0).toUpperCase()
              : "U";

            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center justify-center rounded-full tracking-tight transition-colors",
                  showEllipse
                    ? "p-0.5"
                    : "px-3.5 py-2 text-[13.5px] font-semibold",
                  active
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-ink-muted)] hover:bg-black/5 hover:text-[var(--color-ink)]"
                )}
              >
                {active && !showEllipse && (
                  <motion.span
                    layoutId="topnav-active-pill"
                    className="absolute inset-0 rounded-full bg-[var(--color-primary-soft)]"
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 34 }
                    }
                  />
                )}
                {showEllipse ? (
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-[12.5px] font-extrabold text-white shadow-sm ring-2 transition-transform hover:scale-105",
                      active ? "ring-[var(--color-primary)]/30" : "ring-white/10"
                    )}
                    title={user?.name || "Account"}
                  >
                    {initial}
                  </span>
                ) : (
                  <span className="relative z-10">{l.label}</span>
                )}
              </Link>
            );
          })}
        </motion.nav>

        {showSearch && (
          <motion.div {...enter(0.14)}>
            <motion.button
              type="button"
              onClick={() => openSearch()}
              aria-label="Open search"
              initial="rest"
              animate="rest"
              whileHover={reduceMotion ? undefined : "hover"}
              whileTap={reduceMotion ? undefined : { scale: 0.94 }}
              className="group flex h-10 items-center justify-center gap-2 rounded-full px-2.5 text-[var(--color-ink)] shadow-[0_1px_0_rgb(0_0_0/0.04)] ring-1 ring-[var(--color-line)] transition-colors hover:bg-[var(--color-surface)] hover:ring-[var(--color-primary)]/25 lg:px-3.5"
            >
              <SearchGlyph className="h-5 w-5" />
              <span className="hidden text-[13px] font-semibold text-[var(--color-ink-muted)] transition-colors group-hover:text-[var(--color-ink)] lg:inline">
                Search
              </span>
              <kbd className="hidden items-center gap-0.5 rounded-md bg-black/[0.045] px-1.5 py-0.5 font-sans text-[10.5px] font-semibold text-[var(--color-ink-soft)] lg:flex">
                ⌘K
              </kbd>
            </motion.button>
          </motion.div>
        )}

        {!isCartPage && (
          <motion.div {...enter(0.18)}>
            <Link
              href="/cart"
              aria-label={`Cart, ${count} items`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-ink)] transition-colors hover:bg-black/5 active:bg-black/10"
            >
              <motion.div
                key={bump}
                initial={
                  reduceMotion ? undefined : { scale: 0.6, rotate: -8 }
                }
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 480, damping: 18 }}
              >
                <ShoppingBagIcon className="h-5 w-5" />
              </motion.div>
              {count > 0 && (
                <motion.span
                  key={`badge-${count}`}
                  initial={reduceMotion ? undefined : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-white ring-2 ring-[var(--color-bg)]"
                >
                  {count > 99 ? "99+" : count}
                </motion.span>
              )}
            </Link>
          </motion.div>
        )}
      </div>
    </header>
  );
}

/**
 * Hand-drawn search glyph. On hover (driven by the parent button's
 * "rest"/"hover" variants) the lens redraws itself and a glint sweeps
 * across it — a quick "re-scan" moment.
 */
function SearchGlyph({ className }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      variants={{
        rest: { rotate: 0 },
        hover: { rotate: -8 },
      }}
      transition={{ type: "spring", stiffness: 320, damping: 16 }}
    >
      {/* Lens — starts at the handle joint so the redraw sweeps around */}
      <motion.circle
        cx="10.8"
        cy="10.8"
        r="6.3"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        transform="rotate(45 10.8 10.8)"
        variants={{
          rest: { pathLength: 1 },
          hover: { pathLength: [0.15, 1] },
        }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />
      {/* Handle */}
      <motion.path
        d="M15.6 15.6 L20.2 20.2"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        variants={{
          rest: { pathLength: 1 },
          hover: { pathLength: [0.4, 1] },
        }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
      />
      {/* Glint inside the lens */}
      <motion.path
        d="M7.9 9.6 a4 4 0 0 1 2.2-2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        variants={{
          rest: { opacity: 0.35, pathLength: 1 },
          hover: { opacity: [0, 1], pathLength: [0, 1] },
        }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.2 }}
      />
    </motion.svg>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="font-display text-[19px] font-extrabold leading-none tracking-tight">
        ìlú<span className="text-[var(--color-primary)]">Eats</span>
        <span className="inline-block text-[var(--color-primary)] transition-transform duration-300 group-hover:-translate-y-0.5">
          .
        </span>
      </span>
    </div>
  );
}
