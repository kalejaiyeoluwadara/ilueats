"use client";

import { useEffect, useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { InlineLoader } from "@/components/ui/Loaders";
import { useAddressSearch } from "@/hooks/useAddressSearch";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useToast } from "@/hooks/useToast";
import { reverseGeocode, type PlaceDetails } from "@/lib/api/geocoding";
import { cn } from "@/lib/utils";

/**
 * Address search with autocomplete. Type an address, pick from Google-backed
 * suggestions (biased to the service area), and get back a formatted address +
 * coordinates. Suggestions render in-flow rather than as an overlay so the list
 * is never clipped inside a scrolling modal/sheet.
 */
export function AddressAutocomplete({
  onSelect,
  placeholder = "Search your address or a nearby landmark",
  autoFocus,
}: {
  onSelect: (place: PlaceDetails) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const { query, setQuery, suggestions, status, error, selectPlace, reset } =
    useAddressSearch();
  const {
    status: geoStatus,
    reading: geo,
    request: requestGeo,
    reset: resetGeo,
  } = useGeolocation();
  const { error: showError } = useToast();
  // Which suggestion is being resolved to coordinates (spinner on that row).
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolvingLocation, setResolvingLocation] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  // True only between tapping "use my location" and consuming the fix — guards
  // the effect from firing on a stale reading.
  const awaitingFix = useRef(false);

  const useCurrentLocation = () => {
    awaitingFix.current = true;
    requestGeo({ fresh: true });
  };

  // A fresh GPS fix arrived → reverse-geocode it into an address + pin.
  useEffect(() => {
    if (!awaitingFix.current || !geo) return;
    awaitingFix.current = false;
    const { lat, lng } = geo;
    setResolvingLocation(true);
    reverseGeocode(lat, lng)
      .then((res) => {
        // Keep the device's own coordinates for the pin (its exact spot); use
        // the reverse-geocoded text for the address line.
        onSelect({ ...res, lat, lng });
        reset();
        setActive(-1);
        if (!res.inServiceArea) {
          showError(
            "Outside delivery area",
            "We currently deliver around Ilishan-Remo only."
          );
        }
      })
      .catch(() =>
        showError(
          "Couldn't get your address",
          "Search for it above instead."
        )
      )
      .finally(() => {
        setResolvingLocation(false);
        resetGeo();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo]);

  // Surface geolocation failures (denied / unavailable / timeout).
  useEffect(() => {
    if (!awaitingFix.current) return;
    if (geoStatus === "denied") {
      awaitingFix.current = false;
      showError(
        "Location blocked",
        "Allow location access in your browser, or search above."
      );
    } else if (geoStatus === "unavailable" || geoStatus === "timeout") {
      awaitingFix.current = false;
      showError("Couldn't get your location", "Search for your address above.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoStatus]);

  const locating = geoStatus === "locating" || resolvingLocation;

  const choose = async (placeId: string) => {
    if (resolvingId) return;
    setResolvingId(placeId);
    const place = await selectPlace(placeId);
    setResolvingId(null);
    if (place) {
      onSelect(place);
      reset();
      setActive(-1);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (status !== "results") return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      void choose(suggestions[active].placeId);
    } else if (e.key === "Escape") {
      setActive(-1);
    }
  };

  return (
    <div>
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-ink-soft)]" />
        <input
          ref={inputRef}
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={status === "results"}
          aria-controls="address-suggestion-list"
          aria-autocomplete="list"
          className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] py-2.5 pl-9 pr-9 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              reset();
              setActive(-1);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-ink-soft)] hover:bg-black/5"
          >
            {status === "loading" ? (
              <InlineLoader size="xs" tone="ink" />
            ) : (
              <XMarkIcon className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* One-tap GPS: reverse-geocodes the device location into an address. */}
      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={locating}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-[13px] font-bold text-[var(--color-primary)] transition hover:bg-black/[0.02] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {locating ? (
          <InlineLoader size="xs" tone="brand" />
        ) : (
          <MapPinIcon className="h-4.5 w-4.5" />
        )}
        {geoStatus === "locating"
          ? "Locating…"
          : resolvingLocation
            ? "Getting your address…"
            : "Use my current location"}
      </button>

      {/* Results / states — in-flow so the sheet's scroll never clips them. */}
      {status === "results" && suggestions.length > 0 && (
        <ul
          id="address-suggestion-list"
          role="listbox"
          className="mt-1.5 overflow-hidden rounded-xl border border-[var(--color-line)] bg-white"
        >
          {suggestions.map((s, i) => (
            <li key={s.placeId} role="option" aria-selected={active === i}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => void choose(s.placeId)}
                disabled={resolvingId !== null}
                className={cn(
                  "flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors",
                  i !== suggestions.length - 1 &&
                    "border-b border-[var(--color-line)]",
                  active === i ? "bg-[var(--color-primary-soft)]" : "bg-white"
                )}
              >
                <MapPinIcon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[var(--color-ink-soft)]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-[var(--color-ink)]">
                    {s.primary}
                  </span>
                  {s.secondary && (
                    <span className="block truncate text-[12px] text-[var(--color-ink-muted)]">
                      {s.secondary}
                    </span>
                  )}
                </span>
                {resolvingId === s.placeId && (
                  <InlineLoader size="xs" tone="ink" className="mt-0.5" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {status === "empty" && (
        <p className="mt-1.5 px-1 text-[12.5px] text-[var(--color-ink-muted)]">
          No matches. Try a nearby landmark, or type your address in the field
          below.
        </p>
      )}

      {status === "error" && error && (
        <p className="mt-1.5 px-1 text-[12.5px] text-amber-700">{error}</p>
      )}
    </div>
  );
}
