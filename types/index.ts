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

/** Client-only session user (no password); persisted accounts live in localStorage. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
}
