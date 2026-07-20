"use client";

import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
} from "@vis.gl/react-google-maps";
import { MapPinIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import type { Store } from "@/types";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID";

/**
 * Read-only Google map showing where a store sits, with a one-tap "Open in
 * Maps" for turn-by-turn directions. Rendered only when the store has a pinned
 * point (`store.geo`); the store page omits it otherwise so we never show an
 * empty or misleading map.
 */
export function StoreLocationMap({ store }: { store: Store }) {
  if (!store.geo) return null;
  // GeoJSON stores [lng, lat].
  const [lng, lat] = store.geo.coordinates;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <section className="px-4 pt-6">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="font-display text-[15px] font-extrabold tracking-tight text-[var(--color-ink)]">
          Where to find {store.name}
        </h2>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[var(--color-primary)] transition-opacity hover:opacity-80"
        >
          Directions
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="overflow-hidden rounded-2xl ring-1 ring-black/[0.04] shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
        <div className="relative h-52 w-full bg-[var(--color-bg)]">
          {API_KEY ? (
            <APIProvider apiKey={API_KEY}>
              <Map
                defaultCenter={{ lat, lng }}
                defaultZoom={16}
                mapId={MAP_ID}
                gestureHandling="cooperative"
                disableDefaultUI
                clickableIcons={false}
                style={{ width: "100%", height: "100%" }}
              >
                <AdvancedMarker position={{ lat, lng }}>
                  <Pin
                    background="#E8541A"
                    borderColor="#ffffff"
                    glyphColor="#ffffff"
                  />
                </AdvancedMarker>
              </Map>
            </APIProvider>
          ) : (
            <div className="flex h-full w-full items-center justify-center px-4 text-center">
              <span className="text-[12px] font-medium text-[var(--color-ink-soft)]">
                Map unavailable — tap “Directions” to open in Google Maps.
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-white px-3.5 py-2.5 text-[12.5px] text-[var(--color-ink-muted)]">
          <MapPinIcon className="h-4 w-4 shrink-0 text-[var(--color-ink-soft)]" />
          <span className="truncate">{store.location}</span>
        </div>
      </div>
    </section>
  );
}
