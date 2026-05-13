"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardDocumentListIcon,
  MapPinIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import {
  RiderOrderBagDetails,
  RiderOrderBagSummary,
} from "@/components/rider/RiderOrderBag";
import { useRiderConsole } from "@/context/RiderConsoleContext";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useToast } from "@/hooks/useToast";
import { cn, formatPrice, phoneToTelHref } from "@/lib/utils";
import type { RiderJob, RiderJobStatus } from "@/types";

const PAGE_SIZE = 5;

const statusLabel: Record<RiderJobStatus, string> = {
  pickup: "At store",
  en_route: "En route",
  done: "Delivered",
};

/** Narrow the queue for the rider UI (not persisted). */
type DeliveriesFilter =
  | "all"
  | "active"
  | RiderJobStatus;

const EMPTY_FILTER_COPY: Record<DeliveriesFilter, string> = {
  all:
    "No deliveries in your queue yet. Accept an offer from Today to get started.",
  active:
    "No active pickups or drop-offs. Completed work is under Delivered.",
  pickup: "Nothing waiting at a store right now.",
  en_route: "No orders on the road right now.",
  done: "No completed drops in your history yet.",
};

const FILTERS: { id: DeliveriesFilter; label: string; short?: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active", short: "Live" },
  { id: "pickup", label: "At store" },
  { id: "en_route", label: "En route" },
  { id: "done", label: "Delivered" },
];

function sortJobs(jobs: RiderJob[]) {
  const rank: Record<RiderJobStatus, number> = {
    pickup: 0,
    en_route: 1,
    done: 2,
  };
  return [...jobs].sort((a, b) => rank[a.status] - rank[b.status]);
}

function applyDeliveriesFilter(
  jobsSorted: RiderJob[],
  filter: DeliveriesFilter
): RiderJob[] {
  if (filter === "all") return jobsSorted;
  if (filter === "active") {
    return jobsSorted.filter((j) => j.status !== "done");
  }
  return jobsSorted.filter((j) => j.status === filter);
}

function countByFilter(jobs: RiderJob[], filter: DeliveriesFilter): number {
  if (filter === "all") return jobs.length;
  if (filter === "active") return jobs.filter((j) => j.status !== "done").length;
  return jobs.filter((j) => j.status === filter).length;
}

