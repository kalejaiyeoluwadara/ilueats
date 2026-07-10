import { HomeView } from "@/components/home/HomeView";
import { fetchFeaturedProducts } from "@/lib/api/catalog";

/** Public catalog reads are identical for every visitor, so they cache well. */
const FEATURED_REVALIDATE_SECONDS = 60;

/**
 * Server component so the dishes and store cards ship inside the first HTML
 * response. Stores and banners are seeded higher up, in the root layout.
 */
export default async function HomePage() {
  const featured = await fetchFeaturedProducts({
    revalidate: FEATURED_REVALIDATE_SECONDS,
  }).catch(() => undefined);

  return <HomeView initialFeatured={featured} />;
}
