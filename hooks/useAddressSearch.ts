"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchAddressSuggestions,
  fetchPlaceDetails,
  type PlaceDetails,
  type PlaceSuggestion,
} from "@/lib/api/geocoding";
import { ApiError } from "@/lib/api/client";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

/** Below this length we don't spend a request — the backend rejects <2 anyway. */
const MIN_QUERY = 2;
const DEBOUNCE_MS = 300;

/**
 * We only deliver in the Ilisan-Remo area, so drop any suggestion that doesn't
 * reference it. Google spells the town "Ilishan-Remo" (with an "h"), while our
 * own UI uses "Ilisan" — accept either so we don't filter out valid matches.
 */
function inServiceArea(s: PlaceSuggestion): boolean {
  const haystack = `${s.primary} ${s.secondary} ${s.full}`.toLowerCase();
  return haystack.includes("ilisan") || haystack.includes("ilishan");
}

export type AddressSearchStatus =
  | "idle"
  | "loading"
  | "results"
  | "empty"
  | "error";

function newSessionToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Address autocomplete for the delivery picker. Debounces typing, cancels
 * superseded requests, and manages the Google "session token" lifecycle: one
 * token spans a search and its final Place Details lookup (billed as one
 * session), then rotates so the next search starts fresh.
 */
export function useAddressSearch() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [status, setStatus] = useState<AddressSearchStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const debounced = useDebouncedValue(query, DEBOUNCE_MS);
  const sessionToken = useRef(newSessionToken());
  // Aborts the in-flight autocomplete when a newer keystroke supersedes it.
  const acRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = debounced.trim();
    if (q.length < MIN_QUERY) {
      acRef.current?.abort();
      setSuggestions([]);
      setStatus("idle");
      setError(null);
      return;
    }

    const ac = new AbortController();
    acRef.current?.abort();
    acRef.current = ac;
    setStatus("loading");
    setError(null);

    fetchAddressSuggestions(q, sessionToken.current, ac.signal)
      .then((results) => {
        if (ac.signal.aborted) return;
        const filtered = results.filter(inServiceArea);
        setSuggestions(filtered);
        setStatus(filtered.length ? "results" : "empty");
      })
      .catch((err: unknown) => {
        // A superseded request aborts — that's not a user-facing error.
        if (ac.signal.aborted || (err as Error)?.name === "AbortError") return;
        setSuggestions([]);
        setStatus("error");
        setError(
          err instanceof ApiError && err.status === 503
            ? "Address search is unavailable right now — enter it manually below."
            : "Couldn't load suggestions. Check your connection."
        );
      });

    return () => ac.abort();
  }, [debounced]);

  /**
   * Resolve a picked suggestion to coordinates. Rotates the session token
   * afterward so the next search opens a new (correctly billed) session.
   */
  const selectPlace = useCallback(
    async (placeId: string): Promise<PlaceDetails | null> => {
      acRef.current?.abort();
      try {
        const details = await fetchPlaceDetails(placeId, sessionToken.current);
        return details;
      } catch {
        return null;
      } finally {
        sessionToken.current = newSessionToken();
      }
    },
    []
  );

  const reset = useCallback(() => {
    acRef.current?.abort();
    setQuery("");
    setSuggestions([]);
    setStatus("idle");
    setError(null);
    sessionToken.current = newSessionToken();
  }, []);

  return { query, setQuery, suggestions, status, error, selectPlace, reset };
}
