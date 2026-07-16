"use client";

import { useEffect } from "react";
import {
  clearChunkErrorBudget,
  isChunkLoadError,
  recoverFromChunkError,
} from "@/lib/chunkErrors";

/**
 * The router loads route chunks outside of React's render, so a stale-build
 * chunk 404 surfaces as an uncaught window error that no error boundary sees —
 * the user just watches a navigation silently do nothing. Catch those here.
 */
export function ChunkErrorReloader() {
  useEffect(() => {
    // We rendered, so this build is intact and past reloads are no longer suspect.
    clearChunkErrorBudget();

    const onError = (event: ErrorEvent) => {
      if (!isChunkLoadError(event.error ?? event.message)) return;
      event.preventDefault();
      recoverFromChunkError();
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      if (!isChunkLoadError(event.reason)) return;
      event.preventDefault();
      recoverFromChunkError();
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
