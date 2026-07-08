"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { Order, OrderStatus } from "@/types";
import {
  getOrdersServerSnapshot,
  getOrdersSnapshot,
  hydrateOrdersFromStorage,
  placeOrder as storePlaceOrder,
  type PlaceOrderInput,
  resetOrdersToSeed,
  subscribeOrders,
  updateOrderStatus as storeUpdateOrderStatus,
} from "@/lib/ordersStore";

type OrdersContextValue = {
  orders: Order[];
  placeOrder: (input: PlaceOrderInput) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  resetToSeed: () => void;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeOrders,
    getOrdersSnapshot,
    getOrdersServerSnapshot
  );

  useEffect(() => {
    hydrateOrdersFromStorage();
  }, []);

  const value = useMemo<OrdersContextValue>(
    () => ({
      orders: snapshot.orders,
      placeOrder: storePlaceOrder,
      updateOrderStatus: storeUpdateOrderStatus,
      resetToSeed: resetOrdersToSeed,
    }),
    [snapshot.orders]
  );

  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return ctx;
}
