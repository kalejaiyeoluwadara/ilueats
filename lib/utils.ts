import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number): string {
  return NGN.format(value).replace("NGN", "₦").replace(/\s/g, "");
}

export function formatDeliveryTime(range: [number, number]): string {
  if (range[0] === range[1]) return `${range[0]} mins`;
  return `${range[0]}–${range[1]} mins`;
}

export function pluralize(n: number, single: string, plural?: string) {
  return n === 1 ? single : plural ?? `${single}s`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/** Stable id generator for cart line items based on product + selected options */
export function makeCartLineId(
  productId: string,
  options?: { groupId: string; choiceId: string; qty?: number }[]
) {
  if (!options || options.length === 0) return productId;
  const sig = [...options]
    .sort(
      (a, b) =>
        a.groupId.localeCompare(b.groupId) ||
        a.choiceId.localeCompare(b.choiceId)
    )
    .map((o) => `${o.groupId}:${o.choiceId}x${o.qty ?? 1}`)
    .join("|");
  return `${productId}::${sig}`;
}

/** "Peppered Beef" / "2× Peppered Beef" — customer-facing option label. */
export function formatCartOption(o: { name: string; qty?: number }): string {
  const qty = o.qty ?? 1;
  return qty > 1 ? `${qty}× ${o.name}` : o.name;
}

/**
 * Option label with its price, e.g. "2× Peppered Beef (+₦1,400)".
 * This is what lands in order modifiers so admin & rider see full detail.
 */
export function formatCartOptionWithPrice(o: {
  name: string;
  qty?: number;
  priceDelta?: number;
}): string {
  const label = formatCartOption(o);
  const qty = o.qty ?? 1;
  const delta = (o.priceDelta ?? 0) * qty;
  if (delta === 0) return label;
  const sign = delta > 0 ? "+" : "−";
  return `${label} (${sign}${formatPrice(Math.abs(delta))})`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/** Read JSON from localStorage safely (SSR-safe) */
export function readLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeLocalStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / privacy errors */
  }
}

/** Random short id (sufficient for client-only ids like toasts/orders) */
export function shortId(prefix = "") {
  const r = Math.random().toString(36).slice(2, 8);
  const t = Date.now().toString(36).slice(-4);
  return `${prefix}${r}${t}`;
}

/** Nigerian-style mobile → tel: href (demo). */
export function phoneToTelHref(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("234")) return `tel:+${d}`;
  if (d.startsWith("0") && d.length >= 10) return `tel:+234${d.slice(1)}`;
  return `tel:${phone}`;
}
