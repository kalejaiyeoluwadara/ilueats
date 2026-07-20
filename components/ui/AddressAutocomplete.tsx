"use client";

import { useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { InlineLoader } from "@/components/ui/Loaders";
import { useAddressSearch } from "@/hooks/useAddressSearch";
import { type PlaceDetails } from "@/lib/api/geocoding";
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
  // Which suggestion is being resolved to coordinates (spinner on that row).
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

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
