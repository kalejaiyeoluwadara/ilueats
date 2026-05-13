"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { categories } from "@/data/mockData";
import { cn } from "@/lib/utils";
import type { CategoryId, Store } from "@/types";
import type { StoreUpsertPayload } from "@/lib/catalogStore";

export type StoreFormMode = "add" | "edit";

export interface AdminStoreUpsertModalProps {
  open: boolean;
  mode: StoreFormMode;
  initialStore?: Store | null;
  onClose: () => void;
  onSave: (payload: StoreUpsertPayload & { slug?: string }) => void;
}

type FormState = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  location: string;
  image: string;
  cover: string;
  deliveryFrom: string;
  deliveryTo: string;
  deliveryFee: string;
  minOrder: string;
  rating: string;
  reviews: string;
  orders7d: string;
  tagsRaw: string;
  isOpen: boolean;
  isFeatured: boolean;
  isNew: boolean;
};

const selectableCategories = categories.filter((c) => c.id !== "all");

function storeToForm(s: Store): FormState {
  return {
    name: s.name,
    slug: s.slug,
    tagline: s.tagline,
    description: s.description,
    location: s.location,
    image: s.image,
    cover: s.cover,
    deliveryFrom: String(s.deliveryTimeMins[0]),
    deliveryTo: String(s.deliveryTimeMins[1]),
    deliveryFee: String(s.deliveryFee),
    minOrder: String(s.minOrder),
    rating: String(s.rating),
    reviews: String(s.reviews),
    orders7d: String(typeof s.orders7d === "number" ? s.orders7d : 0),
    tagsRaw: (s.tags ?? []).join(", "),
    isOpen: s.isOpen,
    isFeatured: !!s.isFeatured,
    isNew: !!s.isNew,
  };
}

function defaultForm(): FormState {
  return {
    name: "",
    slug: "",
    tagline: "",
    description: "",
    location: "Ilisan-Remo",
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
    cover:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1600&q=80",
    deliveryFrom: "20",
    deliveryTo: "35",
    deliveryFee: "700",
    minOrder: "2000",
    rating: "4.6",
    reviews: "120",
    orders7d: "0",
    tagsRaw: "",
    isOpen: true,
    isFeatured: false,
    isNew: false,
  };
}

