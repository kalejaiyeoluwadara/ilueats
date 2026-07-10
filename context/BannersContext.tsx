"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AdSlide } from "@/types";
import { ApiError } from "@/lib/api/client";
import {
  createBanner as apiCreateBanner,
  deleteBanner as apiDeleteBanner,
  fetchBanners,
  reorderBanners as apiReorderBanners,
  updateBanner as apiUpdateBanner,
  type BannerUpsertPayload,
} from "@/lib/api/banners";

export type { BannerUpsertPayload } from "@/lib/api/banners";

type BannersContextValue = {
  banners: AdSlide[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addBanner: (input: BannerUpsertPayload, file?: File | null) => Promise<AdSlide>;
  updateBanner: (
    id: string,
    input: Partial<BannerUpsertPayload>,
    file?: File | null
  ) => Promise<AdSlide>;
  removeBanner: (id: string) => Promise<void>;
  reorderBanner: (from: number, to: number) => Promise<void>;
};

const BannersContext = createContext<BannersContextValue | null>(null);

export function BannerProvider({
  children,
  initialBanners,
}: {
  children: React.ReactNode;
  /** Server-rendered snapshot. When present the first paint already has banners. */
  initialBanners?: AdSlide[];
}) {
  const [banners, setBanners] = useState<AdSlide[]>(initialBanners ?? []);
  const [loading, setLoading] = useState(!initialBanners);
  const [error, setError] = useState<string | null>(null);
  const seeded = useRef(!!initialBanners);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBanners(await fetchBanners());
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't load banners."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (seeded.current) {
      seeded.current = false;
      return;
    }
    load();
  }, [load]);

  const value = useMemo<BannersContextValue>(
    () => ({
      banners,
      loading,
      error,
      refetch: load,
      addBanner: async (input, file) => {
        const created = await apiCreateBanner(input, file);
        await load();
        return created;
      },
      updateBanner: async (id, input, file) => {
        const updated = await apiUpdateBanner(id, input, file);
        await load();
        return updated;
      },
      removeBanner: async (id) => {
        await apiDeleteBanner(id);
        await load();
      },
      reorderBanner: async (from, to) => {
        if (
          from === to ||
          from < 0 ||
          to < 0 ||
          from >= banners.length ||
          to >= banners.length
        ) {
          return;
        }
        const next = [...banners];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        setBanners(next);
        await apiReorderBanners(next.map((b) => b.id));
      },
    }),
    [banners, loading, error, load]
  );

  return (
    <BannersContext.Provider value={value}>{children}</BannersContext.Provider>
  );
}

export function useBanners() {
  const ctx = useContext(BannersContext);
  if (!ctx) {
    throw new Error("useBanners must be used within a BannerProvider");
  }
  return ctx;
}
