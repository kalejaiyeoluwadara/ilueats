"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MapPinIcon,
  CreditCardIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  LockClosedIcon,
  ArrowRightIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { CartItem } from "@/components/cart/CartItem";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useCart } from "@/hooks/useCart";
import { useCatalog } from "@/context/CatalogContext";
import { getMyOrders, getOrder } from "@/lib/api/orders";
import type { OrderSummary, OrderDetail } from "@/lib/api/orders";
import { formatPlacedAgo, orderStatusBadge } from "@/lib/ordersStore";
import { stepIndexForStatus } from "@/components/orders/OrderStatusStepper";
import { cn, formatPrice } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import type { OrderStatus } from "@/types";

const ONGOING_STATUSES: OrderSummary["status"][] = [
  "new",
  "preparing",
  "assigned",
  "out",
];

/** Text color for the status line under each card's stage strip. */
const STATUS_TEXT_COLOR: Record<OrderStatus, string> = {
  new: "text-[var(--color-primary)]",
  preparing: "text-amber-700",
  assigned: "text-violet-700",
  out: "text-sky-700",
  delivered: "text-[var(--color-success)]",
};

/** Four-segment strip mirroring the tracking timeline: placed → assigned → out → delivered. */
function StageStrip({ status }: { status: OrderStatus }) {
  const active = stepIndexForStatus(status);
  const delivered = status === "delivered";
  return (
    <div
      className="flex gap-1"
      role="img"
      aria-label={`Order stage: ${orderStatusBadge[status].label}`}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-[5px] flex-1 rounded-full",
            delivered
              ? "bg-[var(--color-success)]"
              : i < active
                ? "bg-[var(--color-primary)]"
                : i === active
                  ? "bg-[var(--color-primary)] motion-safe:animate-pulse"
                  : "bg-[var(--color-line)]"
          )}
        />
      ))}
    </div>
  );
}

type OrderTab = "cart" | "ongoing" | "completed";

