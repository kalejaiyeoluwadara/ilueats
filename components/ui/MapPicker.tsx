"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { ILISAN_CENTER, type LatLng, type GoogleMapPickerProps } from "./GoogleMapPicker";

/**
 * The Google Maps JS SDK touches `window` on import, so the map is loaded
 * client-only. This wrapper is the SSR-safe entry point everyone imports; it
 * renders a sized, rounded frame with a skeleton until the chunk arrives.
 */
const GoogleMapPicker = dynamic(() => import("./GoogleMapPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[var(--color-bg)]">
      <span className="text-[12px] font-medium text-[var(--color-ink-soft)]">
        Loading map…
      </span>
    </div>
  ),
});

export type { LatLng };

/** Ilisan-Remo — the fallback pin location when there's no pin to seed from. */
export const DEFAULT_MAP_CENTER: LatLng = ILISAN_CENTER;

export function MapPicker({
  className,
  heightClass = "h-48",
  ...props
}: GoogleMapPickerProps & { className?: string; heightClass?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl ring-1 ring-[var(--color-line)]",
        heightClass,
        className
      )}
    >
      <GoogleMapPicker {...props} />
      <p className="pointer-events-none absolute left-2.5 top-2.5 z-[1] rounded-full bg-white/85 px-2 py-1 text-[10.5px] font-semibold text-[var(--color-ink-muted)] backdrop-blur">
        Drag the pin or tap to adjust
      </p>
    </div>
  );
}
