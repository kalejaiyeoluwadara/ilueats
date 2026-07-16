"use client";

import { useEffect, useState } from "react";
import {
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { AdminOrderDetailModal } from "@/components/admin/AdminOrderDetailModal";
import { Pagination } from "@/components/ui/Pagination";
import { ErrorState } from "@/components/ui/EmptyState";
import { getAdminOrders } from "@/lib/api/orders";
import type { AdminOrderSummary } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { formatPlacedAgo, orderStatusBadge } from "@/lib/ordersStore";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn, formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const ORDER_PAGE_SIZE = 10;

type OrdersFilter = "all" | OrderStatus;

const ORDER_FILTER_CHIPS: { id: OrdersFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "preparing", label: "Preparing" },
  { id: "assigned", label: "Assigned" },
  { id: "out", label: "Out" },
  { id: "delivered", label: "Delivered" },
];

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [statusFilter, setStatusFilter] = useState<OrdersFilter>("all");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<AdminOrderSummary[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAdminOrders({
      page,
      pageSize: ORDER_PAGE_SIZE,
      status: statusFilter === "all" ? undefined : statusFilter,
      q: debouncedSearch || undefined,
    })
      .then((res) => {
        if (cancelled) return;
        setRows(res.items);
        setTotalItems(res.totalItems);
        setPageCount(res.pageCount);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load orders.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, statusFilter, debouncedSearch, refreshToken]);

  const refresh = () => setRefreshToken((n) => n + 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)] sm:text-[26px]">
            Orders
          </h1>
          <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
            Filter by fulfilment stage, search, and assign riders to orders.
          </p>
        </div>
      </div>

      <div className="rounded-[1.25rem] bg-[var(--color-surface)] shadow-crisp ring-1 ring-[var(--color-line)]">
        <div className="space-y-4 border-b border-[var(--color-line)] p-4">
          <div className="relative max-w-md flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-soft)]" />
            <input
              type="search"
              placeholder="Search order id, customer, store, address, or dish…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] pl-10 pr-4 text-[13px] font-medium text-[var(--color-ink)] outline-none ring-[var(--color-primary)]/0 transition placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-primary)]/35 focus:ring-2 focus:ring-[var(--color-primary)]/20"
              autoComplete="off"
            />
          </div>

          <div className="-mx-0.5">
            <p className="mb-2 px-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Status
            </p>
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Filter orders by status"
            >
              {ORDER_FILTER_CHIPS.map((chip) => {
                const selected = statusFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setStatusFilter(chip.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-bold transition-colors",
                      selected
                        ? "bg-[var(--color-ink)] text-white"
                        : "bg-white text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)] hover:bg-black/[0.03]"
                    )}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error ? (
          <div className="p-4">
            <ErrorState
              variant="inline"
              title="Orders didn't load"
              message={error}
              onRetry={refresh}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                  <th className="px-4 py-3 font-bold">Order</th>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Store</th>
                  <th className="px-4 py-3 font-bold">Total</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold text-right">Placed</th>
                  <th className="w-14 px-2 py-3 text-center font-bold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {loading ? (
                  <tr>
                    <td
                      className="px-4 py-10 text-center text-[13px] font-medium text-[var(--color-ink-muted)]"
                      colSpan={7}
                    >
                      Loading orders…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-10 text-center text-[13px] font-medium text-[var(--color-ink-muted)]"
                      colSpan={7}
                    >
                      No orders match your filters — try widening the status or
                      clearing search.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const badge = orderStatusBadge[r.status];
                    return (
                      <tr
                        key={r.id}
                        className="bg-white transition hover:bg-[var(--color-bg)]/50"
                      >
                        <td className="px-4 py-3.5 font-mono text-[12px] font-bold text-[var(--color-ink)]">
                          {r.id}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-[var(--color-ink)]">
                          {r.customer}
                        </td>
                        <td className="px-4 py-3.5 text-[var(--color-ink-muted)]">
                          {r.store}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[var(--color-ink)]">
                          {formatPrice(r.total)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset",
                              badge.className
                            )}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-[12px] font-medium text-[var(--color-ink-muted)]">
                          {formatPlacedAgo(r.placedAt)}
                        </td>
                        <td className="px-2 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => setDetailOrderId(r.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-ink-muted)] outline-none ring-[var(--color-ink)]/0 transition hover:bg-black/[0.05] hover:text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/35"
                            aria-label={`Full details for ${r.id}`}
                          >
                            <EllipsisHorizontalIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalItems > 0 ? (
          <div className="border-t border-[var(--color-line)] p-4">
            <Pagination
              page={page}
              pageCount={pageCount}
              totalItems={totalItems}
              pageSize={ORDER_PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </div>

      <AdminOrderDetailModal
        open={!!detailOrderId}
        orderId={detailOrderId}
        onClose={() => setDetailOrderId(null)}
        onChanged={refresh}
      />
    </div>
  );
}
