"use client";

import { useCallback, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  InboxIcon,
  ArrowPathIcon,
  SignalSlashIcon,
} from "@heroicons/react/24/outline";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Reusable "nothing here" card — home, store menu, search, admin lists. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const displayIcon = icon ?? <InboxIcon className="h-6 w-6" />;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.35rem] border border-[var(--color-line)] bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-bg)] p-6 text-center shadow-crisp",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[var(--color-primary)]/[0.07] blur-2xl"
        aria-hidden
      />
      <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-[inset_0_1px_0_rgb(255_255_255/0.65)] ring-1 ring-[var(--color-primary)]/10">
        {displayIcon}
      </div>
      <h3 className="relative text-[16px] font-extrabold tracking-tight text-[var(--color-ink)]">
        {title}
      </h3>
      {description && (
        <p className="relative mt-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
          {description}
        </p>
      )}
      {action && <div className="relative mt-4">{action}</div>}
    </div>
  );
}

export type ErrorStateVariant = "page" | "card" | "inline";

export interface ErrorStateProps {
  /** What failed, in the user's words. Keep it short — the message explains. */
  title?: string;
  /** One line on what happened and what to do. Never repeat the title here. */
  message?: string;
  /** Wire this whenever the caller has a refetch — retrying beats reloading. */
  onRetry?: () => void | Promise<unknown>;
  retryLabel?: string;
  /** A second way forward when retrying may not be the answer. */
  action?: ReactNode;
  icon?: ReactNode;
  /** `page` centres in the viewport, `card` sits in a section, `inline` is a row. */
  variant?: ErrorStateVariant;
  className?: string;
}

/**
 * Failed-fetch state. Deliberately not alarm-red: a menu that didn't load is
 * not a destructive event, and the brand's red is reserved for actions that
 * delete things. Reads as warm clay on paper, same family as EmptyState.
 */
export function ErrorState({
  title = "That didn't load",
  message = "The connection dropped on the way. Try again.",
  onRetry,
  retryLabel = "Try again",
  action,
  icon,
  variant = "card",
  className,
}: ErrorStateProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  }, [onRetry, retrying]);

  const displayIcon = icon ?? <SignalSlashIcon className="h-6 w-6" />;

  if (variant === "inline") {
    return (
      <div
        role="alert"
        className={cn(
          "flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-3 text-left",
          className
        )}
      >
        <span
          className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]"
          aria-hidden
        >
          <SignalSlashIcon className="h-4 w-4" />
        </span>
        <p className="min-w-0 flex-1 text-[13px] leading-snug text-[var(--color-ink-muted)]">
          <span className="font-semibold text-[var(--color-ink)]">{title}.</span>{" "}
          {message}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="flex-none rounded-full px-2.5 py-1.5 text-[13px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/50 disabled:opacity-60"
          >
            {retrying ? "Retrying…" : retryLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        variant === "page" && "flex min-h-[60vh] items-center justify-center",
        className
      )}
    >
      <div
        role="alert"
        className="relative mx-auto w-full max-w-sm overflow-hidden rounded-[1.35rem] border border-[var(--color-line)] bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-bg)] p-6 text-center shadow-crisp"
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[var(--color-primary)]/[0.07] blur-2xl"
          aria-hidden
        />

        {/* The dashed ring turns while the request is back in flight — the one
            moving part, and it only moves when something is actually happening. */}
        <div className="relative mx-auto mb-4 h-14 w-14">
          <span
            className={cn(
              "absolute inset-0 rounded-2xl border border-dashed border-[var(--color-primary)]/35",
              retrying && "animate-[spin_2.4s_linear_infinite]"
            )}
            aria-hidden
          />
          <div className="absolute inset-[3px] flex items-center justify-center rounded-[0.85rem] bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)] shadow-[inset_0_1px_0_rgb(255_255_255/0.65)]">
            {displayIcon}
          </div>
        </div>

        <h3 className="font-display relative text-[16px] font-extrabold tracking-tight text-[var(--color-ink)]">
          {title}
        </h3>
        <p className="relative mx-auto mt-2 max-w-[36ch] text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
          {message}
        </p>

        {(onRetry || action) && (
          <div className="relative mt-5 flex flex-col items-center gap-2.5">
            {onRetry && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={retrying}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[var(--color-ink)] px-4 text-[13px] font-bold text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:opacity-60"
              >
                <ArrowPathIcon
                  className={cn(
                    "h-4 w-4",
                    retrying && "animate-[spin_0.9s_linear_infinite]"
                  )}
                  aria-hidden
                />
                {retrying ? "Retrying…" : retryLabel}
              </button>
            )}
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
