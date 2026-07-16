import { apiFetch } from "./client";

export interface Landmark {
  id: string;
  slug: string;
  name: string;
  area: string;
  description: string;
  geo: { type: "Point"; coordinates: number[] } | null;
  isActive: boolean;
}

/**
 * Seconds the GET /landmarks response is cached at the Next.js fetch layer.
 * Landmarks change rarely — bump or set to 0 to disable caching.
 */
export const LANDMARKS_TTL = 300; // 5 minutes

/** Public — active delivery landmarks for the checkout picker. */
export async function fetchLandmarks(): Promise<Landmark[]> {
  const res = await apiFetch<{ items: Landmark[] }>("/landmarks", {
    auth: false,
    revalidate: LANDMARKS_TTL,
  });
  return res.items;
}
