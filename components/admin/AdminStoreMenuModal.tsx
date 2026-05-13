"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { categories } from "@/data/mockData";
import type { MenuItemPayload } from "@/lib/catalogStore";
import { cn, formatPrice } from "@/lib/utils";
import type { CategoryId, Product, Store } from "@/types";

const selectable = categories.filter((c) => c.id !== "all");

const field =
  "h-11 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3.5 text-[13px] font-medium text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]/35 focus:ring-2 focus:ring-[var(--color-primary)]/18";

function tryParseOptions(json: string): Product["options"] | undefined {
  const t = json.trim();
  if (!t) return undefined;
  const parsed = JSON.parse(t) as unknown;
  if (!Array.isArray(parsed)) throw new Error("Options must be a JSON array");
  return parsed as Product["options"];
}

function defaultCategoryForStore(store: Store): Exclude<CategoryId, "all"> {
  const first = store.categories.find((c) => c !== "all");
  return (
    (first ? first : "snacks") as Exclude<
      CategoryId,
      "all"
    >
  );
}

export interface AdminMenuItemModalProps {
  open: boolean;
  mode: "add" | "edit";
  store: Store;
  product?: Product | null;
  onClose: () => void;
  onSave: (payload: MenuItemPayload) => void;
}

export function AdminMenuItemModal({
  open,
  mode,
  store,
  product,
  onClose,
  onSave,
}: AdminMenuItemModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [category, setCategory] = useState<Exclude<CategoryId, "all">>(
    defaultCategoryForStore(store)
  );
  const [image, setImage] = useState(
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80"
  );
  const [isPopular, setIsPopular] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [rating, setRating] = useState("");
  const [reviews, setReviews] = useState("");
  const [optionsJson, setOptionsJson] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    if (mode === "edit" && product) {
      setName(product.name);
      setSlug(product.slug);
      setDesc(product.description);
      setPrice(String(product.price));
      setOldPrice(
        typeof product.oldPrice === "number" ? String(product.oldPrice) : ""
      );
      setCategory(product.category === "all" ? "snacks" : product.category);
      setImage(product.image);
      setIsPopular(!!product.isPopular);
      setIsNew(!!product.isNew);
      setRating(
        typeof product.rating === "number" ? String(product.rating) : ""
      );
      setReviews(
        typeof product.reviews === "number" ? String(product.reviews) : ""
      );
      setOptionsJson(
        product.options && product.options.length
          ? JSON.stringify(product.options, null, 2)
          : ""
      );
      return;
    }
    setName("");
    setSlug("");
    setDesc("");
    setPrice("");
    setOldPrice("");
    setCategory(defaultCategoryForStore(store));
    setImage(
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80"
    );
    setIsPopular(false);
    setIsNew(false);
    setRating("");
    setReviews("");
    setOptionsJson("");
  }, [open, mode, product, store]);

  const canSave =
    name.trim().length > 0 &&
    Number.isFinite(Number(String(price).replace(/,/g, "")));

  const footer = useMemo(
    () => (
      <div className="flex gap-2">
        <Button type="button" variant="outline" fullWidth onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="admin-menu-item-form"
          fullWidth
          disabled={!canSave}
        >
          {mode === "add" ? "Add dish" : "Save dish"}
        </Button>
      </div>
    ),
    [onClose, canSave, mode]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    try {
      const options = tryParseOptions(optionsJson);
      const priceNum = Number(String(price).replace(/,/g, ""));
      onSave({
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: desc.trim(),
        price: priceNum,
        oldPrice:
          oldPrice.trim() === ""
            ? undefined
            : Number(oldPrice.replace(/,/g, "")),
        category,
        image: image.trim(),
        isPopular,
        isNew,
        rating: rating.trim() === "" ? undefined : Number.parseFloat(rating),
        reviews:
          reviews.trim() === "" ? undefined : Math.round(Number(reviews)),
        options,
      });
      onClose();
    } catch {
      setErr("Invalid JSON in customisation field, or bad numbers.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "add" ? "Add menu item" : "Edit menu item"}
      description={`Attached to ${store.name}.`}
      variant="dialog"
      className="sm:max-w-xl"
      footer={footer}
    >
      <form id="admin-menu-item-form" className="space-y-3.5" onSubmit={onSubmit}>
        {err && (
          <p className="rounded-2xl bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700 ring-1 ring-red-200">
            {err}
          </p>
        )}
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Dish name *
          </label>
          <input
            className={field}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Pepper soup combo"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
            URL slug
          </label>
          <input
            className={field}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto from dish name when empty"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Description *
          </label>
          <textarea
            className={cn(field, "min-h-[72px] resize-y py-2.5")}
            required
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Price (₦) *
            </label>
            <input
              className={field}
              required
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Old price (₦ · optional promo)
            </label>
            <input
              className={field}
              inputMode="decimal"
              value={oldPrice}
              onChange={(e) => setOldPrice(e.target.value)}
              placeholder="—"
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Shelf category *
            </label>
            <select
              className={field}
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as Exclude<CategoryId, "all">)
              }
            >
              {selectable.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Image URL *
            </label>
            <input
              className={field}
              required
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Rating (optional)
            </label>
            <input
              className={field}
              inputMode="decimal"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Reviews count (optional)
            </label>
            <input
              className={field}
              inputMode="numeric"
              value={reviews}
              onChange={(e) => setReviews(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <label className="flex items-center gap-2 text-[13px] font-semibold">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[var(--color-line)]"
              checked={isPopular}
              onChange={(e) => setIsPopular(e.target.checked)}
            />
            Popular badge
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[var(--color-line)]"
              checked={isNew}
              onChange={(e) => setIsNew(e.target.checked)}
            />
            New badge
          </label>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Customisation JSON (advanced)
          </label>
          <textarea
            className={cn(
              field,
              "min-h-[140px] resize-y py-2.5 font-mono text-[12px]"
            )}
            placeholder='[] or [{"id":"size","name":"Size","required":true,"choices":[{"id":"m","name":"M","priceDelta":0}]}]'
            value={optionsJson}
            onChange={(e) => setOptionsJson(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}

export interface AdminStoreMenuModalProps {
  open: boolean;
  store: Store | null;
  items: Product[];
  onClose: () => void;
  onRemoveItem?: (productId: string) => void;
  onUpsertAdd: (payload: MenuItemPayload) => void;
  onUpsertEdit: (productId: string, payload: Partial<MenuItemPayload>) => void;
}

export function AdminStoreMenuModal({
  open,
  store,
  items,
  onClose,
  onRemoveItem,
  onUpsertAdd,
  onUpsertEdit,
}: AdminStoreMenuModalProps) {
  const [itemFlow, setItemFlow] = useState<
    null | "add" | { mode: "edit"; product: Product }
  >(null);

  useEffect(() => {
    if (open) setItemFlow(null);
  }, [open]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );

  if (!store) return null;

  return (
    <>
      <Modal
        open={open && itemFlow === null}
        onClose={onClose}
        title="Menu builder"
        description="Dishes shoppers see under this storefront."
        variant="dialog"
        className="sm:max-w-xl"
        footer={
          <div className="flex gap-2">
            <Link
              href={`/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-white text-[14px] font-semibold text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)] transition-colors hover:bg-black/[0.03]"
            >
              Open live menu
            </Link>
            <Button
              type="button"
              className="flex-1 flex gap-2"
              onClick={() => setItemFlow("add")}
            >
              Add dish
            </Button>
          </div>
        }
      >
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-bg)] p-8 text-center">
            <p className="text-[14px] font-bold text-[var(--color-ink)]">
              No dishes yet
            </p>
            <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
              Add your first dish so shoppers see plates on this store.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-line)]">
            {sorted.map((p) => (
              <li key={p.id} className="flex gap-3 py-3 first:pt-0">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-[var(--color-line)]">
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-extrabold text-[var(--color-ink)]">
                    {p.name}
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
                    {selectable.find((c) => c.id === p.category)?.name ??
                      p.category}{" "}
                    ·{" "}
                    <span className="tabular-nums">{formatPrice(p.price)}</span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 min-w-[4.5rem] px-3"
                    onClick={() =>
                      setItemFlow({ mode: "edit", product: p })
                    }
                  >
                    Edit
                  </Button>
                  {onRemoveItem && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-9 min-w-[4.5rem] px-3 text-[12px] text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (
                          typeof window !== "undefined" &&
                          window.confirm(`Remove "${p.name}" from the menu?`)
                        ) {
                          onRemoveItem(p.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <AdminMenuItemModal
        open={
          open &&
          (itemFlow === "add" ||
            (!!itemFlow && itemFlow.mode === "edit"))
        }
        mode={itemFlow && itemFlow !== "add" ? "edit" : "add"}
        store={store}
        product={
          itemFlow && itemFlow !== "add" ? itemFlow.product : undefined
        }
        onClose={() => setItemFlow(null)}
        onSave={(payload) => {
          if (itemFlow === "add") {
            onUpsertAdd(payload);
          } else if (itemFlow && itemFlow.mode === "edit") {
            onUpsertEdit(itemFlow.product.id, payload);
          }
        }}
      />
    </>
  );
}
