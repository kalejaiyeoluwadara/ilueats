"use client";

import { useMemo, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { HeroBanner } from "@/components/home/HeroBanner";
import { CategoryPills } from "@/components/home/CategoryPills";
import { AdBanner } from "@/components/home/AdBanner";
import { FeaturedItems } from "@/components/home/FeaturedItems";
import { StoreCard } from "@/components/home/StoreCard";
import { getFeaturedProducts, getStoresByCategory } from "@/data/mockData";
import { useBanners } from "@/context/BannersContext";
import type { CategoryId } from "@/types";
import { useCatalog } from "@/context/CatalogContext";

export default function HomePage() {
  const { stores } = useCatalog();
  const { banners } = useBanners();
  const [category, setCategory] = useState<CategoryId>("all");

  const featuredStores = useMemo(
    () => stores.filter((s) => s.isFeatured),
    [stores],
  );
  const featuredProducts = useMemo(() => getFeaturedProducts(), [stores]);

  const filteredStores = useMemo(
    () => getStoresByCategory(category),
    [category, stores],
  );

  return (
    <div className="min-h-screen pb-24">
      <Navbar variant="home" />

      <main className="mx-auto max-w-2xl">
        <HeroBanner />

        <div className="pt-1 pb-2">
          <AdBanner slides={banners} />
        </div>

        <div className="pt-2">
          <CategoryPills active={category} onChange={setCategory} />
        </div>

        {featuredProducts.length > 0 && (
          <div className="pt-4">
            <FeaturedItems
              title="Fresh from your ìlú"
              subtitle="The crowd favourites this week"
              items={featuredProducts}
            />
          </div>
        )}

        {featuredStores.length > 0 && (
          <section className="px-4 pt-5">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 className="text-[18px] font-extrabold tracking-tight text-[var(--color-ink)]">
                  Featured stores
                </h2>
                <p className="text-[12.5px] text-[var(--color-ink-muted)]">
                  Hand-picked spots in Ilisan
                </p>
              </div>
            </div>
            <div className="no-scrollbar fade-right-mask flex gap-3 overflow-x-auto -mx-4 px-4 pb-2">
              {featuredStores.map((s, idx) => (
                <div key={s.id} className="flex-none">
                  <StoreCard store={s} index={idx} variant="horizontal" />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="px-4 pt-5">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[18px] font-extrabold tracking-tight text-[var(--color-ink)]">
                All stores nearby
              </h2>
              <p className="mt-0.5 text-[12.5px] text-[var(--color-ink-muted)]">
                {category === "all"
                  ? "Everywhere worth eating"
                  : "Filtered by your craving"}
              </p>
            </div>
          </div>

          {filteredStores.length === 0 ? (
            <EmptyState category={category} />
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {filteredStores.map((s, idx) => (
                <StoreCard key={s.id} store={s} index={idx} />
              ))}
            </div>
          )}
        </section>

        <footer className="px-4 pt-10 pb-6 text-center">
          <p className="text-[12px] font-semibold text-[var(--color-ink-soft)]">
            ilú · your town. your taste. delivered.
          </p>
        </footer>
      </main>

      <BottomNav />
    </div>
  );
}

function EmptyState({ category }: { category: CategoryId }) {
  return (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-[var(--color-line)] bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-bg)] p-6 text-center shadow-crisp">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[var(--color-primary)]/[0.07] blur-2xl"
        aria-hidden
      />
      <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-2xl shadow-[inset_0_1px_0_rgb(255_255_255/0.65)] ring-1 ring-[var(--color-primary)]/10">
        🍽️
      </div>
      <h3 className="relative text-[16px] font-extrabold tracking-tight text-[var(--color-ink)]">
        Nothing here yet
      </h3>
      <p className="relative mt-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
        No stores yet for the {category} category. Check back soon.
      </p>
    </div>
  );
}
