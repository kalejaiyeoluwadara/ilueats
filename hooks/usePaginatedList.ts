"use client";

import { useEffect, useMemo, useState } from "react";
import {
  clampPage,
  getPageCount,
  getPageSlice,
} from "@/lib/pagination";

export function usePaginatedList<T>(items: readonly T[], pageSize: number) {
  const total = items.length;
  const pageCount = useMemo(() => getPageCount(total, pageSize), [total, pageSize]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage((prev) => clampPage(prev, pageCount));
  }, [pageCount]);

  const safePage = clampPage(page, pageCount);
  const pageItems = useMemo(
    () => getPageSlice(items, safePage, pageSize),
    [items, safePage, pageSize]
  );

  return {
    page: safePage,
    setPage,
    pageCount,
    pageItems,
    total,
    pageSize,
  };
}
