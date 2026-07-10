"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { AddressesProvider } from "@/context/AddressesContext";
import { AuthProvider } from "@/context/AuthContext";
import { BannerProvider } from "@/context/BannersContext";
import { CatalogProvider } from "@/context/CatalogContext";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { OrdersProvider } from "@/context/OrdersContext";
import { PlatformStatusProvider } from "@/context/PlatformStatusContext";
import { SearchProvider } from "@/context/SearchContext";
import { ToastProvider } from "@/context/ToastContext";
import { PlatformClosedFrame } from "@/components/layout/PlatformClosedFrame";
import { PWAInstallPrompt } from "@/components/layout/PWAInstallPrompt";
import type { AdSlide, Store } from "@/types";

/**
 * Composes all client-side React contexts. Nested order matters where hooks
 * might interact (e.g. checkout uses auth + addresses + cart).
 */
export function AppProviders({
  children,
  initialStores,
  initialBanners,
}: {
  children: React.ReactNode;
  initialStores?: Store[];
  initialBanners?: AdSlide[];
}) {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("[PWA] Service Worker registered with scope:", reg.scope))
        .catch((err) => console.error("[PWA] Service Worker registration failed:", err));
    }
  }, []);

  return (
    <SessionProvider>
    <ToastProvider>
      <AuthProvider>
        {/* Catalog must wrap SearchProvider so SearchModal (sibling to pages) sees the same snapshot. */}
        <CatalogProvider initialStores={initialStores}>
          {/* Orders wrap everything order-adjacent: checkout writes, admin + rider read. */}
          <OrdersProvider>
          <BannerProvider initialBanners={initialBanners}>
            <SearchProvider>
              <FavoritesProvider>
                <AddressesProvider>
                  <CartProvider>
                    <PlatformStatusProvider>
                      <PlatformClosedFrame>{children}</PlatformClosedFrame>
                      <PWAInstallPrompt />
                    </PlatformStatusProvider>
                  </CartProvider>
                </AddressesProvider>
              </FavoritesProvider>
            </SearchProvider>
          </BannerProvider>
          </OrdersProvider>
        </CatalogProvider>
      </AuthProvider>
    </ToastProvider>
    </SessionProvider>
  );
}