export default function OrdersPage() {
  const { user, ready: authReady } = useAuth();
  const { error: toastError } = useToast();

  const {
    items: cartItems,
    count: cartCount,
    subtotal: cartSubtotal,
    storeSlug: cartStoreSlug,
    storeName: cartStoreName,
    updateQuantity: updateCartQuantity,
    removeItem: removeCartItem,
    clearCart,
  } = useCart();
  const { stores } = useCatalog();
  const cartStore = useMemo(
    () => (cartStoreSlug ? stores.find((s) => s.slug === cartStoreSlug) : undefined),
    [cartStoreSlug, stores]
  );
  const cartDeliveryFee = cartStore?.deliveryFee ?? 0;
  const cartMinOrder = cartStore?.minOrder ?? 0;
  const cartBelowMin = cartSubtotal < cartMinOrder;

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<OrderTab>("ongoing");

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [details, setDetails] = useState<
    Record<
      string,
      { loading: boolean; data?: OrderDetail; error?: string }
    >
  >({});

  const ongoingOrders = useMemo(
    () => orders.filter((o) => ONGOING_STATUSES.includes(o.status)),
    [orders]
  );
  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === "delivered"),
    [orders]
  );

  const TAB_CHIPS: { id: OrderTab; label: string; count: number }[] = [
    { id: "cart", label: "My Cart", count: cartCount },
    { id: "ongoing", label: "Ongoing", count: ongoingOrders.length },
    { id: "completed", label: "Completed", count: completedOrders.length },
  ];

  const visibleOrders = tab === "ongoing" ? ongoingOrders : tab === "completed" ? completedOrders : [];

  const [hasSetInitialTab, setHasSetInitialTab] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyOrders(1, 20);
      const items = res.items || [];
      setOrders(items);
      setHasSetInitialTab((already) => {
        if (already) return true;
        const hasOngoing = items.some((o) => ONGOING_STATUSES.includes(o.status));
        setTab(hasOngoing ? "ongoing" : items.length > 0 ? "completed" : "ongoing");
        return true;
      });
    } catch (err) {
      console.error(err);
      setError(
        err instanceof ApiError ? err.message : "Failed to load order history."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authReady) {
      if (user) {
        fetchOrders();
      } else {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user?.id, fetchOrders]);

  const loadOrderDetail = async (orderId: string) => {
    setDetails((prev) => ({
      ...prev,
      [orderId]: { loading: true },
    }));

    try {
      const res = await getOrder(orderId);
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
              className="rounded-3xl bg-white p-4 ring-1 ring-[var(--color-line)]"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 rounded-2xl bg-[var(--color-line)] skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 rounded bg-[var(--color-line)] skeleton" />
                  <div className="h-3 w-44 rounded bg-[var(--color-line)] skeleton" />
                </div>
                <div className="h-8 w-8 shrink-0 rounded-full bg-[var(--color-line)] skeleton" />
              </div>
              <div className="mt-3.5 flex gap-1">
                {Array.from({ length: 4 }).map((_, seg) => (
                  <div
                    key={seg}
                    className="h-[5px] flex-1 rounded-full bg-[var(--color-line)] skeleton"
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="h-3.5 w-24 rounded bg-[var(--color-line)] skeleton" />
                <div className="h-4 w-16 rounded bg-[var(--color-line)] skeleton" />
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
    <div className={cn("min-h-screen", tab === "cart" && cartCount > 0 ? "pb-40" : "pb-24")}>
      <Navbar variant="page" title="Your orders" showSearch={false} />
      <main className="mx-auto max-w-2xl px-4 pt-4">
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Filter orders"
        >
          {TAB_CHIPS.map((chip) => {
            const selected = tab === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(chip.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-bold transition-colors",
                  selected
                    ? "bg-[var(--color-ink)] text-white"
                    : "bg-white text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)] hover:bg-black/[0.03]"
                )}
              >
                {chip.id === "cart" && <ShoppingCartIcon className="h-3.5 w-3.5" />}
                {chip.label}
                <span
                  className={cn(
                    "min-w-[1.25rem] rounded-md px-1 py-0.5 text-center text-[11px] font-extrabold tabular-nums",
                    selected
                      ? "bg-white/20 text-white"
                      : "bg-[var(--color-bg)] text-[var(--color-ink-muted)]"
                  )}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="pt-4">
        {tab === "cart" ? (
          cartCount === 0 ? (
            <EmptyState
              icon={<ShoppingCartIcon className="h-6 w-6" />}
              title="Your cart is empty"
              description="Items you add from a store will show up here, ready for checkout."
              action={
                <Link href="/">
                  <Button size="lg">Browse stores</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                    {cartCount} item{cartCount === 1 ? "" : "s"}
                  </p>
                  <h2 className="font-display truncate text-[17px] font-bold tracking-tight text-[var(--color-ink)]">
                    {cartStoreName ?? cartStore?.name ?? "Your bag"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={clearCart}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold text-red-600 hover:bg-red-50"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  Clear
                </button>
              </div>

              <ul className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {cartItems.map((item) => (
                    <motion.li key={item.id} layout>
                      <CartItem
                        item={item}
                        onIncrement={() =>
                          updateCartQuantity(item.id, item.quantity + 1)
                        }
                        onDecrement={() =>
                          updateCartQuantity(item.id, item.quantity - 1)
                        }
                        onRemove={() => removeCartItem(item.id)}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          )
        ) : visibleOrders.length === 0 ? (
          orders.length === 0 ? (
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
            <EmptyState
              icon={<ClockIcon className="h-6 w-6" />}
              title={tab === "ongoing" ? "No ongoing orders" : "No completed orders yet"}
              description={
                tab === "ongoing"
                  ? "Orders you place will appear here until they're delivered."
                  : "Orders you've received will show up here."
              }
            />
          )
        ) : (
          <ul className="space-y-3">
            {visibleOrders.map((o) => {
              const isExpanded = expandedOrderId === o.id;
              const badge = orderStatusBadge[o.status];
              const detail = details[o.id];

              return (
                <li
                  key={o.id}
                  className="overflow-hidden rounded-3xl bg-white ring-1 ring-[var(--color-line)] transition-all hover:shadow-crisp"
                >
                  {/* Header summary info */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(o.id)}
                    className="block w-full p-4 text-left outline-none transition hover:bg-black/[0.01]"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f96e22] to-[#c43e04] font-display text-[16px] font-extrabold text-white">
                        {o.storeName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display truncate text-[15.5px] font-extrabold tracking-tight text-[var(--color-ink)]">
                          {o.storeName}
                        </h2>
                        <p className="mt-0.5 text-[12px] font-medium text-[var(--color-ink-muted)]">
                          <span className="font-mono font-bold text-[var(--color-ink-soft)]">
                            {o.id}
                          </span>
                          {" · "}
                          {formatPlacedAgo(o.placedAt)}
                        </p>
                      </div>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-ink-soft)]">
                        {isExpanded ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )}
                      </div>
                    </div>

                    <div className="mt-3.5">
                      <StageStrip status={o.status} />
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span
                          className={cn(
                            "flex items-center gap-1.5 text-[12px] font-bold",
                            STATUS_TEXT_COLOR[o.status]
                          )}
                        >
                          {badge.label}
                          {o.paymentStatus === "pending" && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-bold text-amber-700 ring-1 ring-inset ring-amber-200/80">
                              Payment pending
                            </span>
                          )}
                          {o.paymentStatus === "failed" && (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10.5px] font-bold text-red-700 ring-1 ring-inset ring-red-200/80">
                              Payment failed
                            </span>
                          )}
                        </span>
                        <span className="text-[14px] font-extrabold tabular-nums text-[var(--color-ink)]">
                          {formatPrice(o.total)}
                        </span>
                      </div>
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
                        <div className="space-y-3">
                          {/* Item lines */}
                          <div className="rounded-2xl bg-white p-3.5 ring-1 ring-[var(--color-line)]">
                            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
                              Your order
                            </p>
                            <ul className="divide-y divide-[var(--color-line)]/60">
                              {detail.data.lineItems.map((item, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start justify-between gap-3 py-2.5"
                                >
                                  <div className="flex min-w-0 gap-2.5">
                                    <span className="mt-px shrink-0 rounded-md bg-[var(--color-bg)] px-1.5 py-0.5 text-[11.5px] font-extrabold tabular-nums text-[var(--color-ink-muted)]">
                                      {item.qty}×
                                    </span>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-[var(--color-ink)]">
                                        {item.name}
                                      </p>
                                      {item.modifiers &&
                                        item.modifiers.length > 0 && (
                                          <p className="mt-0.5 text-[12px] text-[var(--color-ink-soft)]">
                                            {item.modifiers.join(" · ")}
                                          </p>
                                        )}
                                    </div>
                                  </div>
                                  <span className="shrink-0 font-bold tabular-nums text-[var(--color-ink)]">
                                    {formatPrice(item.unitPrice * item.qty)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Address / Delivery Details */}
                          <div className="flex items-start gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-[var(--color-line)]">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-bg)] text-[var(--color-ink-soft)]">
                              <MapPinIcon className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0 pt-0.5">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
                                Deliver to
                              </p>
                              <p className="mt-0.5 font-semibold leading-snug text-[var(--color-ink)]">
                                {detail.data.deliveryAddress}
                              </p>
                              <p className="mt-0.5 text-[12px] text-[var(--color-ink-soft)]">
                                {detail.data.customer} · {detail.data.customerPhone}
                              </p>
                            </div>
                          </div>

                          {/* Payment status / method */}
                          <div className="flex items-start gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-[var(--color-line)]">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-bg)] text-[var(--color-ink-soft)]">
                              <CreditCardIcon className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0 flex-1 pt-0.5">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
                                Payment
                              </p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-[var(--color-ink)]">
                                  {detail.data.paymentLabel}
                                </p>
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[10.5px] font-bold ring-1 ring-inset",
                                    detail.data.paymentStatus === "paid"
                                      ? "bg-[var(--color-success-soft)] text-[var(--color-success)] ring-emerald-200/80"
                                      : detail.data.paymentStatus === "failed"
                                        ? "bg-red-50 text-red-700 ring-red-200/80"
                                        : "bg-amber-50 text-amber-700 ring-amber-200/80"
                                  )}
                                >
                                  {detail.data.paymentStatus === "paid"
                                    ? "Paid"
                                    : detail.data.paymentStatus === "failed"
                                      ? "Failed"
                                      : "Pending"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Receipt / Pricing Breakdown */}
                          <div className="rounded-2xl bg-white p-3.5 ring-1 ring-[var(--color-line)] space-y-2">
                            <div className="flex justify-between text-[12.5px] text-[var(--color-ink-muted)]">
                              <span>Subtotal</span>
                              <span className="tabular-nums">
                                {formatPrice(detail.data.subtotal)}
                              </span>
                            </div>
                            <div className="flex justify-between text-[12.5px] text-[var(--color-ink-muted)]">
                              <span>Delivery</span>
                              <span className="tabular-nums">
                                {formatPrice(detail.data.deliveryFee)}
                              </span>
                            </div>
                            <div className="flex justify-between text-[12.5px] text-[var(--color-ink-muted)]">
                              <span>Service fee</span>
                              <span className="tabular-nums">
                                {formatPrice(detail.data.serviceFee)}
                              </span>
                            </div>
                            <div className="border-t border-[var(--color-line)] pt-2 flex justify-between font-extrabold text-[15px] text-[var(--color-ink)]">
                              <span>Total</span>
                              <span className="tabular-nums">
                                {formatPrice(detail.data.total)}
                              </span>
                            </div>
                          </div>

                          {/* Track order CTA */}
                          <Link href={`/orders/${o.id}`} className="block">
                            <Button
                              size="lg"
                              fullWidth
                              variant={o.status === "delivered" ? "outline" : "primary"}
                              rightIcon={<ArrowRightIcon className="h-4 w-4" />}
                            >
                              {o.status === "delivered"
                                ? "View order status"
                                : "Track order"}
                            </Button>
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        </div>
      </main>

      {tab === "cart" && cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-[68px] z-50 border-t border-[var(--color-line)] bg-white px-4 pb-3 pt-3 sm:bottom-[72px]">
          <div className="mx-auto max-w-2xl">
            {cartBelowMin && (
              <p className="mb-2 rounded-xl bg-[var(--color-accent-soft)] px-3 py-2 text-[12px] font-semibold text-[#8a4f00]">
                Add {formatPrice(cartMinOrder - cartSubtotal)} more to meet minimum order.
              </p>
            )}
            <Link href={cartBelowMin ? "/cart" : "/checkout"} className="block">
              <Button
                size="lg"
                fullWidth
                disabled={cartBelowMin}
                rightIcon={<ArrowRightIcon className="h-4 w-4" />}
              >
                Checkout · {formatPrice(cartSubtotal + cartDeliveryFee)}
              </Button>
            </Link>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
