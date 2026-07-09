"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BoltIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { PageLoader } from "@/components/ui/Loaders";
import { ErrorState } from "@/components/ui/EmptyState";
import {
  RiderOrderBagDetails,
  RiderOrderBagSummary,
} from "@/components/rider/RiderOrderBag";
import { useRiderConsole } from "@/context/RiderConsoleContext";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useToast } from "@/hooks/useToast";
import { formatPrice } from "@/lib/utils";
import type { RiderOffer } from "@/types";

const OFFERS_PAGE_SIZE = 5;

export default function RiderTodayPage() {
  const {
    ready,
    error,
    refresh,
    isOnline,
    setOnline,
    availableOffers,
    deliveriesToday,
    tipsToday,
    onTimePercent,
    acceptOffer,
  } = useRiderConsole();
  const { success, info, error: toastError } = useToast();
  const [confirmOffer, setConfirmOffer] = useState<RiderOffer | null>(null);
  const [offerBagModal, setOfferBagModal] = useState<RiderOffer | null>(null);
  const [accepting, setAccepting] = useState(false);

  const {
    page: offersPage,
    setPage: setOffersPage,
    pageCount: offersPageCount,
    pageItems: offerPageItems,
    total: offerTotal,
    pageSize: offerPageSize,
  } = usePaginatedList(availableOffers, OFFERS_PAGE_SIZE);

  const completeAccept = async () => {
    if (!confirmOffer) return;
    const id = confirmOffer.id;
    setAccepting(true);
    const ok = await acceptOffer(id);
    setAccepting(false);
    setConfirmOffer(null);
    if (ok) {
      success("Offer accepted", `${id} added to your queue.`);
    } else {
      info("Can't accept", "That job may have just been taken or you're offline.");
    }
  };

  if (!ready) return <PageLoader fillScreen={false} />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)]">
            Today
          </h1>
          <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
            Pick an open offer and confirm to add it to your run.
          </p>
        </div>
        <OnlineToggle
          online={isOnline}
          onChange={async (next) => {
            try {
              await setOnline(next);
              if (!next) info("You're offline", "You won't receive new offers.");
              else success("You're online", "New offers can find you.");
            } catch {
              toastError("Couldn't update status", "Please try again.");
            }
          }}
        />
      </div>

      {!isOnline ? (
        <section className="rounded-[1.25rem] border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center shadow-crisp">
          <p className="text-[15px] font-extrabold text-[var(--color-ink)]">
            {"You're offline"}
          </p>
          <p className="mt-2 text-[13px] text-[var(--color-ink-muted)]">
            {"Turn on when you're ready to browse and accept offers."}
          </p>
        </section>
      ) : availableOffers.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-[12px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Open offers ({availableOffers.length})
            </h2>
          </div>
          <ul className="space-y-3" role="list">
            {offerPageItems.map((o) => (
              <li
                key={o.id}
                className="rounded-[1.15rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-crisp ring-1 ring-black/[0.02]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[12px] font-bold text-emerald-700">
                      {o.id}
                    </p>
                    <p className="mt-1 text-[15px] font-extrabold leading-snug text-[var(--color-ink)]">
                      {o.store}
                    </p>
                    <p className="mt-2 flex items-start gap-1.5 text-[13px] font-medium text-[var(--color-ink-muted)]">
                      <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600/90" />
                      <span>{o.drop}</span>
                    </p>
                    <p className="mt-1 text-[12.5px] font-semibold text-[var(--color-ink)]">
                      {o.customer}
                    </p>
                    <RiderOrderBagSummary items={o.lineItems} className="mt-2" />
                    <button
                      type="button"
                      onClick={() => setOfferBagModal(o)}
                      className="mt-2 inline-flex h-8 items-center gap-1 rounded-full bg-emerald-50 px-3 text-[11px] font-bold text-emerald-900 ring-1 ring-emerald-200/80"
                    >
                      <ClipboardDocumentListIcon className="h-4 w-4" />
                      View basket
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-900 ring-1 ring-emerald-200/80">
                    ~{formatPrice(o.pay)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-ink-muted)] ring-1 ring-[var(--color-line)]">
                    <ClockIcon className="h-3.5 w-3.5" />
                    Pick up ~{o.etaMin} min
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmOffer(o)}
                  className="mt-4 h-11 w-full rounded-full bg-emerald-600 text-[13px] font-bold text-white shadow-[0_6px_14px_-4px_rgba(5,150,105,0.45)] active:scale-[0.99]"
                >
                  Accept
                </button>
              </li>
            ))}
          </ul>
          <Pagination
            page={offersPage}
            pageCount={offersPageCount}
            totalItems={offerTotal}
            pageSize={offerPageSize}
            onPageChange={setOffersPage}
            className="pt-3"
          />
        </section>
      ) : (
        <section className="rounded-[1.25rem] bg-[var(--color-surface)] p-6 text-center shadow-crisp ring-1 ring-[var(--color-line)]">
          <p className="text-[15px] font-extrabold text-[var(--color-ink)]">
            No open offers right now
          </p>
          <p className="mt-2 text-[13px] text-[var(--color-ink-muted)]">
            {
              "You're caught up — check your active deliveries or check back soon."
            }
          </p>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Completed"
          value={String(deliveriesToday)}
          hint="Today's drops"
        />
        <Stat label="On-time" value={onTimePercent} hint="Rolling 7d" />
        <Stat label="Tips" value={formatPrice(tipsToday)} hint="So far today" />
      </section>

      <Link
        href="/rider/deliveries"
        className="block rounded-2xl bg-[var(--color-surface)] p-4 text-center text-[13px] font-bold text-emerald-800 ring-1 ring-[var(--color-line)] hover:bg-emerald-50/50"
      >
        Open delivery queue →
      </Link>

      <Modal
        open={!!confirmOffer}
        onClose={() => setConfirmOffer(null)}
        title="Accept this offer?"
        description={
          confirmOffer
            ? `You'll be assigned ${confirmOffer.id} at ${confirmOffer.store}.`
            : undefined
        }
        footer={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              size="md"
              onClick={() => setConfirmOffer(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              fullWidth
              size="md"
              loading={accepting}
              onClick={completeAccept}
            >
              Confirm accept
            </Button>
          </div>
        }
      >
        {confirmOffer && (
          <div className="space-y-4">
            <ul className="space-y-2 text-[13px] text-[var(--color-ink-muted)]">
              <li>
                <span className="font-semibold text-[var(--color-ink)]">
                  Customer:{" "}
                </span>
                {confirmOffer.customer}
              </li>
              <li className="flex items-start gap-1.5">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{confirmOffer.drop}</span>
              </li>
              <li>
                <span className="font-semibold text-[var(--color-ink)]">
                  Est. payout:{" "}
                </span>
                {formatPrice(confirmOffer.pay)}
              </li>
              <li>
                <span className="font-semibold text-[var(--color-ink)]">
                  Pickup window:{" "}
                </span>
                ~{confirmOffer.etaMin} min
              </li>
            </ul>
            <RiderOrderBagDetails
              items={confirmOffer.lineItems}
              caption="You'll carry this bag once you accept — check it matches the store receipt."
            />
          </div>
        )}
      </Modal>

      <Modal
        open={!!offerBagModal}
        onClose={() => setOfferBagModal(null)}
        title="Offer basket"
        description={
          offerBagModal
            ? `${offerBagModal.id} · ${offerBagModal.store}`
            : undefined
        }
        footer={
          <Button type="button" fullWidth size="md" onClick={() => setOfferBagModal(null)}>
            Close
          </Button>
        }
      >
        {offerBagModal ? (
          <RiderOrderBagDetails
            items={offerBagModal.lineItems}
            caption={`Drop-off · ${offerBagModal.drop}`}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function OnlineToggle({
  online,
  onChange,
}: {
  online: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-emerald-50 py-1.5 pl-3 pr-1.5 ring-1 ring-emerald-200/90">
      <BoltIcon className="h-4 w-4 text-emerald-600" />
      <span className="text-[12px] font-bold text-emerald-900">
        {online ? "Online" : "Offline"}
      </span>
      <button
        type="button"
        onClick={() => onChange(!online)}
        className={`relative h-7 w-12 rounded-full transition-colors ${
          online ? "bg-emerald-600" : "bg-zinc-300"
        }`}
        aria-pressed={online}
        aria-label={online ? "Go offline" : "Go online"}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            online ? "right-0.5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[1.15rem] bg-[var(--color-surface)] p-4 shadow-crisp ring-1 ring-[var(--color-line)]">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
        {label}
      </p>
      <p className="mt-2 text-[22px] font-extrabold tabular-nums text-[var(--color-ink)]">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-[var(--color-ink-muted)]">
        {hint}
      </p>
    </div>
  );
}
