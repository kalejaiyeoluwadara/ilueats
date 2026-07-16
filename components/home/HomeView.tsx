"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { HeroBanner } from "@/components/home/HeroBanner";
import { CategoryPills } from "@/components/home/CategoryPills";
import { AdBanner } from "@/components/home/AdBanner";
import { FeaturedItems } from "@/components/home/FeaturedItems";
import { StoreCard } from "@/components/home/StoreCard";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { FeaturedItemsSkeleton, StoreCardSkeleton } from "@/components/ui/Skeletons";
import { useBanners } from "@/context/BannersContext";
import { useCatalog } from "@/context/CatalogContext";
import { useFeaturedProducts } from "@/hooks/useCatalogQueries";
import type { CategoryId, Product } from "@/types";

export function HomeView({ initialFeatured }: { initialFeatured?: Product[] }) {
  const { stores, loading: storesLoading, error: storesError, refetch } = useCatalog();
  const { banners } = useBanners();
  const { products: featuredProducts, loading: featuredLoading } =
    useFeaturedProducts(initialFeatured);
  const [category, setCategory] = useState<CategoryId>("all");

  const featuredStores = useMemo(
    () => stores.filter((s) => s.isFeatured),
    [stores]
  );

  const filteredStores = useMemo(() => {
    if (category === "all") return stores;
    return stores.filter((s) => s.categories.includes(category));
  }, [category, stores]);

  return (
    <div className="min-h-screen pb-24 lg:pb-12">
      <Navbar variant="home" />

      <main className="mx-auto max-w-2xl lg:max-w-6xl lg:px-6">
        <div className="lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10 lg:pt-6">
          <HeroBanner />

          {banners.length > 0 && (
            <div className="pt-1 pb-2 lg:p-0">
              <AdBanner slides={banners} />
            </div>
          )}
        </div>

        <div className="pt-2 lg:pt-6">
          <CategoryPills active={category} onChange={setCategory} />
        </div>

        {featuredLoading ? (
          <div className="pt-4">
            <FeaturedItemsSkeleton />
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="pt-4">
            <FeaturedItems
              title="Fresh from your ìlú"
              subtitle="The crowd favourites this week"
              items={featuredProducts}
            />
          </div>
        ) : null}

        {featuredStores.length > 0 && (
          <section className="px-4 pt-5">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 className="font-display text-[19px] font-bold tracking-tight text-[var(--color-ink)]">
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
              <h2 className="font-display text-[19px] font-bold tracking-tight text-[var(--color-ink)]">
                All stores nearby
              </h2>
              <p className="mt-0.5 text-[12.5px] text-[var(--color-ink-muted)]">
                {category === "all"
                  ? "Everywhere worth eating"
                  : "Filtered by your craving"}
              </p>
            </div>
            <Link
              href="/stores"
              className="group inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[13px] font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
            >
              View all
              <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {storesLoading ? (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-9">
              {Array.from({ length: 6 }).map((_, idx) => (
                <StoreCardSkeleton key={idx} />
              ))}
            </div>
          ) : storesError ? (
            <ErrorState
              title="Stores didn't load"
              message={storesError}
              onRetry={refetch}
            />
          ) : filteredStores.length === 0 ? (
            <EmptyState
              title="Nothing here yet"
              description={`No stores yet for the ${category} category. Check back soon.`}
            />
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-9">
              {filteredStores.map((s, idx) => (
                <StoreCard key={s.id} store={s} index={idx} />
              ))}
            </div>
          )}
        </section>

        <Footer />
      </main>

      <BottomNav />
    </div>
  );
}
