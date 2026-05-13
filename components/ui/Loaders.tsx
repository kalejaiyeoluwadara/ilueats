"use client";

import { Oval } from "react-loader-spinner";
import { cn } from "@/lib/utils";

const BRAND = "#e8541a";
const BRAND_SOFT = "#fff1ea";
const INK = "#1a1a1a";
const MUTED_RING = "#ececec";

export type InlineLoaderSize = "xs" | "sm" | "md" | "lg";
/** Spinner colors for different surfaces (buttons, chips, etc.). */
export type InlineLoaderTone = "inverse" | "brand" | "ink";

const INLINE_DIM: Record<InlineLoaderSize, number> = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 22,
};

const TONE: Record<
  InlineLoaderTone,
  { color: string; secondaryColor: string }
> = {
  inverse: {
    color: "#ffffff",
    secondaryColor: "rgba(255,255,255,0.38)",
  },
  brand: {
    color: BRAND,
    secondaryColor: BRAND_SOFT,
  },
  ink: {
    color: INK,
    secondaryColor: MUTED_RING,
  },
};

export interface InlineLoaderProps {
  size?: InlineLoaderSize;
  tone?: InlineLoaderTone;
  className?: string;
  /** Accessible name; defaults to "Loading". */
  label?: string;
}

/** Compact spinner for buttons, chips, and tight UI. */
export function InlineLoader({
  size = "md",
  tone = "brand",
  className,
  label = "Loading",
}: InlineLoaderProps) {
  const d = INLINE_DIM[size];
  const { color, secondaryColor } = TONE[tone];
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      role="status"
    >
      <Oval
        height={d}
        width={d}
        color={color}
        secondaryColor={secondaryColor}
        strokeWidth={size === "xs" ? 2 : 2.5}
        ariaLabel={label}
      />
    </span>
  );
}

/** Maps `Button` variant to a spinner tone that reads on that background. */
export function buttonLoaderTone(
  variant:
    | "primary"
    | "secondary"
    | "ghost"
    | "outline"
    | "danger"
): InlineLoaderTone {
  if (
    variant === "primary" ||
    variant === "secondary" ||
    variant === "danger"
  ) {
    return "inverse";
  }
  if (variant === "outline") {
    return "brand";
  }
  return "ink";
}

/** Map `Button` `size` prop to `InlineLoader` size. */
export function buttonLoaderSize(
  size: "sm" | "md" | "lg"
): InlineLoaderSize {
  if (size === "sm") return "sm";
  if (size === "lg") return "lg";
  return "md";
}

export interface ContentLoaderProps {
  message?: string;
  /** Spinner size in px (default 36). */
  spinnerSize?: number;
  className?: string;
}

/** Centered block for cards and main columns (not full viewport). */
export function ContentLoader({
  message = "Loading…",
  spinnerSize = 36,
  className,
}: ContentLoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-8",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Oval
        height={spinnerSize}
        width={spinnerSize}
        color={BRAND}
        secondaryColor={BRAND_SOFT}
        strokeWidth={3}
        ariaLabel={message}
      />
      {message ? (
        <p className="max-w-xs text-center text-[14px] font-medium text-[var(--color-ink-muted)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export interface PageLoaderProps {
  message?: string;
  className?: string;
  /** Full viewport height (e.g. route gates). */
  fillScreen?: boolean;
  spinnerSize?: number;
}

/** Full-page or large-region loading state. */
export function PageLoader({
  message = "Loading…",
  className,
  fillScreen = true,
  spinnerSize = 44,
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 bg-[var(--color-bg)] px-4",
        fillScreen ? "min-h-screen" : "min-h-[40vh]",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Oval
        height={spinnerSize}
        width={spinnerSize}
        color={BRAND}
        secondaryColor={BRAND_SOFT}
        strokeWidth={3}
        ariaLabel={message}
      />
      <p className="text-[14px] font-medium text-[var(--color-ink-muted)]">
        {message}
      </p>
    </div>
  );
}
