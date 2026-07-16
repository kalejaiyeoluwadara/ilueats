"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  PhoneIcon,
  MapPinIcon,
  LockClosedIcon,
  ArrowPathIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/EmptyState";
import { OrderStatusStepper } from "@/components/orders/OrderStatusStepper";
import { useAuth } from "@/hooks/useAuth";
import { getOrder } from "@/lib/api/orders";
import type { OrderDetail } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { cn, formatPrice } from "@/lib/utils";

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? full;
}

function heroCopy(order: OrderDetail): { headline: string; sub: string } {
  const rider = order.rider ? firstName(order.rider.name) : null;
  switch (order.status) {
    case "new":
      return {
        headline: "We've got your order",
        sub: `${order.storeName} will start on it shortly.`,
      };
    case "preparing":
      return {
        headline: "Your food is being made",
        sub: `Fresh from ${order.storeName}'s kitchen.`,
      };
    case "assigned":
      return {
        headline: rider ? `${rider} has your order` : "A rider has your order",
        sub: `Picking it up from ${order.storeName} now.`,
      };
    case "out":
      return {
        headline: "On its way to you",
        sub: rider
          ? `${rider} is riding over — hang tight.`
          : "Your rider is heading your way.",
      };
    case "delivered":
      return {
        headline: "Delivered. Enjoy!",
        sub: `Thanks for ordering from ${order.storeName}.`,
      };
    default:
      return { headline: "Tracking your order", sub: order.storeName };
  }
}

