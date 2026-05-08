"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { readLocalStorage, writeLocalStorage } from "@/lib/utils";

const STORAGE_KEY = "ilueats:favorites:v1";

interface FavoritesContextValue {
  /** Product ids, most recently favourited first */
  favoriteIds: string[];
  ready: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  count: number;
}

export const FavoritesContext = createContext<FavoritesContextValue | null>(
  null
);

export function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const skipNextWrite = useRef(true);

  useEffect(() => {
    const stored = readLocalStorage<string[]>(STORAGE_KEY, []);
    setFavoriteIds(Array.isArray(stored) ? stored : []);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    writeLocalStorage(STORAGE_KEY, favoriteIds);
  }, [favoriteIds, ready]);

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.includes(productId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback((productId: string) => {
    setFavoriteIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      return [productId, ...prev];
    });
  }, []);

  const removeFavorite = useCallback((productId: string) => {
    setFavoriteIds((prev) => prev.filter((id) => id !== productId));
  }, []);

  const count = favoriteIds.length;

  const value = useMemo(
    () => ({
      favoriteIds,
      ready,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      count,
    }),
    [favoriteIds, ready, isFavorite, toggleFavorite, removeFavorite, count]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}
