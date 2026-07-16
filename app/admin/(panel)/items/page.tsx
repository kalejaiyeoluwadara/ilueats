"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  Square2StackIcon,
} from "@heroicons/react/24/outline";
import { AdminMenuItemModal } from "@/components/admin/AdminStoreMenuModal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { AdminItemGridSkeleton } from "@/components/ui/Skeletons";
import { ErrorState } from "@/components/ui/EmptyState";
import { useCatalog } from "@/context/CatalogContext";
import { categories as menuCategories } from "@/data/mockData";
import {
  createMenuItem,
  deleteMenuItem,
  duplicateMenuItem,
  ensurePlatformStore,
  fetchAdminMenuItems,
  updateMenuItem,
  type AdminMenuItem,
  type MenuCategoryId,
} from "@/lib/api/catalog";
import { ApiError, LOAD_FAILED_FALLBACK } from "@/lib/api/client";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useToast } from "@/hooks/useToast";
import { cn, formatPrice } from "@/lib/utils";
import type { Product, Store } from "@/types";

const ITEMS_PAGE_SIZE = 12;
const INDEPENDENT = "independent";

const selectableCategories = menuCategories.filter((c) => c.id !== "all");

function categoryName(id: string): string {
  return menuCategories.find((c) => c.id === id)?.name ?? id;
}

