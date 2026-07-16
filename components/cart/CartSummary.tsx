"use client";

import { formatPrice } from "@/lib/utils";

interface CartSummaryProps {
  subtotal: number;
  /** `null` when the fee isn't known yet (no address/quote) — shown as pending. */
  deliveryFee?: number | null;
  serviceFee?: number | null;
  discount?: number;
  /**
   * The authoritative total from the backend quote. Always pass this when a
   * quote exists: fees are the backend's to decide, and re-deriving the total
   * here is how the displayed price drifts from the charged one.
   */
  total?: number | null;
  className?: string;
}

export function CartSummary({
  subtotal,
  deliveryFee = null,
  serviceFee = null,
  discount = 0,
  total = null,
  className,
}: CartSummaryProps) {
  const pending = deliveryFee === null;

  return (
    <div
      className={`rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)] ${
        className ?? ""
      }`}
    >
      <h3 className="text-[13px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
        Order summary
      </h3>
      <dl className="mt-2 space-y-1.5 text-[13.5px]">
        <Row label="Subtotal" value={formatPrice(subtotal)} />
        {!pending && (
          <Row label="Delivery fee" value={formatPrice(deliveryFee)} />
        )}
        {serviceFee !== null && serviceFee > 0 && (
          <Row label="Service fee" value={formatPrice(serviceFee)} />
        )}
        {discount > 0 && (
          <Row
            label="Discount"
            value={`− ${formatPrice(discount)}`}
            tone="success"
          />
        )}
      </dl>
      {/* No total until the fees behind it are known — a "total" that later
          grows by a delivery fee is worse than no total at all. */}
      {total !== null ? (
        <div className="mt-3 flex items-center justify-between border-t border-[var(--color-line)] pt-3">
          <span className="text-[15px] font-extrabold tracking-tight text-[var(--color-ink)]">
            Total
          </span>
          <span className="font-display text-[19px] font-extrabold tracking-tight text-[var(--color-primary)]">
            {formatPrice(total)}
          </span>
        </div>
      ) : (
        <p className="mt-3 border-t border-[var(--color-line)] pt-3 text-[12px] text-[var(--color-ink-muted)]">
          Delivery and fees are calculated at checkout, once we know where
          you&apos;re sending it.
        </p>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success";
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[var(--color-ink-muted)]">{label}</dt>
      <dd
        className={`font-semibold ${
          tone === "success"
            ? "text-[var(--color-success)]"
            : "text-[var(--color-ink)]"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
