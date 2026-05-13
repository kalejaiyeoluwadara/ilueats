"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  ClockIcon,
  FireIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { categories } from "@/data/mockData";
import { useCatalog } from "@/context/CatalogContext";
import { formatDeliveryTime, formatPrice, readLocalStorage, writeLocalStorage } from "@/lib/utils";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional initial query (e.g. when re-opening) */
  initialQuery?: string;
}

const TRENDING = [
  "Jollof",
  "Pepperoni",
  "Shawarma",
  "Smoothie",
  "Pounded yam",
  "Cake",
];

const RECENT_KEY = "ilueats:recent-searches";
const RECENT_MAX = 6;

export function SearchModal({ open, onClose, initialQuery = "" }: SearchModalProps) {
  const router = useRouter();
  const { stores, products } = useCatalog();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(initialQuery);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setQuery(initialQuery);
    setRecent(readLocalStorage<string[]>(RECENT_KEY, []));
    const t = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(t);
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const trimmed = query.trim();
  const isSearching = trimmed.length > 0;

  const matchingProducts = useMemo(() => {
    if (!isSearching) return [];
    const q = trimmed.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [trimmed, isSearching, products]);

  const matchingStores = useMemo(() => {
    if (!isSearching) return [];
    const q = trimmed.toLowerCase();
    return stores
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.tagline.toLowerCase().includes(q) ||
          s.tags?.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 4);
  }, [trimmed, isSearching, stores]);

  const totalResults = matchingProducts.length + matchingStores.length;

  const persistRecent = (term: string) => {
    const value = term.trim();
    if (!value) return;
    const next = [value, ...recent.filter((r) => r.toLowerCase() !== value.toLowerCase())].slice(
      0,
      RECENT_MAX
    );
    setRecent(next);
    writeLocalStorage(RECENT_KEY, next);
  };

  const removeRecent = (term: string) => {
    const next = recent.filter((r) => r !== term);
    setRecent(next);
    writeLocalStorage(RECENT_KEY, next);
  };

  const clearRecent = () => {
    setRecent([]);
    writeLocalStorage(RECENT_KEY, []);
  };

  const submit = (term?: string) => {
    const value = (term ?? trimmed).trim();
    if (!value) return;
    persistRecent(value);
    onClose();
    router.push(`/search?q=${encodeURIComponent(value)}`);
  };

  const followLink = (href: string) => {
    if (trimmed) persistRecent(trimmed);
    onClose();
    router.push(href);
  };

  const quickCategories = useMemo(
    () => categories.filter((c) => c.id !== "all").slice(0, 6),
    []
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="search-root"
          className="fixed inset-0 z-[95] flex items-stretch justify-center sm:items-start sm:pt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.button
            type="button"
            aria-label="Close search"
            onClick={onClose}
            tabIndex={-1}
            className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            initial={{ opacity: 0, y: -12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--color-bg)] shadow-[0_24px_60px_rgba(0,0,0,0.18)] sm:h-auto sm:max-h-[min(720px,calc(100vh-7rem))] sm:max-w-xl sm:rounded-3xl"
          >
            <div className="border-b border-[var(--color-line)] bg-[var(--color-bg)] px-3 pt-[max(env(safe-area-inset-top),12px)] pb-3 sm:px-4 sm:pt-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                className="flex items-center gap-2"
              >
                <div className="group/search relative flex h-12 flex-1 items-center gap-2.5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] pl-2 pr-1.5 transition focus-within:border-[var(--color-primary)]/45 focus-within:shadow-[0_0_0_3px_var(--color-primary-soft)]">
                  <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" strokeWidth={2} />
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
                    className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-[var(--color-ink)] placeholder:font-normal placeholder:text-[var(--color-ink-soft)] focus:outline-none"
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
                <button
                  type="button"
                  onClick={onClose}
                  className="px-2 text-[13px] font-semibold text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)] sm:px-3"
                >
                  Cancel
                </button>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-24 sm:px-5 sm:pb-6">
              <AnimatePresence mode="wait" initial={false}>
                {isSearching ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-5 pt-4"
                  >
                    {totalResults === 0 ? (
                      <EmptyResults query={trimmed} />
                    ) : (
                      <>
                        {matchingProducts.length > 0 && (
                          <Section
                            title="Dishes"
                            badge={`${matchingProducts.length}`}
                          >
                            <ul className="space-y-1.5">
                              {matchingProducts.map((p) => (
                                <li key={p.id}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      followLink(`/${p.storeSlug}/${p.slug}`)
                                    }
                                    className="group flex w-full items-center gap-3 rounded-2xl border border-transparent bg-[var(--color-surface)] p-2.5 text-left transition hover:border-[var(--color-primary)]/15 hover:bg-[var(--color-primary-soft)]/40"
                                  >
                                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[var(--color-line)]">
                                      <Image
                                        src={p.image}
                                        alt=""
                                        fill
                                        sizes="48px"
                                        className="object-cover"
                                      />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-[14px] font-bold tracking-tight text-[var(--color-ink)]">
                                        <Highlight text={p.name} match={trimmed} />
                                      </span>
                                      <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[var(--color-ink-muted)]">
                                        <span className="font-semibold text-[var(--color-primary)]">
                                          {formatPrice(p.price)}
                                        </span>
                                        <span aria-hidden>·</span>
                                        <span className="truncate">
                                          {stores.find((x) => x.id === p.storeId)
                                            ?.name ?? ""}
                                        </span>
                                      </span>
                                    </span>
                                    <ArrowUpRightIcon
                                      className="h-4 w-4 shrink-0 text-[var(--color-ink-soft)] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--color-primary)]"
                                      strokeWidth={2.2}
                                    />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </Section>
                        )}

                        {matchingStores.length > 0 && (
                          <Section
                            title="Stores"
                            badge={`${matchingStores.length}`}
                          >
                            <ul className="space-y-1.5">
                              {matchingStores.map((s) => (
                                <li key={s.id}>
                                  <button
                                    type="button"
                                    onClick={() => followLink(`/${s.slug}`)}
                                    className="group flex w-full items-center gap-3 rounded-2xl border border-transparent bg-[var(--color-surface)] p-2.5 text-left transition hover:border-[var(--color-primary)]/15 hover:bg-[var(--color-primary-soft)]/40"
                                  >
                                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[var(--color-line)]">
                                      <Image
                                        src={s.image}
                                        alt=""
                                        fill
                                        sizes="48px"
                                        className="object-cover"
                                      />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-[14px] font-bold tracking-tight text-[var(--color-ink)]">
                                        <Highlight text={s.name} match={trimmed} />
                                      </span>
                                      <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[var(--color-ink-muted)]">
                                        <ClockIcon className="h-3 w-3 text-[var(--color-ink-soft)]" />
                                        <span>
                                          {formatDeliveryTime(s.deliveryTimeMins)}
                                        </span>
                                        <span aria-hidden>·</span>
                                        <span className="truncate">
                                          ★ {s.rating.toFixed(1)} · {s.reviews}+
                                        </span>
                                      </span>
                                    </span>
                                    <ArrowUpRightIcon
                                      className="h-4 w-4 shrink-0 text-[var(--color-ink-soft)] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--color-primary)]"
                                      strokeWidth={2.2}
                                    />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </Section>
                        )}
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-6 pt-4"
                  >
                    {recent.length > 0 && (
                      <Section
                        title="Recent"
                        action={
                          <button
                            type="button"
                            onClick={clearRecent}
                            className="text-[12px] font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                          >
                            Clear
                          </button>
                        }
                      >
                        <div className="flex flex-wrap gap-2">
                          {recent.map((term) => (
                            <span
                              key={term}
                              className="group inline-flex items-center gap-1 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] pl-3 pr-1 text-[13px] font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary-soft)]"
                            >
                              <button
                                type="button"
                                onClick={() => submit(term)}
                                className="flex items-center gap-1.5 py-1.5"
                              >
                                <ClockIcon className="h-3.5 w-3.5 text-[var(--color-ink-soft)] group-hover:text-[var(--color-primary)]" />
                                {term}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeRecent(term)}
                                aria-label={`Remove ${term}`}
                                className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[var(--color-ink-soft)] hover:bg-black/[0.06] hover:text-[var(--color-ink)]"
                              >
                                <XMarkIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </Section>
                    )}

                    <Section
                      title="Trending now"
                      icon={
                        <FireIcon className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                      }
                    >
                      <div className="flex flex-wrap gap-2">
                        {TRENDING.map((t, i) => (
                          <motion.button
                            key={t}
                            type="button"
                            onClick={() => submit(t)}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.04 * i, duration: 0.22 }}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary-soft)] hover:shadow-[0_2px_10px_-4px_rgba(232,84,26,0.3)] active:scale-[0.98]"
                          >
                            <span className="text-[10px] font-bold tabular-nums text-[var(--color-ink-soft)]">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            {t}
                          </motion.button>
                        ))}
                      </div>
                    </Section>

                    <Section
                      title="Browse by craving"
                      icon={
                        <Squares2X2Icon className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                      }
                    >
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
                        {quickCategories.map((c, i) => (
                          <motion.button
                            key={c.id}
                            type="button"
                            onClick={() => submit(c.name)}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.04 * i, duration: 0.22 }}
                            className="group flex flex-col items-start gap-1 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-left transition hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary-soft)]"
                          >
                           
                            <span className="text-[12.5px] font-bold tracking-tight text-[var(--color-ink)]">
                              {c.name}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </Section>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {isSearching && totalResults > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ type: "spring", stiffness: 360, damping: 30 }}
                  className="absolute inset-x-0 bottom-0 border-t border-[var(--color-line)] bg-[var(--color-bg)]/90 px-3 py-3 backdrop-blur sm:px-4"
                >
                  <button
                    type="button"
                    onClick={() => submit()}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl bg-[var(--color-primary)] px-4 py-3 text-white shadow-[0_8px_24px_-8px_rgba(232,84,26,0.55)] transition hover:bg-[var(--color-primary-dark)] active:scale-[0.99]"
                  >
                    <span className="flex items-center gap-2 text-[14px] font-bold tracking-tight">
                      <MagnifyingGlassIcon className="h-4 w-4" strokeWidth={2.4} />
                      View all results
                      <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[11px] font-bold tabular-nums">
                        {totalResults}+
                      </span>
                    </span>
                    <ArrowRightIcon className="h-4 w-4" strokeWidth={2.4} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({
  title,
  badge,
  icon,
  action,
  children,
}: {
  title: string;
  badge?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-soft)]">
          {icon}
          {title}
          {badge && (
            <span className="rounded-full bg-[var(--color-primary-soft)] px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-[var(--color-primary-dark)]">
              {badge}
            </span>
          )}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Highlight({ text, match }: { text: string; match: string }) {
  if (!match) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(match.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-[3px] bg-[var(--color-primary-soft)] px-0.5 text-[var(--color-primary-dark)]">
        {text.slice(idx, idx + match.length)}
      </mark>
      {text.slice(idx + match.length)}
    </>
  );
}

function EmptyResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[28px] ring-1 ring-[var(--color-primary)]/15">
        🔎
        <span
          aria-hidden
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-surface)] text-[10px] font-bold text-[var(--color-ink-muted)] ring-1 ring-[var(--color-line)]"
        >
          ?
        </span>
      </div>
      <h3 className="text-[15px] font-extrabold tracking-tight text-[var(--color-ink)]">
        No matches for “{query}”
      </h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
        Try a shorter word, check spelling, or pick a craving from the trending
        list above.
      </p>
    </div>
  );
}
