"use client";

import { formatPrice } from "@/lib/utils";

interface CartSummaryProps {
  subtotal: number;
  deliveryFee: number;
  serviceFee?: number;
  discount?: number;
  className?: string;
}

export function CartSummary({
  subtotal,
  deliveryFee,
  serviceFee = 0,
  discount = 0,
  className,
}: CartSummaryProps) {
  const total = Math.max(0, subtotal + deliveryFee + serviceFee - discount);

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
        <Row label="Delivery fee" value={formatPrice(deliveryFee)} />
        {serviceFee > 0 && (
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
      <div className="mt-3 flex items-center justify-between border-t border-[var(--color-line)] pt-3">
        <span className="text-[15px] font-extrabold tracking-tight text-[var(--color-ink)]">
          Total
        </span>
        <span className="font-display text-[19px] font-extrabold tracking-tight text-[var(--color-primary)]">
          {formatPrice(total)}
        </span>
      </div>
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
