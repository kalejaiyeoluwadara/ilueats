"use client";

import { useCallback, useState } from "react";

export type GeoStatus =
  | "idle"
  | "locating"
  | "success"
  | "denied"
  | "unavailable"
  | "timeout";

/**
 * How much to trust a fix. `accuracy` from the Geolocation API is the 95%
 * confidence radius in metres — the single most useful signal for our problem,
 * because most devices here report a position but a wide, honest radius. We
 * grade it rather than trust it blindly.
 */
export type GeoQuality = "precise" | "approx" | "poor";

export interface GeoReading {
  lat: number;
  lng: number;
  /** Confidence radius in metres (smaller is better). */
  accuracy: number;
  quality: GeoQuality;
  at: number;
}

/**
 * Accuracy (metres) at/under which we trust the pin enough to price a door
 * order by exact distance. Rougher than this and we keep the coordinate only as
 * a hint for the rider and steer the customer to a curated landmark instead —
 * that is how we avoid "shown ₦300, the pin says 2km, charged ₦850".
 */
export const PRICING_ACCURACY_M = 200;

function classify(accuracy: number): GeoQuality {
  if (accuracy <= 75) return "precise";
  if (accuracy <= PRICING_ACCURACY_M) return "approx";
  return "poor";
}

export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [reading, setReading] = useState<GeoReading | null>(null);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setReading({
          lat: latitude,
          lng: longitude,
          accuracy,
          quality: classify(accuracy),
          at: Date.now(),
        });
        setStatus("success");
      },
      (err) => {
        setStatus(
          err.code === err.PERMISSION_DENIED
            ? "denied"
            : err.code === err.TIMEOUT
              ? "timeout"
              : "unavailable"
        );
      },
      // High accuracy asks for GPS over coarse wifi/cell; a fresh-ish fix is
      // fine at checkout, and the timeout keeps a hung sensor from blocking.
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setReading(null);
  }, []);

  return { status, reading, request, reset };
}
