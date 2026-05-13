"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { AdSlide } from "@/types";
import {
  addBanner as bannerAdd,
  hydrateBannersFromStorage,
  getBannersServerSnapshot,
  getBannersSnapshot,
  removeBanner as bannerRemove,
  reorderBanner as bannerReorder,
  resetBannersToSeed,
  subscribeBanners,
  updateBanner as bannerUpdate,
  type BannerUpsertPayload,
} from "@/lib/bannerStore";

type BannersContextValue = {
  banners: AdSlide[];
  addBanner: (input: BannerUpsertPayload) => AdSlide;
  updateBanner: (
    id: string,
    input: Partial<BannerUpsertPayload>
  ) => AdSlide | undefined;
  removeBanner: (id: string) => void;
  reorderBanner: (from: number, to: number) => void;
  resetToSeed: () => void;
};

const BannersContext = createContext<BannersContextValue | null>(null);

export function BannerProvider({ children }: { children: React.ReactNode }) {
  const banners = useSyncExternalStore(
    subscribeBanners,
    getBannersSnapshot,
    getBannersServerSnapshot
  );

  useEffect(() => {
    hydrateBannersFromStorage();
  }, []);

  const value = useMemo<BannersContextValue>(
    () => ({
      banners,
      addBanner: bannerAdd,
      updateBanner: bannerUpdate,
      removeBanner: bannerRemove,
      reorderBanner: bannerReorder,
      resetToSeed: resetBannersToSeed,
    }),
    [banners]
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
