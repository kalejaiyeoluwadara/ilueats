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
import type { Product, Store } from "@/types";
import { ApiError, LOAD_FAILED_FALLBACK } from "@/lib/api/client";
import {
  createMenuItem as apiCreateMenuItem,
  createStore as apiCreateStore,
  deleteMenuItem as apiDeleteMenuItem,
  deleteStoreApi,
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
  removeStore: (storeId: string) => Promise<void>;
  addMenuItem: (store: Store, input: MenuItemPayload) => Promise<Product>;
  updateMenuItem: (
    productId: string,
    input: Partial<MenuItemPayload>
  ) => Promise<Product>;
  removeMenuItem: (productId: string) => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({
  children,
  initialStores,
}: {
  children: React.ReactNode;
  /** Server-rendered snapshot. When present the first paint already has stores. */
  initialStores?: Store[];
}) {
  const [stores, setStores] = useState<Store[]>(initialStores ?? []);
  const [loading, setLoading] = useState(!initialStores);
  const [error, setError] = useState<string | null>(null);
  const seeded = useRef(!!initialStores);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStores(await fetchStores());
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : LOAD_FAILED_FALLBACK
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

  const value = useMemo<CatalogContextValue>(
    () => ({
      stores,
      loading,
      error,
      refetch: load,
      // Mutations patch local state directly so the stores grid never flashes
      // its full-page loader — the changed card updates in place.
      addStore: async (input) => {
        const created = await apiCreateStore(input);
        setStores((prev) => [created, ...prev]);
        return created;
      },
      updateStore: async (storeId, input) => {
        const updated = await updateStoreApi(storeId, input);
        setStores((prev) =>
          prev.map((s) => (s.id === storeId ? updated : s))
        );
        return updated;
      },
      removeStore: async (storeId) => {
        await deleteStoreApi(storeId);
        setStores((prev) => prev.filter((s) => s.id !== storeId));
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
