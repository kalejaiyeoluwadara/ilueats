"use client";

import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";

interface StoreCardSkeletonProps {
  variant?: "vertical" | "horizontal";
}

/** Shimmering skeleton loader for StoreCard. */
export function StoreCardSkeleton({ variant = "vertical" }: StoreCardSkeletonProps) {
  const isHorizontal = variant === "horizontal";
  return (
    <div
      className={cn(
        "min-w-0",
        isHorizontal ? "w-56 shrink-0" : "w-full"
      )}
    >
      <div className="overflow-hidden rounded-2xl">
        <div
          className={cn(
            "relative bg-[var(--color-line)] skeleton",
            isHorizontal
              ? "h-32 w-56 rounded-2xl"
              : "aspect-[16/10] w-full rounded-2xl"
          )}
        >
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
            <div className="h-4 w-28 rounded bg-white/30" />
            <div className="h-5 w-8 rounded-full bg-white/30" />
          </div>
        </div>
      </div>

      <div className="min-w-0 px-1 pt-2.5">
        <div className="h-3.5 w-3/4 rounded bg-[var(--color-line)] skeleton" />
        <div className="mt-2 flex items-center gap-3">
          <div className="h-3 w-16 rounded bg-[var(--color-line)] skeleton" />
          <div className="h-3 w-2 rounded bg-[var(--color-line)] skeleton" />
          <div className="h-3 w-16 rounded bg-[var(--color-line)] skeleton" />
        </div>
      </div>
    </div>
  );
}

/** Shimmering skeleton loader for FeaturedItems list. */
export function FeaturedItemsSkeleton() {
  return (
    <section className="px-4">
      <div className="mb-3">
        <div className="h-5 w-48 rounded bg-[var(--color-line)] skeleton" />
        <div className="mt-1.5 h-3.5 w-32 rounded bg-[var(--color-line)] skeleton" />
      </div>

      <div className="no-scrollbar fade-right-mask flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="w-[170px] flex-none">
            <div className="aspect-square w-full rounded-2xl bg-[var(--color-line)] skeleton" />
            <div className="px-1 pt-2">
              <div className="h-4 w-3/4 rounded bg-[var(--color-line)] skeleton" />
              <div className="mt-2 h-3.5 w-1/2 rounded bg-[var(--color-line)] skeleton" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Shimmering skeleton loader for ProductCard. */
export function ProductCardSkeleton() {
  return (
    <div className="flex items-stretch gap-3 rounded-2xl bg-white p-3 ring-1 ring-[var(--color-line)]">
      <div className="min-w-0 flex-1 py-1">
        <div className="h-4 w-1/2 rounded bg-[var(--color-line)] skeleton" />
        <div className="mt-2 h-3 w-5/6 rounded bg-[var(--color-line)] skeleton" />
        <div className="mt-1 h-3 w-2/3 rounded bg-[var(--color-line)] skeleton" />
        <div className="mt-3.5 h-4 w-16 rounded bg-[var(--color-line)] skeleton" />
      </div>

      <div className="h-24 w-24 flex-none rounded-xl bg-[var(--color-line)] skeleton" />
    </div>
  );
}

/** Shimmering skeleton loader for StoreHeader. */
export function StoreHeaderSkeleton() {
  return (
    <section>
      <div className="h-44 w-full sm:h-56 lg:h-72 lg:rounded-3xl bg-[var(--color-line)] skeleton" />

      <div className="relative -mt-10 px-4">
        <div className="rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.03]">
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 flex-none rounded-xl bg-[var(--color-line)] skeleton" />
            <div className="min-w-0 flex-1">
              <div className="h-5 w-44 rounded bg-[var(--color-line)] skeleton" />
              <div className="mt-2 h-3.5 w-24 rounded bg-[var(--color-line)] skeleton" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--color-line)] pt-4">
            <div className="text-center space-y-1">
              <div className="h-4 w-12 mx-auto rounded bg-[var(--color-line)] skeleton" />
              <div className="h-3 w-16 mx-auto rounded bg-[var(--color-line)] skeleton" />
            </div>
            <div className="text-center space-y-1">
              <div className="h-4 w-12 mx-auto rounded bg-[var(--color-line)] skeleton" />
              <div className="h-3 w-16 mx-auto rounded bg-[var(--color-line)] skeleton" />
            </div>
            <div className="text-center space-y-1">
              <div className="h-4 w-12 mx-auto rounded bg-[var(--color-line)] skeleton" />
              <div className="h-3 w-16 mx-auto rounded bg-[var(--color-line)] skeleton" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-3.5 w-32 rounded bg-[var(--color-line)] skeleton" />
            <div className="h-3.5 w-32 rounded bg-[var(--color-line)] skeleton" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Shimmering page skeleton loader for full-page Store metadata loading. */
export function StorePageSkeleton() {
  return (
    <div className="min-h-screen pb-32 lg:pb-40">
      <Navbar variant="page" title="" showSearch={false} />

      <main className="mx-auto max-w-2xl lg:max-w-5xl lg:px-6">
        <StoreHeaderSkeleton />

        <div className="sticky top-14 z-30 bg-[var(--color-bg)]/85 backdrop-blur-md lg:top-16">
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-9 w-20 flex-none rounded-full bg-[var(--color-line)] skeleton"
              />
            ))}
          </div>
        </div>

        <div className="px-4 space-y-6 pt-2">
          <div>
            <div className="mb-3 h-5 w-32 rounded bg-[var(--color-line)] skeleton" />
            <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
              {Array.from({ length: 4 }).map((_, idx) => (
                <ProductCardSkeleton key={idx} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
