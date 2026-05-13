import Link from "next/link";
import {
  BoltIcon,
  ClockIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { formatPrice } from "@/lib/utils";

const nextJob = {
  id: "ILU-9K2M",
  store: "Mama Put Palace",
  drop: "Babcock University gate",
  pay: 850,
  etaMin: 6,
};

export default function RiderTodayPage() {
  return (
    <div className="space-y-6 flex-1 w-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)]">
            Today
          </h1>
          <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
            Stay online to receive the next batch from dispatch.
          </p>
        </div>
        <OnlineToggle />
      </div>

      <section className="rounded-[1.25rem] bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white shadow-lg shadow-emerald-900/20">
        <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-100/90">
          Next up
        </p>
        <p className="mt-2 font-mono text-[13px] font-bold opacity-95">
          {nextJob.id}
        </p>
        <p className="mt-3 text-[15px] font-extrabold leading-snug">{nextJob.store}</p>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-emerald-50/95">
          <MapPinIcon className="h-4 w-4 shrink-0 opacity-90" />
          {nextJob.drop}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-bold backdrop-blur-sm">
            Earn ~{formatPrice(nextJob.pay)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[12px] font-bold">
            <ClockIcon className="h-4 w-4" />
            Pick up in ~{nextJob.etaMin} min
          </span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="h-11 rounded-full bg-white text-[13px] font-bold text-emerald-800 shadow-sm"
          >
            Accept
          </button>
          <button
            type="button"
            className="h-11 rounded-full bg-emerald-950/25 text-[13px] font-bold text-white ring-1 ring-white/20"
          >
            Skip
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Completed" value="7" hint="Today's drops" />
        <Stat label="On-time" value="94%" hint="Rolling 7d" />
        <Stat label="Tips" value={formatPrice(1200)} hint="So far today" />
      </section>

      <p className="text-center text-[11px] font-medium text-[var(--color-ink-soft)]">
        Dispatch data is mock UI — hook to live jobs when the backend is ready.
      </p>

      <Link
        href="/rider/deliveries"
        className="block rounded-2xl bg-[var(--color-surface)] p-4 text-center text-[13px] font-bold text-emerald-800 ring-1 ring-[var(--color-line)] hover:bg-emerald-50/50"
      >
        Open delivery queue →
      </Link>
    </div>
  );
}

function OnlineToggle() {
  return (
    <div className="flex items-center gap-2 rounded-full bg-emerald-50 py-1.5 pl-3 pr-1.5 ring-1 ring-emerald-200/90">
      <BoltIcon className="h-4 w-4 text-emerald-600" />
      <span className="text-[12px] font-bold text-emerald-900">Online</span>
      <button
        type="button"
        className="relative h-7 w-12 rounded-full bg-emerald-600 transition-colors"
        aria-pressed="true"
      >
        <span className="absolute right-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform" />
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
