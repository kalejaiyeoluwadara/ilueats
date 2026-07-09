"use client";

import Link from "next/link";
import { PlusIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { formatPrice } from "@/lib/utils";

type WalletCardProps = {
  balance: number | null | undefined;
  ready: boolean;
  href?: string;
  className?: string;
};

/**
 * Wallet balance tile shown on the account page. The surface is the ìlúEats
 * palm-oil gradient dressed with a faint adire (Yorùbá resist-dye) motif so it
 * reads as "ours" rather than a generic card.
 */
export function WalletCard({
  balance,
  ready,
  href = "/wallet",
  className,
}: WalletCardProps) {
  return (
    <Link
      href={href}
      aria-label="Open wallet"
      className={cx(
        "group relative isolate mt-3 flex flex-col overflow-hidden rounded-2xl p-4 text-white",
        "bg-[linear-gradient(135deg,#f96e22_0%,#e64e0e_52%,#c43e04_100%)]",
        "shadow-[0_10px_30px_-12px_rgba(196,62,4,0.55)] ring-1 ring-black/[0.04]",
        "transition-transform duration-200 active:scale-[0.99]",
        className,
      )}
    >
      <AdirePattern className="pointer-events-none absolute inset-0 -z-10 text-white opacity-[0.13]" />
      {/* Warm sheen so the flat gradient gets some depth */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 -z-10 h-32 w-32 rounded-full bg-white/20 blur-2xl"
      />

      {/* Header row — brand + manage */}
      <span className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/25 backdrop-blur-sm">
          <WalletMarkIcon className="h-6 w-6" />
        </span>
        <span className="text-[13px] font-extrabold tracking-tight">
          ìlúEats wallet
        </span>
        <span className="ml-auto flex items-center gap-0.5 rounded-full bg-white/15 py-1 pl-3 pr-2 text-[12px] font-bold text-white ring-1 ring-inset ring-white/20 transition-colors group-hover:bg-white/25">
          Manage
          <ChevronRightIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
      </span>

      {/* Balance */}
      <span className="mt-4 flex items-end justify-between gap-3">
        <span className="min-w-0">
          {ready ? (
            <span className="font-display block text-[28px] font-extrabold leading-none tracking-tight tabular-nums">
              {formatPrice(balance ?? 0)}
            </span>
          ) : (
            <span className="block h-7 w-28 rounded bg-white/25 skeleton" />
          )}
          <span className="mt-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
            Current balance
          </span>
        </span>

        <span className="flex flex-none items-center gap-1 rounded-full bg-white px-3.5 py-2 text-[12.5px] font-bold text-[var(--color-primary)] shadow-sm transition-transform duration-200 group-hover:scale-[1.03]">
          <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
          Top up
        </span>
      </span>
    </Link>
  );
}

/** Local class joiner — keeps the component dependency-free. */
function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Custom wallet mark: a billfold with a rounded flap and a coin-slot clasp.
 * Drawn on a 24px grid, inherits currentColor, and reads better at small sizes
 * than the stock heroicon.
 */
function WalletMarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {/* Wallet body */}
      <path d="M3.75 8.25A2.25 2.25 0 0 1 6 6h11.25a1.75 1.75 0 0 1 1.75 1.75V9" />
      <rect x="3.75" y="8.25" width="16.5" height="11" rx="2.5" />
      {/* Fold line hinting at the billfold */}
      <path d="M3.75 12.25h9.5" className="opacity-70" />
      {/* Card-slot / clasp pocket */}
      <path d="M20.25 12.25h-3.4a1.65 1.65 0 0 0 0 3.3h3.4a.75.75 0 0 0 .75-.75v-1.8a.75.75 0 0 0-.75-.75Z" />
      <circle cx="17.6" cy="13.9" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Seamless adire-inspired tile: concentric-circle rosettes (an "oníkọ̀kọ̀"-style
 * dotted motif) linked by fine cross strokes. Rendered as a faint white overlay.
 */
function AdirePattern({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      aria-hidden
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="adire-rosette"
          x="0"
          y="0"
          width="56"
          height="56"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(0)"
        >
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            {/* Rosette at each corner + centre so tiles knit together */}
            <circle cx="28" cy="28" r="10" />
            <circle cx="28" cy="28" r="5" />
            <circle cx="28" cy="28" r="1.6" fill="currentColor" stroke="none" />

            {/* Connecting dashes toward neighbours */}
            <path d="M28 4v8M28 44v8M4 28h8M44 28h8" strokeLinecap="round" />

            {/* Corner dot clusters (the wrapped-and-dyed spots of adire eléko) */}
            <circle cx="0" cy="0" r="2.4" />
            <circle cx="56" cy="0" r="2.4" />
            <circle cx="0" cy="56" r="2.4" />
            <circle cx="56" cy="56" r="2.4" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#adire-rosette)" />
    </svg>
  );
}
