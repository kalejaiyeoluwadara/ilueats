"use client";

import { useMemo } from "react";
import {
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/Pagination";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { cn, formatPrice } from "@/lib/utils";

type OrderStatus = "new" | "preparing" | "out" | "delivered";

const rowsSource: {
  id: string;
  customer: string;
  store: string;
  total: number;
  status: OrderStatus;
  placed: string;
}[] = [
  {
    id: "ILU-9K2M",
    customer: "Temi A.",
    store: "Mama Put Palace",
    total: 5200,
    status: "new",
    placed: "2 min ago",
  },
  {
    id: "ILU-9K2L",
    customer: "Chidi O.",
    store: "Crisp Bites",
    total: 11800,
    status: "preparing",
    placed: "8 min ago",
  },
  {
    id: "ILU-9K2K",
    customer: "Anita I.",
    store: "SmoothCity",
    total: 4500,
    status: "out",
    placed: "14 min ago",
  },
  {
    id: "ILU-9K2J",
    customer: "Kunle M.",
    store: "Slice House",
    total: 24000,
    status: "delivered",
    placed: "Yesterday",
  },
  {
    id: "ILU-9K2I",
    customer: "Bola E.",
    store: "Mama Put Palace",
    total: 6200,
    status: "preparing",
    placed: "32 min ago",
  },
  {
    id: "ILU-9K2H",
    customer: "Sade R.",
    store: "Crisp Bites",
    total: 3800,
    status: "out",
    placed: "45 min ago",
  },
  {
    id: "ILU-9K2G",
    customer: "Yomi P.",
    store: "Slice House",
    total: 19200,
    status: "delivered",
    placed: "2h ago",
  },
  {
    id: "ILU-9K2F",
    customer: "Ngozi T.",
    store: "Campus Chow",
    total: 2100,
    status: "new",
    placed: "3 min ago",
  },
  {
    id: "ILU-9K2E",
    customer: "Femi K.",
    store: "SmoothCity",
    total: 1500,
    status: "delivered",
    placed: "3h ago",
  },
  {
    id: "ILU-9K2D",
    customer: "Amaka U.",
    store: "Mama Put Palace",
    total: 8900,
    status: "preparing",
    placed: "1h ago",
  },
  {
    id: "ILU-9K2C",
    customer: "Tunde B.",
    store: "Coastal Grill",
    total: 14500,
    status: "out",
    placed: "20 min ago",
  },
  {
    id: "ILU-9K2B",
    customer: "Ada W.",
    store: "Crisp Bites",
    total: 4100,
    status: "delivered",
    placed: "Saturday",
  },
];

const ORDER_PAGE_SIZE = 5;

const statusStyles: Record<
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

export default function AdminOrdersPage() {
  const rows = useMemo(() => rowsSource, []);
  const {
    page,
    setPage,
    pageCount,
    pageItems: pagedRows,
    total: orderTotal,
    pageSize,
  } = usePaginatedList(rows, ORDER_PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)] sm:text-[26px]">
            Orders
          </h1>
          <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
            Triaging board — filters and actions are UI-only for now.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-semibold text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)]"
          >
            <FunnelIcon className="h-4 w-4 text-[var(--color-ink-muted)]" />
            Filters
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 text-[13px] font-semibold text-white"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="rounded-[1.25rem] bg-[var(--color-surface)] shadow-crisp ring-1 ring-[var(--color-line)]">
        <div className="flex flex-col gap-3 border-b border-[var(--color-line)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-soft)]" />
            <input
              type="search"
              placeholder="Search by order id or customer…"
              className="h-11 w-full rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] pl-10 pr-4 text-[13px] font-medium text-[var(--color-ink)] outline-none ring-[var(--color-primary)]/0 transition placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-primary)]/35 focus:ring-2 focus:ring-[var(--color-primary)]/20"
              readOnly
              aria-readonly="true"
            />
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
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {pagedRows.map((r) => (
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
                        statusStyles[r.status].className
                      )}
                    >
                      {statusStyles[r.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-[12px] font-medium text-[var(--color-ink-muted)]">
                    {r.placed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[var(--color-line)] p-4">
          <Pagination
            page={page}
            pageCount={pageCount}
            totalItems={orderTotal}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
