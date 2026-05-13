"use client";

import { AddressesProvider } from "@/context/AddressesContext";
import { AuthProvider } from "@/context/AuthContext";
import { CatalogProvider } from "@/context/CatalogContext";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
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
          <SearchProvider>
            <FavoritesProvider>
              <AddressesProvider>
                <CartProvider>{children}</CartProvider>
              </AddressesProvider>
            </FavoritesProvider>
          </SearchProvider>
        </CatalogProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
