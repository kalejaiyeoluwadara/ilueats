"use client";

import type { Product, Store } from "@/types";
import { ProductCard } from "@/components/store/ProductCard";

interface MenuSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  store: Store;
}

export function MenuSection({ title, subtitle, products, store }: MenuSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="px-4">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-extrabold tracking-tight text-[var(--color-ink)]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[12px] text-[var(--color-ink-muted)]">
              {subtitle}
            </p>
          )}
        </div>
        <span className="text-[11px] font-semibold text-[var(--color-ink-soft)]">
          {products.length} item{products.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {products.map((p, idx) => (
          <ProductCard key={p.id} product={p} store={store} index={idx} />
        ))}
      </div>
    </section>
  );
}
