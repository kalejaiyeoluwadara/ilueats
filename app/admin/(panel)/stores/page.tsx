"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { AdminStoreUpsertModal } from "@/components/admin/AdminStoreUpsertModal";
import { AdminStoreMenuModal } from "@/components/admin/AdminStoreMenuModal";
import { Pagination } from "@/components/ui/Pagination";
import { ContentLoader } from "@/components/ui/Loaders";
import { ErrorState } from "@/components/ui/EmptyState";
import { useCatalog } from "@/context/CatalogContext";
import { categories as menuCategories } from "@/data/mockData";
import { getStoreStats, type StoreOrderStats } from "@/lib/api/admin";
import { duplicateMenuItem } from "@/lib/api/catalog";
import { useStoreProducts } from "@/hooks/useCatalogQueries";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useToast } from "@/hooks/useToast";
import { cn, formatPrice } from "@/lib/utils";
import type { CategoryId, Store } from "@/types";

const STORES_PAGE_SIZE = 6;

type StoreLiveFilter = "all" | "live" | "paused";

const LIVE_FILTER_CHIPS: { id: StoreLiveFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "paused", label: "Paused" },
];

function primaryCategoryLabel(store: Store): string {
  const first = store.categories.find((c) => c !== "all");
  const id = first ? first : (store.categories[0] ?? "snacks");
  return menuCategories.find((c) => c.id === id)?.name ?? String(id);
}

function applyStoreLive(rows: Store[], filter: StoreLiveFilter): Store[] {
  if (filter === "all") return rows;
  if (filter === "live") return rows.filter((s) => s.isOpen);
  return rows.filter((s) => !s.isOpen);
}

function applyCategoryFilter(
  rows: Store[],
  catId: string
): Store[] {
  if (catId === "all") return rows;
  const id = catId as CategoryId;
  return rows.filter((s) => s.categories.some((c) => c === id));
}

function applyStoreSearch(rows: Store[], q: string): Store[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((s) => {
    const catStr = s.categories
      .map(
        (c) =>
          menuCategories.find((mc) => mc.id === c)?.name?.toLowerCase() ?? ""
      )
      .join(" ");
    return (
      s.name.toLowerCase().includes(needle) ||
      s.tagline.toLowerCase().includes(needle) ||
      s.description.toLowerCase().includes(needle) ||
      s.location.toLowerCase().includes(needle) ||
      catStr.includes(needle) ||
      !!s.tags?.some((t) => t.toLowerCase().includes(needle))
    );
  });
}

function countForLive(rows: readonly Store[], filter: StoreLiveFilter): number {
  return applyStoreLive([...rows], filter).length;
}

