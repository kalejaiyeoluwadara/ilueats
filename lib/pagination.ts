/** 1-based page index clamped to `[1, pageCount]`. */
export function clampPage(page: number, pageCount: number): number {
  if (!Number.isFinite(pageCount) || pageCount < 1) return 1;
  const p = Math.floor(page);
  if (!Number.isFinite(p)) return 1;
  return Math.min(Math.max(1, p), pageCount);
}

export function getPageSlice<T>(
  items: readonly T[],
  page: number,
  pageSize: number
): T[] {
  if (pageSize < 1) return [...items];
  const start = (clampPage(page, getPageCount(items.length, pageSize)) - 1) * pageSize;
  return [...items.slice(start, start + pageSize)];
}

export function getPageCount(totalItems: number, pageSize: number): number {
  if (pageSize < 1) return 1;
  if (totalItems <= 0) return 1;
  return Math.ceil(totalItems / pageSize);
}

/** e.g. `1–5 of 23` — empty total yields `No results`. */
export function getPageRangeSummary(
  page: number,
  pageSize: number,
  totalItems: number
): string {
  if (totalItems <= 0) return "No results";
  const safePage = clampPage(page, getPageCount(totalItems, pageSize));
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);
  return `${start}\u2013${end} of ${totalItems}`;
}

export function normalizePageIndicators(
  page: number,
  pageCount: number,
  siblingRadius = 1
): (number | "ellipsis")[] {
  if (pageCount <= 9) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const p = clampPage(page, pageCount);
  const set = new Set<number>([1, pageCount, p]);
  for (let i = p - siblingRadius; i <= p + siblingRadius; i++) {
    if (i > 1 && i < pageCount) set.add(i);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("ellipsis");
    out.push(sorted[i]);
  }
  return out;
}
