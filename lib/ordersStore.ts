import { ORDERS_SEED } from "@/data/mockOrders.seed";
import { readLocalStorage, shortId, writeLocalStorage } from "@/lib/utils";
import type { Order, OrderLineItem, OrderStatus } from "@/types";

/**
 * Single source of truth for orders across the three surfaces:
 * checkout writes here, the admin board reads & advances status here,
 * and the rider console derives offers/jobs from the same rows.
 * Same external-store pattern as catalogStore (localStorage-persisted demo).
 */

const STORAGE_KEY = "ilueats:orders:v1";

export type OrdersSnapshot = {
  orders: Order[];
};

type Listener = () => void;
const listeners = new Set<Listener>();

function cloneSeedOrders(): Order[] {
  const now = Date.now();
  return ORDERS_SEED.map(({ placedMinsAgo, ...row }) => ({
    ...structuredClone(row),
    placedAt: new Date(now - placedMinsAgo * 60_000).toISOString(),
    source: "seed" as const,
  }));
}

/** Frozen snapshot for SSR / first client paint before hydration. */
const serverSnapshot: OrdersSnapshot = { orders: cloneSeedOrders() };

let snapshot: OrdersSnapshot =
  typeof window === "undefined" ? serverSnapshot : { orders: cloneSeedOrders() };

function notify() {
  for (const l of listeners) l();
}

function persist() {
  if (typeof window === "undefined") return;
  writeLocalStorage(STORAGE_KEY, snapshot);
}

function setSnapshot(next: OrdersSnapshot) {
  snapshot = next;
  notify();
  persist();
}

export function subscribeOrders(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getOrdersSnapshot(): OrdersSnapshot {
  return snapshot;
}

export function getOrdersServerSnapshot(): OrdersSnapshot {
  return serverSnapshot;
}

export function hydrateOrdersFromStorage() {
  if (typeof window === "undefined") return;
  const parsed = readLocalStorage<OrdersSnapshot | null>(STORAGE_KEY, null);
  if (parsed && Array.isArray(parsed.orders) && parsed.orders.length > 0) {
    setSnapshot({ orders: parsed.orders });
  }
}

export function resetOrdersToSeed() {
  setSnapshot({ orders: cloneSeedOrders() });
}

export type PlaceOrderInput = Omit<
  Order,
  "id" | "placedAt" | "status" | "source"
>;

/** Newest orders sit on top of the board. */
export function placeOrder(input: PlaceOrderInput): Order {
  const order: Order = {
    ...input,
    id: `ILU-${shortId().toUpperCase()}`,
    placedAt: new Date().toISOString(),
    status: "new",
    source: "app",
  };
  setSnapshot({ orders: [order, ...snapshot.orders] });
  return order;
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  const idx = snapshot.orders.findIndex((o) => o.id === orderId);
  if (idx < 0 || snapshot.orders[idx].status === status) return;
  const next = [...snapshot.orders];
  next[idx] = { ...next[idx], status };
  setSnapshot({ orders: next });
}

/* -------------------------------------------------------------------------- */
/* Pure helpers shared by the order UIs                                       */
/* -------------------------------------------------------------------------- */

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "new",
  "preparing",
  "assigned",
  "out",
  "delivered",
];

export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  const idx = ORDER_STATUS_FLOW.indexOf(status);
  if (idx < 0 || idx === ORDER_STATUS_FLOW.length - 1) return null;
  return ORDER_STATUS_FLOW[idx + 1];
}

export function orderLinesSubtotal(items: OrderLineItem[]): number {
  return items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
}

/** "Just now" / "8 min ago" / "3h ago" / "Yesterday" / "Mon 12 Jan". */
export function formatPlacedAgo(placedAt: string): string {
  const then = new Date(placedAt).getTime();
  if (!Number.isFinite(then)) return "—";
  const mins = Math.max(0, Math.floor((Date.now() - then) / 60_000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return "Yesterday";
  return new Date(placedAt).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export const orderStatusBadge: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  new: {
    label: "New",
    className:
      "bg-[var(--color-primary-soft)] text-[var(--color-primary)] ring-[var(--color-primary)]/20",
  },
  preparing: {
    label: "Preparing",
    className: "bg-amber-50 text-amber-800 ring-amber-200/80",
  },
  assigned: {
    label: "Rider assigned",
    className: "bg-violet-50 text-violet-800 ring-violet-200/80",
  },
  out: {
    label: "Out for delivery",
    className: "bg-sky-50 text-sky-800 ring-sky-200/80",
  },
  delivered: {
    label: "Delivered",
    className:
      "bg-[var(--color-success-soft)] text-[var(--color-success)] ring-emerald-200/80",
  },
};
