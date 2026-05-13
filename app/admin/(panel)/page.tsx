"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowTrendingUpIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/Pagination";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { cn, formatPrice } from "@/lib/utils";

const kpis = [
  {
    label: "Orders today",
    value: "128",
    hint: "+12% vs yesterday",
    icon: ShoppingBagIcon,
    tone: "primary" as const,
  },
  {
    label: "Gross volume",
    value: formatPrice(1_842_000),
    hint: "Card + transfer + cash",
    icon: ArrowTrendingUpIcon,
    tone: "neutral" as const,
  },
  {
    label: "Active riders",
    value: "14",
    hint: "3 idle nearby",
    icon: UsersIcon,
    tone: "neutral" as const,
  },
  {
    label: "Avg. prep time",
    value: "24 min",
    hint: "Last 7 days",
    icon: ClockIcon,
    tone: "neutral" as const,
  },
];

type ActivitySegment = "orders" | "stores" | "finance" | "platform";

type ActivityItem = {
  id: string;
  title: string;
  meta: string;
  time: string;
  segment: ActivitySegment;
};

const ACTIVITY_SEGMENT_CHIPS: { id: ActivitySegment | "all"; label: string }[] =
  [
    { id: "all", label: "All" },
    { id: "orders", label: "Orders" },
    { id: "stores", label: "Stores" },
    { id: "finance", label: "Finance" },
    { id: "platform", label: "Platform" },
  ];

const activitySource: ActivityItem[] = [
  {
    id: "1",
    title: "New order",
    meta: "ILU-9K2M · Mama Put Palace",
    time: "2m",
    segment: "orders",
  },
  {
    id: "2",
    title: "Store went live",
    meta: "Crisp Bites",
    time: "18m",
    segment: "stores",
  },
  {
    id: "3",
    title: "Payout sent",
    meta: "₦340,000 · 4 stores",
    time: "1h",
    segment: "finance",
  },
  {
    id: "4",
    title: "Refund approved",
    meta: "ILU-8JFL · Customer request",
    time: "2h",
    segment: "orders",
  },
  {
    id: "5",
    title: "Rider check-in spike",
    meta: "Peak window · Campus ring",
    time: "3h",
    segment: "platform",
  },
  {
    id: "6",
    title: "Menu published",
    meta: "SmoothCity · Drinks specials",
    time: "4h",
    segment: "stores",
  },
  {
    id: "7",
    title: "Zone fee updated",
    meta: "Ilisan extended +5%",
    time: "5h",
    segment: "platform",
  },
  {
    id: "8",
    title: "Batch settlement",
    meta: "Morning rail · Auto-debit queued",
    time: "6h",
    segment: "finance",
  },
  {
    id: "9",
    title: "SLA breach alert",
    meta: "Three orders · Crisp Bites",
    time: "7h",
    segment: "orders",
  },
  {
    id: "10",
    title: "Hygiene checklist",
    meta: "Slice House · Photo approved",
    time: "8h",
    segment: "stores",
  },
  {
    id: "11",
    title: "Feature flag flip",
    meta: "Referral tier B · 50% cohort",
    time: "9h",
    segment: "platform",
  },
  {
    id: "12",
    title: "Chargeback notice",
    meta: "Issuer · ILU-7QPL",
    time: "10h",
    segment: "finance",
  },
  {
    id: "13",
    title: "Reorder surge",
    meta: "Breakfast Club · Lunch bundle",
    time: "11h",
    segment: "orders",
  },
  {
    id: "14",
    title: "Store hours edit",
    meta: "Fruit Hive · Sun closed",
    time: "12h",
    segment: "stores",
  },
];

function applyActivitySegment(
  items: ActivityItem[],
  segment: ActivitySegment | "all"
): ActivityItem[] {
  if (segment === "all") return items;
  return items.filter((a) => a.segment === segment);
}

function applyActivitySearch(items: ActivityItem[], q: string): ActivityItem[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return items;
  return items.filter(
    (a) =>
      a.title.toLowerCase().includes(needle) ||
      a.meta.toLowerCase().includes(needle)
  );
}

function applySegmentCount(
  items: readonly ActivityItem[],
  segment: ActivitySegment | "all"
): number {
  return applyActivitySegment([...items], segment).length;
}

const ACTIVITY_PAGE_SIZE = 4;

export default function AdminDashboardPage() {
  const activityItems = useMemo(() => activitySource, []);

  const [activitySearch, setActivitySearch] = useState("");
  const [segment, setSegment] = useState<ActivitySegment | "all">("all");

  const filteredActivity = useMemo(() => {
    const bySeg = applyActivitySegment(activityItems, segment);
    return applyActivitySearch(bySeg, activitySearch);
  }, [activityItems, segment, activitySearch]);

  const {
    page: activityPage,
    setPage: setActivityPage,
    pageCount: activityPageCount,
    pageItems: activityPageItems,
    total: activityTotal,
    pageSize: activityPageSize,
  } = usePaginatedList(filteredActivity, ACTIVITY_PAGE_SIZE);

  useEffect(() => {
    setActivityPage(1);
  }, [activitySearch, segment, setActivityPage]);

  const segmentCounts = useMemo(() => {
    const m = new Map<ActivitySegment | "all", number>();
    for (const chip of ACTIVITY_SEGMENT_CHIPS) {
      m.set(chip.id, applySegmentCount(activityItems, chip.id));
    }
    return m;
  }, [activityItems]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)] sm:text-[26px]">
            Overview
          </h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
            Snapshot of IluEats operations — numbers are illustrative until
            backend wiring is in place.
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] px-5 text-[13px] font-bold text-white shadow-[0_6px_16px_-4px_rgba(232,84,26,0.45)] transition hover:bg-[#d04714] active:bg-[#bd3f10]"
        >
          View orders
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
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
                  <p className="mt-2 text-[24px] font-extrabold tracking-tight text-[var(--color-ink)]">
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
              href="/admin/stores"
              title="Review stores"
              description="Approvals, fees, and opening hours"
            />
            <ActionCard
              href="/admin/settings"
              title="Platform settings"
              description="Fees, zones, and feature flags"
            />
            <ActionCard
              href="/"
              title="Open customer app"
              description="See the storefront as buyers do"
              external
            />
          </div>
        </section>

        <section className="rounded-[1.25rem] bg-[var(--color-surface)] p-5 shadow-crisp ring-1 ring-[var(--color-line)] lg:col-span-2">
          <h2 className="text-[15px] font-extrabold tracking-tight text-[var(--color-ink)]">
            Activity
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-ink-muted)]">
            Recent events (mock stream)
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
                const c = segmentCounts.get(chip.id) ?? 0;
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
                    <span
                      className={cn(
                        "tabular-nums",
                        sel ? "opacity-95" : "text-[var(--color-ink-muted)]"
                      )}
                    >
                      {c}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {activityTotal === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-8 text-center text-[13px] font-medium text-[var(--color-ink-muted)]">
              Nothing in this slice — widen the segment filter or clear search.
            </div>
          ) : (
          <ul className="mt-4 space-y-3">
            {activityPageItems.map((a) => (
              <li
                key={a.id}
                className="flex gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/60 px-3 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[11px] font-bold text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)]">
                  {a.time}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-[var(--color-ink)]">
                    {a.title}
                  </p>
                  <p className="truncate text-[12px] text-[var(--color-ink-muted)]">
                    {a.meta}
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
                pageSize={activityPageSize}
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
