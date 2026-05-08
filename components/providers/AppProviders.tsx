"use client";

import { AddressesProvider } from "@/context/AddressesContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { ToastProvider } from "@/context/ToastContext";

/**
 * Composes all client-side React contexts. Nested order matters where hooks
 * might interact (e.g. checkout uses auth + addresses + cart).
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <FavoritesProvider>
          <AddressesProvider>
            <CartProvider>{children}</CartProvider>
          </AddressesProvider>
        </FavoritesProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
