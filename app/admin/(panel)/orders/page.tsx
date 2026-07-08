"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { AdminOrderDetailModal } from "@/components/admin/AdminOrderDetailModal";
import { Pagination } from "@/components/ui/Pagination";
import { useOrders } from "@/context/OrdersContext";
import { formatPlacedAgo, orderStatusBadge } from "@/lib/ordersStore";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { cn, formatPrice } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

const ORDER_PAGE_SIZE = 10;

type OrdersFilter = "all" | "open" | OrderStatus;

const ORDER_FILTER_CHIPS: { id: OrdersFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "new", label: "New" },
  { id: "preparing", label: "Preparing" },
  { id: "out", label: "Out" },
  { id: "delivered", label: "Delivered" },
];

function applyOrderStatusFilter(
  rows: Order[],
  filter: OrdersFilter
): Order[] {
  if (filter === "all") return rows;
  if (filter === "open") {
    return rows.filter((r) => r.status !== "delivered");
  }
  return rows.filter((r) => r.status === filter);
}

function applyOrderSearch(rows: Order[], q: string): Order[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((r) => {
    if (
      r.id.toLowerCase().includes(needle) ||
      r.customer.toLowerCase().includes(needle) ||
      r.store.toLowerCase().includes(needle) ||
      r.deliveryAddress.toLowerCase().includes(needle)
    ) {
      return true;
    }
    return r.lineItems.some(
      (line) =>
        line.name.toLowerCase().includes(needle) ||
        line.modifiers?.some((m) => m.toLowerCase().includes(needle))
    );
  });
}

function countOrdersMatchingFilter(
  rows: readonly Order[],
  filter: OrdersFilter
): number {
  return applyOrderStatusFilter([...rows], filter).length;
}

export default function AdminOrdersPage() {
  const { orders: rows } = useOrders();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrdersFilter>("all");
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  // Resolve from live rows so status changes made in the modal render immediately.
  const detailOrder = useMemo(
    () => rows.find((r) => r.id === detailOrderId) ?? null,
    [rows, detailOrderId]
  );

  const filteredRows = useMemo(() => {
    const byStatus = applyOrderStatusFilter(rows, statusFilter);
    return applyOrderSearch(byStatus, search);
  }, [rows, statusFilter, search]);

  const {
    page,
    setPage,
    pageCount,
    pageItems: pagedRows,
    total: orderTotal,
    pageSize,
  } = usePaginatedList(filteredRows, ORDER_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, setPage]);

  const chipCounts = useMemo(() => {
    const map = new Map<OrdersFilter, number>();
    for (const chip of ORDER_FILTER_CHIPS) {
      map.set(chip.id, countOrdersMatchingFilter(rows, chip.id));
    }
    return map;
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)] sm:text-[26px]">
            Orders
          </h1>
          <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
            Filter by fulfilment stage and search the mock board below.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center rounded-full bg-[var(--color-ink)] px-4 text-[13px] font-semibold text-white"
        >
          Export CSV
        </button>
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
                const count = chipCounts.get(chip.id) ?? 0;
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
                    <span
                      className={cn(
                        "min-w-[1.25rem] rounded-md px-1 py-0.5 text-center text-[11px] font-extrabold tabular-nums",
                        selected
                          ? "bg-white/20 text-white"
                          : "bg-[var(--color-bg)] text-[var(--color-ink-muted)]"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

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
              {pagedRows.length === 0 ? (
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
                pagedRows.map((r) => {
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

        {orderTotal > 0 ? (
          <div className="border-t border-[var(--color-line)] p-4">
            <Pagination
              page={page}
              pageCount={pageCount}
              totalItems={orderTotal}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </div>

      <AdminOrderDetailModal
        open={!!detailOrder}
        order={detailOrder}
        onClose={() => setDetailOrderId(null)}
      />
    </div>
  );
}
