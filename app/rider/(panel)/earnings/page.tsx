"use client";

import { useCallback, useEffect, useState } from "react";
import { BanknotesIcon, CalendarDaysIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { PageLoader } from "@/components/ui/Loaders";
import { ErrorState } from "@/components/ui/EmptyState";
import { RiderOrderBagSummary } from "@/components/rider/RiderOrderBag";
import {
  getRiderEarningsSummary,
  getRiderEarningsLedger,
  downloadRiderStatement,
} from "@/lib/api/rider";
import type { RiderEarningsSummary } from "@/lib/api/rider";
import { ApiError } from "@/lib/api/client";
import { useToast } from "@/hooks/useToast";
import { formatPrice } from "@/lib/utils";
import type { RiderJob } from "@/types";

const LEDGER_PAGE_SIZE = 5;

export default function RiderEarningsPage() {
  const { success, error: toastError } = useToast();
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [summary, setSummary] = useState<RiderEarningsSummary | null>(null);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerItems, setLedgerItems] = useState<RiderJob[]>([]);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledgerPageCount, setLedgerPageCount] = useState(1);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [summaryRes, ledgerRes] = await Promise.all([
        getRiderEarningsSummary(),
        getRiderEarningsLedger({ page: ledgerPage, pageSize: LEDGER_PAGE_SIZE }),
      ]);
      setSummary(summaryRes);
      setLedgerItems(ledgerRes.items);
      setLedgerTotal(ledgerRes.totalItems);
      setLedgerPageCount(ledgerRes.pageCount);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load earnings.");
    } finally {
      setReady(true);
    }
  }, [ledgerPage]);

  useEffect(() => {
    load();
  }, [load]);

  const onDownload = async () => {
    setDownloading(true);
    try {
      await downloadRiderStatement();
      setDownloadOpen(false);
      success("Statement downloaded", "Saved to your downloads folder.");
    } catch {
      toastError("Couldn't download", "Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (!ready) return <PageLoader fillScreen={false} />;
  if (error || !summary) return <ErrorState message={error ?? undefined} onRetry={load} />;

  const breakdown = [
    { label: "Base payouts", amount: summary.basePayouts },
    { label: "Peak bonuses", amount: summary.peakBonuses },
    { label: "Tips from customers", amount: summary.tips },
  ];
  const total = breakdown.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)]">
          Earnings
        </h1>
        <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
          Updates as you complete drops today.
        </p>
      </div>

      <section className="rounded-[1.25rem] bg-[var(--color-surface)] p-5 shadow-crisp ring-1 ring-[var(--color-line)]">
        <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          <CalendarDaysIcon className="h-4 w-4" />
          Today
        </div>
        <p className="mt-3 text-[34px] font-extrabold tabular-nums tracking-tight text-[var(--color-ink)]">
          {formatPrice(total)}
        </p>
        <p className="mt-1 text-[12px] font-medium text-[var(--color-ink-muted)]">
          {summary.deliveriesToday} delivered · {summary.onTimePercent}% on-time
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
          Completed drops
        </h2>
        {ledgerItems.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-[var(--color-ink-muted)]">
            No completed drops yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {ledgerItems.map((j) => (
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
        )}
        {ledgerTotal > 0 ? (
          <Pagination
            page={ledgerPage}
            pageCount={ledgerPageCount}
            totalItems={ledgerTotal}
            pageSize={LEDGER_PAGE_SIZE}
            onPageChange={setLedgerPage}
          />
        ) : null}
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
        onClose={() => !downloading && setDownloadOpen(false)}
        title="Download statement?"
        description="Generates a CSV of your completed drops for your records."
        footer={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              size="md"
              onClick={() => setDownloadOpen(false)}
              disabled={downloading}
            >
              Cancel
            </Button>
            <Button type="button" fullWidth size="md" loading={downloading} onClick={onDownload}>
              Download
            </Button>
          </div>
        }
      >
        <p className="text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
          Includes job IDs, store, customer, payout, tip, and delivery time for
          every drop you&apos;ve completed.
        </p>
      </Modal>
    </div>
  );
}
