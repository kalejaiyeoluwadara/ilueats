import { adSlides } from "@/data/mockData";
import { readLocalStorage, shortId, writeLocalStorage } from "@/lib/utils";
import type { AdSlide } from "@/types";

const STORAGE_KEY = "ilueats:banners:v1";

type Listener = () => void;
const listeners = new Set<Listener>();

function cloneSeed(): AdSlide[] {
  return structuredClone(adSlides);
}

const serverSlides: AdSlide[] = cloneSeed();

let slides: AdSlide[] =
  typeof window === "undefined" ? serverSlides : cloneSeed();

function notify() {
  for (const l of listeners) l();
}

function persist() {
  if (typeof window === "undefined") return;
  writeLocalStorage(STORAGE_KEY, slides);
}

function setSlides(next: AdSlide[]) {
  slides = next;
  notify();
  persist();
}

export function subscribeBanners(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getBannersSnapshot(): AdSlide[] {
  return slides;
}

/** Frozen seed for SSR / first paint (before client hydration). */
export function getBannersServerSnapshot(): AdSlide[] {
  return serverSlides;
}

export function hydrateBannersFromStorage() {
  if (typeof window === "undefined") return;
  const parsed = readLocalStorage<AdSlide[] | null>(STORAGE_KEY, null);
  if (
    parsed &&
    Array.isArray(parsed) &&
    parsed.every(
      (s) =>
        s &&
        typeof s.id === "string" &&
        typeof s.title === "string" &&
        typeof s.subtitle === "string" &&
        typeof s.cta === "string" &&
        typeof s.href === "string" &&
        typeof s.image === "string"
    )
  ) {
    slides = parsed;
    notify();
  }
}

export function resetBannersToSeed() {
  setSlides(cloneSeed());
}

export type BannerUpsertPayload = Omit<AdSlide, "id"> & { id?: string };

export function addBanner(input: BannerUpsertPayload): AdSlide {
  const row: AdSlide = {
    id: input.id?.trim() || shortId("ad_"),
    title: input.title.trim(),
    subtitle: input.subtitle.trim(),
    cta: input.cta.trim(),
    href: input.href.trim() || "/",
    image: input.image.trim(),
    badge: input.badge?.trim() || undefined,
  };
  setSlides([...slides, row]);
  return row;
}

export function updateBanner(
  id: string,
  input: Partial<BannerUpsertPayload>
): AdSlide | undefined {
  const idx = slides.findIndex((s) => s.id === id);
  if (idx < 0) return undefined;
  const prev = slides[idx];
  const merged: AdSlide = {
    ...prev,
    ...input,
    id: prev.id,
    title: input.title !== undefined ? input.title.trim() : prev.title,
    subtitle:
      input.subtitle !== undefined ? input.subtitle.trim() : prev.subtitle,
    cta: input.cta !== undefined ? input.cta.trim() : prev.cta,
    href: input.href !== undefined ? (input.href.trim() || "/") : prev.href,
    image: input.image !== undefined ? input.image.trim() : prev.image,
    badge:
      input.badge !== undefined
        ? input.badge.trim() || undefined
        : prev.badge,
  };
  const next = [...slides];
  next[idx] = merged;
  setSlides(next);
  return merged;
}

export function removeBanner(id: string) {
  setSlides(slides.filter((s) => s.id !== id));
}

export function reorderBanner(from: number, to: number) {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= slides.length ||
    to >= slides.length
  ) {
    return;
  }
  const next = [...slides];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  setSlides(next);
}
