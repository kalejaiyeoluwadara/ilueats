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

/** Public — active delivery landmarks for the checkout picker. */
export async function fetchLandmarks(): Promise<Landmark[]> {
  const res = await apiFetch<{ items: Landmark[] }>("/landmarks", {
    auth: false,
  });
  return res.items;
}
