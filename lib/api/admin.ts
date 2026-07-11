import { apiFetch } from "./client";
import type { PaginatedResult } from "./orders";
import type { WalletTransaction } from "./wallet";

export interface DashboardKpis {
  ordersToday: number;
  grossVolumeToday: number;
  activeRiders: number;
  avgPrepTimeMins: number;
}

export function getDashboardKpis() {
  return apiFetch<DashboardKpis>("/admin/dashboard/kpis");
}

export interface StoreOrderStats {
  storeId: string;
  orders7d: number;
  revenue7d: number;
  ordersTotal: number;
}

/** Per-store order stats computed from real orders (keyed by store id). */
export async function getStoreStats(): Promise<Map<string, StoreOrderStats>> {
  const { items } = await apiFetch<{ items: StoreOrderStats[] }>(
    "/admin/stores/stats"
  );
  return new Map(items.map((s) => [s.storeId, s]));
}

export type ActivitySegment = "orders" | "stores" | "finance" | "platform";

export interface ActivityItem {
  _id: string;
  segment: ActivitySegment;
  message: string;
  createdAt: string;
}

export interface ActivityQuery {
  segment?: ActivitySegment;
  q?: string;
  page?: number;
  pageSize?: number;
}

export function getActivity(params: ActivityQuery = {}) {
  return apiFetch<PaginatedResult<ActivityItem>>("/admin/activity", {
    query: {
      segment: params.segment,
      q: params.q,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    },
  });
}

export type UserRole = "customer" | "admin" | "rider";
export type UserStatus = "active" | "blocked";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isBlocked: boolean;
  blockedAt: string | null;
  addressCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UsersQuery {
  q?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  pageSize?: number;
}

export function getAdminUsers(params: UsersQuery = {}) {
  return apiFetch<PaginatedResult<AdminUser>>("/admin/users", {
    query: {
      q: params.q,
      role: params.role,
      status: params.status,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
    },
  });
}

export function getAdminUser(id: string) {
  return apiFetch<AdminUser>(`/admin/users/${id}`);
}

export function getAdminUserTransactions(
  id: string,
  params: { page?: number; pageSize?: number } = {}
) {
  return apiFetch<PaginatedResult<WalletTransaction>>(
    `/admin/users/${id}/transactions`,
    {
      query: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 10,
      },
    }
  );
}

export function setAdminUserBlocked(id: string, blocked: boolean) {
  return apiFetch<AdminUser>(`/admin/users/${id}/block`, {
    method: "PATCH",
    body: { blocked },
  });
}

export function deleteAdminUser(id: string) {
  return apiFetch<{ id: string; deleted: boolean }>(`/admin/users/${id}`, {
    method: "DELETE",
  });
}