export default function OrderTrackingPage() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code).toUpperCase();
  const { user, ready: authReady } = useAuth();
  const reduceMotion = useReducedMotion();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await getOrder(code);
        setOrder(res);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Failed to load order."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [code]
  );

  useEffect(() => {
    if (authReady && user) fetchOrder();
    if (authReady && !user) setLoading(false);
    // Key on user?.id (a stable string), not the user object: apiFetch's
    // getSession() broadcasts a session event that hands back a new user
    // identity each call, which would otherwise re-trigger this effect forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user?.id, fetchOrder]);

  useEffect(() => {
    if (!user) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchOrder(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, fetchOrder]);

  const reveal = (i: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.06 * i, duration: 0.35, ease: "easeOut" as const },
        };

  if (!authReady || (loading && !order)) {
    return (
      <div className="min-h-screen pb-24">
        <Navbar variant="page" title="Track order" showSearch={false} />
        <main className="mx-auto max-w-2xl space-y-4 px-4 pt-5">
          <TrackingSkeleton />
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pb-24">
        <Navbar variant="page" title="Track order" showSearch={false} />
        <main className="mx-auto flex max-w-md flex-col items-center px-6 pt-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/10">
            <LockClosedIcon className="h-9 w-9" />
          </div>
          <h1 className="font-display mt-6 text-[22px] font-extrabold tracking-tight text-[var(--color-ink)]">
            Sign in to track this order
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-ink-muted)]">
            Order {code} is waiting — sign in to see where it is.
          </p>
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
        <Navbar variant="page" title="Track order" showSearch={false} />
        <main className="mx-auto max-w-2xl px-4 pt-12">
          <ErrorState
            variant="page"
            title="This order didn't load"
            message={error ?? "No order matches that code. Check it and try again."}
            onRetry={() => fetchOrder()}
            action={
              <Link
                href="/orders"
                className="text-[13px] font-semibold text-[var(--color-ink-muted)] underline underline-offset-4 transition-colors hover:text-[var(--color-ink)]"
              >
                See all your orders
              </Link>
            }
          />
        </main>
        <BottomNav />
      </div>
    );
  }

  const hero = heroCopy(order);
  const [etaMin, etaMax] = order.estimatedDeliveryWindow ?? [];
  const showEta = order.status !== "delivered" && etaMin != null && etaMax != null;

  return (
    <div className="min-h-screen pb-24">
      <Navbar variant="page" title="Track order" showSearch={false} />
      <main className="mx-auto max-w-2xl space-y-4 px-4 pt-5">
        {/* Hero: the status, in plain words */}
        <motion.header {...reveal(0)} className="px-1">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[11.5px] font-bold tracking-wider text-[var(--color-ink-soft)]">
              ORDER {order.id}
            </p>
            <button
              type="button"
              onClick={() => fetchOrder(true)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-[var(--color-ink-muted)] ring-1 ring-inset ring-[var(--color-line)] transition hover:bg-black/[0.03]"
            >
              <ArrowPathIcon
                className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
              />
              Refresh
            </button>
          </div>
          <h1 className="font-display mt-2 text-[26px] font-extrabold leading-[1.1] tracking-tight text-[var(--color-ink)] sm:text-[30px]">
            {hero.headline}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <p className="text-[13.5px] text-[var(--color-ink-muted)]">
              {hero.sub}
            </p>
            {showEta && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-[11.5px] font-bold text-[#8a4f00]">
                <ClockIcon className="h-3.5 w-3.5" />
                {etaMin}–{etaMax} min
              </span>
            )}
          </div>
        </motion.header>

        {/* Timeline */}
        <motion.div
          {...reveal(1)}
          className="rounded-3xl bg-white p-5 pt-6 ring-1 ring-[var(--color-line)]"
        >
          <OrderStatusStepper
            status={order.status}
            placedAt={order.placedAt}
            assignedAt={order.assignedAt}
            outForDeliveryAt={order.outForDeliveryAt}
            deliveredAt={order.deliveredAt}
            riderName={order.rider ? firstName(order.rider.name) : null}
            storeName={order.storeName}
          />
        </motion.div>

        {/* Rider */}
        {order.rider && (
          <motion.div
            {...reveal(2)}
            className="flex items-center gap-3.5 rounded-3xl bg-white p-4 ring-1 ring-[var(--color-line)]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f96e22] to-[#c43e04] font-display text-[16px] font-extrabold text-white">
              {firstName(order.rider.name).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
                Your rider
              </p>
              <p className="truncate text-[15px] font-bold text-[var(--color-ink)]">
                {order.rider.name}
              </p>
            </div>
            {order.rider.phone && (
              <a
                href={`tel:${order.rider.phone}`}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 text-[13px] font-bold text-white transition hover:bg-black"
                aria-label={`Call ${order.rider.name}`}
              >
                <PhoneIcon className="h-4 w-4" />
                Call
              </a>
            )}
          </motion.div>
        )}

        {/* Delivery address */}
        <motion.div
          {...reveal(3)}
          className="flex items-start gap-3 rounded-3xl bg-white p-4 ring-1 ring-[var(--color-line)]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-bg)] text-[var(--color-ink-soft)]">
            <MapPinIcon className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
              Deliver to
            </p>
            <p className="mt-0.5 text-[13.5px] font-semibold leading-snug text-[var(--color-ink)]">
              {order.deliveryAddress}
            </p>
          </div>
        </motion.div>

        {/* Items */}
        <motion.div
          {...reveal(4)}
          className="rounded-3xl bg-white p-4 ring-1 ring-[var(--color-line)]"
        >
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
            Your order · {order.storeName}
          </p>
          <ul className="divide-y divide-[var(--color-line)]/60 text-[13.5px]">
            {order.lineItems.map((item, idx) => (
              <li key={idx} className="flex items-start justify-between gap-3 py-2.5">
                <div className="flex min-w-0 gap-2.5">
                  <span className="mt-px shrink-0 rounded-md bg-[var(--color-bg)] px-1.5 py-0.5 text-[11.5px] font-extrabold tabular-nums text-[var(--color-ink-muted)]">
                    {item.qty}×
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--color-ink)]">{item.name}</p>
                    {item.modifiers && item.modifiers.length > 0 && (
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
          <div className="mt-2 space-y-1.5 border-t border-[var(--color-line)] pt-3 text-[12.5px] text-[var(--color-ink-muted)]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="tabular-nums">{formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service fee</span>
              <span className="tabular-nums">{formatPrice(order.serviceFee)}</span>
            </div>
            <div className="flex justify-between pt-1.5 text-[15px] font-extrabold text-[var(--color-ink)]">
              <span>Total</span>
              <span className="tabular-nums">{formatPrice(order.total)}</span>
            </div>
          </div>
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
}

/** Mirrors the loaded layout: hero lines, timeline rows, rider strip, items card. */
function TrackingSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading order">
      {/* Hero */}
      <div className="space-y-2.5 px-1 pt-1">
        <div className="h-3.5 w-32 rounded bg-[var(--color-line)] skeleton" />
        <div className="h-8 w-3/4 rounded-lg bg-[var(--color-line)] skeleton" />
        <div className="h-4 w-1/2 rounded bg-[var(--color-line)] skeleton" />
      </div>

      {/* Timeline card */}
      <div className="rounded-3xl bg-white p-5 pt-6 ring-1 ring-[var(--color-line)]">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className={idx < 3 ? "flex gap-4 pb-8" : "flex gap-4"}>
            <div className="h-11 w-11 shrink-0 rounded-2xl bg-[var(--color-line)] skeleton" />
            <div className="flex-1 space-y-2 pt-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="h-4 w-32 rounded bg-[var(--color-line)] skeleton" />
                <div className="h-3 w-14 rounded bg-[var(--color-line)] skeleton" />
              </div>
              <div className="h-3 w-40 rounded bg-[var(--color-line)] skeleton" />
            </div>
          </div>
        ))}
      </div>

      {/* Rider strip */}
      <div className="flex items-center gap-3.5 rounded-3xl bg-white p-4 ring-1 ring-[var(--color-line)]">
        <div className="h-12 w-12 shrink-0 rounded-2xl bg-[var(--color-line)] skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-16 rounded bg-[var(--color-line)] skeleton" />
          <div className="h-4 w-28 rounded bg-[var(--color-line)] skeleton" />
        </div>
        <div className="h-11 w-20 rounded-full bg-[var(--color-line)] skeleton" />
      </div>

      {/* Items card */}
      <div className="space-y-3 rounded-3xl bg-white p-4 ring-1 ring-[var(--color-line)]">
        <div className="h-3 w-36 rounded bg-[var(--color-line)] skeleton" />
        {Array.from({ length: 2 }).map((_, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <div className="h-4 w-1/2 rounded bg-[var(--color-line)] skeleton" />
            <div className="h-4 w-14 rounded bg-[var(--color-line)] skeleton" />
          </div>
        ))}
        <div className="h-5 w-full rounded bg-[var(--color-line)] skeleton" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
