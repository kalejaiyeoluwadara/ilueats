"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { HeroBanner } from "@/components/home/HeroBanner";
import { AdBanner } from "@/components/home/AdBanner";
import { FeaturedItems } from "@/components/home/FeaturedItems";
import { StoreCard } from "@/components/home/StoreCard";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { HomeSkeleton } from "@/components/ui/Skeletons";
import { useHomepage } from "@/hooks/useHomepage";
import { useAuth } from "@/hooks/useAuth";
import { useAddresses } from "@/hooks/useAddresses";
import { AddressOnboardingModal } from "@/components/home/AddressOnboardingModal";
import { readLocalStorage, writeLocalStorage } from "@/lib/utils";
import type { HomepageData } from "@/lib/api/home";

const ONBOARD_DISMISS_KEY = "ilueats:addr-onboard-dismissed:v1";

export function HomeView({ initial }: { initial?: HomepageData }) {
  const {
    stores,
    featured: featuredProducts,
    banners,
    loading,
    error,
    refetch,
  } = useHomepage(initial);

  // First-run address capture — only for signed-in customers with no saved
  // address, and only until they save or dismiss it once on this device.
  const { user, ready: authReady } = useAuth();
  const { addresses, ready: addrReady } = useAddresses();
  const [onboardOpen, setOnboardOpen] = useState(false);

  useEffect(() => {
    // Only nudge a signed-in customer who has no saved address yet, and only
    // once per device (respecting an earlier dismissal).
    if (!authReady || !user) return;
    if (!addrReady || addresses.length > 0) return;
    if (readLocalStorage(ONBOARD_DISMISS_KEY, false)) return;
    const t = setTimeout(() => setOnboardOpen(true), 1200);
    return () => clearTimeout(t);
  }, [authReady, user, addrReady, addresses.length]);

  const dismissOnboard = () => {
    writeLocalStorage(ONBOARD_DISMISS_KEY, true);
    setOnboardOpen(false);
  };

  const featuredStores = useMemo(
    () => stores.filter((s) => s.isFeatured),
    [stores]
  );

  // The whole page hydrates from a single /home request. Until it lands (and
  // when the server didn't seed us) show one cohesive skeleton rather than
  // per-section loaders popping in independently.
  if (loading && stores.length === 0) {
    return <HomeSkeleton />;
  }

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

        {featuredProducts.length > 0 ? (
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
                Everywhere worth eating
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

          {error ? (
            <ErrorState
              title="Stores didn't load"
              message={error}
              onRetry={refetch}
            />
          ) : stores.length === 0 ? (
            <EmptyState
              title="Nothing here yet"
              description="No stores available right now. Check back soon."
            />
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-9">
              {stores.map((s, idx) => (
                <StoreCard key={s.id} store={s} index={idx} />
              ))}
            </div>
          )}
        </section>

        <Footer />
      </main>

      <BottomNav />

      <AddressOnboardingModal open={onboardOpen} onClose={dismissOnboard} />
    </div>
  );
}
