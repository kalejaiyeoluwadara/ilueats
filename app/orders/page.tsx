"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MapPinIcon,
  CreditCardIcon,
  ShoppingBagIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { getMyOrders, getOrder } from "@/lib/api/orders";
import { formatPlacedAgo, orderStatusBadge } from "@/lib/ordersStore";
import { formatPrice } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";

interface OrderSummary {
  id: string;
  status: "new" | "preparing" | "out" | "delivered";
  paymentStatus: "pending" | "paid" | "failed" | "not_applicable";
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  storeName: string;
  placedAt: string;
}

interface OrderDetailLineItem {
  name: string;
  qty: number;
  unitPrice: number;
  modifiers?: string[];
}

interface OrderDetail {
  id: string;
  status: string;
  storeId: string;
  storeSlug: string;
  storeName: string;
  storeAddress: string;
  customer: string;
  customerPhone: string;
  deliveryAddress: string;
  paymentLabel: string;
  paymentStatus: string;
  paymentReference?: string;
  lineItems: OrderDetailLineItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  placedAt: string;
}

export default function OrdersPage() {
  const { user, ready: authReady } = useAuth();
  const { error: toastError } = useToast();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [details, setDetails] = useState<
    Record<
      string,
      { loading: boolean; data?: OrderDetail; error?: string }
    >
  >({});

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = (await getMyOrders(1, 20)) as { items: OrderSummary[] };
      setOrders(res.items || []);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof ApiError ? err.message : "Failed to load order history."
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authReady) {
      if (user) {
        fetchOrders();
      } else {
        setLoading(false);
      }
    }
  }, [authReady, user, fetchOrders]);

  const loadOrderDetail = async (orderId: string) => {
    setDetails((prev) => ({
      ...prev,
      [orderId]: { loading: true },
    }));

    try {
      const res = (await getOrder(orderId)) as OrderDetail;
      setDetails((prev) => ({
        ...prev,
        [orderId]: { loading: false, data: res },
      }));
    } catch (err) {
      console.error(err);
      const errMsg =
        err instanceof ApiError
          ? err.message
          : "Failed to load order details.";
      setDetails((prev) => ({
        ...prev,
        [orderId]: { loading: false, error: errMsg },
      }));
      toastError("Could not load details", errMsg);
    }
  };

  const toggleExpand = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      if (!details[orderId] || details[orderId].error) {
        loadOrderDetail(orderId);
      }
    }
  };

  if (!authReady || (loading && orders.length === 0)) {
    return (
      <div className="min-h-screen pb-24">
        <Navbar variant="page" title="Your orders" showSearch={false} />
        <main className="mx-auto max-w-2xl px-4 pt-4 space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)] space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-40 rounded bg-[var(--color-line)] skeleton" />
                <div className="h-4.5 w-16 rounded-full bg-[var(--color-line)] skeleton" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 w-24 rounded bg-[var(--color-line)] skeleton" />
                <div className="h-4 w-12 rounded bg-[var(--color-line)] skeleton" />
              </div>
            </div>
          ))}
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pb-24">
        <Navbar variant="page" title="Your orders" showSearch={false} />
        <main className="mx-auto flex max-w-md flex-col items-center px-6 pt-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/10 animate-pulse">
            <LockClosedIcon className="h-9 w-9" />
          </div>
          <h1 className="font-display mt-6 text-[22px] font-extrabold tracking-tight text-[var(--color-ink)]">
            Sign in to view orders
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-ink-muted)]">
            Log in to view your complete order tracking, details, and order history.
          </p>
          <Link href="/account?redirect=/orders" className="mt-6 w-full">
            <Button size="lg" fullWidth>
              Sign in / Register
            </Button>
          </Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pb-24">
        <Navbar variant="page" title="Your orders" showSearch={false} />
        <main className="mx-auto max-w-2xl px-4 pt-12">
          <ErrorState message={error} onRetry={fetchOrders} />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <Navbar variant="page" title="Your orders" showSearch={false} />
      <main className="mx-auto max-w-2xl px-4 pt-4">
        {orders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBagIcon className="h-6 w-6" />}
            title="No orders yet"
            description="All your active and previous orders will appear here. Place your first order to get started!"
            action={
              <Link href="/">
                <Button size="lg">Explore stores</Button>
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => {
              const isExpanded = expandedOrderId === o.id;
              const badge = orderStatusBadge[o.status];
              const detail = details[o.id];

              return (
                <li
                  key={o.id}
                  className="overflow-hidden rounded-2xl bg-white ring-1 ring-[var(--color-line)] transition-all hover:shadow-crisp"
                >
                  {/* Header summary info */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(o.id)}
                    className="flex w-full items-start justify-between p-4 text-left outline-none transition hover:bg-black/[0.01]"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[15px] font-extrabold tracking-tight text-[var(--color-ink)]">
                          {o.storeName}
                        </h2>
                        <span className="font-mono text-[11px] font-bold text-[var(--color-ink-soft)] bg-[var(--color-bg)] px-2 py-0.5 rounded-md">
                          {o.id}
                        </span>
                      </div>
                      <p className="mt-1 text-[12.5px] font-medium text-[var(--color-ink-muted)]">
                        {formatPrice(o.total)} · {formatPlacedAgo(o.placedAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      {isExpanded ? (
                        <ChevronUpIcon className="h-4.5 w-4.5 text-[var(--color-ink-soft)]" />
                      ) : (
                        <ChevronDownIcon className="h-4.5 w-4.5 text-[var(--color-ink-soft)]" />
                      )}
                    </div>
                  </button>

                  {/* Expanded detail section */}
                  {isExpanded && (
                    <div className="border-t border-[var(--color-line)] bg-[var(--color-bg)]/20 p-4 space-y-4 text-[13.5px]">
                      {detail?.loading ? (
                        <div className="space-y-3 py-2">
                          <div className="h-4 w-full rounded bg-[var(--color-line)] skeleton" />
                          <div className="h-4 w-5/6 rounded bg-[var(--color-line)] skeleton" />
                          <div className="h-4 w-2/3 rounded bg-[var(--color-line)] skeleton" />
                        </div>
                      ) : detail?.error ? (
                        <div className="text-center py-2 space-y-2">
                          <p className="text-red-600 text-[13px]">
                            {detail.error}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loadOrderDetail(o.id)}
                          >
                            Retry loading details
                          </Button>
                        </div>
                      ) : detail?.data ? (
                        <div className="space-y-4">
                          {/* Item lines */}
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-2">
                              Items Ordered
                            </p>
                            <ul className="divide-y divide-[var(--color-line)]/50 rounded-xl bg-white px-3.5 py-2 ring-1 ring-[var(--color-line)]">
                              {detail.data.lineItems.map((item, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start justify-between py-2 gap-3"
                                >
                                  <div className="min-w-0">
                                    <p className="font-semibold text-[var(--color-ink)]">
                                      {item.qty} × {item.name}
                                    </p>
                                    {item.modifiers &&
                                      item.modifiers.length > 0 && (
                                        <p className="text-[12px] text-[var(--color-ink-soft)] mt-0.5">
                                          {item.modifiers.join(" · ")}
                                        </p>
                                      )}
                                  </div>
                                  <span className="font-bold shrink-0 text-[var(--color-ink)]">
                                    {formatPrice(item.unitPrice * item.qty)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Address / Delivery Details */}
                          <div className="flex items-start gap-2.5 rounded-xl bg-white p-3 ring-1 ring-[var(--color-line)]">
                            <MapPinIcon className="h-5 w-5 text-[var(--color-ink-soft)] mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
                                Deliver to
                              </p>
                              <p className="font-semibold mt-0.5 text-[var(--color-ink)] leading-snug">
                                {detail.data.deliveryAddress}
                              </p>
                              <p className="text-[12px] text-[var(--color-ink-soft)] mt-0.5">
                                Contact: {detail.data.customer} ({detail.data.customerPhone})
                              </p>
                            </div>
                          </div>

                          {/* Payment status / method */}
                          <div className="flex items-start gap-2.5 rounded-xl bg-white p-3 ring-1 ring-[var(--color-line)]">
                            <CreditCardIcon className="h-5 w-5 text-[var(--color-ink-soft)] mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
                                Payment Method
                              </p>
                              <p className="font-semibold mt-0.5 text-[var(--color-ink)]">
                                {detail.data.paymentLabel}
                              </p>
                              <p className="text-[12px] text-[var(--color-ink-soft)] mt-0.5 flex items-center gap-1.5">
                                Status:{" "}
                                <span
                                  className={`font-bold ${
                                    detail.data.paymentStatus === "paid"
                                      ? "text-emerald-600"
                                      : detail.data.paymentStatus === "failed"
                                      ? "text-red-600"
                                      : "text-amber-600"
                                  }`}
                                >
                                  {detail.data.paymentStatus.toUpperCase()}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Receipt / Pricing Breakdown */}
                          <div className="rounded-xl bg-white p-3.5 ring-1 ring-[var(--color-line)] space-y-2.5">
                            <div className="flex justify-between text-[13px] text-[var(--color-ink-soft)]">
                              <span>Subtotal</span>
                              <span className="font-medium">
                                {formatPrice(detail.data.subtotal)}
                              </span>
                            </div>
                            <div className="flex justify-between text-[13px] text-[var(--color-ink-soft)]">
                              <span>Delivery Fee</span>
                              <span className="font-medium">
                                {formatPrice(detail.data.deliveryFee)}
                              </span>
                            </div>
                            <div className="flex justify-between text-[13px] text-[var(--color-ink-soft)]">
                              <span>Service Fee</span>
                              <span className="font-medium">
                                {formatPrice(detail.data.serviceFee)}
                              </span>
                            </div>
                            <div className="border-t border-[var(--color-line)] pt-2.5 flex justify-between font-extrabold text-[15px] text-[var(--color-ink)]">
                              <span>Total</span>
                              <span>{formatPrice(detail.data.total)}</span>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