function parseNum(raw: string, fallback: number) {
  const n = Number(String(raw).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : fallback;
}

const field =
  "h-11 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3.5 text-[13px] font-medium text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]/35 focus:ring-2 focus:ring-[var(--color-primary)]/18";

export function AdminStoreUpsertModal({
  open,
  mode,
  initialStore,
  onClose,
  onSave,
}: AdminStoreUpsertModalProps) {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [catSelection, setCatSelection] = useState<CategoryId[]>(["snacks"]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    if (mode === "edit" && initialStore) {
      setForm(storeToForm(initialStore));
      setCatSelection(
        initialStore.categories.length
          ? initialStore.categories.filter((c) => c !== "all")
          : ["snacks"]
      );
      return;
    }
    setForm(defaultForm());
    setCatSelection(["snacks"]);
  }, [open, mode, initialStore]);

  const title = mode === "add" ? "Add store" : "Edit store";

  const toggleCat = (id: CategoryId) => {
    setCatSelection((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  const canSubmit = form.name.trim().length > 0;

  const footer = useMemo(
    () => (
      <div className="flex gap-2">
        <Button type="button" variant="outline" fullWidth onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="admin-store-form"
          fullWidth
          disabled={!canSubmit}
        >
          {mode === "add" ? "Create store" : "Save changes"}
        </Button>
      </div>
    ),
    [onClose, canSubmit, mode]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const cats =
      catSelection.length > 0
        ? catSelection
        : (["snacks"] as Exclude<CategoryId, "all">[]);
    const ti = parseNum(form.deliveryFrom, 20);
    const tj = parseNum(form.deliveryTo, ti + 5);
    const deliveryTimeMins: [number, number] = [
      Math.max(5, ti),
      Math.max(Math.max(5, ti), tj),
    ];
    try {
      const payload: StoreUpsertPayload & { slug?: string } = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        tagline: form.tagline.trim(),
        description: form.description.trim(),
        location: form.location.trim() || "Ilisan-Remo",
        image: form.image.trim(),
        cover: form.cover.trim(),
        categories: cats as Store["categories"],
        rating: Number.parseFloat(form.rating) || 4.5,
        reviews: Math.max(0, Math.round(parseNum(form.reviews, 0))),
        deliveryTimeMins,
        deliveryFee: Math.max(0, Math.round(parseNum(form.deliveryFee, 0))),
        minOrder: Math.max(0, Math.round(parseNum(form.minOrder, 0))),
        isOpen: form.isOpen,
        isFeatured: form.isFeatured,
        isNew: form.isNew,
        tags: form.tagsRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        orders7d: Math.max(0, Math.round(parseNum(form.orders7d, 0))),
      };
      onSave(payload);
      onClose();
    } catch {
      setErr("Check numeric fields and try again.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Details sync to the customer app and admin list (saved in this browser)."
      variant="dialog"
      className="sm:max-w-2xl"
      footer={footer}
    >
      <form id="admin-store-form" className="space-y-4" onSubmit={onSubmit}>
        {err && (
          <p className="rounded-2xl bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700 ring-1 ring-red-200">
            {err}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Store name *
            </label>
            <input
              className={field}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Campus Chow"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              URL slug
            </label>
            <input
              className={field}
              value={form.slug}
              onChange={(e) =>
                setForm((f) => ({ ...f, slug: e.target.value }))
              }
              placeholder="auto from name if empty"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Location
            </label>
            <input
              className={field}
              value={form.location}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Tagline
            </label>
            <input
              className={field}
              value={form.tagline}
              onChange={(e) =>
                setForm((f) => ({ ...f, tagline: e.target.value }))
              }
              placeholder="One line pitch on cards"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Description
            </label>
            <textarea
              className={cn(field, "min-h-[88px] resize-y py-2.5")}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Menu categories
          </p>
          <div className="flex flex-wrap gap-2">
            {selectableCategories.map((c) => {
              const sel = catSelection.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCat(c.id)}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-[12px] font-bold transition-colors ring-1 ring-inset",
                    sel
                      ? "bg-[var(--color-primary)] text-white ring-transparent"
                      : "bg-[var(--color-bg)] text-[var(--color-ink)] ring-[var(--color-line)] hover:bg-black/[0.03]"
                  )}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Logo / tile image URL
            </label>
            <input
              className={field}
              value={form.image}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Cover image URL
            </label>
            <input
              className={field}
              value={form.cover}
              onChange={(e) => setForm((f) => ({ ...f, cover: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Delivery ETA (min) · from
            </label>
            <input
              className={field}
              inputMode="numeric"
              value={form.deliveryFrom}
              onChange={(e) =>
                setForm((f) => ({ ...f, deliveryFrom: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Delivery ETA (min) · to
            </label>
            <input
              className={field}
              inputMode="numeric"
              value={form.deliveryTo}
              onChange={(e) =>
                setForm((f) => ({ ...f, deliveryTo: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Delivery fee (₦)
            </label>
            <input
              className={field}
              inputMode="numeric"
              value={form.deliveryFee}
              onChange={(e) =>
                setForm((f) => ({ ...f, deliveryFee: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Minimum order (₦)
            </label>
            <input
              className={field}
              inputMode="numeric"
              value={form.minOrder}
              onChange={(e) =>
                setForm((f) => ({ ...f, minOrder: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Rating (0–5)
            </label>
            <input
              className={field}
              inputMode="decimal"
              value={form.rating}
              onChange={(e) =>
                setForm((f) => ({ ...f, rating: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Reviews count
            </label>
            <input
              className={field}
              inputMode="numeric"
              value={form.reviews}
              onChange={(e) =>
                setForm((f) => ({ ...f, reviews: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Orders (7d) — admin metric
            </label>
            <input
              className={field}
              inputMode="numeric"
              value={form.orders7d}
              onChange={(e) =>
                setForm((f) => ({ ...f, orders7d: e.target.value }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Tags (comma-separated)
            </label>
            <input
              className={field}
              value={form.tagsRaw}
              onChange={(e) =>
                setForm((f) => ({ ...f, tagsRaw: e.target.value }))
              }
              placeholder="Free delivery, Top rated…"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <label className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-ink)]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[var(--color-line)]"
              checked={form.isOpen}
              onChange={(e) =>
                setForm((f) => ({ ...f, isOpen: e.target.checked }))
              }
            />
            Live on ilú
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-ink)]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[var(--color-line)]"
              checked={form.isFeatured}
              onChange={(e) =>
                setForm((f) => ({ ...f, isFeatured: e.target.checked }))
              }
            />
            Featured carousel
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-ink)]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[var(--color-line)]"
              checked={form.isNew}
              onChange={(e) =>
                setForm((f) => ({ ...f, isNew: e.target.checked }))
              }
            />
            Show “New” ribbon
          </label>
        </div>
      </form>
    </Modal>
  );
}
