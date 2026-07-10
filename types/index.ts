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
  /** @deprecated Legacy seeded metric — admin now reads real stats from /admin/stores/stats. */
  orders7d?: number;
  /** Hidden house store that owns independent items (excluded from public listings). */
  isPlatform?: boolean;
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

/**
 * Option group on a product. Two Nigerian ordering shapes are supported:
 * - "Pick one" (shawarma size, spice level): single-select, `required`.
 * - "Compose a plate" (rice + proteins + sides): `multi` with `allowQuantity`
 *   so a customer can take 2× beef, add beans and plantain on top, etc.
 */
export interface ProductOptionGroup {
  id: string;
  name: string;
  /** Shorthand for min = 1. */
  required?: boolean;
  /** Allow several distinct choices (checkbox group). */
  multi?: boolean;
  /** Minimum selections across the group (overrides `required` when set). */
  min?: number;
  /** Maximum distinct choices selectable (multi groups). */
  max?: number;
  /** Choices can repeat with a stepper, e.g. "2× Peppered Beef" (multi only). */
  allowQuantity?: boolean;
  /** Helper copy under the group title, e.g. "Comes with stew — pick your protein". */
  hint?: string;
  choices: ProductOptionChoice[];
}

export interface ProductOptionChoice {
  id: string;
  name: string;
  priceDelta?: number;
}

/** One chosen option on a cart line. qty > 1 only for allowQuantity groups. */
export interface CartSelectedOption {
  groupId: string;
  choiceId: string;
  name: string;
  /** Defaults to 1 for lines saved before quantity support. */
  qty?: number;
  groupName?: string;
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
  selectedOptions?: CartSelectedOption[];
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

/* -------------------------------------------------------------------------- */
/* Orders — single canonical shape shared by customer, admin, and rider.      */
/* -------------------------------------------------------------------------- */

export type OrderStatus = "new" | "preparing" | "assigned" | "out" | "delivered";

/**
 * A settled order line. `modifiers` are display-ready strings that already
 * carry option quantity and price, e.g. "2× Peppered Beef (+₦1,400)".
 */
export interface OrderLineItem {
  name: string;
  qty: number;
  /** Per-unit price including all selected options. */
  unitPrice: number;
  modifiers?: string[];
  /** Free-text item note from the customer, e.g. "no onions". */
  notes?: string;
}

export type OrderDeliveryMode = "door" | "landmark";

export interface Order {
  id: string;
  /** ISO timestamp; UIs render a relative "x min ago". */
  placedAt: string;
  customer: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryMode?: OrderDeliveryMode;
  /** Notes for the rider (gate code, apartment, etc.). */
  deliveryNote?: string;
  storeId?: string;
  store: string;
  storeAddress: string;
  paymentLabel: string;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  status: OrderStatus;
  lineItems: OrderLineItem[];
  /** seed = demo board row; app = placed via checkout in this browser. */
  source?: "seed" | "app";
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