export default function AdminStoresPage() {
  const {
    stores,
    loading: storesLoading,
    error: storesError,
    refetch: refetchStores,
    addStore,
    updateStore,
    removeStore,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
  } = useCatalog();
  const { success, error: errorToast } = useToast();

  const [storeStats, setStoreStats] = useState<Map<
    string,
    StoreOrderStats
  > | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStoreStats()
      .then((stats) => {
        if (!cancelled) setStoreStats(stats);
      })
      .catch(() => {
        // Cards fall back to 0 orders when stats can't load.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [togglingStoreId, setTogglingStoreId] = useState<string | null>(null);

  const toggleLive = async (s: Store) => {
    setTogglingStoreId(s.id);
    try {
      await updateStore(s.id, { isOpen: !s.isOpen });
      success(
        !s.isOpen ? "Store is live" : "Store paused",
        !s.isOpen
          ? `${s.name} now takes orders.`
          : `${s.name} is hidden from checkout.`
      );
    } catch {
      errorToast("Couldn't update status", "Please try again.");
    } finally {
      setTogglingStoreId(null);
    }
  };

  const onDeleteStore = async (s: Store) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Delete "${s.name}" and all its menu items? This can't be undone.`
      )
    ) {
      return;
    }
    try {
      await removeStore(s.id);
      success("Store deleted", `${s.name} and its items were removed.`);
    } catch {
      errorToast("Couldn't delete store", "Please try again.");
    }
  };

  const catalogCategoryIds = useMemo(() => {
    const ids = new Set<string>();
    for (const s of stores) {
      for (const c of s.categories) {
        if (c !== "all") ids.add(c);
      }
    }
    const sorted = [...ids].sort((a, b) => a.localeCompare(b)) as Exclude<
      CategoryId,
      "all"
    >[];
    return sorted;
  }, [stores]);

  const categoryOptions = useMemo(
    () => ["all", ...catalogCategoryIds] as const,
    [catalogCategoryIds]
  );

  const [search, setSearch] = useState("");
  const [liveFilter, setLiveFilter] = useState<StoreLiveFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredStores = useMemo(() => {
    let r = applyStoreLive(stores, liveFilter);
    r = applyCategoryFilter(r, categoryFilter);
    r = applyStoreSearch(r, search);
    return r;
  }, [stores, liveFilter, categoryFilter, search]);

  const {
    page,
    setPage,
    pageCount,
    pageItems,
    total: storeTotal,
    pageSize,
  } = usePaginatedList(filteredStores, STORES_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, liveFilter, categoryFilter, setPage]);

  const liveChipCounts = useMemo(() => {
    const m = new Map<StoreLiveFilter, number>();
    for (const c of LIVE_FILTER_CHIPS) {
      m.set(c.id, countForLive(stores, c.id));
    }
    return m;
  }, [stores]);

  const [addOpen, setAddOpen] = useState(false);
  const [editStore, setEditStore] = useState<Store | null>(null);
  const [menuStore, setMenuStore] = useState<Store | null>(null);

  const {
    products: menuItems,
    loading: menuItemsLoading,
    error: menuItemsError,
    refetch: refetchMenuItems,
  } = useStoreProducts(menuStore?.slug ?? null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)] sm:text-[26px]">
            Stores
          </h1>
          <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
            Manage storefronts and menus — changes go live in the customer app
            instantly.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-5 text-[13px] font-bold text-white shadow-[0_6px_16px_-4px_rgba(232,84,26,0.45)]"
        >
          <PlusIcon className="h-5 w-5" />
          Add store
        </button>
      </div>

      <AdminStoreUpsertModal
        open={addOpen}
        mode="add"
        initialStore={null}
        onClose={() => setAddOpen(false)}
        onSave={async (payload) => {
          try {
            const created = await addStore(payload);
            success("Store created", `${created.name} is live in the catalog.`);
          } catch {
            errorToast("Couldn't create store", "Please check the details and try again.");
          }
        }}
      />

      <AdminStoreUpsertModal
        open={!!editStore}
        mode="edit"
        initialStore={editStore}
        onClose={() => setEditStore(null)}
        onSave={async (payload) => {
          if (!editStore) return;
          try {
            await updateStore(editStore.id, payload);
            success("Store updated", `${payload.name.trim()} saved.`);
            setEditStore(null);
          } catch {
            errorToast("Couldn't update store", "Please try again.");
          }
        }}
      />

      <AdminStoreMenuModal
        open={!!menuStore}
        store={menuStore}
        items={menuItems}
        loading={menuItemsLoading}
        error={menuItemsError}
        onClose={() => setMenuStore(null)}
        onRemoveItem={async (id) => {
          try {
            await removeMenuItem(id);
            await refetchMenuItems();
            success("Removed", "Dish dropped from menu.");
          } catch {
            errorToast("Couldn't remove dish", "Please try again.");
          }
        }}
        onDuplicateItem={async (id) => {
          try {
            const copy = await duplicateMenuItem(id);
            await refetchMenuItems();
            success("Dish duplicated", `${copy.name} copied — edit it to tweak details.`);
          } catch {
            errorToast("Couldn't duplicate dish", "Please try again.");
          }
        }}
        onUpsertAdd={async (payload) => {
          if (!menuStore) return;
          try {
            await addMenuItem(menuStore, payload);
            await refetchMenuItems();
            success("Dish added", "Menu updated — check the live storefront.");
          } catch {
            errorToast("Couldn't add dish", "Please check the details and try again.");
          }
        }}
        onUpsertEdit={async (productId, payload) => {
          try {
            await updateMenuItem(productId, payload);
            await refetchMenuItems();
            success("Dish updated", "Changes saved.");
          } catch {
            errorToast("Couldn't update dish", "Please try again.");
          }
        }}
      />

      <section className="space-y-4 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-crisp sm:p-5">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-soft)]" />
          <input
            type="search"
            placeholder="Search stores, cuisines, neighborhoods…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] pl-10 pr-4 text-[13px] font-medium text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]/35 focus:ring-2 focus:ring-[var(--color-primary)]/20"
            autoComplete="off"
          />
        </div>

        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Status
          </p>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Live status">
            {LIVE_FILTER_CHIPS.map((chip) => {
              const sel = liveFilter === chip.id;
              const count = liveChipCounts.get(chip.id) ?? 0;
              return (
                <button
                  key={chip.id}
                  type="button"
                  role="tab"
                  aria-selected={sel}
                  onClick={() => setLiveFilter(chip.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-bold transition-colors",
                    sel
                      ? "bg-[var(--color-ink)] text-white"
                      : "bg-white text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)] hover:bg-black/[0.03]"
                  )}
                >
                  {chip.label}
                  <span
                    className={cn(
                      "min-w-[1.25rem] rounded-md px-1 py-0.5 text-center text-[11px] font-extrabold tabular-nums",
                      sel
                        ? "bg-white/20 text-white"
                        : "bg-[var(--color-bg)] text-[var(--color-ink-muted)]"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Menu category on store
          </p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categoryOptions.map((cid) => {
              const selected = categoryFilter === cid;
              const label =
                cid === "all"
                  ? "All categories"
                  : menuCategories.find((c) => c.id === cid)?.name ??
                    String(cid);
              const count =
                cid === "all"
                  ? stores.length
                  : stores.filter((s) => s.categories.includes(cid as CategoryId))
                      .length;
              return (
                <button
                  key={String(cid)}
                  type="button"
                  onClick={() => setCategoryFilter(cid)}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-2 text-[12px] font-bold transition-colors",
                    selected
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-bg)] text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)] hover:bg-black/[0.03]"
                  )}
                >
                  {label}
                  <span className="ml-1.5 text-[11px] font-extrabold tabular-nums opacity-90">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {storesLoading ? (
        <ContentLoader message="Loading stores…" />
      ) : storesError ? (
        <ErrorState message={storesError} onRetry={refetchStores} />
      ) : storeTotal === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] p-12 text-center shadow-crisp ring-1 ring-black/[0.02]">
          <p className="text-[15px] font-extrabold text-[var(--color-ink)]">
            No matching stores
          </p>
          <p className="mt-2 text-[13px] text-[var(--color-ink-muted)]">
            Adjust filters, clear search, or add a new store.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((s) => (
            <article
              key={s.id}
              className="rounded-[1.25rem] bg-[var(--color-surface)] p-5 shadow-crisp ring-1 ring-[var(--color-line)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-[15px] font-extrabold text-[var(--color-ink)]">
                    {s.name}
                  </h2>
                  <p className="mt-0.5 text-[12px] font-medium text-[var(--color-ink-muted)]">
                    {primaryCategoryLabel(s)}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset",
                    s.isOpen
                      ? "bg-[var(--color-success-soft)] text-[var(--color-success)] ring-emerald-200/80"
                      : "bg-zinc-100 text-zinc-600 ring-zinc-200/80"
                  )}
                >
                  {s.isOpen ? "Live" : "Paused"}
                </span>
                <p className="text-[12px] font-semibold text-[var(--color-ink-muted)]">
                  ★ {s.rating.toFixed(1)}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-[var(--color-bg)] px-3 py-3 ring-1 ring-[var(--color-line)]">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                    Orders (7d)
                  </p>
                  <p className="mt-1 text-[20px] font-extrabold tabular-nums text-[var(--color-ink)]">
                    {storeStats ? (storeStats.get(s.id)?.orders7d ?? 0) : "…"}
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--color-bg)] px-3 py-3 ring-1 ring-[var(--color-line)]">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                    Revenue (7d)
                  </p>
                  <p className="mt-1 text-[16px] font-extrabold tabular-nums text-[var(--color-ink)]">
                    {storeStats
                      ? formatPrice(storeStats.get(s.id)?.revenue7d ?? 0)
                      : "…"}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMenuStore(s)}
                  className="h-10 rounded-full bg-white text-[12px] font-bold text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)]"
                >
                  View menu
                </button>
                <button
                  type="button"
                  onClick={() => setEditStore(s)}
                  className="h-10 rounded-full bg-[var(--color-ink)] text-[12px] font-bold text-white"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={togglingStoreId === s.id}
                  onClick={() => toggleLive(s)}
                  className={cn(
                    "h-10 rounded-full text-[12px] font-bold ring-1 ring-inset transition-colors disabled:opacity-60",
                    s.isOpen
                      ? "bg-white text-amber-700 ring-amber-200 hover:bg-amber-50"
                      : "bg-white text-emerald-700 ring-emerald-200 hover:bg-emerald-50"
                  )}
                >
                  {togglingStoreId === s.id
                    ? "Saving…"
                    : s.isOpen
                      ? "Pause orders"
                      : "Go live"}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteStore(s)}
                  className="h-10 rounded-full bg-white text-[12px] font-bold text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
              <Link
                href={`/admin/items?store=${s.id}`}
                className="mt-3 block text-center text-[12px] font-bold text-[var(--color-primary)] hover:underline"
              >
                Manage items →
              </Link>
            </article>
          ))}
        </div>
      )}

      {!storesLoading && !storesError && storeTotal > 0 ? (
        <Pagination
          page={page}
          pageCount={pageCount}
          totalItems={storeTotal}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
