"use client";

import { useEffect } from "react";
import { AddressesProvider } from "@/context/AddressesContext";
import { AuthProvider } from "@/context/AuthContext";
import { BannerProvider } from "@/context/BannersContext";
import { CatalogProvider } from "@/context/CatalogContext";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { OrdersProvider } from "@/context/OrdersContext";
import { SearchProvider } from "@/context/SearchContext";
import { ToastProvider } from "@/context/ToastContext";
import { PWAInstallPrompt } from "@/components/layout/PWAInstallPrompt";

/**
 * Composes all client-side React contexts. Nested order matters where hooks
 * might interact (e.g. checkout uses auth + addresses + cart).
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
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
    <ToastProvider>
      <AuthProvider>
        {/* Catalog must wrap SearchProvider so SearchModal (sibling to pages) sees the same snapshot. */}
        <CatalogProvider>
          {/* Orders wrap everything order-adjacent: checkout writes, admin + rider read. */}
          <OrdersProvider>
          <BannerProvider>
            <SearchProvider>
              <FavoritesProvider>
                <AddressesProvider>
                  <CartProvider>
                    {children}
                    <PWAInstallPrompt />
                  </CartProvider>
                </AddressesProvider>
              </FavoritesProvider>
            </SearchProvider>
          </BannerProvider>
          </OrdersProvider>
        </CatalogProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