export default function RiderDeliveriesPage() {
  const { jobs, markPickedUp, markDelivered } = useRiderConsole();
  const { success, error: toastError } = useToast();
  const [filter, setFilter] = useState<DeliveriesFilter>("all");

  const sorted = useMemo(() => sortJobs(jobs), [jobs]);
  const filtered = useMemo(
    () => applyDeliveriesFilter(sorted, filter),
    [sorted, filter]
  );

  const {
    page,
    setPage,
    pageCount,
    pageItems: pageJobs,
    total: jobTotal,
    pageSize,
  } = usePaginatedList(filtered, PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filter, setPage]);

  const filterCounts = useMemo(() => {
    const m = new Map<DeliveriesFilter, number>();
    for (const f of FILTERS) {
      m.set(f.id, countByFilter(jobs, f.id));
    }
    return m;
  }, [jobs]);

  const [pickupModal, setPickupModal] = useState<RiderJob | null>(null);
  const [completeModal, setCompleteModal] = useState<RiderJob | null>(null);
  const [bagModal, setBagModal] = useState<RiderJob | null>(null);

  const onPrimary = (j: RiderJob) => {
    if (j.status === "pickup") {
      setPickupModal(j);
      return;
    }
    if (j.status === "en_route") {
      setCompleteModal(j);
    }
  };

  const confirmPickup = () => {
    if (!pickupModal) return;
    const id = pickupModal.id;
    const customer = pickupModal.customer;
    markPickedUp(id);
    setPickupModal(null);
    success("Picked up", `Heading to ${customer}.`);
  };

  const confirmDeliver = () => {
    if (!completeModal) return;
    const tip = markDelivered(completeModal.id);
    setCompleteModal(null);
    if (tip === null) {
      toastError("Couldn't complete", "This job wasn't out for delivery.");
      return;
    }
    success(
      "Delivered",
      `${completeModal.id} closed. Tip ~${formatPrice(tip)} added to your tally.`
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)]">
          Deliveries
        </h1>
        <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
          Active jobs first — actions sync across Today and Earnings.
        </p>
      </div>

      <div className="-mx-1">
        <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Filter
        </p>
        <div
          className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Filter deliveries by status"
        >
          {FILTERS.map((f) => {
            const count = filterCounts.get(f.id) ?? 0;
            const selected = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-bold transition-colors",
                  selected
                    ? "bg-emerald-600 text-white shadow-[0_4px_14px_-4px_rgba(5,150,105,0.55)]"
                    : "bg-[var(--color-surface)] text-[var(--color-ink)] ring-1 ring-[var(--color-line)] hover:bg-emerald-50/80"
                )}
              >
                <span className="sm:hidden">{f.short ?? f.label}</span>
                <span className="hidden sm:inline">{f.label}</span>
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

      {pageJobs.length === 0 ? (
        <div className="rounded-[1.15rem] border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] p-8 text-center shadow-crisp">
          <p className="text-[15px] font-extrabold text-[var(--color-ink)]">
            Nothing here
          </p>
          <p className="mt-2 text-[13px] text-[var(--color-ink-muted)]">
            {EMPTY_FILTER_COPY[filter]}
          </p>
        </div>
      ) : (
      <ul className="space-y-3">
        {pageJobs.map((j) => (
          <li
            key={j.id}
            className="rounded-[1.15rem] bg-[var(--color-surface)] p-4 shadow-crisp ring-1 ring-[var(--color-line)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-[12px] font-bold text-emerald-700">
                  {j.id}
                </p>
                <p className="mt-1 text-[14px] font-extrabold text-[var(--color-ink)]">
                  {j.store}
                </p>
                <p className="text-[12.5px] font-semibold text-[var(--color-ink-muted)]">
                  {j.customer}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-200/80">
                {statusLabel[j.status]}
              </span>
            </div>
            <p className="mt-3 flex items-start gap-2 text-[13px] font-medium text-[var(--color-ink)]">
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-ink-muted)]" />
              {j.address}
            </p>
            <RiderOrderBagSummary items={j.lineItems} className="mt-2" />
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setBagModal(j)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-bold text-emerald-900 ring-1 ring-inset ring-emerald-200/90 active:bg-emerald-50"
              >
                <ClipboardDocumentListIcon className="h-4 w-4" />
                Full basket
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[14px] font-extrabold text-[var(--color-ink)]">
                {formatPrice(j.payout)}
                <span className="text-[11px] font-semibold text-[var(--color-ink-muted)]">
                  {" "}
                  est. payout
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={phoneToTelHref(j.phone)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[12px] font-bold text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)] active:bg-[var(--color-bg)]"
                >
                  <PhoneIcon className="h-4 w-4" />
                  Call
                </a>
                {j.status !== "done" ? (
                  <button
                    type="button"
                    onClick={() => onPrimary(j)}
                    className="h-10 rounded-full bg-emerald-600 px-4 text-[12px] font-bold text-white active:scale-[0.98]"
                  >
                    {j.status === "pickup" ? "Picked up" : "Complete drop"}
                  </button>
                ) : (
                  <span className="inline-flex h-10 items-center px-2 text-[12px] font-bold text-[var(--color-success)]">
                    ✓ Done
                  </span>
                )}
              </div>
            </div>

            {j.status === "pickup" && (
              <p className="mt-3 text-[11px] font-medium text-[var(--color-ink-soft)]">
                Call is routed to the customer demo line ({j.phone}).
              </p>
            )}
          </li>
        ))}
      </ul>
      )}

      {jobTotal > 0 ? (
        <Pagination
          page={page}
          pageCount={pageCount}
          totalItems={jobTotal}
          pageSize={pageSize}
          onPageChange={setPage}
          className="pt-2"
        />
      ) : null}

      <Modal
        open={!!pickupModal}
        onClose={() => setPickupModal(null)}
        title="Mark as picked up?"
        description={
          pickupModal
            ? `Confirm you collected the order from ${pickupModal.store}`
            : undefined
        }
        footer={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              size="md"
              onClick={() => setPickupModal(null)}
            >
              Not yet
            </Button>
            <Button type="button" fullWidth size="md" onClick={confirmPickup}>
              Confirm pickup
            </Button>
          </div>
        }
      >
        {pickupModal && (
          <div className="space-y-4 text-[13px] text-[var(--color-ink-muted)]">
            <div className="space-y-2">
              <p>
                <span className="font-semibold text-[var(--color-ink)]">
                  Order:{" "}
                </span>
                <span className="font-mono">{pickupModal.id}</span>
              </p>
              <p>
                <span className="font-semibold text-[var(--color-ink)]">
                  Customer:{" "}
                </span>
                {pickupModal.customer}
              </p>
              <p className="flex items-start gap-1.5">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>Next stop: {pickupModal.address}</span>
              </p>
            </div>
            <RiderOrderBagDetails
              items={pickupModal.lineItems}
              caption="Verify this matches the ticket and bags from the store."
            />
          </div>
        )}
      </Modal>

      <Modal
        open={!!completeModal}
        onClose={() => setCompleteModal(null)}
        title="Complete delivery?"
        description={
          completeModal
            ? `Confirm handoff to ${completeModal.customer}`
            : undefined
        }
        footer={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              size="md"
              onClick={() => setCompleteModal(null)}
            >
              Not yet
            </Button>
            <Button type="button" fullWidth size="md" onClick={confirmDeliver}>
              Mark delivered
            </Button>
          </div>
        }
      >
        {completeModal && (
          <div className="space-y-4 text-[13px] text-[var(--color-ink-muted)]">
            <div className="space-y-2">
              <p>
                <span className="font-semibold text-[var(--color-ink)]">
                  Drop-off:{" "}
                </span>
                {completeModal.address}
              </p>
              <p>
                <span className="font-semibold text-[var(--color-ink)]">
                  Payout:{" "}
                </span>
                {formatPrice(completeModal.payout)}
              </p>
            </div>
            <RiderOrderBagDetails
              items={completeModal.lineItems}
              caption="Confirm the customer gets everything before you mark delivered."
            />
          </div>
        )}
      </Modal>

      <Modal
        open={!!bagModal}
        onClose={() => setBagModal(null)}
        title="Order basket"
        description={
          bagModal
            ? `${bagModal.id} · ${bagModal.store} · ${bagModal.customer}`
            : undefined
        }
        footer={
          <Button type="button" fullWidth size="md" onClick={() => setBagModal(null)}>
            Done
          </Button>
        }
      >
        {bagModal ? (
          <RiderOrderBagDetails
            items={bagModal.lineItems}
            caption="Use this list at pickup and again at the door."
          />
        ) : null}
      </Modal>
    </div>
  );
}
