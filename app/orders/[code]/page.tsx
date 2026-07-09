"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  PhoneIcon,
  TruckIcon,
  MapPinIcon,
  LockClosedIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Loaders";
import { OrderStatusStepper } from "@/components/orders/OrderStatusStepper";
import { useAuth } from "@/hooks/useAuth";
import { getOrder } from "@/lib/api/orders";
import type { OrderDetail } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";

export default function OrderTrackingPage() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code).toUpperCase();
  const { user, ready: authReady } = useAuth();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOrder(code);
      setOrder(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load order.");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    if (authReady && user) fetchOrder();
    if (authReady && !user) setLoading(false);
  }, [authReady, user, fetchOrder]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && user) fetchOrder();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [user, fetchOrder]);

  if (!authReady || (loading && !order)) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <div className="min-h-screen pb-24">
        <Navbar variant="page" title={code} showSearch={false} />
        <main className="mx-auto flex max-w-md flex-col items-center px-6 pt-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/10">
            <LockClosedIcon className="h-9 w-9" />
          </div>
          <h1 className="font-display mt-6 text-[22px] font-extrabold tracking-tight text-[var(--color-ink)]">
            Sign in to track this order
          </h1>
          <Link href={`/account?redirect=/orders/${code}`} className="mt-6 w-full">
            <Button size="lg" fullWidth>
              Sign in / Register
            </Button>
          </Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen pb-24">
        <Navbar variant="page" title={code} showSearch={false} />
        <main className="mx-auto max-w-2xl px-4 pt-12">
          <ErrorState message={error ?? "Order not found."} onRetry={fetchOrder} />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <Navbar variant="page" title={order.id} showSearch={false} />
      <main className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
              {order.storeName}
            </p>
            <h1 className="font-display text-[17px] font-bold tracking-tight text-[var(--color-ink)]">
              Order {order.id}
            </h1>
          </div>
          <button
            type="button"
            onClick={fetchOrder}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-[var(--color-ink-muted)] ring-1 ring-inset ring-[var(--color-line)] hover:bg-black/[0.03]"
          >
            <ArrowPathIcon className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            Refresh
          </button>
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
          <OrderStatusStepper
            status={order.status}
            placedAt={order.placedAt}
            assignedAt={order.assignedAt}
            outForDeliveryAt={order.outForDeliveryAt}
            deliveredAt={order.deliveredAt}
          />
        </div>

        {order.rider && (
          <div className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <TruckIcon className="h-5.5 w-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
                Your rider
              </p>
              <p className="font-semibold text-[var(--color-ink)]">{order.rider.name}</p>
            </div>
            {order.rider.phone && (
              <a
                href={`tel:${order.rider.phone}`}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-white"
                aria-label={`Call ${order.rider.name}`}
              >
                <PhoneIcon className="h-4.5 w-4.5" />
              </a>
            )}
          </div>
        )}

        <div className="flex items-start gap-2.5 rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
          <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-ink-soft)]" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
              Deliver to
            </p>
            <p className="mt-0.5 font-semibold leading-snug text-[var(--color-ink)]">
              {order.deliveryAddress}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
            Items
          </p>
          <ul className="divide-y divide-[var(--color-line)]/50 text-[13.5px]">
            {order.lineItems.map((item, idx) => (
              <li key={idx} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--color-ink)]">
                    {item.qty} × {item.name}
                  </p>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <p className="mt-0.5 text-[12px] text-[var(--color-ink-soft)]">
                      {item.modifiers.join(" · ")}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-bold text-[var(--color-ink)]">
                  {formatPrice(item.unitPrice * item.qty)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-[var(--color-line)] pt-3 text-[15px] font-extrabold text-[var(--color-ink)]">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
