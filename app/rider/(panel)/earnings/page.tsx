import { BanknotesIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import { formatPrice } from "@/lib/utils";

const breakdown = [
  { label: "Base payouts", amount: 18400 },
  { label: "Peak bonuses", amount: 2100 },
  { label: "Tips from customers", amount: 1200 },
];

export default function RiderEarningsPage() {
  const total = breakdown.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)]">
          Earnings
        </h1>
        <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
          Payout preview for this week (mock totals).
        </p>
      </div>

      <section className="rounded-[1.25rem] bg-[var(--color-surface)] p-5 shadow-crisp ring-1 ring-[var(--color-line)]">
        <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          <CalendarDaysIcon className="h-4 w-4" />
          This week
        </div>
        <p className="mt-3 text-[34px] font-extrabold tabular-nums tracking-tight text-[var(--color-ink)]">
          {formatPrice(total)}
        </p>
        <p className="mt-1 text-[12px] font-medium text-[var(--color-ink-muted)]">
          Est. settlement Friday · vendor rules apply
        </p>
      </section>

      <ul className="space-y-2">
        {breakdown.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/60 px-4 py-3"
          >
            <span className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-ink)]">
              <BanknotesIcon className="h-4 w-4 text-emerald-600" />
              {row.label}
            </span>
            <span className="text-[14px] font-extrabold text-[var(--color-ink)]">
              {formatPrice(row.amount)}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="h-12 w-full rounded-full bg-emerald-600 text-[14px] font-bold text-white shadow-[0_6px_16px_-4px_rgba(5,150,105,0.45)]"
      >
        Download statement
      </button>
    </div>
  );
}
