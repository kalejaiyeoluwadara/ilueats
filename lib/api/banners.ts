import { apiFetch } from "./client";
import type { AdSlide } from "@/types";

/** BannersController serves GET /banners without a guard. */
export async function fetchBanners(
  opts: { revalidate?: number } = {}
): Promise<AdSlide[]> {
  const { items } = await apiFetch<{ items: AdSlide[] }>("/banners", {
    auth: false,
    ...opts,
  });
  return items;
}

export type BannerUpsertPayload = {
  title: string;
  subtitle?: string;
  cta?: string;
  href?: string;
  badge?: string;
  /** Direct image URL — ignored when `file` is also supplied. */
  image?: string;
};

function toFormData(payload: BannerUpsertPayload, file: File): FormData {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "image") return;
    if (value !== undefined) form.append(key, String(value));
  });
  form.append("image", file);
  return form;
}

export async function createBanner(
  payload: BannerUpsertPayload,
  file?: File | null
): Promise<AdSlide> {
  if (file) {
    return apiFetch<AdSlide>("/banners", {
      method: "POST",
      body: toFormData(payload, file),
    });
  }
  return apiFetch<AdSlide>("/banners", { method: "POST", body: payload });
}

export async function updateBanner(
  id: string,
  payload: Partial<BannerUpsertPayload>,
  file?: File | null
): Promise<AdSlide> {
  if (file) {
    return apiFetch<AdSlide>(`/banners/${id}`, {
      method: "PATCH",
      body: toFormData(payload as BannerUpsertPayload, file),
    });
  }
  return apiFetch<AdSlide>(`/banners/${id}`, { method: "PATCH", body: payload });
}

export async function deleteBanner(id: string): Promise<void> {
  await apiFetch<void>(`/banners/${id}`, { method: "DELETE" });
}

export async function reorderBanners(orderedIds: string[]): Promise<AdSlide[]> {
  const { items } = await apiFetch<{ items: AdSlide[] }>("/banners/reorder", {
    method: "POST",
    body: { orderedIds },
  });
  return items;
}
