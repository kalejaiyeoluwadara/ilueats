"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ClockIcon, StarIcon } from "@heroicons/react/24/solid";
import { TruckIcon } from "@heroicons/react/24/outline";
import type { Store } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { cn, formatDeliveryTime, formatPrice } from "@/lib/utils";

interface StoreCardProps {
  store: Store;
  index?: number;
  variant?: "vertical" | "horizontal";
}

export function StoreCard({ store, index = 0, variant = "vertical" }: StoreCardProps) {
  const isHorizontal = variant === "horizontal";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn("min-w-0", isHorizontal && "w-56 shrink-0")}
    >
      <Link
        href={`/${store.slug}`}
        className="group block min-w-0 rounded-2xl transition-transform duration-300 ease-out hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
      >
        <div className="overflow-hidden rounded-2xl transition-shadow duration-300 group-hover:shadow-lift">
          <div
            className={
              isHorizontal
                ? "relative h-32 w-56 overflow-hidden rounded-2xl"
                : "relative aspect-[16/10] overflow-hidden rounded-2xl"
            }
          >
            <Image
              src={store.cover}
              alt={store.name}
              fill
              sizes={
                isHorizontal
                  ? "224px"
                  : "(max-width: 640px) 100vw, (max-width: 1024px) 600px, 380px"
              }
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" />

            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              {store.isNew && <Badge tone="brand">New</Badge>}
              {store.isFeatured && !store.isNew && (
                <Badge tone="warning">Featured</Badge>
              )}
              {!store.isOpen && <Badge tone="dark">Closed</Badge>}
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-display truncate text-[16px] font-bold text-white drop-shadow-sm">
                  {store.name}
                </h3>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-[var(--color-ink)]">
                <StarIcon className="h-3 w-3 text-[var(--color-accent)]" />
                {store.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="min-w-0 px-1 pt-2.5">
          <p className="truncate text-[13px] text-[var(--color-ink-muted)]">
            {store.tagline}
          </p>
          <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium text-[var(--color-ink-muted)]">
            <span className="inline-flex min-w-0 shrink items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-soft)]" />
              <span className="truncate">{formatDeliveryTime(store.deliveryTimeMins)}</span>
            </span>
            <span aria-hidden className="shrink-0 text-[var(--color-ink-soft)]">
              ·
            </span>
            <span className="inline-flex min-w-0 shrink items-center gap-1">
              <TruckIcon className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-soft)]" />
              <span className="truncate">{formatPrice(store.deliveryFee)}</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
