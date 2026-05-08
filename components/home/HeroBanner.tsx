"use client";

import { motion } from "framer-motion";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface HeroBannerProps {
  query: string;
  onQueryChange: (q: string) => void;
}

export function HeroBanner({ query, onQueryChange }: HeroBannerProps) {
  return (
    <section className="px-4 pt-3 pb-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-3"
      >
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
            Hey there 👋
          </p>
          <h1 className="mt-1 text-[26px] font-extrabold leading-[1.1] tracking-tight text-[var(--color-ink)] sm:text-[30px]">
            What are you craving
            <br />
            <span className="text-[var(--color-primary)]">today?</span>
          </h1>
        </div>

        <label
          htmlFor="search"
          className="flex h-12 items-center gap-2 rounded-2xl bg-white px-4 ring-1 ring-[var(--color-line)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/40"
        >
          <MagnifyingGlassIcon className="h-5 w-5 text-[var(--color-ink-soft)]" />
          <input
            id="search"
            type="search"
            inputMode="search"
            placeholder="Search jollof, pizza, cake…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="flex-1 bg-transparent text-[14px] font-medium text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="rounded-full px-2 text-[11px] font-semibold text-[var(--color-ink-muted)] hover:bg-black/5"
            >
              Clear
            </button>
          )}
        </label>
      </motion.div>
    </section>
  );
}
