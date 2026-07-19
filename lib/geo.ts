/**
 * Client-side geo helpers — a small mirror of the backend's haversine so the
 * app can rank landmarks by proximity and reason about GPS accuracy without a
 * network round-trip or a mapping SDK. The backend stays the source of truth
 * for the price; this only decides ordering and messaging in the UI.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance in km between two lat/lng points. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.asin(Math.sqrt(s));
}

/** GeoJSON point ([lng, lat]) → {lat, lng}, or null when absent/malformed. */
export function pointToLatLng(
  geo: { coordinates: number[] } | null | undefined
): LatLng | null {
  const c = geo?.coordinates;
  if (!c || c.length !== 2) return null;
  return { lng: c[0], lat: c[1] };
}

/** A human "how close" string: metres under 1km, otherwise one-decimal km. */
export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

export interface Ranked<T> {
  item: T;
  /** Straight-line km from the reference point, or null if the item has no geo. */
  distanceKm: number | null;
}

/**
 * Sorts items nearest-first relative to `from`. Items that carry no coordinates
 * keep a null distance and sink below every located one, so the picker never
 * loses a landmark just because an admin hasn't geocoded it yet.
 */
export function rankByDistance<T extends { geo: { coordinates: number[] } | null }>(
  items: T[],
  from: LatLng
): Ranked<T>[] {
  return items
    .map((item) => {
      const p = pointToLatLng(item.geo);
      return { item, distanceKm: p ? haversineKm(from, p) : null };
    })
    .sort((a, b) => {
      if (a.distanceKm === null) return b.distanceKm === null ? 0 : 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
}
