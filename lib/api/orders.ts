import { apiFetch } from "./client";
import type { OrderStatus } from "@/types";

export type BackendPaymentMethod = "card" | "transfer" | "cash" | "wallet";
export type BackendDeliveryMode = "door" | "landmark";
export type BackendPaymentStatus = "pending" | "paid" | "failed" | "not_applicable";

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  paymentStatus: BackendPaymentStatus;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  storeName: string;
  placedAt: string;
}

export interface OrderDetailLineItem {
  name: string;
  qty: number;
  unitPrice: number;
  modifiers?: string[];
}

export interface OrderRider {
  name: string;
  phone: string | null;
}

export interface OrderDetail {
  id: string;
  status: OrderStatus;
  storeId: string;
  storeSlug: string;
  storeName: string;
  storeAddress: string;
  customer: string;
  customerPhone: string;
  deliveryAddress: string;
  paymentLabel: string;
  paymentStatus: BackendPaymentStatus;
  paymentReference?: string;
  lineItems: OrderDetailLineItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  placedAt: string;
  estimatedDeliveryWindow: number[];
  assignedAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  rider: OrderRider | null;
}

export interface AdminOrderSummary {
  id: string;
  customer: string;
  customerPhone: string;
  deliveryAddress: string;
  store: string;
  storeAddress: string;
  paymentLabel: string;
  total: number;
  deliveryFee: number;
  serviceFee: number;
  status: OrderStatus;
  placedAt: string;
  lineItems: OrderDetailLineItem[];
}

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

export function getOrder(orderCode: string) {
  return apiFetch<OrderDetail>(`/orders/${orderCode}`);
}

export function getMyOrders(page = 1, pageSize = 10) {
  return apiFetch<{ items: OrderSummary[] }>("/users/me/orders", {
    query: { page, pageSize },
  });
}

/* -------------------------------------------------------------------------- */
/* Admin                                                                      */
/* -------------------------------------------------------------------------- */

export interface AdminOrdersQuery {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
  q?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export function getAdminOrders(params: AdminOrdersQuery = {}) {
  return apiFetch<PaginatedResult<AdminOrderSummary>>("/admin/orders", {
    query: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
      status: params.status,
      q: params.q,
    },
  });
}

export function getAdminOrder(orderCode: string) {
  return apiFetch<OrderDetail>(`/admin/orders/${orderCode}`);
}

export function updateAdminOrderStatus(orderCode: string, status: OrderStatus) {
  return apiFetch<OrderDetail>(`/admin/orders/${orderCode}/status`, {
    method: "PATCH",
    body: { status },
  });
}

export interface AdminRider {
  riderId: string;
  name: string;
  email: string;
  phone: string | null;
  isOnline: boolean;
  vehicleType: string;
  plateNumber: string;
}

export function getAdminRiders() {
  return apiFetch<AdminRider[]>("/admin/riders");
}

export interface CreateRiderInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  vehicleType?: string;
  plateNumber?: string;
}

export function createRider(input: CreateRiderInput) {
  return apiFetch<AdminRider>("/admin/riders", {
    method: "POST",
    body: input,
  });
}

export function assignRider(orderCode: string, riderId: string) {
  return apiFetch<OrderDetail>(`/admin/orders/${orderCode}/assign-rider`, {
    method: "POST",
    body: { riderId },
  });
}
