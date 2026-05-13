import Link from "next/link";
import {
  ArrowTrendingUpIcon,
  ClockIcon,
  ShoppingBagIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
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

const activity = [
  { id: "1", title: "New order", meta: "ILU-9K2M · Mama Put Palace", time: "2m" },
  { id: "2", title: "Store went live", meta: "Crisp Bites", time: "18m" },
  { id: "3", title: "Payout sent", meta: "₦340,000 · 4 stores", time: "1h" },
  { id: "4", title: "Refund approved", meta: "ILU-8JFL · Customer request", time: "2h" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)] sm:text-[26px]">
            Overview
          </h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
            Snapshot of IluEats operations — numbers are illustrative until backend
            wiring is in place.
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
            Recent events (mock)
          </p>
          <ul className="mt-4 space-y-3">
            {activity.map((a) => (
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
