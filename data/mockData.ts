import type { AdSlide, Category, Product, Store } from "@/types";
import { PRODUCTS_SEED, STORES_SEED } from "@/data/mockCatalog.seed";

/* -------------------------------------------------------------------------- */
/* Categories                                                                 */
/* -------------------------------------------------------------------------- */

export const categories: Category[] = [
  { id: "all", name: "All", emoji: "🍽️" },
  { id: "local", name: "Local", emoji: "" },
  { id: "pizza", name: "Pizza", emoji: "" },
  { id: "burgers", name: "Burgers", emoji: "" },
  { id: "shawarma", name: "Shawarma", emoji: "" },
  { id: "cakes", name: "Cakes", emoji: "" },
  { id: "snacks", name: "Snacks", emoji: "" },
  { id: "smoothies", name: "Smoothies", emoji: "" },
  { id: "drinks", name: "Drinks", emoji: "" },
];

/** @deprecated Prefer `useCatalog().stores` for live persisted catalog. */
export const stores = STORES_SEED;
/** @deprecated Prefer `useCatalog().products`. */
export const products = PRODUCTS_SEED;

/* -------------------------------------------------------------------------- */
/* Ad Slides                                                                  */
/* -------------------------------------------------------------------------- */

export const adSlides: AdSlide[] = [
  {
    id: "ad_first_order",
    title: "₦1,000 off your first order",
    subtitle: "Use code WELCOME at checkout — fresh from your ìlú.",
    cta: "Order now",
    href: "/mama-tope",
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1600&q=80",
    badge: "New users",
  },
  {
    id: "ad_pizza_friday",
    title: "Pizza Friday — buy one get one 50% off",
    subtitle: "Wood-fired hot at Babrite, today only.",
    cta: "Grab a slice",
    href: "/babrite",
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=80",
    badge: "Today only",
  },
  {
    id: "ad_cake_orders",
    title: "Custom cakes for your big moments",
    subtitle: "Order 24 hours ahead at Sweet Layers.",
    cta: "Browse cakes",
    href: "/sweet-layers",
    image:
      "https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&w=1600&q=80",
    badge: "Featured",
  },
];

/* -------------------------------------------------------------------------- */
/* Meet-at landmarks (demo — Ilisan-Remo area)                                */
/* -------------------------------------------------------------------------- */

export type PickupLandmark = {
  id: string;
  label: string;
  detail: string;
};

export const pickupLandmarks: PickupLandmark[] = [
  {
    id: "lm_babcock_main",
    label: "Babcock University main gate",
    detail: "Main entrance roundabout — meet by the security booth.",
  },
  {
    id: "lm_ilisan_park",
    label: "Ilisan motor park",
    detail: "Central park area — look for the canopy rows.",
  },
  {
    id: "lm_oou_junction",
    label: "OOU mini campus junction",
    detail: "T-junction by the campus wall — opposite the kiosks.",
  },
  {
    id: "lm_ajadeh",
    label: "Ajadeh market square",
    detail: "Open square side — near the fruit sellers.",
  },
  {
    id: "lm_pharmacy_roundabout",
    label: "Tera Pharmacy roundabout",
    detail: "Small roundabout — meet on the pharmacy side.",
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

import { getCatalogSnapshot } from "@/lib/catalogStore";

export function getStoreBySlug(slug: string): Store | undefined {
  return getCatalogSnapshot().stores.find((s) => s.slug === slug);
}

export function getProductsByStore(storeId: string): Product[] {
  return getCatalogSnapshot().products.filter((p) => p.storeId === storeId);
}

export function getProductBySlug(
  storeSlug: string,
  productSlug: string
): Product | undefined {
  return getCatalogSnapshot().products.find(
    (p) => p.storeSlug === storeSlug && p.slug === productSlug
  );
}

export function getProductById(productId: string): Product | undefined {
  return getCatalogSnapshot().products.find((p) => p.id === productId);
}

export function getStoresByCategory(category: string): Store[] {
  const { stores } = getCatalogSnapshot();
  if (category === "all") return stores;
  return stores.filter((s) =>
    s.categories.includes(category as Store["categories"][number])
  );
}

export function getFeaturedProducts(): Product[] {
  return getCatalogSnapshot()
    .products.filter((p) => p.isPopular)
    .slice(0, 8);
}

export function getNewProducts(): Product[] {
  return getCatalogSnapshot().products.filter((p) => p.isNew);
}
