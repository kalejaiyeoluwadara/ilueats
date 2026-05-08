"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { StarIcon } from "@heroicons/react/24/solid";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";

interface FeaturedItemsProps {
  title: string;
  subtitle?: string;
  items: Product[];
  /** When false, horizontal scroller aligns flush (e.g. inside a padded card). */
  padX?: boolean;
}

export function FeaturedItems({
  title,
  subtitle,
  items,
  padX = true,
}: FeaturedItemsProps) {
  if (items.length === 0) return null;

  const showHeader = Boolean(title || subtitle);
  const gutter = padX ? "px-4" : "px-0";

  return (
    <section>
      {showHeader && (
        <div className={`mb-3 flex items-end justify-between gap-3 ${gutter}`}>
          <div>
            <h2 className="text-[18px] font-extrabold tracking-tight text-[var(--color-ink)]">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[12.5px] text-[var(--color-ink-muted)]">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      <div
        className={`no-scrollbar fade-right-mask flex gap-3 overflow-x-auto pb-2 ${gutter}`}
      >
        {items.map((p, idx) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.3 }}
            className="flex-none"
          >
            <Link
              href={`/${p.storeSlug}/${p.slug}`}
              className="group block w-[170px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] rounded-2xl"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-[var(--color-line)]">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  sizes="170px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
                <FavoriteButton
                  productId={p.id}
                  size="sm"
                  className="absolute right-2 top-2 z-10"
                />
                {p.rating ? (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10.5px] font-bold text-[var(--color-ink)]">
                    <StarIcon className="h-3 w-3 text-[var(--color-accent)]" />
                    {p.rating.toFixed(1)}
                  </span>
                ) : null}
              </div>
              <div className="px-1 pt-2">
                <p className="line-clamp-1 text-[13.5px] font-bold tracking-tight text-[var(--color-ink)]">
                  {p.name}
                </p>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-[13px] font-bold text-[var(--color-primary)]">
                    {formatPrice(p.price)}
                  </span>
                  {p.oldPrice && (
                    <span className="text-[11px] font-medium text-[var(--color-ink-soft)] line-through">
                      {formatPrice(p.oldPrice)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
