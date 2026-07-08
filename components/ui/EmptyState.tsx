import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { InboxIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

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

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/** Reusable "couldn't load" card for failed API fetches. */
export function ErrorState({
  message = "Something went wrong. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "rounded-[1.35rem] border border-red-200 bg-red-50/60 p-6 text-center",
        className
      )}
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <ExclamationTriangleIcon className="h-6 w-6" />
      </div>
      <h3 className="text-[15px] font-extrabold tracking-tight text-red-800">
        Couldn&apos;t load this
      </h3>
      <p className="mt-1.5 text-[13px] text-red-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-red-600 px-4 text-[13px] font-bold text-white transition hover:bg-red-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}

