"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function AdminSettingsPage() {
  const [fee, setFee] = useState("12");
  const [zone, setZone] = useState("ilisan-core");

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
          Toggle rows styled as switches — no runtime effect yet.
        </p>
        <ul className="mt-5 divide-y divide-[var(--color-line)] rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/50">
          <FlagRow
            title="Scheduled orders"
            description="Let customers pick a later delivery window."
            on
          />
          <FlagRow
            title="Pickup mode"
            description="Show pickup option on the storefront."
          />
          <FlagRow
            title="Referral rewards"
            description="Invite-a-friend credits for first order."
            on
          />
        </ul>
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
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          on ? "bg-[var(--color-primary)]" : "bg-zinc-300"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </li>
  );
}
