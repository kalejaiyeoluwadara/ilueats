"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type {
  Order,
  RiderJob,
  RiderJobStatus,
  RiderOffer,
  RiderOrderLineItem,
} from "@/types";
import { useOrders } from "@/context/OrdersContext";
import { readLocalStorage, writeLocalStorage } from "@/lib/utils";

/**
 * Rider console derives everything from the shared orders store:
 * - Offers  = open orders (new/preparing) nobody has accepted yet.
 * - Jobs    = orders this rider accepted; job stage follows order status.
 * Accepting / picking up / delivering writes the status back, so the admin
 * board and the rider screen always agree.
 */

const STORAGE_KEY = "ilueats:rider_console:v2";

/** Seed acceptance so the demo console isn't empty on first load. */
const SEED_ACCEPTED_ORDER_IDS = ["ILU-9K2K", "ILU-9K2H", "ILU-9K2G"];

type PersistedShape = {
  isOnline: boolean;
  acceptedOrderIds: string[];
  deliveriesToday: number;
  tipsToday: number;
};

function defaultPersisted(): PersistedShape {
  return {
    isOnline: true,
    acceptedOrderIds: SEED_ACCEPTED_ORDER_IDS,
    deliveriesToday: 7,
    tipsToday: 1200,
  };
}

function loadPersisted(): PersistedShape {
  const fallback = defaultPersisted();
  const raw = readLocalStorage<PersistedShape | null>(STORAGE_KEY, null);
  if (!raw || !Array.isArray(raw.acceptedOrderIds)) return fallback;
  return {
    isOnline: typeof raw.isOnline === "boolean" ? raw.isOnline : true,
    acceptedOrderIds: raw.acceptedOrderIds.filter(
      (id): id is string => typeof id === "string"
    ),
    deliveriesToday:
      typeof raw.deliveriesToday === "number"
        ? raw.deliveriesToday
        : fallback.deliveriesToday,
    tipsToday:
      typeof raw.tipsToday === "number" ? raw.tipsToday : fallback.tipsToday,
  };
}

function orderToRiderLines(order: Order): RiderOrderLineItem[] {
  return order.lineItems.map((line) => ({
    name: line.name,
    qty: line.qty,
    modifiers: [
      ...(line.modifiers ?? []),
      ...(line.notes ? [`Note: ${line.notes}`] : []),
    ].slice(0, 8),
  }));
}

function orderStatusToJobStatus(order: Order): RiderJobStatus {
  if (order.status === "delivered") return "done";
  if (order.status === "out") return "en_route";
  return "pickup";
}

function orderToJob(order: Order): RiderJob {
  return {
    id: order.id,
    store: order.store,
    customer: order.customer,
    address: order.deliveryAddress,
    payout: order.deliveryFee,
    status: orderStatusToJobStatus(order),
    phone: order.customerPhone,
    lineItems: orderToRiderLines(order),
  };
}

function orderToOffer(order: Order): RiderOffer {
  return {
    id: order.id,
    store: order.store,
    customer: order.customer,
    drop: order.deliveryAddress,
    pay: order.deliveryFee,
    etaMin: Math.max(4, Math.round(order.deliveryFee / 100)),
    phone: order.customerPhone,
    lineItems: orderToRiderLines(order),
  };
}

interface RiderConsoleContextValue {
  isOnline: boolean;
  setOnline: (next: boolean) => void;
  jobs: RiderJob[];
  /** Offers you can pick up right now (open orders nobody accepted). */
  availableOffers: RiderOffer[];
  deliveriesToday: number;
  tipsToday: number;
  onTimePercent: string;
  acceptOffer: (offerId: string) => boolean;
  markPickedUp: (jobId: string) => void;
  markDelivered: (jobId: string) => number | null;
}

const RiderConsoleContext = createContext<RiderConsoleContextValue | null>(
  null
);

export function RiderConsoleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { orders, updateOrderStatus } = useOrders();
  const init = useMemo(() => loadPersisted(), []);
  const [isOnline, setIsOnlineState] = useState(init.isOnline);
  const [acceptedOrderIds, setAcceptedOrderIds] = useState<string[]>(
    init.acceptedOrderIds
  );
  const [deliveriesToday, setDeliveriesToday] = useState(init.deliveriesToday);
  const [tipsToday, setTipsToday] = useState(init.tipsToday);

  const persist = useCallback(
    (patch: Partial<PersistedShape>) => {
      writeLocalStorage(STORAGE_KEY, {
        isOnline,
        acceptedOrderIds,
        deliveriesToday,
        tipsToday,
        ...patch,
      });
    },
    [isOnline, acceptedOrderIds, deliveriesToday, tipsToday]
  );

  const setOnline = useCallback(
    (next: boolean) => {
      setIsOnlineState(next);
      persist({ isOnline: next });
    },
    [persist]
  );

  const jobs = useMemo<RiderJob[]>(
    () =>
      acceptedOrderIds
        .map((id) => orders.find((o) => o.id === id))
        .filter((o): o is Order => !!o)
        .map(orderToJob),
    [acceptedOrderIds, orders]
  );

  const availableOffers = useMemo<RiderOffer[]>(() => {
    if (!isOnline) return [];
    return orders
      .filter(
        (o) =>
          (o.status === "new" || o.status === "preparing") &&
          !acceptedOrderIds.includes(o.id)
      )
      .map(orderToOffer);
  }, [isOnline, orders, acceptedOrderIds]);

  const acceptOffer = useCallback(
    (offerId: string): boolean => {
      if (!isOnline) return false;
      const order = orders.find((o) => o.id === offerId);
      if (!order || acceptedOrderIds.includes(offerId)) return false;

      const next = [...acceptedOrderIds, offerId];
      setAcceptedOrderIds(next);
      persist({ acceptedOrderIds: next });
      return true;
    },
    [isOnline, orders, acceptedOrderIds, persist]
  );

  const markPickedUp = useCallback(
    (jobId: string) => {
      const order = orders.find((o) => o.id === jobId);
      if (!order || orderStatusToJobStatus(order) !== "pickup") return;
      updateOrderStatus(jobId, "out");
    },
    [orders, updateOrderStatus]
  );

  const markDelivered = useCallback(
    (jobId: string): number | null => {
      const order = orders.find((o) => o.id === jobId);
      if (!order || orderStatusToJobStatus(order) !== "en_route") return null;
      const tip = 150 + Math.floor(Math.random() * 200);
      updateOrderStatus(jobId, "delivered");
      const d = deliveriesToday + 1;
      const t = tipsToday + tip;
      setDeliveriesToday(d);
      setTipsToday(t);
      persist({ deliveriesToday: d, tipsToday: t });
      return tip;
    },
    [orders, updateOrderStatus, deliveriesToday, tipsToday, persist]
  );

  const value = useMemo<RiderConsoleContextValue>(
    () => ({
      isOnline,
      setOnline,
      jobs,
      availableOffers,
      deliveriesToday,
      tipsToday,
      onTimePercent: "94%",
      acceptOffer,
      markPickedUp,
      markDelivered,
    }),
    [
      isOnline,
      setOnline,
      jobs,
      availableOffers,
      deliveriesToday,
      tipsToday,
      acceptOffer,
      markPickedUp,
      markDelivered,
    ]
  );

  return (
    <RiderConsoleContext.Provider value={value}>
      {children}
    </RiderConsoleContext.Provider>
  );
}

export function useRiderConsole() {
  const ctx = useContext(RiderConsoleContext);
  if (!ctx) {
    throw new Error("useRiderConsole must be used within RiderConsoleProvider");
  }
  return ctx;
}
