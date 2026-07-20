import { apiFetch } from "./client";

/** One autocomplete suggestion, mirroring the backend's trimmed shape. */
export interface PlaceSuggestion {
  placeId: string;
  /** Bold line, e.g. "Babcock University". */
  primary: string;
  /** Muted line, e.g. "Ilishan-Remo, Ogun State, Nigeria". */
  secondary: string;
  full: string;
}

/** A resolved place with coordinates, returned when the user picks a suggestion. */
export interface PlaceDetails {
  placeId: string;
  address: string;
  name: string;
  lat: number;
  lng: number;
}

/** Reverse-geocoded address, plus whether the spot is inside the delivery area. */
export interface ReverseGeocodeResult extends PlaceDetails {
  inServiceArea: boolean;
}

/**
 * Address autocomplete. `sessionToken` must stay stable across a single search
 * and be passed on to `fetchPlaceDetails` so Google bills the pair as one
 * session (see useAddressSearch). `signal` lets a newer keystroke drop a stale
 * in-flight response.
 */
export function fetchAddressSuggestions(
  q: string,
  sessionToken: string,
  signal?: AbortSignal
): Promise<PlaceSuggestion[]> {
  return apiFetch<PlaceSuggestion[]>("/geocoding/autocomplete", {
    query: { q, sessionToken },
    signal,
  });
}

/** Resolve a chosen suggestion to a formatted address + coordinates. */
export function fetchPlaceDetails(
  placeId: string,
  sessionToken: string,
  signal?: AbortSignal
): Promise<PlaceDetails> {
  return apiFetch<PlaceDetails>(
    `/geocoding/places/${encodeURIComponent(placeId)}`,
    { query: { sessionToken }, signal }
  );
}

/** Turn the device's GPS coordinates into an address (for "use my location"). */
export function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<ReverseGeocodeResult> {
  return apiFetch<ReverseGeocodeResult>("/geocoding/reverse", {
    query: { lat, lng },
    signal,
  });
}
