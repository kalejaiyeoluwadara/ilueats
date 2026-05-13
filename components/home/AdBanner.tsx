"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import type { AdSlide } from "@/types";

interface AdBannerProps {
  slides: AdSlide[];
  intervalMs?: number;
}

export function AdBanner({ slides, intervalMs = 4500 }: AdBannerProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(t);
  }, [slides.length, intervalMs]);

  if (slides.length === 0) return null;
  const current = slides[index];

  return (
    <section className="px-4">
      <div className="relative h-[190px] overflow-hidden rounded-3xl bg-[var(--color-ink)] sm:h-[180px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={current.image}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 600px"
              className="object-cover"
              priority
              unoptimized={
                current.image.startsWith("data:") ||
                current.image.startsWith("blob:")
              }
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/15" />
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${current.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="relative flex h-full flex-col justify-between p-4 sm:p-5"
          >
            <div>
              {current.badge && (
                <span className="inline-flex items-center rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-white">
                  {current.badge}
                </span>
              )}
              <h3 className="mt-2 max-w-[78%] text-[18px] font-extrabold leading-tight text-white sm:text-[20px]">
                {current.title}
              </h3>
              <p className="mt-1 max-w-[78%] text-[12.5px] text-white/80">
                {current.subtitle}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Link
                href={current.href}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[12.5px] font-bold text-[var(--color-ink)] hover:bg-[var(--color-accent-soft)]"
              >
                {current.cta}
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
              <div className="flex items-center gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={
                      i === index
                        ? "h-1.5 w-5 rounded-full bg-white transition-all"
                        : "h-1.5 w-1.5 rounded-full bg-white/45 transition-all hover:bg-white/70"
                    }
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
