"use client";

import { useState } from "react";
import {
  CheckCircleIcon,
  DocumentTextIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function RiderProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [docsOpen, setDocsOpen] = useState(false);
  const [idUploaded, setIdUploaded] = useState(false);
  const [vehicleUploaded, setVehicleUploaded] = useState(false);
  const [insuranceUploaded, setInsuranceUploaded] = useState(false);

  const doneCount = [idUploaded, vehicleUploaded, insuranceUploaded].filter(
    Boolean
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)]">
          Profile
        </h1>
        <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
          Linked to your rider account session.
        </p>
      </div>

      <section className="rounded-[1.25rem] bg-[var(--color-surface)] p-5 shadow-crisp ring-1 ring-[var(--color-line)]">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80">
            <UserIcon className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <p className="text-[16px] font-extrabold text-[var(--color-ink)]">
              {user?.name ?? "Rider"}
            </p>
            <p className="truncate text-[13px] font-medium text-[var(--color-ink-muted)]">
              {user?.email}
            </p>
            <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-200/80">
              Verified rider · Ilisan
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.25rem] bg-[var(--color-surface)] p-5 shadow-crisp ring-1 ring-[var(--color-line)]">
        <h2 className="text-[13px] font-extrabold text-[var(--color-ink)]">
          Vehicle &amp; documents
        </h2>
        <p className="mt-0.5 text-[12px] text-[var(--color-ink-muted)]">
          {doneCount}/3 checklist items marked (stored until refresh — demo).
        </p>
        <Button
          type="button"
          variant="outline"
          fullWidth
          className="mt-4"
          size="md"
          leftIcon={<DocumentTextIcon className="h-4 w-4" />}
          onClick={() => setDocsOpen(true)}
        >
          Manage documents
        </Button>
      </section>

      <Button
        type="button"
        variant="danger"
        fullWidth
        size="lg"
        onClick={() => {
          signOut();
          router.push("/rider/login");
        }}
      >
        Sign out everywhere on this device
      </Button>

      <Modal
        open={docsOpen}
        onClose={() => setDocsOpen(false)}
        title="Documents"
        description="Toggle items to simulate uploads — no files are stored."
        footer={
          <Button type="button" fullWidth size="md" onClick={() => setDocsOpen(false)}>
            Done
          </Button>
        }
      >
        <ul className="space-y-2">
          <DocRow
            label="Government ID"
            description="NIN / driver's licence"
            checked={idUploaded}
            onToggle={() => setIdUploaded((v) => !v)}
          />
          <DocRow
            label="Vehicle details"
            description="Plate + make / model"
            checked={vehicleUploaded}
            onToggle={() => setVehicleUploaded((v) => !v)}
          />
          <DocRow
            label="Third-party insurance"
            description="Policy snapshot"
            checked={insuranceUploaded}
            onToggle={() => setInsuranceUploaded((v) => !v)}
          />
        </ul>
      </Modal>
    </div>
  );
}

function DocRow({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-colors",
          checked
            ? "border-emerald-200 bg-emerald-50/70 ring-1 ring-emerald-200/80"
            : "border-[var(--color-line)] bg-[var(--color-bg)]/50 hover:bg-black/[0.02]"
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
            checked
              ? "bg-emerald-600 text-white"
              : "bg-white text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)]"
          )}
        >
          <CheckCircleIcon className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-[13px] font-bold text-[var(--color-ink)]">
            {label}
          </span>
          <span className="mt-0.5 block text-[12px] text-[var(--color-ink-muted)]">
            {description}
          </span>
          <span className="mt-1 inline-block text-[11px] font-semibold text-emerald-700">
            {checked ? "Marked uploaded" : "Tap to toggle"}
          </span>
        </span>
      </button>
    </li>
  );
}
