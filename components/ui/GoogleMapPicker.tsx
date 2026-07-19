"use client";

import { useEffect, useRef } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";

export interface LatLng {
  lat: number;
  lng: number;
}

/** Ilisan-Remo (Babcock area) — the map's home when we have no pin yet. */
export const ILISAN_CENTER: LatLng = { lat: 6.8944, lng: 3.7186 };

// Browser key for the Maps JavaScript API — exposed by design, so restrict it
// to your domains (HTTP referrers) in Google Cloud. Separate from the
// server-side Places key. A Map ID unlocks vector maps + Advanced Markers;
// "DEMO_MAP_ID" works for local dev, swap for a real one in production.
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID";

export interface GoogleMapPickerProps {
  value: LatLng | null;
  onChange: (p: LatLng) => void;
  /** Where to (re)center — a new pin from search pans the map here. */
  center?: LatLng | null;
}

/**
 * Pans the map to `target` when it changes from the OUTSIDE (e.g. the customer
 * picks a different address in search), but skips the pan that a local drag/tap
 * would otherwise trigger — otherwise every nudge would recenter and fight the
 * user. `skipRef` is raised by our own handlers right before they emit.
 */
function CenterUpdater({
  target,
  skipRef,
}: {
  target: LatLng;
  skipRef: React.MutableRefObject<boolean>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }
    map.panTo(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, target.lat, target.lng]);
  return null;
}

/** A "recenter to the pin" control overlaid on the map. */
function RecenterButton({ to }: { to: LatLng }) {
  const map = useMap();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        map?.panTo(to);
        map?.setZoom(17);
      }}
      className="absolute bottom-2.5 right-2.5 z-[1] flex items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-[11px] font-bold text-[var(--color-ink)] shadow-md ring-1 ring-black/10"
    >
      <svg
        viewBox="0 0 24 24"
        width="13"
        height="13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
      Recenter
    </button>
  );
}

export default function GoogleMapPicker({
  value,
  onChange,
  center,
}: GoogleMapPickerProps) {
  const markerPos = value ?? center ?? ILISAN_CENTER;
  // Raised by our own drag/click handlers so CenterUpdater ignores the
  // resulting position change (we don't want to recenter on a manual nudge).
  const skipRecenter = useRef(false);

  const emit = (p: LatLng) => {
    skipRecenter.current = true;
    onChange(p);
  };

  if (!API_KEY) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--color-bg)] px-4 text-center">
        <span className="text-[12px] font-medium text-[var(--color-ink-soft)]">
          Map needs NEXT_PUBLIC_GOOGLE_MAPS_API_KEY — your address is still saved.
        </span>
      </div>
    );
  }

  const onMapClick = (e: MapMouseEvent) => {
    const ll = e.detail.latLng;
    if (ll) emit({ lat: ll.lat, lng: ll.lng });
  };

  const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    const ll = e.latLng;
    if (ll) emit({ lat: ll.lat(), lng: ll.lng() });
  };

  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        defaultCenter={markerPos}
        defaultZoom={16}
        mapId={MAP_ID}
        gestureHandling="greedy"
        disableDefaultUI
        clickableIcons={false}
        scrollwheel={false}
        onClick={onMapClick}
        style={{ width: "100%", height: "100%" }}
      >
        <AdvancedMarker
          position={markerPos}
          draggable
          onDragEnd={onMarkerDragEnd}
        >
          <Pin background="#E8541A" borderColor="#ffffff" glyphColor="#ffffff" />
        </AdvancedMarker>
        <CenterUpdater target={markerPos} skipRef={skipRecenter} />
        <RecenterButton to={markerPos} />
      </Map>
    </APIProvider>
  );
}
