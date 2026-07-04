"use client";

import { motion } from "framer-motion";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useSearch } from "@/context/SearchContext";

const SUGGESTIONS = ["Jollof", "Shawarma", "Burger", "Pastries", "Smoothie"];

export function HeroBanner() {
  const { openSearch } = useSearch();

  return (
    <section className="px-4 pt-3 pb-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-4"
      >
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
            Hey there
          </p>
          <h1 className="mt-1 text-[26px] font-extrabold leading-[1.1] tracking-tight text-[var(--color-ink)] sm:text-[30px] lg:text-[36px]">
            What are you craving
            <br />
            <span className="text-[var(--color-primary)]">today?</span>
          </h1>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => openSearch()}
            aria-label="Open search"
            className="group/search shadow-crisp flex w-full min-h-[3.25rem] cursor-pointer items-center gap-3 rounded-[1.35rem] border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 text-left transition-[box-shadow,border-color,transform] duration-200 focus:outline-none focus-visible:-translate-y-[0.5px] focus-visible:border-[var(--color-primary)]/40 focus-visible:shadow-search-focus active:scale-[0.995]"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-[var(--color-primary-soft)] text-[var(--color-primary)] transition-[transform,background-color] duration-200 group-hover/search:scale-[1.02] group-hover/search:bg-[var(--color-primary)]/12 group-focus-visible/search:scale-[1.02]"
              aria-hidden
            >
              <MagnifyingGlassIcon className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1 py-2 text-[15px] font-medium text-[var(--color-ink-soft)]">
              Search dishes, cafés, cravings…
            </span>
          </button>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="mr-0.5 w-full text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-soft)] sm:mr-1 sm:w-auto">
              Popular now
            </span>
            {SUGGESTIONS.map((s, i) => (
              <motion.button
                key={s}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.05 + i * 0.04,
                  duration: 0.25,
                  ease: [0.22, 1, 0.36, 1],
                }}
                onClick={() => openSearch(s)}
                className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--color-ink)] shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-[border-color,box-shadow,background-color,transform] hover:border-[var(--color-primary)]/25 hover:bg-[var(--color-primary-soft)] hover:shadow-[0_2px_8px_-2px_rgba(232,84,26,0.2)] active:scale-[0.98]"
              >
                {s}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
