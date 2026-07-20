"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import {
  ArrowsPointingOutIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
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

/** The hint + expand affordance overlaid on the small (inline) map. */
function MapChrome({ onExpand }: { onExpand: () => void }) {
  return (
    <>
      <p className="pointer-events-none absolute left-2.5 top-2.5 z-[1] rounded-full bg-white/85 px-2 py-1 text-[10.5px] font-semibold text-[var(--color-ink-muted)] backdrop-blur">
        Drag the pin or tap to adjust
      </p>
      <button
        type="button"
        onClick={onExpand}
        aria-label="Expand map"
        className="absolute right-2.5 top-2.5 z-[2] flex items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-[11px] font-bold text-[var(--color-ink)] shadow-md ring-1 ring-black/10 active:scale-95"
      >
        <ArrowsPointingOutIcon className="h-3.5 w-3.5" />
        Expand
      </button>
    </>
  );
}

export function MapPicker({
  className,
  heightClass = "h-48",
  ...props
}: GoogleMapPickerProps & { className?: string; heightClass?: string }) {
  const [expanded, setExpanded] = useState(false);

  // Lock body scroll and wire Escape-to-close while the fullscreen map is open.
  useEffect(() => {
    if (!expanded) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl ring-1 ring-[var(--color-line)]",
          heightClass,
          className
        )}
      >
        <GoogleMapPicker {...props} />
        <MapChrome onExpand={() => setExpanded(true)} />
      </div>

      {/* Fullscreen view — portalled to <body> so it escapes the modal/page
          stacking context. Same value/onChange, so dragging here carries back. */}
      {expanded &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[200] bg-black">
            <div className="relative h-full w-full">
              <GoogleMapPicker {...props} />

              <p className="pointer-events-none absolute left-1/2 top-[calc(env(safe-area-inset-top,0px)+0.75rem)] z-[2] -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1.5 text-[12px] font-semibold text-[var(--color-ink)] shadow-md backdrop-blur">
                Drag the pin or tap to place it exactly
              </p>

              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Close map"
                className="absolute right-3 top-[calc(env(safe-area-inset-top,0px)+0.75rem)] z-[2] flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--color-ink)] shadow-md ring-1 ring-black/10 active:scale-95"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] left-1/2 z-[2] flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-6 py-3 text-[14px] font-bold text-white shadow-lg active:scale-[0.98]"
              >
                <CheckIcon className="h-4.5 w-4.5" />
                Done
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
