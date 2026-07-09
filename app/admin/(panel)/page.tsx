"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowTrendingUpIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/Pagination";
import { ErrorState } from "@/components/ui/EmptyState";
import { getDashboardKpis, getActivity } from "@/lib/api/admin";
import type { DashboardKpis, ActivityItem, ActivitySegment } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatPlacedAgo } from "@/lib/ordersStore";
import { cn, formatPrice } from "@/lib/utils";

const ACTIVITY_SEGMENT_CHIPS: { id: ActivitySegment | "all"; label: string }[] =
  [
    { id: "all", label: "All" },
    { id: "orders", label: "Orders" },
    { id: "stores", label: "Stores" },
    { id: "finance", label: "Finance" },
    { id: "platform", label: "Platform" },
  ];

const ACTIVITY_PAGE_SIZE = 6;

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [kpisError, setKpisError] = useState<string | null>(null);

  const [activitySearch, setActivitySearch] = useState("");
  const debouncedSearch = useDebouncedValue(activitySearch, 350);
  const [segment, setSegment] = useState<ActivitySegment | "all">("all");
  const [activityPage, setActivityPage] = useState(1);

  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityPageCount, setActivityPageCount] = useState(1);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardKpis()
      .then(setKpis)
      .catch((err) =>
        setKpisError(err instanceof ApiError ? err.message : "Failed to load stats.")
      );
  }, []);

  useEffect(() => {
    setActivityPage(1);
  }, [debouncedSearch, segment]);

  useEffect(() => {
    let cancelled = false;
    setActivityLoading(true);
    setActivityError(null);
    getActivity({
      segment: segment === "all" ? undefined : segment,
      q: debouncedSearch || undefined,
      page: activityPage,
      pageSize: ACTIVITY_PAGE_SIZE,
    })
      .then((res) => {
        if (cancelled) return;
        setActivityItems(res.items);
        setActivityTotal(res.totalItems);
        setActivityPageCount(res.pageCount);
      })
      .catch((err) => {
        if (cancelled) return;
        setActivityError(
          err instanceof ApiError ? err.message : "Failed to load activity."
        );
      })
      .finally(() => {
        if (!cancelled) setActivityLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [segment, debouncedSearch, activityPage]);

  const kpiCards = [
    {
      label: "Orders today",
      value: kpis ? String(kpis.ordersToday) : "—",
      hint: "Since midnight",
      icon: ShoppingBagIcon,
      tone: "primary" as const,
    },
    {
      label: "Gross volume",
      value: kpis ? formatPrice(kpis.grossVolumeToday) : "—",
      hint: "Card + transfer + cash + wallet",
      icon: ArrowTrendingUpIcon,
      tone: "neutral" as const,
    },
    {
      label: "Active riders",
      value: kpis ? String(kpis.activeRiders) : "—",
      hint: "Online right now",
      icon: UsersIcon,
      tone: "neutral" as const,
    },
    {
      label: "Avg. prep time",
      value: kpis ? `${kpis.avgPrepTimeMins} min` : "—",
      hint: "Rolling estimate",
      icon: ClockIcon,
      tone: "neutral" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)] sm:text-[26px]">
            Overview
          </h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
            Live snapshot of ìlúEats operations.
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] px-5 text-[13px] font-bold text-white shadow-[0_6px_16px_-4px_rgba(232,84,26,0.45)] transition hover:bg-[#d04714] active:bg-[#bd3f10]"
        >
          View orders
        </Link>
      </div>

      {kpisError ? (
        <ErrorState message={kpisError} />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((k) => {
            const Icon = k.icon;
            return (
              <div
                key={k.label}
                className="relative overflow-hidden rounded-[1.25rem] bg-[var(--color-surface)] p-5 shadow-crisp ring-1 ring-[var(--color-line)]"
              >
                <div
                  className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[var(--color-primary)]/[0.06] blur-2xl"
                  aria-hidden
                />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
                      {k.label}
                    </p>
                    <p
                      className={cn(
                        "mt-2 text-[24px] font-extrabold tracking-tight text-[var(--color-ink)]",
                        !kpis && "text-[var(--color-ink-soft)]"
                      )}
                    >
                      {k.value}
                    </p>
                    <p className="mt-1 text-[12px] font-medium text-[var(--color-ink-muted)]">
                      {k.hint}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-2xl ring-1",
                      k.tone === "primary"
                        ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] ring-[var(--color-primary)]/15"
                        : "bg-zinc-50 text-zinc-600 ring-zinc-200/80"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </div>
            );
          })}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-[1.25rem] bg-[var(--color-surface)] p-5 shadow-crisp ring-1 ring-[var(--color-line)] lg:col-span-3">
          <h2 className="text-[15px] font-extrabold tracking-tight text-[var(--color-ink)]">
            Quick actions
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-ink-muted)]">
            Shortcuts for common operator tasks
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ActionCard
              href="/admin/orders"
              title="Manage orders"
              description="Assign riders, mark ready, resolve issues"
            />
            <ActionCard
              href="/admin/riders"
              title="Manage riders"
              description="Create accounts and see who's online"
            />
            <ActionCard
              href="/admin/stores"
              title="Review stores"
              description="Approvals, fees, and opening hours"
            />
            <ActionCard
              href="/admin/settings"
              title="Platform settings"
              description="Fees, zones, and feature flags"
            />
          </div>
        </section>

        <section className="rounded-[1.25rem] bg-[var(--color-surface)] p-5 shadow-crisp ring-1 ring-[var(--color-line)] lg:col-span-2">
          <h2 className="text-[15px] font-extrabold tracking-tight text-[var(--color-ink)]">
            Activity
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-ink-muted)]">
            Recent events across the platform
          </p>

          <div className="mt-4 space-y-3">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-soft)]" />
              <input
                type="search"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                placeholder="Search title or details…"
                className="h-10 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] pl-10 pr-3 text-[13px] font-medium outline-none focus:border-[var(--color-primary)]/35 focus:ring-2 focus:ring-[var(--color-primary)]/15"
              />
            </div>
            <div className="-mx-0.5 flex flex-wrap gap-1.5" role="tablist" aria-label="Activity segments">
              {ACTIVITY_SEGMENT_CHIPS.map((chip) => {
                const sel = segment === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    role="tab"
                    aria-selected={sel}
                    onClick={() => setSegment(chip.id)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
                      sel
                        ? "bg-[var(--color-ink)] text-white"
                        : "bg-white text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)]"
                    )}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {activityError ? (
            <div className="mt-4">
              <ErrorState message={activityError} />
            </div>
          ) : activityLoading ? (
            <ul className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <li
                  key={idx}
                  className="flex gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/60 px-3 py-3"
                >
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-[var(--color-line)] skeleton" />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <div className="h-3.5 w-32 rounded bg-[var(--color-line)] skeleton" />
                    <div className="h-3 w-44 rounded bg-[var(--color-line)] skeleton" />
                  </div>
                </li>
              ))}
            </ul>
          ) : activityTotal === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-8 text-center text-[13px] font-medium text-[var(--color-ink-muted)]">
              {debouncedSearch || segment !== "all"
                ? "Nothing in this slice — widen the segment filter or clear search."
                : "No activity yet — events show up here as orders and rider actions happen."}
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {activityItems.map((a) => (
                <li
                  key={a._id}
                  className="flex gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/60 px-3 py-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[10.5px] font-bold text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)]">
                    {formatPlacedAgo(a.createdAt)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-[var(--color-ink)]">
                      {a.message}
                    </p>
                    <p className="truncate text-[12px] capitalize text-[var(--color-ink-muted)]">
                      {a.segment}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {activityTotal > 0 ? (
            <div className="mt-4">
              <Pagination
                page={activityPage}
                pageCount={activityPageCount}
                totalItems={activityTotal}
                pageSize={ACTIVITY_PAGE_SIZE}
                onPageChange={setActivityPage}
              />
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function ActionCard({
  href,
  title,
  description,
  external,
}: {
  href: string;
  title: string;
  description: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group rounded-2xl border border-[var(--color-line)] bg-gradient-to-b from-white to-[var(--color-bg)]/40 p-4 transition hover:border-[var(--color-primary)]/25 hover:shadow-[0_8px_28px_-12px_rgba(232,84,26,0.25)]"
    >
      <p className="text-[13.5px] font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)]">
        {title}
      </p>
      <p className="mt-1 text-[12px] leading-snug text-[var(--color-ink-muted)]">
        {description}
      </p>
    </Link>
  );
}
