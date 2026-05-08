"use client";

import { useMemo, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { HeroBanner } from "@/components/home/HeroBanner";
import { CategoryPills } from "@/components/home/CategoryPills";
import { AdBanner } from "@/components/home/AdBanner";
import { FeaturedItems } from "@/components/home/FeaturedItems";
import { StoreCard } from "@/components/home/StoreCard";
import {
  adSlides,
  getFeaturedProducts,
  getStoresByCategory,
  products,
  stores,
} from "@/data/mockData";
import type { CategoryId } from "@/types";

export default function HomePage() {
  const [category, setCategory] = useState<CategoryId>("all");
  const [query, setQuery] = useState("");

  const featuredStores = useMemo(
    () => stores.filter((s) => s.isFeatured),
    []
  );
  const featuredProducts = useMemo(() => getFeaturedProducts(), []);

  const filteredStores = useMemo(() => {
    let list = getStoresByCategory(category);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        if (
          s.name.toLowerCase().includes(q) ||
          s.tagline.toLowerCase().includes(q) ||
          s.tags?.some((t) => t.toLowerCase().includes(q))
        ) {
          return true;
        }
        // search products inside the store too
        return products.some(
          (p) =>
            p.storeId === s.id &&
            (p.name.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q))
        );
      });
    }
    return list;
  }, [category, query]);

  const matchingProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query]);

  const isSearching = query.trim().length > 0;

  return (
    <div className="min-h-screen pb-24">
      <Navbar variant="home" />

      <main className="mx-auto max-w-2xl">
        <HeroBanner query={query} onQueryChange={setQuery} />

        {!isSearching && (
          <div className="pt-1 pb-2">
            <AdBanner slides={adSlides} />
          </div>
        )}

        <div className="pt-2">
          <CategoryPills active={category} onChange={setCategory} />
        </div>

        {!isSearching && featuredProducts.length > 0 && (
          <div className="pt-4">
            <FeaturedItems
              title="Fresh from your ìlú"
              subtitle="The crowd favourites this week"
              items={featuredProducts}
            />
          </div>
        )}

        {!isSearching && featuredStores.length > 0 && (
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

        {isSearching && matchingProducts.length > 0 && (
          <section className="px-4 pt-5">
            <h2 className="mb-2 text-[16px] font-extrabold tracking-tight">
              Matching dishes
            </h2>
            <FeaturedItems
              title=""
              items={matchingProducts}
            />
          </section>
        )}

        <section className="px-4 pt-5">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-[18px] font-extrabold tracking-tight text-[var(--color-ink)]">
                {isSearching
                  ? `Results${
                      filteredStores.length > 0
                        ? ` (${filteredStores.length})`
                        : ""
                    }`
                  : "All stores nearby"}
              </h2>
              {!isSearching && (
                <p className="text-[12.5px] text-[var(--color-ink-muted)]">
                  {category === "all"
                    ? "Everywhere worth eating"
                    : "Filtered by your craving"}
                </p>
              )}
            </div>
          </div>

          {filteredStores.length === 0 ? (
            <EmptyState query={query} category={category} />
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

function EmptyState({
  query,
  category,
}: {
  query: string;
  category: CategoryId;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-[var(--color-line)]">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-2xl">
        🍽️
      </div>
      <h3 className="text-[15px] font-bold tracking-tight">
        Nothing here yet
      </h3>
      <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
        {query
          ? `No stores match “${query}”. Try a different word.`
          : `No stores yet for the ${category} category. Check back soon.`}
      </p>
    </div>
  );
}
