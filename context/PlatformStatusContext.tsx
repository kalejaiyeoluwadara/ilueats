"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  fetchPlatformStatus,
  type PlatformStatus,
} from "@/lib/api/platform";

const POLL_MS = 60_000;

type PlatformStatusContextValue = {
  /** Optimistically open until the first status response lands. */
  isOpen: boolean;
  status: PlatformStatus | null;
  refetch: () => Promise<void>;
};

const PlatformStatusContext =
  createContext<PlatformStatusContextValue | null>(null);

export function PlatformStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<PlatformStatus | null>(null);

  const refetch = useCallback(async () => {
    try {
      setStatus(await fetchPlatformStatus());
    } catch {
      // Keep the last known status; never block the app on a failed poll.
    }
  }, []);

  useEffect(() => {
    refetch();
    const timer = window.setInterval(refetch, POLL_MS);
    const onFocus = () => refetch();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refetch]);

  return (
    <PlatformStatusContext.Provider
      value={{ isOpen: status?.isOpen ?? true, status, refetch }}
    >
      {children}
    </PlatformStatusContext.Provider>
  );
}

export function usePlatformStatus(): PlatformStatusContextValue {
  const ctx = useContext(PlatformStatusContext);
  if (!ctx) {
    throw new Error(
      "usePlatformStatus must be used within a PlatformStatusProvider"
    );
  }
  return ctx;
}
