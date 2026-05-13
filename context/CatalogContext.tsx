"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { Product, Store } from "@/types";
import {
  addMenuItem as catalogAddMenuItem,
  addStore as catalogAddStore,
  getCatalogServerSnapshot,
  getCatalogSnapshot,
  hydrateCatalogFromStorage,
  type MenuItemPayload,
  removeMenuItem as catalogRemoveMenuItem,
  resetCatalogToSeed,
  subscribeCatalog,
  updateMenuItem as catalogUpdateMenuItem,
  updateStore as catalogUpdateStore,
  type StoreUpsertPayload,
} from "@/lib/catalogStore";

type CatalogContextValue = {
  stores: Store[];
  products: Product[];
  addStore: (input: StoreUpsertPayload) => Store;
  updateStore: (storeId: string, input: Partial<StoreUpsertPayload>) => void;
  addMenuItem: (store: Store, input: MenuItemPayload) => Product;
  updateMenuItem: (
    productId: string,
    input: Partial<MenuItemPayload>
  ) => Product | undefined;
  removeMenuItem: (productId: string) => void;
  resetToSeed: () => void;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeCatalog,
    getCatalogSnapshot,
    getCatalogServerSnapshot
  );

  useEffect(() => {
    hydrateCatalogFromStorage();
  }, []);

  const value = useMemo<CatalogContextValue>(
    () => ({
      stores: snapshot.stores,
      products: snapshot.products,
      addStore: catalogAddStore,
      updateStore: catalogUpdateStore,
      addMenuItem: catalogAddMenuItem,
      updateMenuItem: catalogUpdateMenuItem,
      removeMenuItem: catalogRemoveMenuItem,
      resetToSeed: resetCatalogToSeed,
    }),
    [snapshot.products, snapshot.stores]
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useCatalog must be used within a CatalogProvider");
  }
  return ctx;
}

export function useOptionalCatalog(): CatalogContextValue | null {
  return useContext(CatalogContext);
}
