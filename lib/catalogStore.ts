import { PRODUCTS_SEED, STORES_SEED } from "@/data/mockCatalog.seed";
import { readLocalStorage, shortId, slugify, writeLocalStorage } from "@/lib/utils";
import type { CategoryId, Product, Store } from "@/types";

const STORAGE_KEY = "ilueats:catalog:v1";

export type CatalogSnapshot = {
  stores: Store[];
  products: Product[];
};

type Listener = () => void;
const listeners = new Set<Listener>();

function cloneCatalog(): CatalogSnapshot {
  return {
    stores: structuredClone(STORES_SEED),
    products: structuredClone(PRODUCTS_SEED),
  };
}

/** Frozen snapshot for SSR / first client paint before hydration. */
const serverSnapshot: CatalogSnapshot = cloneCatalog();

let snapshot: CatalogSnapshot =
  typeof window === "undefined" ? serverSnapshot : cloneCatalog();

function notify() {
  for (const l of listeners) l();
}

function persist() {
  if (typeof window === "undefined") return;
  writeLocalStorage(STORAGE_KEY, snapshot);
}

function setSnapshot(next: CatalogSnapshot) {
  snapshot = next;
  notify();
  persist();
}

export function subscribeCatalog(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCatalogSnapshot(): CatalogSnapshot {
  return snapshot;
}

export function getCatalogServerSnapshot(): CatalogSnapshot {
  return serverSnapshot;
}

export function hydrateCatalogFromStorage() {
  if (typeof window === "undefined") return;
  const parsed = readLocalStorage<CatalogSnapshot | null>(STORAGE_KEY, null);
  if (
    parsed &&
    Array.isArray(parsed.stores) &&
    Array.isArray(parsed.products)
  ) {
    setSnapshot({
      stores: parsed.stores,
      products: parsed.products,
    });
  }
}

export function resetCatalogToSeed() {
  setSnapshot(cloneCatalog());
}

function ensureUniqueStoreSlug(base: string, excludeId?: string): string {
  let s = slugify(base) || "store";
  const taken = (x: string) =>
    snapshot.stores.some((st) => st.slug === x && st.id !== excludeId);
  if (!taken(s)) return s;
  let i = 2;
  while (taken(`${s}-${i}`)) i += 1;
  return `${s}-${i}`;
}

function ensureUniqueProductSlug(
  storeId: string,
  base: string,
  excludeProductId?: string
): string {
  let s = slugify(base) || "item";
  const taken = (x: string) =>
    snapshot.products.some(
      (p) => p.storeId === storeId && p.slug === x && p.id !== excludeProductId
    );
  if (!taken(s)) return s;
  let i = 2;
  while (taken(`${s}-${i}`)) i += 1;
  return `${s}-${i}`;
}

export type StoreUpsertPayload = Omit<Store, "id" | "slug"> & {
  slug?: string;
};

export function addStore(input: StoreUpsertPayload): Store {
  const slug = ensureUniqueStoreSlug(input.slug ?? input.name);
  const cats = [...new Set(input.categories.filter((c) => c !== "all"))] as CategoryId[];
  if (cats.length === 0) cats.push("snacks");

  const nextStore: Store = {
    ...input,
    id: shortId("s_"),
    slug,
    categories: cats,
    orders7d: input.orders7d ?? 0,
  };

  setSnapshot({
    stores: [...snapshot.stores, nextStore],
    products: [...snapshot.products],
  });
  return nextStore;
}

export function updateStore(storeId: string, input: Partial<StoreUpsertPayload>) {
  const idx = snapshot.stores.findIndex((s) => s.id === storeId);
  if (idx < 0) return;

  const prev = snapshot.stores[idx];
  let slug = prev.slug;
  if (typeof input.slug === "string" && input.slug.trim()) {
    slug = ensureUniqueStoreSlug(input.slug, storeId);
  } else if (typeof input.name === "string" && input.slug === "") {
    slug = ensureUniqueStoreSlug(input.name, storeId);
  }

  const merged: Store = {
    ...prev,
    ...input,
    slug,
    id: prev.id,
    categories:
      input.categories !== undefined
        ? (() => {
            const next = [
              ...new Set(input.categories.filter((c) => c !== "all")),
            ] as CategoryId[];
            return next.length ? next : prev.categories;
          })()
        : prev.categories,
  };

  const nextStores = [...snapshot.stores];
  nextStores[idx] = merged;

  let nextProducts = snapshot.products;
  if (slug !== prev.slug) {
    nextProducts = snapshot.products.map((p) =>
      p.storeId === storeId ? { ...p, storeSlug: slug } : p
    );
  }

  setSnapshot({
    stores: nextStores,
    products: nextProducts,
  });
}

export type MenuItemPayload = {
  name: string;
  description: string;
  price: number;
  category: Exclude<CategoryId, "all">;
  image: string;
  oldPrice?: number;
  isPopular?: boolean;
  isNew?: boolean;
  rating?: number;
  reviews?: number;
  slug?: string;
  options?: Product["options"];
};

export function addMenuItem(store: Store, input: MenuItemPayload): Product {
  const slug = ensureUniqueProductSlug(
    store.id,
    input.slug ?? input.name
  );
  const product: Product = {
    id: shortId("p_"),
    storeId: store.id,
    storeSlug: store.slug,
    slug,
    name: input.name.trim(),
    description: input.description.trim(),
    price: Math.round(input.price),
    image: input.image.trim(),
    category: input.category,
    oldPrice:
      typeof input.oldPrice === "number" && input.oldPrice > 0
        ? Math.round(input.oldPrice)
        : undefined,
    isPopular: input.isPopular,
    isNew: input.isNew,
    rating: input.rating,
    reviews: input.reviews,
    options: input.options,
  };

  setSnapshot({
    stores: [...snapshot.stores],
    products: [...snapshot.products, product],
  });
  return product;
}

export function updateMenuItem(
  productId: string,
  input: Partial<MenuItemPayload>
): Product | undefined {
  const idx = snapshot.products.findIndex((p) => p.id === productId);
  if (idx < 0) return undefined;

  const prev = snapshot.products[idx];
  const store = snapshot.stores.find((s) => s.id === prev.storeId);
  if (!store) return undefined;

  let slug = prev.slug;
  if (typeof input.slug === "string" && input.slug.trim()) {
    slug = ensureUniqueProductSlug(store.id, input.slug, productId);
  } else if (typeof input.name === "string" && input.slug === "") {
    slug = ensureUniqueProductSlug(store.id, input.name, productId);
  }

  const next: Product = {
    ...prev,
    ...input,
    slug,
    name: input.name !== undefined ? input.name.trim() : prev.name,
    description:
      input.description !== undefined
        ? input.description.trim()
        : prev.description,
    price:
      input.price !== undefined ? Math.round(input.price) : prev.price,
    image: input.image !== undefined ? input.image.trim() : prev.image,
    category: input.category ?? prev.category,
    oldPrice:
      input.oldPrice !== undefined
        ? input.oldPrice > 0
          ? Math.round(input.oldPrice)
          : undefined
        : prev.oldPrice,
    isPopular: input.isPopular ?? prev.isPopular,
    isNew: input.isNew ?? prev.isNew,
    rating: input.rating ?? prev.rating,
    reviews: input.reviews ?? prev.reviews,
    options: input.options ?? prev.options,
  };

  const nextProducts = [...snapshot.products];
  nextProducts[idx] = next;
  setSnapshot({
    stores: [...snapshot.stores],
    products: nextProducts,
  });
  return next;
}

export function removeMenuItem(productId: string) {
  setSnapshot({
    stores: [...snapshot.stores],
    products: snapshot.products.filter((p) => p.id !== productId),
  });
}
