"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { StoreCard } from "@/components/home/StoreCard";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StoreCardSkeleton } from "@/components/ui/Skeletons";
import { useCatalog } from "@/context/CatalogContext";
import { categories } from "@/data/mockData";
import { cn } from "@/lib/utils";
import type { CategoryId, Store } from "@/types";

type SortId = "recommended" | "rating" | "fastest" | "cheapest";

const SORTS: { id: SortId; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "rating", label: "Top rated" },
  { id: "fastest", label: "Fastest delivery" },
  { id: "cheapest", label: "Lowest delivery fee" },
];

function sortStores(list: Store[], sort: SortId): Store[] {
  const copy = [...list];
  switch (sort) {
    case "rating":
      return copy.sort((a, b) => b.rating - a.rating);
    case "fastest":
      return copy.sort(
        (a, b) => a.deliveryTimeMins[0] - b.deliveryTimeMins[0]
      );
    case "cheapest":
      return copy.sort((a, b) => a.deliveryFee - b.deliveryFee);
    case "recommended":
    default:
      return copy.sort((a, b) => {
        const feat = Number(!!b.isFeatured) - Number(!!a.isFeatured);
        if (feat !== 0) return feat;
        return b.rating - a.rating;
      });
  }
}

export default function StoresPage() {
  const { stores, loading, error, refetch } = useCatalog();

  const [category, setCategory] = useState<CategoryId>("all");
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState<SortId>("recommended");

  const visibleStores = useMemo(() => {
    let list = stores;
    if (category !== "all") {
      list = list.filter((s) => s.categories.includes(category));
    }
    if (openOnly) {
      list = list.filter((s) => s.isOpen);
    }
    return sortStores(list, sort);
  }, [stores, category, openOnly, sort]);

  return (
    <div className="min-h-screen pb-24 lg:pb-12">
      <Navbar variant="page" />

      <main className="mx-auto max-w-2xl px-4 lg:max-w-6xl lg:px-6">
        {/* Hero header */}
        <section className="pt-4 lg:pt-6">
          <div className="relative overflow-hidden rounded-[1.6rem] border border-[var(--color-line)] bg-gradient-to-br from-[var(--color-ink)] to-[#2a1c13] px-5 py-7 sm:px-8 sm:py-9">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-[var(--color-primary)]/25 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-[var(--color-accent)]/15 blur-3xl"
            />
            <div className="relative">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                Browse ìlú
              </p>
              <h1 className="font-display mt-1.5 text-[26px] font-extrabold leading-tight tracking-tight text-white sm:text-[32px]">
                Every store on ìlúEats
              </h1>
              <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-white/70">
                From late-night shawarma to fresh-baked cakes — explore all the
                kitchens delivering around you.
              </p>
              {!loading && !error && (
                <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-semibold text-white ring-1 ring-inset ring-white/15 backdrop-blur">
                  <span className="tabular-nums">{stores.length}</span>
                  {stores.length === 1 ? "store" : "stores"} available
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Category filter */}
        <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {categories.map((c) => {
            const active = c.id === category;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-pressed={active}
                className={cn(
                  "flex h-10 flex-none items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold tracking-tight transition-colors",
                  active
                    ? "bg-[var(--color-ink)] text-white"
                    : "bg-[var(--color-surface)] text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)] hover:bg-black/[0.03]"
                )}
              >
                {c.emoji ? (
                  <span aria-hidden className="text-[15px]">
                    {c.emoji}
                  </span>
                ) : null}
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>

        {/* Toolbar: result count + open toggle + sort */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] font-medium text-[var(--color-ink-muted)]">
            {loading ? (
              "Finding stores…"
            ) : (
              <>
                <span className="font-bold text-[var(--color-ink)] tabular-nums">
                  {visibleStores.length}
                </span>{" "}
                {visibleStores.length === 1 ? "store" : "stores"}
                {category !== "all" ? " in this category" : ""}
              </>
            )}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpenOnly((v) => !v)}
              aria-pressed={openOnly}
              className={cn(
                "inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition",
                openOnly
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-surface)] text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)] hover:bg-black/[0.03]"
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full transition",
                  openOnly
                    ? "bg-white/25"
                    : "ring-1 ring-inset ring-[var(--color-line)]"
                )}
              >
                {openOnly ? <CheckIcon className="h-3 w-3" strokeWidth={3} /> : null}
              </span>
              Open now
            </button>

            <SortSelect value={sort} onChange={setSort} />
          </div>
        </div>

        {/* Grid */}
        <section className="mt-5">
          {loading ? (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-9">
              {Array.from({ length: 9 }).map((_, idx) => (
                <StoreCardSkeleton key={idx} />
              ))}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : visibleStores.length === 0 ? (
            <EmptyState
              title="No stores match"
              description={
                openOnly
                  ? "Nothing open in this category right now — try turning off “Open now” or picking another craving."
                  : "No stores yet for this craving. Check back soon."
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-9">
              {visibleStores.map((s, idx) => (
                <StoreCard key={s.id} store={s} index={idx} />
              ))}
            </div>
          )}
        </section>

        <Footer />
      </main>

      <BottomNav />
    </div>
  );
}

function SortSelect({
  value,
  onChange,
}: {
  value: SortId;
  onChange: (v: SortId) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = SORTS.find((s) => s.id === value) ?? SORTS[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--color-surface)] px-3.5 text-[13px] font-semibold text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)] transition hover:bg-black/[0.03]"
      >
        <span className="text-[var(--color-ink-soft)]">Sort:</span>
        {active.label}
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 text-[var(--color-ink-soft)] transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <motion.ul
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
          role="listbox"
          className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-1.5 shadow-[0_18px_44px_-18px_rgba(0,0,0,0.35)]"
        >
          {SORTS.map((s) => {
            const selected = s.id === value;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(s.id);
                    setOpen(false);
                  }}
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] font-semibold transition",
                    selected
                      ? "bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]"
                      : "text-[var(--color-ink)] hover:bg-black/[0.04]"
                  )}
                >
                  {s.label}
                  {selected ? <CheckIcon className="h-4 w-4" strokeWidth={2.5} /> : null}
                </button>
              </li>
            );
          })}
        </motion.ul>
      )}
    </div>
  );
}
