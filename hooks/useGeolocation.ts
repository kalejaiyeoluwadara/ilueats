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

  const request = useCallback((opts?: { fresh?: boolean }) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus("locating");

    const onSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords;
      setReading({
        lat: latitude,
        lng: longitude,
        accuracy,
        quality: classify(accuracy),
        at: Date.now(),
      });
      setStatus("success");
    };

    // High accuracy asks for GPS over coarse wifi/cell; the timeout keeps a
    // hung sensor from blocking. A first fix may reuse a recent (≤30s) reading,
    // but an explicit "re-fetch" (fresh) forces the device to read again —
    // otherwise the cached position comes back unchanged and looks frozen.
    const positionOpts: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: opts?.fresh ? 0 : 30000,
    };

    // POSITION_UNAVAILABLE is frequently transient — desktop CoreLocation
    // (kCLErrorLocationUnknown) and cold GPS often fail once then succeed on a
    // second try. Retry it a single time before surfacing an error; a fresh
    // request forbids any cache, so let the retry accept a very recent fix.
    const attempt = (retriesLeft: number, options: PositionOptions) => {
      navigator.geolocation.getCurrentPosition(onSuccess, (err) => {
        if (err.code === err.POSITION_UNAVAILABLE && retriesLeft > 0) {
          setTimeout(
            () => attempt(retriesLeft - 1, { ...options, maximumAge: 30000 }),
            600
          );
          return;
        }
        setStatus(
          err.code === err.PERMISSION_DENIED
            ? "denied"
            : err.code === err.TIMEOUT
              ? "timeout"
              : "unavailable"
        );
      }, options);
    };

    attempt(1, positionOpts);
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setReading(null);
  }, []);

  return { status, reading, request, reset };
}
