"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { ContentLoader } from "@/components/ui/Loaders";
import { ErrorState } from "@/components/ui/EmptyState";
import { categories } from "@/data/mockData";
import { ApiError, LOAD_FAILED_FALLBACK } from "@/lib/api/client";
import type { MenuItemPayload } from "@/lib/api/catalog";
import { cn, formatPrice, shortId, slugify } from "@/lib/utils";
import type {
  CategoryId,
  Product,
  ProductOptionChoice,
  ProductOptionGroup,
  Store,
} from "@/types";

const selectable = categories.filter((c) => c.id !== "all");

const field =
  "h-11 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3.5 text-[13px] font-medium text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]/35 focus:ring-2 focus:ring-[var(--color-primary)]/18";

function tryParseOptions(json: string): ProductOptionGroup[] | undefined {
  const t = json.trim();
  if (!t) return undefined;
  const parsed = JSON.parse(t) as unknown;
  if (!Array.isArray(parsed)) throw new Error("Options must be a JSON array");
  return parsed as ProductOptionGroup[];
}

/** Row identities for controlled lists (not persisted). */
type DraftChoiceRow = {
  key: string;
  choiceId: string;
  title: string;
  deltaRaw: string;
};

type DraftGroupRow = {
  key: string;
  groupId: string;
  title: string;
  required: boolean;
  multi: boolean;
  choices: DraftChoiceRow[];
};

function newChoiceRow(initial?: Partial<DraftChoiceRow>): DraftChoiceRow {
  return {
    key: shortId("c_"),
    choiceId: initial?.choiceId ?? "",
    title: initial?.title ?? "",
    deltaRaw: initial?.deltaRaw ?? "0",
  };
}

function newGroupRow(initial?: Partial<DraftGroupRow>): DraftGroupRow {
  return {
    key: shortId("g_"),
    groupId: initial?.groupId ?? "",
    title: initial?.title ?? "",
    required: initial?.required ?? true,
    multi: initial?.multi ?? false,
    choices: initial?.choices?.length ? initial!.choices : [newChoiceRow()],
  };
}

function optionsToDraft(groups: ProductOptionGroup[] | undefined): DraftGroupRow[] {
  if (!groups?.length) return [];
  return groups.map((g) =>
    newGroupRow({
      groupId: g.id,
      title: g.name,
      required: !!g.required,
      multi: !!g.multi,
      choices: g.choices.map((c) =>
        newChoiceRow({
          choiceId: c.id,
          title: c.name,
          deltaRaw: String(c.priceDelta ?? 0),
        })
      ),
    })
  );
}

function uniqueSlugInSet(baseRaw: string, used: Set<string>): string {
  const base =
    slugify(baseRaw.trim()) || shortId("id_").replace(/^_/, "id");
  const s = base;
  if (!used.has(s)) {
    used.add(s);
    return s;
  }
  let n = 2;
  while (used.has(`${s}-${n}`)) n += 1;
  const out = `${s}-${n}`;
  used.add(out);
  return out;
}

/** Build persisted option groups — mirrors mock items like Babrite pepperoni. */
function buildOptionsFromDraft(
  drafts: DraftGroupRow[]
): ProductOptionGroup[] | undefined {
  const out: ProductOptionGroup[] = [];
  const usedGroupIds = new Set<string>();

  for (const g of drafts) {
    const gTitle = g.title.trim();
    if (!gTitle) continue;

    const gid =
      g.groupId.trim().length > 0
        ? uniqueSlugInSet(g.groupId.trim(), usedGroupIds)
        : uniqueSlugInSet(gTitle, usedGroupIds);

    const choices: ProductOptionChoice[] = [];
    const usedChoiceIds = new Set<string>();
    for (const row of g.choices) {
      const nm = row.title.trim();
      if (!nm) continue;
      const cid =
        row.choiceId.trim().length > 0
          ? uniqueSlugInSet(row.choiceId.trim(), usedChoiceIds)
          : uniqueSlugInSet(nm, usedChoiceIds);

      let deltaNum = Number(String(row.deltaRaw).replace(/,/g, ""));
      if (!Number.isFinite(deltaNum)) deltaNum = 0;
      deltaNum = Math.round(deltaNum);

      const choice: ProductOptionChoice = { id: cid, name: nm };
      if (deltaNum !== 0) choice.priceDelta = deltaNum;
      choices.push(choice);
    }

    if (choices.length === 0) continue;

    const group: ProductOptionGroup = {
      id: gid,
      name: gTitle,
      choices,
    };
    if (g.required) group.required = true;
    if (g.multi) group.multi = true;
    out.push(group);
  }
  return out.length ? out : undefined;
}

