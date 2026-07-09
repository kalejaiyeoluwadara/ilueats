"use client";

import { useEffect, useState } from "react";
import { MapPinIcon, TruckIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ErrorState } from "@/components/ui/EmptyState";
import {
  getAdminOrder,
  updateAdminOrderStatus,
  getAvailableRiders,
  assignRider,
} from "@/lib/api/orders";
import type { OrderDetail, AvailableRider } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { formatPlacedAgo, orderStatusBadge } from "@/lib/ordersStore";
import { cn, formatPrice } from "@/lib/utils";

interface AdminOrderDetailModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string | null;
  /** Called after the order's status/assignment changes, so the parent list can refetch. */
  onChanged?: () => void;
}

export function AdminOrderDetailModal({
  open,
  onClose,
  orderId,
  onChanged,
}: AdminOrderDetailModalProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [riders, setRiders] = useState<AvailableRider[]>([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState("");

  const loadOrder = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminOrder(id);
      setOrder(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && orderId) {
      loadOrder(orderId);
    } else {
      setOrder(null);
      setError(null);
    }
  }, [open, orderId]);

  useEffect(() => {
    if (order?.status === "preparing" && riders.length === 0 && !ridersLoading) {
      setRidersLoading(true);
      getAvailableRiders()
        .then(setRiders)
        .catch(() => setRiders([]))
        .finally(() => setRidersLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status]);

  const handleMarkPreparing = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      const updated = await updateAdminOrderStatus(order.id, "preparing");
      setOrder(updated);
      onChanged?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update order.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignRider = async () => {
    if (!order || !selectedRiderId) return;
    setActionLoading(true);
    try {
      const updated = await assignRider(order.id, selectedRiderId);
      setOrder(updated);
      setSelectedRiderId("");
      onChanged?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to assign rider.");
    } finally {
      setActionLoading(false);
    }
  };

  const badge = order ? orderStatusBadge[order.status] : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="sheet"
      className="sm:max-w-xl"
      title={order ? `Order ${order.id}` : undefined}
      description={
        order ? `${formatPlacedAgo(order.placedAt)} · ${order.paymentLabel}` : undefined
      }
      footer={
        <div className="flex gap-2">
          <Button type="button" variant="outline" fullWidth size="md" onClick={onClose}>
            Close
          </Button>
          {order?.status === "new" ? (
            <Button
              type="button"
              variant="primary"
              fullWidth
              size="md"
              loading={actionLoading}
              onClick={handleMarkPreparing}
            >
              Mark preparing
            </Button>
          ) : null}
          {order?.status === "preparing" ? (
            <Button
              type="button"
              variant="primary"
              fullWidth
              size="md"
              disabled={!selectedRiderId}
              loading={actionLoading}
              onClick={handleAssignRider}
            >
              Assign rider
            </Button>
          ) : null}
        </div>
      }
    >
      {loading ? (
        <div className="space-y-3 py-2">
          <div className="h-4 w-full rounded bg-[var(--color-line)] skeleton" />
          <div className="h-4 w-5/6 rounded bg-[var(--color-line)] skeleton" />
          <div className="h-4 w-2/3 rounded bg-[var(--color-line)] skeleton" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => orderId && loadOrder(orderId)} />
      ) : order && badge ? (
        <AdminOrderDetailBody
          order={order}
          statusClassName={badge.className}
          statusLabel={badge.label}
          riders={riders}
          ridersLoading={ridersLoading}
          selectedRiderId={selectedRiderId}
          onSelectRider={setSelectedRiderId}
        />
      ) : null}
    </Modal>
  );
}

function AdminOrderDetailBody({
  order,
  statusClassName,
  statusLabel,
  riders,
  ridersLoading,
  selectedRiderId,
  onSelectRider,
}: {
  order: OrderDetail;
  statusClassName: string;
  statusLabel: string;
  riders: AvailableRider[];
  ridersLoading: boolean;
  selectedRiderId: string;
  onSelectRider: (id: string) => void;
}) {
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
        </dl>
      </section>

      <section>
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Restaurant
        </h3>
        <div className="mt-2 flex gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/40 p-3">
          <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
          <div>
            <p className="text-[14px] font-bold text-[var(--color-ink)]">{order.storeName}</p>
            <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--color-ink-muted)]">
              {order.storeAddress}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Rider
        </h3>
        {order.rider ? (
          <div className="mt-2 flex items-center gap-2.5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/40 p-3">
            <TruckIcon className="h-4.5 w-4.5 shrink-0 text-[var(--color-primary)]" />
            <div>
              <p className="text-[14px] font-bold text-[var(--color-ink)]">{order.rider.name}</p>
              {order.rider.phone ? (
                <p className="mt-0.5 font-mono text-[12px] text-[var(--color-ink-muted)]">
                  {order.rider.phone}
                </p>
              ) : null}
            </div>
          </div>
        ) : order.status === "preparing" ? (
          <div className="mt-2">
            {ridersLoading ? (
              <p className="text-[12.5px] text-[var(--color-ink-muted)]">
                Loading available riders…
              </p>
            ) : riders.length === 0 ? (
              <p className="text-[12.5px] text-[var(--color-ink-muted)]">
                No riders are online right now.
              </p>
            ) : (
              <select
                value={selectedRiderId}
                onChange={(e) => onSelectRider(e.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--color-line)] bg-white px-3 text-[13px] font-medium text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]/35 focus:ring-2 focus:ring-[var(--color-primary)]/20"
              >
                <option value="">Select a rider…</option>
                {riders.map((r) => (
                  <option key={r.riderId} value={r.riderId}>
                    {r.name}
                    {r.vehicleType ? ` · ${r.vehicleType}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <p className="mt-2 text-[12.5px] text-[var(--color-ink-muted)]">
            Not yet assigned.
          </p>
        )}
      </section>

      <section>
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Basket
        </h3>
        <ul className="mt-2 divide-y divide-[var(--color-line)] rounded-2xl border border-[var(--color-line)] bg-white">
          {order.lineItems.map((line, idx) => {
            const lineTotal = line.qty * line.unitPrice;
            return (
              <li key={`${order.id}-line-${idx}`} className="px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[var(--color-ink)]">{line.name}</p>
                    {line.modifiers?.length ? (
                      <p className="mt-1 text-[12px] text-[var(--color-ink-muted)]">
                        {line.modifiers.join(" · ")}
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
          <TotalRow label="Items subtotal" value={formatPrice(order.subtotal)} />
          <TotalRow label="Delivery" value={formatPrice(order.deliveryFee)} />
          <TotalRow label="Platform &amp; handling" value={formatPrice(order.serviceFee)} />
          <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-2 text-[14px] font-extrabold text-[var(--color-ink)]">
            <span>Order total</span>
            <span className="tabular-nums">{formatPrice(order.total)}</span>
          </div>
        </dl>
      </section>
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
