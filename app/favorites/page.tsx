"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HeartIcon } from "@heroicons/react/24/outline";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/EmptyState";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { useFavorites } from "@/hooks/useFavorites";
import { useCatalog } from "@/context/CatalogContext";
import { fetchProductsByIds } from "@/lib/api/catalog";
import { ApiError, LOAD_FAILED_FALLBACK } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

export default function FavoritesPage() {
  const { favoriteIds, ready } = useFavorites();
  const { stores } = useCatalog();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchProductsByIds(favoriteIds)
      .then((items) => {
        if (!cancelled) setProducts(items);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : LOAD_FAILED_FALLBACK);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, favoriteIds]);

  const items = useMemo(() => {
    if (!ready || loading) return [];
    return favoriteIds
      .map((id) => {
        const product = products.find((p) => p.id === id);
        if (!product) return null;
        const store = stores.find((s) => s.slug === product.storeSlug);
        return { product, store };
      })
      .filter(
        (x): x is NonNullable<typeof x> => x !== null && x.store !== undefined
      );
  }, [favoriteIds, ready, loading, products, stores]);

  return (
    <div className="min-h-screen pb-24">
      <Navbar variant="page" title="Favourites" showSearch={false} />
      <main className="mx-auto max-w-2xl px-4 pt-4 lg:max-w-5xl lg:px-6">
        {!ready || loading ? (
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-stretch gap-3 rounded-2xl bg-white p-3 ring-1 ring-[var(--color-line)]"
              >
                <div className="h-[88px] w-[88px] shrink-0 rounded-xl bg-[var(--color-line)] skeleton" />
                <div className="min-w-0 flex-1 py-1 space-y-2">
                  <div className="h-3 w-16 rounded bg-[var(--color-line)] skeleton" />
                  <div className="h-4.5 w-3/4 rounded bg-[var(--color-line)] skeleton" />
                  <div className="h-4 w-12 rounded bg-[var(--color-line)] skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState title="Your favourites didn't load" message={error} />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center px-4 pt-14 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary-soft)]">
              <HeartIcon className="h-9 w-9 text-[var(--color-primary)]" />
            </div>
            <h1 className="font-display mt-5 text-[20px] font-extrabold tracking-tight">
              No favourites yet
            </h1>
            <p className="mt-1.5 max-w-xs text-[13.5px] text-[var(--color-ink-muted)]">
              Tap the heart on any dish to save it here for quick ordering later.
            </p>
            <Link href="/" className="mt-6">
              <Button size="lg">Browse stores</Button>
            </Link>
          </div>
        ) : (
          <ul className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            {items.map(({ product, store }) => (
              <li key={product.id}>
                <Link
                  href={`/${product.storeSlug}/${product.slug}`}
                  className="flex items-stretch gap-3 rounded-2xl bg-white p-3 ring-1 ring-[var(--color-line)] transition-shadow hover:shadow-[0_4px_18px_rgba(0,0,0,0.06)]"
                >
                  <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-[var(--color-line)]">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="88px"
                      className="object-cover"
                    />
                    <FavoriteButton
                      productId={product.id}
                      size="sm"
                      className="absolute right-1 top-1 z-10 scale-90"
                    />
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                      {store?.name}
                    </p>
                    <h2 className="mt-0.5 line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-[var(--color-ink)]">
                      {product.name}
                    </h2>
                    <p className="mt-2 text-[15px] font-extrabold text-[var(--color-primary)]">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
