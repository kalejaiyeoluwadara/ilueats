"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { RiderJob, RiderOffer } from "@/types";
import {
  getRiderOffers,
  acceptRiderOffer,
  setRiderOnline,
  getRiderJobs,
  pickupRiderJob,
  deliverRiderJob,
  getRiderEarningsSummary,
  getRiderProfile,
} from "@/lib/api/rider";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";

interface RiderConsoleContextValue {
  ready: boolean;
  error: string | null;
  isOnline: boolean;
  setOnline: (next: boolean) => Promise<void>;
  jobs: RiderJob[];
  /** Offers you can pick up right now (open orders nobody accepted). */
  availableOffers: RiderOffer[];
  deliveriesToday: number;
  tipsToday: number;
  onTimePercent: string;
  acceptOffer: (offerId: string) => Promise<boolean>;
  markPickedUp: (jobId: string) => Promise<boolean>;
  markDelivered: (jobId: string) => Promise<number | null>;
  refresh: () => void;
}

const RiderConsoleContext = createContext<RiderConsoleContextValue | null>(
  null
);

export function RiderConsoleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isOnline, setIsOnlineState] = useState(false);
  const [jobs, setJobs] = useState<RiderJob[]>([]);
  const [availableOffers, setAvailableOffers] = useState<RiderOffer[]>([]);
  const [deliveriesToday, setDeliveriesToday] = useState(0);
  const [tipsToday, setTipsToday] = useState(0);
  const [onTimePercent, setOnTimePercent] = useState("—");
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => setRefreshToken((n) => n + 1), []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      setError(null);
      try {
        const profile = await getRiderProfile();
        if (cancelled) return;
        setIsOnlineState(profile.isOnline);

        const [jobsRes, summary, offers] = await Promise.all([
          getRiderJobs({ pageSize: 100 }),
          getRiderEarningsSummary(),
          profile.isOnline ? getRiderOffers() : Promise.resolve([]),
        ]);
        if (cancelled) return;

        setJobs(jobsRes.items);
        setDeliveriesToday(summary.deliveriesToday);
        setTipsToday(summary.tips);
        setOnTimePercent(`${summary.onTimePercent}%`);
        setAvailableOffers(offers);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : "Failed to load rider console."
        );
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Key on user?.id (a stable string), not the user object: apiFetch's
    // getSession() broadcasts a session event that hands back a new user
    // identity each call, which would otherwise re-trigger this effect forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, refreshToken]);

  const setOnline = useCallback(async (next: boolean) => {
    const res = await setRiderOnline(next);
    setIsOnlineState(res.isOnline);
    if (res.isOnline) {
      setAvailableOffers(await getRiderOffers());
    } else {
      setAvailableOffers([]);
    }
  }, []);

  const acceptOffer = useCallback(async (offerId: string): Promise<boolean> => {
    try {
      const job = await acceptRiderOffer(offerId);
      setJobs((prev) => [job, ...prev]);
      setAvailableOffers((prev) => prev.filter((o) => o.id !== offerId));
      return true;
    } catch {
      return false;
    }
  }, []);

  const markPickedUp = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      const job = await pickupRiderJob(jobId);
      setJobs((prev) => prev.map((j) => (j.id === jobId ? job : j)));
      return true;
    } catch {
      return false;
    }
  }, []);

  const markDelivered = useCallback(
    async (jobId: string): Promise<number | null> => {
      try {
        const { job, tip } = await deliverRiderJob(jobId);
        setJobs((prev) => prev.map((j) => (j.id === jobId ? job : j)));
        setDeliveriesToday((d) => d + 1);
        setTipsToday((t) => t + tip);
        return tip;
      } catch {
        return null;
      }
    },
    []
  );

  const value = useMemo<RiderConsoleContextValue>(
    () => ({
      ready,
      error,
      isOnline,
      setOnline,
      jobs,
      availableOffers,
      deliveriesToday,
      tipsToday,
      onTimePercent,
      acceptOffer,
      markPickedUp,
      markDelivered,
      refresh,
    }),
    [
      ready,
      error,
      isOnline,
      setOnline,
      jobs,
      availableOffers,
      deliveriesToday,
      tipsToday,
      onTimePercent,
      acceptOffer,
      markPickedUp,
      markDelivered,
      refresh,
    ]
  );

  return (
    <RiderConsoleContext.Provider value={value}>
      {children}
    </RiderConsoleContext.Provider>
  );
}

export function useRiderConsole() {
  const ctx = useContext(RiderConsoleContext);
  if (!ctx) {
    throw new Error("useRiderConsole must be used within RiderConsoleProvider");
  }
  return ctx;
}
