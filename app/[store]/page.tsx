"use client";

import { useMemo, useState, use } from "react";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { StoreHeader } from "@/components/store/StoreHeader";
import { MenuSection } from "@/components/store/MenuSection";
import { CartFooter } from "@/components/cart/CartFooter";
import { useCatalog } from "@/context/CatalogContext";
import {
  categories,
  getStoreBySlug,
} from "@/data/mockData";
import { cn } from "@/lib/utils";
import type { CategoryId } from "@/types";

interface PageProps {
  params: Promise<{ store: string }>;
}

export default function StorePage({ params }: PageProps) {
  const { store: storeSlug } = use(params);
  const { stores, products } = useCatalog();

  const store = useMemo(
    () => getStoreBySlug(storeSlug),
    [stores, storeSlug]
  );

  const allProducts = useMemo(
    () => (store ? products.filter((p) => p.storeId === store.id) : []),
    [store, products]
  );

  // Build category list from product categories that exist on this store
  const availableCategoryIds = useMemo(() => {
    const set = new Set<CategoryId>();
    allProducts.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [allProducts]);

  const tabs = useMemo(() => {
    return categories.filter(
      (c) => c.id === "all" || availableCategoryIds.includes(c.id)
    );
  }, [availableCategoryIds]);

  const [activeTab, setActiveTab] = useState<CategoryId>("all");

  const visible = useMemo(() => {
    if (activeTab === "all") return allProducts;
    return allProducts.filter((p) => p.category === activeTab);
  }, [allProducts, activeTab]);

  const grouped = useMemo(() => {
    const map = new Map<CategoryId, typeof visible>();
    visible.forEach((p) => {
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    });
    return Array.from(map.entries());
  }, [visible]);

  if (!store) {
    notFound();
  }

  return (
    <div className="min-h-screen pb-32 lg:pb-40">
      <Navbar variant="page" title={store.name} showSearch={false} />

      <main className="mx-auto max-w-2xl lg:max-w-5xl lg:px-6">
        <StoreHeader store={store} />

        <div className="sticky top-14 z-30 bg-[var(--color-bg)]/85 backdrop-blur-md lg:top-16">
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
            {tabs.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "h-9 flex-none rounded-full px-3.5 text-[13px] font-semibold tracking-tight transition-colors",
                    isActive
                      ? "bg-[var(--color-ink)] text-white"
                      : "bg-white text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)]"
                  )}
                >
                  <span aria-hidden className="mr-1">
                    {t.emoji}
                  </span>
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 pt-2"
        >
          {grouped.length === 0 ? (
            <div className="px-4">
              <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-[var(--color-line)]">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-2xl">
                  🥡
                </div>
                <h3 className="text-[15px] font-bold tracking-tight">
                  No items match
                </h3>
                <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
                  Try another category or clear the search.
                </p>
              </div>
            </div>
          ) : (
            grouped.map(([catId, items]) => {
              const cat = categories.find((c) => c.id === catId);
              return (
                <MenuSection
                  key={catId}
                  title={`${cat?.emoji ?? ""} ${cat?.name ?? "More"}`}
                  products={items}
                  store={store}
                />
              );
            })
          )}
        </motion.div>

        <div className="px-4 pt-8 pb-4 text-center">
          <p className="text-[12px] text-[var(--color-ink-soft)]">
            Tip: tap an item to customize before adding to your bag.
          </p>
        </div>
      </main>

      <CartFooter />
      <BottomNav />
    </div>
  );
}