function AdminItemsPageInner() {
  const params = useSearchParams();
  const { stores } = useCatalog();
  const { success, error: errorToast } = useToast();

  const [platformStore, setPlatformStore] = useState<Store | null>(null);
  useEffect(() => {
    let cancelled = false;
    ensurePlatformStore()
      .then((s) => {
        if (!cancelled) setPlatformStore(s);
      })
      .catch(() => {
        // Independent items stay unavailable until the endpoint responds.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Filters — ?store= from the Stores page pre-selects a storefront.
  const [storeFilter, setStoreFilter] = useState<string>(
    params.get("store") ?? "all"
  );
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, storeFilter, category]);

  const filterStoreId =
    storeFilter === "all"
      ? undefined
      : storeFilter === INDEPENDENT
        ? platformStore?.id
        : storeFilter;

  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const waitingForPlatform = storeFilter === INDEPENDENT && !platformStore;

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (waitingForPlatform) return;
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminMenuItems({
        q: debouncedSearch.trim() || undefined,
        category: category === "all" ? undefined : (category as MenuCategoryId),
        storeId: filterStoreId,
        page,
        pageSize: ITEMS_PAGE_SIZE,
      });
      setItems(result.items);
      setTotalItems(result.totalItems);
      setPageCount(result.pageCount);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : LOAD_FAILED_FALLBACK
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, filterStoreId, page, waitingForPlatform]);

  useEffect(() => {
    load();
  }, [load]);

  /* ------------------------------ Add / edit ------------------------------ */

  const [pickerOpen, setPickerOpen] = useState(false);
  const [targetStoreId, setTargetStoreId] = useState<string>(INDEPENDENT);
  const [addStoreTarget, setAddStoreTarget] = useState<Store | null>(null);
  const [editItem, setEditItem] = useState<AdminMenuItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const storeForItem = useCallback(
    (item: AdminMenuItem): Store | null =>
      stores.find((s) => s.id === item.storeId) ??
      (platformStore && platformStore.id === item.storeId
        ? platformStore
        : null),
    [stores, platformStore]
  );

  const openAdd = () => {
    setTargetStoreId(
      storeFilter === "all" || storeFilter === INDEPENDENT
        ? INDEPENDENT
        : storeFilter
    );
    setPickerOpen(true);
  };

  const confirmPicker = () => {
    const store =
      targetStoreId === INDEPENDENT
        ? platformStore
        : (stores.find((s) => s.id === targetStoreId) ?? null);
    if (!store) {
      errorToast("Store unavailable", "Pick another store and try again.");
      return;
    }
    setPickerOpen(false);
    setAddStoreTarget(store);
  };

  // Whether a freshly added/edited item still belongs in the current view.
  const matchesFilters = useCallback(
    (item: Pick<AdminMenuItem, "category" | "storeId">) => {
      if (category !== "all" && item.category !== category) return false;
      if (filterStoreId && item.storeId !== filterStoreId) return false;
      return true;
    },
    [category, filterStoreId]
  );

  const toAdminItem = (p: Product, store: Store): AdminMenuItem => ({
    ...p,
    storeName: store.name,
    storeIsPlatform: store.id === platformStore?.id,
  });

  const onDuplicate = async (item: AdminMenuItem) => {
    setBusyId(item.id);
    try {
      const copy = await duplicateMenuItem(item.id);
      // Surface the copy right where the admin is looking instead of letting
      // it land on the last page — no full-list reload, no loader flash.
      const adminCopy: AdminMenuItem = {
        ...copy,
        storeName: item.storeName,
        storeIsPlatform: item.storeIsPlatform,
      };
      setItems((cur) => [adminCopy, ...cur]);
      setTotalItems((n) => n + 1);
      success(
        "Item duplicated",
        `${copy.name} added to the top of the list — edit it to tweak details.`
      );
    } catch {
      errorToast("Couldn't duplicate item", "Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (item: AdminMenuItem) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Delete "${item.name}"? This can't be undone.`)
    ) {
      return;
    }
    setBusyId(item.id);
    // Optimistically drop the card; restore it if the request fails.
    const snapshot = items;
    setItems((cur) => cur.filter((i) => i.id !== item.id));
    setTotalItems((n) => Math.max(0, n - 1));
    try {
      await deleteMenuItem(item.id);
      success("Item deleted", `${item.name} was removed.`);
      // Pull the next page's items up when this page empties out.
      if (snapshot.length === 1 && page > 1) {
        setPage((p) => Math.max(1, p - 1));
      }
    } catch {
      setItems(snapshot);
      setTotalItems((n) => n + 1);
      errorToast("Couldn't delete item", "Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const editStore = editItem ? storeForItem(editItem) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)] sm:text-[26px]">
            Items
          </h1>
          <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
            Every dish on ìlúEats — store menus plus independent items sold
            directly by the platform.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-5 text-[13px] font-bold text-white shadow-[0_6px_16px_-4px_rgba(232,84,26,0.45)]"
        >
          <PlusIcon className="h-5 w-5" />
          Add item
        </button>
      </div>

      {/* Store picker before the item form */}
      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Where does this item live?"
        description="Attach it to a store menu, or sell it independently under ìlúEats."
        variant="dialog"
        className="sm:max-w-md"
        footer={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => setPickerOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" fullWidth onClick={confirmPicker}>
              Continue
            </Button>
          </div>
        }
      >
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Sell under
        </label>
        <select
          className="h-11 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3.5 text-[13px] font-medium text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]/35 focus:ring-2 focus:ring-[var(--color-primary)]/18"
          value={targetStoreId}
          onChange={(e) => setTargetStoreId(e.target.value)}
        >
          <option value={INDEPENDENT} disabled={!platformStore}>
            Independent — ìlúEats Kitchen
            {platformStore ? "" : " (loading…)"}
          </option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Modal>

      {addStoreTarget ? (
        <AdminMenuItemModal
          open={!!addStoreTarget}
          mode="add"
          store={addStoreTarget}
          onClose={() => setAddStoreTarget(null)}
          onSave={async (payload) => {
            // Rejections propagate: the modal stays open with the API error inline.
            const created = await createMenuItem(addStoreTarget.id, payload);
            const adminItem = toAdminItem(created, addStoreTarget);
            // Show it immediately when it fits the current view; otherwise
            // refresh quietly so filters/pagination stay accurate.
            if (matchesFilters(adminItem)) {
              setItems((cur) => [adminItem, ...cur]);
              setTotalItems((n) => n + 1);
            } else {
              await load({ silent: true });
            }
            success(
              "Item added",
              addStoreTarget.id === platformStore?.id
                ? "Independent item is live on ìlúEats."
                : `Added to ${addStoreTarget.name}.`
            );
          }}
        />
      ) : null}

      {editItem && editStore ? (
        <AdminMenuItemModal
          open={!!editItem}
          mode="edit"
          store={editStore}
          product={editItem}
          onClose={() => setEditItem(null)}
          onSave={async (payload) => {
            const updated = await updateMenuItem(editItem.id, payload);
            // Patch the card in place — spread keeps storeName/storeIsPlatform.
            setItems((cur) =>
              cur.map((i) =>
                i.id === editItem.id ? { ...i, ...updated } : i
              )
            );
            success("Item updated", "Changes saved.");
          }}
        />
      ) : null}

      {/* Filters */}
      <section className="space-y-4 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-crisp sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 sm:max-w-md">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-soft)]" />
            <input
              type="search"
              placeholder="Search items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] pl-10 pr-4 text-[13px] font-medium text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]/35 focus:ring-2 focus:ring-[var(--color-primary)]/20"
              autoComplete="off"
            />
          </div>
          <select
            className="h-11 rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] px-4 text-[13px] font-bold text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]/35 sm:w-64"
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            aria-label="Filter by store"
          >
            <option value="all">All stores & independent</option>
            <option value={INDEPENDENT}>Independent — ìlúEats Kitchen</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[{ id: "all", name: "All categories" }, ...selectableCategories].map(
            (c) => {
              const sel = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-2 text-[12px] font-bold transition-colors",
                    sel
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-bg)] text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)] hover:bg-black/[0.03]"
                  )}
                >
                  {c.name}
                </button>
              );
            }
          )}
        </div>
      </section>

      {loading || waitingForPlatform ? (
        <AdminItemGridSkeleton count={ITEMS_PAGE_SIZE} />
      ) : error ? (
        <ErrorState
          title="Items didn't load"
          message={error}
          onRetry={() => load()}
        />
      ) : items.length === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] p-12 text-center shadow-crisp ring-1 ring-black/[0.02]">
          <p className="text-[15px] font-extrabold text-[var(--color-ink)]">
            No items found
          </p>
          <p className="mt-2 text-[13px] text-[var(--color-ink-muted)]">
            Adjust filters, clear search, or add a new item.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const busy = busyId === item.id;
            return (
              <article
                key={item.id}
                className="rounded-[1.25rem] bg-[var(--color-surface)] p-4 shadow-crisp ring-1 ring-[var(--color-line)]"
              >
                <div className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-[var(--color-line)]">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[14px] font-extrabold text-[var(--color-ink)]">
                      {item.name}
                    </h2>
                    <p className="mt-0.5 truncate text-[12px] font-semibold text-[var(--color-ink-muted)]">
                      {item.storeIsPlatform ? (
                        <span className="text-[var(--color-primary)]">
                          Independent
                        </span>
                      ) : (
                        item.storeName
                      )}{" "}
                      · {categoryName(item.category)}
                    </p>
                    <p className="mt-1 text-[13px] font-extrabold tabular-nums text-[var(--color-ink)]">
                      {formatPrice(item.price)}
                      {typeof item.oldPrice === "number" && item.oldPrice > 0 ? (
                        <span className="ml-1.5 text-[11px] font-semibold text-[var(--color-ink-soft)] line-through">
                          {formatPrice(item.oldPrice)}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>
                {(item.isPopular || item.isNew || item.options?.length) ? (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {item.isPopular ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-bold text-amber-700 ring-1 ring-inset ring-amber-200">
                        Popular
                      </span>
                    ) : null}
                    {item.isNew ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        New
                      </span>
                    ) : null}
                    {item.options?.length ? (
                      <span className="rounded-full bg-[var(--color-bg)] px-2 py-0.5 text-[10.5px] font-bold text-[var(--color-ink-muted)] ring-1 ring-inset ring-[var(--color-line)]">
                        {item.options.length} choice step
                        {item.options.length === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-3.5 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (!storeForItem(item)) {
                        errorToast(
                          "Store still loading",
                          "Try again in a moment."
                        );
                        return;
                      }
                      setEditItem(item);
                    }}
                    className="h-9 rounded-full bg-[var(--color-ink)] text-[12px] font-bold text-white disabled:opacity-60"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDuplicate(item)}
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-full bg-white text-[12px] font-bold text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)] hover:bg-black/[0.03] disabled:opacity-60"
                  >
                    <Square2StackIcon className="h-4 w-4" />
                    {busy ? "…" : "Duplicate"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDelete(item)}
                    className="h-9 rounded-full bg-white text-[12px] font-bold text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-50 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && !error && totalItems > 0 ? (
        <Pagination
          page={page}
          pageCount={pageCount}
          totalItems={totalItems}
          pageSize={ITEMS_PAGE_SIZE}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}

export default function AdminItemsPage() {
  return (
    <Suspense fallback={<AdminItemGridSkeleton count={ITEMS_PAGE_SIZE} />}>
      <AdminItemsPageInner />
    </Suspense>
  );
}
