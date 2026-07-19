"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, LOAD_FAILED_FALLBACK } from "@/lib/api/client";
import { fetchHomepage, type HomepageData } from "@/lib/api/home";

const EMPTY: HomepageData = { stores: [], featured: [], banners: [] };

/**
 * Single source of truth for the home page. Replaces the separate catalog +
 * banners + featured reads with one `GET /home` round-trip. When the server
 * seeds `initial` (see app/page.tsx) the first paint already has data and no
 * skeleton flashes; otherwise it fetches on mount and the caller shows the
 * full-page skeleton until `loading` clears.
 */
export function useHomepage(initial?: HomepageData) {
  const [data, setData] = useState<HomepageData>(initial ?? EMPTY);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);
  const seeded = useRef(!!initial);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchHomepage());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : LOAD_FAILED_FALLBACK);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (seeded.current) {
      seeded.current = false;
      return;
    }
    refetch();
  }, [refetch]);

  return {
    stores: data.stores,
    featured: data.featured,
    banners: data.banners,
    loading,
    error,
    refetch,
  };
}
