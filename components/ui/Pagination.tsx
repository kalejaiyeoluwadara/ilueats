"use client";

import type { ButtonHTMLAttributes } from "react";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import {
  clampPage,
  getPageRangeSummary,
  normalizePageIndicators,
} from "@/lib/pagination";

export interface PaginationProps {
  /** 1-based */
  page: number;
  pageCount: number;
  onPageChange: (nextPage: number) => void;
  totalItems: number;
  pageSize: number;
  /** Hide when everything fits on one page (or zero items). Default true. */
  hideWhenSinglePage?: boolean;
  className?: string;
  summaryClassName?: string;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  totalItems,
  pageSize,
  hideWhenSinglePage = true,
  className,
  summaryClassName,
}: PaginationProps) {
  const pc = Math.max(1, Math.floor(pageCount));
  const safePage = clampPage(page, pc);

  const rangeLabel = getPageRangeSummary(safePage, pageSize, totalItems);

  if (totalItems <= 0) {
    return (
      <p
        className={cn(
          "text-[12px] font-semibold text-[var(--color-ink-muted)]",
          summaryClassName
        )}
      >
        No results to show.
      </p>
    );
  }

  const isMultiPage = pc > 1 && totalItems > pageSize;

  if (!isMultiPage && hideWhenSinglePage) {
    return (
      <p
        className={cn(
          "text-[12px] font-semibold tabular-nums text-[var(--color-ink-muted)]",
          summaryClassName
        )}
      >
        Showing{" "}
        <span className="text-[var(--color-ink)]">{rangeLabel}</span>
      </p>
    );
  }

  const indicators =
    pc <= 1
      ? [1]
      : normalizePageIndicators(safePage, pc);
  const canPrev = safePage > 1;
  const canNext = safePage < pc;

  return (
    <nav
      className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}
      aria-label="Pagination"
    >
      <p
        className={cn(
          "text-[12px] font-semibold tabular-nums text-[var(--color-ink-muted)]",
          summaryClassName
        )}
      >
        Showing <span className="text-[var(--color-ink)]">{rangeLabel}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <PaginationNavButton
          aria-label="Previous page"
          disabled={!canPrev}
          onClick={() => canPrev && onPageChange(safePage - 1)}
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </PaginationNavButton>

        <ul className="flex flex-wrap items-center gap-1.5">
          {indicators.map((item, idx) =>
            item === "ellipsis" ? (
              <li
                key={`e-${idx}`}
                className="flex min-w-[1.75rem] items-center justify-center px-0.5 text-[12px] font-bold text-[var(--color-ink-soft)]"
                aria-hidden
              >
                …
              </li>
            ) : (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => onPageChange(item)}
                  aria-label={`Go to page ${item}`}
                  aria-current={item === safePage ? "page" : undefined}
                  className={cn(
                    "flex min-h-9 min-w-9 items-center justify-center rounded-full text-[13px] font-bold tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
                    item === safePage
                      ? "bg-[var(--color-ink)] text-white"
                      : "bg-white text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)] hover:bg-black/[0.03]"
                  )}
                >
                  {item}
                </button>
              </li>
            )
          )}
        </ul>

        <PaginationNavButton
          aria-label="Next page"
          disabled={!canNext}
          onClick={() => canNext && onPageChange(safePage + 1)}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRightIcon className="h-4 w-4" />
        </PaginationNavButton>
      </div>
    </nav>
  );
}

function PaginationNavButton({
  disabled,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex h-9 items-center gap-1 rounded-full px-3 text-[12px] font-bold outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        "bg-white text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)] hover:bg-black/[0.03]",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
