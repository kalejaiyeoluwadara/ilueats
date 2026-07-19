import { HomeView } from "@/components/home/HomeView";
import { fetchHomepage } from "@/lib/api/home";

/** Public catalog reads are identical for every visitor, so they cache well. */
const HOME_REVALIDATE_SECONDS = 60;

/**
 * Server component so the whole home page (stores, featured dishes, banners)
 * ships inside the first HTML response from a single `/home` request. A failure
 * here is not fatal: HomeView falls back to fetching on mount behind its
 * skeleton.
 */
export default async function HomePage() {
  const initial = await fetchHomepage({
    revalidate: HOME_REVALIDATE_SECONDS,
  }).catch(() => undefined);

  return <HomeView initial={initial} />;
}
