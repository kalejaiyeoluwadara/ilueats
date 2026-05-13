"use client";

import { useMemo, useState } from "react";
import { BanknotesIcon, CalendarDaysIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import {
  RiderOrderBagSummary,
} from "@/components/rider/RiderOrderBag";
import { useRiderConsole } from "@/context/RiderConsoleContext";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useToast } from "@/hooks/useToast";
import { formatPrice } from "@/lib/utils";

const LEDGER_PAGE_SIZE = 5;

export default function RiderEarningsPage() {
  const { tipsToday, jobs } = useRiderConsole();
  const { success } = useToast();
  const [downloadOpen, setDownloadOpen] = useState(false);

  const doneJobs = useMemo(
    () =>
      [...jobs]
        .filter((j) => j.status === "done")
        .sort((a, b) => b.id.localeCompare(a.id)),
    [jobs]
  );

  const {
    page: ledgerPage,
    setPage: setLedgerPage,
    pageCount: ledgerPageCount,
    pageItems: ledgerPageItems,
    total: ledgerTotal,
    pageSize: ledgerPageSize,
  } = usePaginatedList(doneJobs, LEDGER_PAGE_SIZE);

  const breakdown = useMemo(
    () => [
      { label: "Base payouts", amount: 18_400 },
      { label: "Peak bonuses", amount: 2100 },
      { label: "Tips from customers", amount: tipsToday },
    ],
    [tipsToday]
  );

  const total = useMemo(
    () => breakdown.reduce((s, r) => s + r.amount, 0),
    [breakdown]
  );

  const onDownload = () => {
    setDownloadOpen(false);
    success("Statement ready", "Saved as ilueats-rider-statement-demo.pdf (simulated).");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)]">
          Earnings
        </h1>
        <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
          Tips update when you complete drops. Other lines are sample figures.
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
          Est. settlement Friday · demo totals
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

      <section className="space-y-3 rounded-[1.25rem] bg-[var(--color-surface)] p-5 shadow-crisp ring-1 ring-[var(--color-line)]">
        <h2 className="text-[12px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Completed drops (live queue)
        </h2>
        <ul className="space-y-2">
          {ledgerPageItems.map((j) => (
            <li
              key={j.id}
              className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/60 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-[12px] font-bold text-emerald-700">
                  {j.id}
                </p>
                <p className="text-[13px] font-extrabold tabular-nums text-[var(--color-ink)]">
                  {formatPrice(j.payout)}
                </p>
              </div>
              <p className="mt-1 text-[13px] font-bold text-[var(--color-ink)]">
                {j.store}
              </p>
              <p className="mt-1 flex items-start gap-1.5 text-[12px] font-medium text-[var(--color-ink-muted)]">
                <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600/90" />
                {j.customer} · {j.address}
              </p>
              <RiderOrderBagSummary items={j.lineItems} className="mt-2 border-t border-[var(--color-line)] pt-2" />
            </li>
          ))}
        </ul>
        <Pagination
          page={ledgerPage}
          pageCount={ledgerPageCount}
          totalItems={ledgerTotal}
          pageSize={ledgerPageSize}
          onPageChange={setLedgerPage}
        />
      </section>

      <button
        type="button"
        onClick={() => setDownloadOpen(true)}
        className="h-12 w-full rounded-full bg-emerald-600 text-[14px] font-bold text-white shadow-[0_6px_16px_-4px_rgba(5,150,105,0.45)] active:scale-[0.99]"
      >
        Download statement
      </button>

      <Modal
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        title="Download weekly statement?"
        description="Generates a PDF summary for your records (demo)."
        footer={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              size="md"
              onClick={() => setDownloadOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" fullWidth size="md" onClick={onDownload}>
              Download
            </Button>
          </div>
        }
      >
        <p className="text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
          In production this would include job IDs, distance bands, and
          adjustments. Here we only confirm the action and show a success
          toast.
        </p>
      </Modal>
    </div>
  );
}
