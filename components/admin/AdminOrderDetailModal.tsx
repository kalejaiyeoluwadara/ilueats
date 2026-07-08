"use client";

import { MapPinIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useOrders } from "@/context/OrdersContext";
import {
  formatPlacedAgo,
  nextOrderStatus,
  orderLinesSubtotal,
  orderStatusBadge,
} from "@/lib/ordersStore";
import { cn, formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

interface AdminOrderDetailModalProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
}

export function AdminOrderDetailModal({
  open,
  onClose,
  order,
}: AdminOrderDetailModalProps) {
  const { updateOrderStatus } = useOrders();
  const badge = order != null ? orderStatusBadge[order.status] : null;
  const next = order ? nextOrderStatus(order.status) : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="sheet"
      className="sm:max-w-xl"
      title={order ? `Order ${order.id}` : undefined}
      description={
        order
          ? `${formatPlacedAgo(order.placedAt)} · ${order.paymentLabel}`
          : undefined
      }
      footer={
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            fullWidth
            size="md"
            onClick={onClose}
          >
            Close
          </Button>
          {order && next ? (
            <Button
              type="button"
              variant="primary"
              fullWidth
              size="md"
              onClick={() => updateOrderStatus(order.id, next)}
            >
              Mark {orderStatusBadge[next].label.toLowerCase()}
            </Button>
          ) : null}
        </div>
      }
    >
      {order && badge ? (
        <AdminOrderDetailBody
          order={order}
          statusClassName={badge.className}
          statusLabel={badge.label}
        />
      ) : null}
    </Modal>
  );
}

function AdminOrderDetailBody({
  order,
  statusClassName,
  statusLabel,
}: {
  order: Order;
  statusClassName: string;
  statusLabel: string;
}) {
  const subtotal = orderLinesSubtotal(order.lineItems);
  const variance =
    order.total - subtotal - order.deliveryFee - order.serviceFee;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset",
            statusClassName
          )}
        >
          {statusLabel}
        </span>
      </div>

      <section>
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Customer &amp; drop-off
        </h3>
        <dl className="mt-2 space-y-2 text-[13px]">
          <DetailRow label="Name" value={order.customer} />
          <DetailRow label="Phone" value={order.customerPhone} mono />
          <DetailRow label="Address" value={order.deliveryAddress} />
          {order.deliveryNote ? (
            <DetailRow label="Rider note" value={order.deliveryNote} />
          ) : null}
        </dl>
      </section>

      <section>
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Restaurant
        </h3>
        <div className="mt-2 flex gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/40 p-3">
          <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
          <div>
            <p className="text-[14px] font-bold text-[var(--color-ink)]">
              {order.store}
            </p>
            <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--color-ink-muted)]">
              {order.storeAddress}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Basket
        </h3>
        <ul className="mt-2 divide-y divide-[var(--color-line)] rounded-2xl border border-[var(--color-line)] bg-white">
          {order.lineItems.map((line, idx) => {
            const lineTotal = line.qty * line.unitPrice;
            return (
              <li
                key={`${order.id}-line-${idx}`}
                className="px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[var(--color-ink)]">
                      {line.name}
                    </p>
                    {line.modifiers?.length ? (
                      <p className="mt-1 text-[12px] text-[var(--color-ink-muted)]">
                        {line.modifiers.join(" · ")}
                      </p>
                    ) : null}
                    {line.notes ? (
                      <p className="mt-1 text-[12px] italic text-[var(--color-ink-muted)]">
                        “{line.notes}”
                      </p>
                    ) : null}
                    <p className="mt-1 text-[11px] font-semibold text-[var(--color-ink-soft)]">
                      {line.qty} × {formatPrice(line.unitPrice)}
                    </p>
                  </div>
                  <p className="shrink-0 text-[13px] font-bold tabular-nums text-[var(--color-ink)]">
                    {formatPrice(lineTotal)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/50 p-4">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Totals
        </h3>
        <dl className="mt-3 space-y-2">
          <TotalRow label="Items subtotal" value={formatPrice(subtotal)} />
          <TotalRow label="Delivery" value={formatPrice(order.deliveryFee)} />
          <TotalRow
            label="Platform &amp; handling"
            value={formatPrice(order.serviceFee)}
          />
          {variance !== 0 ? (
            <TotalRow label="Adjustments" value={formatPrice(variance)} muted />
          ) : null}
          <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-2 text-[14px] font-extrabold text-[var(--color-ink)]">
            <span>Order total</span>
            <span className="tabular-nums">{formatPrice(order.total)}</span>
          </div>
        </dl>
      </section>

      <p className="text-[11px] font-medium leading-relaxed text-[var(--color-ink-soft)]">
        {order.source === "app"
          ? "Placed live from the storefront checkout in this browser."
          : "Demo board row — place an order in the storefront to see it appear here."}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="w-24 shrink-0 text-[var(--color-ink-soft)]">{label}</dt>
      <dd
        className={cn(
          "min-w-0 font-semibold text-[var(--color-ink)]",
          mono && "font-mono text-[12px]"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function TotalRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between text-[13px] font-semibold tabular-nums",
        muted ? "text-[var(--color-ink-muted)]" : "text-[var(--color-ink)]"
      )}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
