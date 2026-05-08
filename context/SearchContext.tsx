"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { SearchModal } from "@/components/search/SearchModal";

type SearchContextValue = {
  openSearch: (initialQuery?: string) => void;
  closeSearch: () => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");

  const openSearch = useCallback((q = "") => {
    setInitialQuery(q);
    setOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setInitialQuery("");
  }, []);

  const value = useMemo(
    () => ({ openSearch, closeSearch }),
    [openSearch, closeSearch],
  );

  return (
    <SearchContext.Provider value={value}>
      {children}
      <SearchModal open={open} onClose={closeSearch} initialQuery={initialQuery} />
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error("useSearch must be used within SearchProvider");
  }
  return ctx;
}
