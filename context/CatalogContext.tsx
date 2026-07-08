"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Product, Store } from "@/types";
import { ApiError } from "@/lib/api/client";
import {
  createMenuItem as apiCreateMenuItem,
  createStore as apiCreateStore,
  deleteMenuItem as apiDeleteMenuItem,
  fetchStores,
  updateMenuItem as apiUpdateMenuItem,
  updateStoreApi,
  type MenuItemPayload,
  type StoreUpsertPayload,
} from "@/lib/api/catalog";

export type { MenuItemPayload, StoreUpsertPayload } from "@/lib/api/catalog";

type CatalogContextValue = {
  stores: Store[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addStore: (input: StoreUpsertPayload) => Promise<Store>;
  updateStore: (storeId: string, input: Partial<StoreUpsertPayload>) => Promise<Store>;
  addMenuItem: (store: Store, input: MenuItemPayload) => Promise<Product>;
  updateMenuItem: (
    productId: string,
    input: Partial<MenuItemPayload>
  ) => Promise<Product>;
  removeMenuItem: (productId: string) => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStores(await fetchStores());
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't load stores."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo<CatalogContextValue>(
    () => ({
      stores,
      loading,
      error,
      refetch: load,
      addStore: async (input) => {
        const created = await apiCreateStore(input);
        await load();
        return created;
      },
      updateStore: async (storeId, input) => {
        const updated = await updateStoreApi(storeId, input);
        await load();
        return updated;
      },
      addMenuItem: (store, input) => apiCreateMenuItem(store.id, input),
      updateMenuItem: (productId, input) => apiUpdateMenuItem(productId, input),
      removeMenuItem: (productId) => apiDeleteMenuItem(productId),
    }),
    [stores, loading, error, load]
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
