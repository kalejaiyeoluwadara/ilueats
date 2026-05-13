import { MapPinIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { formatPrice } from "@/lib/utils";

type JobStatus = "pickup" | "en_route" | "done";

const jobs: {
  id: string;
  store: string;
  customer: string;
  address: string;
  payout: number;
  status: JobStatus;
}[] = [
  {
    id: "ILU-9K2M",
    store: "Crisp Bites",
    customer: "Temi A.",
    address: "Opic Estate — Block C",
    payout: 520,
    status: "pickup",
  },
  {
    id: "ILU-9K2H",
    store: "SmoothCity",
    customer: "Chidi O.",
    address: "Babcock gate",
    payout: 480,
    status: "en_route",
  },
  {
    id: "ILU-9K2G",
    store: "Slice House",
    customer: "Anita I.",
    address: "Campus roundabout",
    payout: 610,
    status: "done",
  },
];

const statusLabel: Record<JobStatus, string> = {
  pickup: "At store",
  en_route: "En route",
  done: "Delivered",
};

export default function RiderDeliveriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)]">
          Deliveries
        </h1>
        <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
          Your queue — tap actions are preview-only.
        </p>
      </div>

      <ul className="space-y-3">
        {jobs.map((j) => (
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
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[14px] font-extrabold text-[var(--color-ink)]">
                {formatPrice(j.payout)}
                <span className="text-[11px] font-semibold text-[var(--color-ink-muted)]">
                  {" "}
                  est. payout
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[12px] font-bold text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)]"
                >
                  <PhoneIcon className="h-4 w-4" />
                  Call
                </button>
                {j.status !== "done" ? (
                  <button
                    type="button"
                    className="h-10 rounded-full bg-emerald-600 px-4 text-[12px] font-bold text-white"
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
          </li>
        ))}
      </ul>
    </div>
  );
}
