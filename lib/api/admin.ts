import { apiFetch } from "./client";
import type { PaginatedResult } from "./orders";

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
