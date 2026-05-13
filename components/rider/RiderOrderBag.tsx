"use client";

import type { RiderOrderLineItem } from "@/types";
import { riderBagPieceCount } from "@/lib/riderOrderBag";
import { cn } from "@/lib/utils";

export function RiderOrderBagSummary({
  items,
  className,
}: {
  items: readonly RiderOrderLineItem[];
  className?: string;
}) {
  if (items.length === 0) return null;

  const pieces = riderBagPieceCount(items);
  const preview = items
    .slice(0, 2)
    .map((line) =>
      line.qty > 1 ? `${line.name} ×${line.qty}` : line.name
    )
    .join(" · ");

  const moreLines = items.length > 2 ? items.length - 2 : 0;

  return (
    <div className={cn("text-[12px] leading-snug", className)}>
      <p className="font-bold text-emerald-900">{pieces} items in bag</p>
      {preview ? (
        <p className="mt-0.5 text-[11px] font-medium text-[var(--color-ink-muted)]">
          {preview}
          {moreLines > 0
            ? ` · +${moreLines} line${moreLines === 1 ? "" : "s"}`
            : null}
        </p>
      ) : null}
    </div>
  );
}

export function RiderOrderBagDetails({
  items,
  caption,
}: {
  items: readonly RiderOrderLineItem[];
  caption?: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-[13px] font-medium text-[var(--color-ink-muted)]">
        No line items listed for this run — confirm with the store.
      </p>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
        What to pick up / hand over
      </p>
      {caption ? (
        <p className="mt-1 text-[12px] text-[var(--color-ink-muted)]">{caption}</p>
      ) : null}
      <ul className="mt-2 divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)]/50">
        {items.map((line, idx) => (
          <li key={`${line.name}-${idx}`} className="px-3 py-2.5">
            <p className="text-[13px] font-bold text-[var(--color-ink)]">
              {line.name}
              <span className="ml-1.5 font-extrabold tabular-nums text-emerald-800">
                ×{line.qty}
              </span>
            </p>
            {line.modifiers?.length ? (
              <p className="mt-1 text-[12px] font-medium leading-snug text-[var(--color-ink-muted)]">
                {line.modifiers.join(" · ")}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] font-medium text-[var(--color-ink-soft)]">
        Match stickers and receipts to these lines before pickup and drop-off.
      </p>
    </div>
  );
}
