"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPinIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import { ContentLoader } from "@/components/ui/Loaders";
import { useAddresses } from "@/hooks/useAddresses";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import type { SavedAddress } from "@/types";

const LABEL_PRESETS = ["Home", "Work", "Other"];

export default function AddressesPage() {
  const {
    addresses,
    ready,
    addAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
  } = useAddresses();
  const { success, error: showError } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [phone, setPhone] = useState("");
  const [makeDefault, setMakeDefault] = useState(true);

  const resetForm = () => {
    setEditingId(null);
    setLabel("");
    setAddressLine("");
    setPhone("");
    setFormOpen(false);
  };

  const openAdd = () => {
    setEditingId(null);
    setLabel("");
    setAddressLine("");
    setPhone("");
    setMakeDefault(addresses.length === 0);
    setFormOpen(true);
  };

  const openEdit = (a: SavedAddress) => {
    setEditingId(a.id);
    setLabel(a.label);
    setAddressLine(a.addressLine);
    setPhone(a.phone ?? "");
    setMakeDefault(a.isDefault);
    setFormOpen(true);
  };

  const save = () => {
    if (label.trim().length < 1) {
      showError("Missing label", "Give this address a name (e.g. Home).");
      return;
    }
    if (addressLine.trim().length < 5) {
      showError("Address too short", "Enter a full delivery address.");
      return;
    }
    if (editingId) {
      updateAddress(editingId, {
        label: label.trim(),
        addressLine: addressLine.trim(),
        phone: phone.trim() || undefined,
        isDefault: makeDefault,
      });
      success("Address updated");
    } else {
      addAddress({
        label: label.trim(),
        addressLine: addressLine.trim(),
        phone: phone.trim() || undefined,
        makeDefault,
      });
      success("Address saved");
    }
    resetForm();
  };

  const onRemove = (a: SavedAddress) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Remove “${a.label}” from saved addresses?`)
    ) {
      return;
    }
    removeAddress(a.id);
    success("Address removed");
  };

  return (
    <div className="min-h-screen pb-28">
      <Navbar variant="page" title="Saved addresses" showSearch={false} />
      <main className="mx-auto max-w-2xl px-4 pt-4">
        {!ready ? (
          <ContentLoader message="Loading your addresses…" className="py-12" />
        ) : (
          <>
            {formOpen && (
              <section className="mb-4 rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
                <h2 className="text-[15px] font-extrabold tracking-tight text-[var(--color-ink)]">
                  {editingId ? "Edit address" : "New address"}
                </h2>
                <div className="mt-3 space-y-3">
                  <div>
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                      Label
                    </span>
                    <div className="mb-2 flex flex-wrap gap-1.5">
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
                    <input
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="e.g. Mum's house"
                      className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
                    />
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                      Delivery address
                    </span>
                    <textarea
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      placeholder="House no, street, landmark, Ilisan"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                      Phone (optional)
                    </span>
                    <input
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Uses this number when you pick this address at checkout"
                      className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
                    />
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={makeDefault}
                      onChange={(e) => setMakeDefault(e.target.checked)}
                      className="h-4 w-4 rounded border-[var(--color-line)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]/40"
                    />
                    <span className="text-[13px] font-medium text-[var(--color-ink)]">
                      Use as default for new orders
                    </span>
                  </label>
                  <div className="flex gap-2 pt-1">
                    <Button type="button" size="md" onClick={save}>
                      {editingId ? "Save changes" : "Save address"}
                    </Button>
                    <Button type="button" variant="ghost" size="md" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </section>
            )}

            {!formOpen && addresses.length === 0 ? (
              <div className="flex flex-col items-center px-2 pt-12 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary-soft)]">
                  <MapPinIcon className="h-9 w-9 text-[var(--color-primary)]" />
                </div>
                <h1 className="font-display mt-5 text-[20px] font-extrabold tracking-tight">
                  No saved addresses
                </h1>
                <p className="mt-1.5 max-w-xs text-[13.5px] text-[var(--color-ink-muted)]">
                  Add your home or work address once — we&apos;ll fill it in at checkout
                  for you.
                </p>
                <Button type="button" size="lg" className="mt-6" onClick={openAdd}>
                  Add address
                </Button>
              </div>
            ) : !formOpen ? (
              <ul className="space-y-3">
                {addresses.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[15px] font-extrabold text-[var(--color-ink)]">
                            {a.label}
                          </h3>
                          {a.isDefault && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-primary)]">
                              <StarSolid className="h-3 w-3" />
                              Default
                            </span>
                          )}
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-snug text-[var(--color-ink-muted)]">
                          {a.addressLine}
                        </p>
                        {a.phone ? (
                          <p className="mt-1.5 text-[13px] font-semibold text-[var(--color-ink)]">
                            {a.phone}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {!a.isDefault && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDefaultAddress(a.id);
                            success("Default address updated");
                          }}
                        >
                          Set as default
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(a)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        leftIcon={<TrashIcon className="h-4 w-4" />}
                        onClick={() => onRemove(a)}
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            {!formOpen && addresses.length > 0 && (
              <button
                type="button"
                onClick={openAdd}
                className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom,0px)+72px)] z-30 mx-auto flex max-w-2xl items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] py-3.5 text-[15px] font-bold text-white shadow-[0_6px_20px_-4px_rgba(232,84,26,0.55)] sm:relative sm:inset-auto sm:bottom-auto sm:mt-4 sm:w-full"
              >
                <PlusIcon className="h-5 w-5" />
                Add address
              </button>
            )}

            <p className="mt-6 text-center text-[11px] font-medium text-[var(--color-ink-soft)] sm:mt-8">
              Saved on this device only — not synced to a server yet.
            </p>
            <Link
              href="/account"
              className="mt-3 block text-center text-[13px] font-semibold text-[var(--color-primary)]"
            >
              Back to account
            </Link>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
