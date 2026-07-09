"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Loaders";
import { ErrorState } from "@/components/ui/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import { getRiderProfile, uploadRiderDocument } from "@/lib/api/rider";
import type {
  RiderProfile,
  RiderDocument,
  RiderDocumentType,
} from "@/lib/api/rider";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const DOC_TYPES: { type: RiderDocumentType; label: string; description: string }[] = [
  { type: "id", label: "Government ID", description: "NIN / driver's licence" },
  { type: "vehicle", label: "Vehicle details", description: "Plate + make / model" },
  { type: "insurance", label: "Third-party insurance", description: "Policy snapshot" },
];

export default function RiderProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { error: toastError } = useToast();
  const [docsOpen, setDocsOpen] = useState(false);

  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<RiderDocumentType | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingTypeRef = useRef<RiderDocumentType | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setProfile(await getRiderProfile());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load profile.");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const docByType = (type: RiderDocumentType): RiderDocument | undefined =>
    profile?.documents.find((d) => d.type === type);
  const doneCount = DOC_TYPES.filter((d) => docByType(d.type)).length;

  const triggerUpload = (type: RiderDocumentType) => {
    pendingTypeRef.current = type;
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const type = pendingTypeRef.current;
    e.target.value = "";
    if (!file || !type) return;

    setUploadingType(type);
    try {
      const updated = await uploadRiderDocument(type, file);
      setProfile(updated);
    } catch (err) {
      toastError(
        "Upload failed",
        err instanceof ApiError ? err.message : "Please try again."
      );
    } finally {
      setUploadingType(null);
    }
  };

  if (!ready) return <PageLoader fillScreen={false} />;
  if (error || !profile) {
    return <ErrorState message={error ?? undefined} onRetry={load} />;
  }

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
            <p
              className={cn(
                "mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1",
                profile.isOnline
                  ? "bg-emerald-50 text-emerald-800 ring-emerald-200/80"
                  : "bg-[var(--color-bg)] text-[var(--color-ink-soft)] ring-[var(--color-line)]"
              )}
            >
              {profile.isOnline ? "Online" : "Offline"}
              {profile.vehicleType ? ` · ${profile.vehicleType}` : ""}
              {profile.plateNumber ? ` · ${profile.plateNumber}` : ""}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.25rem] bg-[var(--color-surface)] p-5 shadow-crisp ring-1 ring-[var(--color-line)]">
        <h2 className="text-[13px] font-extrabold text-[var(--color-ink)]">
          Vehicle &amp; documents
        </h2>
        <p className="mt-0.5 text-[12px] text-[var(--color-ink-muted)]">
          {doneCount}/{DOC_TYPES.length} documents on file.
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
        onClick={async () => {
          await signOut();
          router.push("/rider/login");
        }}
      >
        Sign out everywhere on this device
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={onFileSelected}
      />

      <Modal
        open={docsOpen}
        onClose={() => setDocsOpen(false)}
        title="Documents"
        description="Upload a photo or PDF for each document — an admin reviews and verifies it."
        footer={
          <Button type="button" fullWidth size="md" onClick={() => setDocsOpen(false)}>
            Done
          </Button>
        }
      >
        <ul className="space-y-2">
          {DOC_TYPES.map(({ type, label, description }) => (
            <DocRow
              key={type}
              label={label}
              description={description}
              doc={docByType(type)}
              uploading={uploadingType === type}
              onUpload={() => triggerUpload(type)}
            />
          ))}
        </ul>
      </Modal>
    </div>
  );
}

const STATUS_META: Record<
  RiderDocument["status"],
  { label: string; icon: typeof CheckCircleIcon; className: string }
> = {
  pending: {
    label: "Pending review",
    icon: ClockIcon,
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80",
  },
  verified: {
    label: "Verified",
    icon: CheckCircleIcon,
    className: "bg-emerald-600 text-white",
  },
  rejected: {
    label: "Rejected — re-upload",
    icon: ExclamationCircleIcon,
    className: "bg-red-50 text-red-700 ring-1 ring-red-200/80",
  },
};

function DocRow({
  label,
  description,
  doc,
  uploading,
  onUpload,
}: {
  label: string;
  description: string;
  doc: RiderDocument | undefined;
  uploading: boolean;
  onUpload: () => void;
}) {
  const meta = doc ? STATUS_META[doc.status] : null;
  const Icon = meta?.icon ?? DocumentTextIcon;

  return (
    <li>
      <button
        type="button"
        onClick={onUpload}
        disabled={uploading}
        className={cn(
          "flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-colors disabled:opacity-60",
          doc
            ? "border-emerald-200 bg-emerald-50/70 ring-1 ring-emerald-200/80"
            : "border-[var(--color-line)] bg-[var(--color-bg)]/50 hover:bg-black/[0.02]"
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
            meta
              ? meta.className
              : "bg-white text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)]"
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-[13px] font-bold text-[var(--color-ink)]">
            {label}
          </span>
          <span className="mt-0.5 block text-[12px] text-[var(--color-ink-muted)]">
            {description}
          </span>
          <span className="mt-1 inline-block text-[11px] font-semibold text-emerald-700">
            {uploading ? "Uploading…" : meta ? meta.label : "Tap to upload"}
          </span>
        </span>
      </button>
    </li>
  );
}
