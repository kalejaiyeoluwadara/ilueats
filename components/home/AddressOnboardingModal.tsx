"use client";

import { useState } from "react";
import { MapPinIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAddresses } from "@/hooks/useAddresses";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

const LABEL_PRESETS = ["Home", "Work", "Other"];

/**
 * First-run address capture, shown on the home page to authenticated users who
 * have no saved address yet. Keeps the friction low — one address, an optional
 * GPS pin, and a required tick confirming they're inside the Ilisan-Remo
 * service area so we don't onboard customers we can't yet deliver to.
 */
export function AddressOnboardingModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addAddress } = useAddresses();
  const { status: geoStatus, reading: geo, request: requestGeo } =
    useGeolocation();
  const { success, error: showError } = useToast();

  const [label, setLabel] = useState("Home");
  const [addressLine, setAddressLine] = useState("");
  const [phone, setPhone] = useState("");
  const [inIlisan, setInIlisan] = useState(false);

  const addressOk = addressLine.trim().length >= 5;
  const canSave = addressOk && inIlisan;

  const save = () => {
    if (!addressOk) {
      showError("Address too short", "Add house/room, street and a landmark.");
      return;
    }
    if (!inIlisan) {
      showError(
        "Confirm your area",
        "Tick the box to confirm you're in Ilisan-Remo."
      );
      return;
    }
    addAddress({
      label: label.trim() || "Home",
      addressLine: addressLine.trim(),
      phone: phone.trim() || undefined,
      makeDefault: true,
      geo: geo ? { lat: geo.lat, lng: geo.lng } : null,
      inIlisan: true,
    });
    success("Address saved", "We'll fill it in for you at checkout.");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Where should we bring your food?"
      description="Save your spot once — we'll fill it in at checkout."
      footer={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="lg"
            className="flex-1"
            disabled={!canSave}
            onClick={save}
          >
            Save address
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={onClose}>
            Not now
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Label
          </span>
          <div className="flex flex-wrap gap-1.5">
            {LABEL_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setLabel(p)}
                className={cn(
                  "rounded-full px-3 py-1 text-[12px] font-semibold ring-1 transition-colors",
                  label === p
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] ring-[var(--color-primary)]/30"
                    : "bg-[var(--color-bg)] text-[var(--color-ink-muted)] ring-[var(--color-line)]"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Delivery address
          </span>
          <textarea
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            placeholder="Room / house no, hall or street, nearest landmark"
            rows={3}
            className="w-full resize-none rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Phone 
          </span>
          <input
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Rider calls this when close"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
          />
        </label>

        {/* Optional GPS pin — a bonus for accuracy, never required. */}
        <button
          type="button"
          onClick={requestGeo}
          disabled={geoStatus === "locating"}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl border border-dashed px-3 py-2.5 text-left transition disabled:opacity-60",
            geo
              ? "border-emerald-300 bg-emerald-50"
              : "border-[var(--color-line)] bg-[var(--color-bg)] hover:bg-black/[0.02]"
          )}
        >
          <MapPinIcon
            className={cn(
              "h-5 w-5 shrink-0",
              geo ? "text-emerald-600" : "text-[var(--color-primary)]"
            )}
          />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold text-[var(--color-ink)]">
              {geo
                ? `Pin added · ±${Math.round(geo.accuracy)}m`
                : geoStatus === "locating"
                  ? "Locating…"
                  : "Add a precise pin (optional)"}
            </span>
            <span className="block text-[12px] text-[var(--color-ink-muted)]">
              {geo
                ? `${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)} · tap to update`
                : "Helps the rider find you faster"}
            </span>
          </span>
        </button>

        {/* Service-area gate. */}
        <button
          type="button"
          onClick={() => setInIlisan((v) => !v)}
          className={cn(
            "flex w-full items-start gap-2.5 rounded-xl border px-3 py-3 text-left transition",
            inIlisan
              ? "border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)]"
              : "border-[var(--color-line)] bg-[var(--color-bg)]"
          )}
        >
          <CheckCircleIcon
            className={cn(
              "h-5 w-5 shrink-0",
              inIlisan ? "text-[var(--color-primary)]" : "text-[var(--color-ink-soft)]"
            )}
          />
          <span className="text-[13px] font-semibold leading-snug text-[var(--color-ink)]">
            I stay in Ilisan-Remo
            <span className="mt-0.5 block text-[12px] font-medium text-[var(--color-ink-muted)]">
              We currently deliver around Ilisan-Remo only.
            </span>
          </span>
        </button>
      </div>
    </Modal>
  );
}