/** Preset similar to `/babrite/pepperoni`: two required single-select tiers with price deltas. */
function presetPizzaStyleRows(): DraftGroupRow[] {
  return [
    newGroupRow({
      title: "Size",
      required: true,
      multi: false,
      choices: [
        newChoiceRow({ title: 'Small (9")', deltaRaw: "0" }),
        newChoiceRow({ title: 'Medium (12")', deltaRaw: "2500" }),
        newChoiceRow({ title: 'Large (14")', deltaRaw: "4500" }),
      ],
    }),
    newGroupRow({
      title: "Crust",
      required: true,
      multi: false,
      choices: [
        newChoiceRow({ title: "Thin Crust", deltaRaw: "0" }),
        newChoiceRow({ title: "Hand-tossed", deltaRaw: "0" }),
        newChoiceRow({ title: "Cheese-stuffed", deltaRaw: "1500" }),
      ],
    }),
  ];
}

/** Optional multi-select add-ons — like Mama Tope extras. */
function presetExtrasAddonRows(): DraftGroupRow[] {
  return [
    newGroupRow({
      title: "Extras",
      required: false,
      multi: true,
      choices: [
        newChoiceRow({ title: "Extra Plantain", deltaRaw: "500" }),
        newChoiceRow({ title: "Moi Moi", deltaRaw: "700" }),
        newChoiceRow({ title: "Coleslaw", deltaRaw: "600" }),
      ],
    }),
  ];
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
  /** May reject — the modal stays open with the failure inline so nothing typed is lost. */
  onSave: (payload: MenuItemPayload) => void | Promise<void>;
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
  const [imageUploading, setImageUploading] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [rating, setRating] = useState("");
  const [reviews, setReviews] = useState("");
  const [optionDrafts, setOptionDrafts] = useState<DraftGroupRow[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedJson, setAdvancedJson] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const prevAdvancedOpen = useRef(false);
  const errRef = useRef<HTMLParagraphElement>(null);

  // Failures land while the admin is at the footer; bring the banner to them.
  useEffect(() => {
    if (err) errRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [err]);

  const jsonMirror = useMemo(
    () =>
      JSON.stringify(buildOptionsFromDraft(optionDrafts) ?? [], null, 2),
    [optionDrafts]
  );

  useEffect(() => {
    if (!open) return;
    setAdvancedOpen(false);
    setErr(null);
    setSaving(false);
    // Surface the tucked-away fields when editing an item that already uses them.
    setMoreOpen(
      mode === "edit" &&
        !!product &&
        (typeof product.rating === "number" ||
          typeof product.reviews === "number")
    );
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
      setOptionDrafts(optionsToDraft(product.options));
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
    setOptionDrafts([]);
  }, [open, mode, product, store]);

  useEffect(() => {
    if (advancedOpen && !prevAdvancedOpen.current && open) {
      setAdvancedJson(jsonMirror);
    }
    prevAdvancedOpen.current = advancedOpen;
  }, [advancedOpen, open, jsonMirror]);

  useEffect(() => {
    if (!open) prevAdvancedOpen.current = false;
  }, [open]);

  const priceNum = Number(String(price).replace(/,/g, "").trim());
  // Number("") is 0, so an untouched price field must not count as valid —
  // otherwise a ₦0 dish goes live with one click.
  const canSave =
    name.trim().length > 0 &&
    Number.isFinite(priceNum) &&
    priceNum > 0 &&
    !imageUploading &&
    !saving;

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
          {imageUploading
            ? "Uploading…"
            : saving
              ? "Saving…"
              : mode === "add"
                ? "Add dish"
                : "Save dish"}
        </Button>
      </div>
    ),
    [onClose, canSave, mode, imageUploading, saving]
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    const oldPriceNum =
      oldPrice.trim() === ""
        ? undefined
        : Number(oldPrice.replace(/,/g, "").trim());
    if (oldPriceNum !== undefined && !Number.isFinite(oldPriceNum)) {
      setErr("Old price isn't a number — clear it or enter the pre-promo price.");
      return;
    }
    if (oldPriceNum !== undefined && oldPriceNum <= priceNum) {
      setErr(
        "Old price should be higher than the current price — it shows struck through as the pre-promo price."
      );
      return;
    }

    let options: ProductOptionGroup[] | undefined;
    try {
      options = buildOptionsFromDraft(optionDrafts);
    } catch {
      setErr("Something went wrong — check modifiers and prices.");
      return;
    }

    setErr(null);
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: desc.trim(),
        price: priceNum,
        oldPrice: oldPriceNum,
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
    } catch (e) {
      // Keep the modal open with everything typed; surface what the API said.
      setErr(e instanceof ApiError ? e.message : LOAD_FAILED_FALLBACK);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "add" ? "Add menu item" : "Edit menu item"}
      description={`Attached to ${store.name}.`}
      variant="dialog"
      className="sm:max-w-2xl"
      footer={footer}
    >
      <form id="admin-menu-item-form" className="space-y-3.5" onSubmit={onSubmit}>
        {err && (
          <p
            ref={errRef}
            role="alert"
            className="rounded-2xl bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700 ring-1 ring-red-200"
          >
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
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Pepper soup combo"
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
              placeholder="e.g. 3500"
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
          <ImageUploadField
            label="Item image"
            folder="menu-items"
            aspect="4 / 3"
            required
            value={image}
            onChange={setImage}
            onUploadingChange={setImageUploading}
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
            placeholder="What's in it, portion size, what it comes with…"
          />
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

        <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/70 p-3.5 sm:p-4">
          <div className="flex flex-col gap-1">
            <p className="text-[12px] font-extrabold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Customizations (optional)
            </p>
            <p className="text-[12.5px] leading-relaxed text-[var(--color-ink-muted)]">
              Steps diners walk through before adding to cart — a{" "}
              <strong>required</strong> pick like Size or Protein, or an{" "}
              <strong>optional multi-select</strong> like Extras. Each choice
              can add ₦ on top of the base price.
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9"
              onClick={() => setOptionDrafts([])}
            >
              Clear all
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9"
              onClick={() => setOptionDrafts(presetPizzaStyleRows())}
            >
              Size &amp; crust preset
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9"
              onClick={() => setOptionDrafts(presetExtrasAddonRows())}
            >
              Extras preset
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-9 gap-1.5 !px-3"
              onClick={() =>
                setOptionDrafts((d) => [...d, newGroupRow()])
              }
            >
              Add empty step
            </Button>
          </div>

          {optionDrafts.length === 0 ? (
            <p className="mt-4 rounded-xl px-3 py-2 text-[13px] text-[var(--color-ink-muted)] ring-1 ring-[var(--color-line)] ring-dashed">
              No customizations — diners just pick a quantity. Start from a
              preset or add your own step.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {optionDrafts.map((g, gi) => (
                <li
                  key={g.key}
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3.5 shadow-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                          Step title (e.g. Size, Protein, Crust)
                        </label>
                        <input
                          className={cn(field, "text-[13px]")}
                          value={g.title}
                          onChange={(e) =>
                            setOptionDrafts((rows) =>
                              rows.map((row) =>
                                row.key === g.key
                                  ? { ...row, title: e.target.value }
                                  : row
                              )
                            )
                          }
                          placeholder={`Step ${gi + 1}`}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                          Step id slug (optional)
                        </label>
                        <input
                          className={cn(field, "font-mono text-[12px]")}
                          value={g.groupId}
                          onChange={(e) =>
                            setOptionDrafts((rows) =>
                              rows.map((row) =>
                                row.key === g.key
                                  ? { ...row, groupId: e.target.value }
                                  : row
                              )
                            )
                          }
                          placeholder="auto from step title"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-10 shrink-0 text-red-600 hover:bg-red-50 sm:mt-0"
                      aria-label={`Remove ${g.title.trim() || "step"}`}
                      onClick={() =>
                        setOptionDrafts((rows) =>
                          rows.filter((row) => row.key !== g.key)
                        )
                      }
                    >
                      <TrashIcon className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-[12.5px] font-semibold text-[var(--color-ink)]">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[var(--color-line)]"
                        checked={g.required}
                        onChange={(e) =>
                          setOptionDrafts((rows) =>
                            rows.map((row) =>
                              row.key === g.key
                                ? { ...row, required: e.target.checked }
                                : row
                            )
                          )
                        }
                      />
                      Must pick something
                      <span className="sr-only">
                        Marks this group required on PDP
                      </span>
                    </label>
                    <label className="flex items-center gap-2 text-[12.5px] font-semibold text-[var(--color-ink)]">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[var(--color-line)]"
                        checked={g.multi}
                        onChange={(e) =>
                          setOptionDrafts((rows) =>
                            rows.map((row) =>
                              row.key === g.key
                                ? { ...row, multi: e.target.checked }
                                : row
                            )
                          )
                        }
                      />
                      Allow multiple picks
                      <span className="sr-only">
                        Checkbox-style choices on PDP
                      </span>
                    </label>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                      Choices (+₦ stacks on dish base price)
                    </p>
                    <p className="mb-3 text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
                      Use <strong>0</strong> when a choice is included free;
                      premium picks add their +₦ (e.g. +{formatPrice(2500)} for
                      a bigger size).
                    </p>
                    <ul className="space-y-2">
                      {g.choices.map((c) => (
                        <li
                          key={c.key}
                          className="grid gap-2 sm:grid-cols-[1.4fr_6.5rem_1fr_auto] sm:items-center"
                        >
                          <input
                            className={cn(field)}
                            placeholder="Displayed name"
                            value={c.title}
                            onChange={(e) =>
                              setOptionDrafts((rows) =>
                                rows.map((row) =>
                                  row.key !== g.key
                                    ? row
                                    : {
                                        ...row,
                                        choices: row.choices.map((ch) =>
                                          ch.key === c.key
                                            ? { ...ch, title: e.target.value }
                                            : ch
                                        ),
                                      }
                                )
                              )
                            }
                          />
                          <input
                            className={cn(field, "tabular-nums")}
                            inputMode="numeric"
                            placeholder="+₦"
                            aria-label={`Extra cost for ${c.title.trim() || "choice"}`}
                            value={c.deltaRaw}
                            onChange={(e) =>
                              setOptionDrafts((rows) =>
                                rows.map((row) =>
                                  row.key !== g.key
                                    ? row
                                    : {
                                        ...row,
                                        choices: row.choices.map((ch) =>
                                          ch.key === c.key
                                            ? {
                                                ...ch,
                                                deltaRaw: e.target.value,
                                              }
                                            : ch
                                        ),
                                      }
                                )
                              )
                            }
                          />
                          <input
                            className={cn(field, "font-mono text-[12px]")}
                            placeholder="Slug (optional)"
                            value={c.choiceId}
                            onChange={(e) =>
                              setOptionDrafts((rows) =>
                                rows.map((row) =>
                                  row.key !== g.key
                                    ? row
                                    : {
                                        ...row,
                                        choices: row.choices.map((ch) =>
                                          ch.key === c.key
                                            ? {
                                                ...ch,
                                                choiceId: e.target.value,
                                              }
                                            : ch
                                        ),
                                      }
                                )
                              )
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 shrink-0 !px-0 text-red-600 hover:bg-red-50 disabled:opacity-40"
                            aria-label={`Remove ${c.title.trim() || "choice"}`}
                            disabled={g.choices.length === 1}
                            onClick={() =>
                              setOptionDrafts((rows) =>
                                rows.map((row) =>
                                  row.key !== g.key
                                    ? row
                                    : {
                                        ...row,
                                        choices: row.choices.filter(
                                          (ch) => ch.key !== c.key
                                        ),
                                      }
                                )
                              )
                            }
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-2 h-9 gap-1 text-[12px]"
                      onClick={() =>
                        setOptionDrafts((rows) =>
                          rows.map((row) =>
                            row.key === g.key
                              ? {
                                  ...row,
                                  choices: [...row.choices, newChoiceRow()],
                                }
                              : row
                          )
                        )
                      }
                    >
                      Add choice
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 text-left"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((x) => !x)}
          >
            <span className="text-[13px] font-bold text-[var(--color-ink)]">
              More details
              <span className="ml-2 text-[11.5px] font-medium text-[var(--color-ink-muted)]">
                URL slug · rating · reviews
              </span>
            </span>
            {moreOpen ? (
              <ChevronDownIcon className="h-5 w-5 shrink-0 text-[var(--color-ink-soft)]" />
            ) : (
              <ChevronRightIcon className="h-5 w-5 shrink-0 text-[var(--color-ink-soft)]" />
            )}
          </button>
          {moreOpen ? (
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                  URL slug
                </label>
                <input
                  className={field}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder={slugify(name) || "auto from dish name when empty"}
                />
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
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 text-left"
            aria-expanded={advancedOpen}
            onClick={() => setAdvancedOpen((x) => !x)}
          >
            <span className="text-[13px] font-bold text-[var(--color-ink)]">
              Advanced JSON
            </span>
            {advancedOpen ? (
              <ChevronDownIcon className="h-5 w-5 shrink-0 text-[var(--color-ink-soft)]" />
            ) : (
              <ChevronRightIcon className="h-5 w-5 shrink-0 text-[var(--color-ink-soft)]" />
            )}
          </button>
          <p className="mt-1 text-[11.5px] text-[var(--color-ink-muted)]">
            Paste complex trees from mocks or backends — applies into the builder above on success.
          </p>
          {advancedOpen ? (
            <div className="mt-3 space-y-2">
              <textarea
                className={cn(
                  field,
                  "min-h-[160px] resize-y py-2.5 font-mono text-[12px]"
                )}
                spellCheck={false}
                value={advancedJson}
                onChange={(e) => setAdvancedJson(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => setAdvancedJson(jsonMirror)}
                >
                  Sync from builder
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-9"
                  onClick={() => {
                    try {
                      const trimmed = advancedJson.trim();
                      if (!trimmed) {
                        setOptionDrafts([]);
                        setErr(null);
                        return;
                      }
                      const parsed = tryParseOptions(trimmed);
                      setOptionDrafts(optionsToDraft(parsed ?? []));
                      setErr(null);
                    } catch {
                      setErr("Invalid option JSON.");
                    }
                  }}
                >
                  Apply JSON → builder
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}

export interface AdminStoreMenuModalProps {
  open: boolean;
  store: Store | null;
  items: Product[];
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onRemoveItem?: (productId: string) => void;
  onDuplicateItem?: (productId: string) => void;
  onUpsertAdd: (payload: MenuItemPayload) => void | Promise<void>;
  onUpsertEdit: (
    productId: string,
    payload: Partial<MenuItemPayload>
  ) => void | Promise<void>;
}

export function AdminStoreMenuModal({
  open,
  store,
  items,
  loading,
  error,
  onClose,
  onRemoveItem,
  onDuplicateItem,
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
              variant="primary"
              className="flex-1 gap-2"
              onClick={() => setItemFlow("add")}
            >
              Add dish
            </Button>
          </div>
        }
      >
        {loading ? (
          <ContentLoader message="Loading menu…" />
        ) : error ? (
          <ErrorState
            variant="inline"
            title="The menu didn't load"
            message={error}
          />
        ) : sorted.length === 0 ? (
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
                  {onDuplicateItem && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-9 min-w-[4.5rem] px-3 text-[12px]"
                      onClick={() => onDuplicateItem(p.id)}
                    >
                      Duplicate
                    </Button>
                  )}
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
        onSave={async (payload) => {
          if (itemFlow === "add") {
            await onUpsertAdd(payload);
          } else if (itemFlow && itemFlow.mode === "edit") {
            await onUpsertEdit(itemFlow.product.id, payload);
          }
        }}
      />
    </>
  );
}
