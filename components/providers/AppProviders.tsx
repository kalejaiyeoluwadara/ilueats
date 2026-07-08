"use client";

import { AddressesProvider } from "@/context/AddressesContext";
import { AuthProvider } from "@/context/AuthContext";
import { BannerProvider } from "@/context/BannersContext";
import { CatalogProvider } from "@/context/CatalogContext";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { OrdersProvider } from "@/context/OrdersContext";
import { SearchProvider } from "@/context/SearchContext";
import { ToastProvider } from "@/context/ToastContext";

/**
 * Composes all client-side React contexts. Nested order matters where hooks
 * might interact (e.g. checkout uses auth + addresses + cart).
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
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
                  <CartProvider>{children}</CartProvider>
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
