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
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
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
          <h1 className="flex-1 truncate text-[15px] font-bold tracking-tight">
            {title}
          </h1>
        )}

        {isHome && (
          <div className="flex flex-1 items-center gap-1.5 text-[12px] font-medium text-[var(--color-ink-muted)]">
            <MapPinIcon className="h-4 w-4 text-[var(--color-primary)]" />
            <span>
              Delivering to{" "}
              <span className="font-bold text-[var(--color-ink)]">Ilisan</span>
            </span>
          </div>
        )}

        {showSearch && isHome && (
          <Link
            href="/"
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-ink)] hover:bg-black/5 active:bg-black/10"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </Link>
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
      <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[#c0392b] text-white shadow-[0_3px_10px_rgba(232,84,26,0.4)]">
        <span className="text-[14px] font-extrabold leading-none">il</span>
        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--color-accent)] ring-2 ring-[var(--color-bg)]" />
      </span>
      <span className="text-[17px] font-extrabold tracking-tight">
        ilu<span className="text-[var(--color-primary)]">Eats</span>
      </span>
    </div>
  );
}
