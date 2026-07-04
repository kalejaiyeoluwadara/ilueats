"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AdjustmentsHorizontalIcon,
  ArrowLeftIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  StarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { BottomNav } from "@/components/layout/BottomNav";
import { StoreCard } from "@/components/home/StoreCard";
import { useCatalog } from "@/context/CatalogContext";
import { formatDeliveryTime, formatPrice } from "@/lib/utils";
import type { Store } from "@/types";

type Tab = "all" | "stores" | "dishes";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "stores", label: "Stores" },
  { id: "dishes", label: "Dishes" },
];

const SUGGESTIONS = ["Jollof", "Pizza", "Shawarma", "Smoothie", "Cake", "Burger"];

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const router = useRouter();
  const { stores, products } = useCatalog();
  const params = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const initial = params.get("q") ?? "";
  const [query, setQuery] = useState(initial);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    setQuery(params.get("q") ?? "");
  }, [params]);

  const trimmed = query.trim();
  const isSearching = trimmed.length > 0;

  const matchingProducts = useMemo(() => {
    if (!isSearching) return [];
    const q = trimmed.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [trimmed, isSearching, products]);

  const matchingStores = useMemo(() => {
    if (!isSearching) return [];
    const q = trimmed.toLowerCase();
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.tags?.some((t) => t.toLowerCase().includes(q)) ||
        products.some(
          (p) =>
            p.storeId === s.id &&
            (p.name.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q))
        )
    );
  }, [trimmed, isSearching, products, stores]);

  const totalResults = matchingProducts.length + matchingStores.length;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;
    router.replace(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const showStores = tab === "all" || tab === "stores";
  const showDishes = tab === "all" || tab === "dishes";

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 border-b border-[var(--color-line)]/70 bg-[var(--color-bg)]/85 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--color-bg)]/70">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-3 pt-[max(env(safe-area-inset-top),12px)] pb-3 sm:px-4 lg:max-w-5xl lg:px-6">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-ink)] hover:bg-black/5 active:bg-black/10"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>

          <form onSubmit={onSubmit} className="flex-1">
            <div className="group/search relative flex h-11 items-center gap-2.5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] pl-2 pr-1.5 transition focus-within:border-[var(--color-primary)]/45 focus-within:shadow-[0_0_0_3px_var(--color-primary-soft)]">
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
              >
                <MagnifyingGlassIcon className="h-4.5 w-4.5" strokeWidth={2.2} />
              </span>
              <input
                ref={inputRef}
                type="search"
                inputMode="search"
                autoComplete="off"
                enterKeyHint="search"
                placeholder="Search dishes, cafés, cravings…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[14.5px] font-medium text-[var(--color-ink)] placeholder:font-normal placeholder:text-[var(--color-ink-soft)] focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-ink-muted)] transition hover:bg-black/[0.06]"
                >
                  <XMarkIcon className="h-4 w-4" strokeWidth={2.2} />
                </button>
              )}
            </div>
          </form>

          <button
            type="button"
            aria-label="Filters"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-ink)] ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-surface)] hover:ring-[var(--color-primary)]/25"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
          </button>
        </div>

        {isSearching && (
          <div className="mx-auto max-w-2xl px-3 pb-3 sm:px-4 lg:max-w-5xl lg:px-6">
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
              {TABS.map((t) => {
                const count =
                  t.id === "all"
                    ? totalResults
                    : t.id === "stores"
                      ? matchingStores.length
                      : matchingProducts.length;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
                      active
                        ? "bg-[var(--color-ink)] text-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.35)]"
                        : "border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:border-[var(--color-primary)]/25 hover:bg-[var(--color-primary-soft)]"
                    }`}
                  >
                    {t.label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-4 lg:max-w-5xl lg:px-6">
        {!isSearching ? (
          <EmptyLanding
            stores={stores}
            onPick={(t) =>
              router.replace(`/search?q=${encodeURIComponent(t)}`)
            }
          />
        ) : totalResults === 0 ? (
          <NoResults query={trimmed} />
        ) : (
          <div className="space-y-8">
            {showDishes && matchingProducts.length > 0 && (
              <section>
                <SectionHeader
                  title="Dishes"
                  count={matchingProducts.length}
                  subtitle={`Matching “${trimmed}”`}
                />
                <ul className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 lg:gap-3">
                  {matchingProducts.map((p, idx) => (
                    <motion.li
                      key={p.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.25 }}
                    >
                      <Link
                        href={`/${p.storeSlug}/${p.slug}`}
                        className="group flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-2.5 transition hover:border-[var(--color-primary)]/25 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]"
                      >
                        <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--color-line)]">
                          <Image
                            src={p.image}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover transition group-hover:scale-[1.05]"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-bold tracking-tight text-[var(--color-ink)]">
                            {p.name}
                          </span>
                          <span className="mt-0.5 block truncate text-[12.5px] text-[var(--color-ink-muted)]">
                            {p.description}
                          </span>
                          <span className="mt-1 flex items-center gap-2 text-[12px]">
                            <span className="font-bold text-[var(--color-primary)]">
                              {formatPrice(p.price)}
                            </span>
                            {p.rating && (
                              <span className="inline-flex items-center gap-0.5 text-[var(--color-ink-muted)]">
                                <StarIcon className="h-3 w-3 text-[var(--color-accent)]" />
                                {p.rating.toFixed(1)}
                              </span>
                            )}
                          </span>
                        </span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </section>
            )}

            {showStores && matchingStores.length > 0 && (
              <section>
                <SectionHeader
                  title="Stores"
                  count={matchingStores.length}
                  subtitle={`Open spots that match “${trimmed}”`}
                />
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-9">
                  {matchingStores.map((s, idx) => (
                    <StoreCard key={s.id} store={s} index={idx} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  count,
}: {
  title: string;
  subtitle?: string;
  count?: number;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[18px] font-extrabold tracking-tight text-[var(--color-ink)]">
          {title}
          {typeof count === "number" && (
            <span className="rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-[12px] font-bold tabular-nums text-[var(--color-primary-dark)]">
              {count}
            </span>
          )}
        </h2>
        {subtitle && (
          <p className="mt-0.5 truncate text-[12.5px] text-[var(--color-ink-muted)]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyLanding({
  stores,
  onPick,
}: {
  stores: Store[];
  onPick: (term: string) => void;
}) {
  return (
    <div className="space-y-6 pt-2">
      <div className="rounded-[1.35rem] border border-[var(--color-line)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-primary-soft)]/50 p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
          Search ìlú
        </p>
        <h1 className="mt-1 text-[22px] font-extrabold tracking-tight text-[var(--color-ink)]">
          Find your next meal
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
          Search by dish, restaurant, or vibe. Try “smoky jollof” or “late night
          shawarma”.
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-soft)]">
          Try one of these
        </h3>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onPick(t)}
              className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary-soft)]"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-soft)]">
          Popular spots
        </h3>
        <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-3">
          {stores
            .filter((s) => s.isFeatured)
            .slice(0, 4)
            .map((s) => (
              <li key={s.id}>
                <Link
                  href={`/${s.slug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-2.5 transition hover:border-[var(--color-primary)]/25"
                >
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[var(--color-line)]">
                    <Image src={s.image} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold tracking-tight text-[var(--color-ink)]">
                      {s.name}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[var(--color-ink-muted)]">
                      <ClockIcon className="h-3 w-3" />
                      {formatDeliveryTime(s.deliveryTimeMins)}
                      <span aria-hidden>·</span>
                      <span>★ {s.rating.toFixed(1)}</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-[var(--color-line)] bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-bg)] p-8 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[var(--color-primary)]/[0.07] blur-2xl"
      />
      <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[28px] ring-1 ring-[var(--color-primary)]/10">
        🔎
      </div>
      <h3 className="relative text-[16px] font-extrabold tracking-tight text-[var(--color-ink)]">
        Nothing found for “{query}”
      </h3>
      <p className="relative mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
        Try a shorter word, double-check spelling, or browse a craving from the
        home page.
      </p>
      <Link
        href="/"
        className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-4 py-2 text-[13px] font-bold text-white transition hover:bg-black"
      >
        Browse all stores
      </Link>
    </div>
  );
}
