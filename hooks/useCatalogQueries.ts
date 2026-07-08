"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  fetchFeaturedProducts,
  fetchProduct,
  fetchStore,
  fetchStoreProducts,
  searchCatalog,
} from "@/lib/api/catalog";
import type { Product, Store } from "@/types";

function messageFor(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** Single store by slug — used on the store detail page. */
export function useStore(slug: string) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      setStore(await fetchStore(slug));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setError(messageFor(err, "Couldn't load this store."));
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { store, loading, error, notFound, refetch };
}

/** Menu items for a store — store detail page + admin menu builder. */
export function useStoreProducts(slug: string | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!!slug);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!slug) {
      setProducts([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setProducts(await fetchStoreProducts(slug));
    } catch (err) {
      setError(messageFor(err, "Couldn't load the menu."));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { products, loading, error, refetch };
}

/** Single product by store + product slug — product detail page. */
export function useProduct(storeSlug: string, productSlug: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      setProduct(await fetchProduct(storeSlug, productSlug));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setError(messageFor(err, "Couldn't load this dish."));
      }
    } finally {
      setLoading(false);
    }
  }, [storeSlug, productSlug]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { product, loading, error, notFound, refetch };
}

/** Crowd-favourite dishes for the home page. */
export function useFeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await fetchFeaturedProducts());
    } catch (err) {
      setError(messageFor(err, "Couldn't load featured dishes."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { products, loading, error, refetch };
}

/** Debounced cross-catalog search — search page + search modal. */
export function useSearchCatalog(query: string, type: "all" | "stores" | "dishes" = "all") {
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setStores([]);
      setProducts([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const t = window.setTimeout(async () => {
      try {
        const result = await searchCatalog(trimmed, type);
        if (cancelled) return;
        setStores(result.stores);
        setProducts(result.products);
      } catch (err) {
        if (!cancelled) setError(messageFor(err, "Search failed. Try again."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [query, type]);

  return { stores, products, loading, error };
}
