import { apiFetch } from "./client";

export type BackendPaymentMethod = "card" | "transfer" | "cash" | "wallet";
export type BackendDeliveryMode = "door" | "landmark";
export type BackendPaymentStatus = "pending" | "paid" | "failed" | "not_applicable";

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  selectedOptions?: { groupId: string; choiceId: string }[];
  notes?: string;
}

export interface CreateOrderInput {
  storeId: string;
  storeSlug: string;
  items: CreateOrderItemInput[];
  deliveryMode: BackendDeliveryMode;
  address?: string;
  landmarkId?: string;
  contactName: string;
  contactPhone: string;
  notes?: string;
  paymentMethod: BackendPaymentMethod;
}

export interface CreateOrderResult {
  orderId: string;
  status: string;
  paymentStatus: BackendPaymentStatus;
  paymentRequired: boolean;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  estimatedDeliveryWindow: number[];
}

export function createOrder(input: CreateOrderInput) {
  return apiFetch<CreateOrderResult>("/orders", {
    method: "POST",
    body: input,
  });
}

export function getOrder(orderId: string) {
  return apiFetch(`/orders/${orderId}`);
}

export function getMyOrders(page = 1, pageSize = 10) {
  return apiFetch("/users/me/orders", { query: { page, pageSize } });
}
