"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useSearch } from "@/context/SearchContext";

const SUGGESTIONS = ["Jollof", "Shawarma", "Burger", "Pastries", "Smoothie"];

const CRAVINGS = [
  { word: "jollof", color: "#e64e0e" },
  { word: "shawarma", color: "#b83a05" },
  { word: "cake", color: "#c2417f" },
  { word: "smoothies", color: "#0f7a3d" },
  { word: "suya", color: "#a05c00" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

function RotatingCraving() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const t = window.setInterval(
      () => setIndex((i) => (i + 1) % CRAVINGS.length),
      2600
    );
    return () => window.clearInterval(t);
  }, [reduceMotion]);

  const current = CRAVINGS[index];

  return (
    <span className="relative inline-flex overflow-hidden pb-[0.12em] align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={current.word}
          initial={{ y: "105%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-105%", opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          style={{ color: current.color }}
          className="inline-block whitespace-nowrap"
        >
          {current.word}?
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function HeroBanner() {
  const { openSearch } = useSearch();

  return (
    <section className="px-4 pt-4 pb-4 lg:pt-2">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="space-y-4"
      >
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
            Ilisan · open now
          </p>
          <h1 className="font-display mt-1.5 text-[30px] font-extrabold leading-[1.04] tracking-tight text-[var(--color-ink)] sm:text-[34px] lg:text-[40px]">
            Craving
            <br />
            <RotatingCraving />
          </h1>
          <p className="mt-2 text-[13.5px] font-medium text-[var(--color-ink-muted)]">
            Your town&apos;s kitchens, at your door in minutes.
          </p>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => openSearch()}
            aria-label="Open search"
            className="group/search shadow-crisp flex w-full min-h-[3.25rem] cursor-pointer items-center gap-3 rounded-[1.35rem] border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 text-left transition-[box-shadow,border-color,transform] duration-200 hover:border-[var(--color-primary)]/30 hover:shadow-lift focus:outline-none focus-visible:-translate-y-[0.5px] focus-visible:border-[var(--color-primary)]/40 focus-visible:shadow-search-focus active:scale-[0.995]"
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
                  ease: EASE,
                }}
                onClick={() => openSearch(s)}
                className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--color-ink)] shadow-[0_1px_0_rgba(35,21,18,0.04)] transition-[border-color,box-shadow,background-color,transform] hover:border-[var(--color-primary)]/25 hover:bg-[var(--color-primary-soft)] hover:shadow-[0_2px_8px_-2px_rgba(230,78,14,0.2)] active:scale-[0.98]"
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
