import { apiFetch } from "./client";
import type { AdSlide, Product, Store } from "@/types";

/** Everything the home page renders, in one response. Mirrors the backend
 * `GET /home` aggregate so the page makes a single round-trip instead of
 * hitting /stores, /products/featured and /banners separately. */
export type HomepageData = {
  stores: Store[];
  featured: Product[];
  banners: AdSlide[];
};

/** HomeController serves GET /home without a guard. */
export async function fetchHomepage(
  opts: { revalidate?: number } = {}
): Promise<HomepageData> {
  return apiFetch<HomepageData>("/home", { auth: false, ...opts });
}
