export type CategoryId =
  | "all"
  | "pizza"
  | "cakes"
  | "burgers"
  | "local"
  | "snacks"
  | "drinks"
  | "shawarma"
  | "smoothies";

export interface Category {
  id: CategoryId;
  name: string;
  emoji: string;
}

export interface Store {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  cover: string;
  categories: CategoryId[];
  rating: number;
  reviews: number;
  deliveryTimeMins: [number, number];
  deliveryFee: number;
  minOrder: number;
  isOpen: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  location: string;
  tags?: string[];
  /** Client-persisted admin metric (catalog demo); optional on seed stores. */
  orders7d?: number;
}

export interface Product {
  id: string;
  storeId: string;
  storeSlug: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: CategoryId;
  isPopular?: boolean;
  isNew?: boolean;
  rating?: number;
  reviews?: number;
  options?: ProductOptionGroup[];
}

export interface ProductOptionGroup {
  id: string;
  name: string;
  required?: boolean;
  multi?: boolean;
  choices: ProductOptionChoice[];
}

export interface ProductOptionChoice {
  id: string;
  name: string;
  priceDelta?: number;
}

export interface CartItem {
  id: string; // unique per cart line (productId + options hash)
  productId: string;
  storeId: string;
  storeSlug: string;
  storeName: string;
  name: string;
  image: string;
  price: number; // unit price including options
  quantity: number;
  notes?: string;
  selectedOptions?: { groupId: string; choiceId: string; name: string }[];
}

export interface AdSlide {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image: string;
  badge?: string;
}

export type ToastVariant = "success" | "error" | "info" | "cart";

export interface ToastMessage {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
}

/** Built-in roles for client-side demo auth (localStorage). */
export type UserRole = "customer" | "admin" | "rider";

/** Client-only session user (no password); persisted accounts live in localStorage. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  /** Present for all accounts after migration; defaults to customer when missing in storage. */
  role: UserRole;
}

/** Rider-visible order lines (picked up bag) — qty + mods to avoid wrong handoff. */
export interface RiderOrderLineItem {
  name: string;
  qty: number;
  modifiers?: string[];
}

/** Rider console job (client-persisted demo state). */
export type RiderJobStatus = "pickup" | "en_route" | "done";

export interface RiderJob {
  id: string;
  store: string;
  customer: string;
  address: string;
  payout: number;
  status: RiderJobStatus;
  /** Local Nigerian-style number for tel: links */
  phone: string;
  /** What the customer ordered — always confirm at pickup vs label. */
  lineItems: RiderOrderLineItem[];
}

/** Incoming offer shown on the Today screen. */
export interface RiderOffer {
  id: string;
  store: string;
  customer: string;
  drop: string;
  pay: number;
  etaMin: number;
  phone: string;
  lineItems: RiderOrderLineItem[];
}

/** Saved delivery address in browser storage. */
export interface SavedAddress {
  id: string;
  label: string;
  addressLine: string;
  phone?: string;
  isDefault: boolean;
}
