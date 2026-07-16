import { apiFetch } from "./client";
import type { PaginatedResult } from "./orders";
import type { CategoryId, Product, ProductOptionGroup, Store } from "@/types";

export type MenuCategoryId = Exclude<CategoryId, "all">;

export type StoreQuery = {
  category?: MenuCategoryId;
  featured?: boolean;
  q?: string;
};

/** CatalogController serves every read below without a guard. */
const PUBLIC = { auth: false } as const;

/** Extra options callers pass when reading the catalog during a server render. */
export type PublicReadOptions = { revalidate?: number };

export async function fetchStores(
  query?: StoreQuery,
  opts: PublicReadOptions = {}
): Promise<Store[]> {
  const { items } = await apiFetch<{ items: Store[] }>("/stores", {
    ...PUBLIC,
    ...opts,
    query,
  });
  return items;
}

export async function fetchStore(slug: string): Promise<Store> {
  return apiFetch<Store>(`/stores/${encodeURIComponent(slug)}`, PUBLIC);
}

export async function fetchStoreProducts(
  slug: string,
  category?: MenuCategoryId
): Promise<Product[]> {
  const { items } = await apiFetch<{ items: Product[] }>(
    `/stores/${encodeURIComponent(slug)}/products`,
    { ...PUBLIC, query: { category } }
  );
  return items;
}

export async function fetchFeaturedProducts(
  opts: PublicReadOptions = {}
): Promise<Product[]> {
  const { items } = await apiFetch<{ items: Product[] }>("/products/featured", {
    ...PUBLIC,
    ...opts,
  });
  return items;
}

export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  const { items } = await apiFetch<{ items: Product[] }>("/products/by-ids", {
    ...PUBLIC,
    query: { ids: ids.join(",") },
  });
  return items;
}

export async function fetchProduct(
  storeSlug: string,
  productSlug: string
): Promise<Product> {
  return apiFetch<Product>(
    `/products/${encodeURIComponent(storeSlug)}/${encodeURIComponent(productSlug)}`,
    PUBLIC
  );
}

export async function searchCatalog(
  q: string,
  type: "all" | "stores" | "dishes" = "all"
): Promise<{ stores: Store[]; products: Product[] }> {
  if (!q.trim()) return { stores: [], products: [] };
  return apiFetch<{ stores: Store[]; products: Product[] }>("/search", {
    ...PUBLIC,
    query: { q, type },
  });
}

/* -------------------------------------------------------------------------- */
/* Admin mutations                                                            */
/* -------------------------------------------------------------------------- */

export type StoreUpsertPayload = Omit<Store, "id" | "slug" | "geo"> & {
  slug?: string;
  /** Sent as a lat/lng pair — the API builds the GeoJSON `geo` point from them. */
  latitude?: number;
  longitude?: number;
};

export async function createStore(payload: StoreUpsertPayload): Promise<Store> {
  return apiFetch<Store>("/stores", { method: "POST", body: payload });
}

export async function updateStoreApi(
  id: string,
  payload: Partial<StoreUpsertPayload>
): Promise<Store> {
  return apiFetch<Store>(`/stores/${id}`, { method: "PATCH", body: payload });
}

export type MenuItemPayload = {
  name: string;
  description: string;
  price: number;
  category: MenuCategoryId;
  image: string;
  oldPrice?: number;
  isPopular?: boolean;
  isNew?: boolean;
  rating?: number;
  reviews?: number;
  slug?: string;
  options?: ProductOptionGroup[];
};

/** Backend only persists id/name/required/multi/choices[{id,name,priceDelta}] per option group. */
function normalizeOptions(options?: ProductOptionGroup[]) {
  if (!options?.length) return undefined;
  return options.map((g) => ({
    id: g.id,
    name: g.name,
    required: !!g.required,
    multi: !!g.multi,
    choices: g.choices.map((c) => ({
      id: c.id,
      name: c.name,
      priceDelta: c.priceDelta ?? 0,
    })),
  }));
}

export async function createMenuItem(
  storeId: string,
  payload: MenuItemPayload
): Promise<Product> {
  return apiFetch<Product>(`/stores/${storeId}/menu-items`, {
    method: "POST",
    body: { ...payload, options: normalizeOptions(payload.options) },
  });
}

export async function updateMenuItem(
  productId: string,
  payload: Partial<MenuItemPayload>
): Promise<Product> {
  return apiFetch<Product>(`/menu-items/${productId}`, {
    method: "PATCH",
    body: { ...payload, options: normalizeOptions(payload.options) },
  });
}

export async function deleteMenuItem(productId: string): Promise<void> {
  await apiFetch<void>(`/menu-items/${productId}`, { method: "DELETE" });
}

export async function deleteStoreApi(storeId: string): Promise<void> {
  await apiFetch<void>(`/stores/${storeId}`, { method: "DELETE" });
}

/** Get-or-create the hidden house store that owns independent items. */
export async function ensurePlatformStore(): Promise<Store> {
  return apiFetch<Store>("/platform-store", { method: "POST" });
}

export type AdminMenuItem = Product & {
  storeName: string;
  storeIsPlatform?: boolean;
};

export type AdminMenuItemsQuery = {
  q?: string;
  category?: MenuCategoryId;
  storeId?: string;
  page?: number;
  pageSize?: number;
};

export async function fetchAdminMenuItems(
  params: AdminMenuItemsQuery = {}
): Promise<PaginatedResult<AdminMenuItem>> {
  return apiFetch<PaginatedResult<AdminMenuItem>>("/menu-items", {
    query: {
      q: params.q || undefined,
      category: params.category,
      storeId: params.storeId,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 12,
    },
  });
}

export async function duplicateMenuItem(
  productId: string,
  targetStoreId?: string
): Promise<Product> {
  return apiFetch<Product>(`/menu-items/${productId}/duplicate`, {
    method: "POST",
    body: targetStoreId ? { storeId: targetStoreId } : {},
  });
}
