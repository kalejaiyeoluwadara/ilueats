"use client";

import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { cn } from "@/lib/utils";

type FlagDef = {
  id: string;
  title: string;
  description: string;
  on?: boolean;
};

const FLAGS_SOURCE: FlagDef[] = [
  {
    id: "scheduled_orders",
    title: "Scheduled orders",
    description: "Let customers pick a later delivery window.",
    on: true,
  },
  {
    id: "pickup_mode",
    title: "Pickup mode",
    description: "Show pickup option on the storefront.",
  },
  {
    id: "referrals",
    title: "Referral rewards",
    description: "Invite-a-friend credits for first order.",
    on: true,
  },
  {
    id: "stripe_connect",
    title: "Express payouts",
    description: "Faster onboarding for new partner kitchens.",
    on: true,
  },
  {
    id: "dark_store",
    title: "Dark-store SKUs",
    description: "Enable hidden catalog rows for aggregator-only items.",
  },
  {
    id: "sms_alerts",
    title: "SMS rider alerts",
    description: "Secondary channel when push is disabled.",
    on: true,
  },
  {
    id: "multi_cart",
    title: "Multi-store checkout",
    description: "Single payment across two baskets in the same zone.",
  },
  {
    id: "beta_search",
    title: "Semantic search",
    description: "Vector ranking for menu discovery (beta).",
  },
  {
    id: "age_gate",
    title: "Alcohol age gate",
    description: "Extra confirmation for restricted categories.",
    on: true,
  },
  {
    id: "live_map",
    title: "Live rider map",
    description: "Ops-only map layer in the console.",
    on: true,
  },
];

const FLAG_PAGE_SIZE = 5;

export default function AdminSettingsPage() {
  const [fee, setFee] = useState("12");
  const [zone, setZone] = useState("ilisan-core");
  const [flagSearch, setFlagSearch] = useState("");

  const filteredFlags = useMemo(() => {
    const q = flagSearch.trim().toLowerCase();
    if (!q) return FLAGS_SOURCE;
    return FLAGS_SOURCE.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
    );
  }, [flagSearch]);

  const {
    page,
    setPage,
    pageCount,
    pageItems: flagPageItems,
    total: flagTotal,
    pageSize,
  } = usePaginatedList(filteredFlags, FLAG_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [flagSearch, setPage]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)] sm:text-[26px]">
          Settings
        </h1>
        <p className="mt-1 max-w-xl text-[13px] text-[var(--color-ink-muted)]">
          Platform controls are visual only for now — nothing is persisted.
        </p>
      </div>

      <section className="rounded-[1.25rem] bg-[var(--color-surface)] p-5 shadow-crisp ring-1 ring-[var(--color-line)] sm:p-6">
        <h2 className="text-[15px] font-extrabold text-[var(--color-ink)]">
          Fees &amp; commissions
        </h2>
        <p className="mt-0.5 text-[12.5px] text-[var(--color-ink-muted)]">
          Shown for layout preview; wire to config when ready.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-[12px] font-bold text-[var(--color-ink)]">
              Platform fee (%)
            </span>
            <input
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              inputMode="decimal"
              className="mt-2 h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)] px-4 text-[14px] font-semibold text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]/40 focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-bold text-[var(--color-ink)]">
              Default delivery zone
            </span>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)] px-4 text-[14px] font-semibold text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]/40 focus:ring-2 focus:ring-[var(--color-primary)]/20"
            >
              <option value="ilisan-core">Ilisan — core</option>
              <option value="ilisan-extended">Ilisan — extended</option>
              <option value="campus">Campus ring</option>
            </select>
          </label>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" size="md">
            Save changes
          </Button>
          <Button type="button" variant="outline" size="md">
            Reset
          </Button>
        </div>
      </section>

      <section className="rounded-[1.25rem] bg-[var(--color-surface)] p-5 shadow-crisp ring-1 ring-[var(--color-line)] sm:p-6">
        <h2 className="text-[15px] font-extrabold text-[var(--color-ink)]">
          Feature flags
        </h2>
        <p className="mt-0.5 text-[12.5px] text-[var(--color-ink-muted)]">
          Search and page through toggles — still UI-only.
        </p>

        <div className="relative mt-5 max-w-md">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-soft)]" />
          <input
            type="search"
            value={flagSearch}
            onChange={(e) => setFlagSearch(e.target.value)}
            placeholder="Search flags by name or description…"
            className="h-11 w-full rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] pl-10 pr-4 text-[13px] font-medium outline-none focus:border-[var(--color-primary)]/40 focus:ring-2 focus:ring-[var(--color-primary)]/15"
            autoComplete="off"
          />
        </div>

        {flagTotal === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-10 text-center text-[13px] font-medium text-[var(--color-ink-muted)]">
            No flags match this search.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-[var(--color-line)] rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/50">
            {flagPageItems.map((f) => (
              <FlagRow
                key={f.id}
                title={f.title}
                description={f.description}
                on={f.on}
              />
            ))}
          </ul>
        )}

        {flagTotal > 0 ? (
          <div className="mt-5">
            <Pagination
              page={page}
              pageCount={pageCount}
              totalItems={flagTotal}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function FlagRow({
  title,
  description,
  on: initialOn,
}: {
  title: string;
  description: string;
  on?: boolean;
}) {
  const [on, setOn] = useState(Boolean(initialOn));
  return (
    <li className="flex items-center justify-between gap-4 px-4 py-4">
      <div>
        <p className="text-[13px] font-bold text-[var(--color-ink)]">{title}</p>
        <p className="mt-0.5 text-[12px] text-[var(--color-ink-muted)]">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setOn((v) => !v)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          on ? "bg-[var(--color-primary)]" : "bg-zinc-300"
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
            on ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </li>
  );
}
