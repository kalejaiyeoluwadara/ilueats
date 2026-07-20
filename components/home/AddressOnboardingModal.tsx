"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  MapPicker,
  DEFAULT_MAP_CENTER,
  type LatLng,
} from "@/components/ui/MapPicker";
import { AddressAutocomplete } from "@/components/ui/AddressAutocomplete";
import { useAddresses } from "@/hooks/useAddresses";
import { useToast } from "@/hooks/useToast";
import type { PlaceDetails } from "@/lib/api/geocoding";
import { cn } from "@/lib/utils";

const LABEL_PRESETS = ["Home", "Work", "Other"];

/**
 * First-run address capture, shown on the home page to authenticated users who
 * have no saved address yet. Keeps the friction low — search for the address,
 * with an optional map pin to fine-tune the drop-off. Search is already limited
 * to the Ilisan-Remo service area, so no manual "am I in the area?" tick is
 * needed.
 */
export function AddressOnboardingModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addAddress } = useAddresses();
  const { success, error: showError } = useToast();

  const [label, setLabel] = useState("Home");
  const [addressLine, setAddressLine] = useState("");
  const [phone, setPhone] = useState("");
  // The pin we'll save. Seeded by the picked suggestion, refinable by dragging.
  const [pin, setPin] = useState<LatLng | null>(null);

  // A picked suggestion fills the editable address line and drops the pin on its
  // coordinates — the customer can still add room/gate details and nudge the pin.
  const handlePlaceSelect = (place: PlaceDetails) => {
    setAddressLine(place.address);
    setPin({ lat: place.lat, lng: place.lng });
  };

  const addressOk = addressLine.trim().length >= 5;
  const canSave = addressOk;

  const save = () => {
    if (!addressOk) {
      showError("Address too short", "Add house/room, street and a landmark.");
      return;
    }
    addAddress({
      label: label.trim() || "Home",
      addressLine: addressLine.trim(),
      phone: phone.trim() || undefined,
      makeDefault: true,
      geo: pin,
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
            Find your address
          </span>
          <AddressAutocomplete onSelect={handlePlaceSelect} />
        </div>

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
            placeholder="Pick from search above, or type it — room / house no, hall or street, nearest landmark"
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

        {/* No pin yet? Let the customer drop one and drag it to their door —
            a fallback when search can't resolve their exact spot. */}
        {!pin && (
          <button
            type="button"
            onClick={() => setPin(DEFAULT_MAP_CENTER)}
            className="text-left text-[12px] font-bold text-[var(--color-primary)]"
          >
            Drop a pin on the map (optional)
          </button>
        )}

        {/* Map view — appears once there's a pin (from search or a manual drop)
            so the customer can nudge it onto the exact gate/door. */}
        {pin && <MapPicker value={pin} center={pin} onChange={setPin} />}
      </div>
    </Modal>
  );
}
