"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { RiderJob, RiderOffer } from "@/types";
import { readLocalStorage, writeLocalStorage } from "@/lib/utils";

const STORAGE_KEY = "ilueats:rider_console:v1";

const OFFER_POOL: RiderOffer[] = [
  {
    id: "ILU-9K2M",
    store: "Mama Put Palace",
    customer: "Kemi F.",
    drop: "Babcock University gate",
    pay: 850,
    etaMin: 6,
    phone: "08021112222",
  },
  {
    id: "ILU-9K2N",
    store: "Crisp Bites",
    customer: "Dave L.",
    drop: "OPIC — Cedar Close",
    pay: 920,
    etaMin: 8,
    phone: "08032223333",
  },
  {
    id: "ILU-9K2P",
    store: "SmoothCity",
    customer: "Ife O.",
    drop: "Campus roundabout ATM",
    pay: 640,
    etaMin: 5,
    phone: "08043334444",
  },
  {
    id: "ILU-9K2Q",
    store: "Slice House",
    customer: "Wale T.",
    drop: "Ilisan post office",
    pay: 1100,
    etaMin: 10,
    phone: "08054445555",
  },
];

const INITIAL_JOBS: RiderJob[] = [
  {
    id: "ILU-9K2A",
    store: "Crisp Bites",
    customer: "Temi A.",
    address: "Opic Estate — Block C",
    payout: 520,
    status: "pickup",
    phone: "08031110001",
  },
  {
    id: "ILU-9K2H",
    store: "SmoothCity",
    customer: "Chidi O.",
    address: "Babcock gate",
    payout: 480,
    status: "en_route",
    phone: "08031110002",
  },
  {
    id: "ILU-9K2G",
    store: "Slice House",
    customer: "Anita I.",
    address: "Campus roundabout",
    payout: 610,
    status: "done",
    phone: "08031110003",
  },
];

type PersistedShape = {
  isOnline: boolean;
  jobs: RiderJob[];
  offerCursor: number;
  deliveriesToday: number;
  tipsToday: number;
};

function defaultPersisted(): PersistedShape {
  return {
    isOnline: true,
    jobs: INITIAL_JOBS,
    offerCursor: 0,
    deliveriesToday: 7,
    tipsToday: 1200,
  };
}

function loadPersisted(): PersistedShape {
  const fallback = defaultPersisted();
  const raw = readLocalStorage<PersistedShape | null>(STORAGE_KEY, null);
  if (!raw || !Array.isArray(raw.jobs)) return fallback;
  return {
    isOnline: typeof raw.isOnline === "boolean" ? raw.isOnline : true,
    jobs: raw.jobs.length ? raw.jobs : fallback.jobs,
    offerCursor:
      typeof raw.offerCursor === "number"
        ? Math.abs(raw.offerCursor) % OFFER_POOL.length
        : 0,
    deliveriesToday:
      typeof raw.deliveriesToday === "number"
        ? raw.deliveriesToday
        : fallback.deliveriesToday,
    tipsToday:
      typeof raw.tipsToday === "number" ? raw.tipsToday : fallback.tipsToday,
  };
}

function savePersisted(data: PersistedShape) {
  writeLocalStorage(STORAGE_KEY, data);
}

function jobBlocksOffer(job: RiderJob, offer: RiderOffer) {
  return job.id === offer.id && job.status !== "done";
}

function listAvailableOffers(jobs: RiderJob[]): RiderOffer[] {
  return OFFER_POOL.filter(
    (o) => !jobs.some((j) => jobBlocksOffer(j, o))
  );
}

interface RiderConsoleContextValue {
  isOnline: boolean;
  setOnline: (next: boolean) => void;
  jobs: RiderJob[];
  /** Offers you can pick up right now (not blocked by an active job). */
  availableOffers: RiderOffer[];
  deliveriesToday: number;
  tipsToday: number;
  onTimePercent: string;
  acceptOffer: (offerId: string) => boolean;
  markPickedUp: (jobId: string) => void;
  markDelivered: (jobId: string) => number | null;
}

const RiderConsoleContext = createContext<RiderConsoleContextValue | null>(
  null
);

export function RiderConsoleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const init = useMemo(() => loadPersisted(), []);
  const [isOnline, setIsOnlineState] = useState(init.isOnline);
  const [jobs, setJobs] = useState<RiderJob[]>(init.jobs);
  const [offerCursor, setOfferCursor] = useState(init.offerCursor);
  const [deliveriesToday, setDeliveriesToday] = useState(
    init.deliveriesToday
  );
  const [tipsToday, setTipsToday] = useState(init.tipsToday);

  const persist = useCallback(
    (patch: Partial<PersistedShape>) => {
      const next: PersistedShape = {
        isOnline,
        jobs,
        offerCursor,
        deliveriesToday,
        tipsToday,
        ...patch,
      };
      savePersisted(next);
    },
    [isOnline, jobs, offerCursor, deliveriesToday, tipsToday]
  );

  const setOnline = useCallback(
    (next: boolean) => {
      setIsOnlineState(next);
      persist({ isOnline: next });
    },
    [persist]
  );

  const availableOffers = useMemo(() => {
    if (!isOnline) return [];
    return listAvailableOffers(jobs);
  }, [isOnline, jobs]);

  const acceptOffer = useCallback(
    (offerId: string): boolean => {
      if (!isOnline) return false;
      const o = OFFER_POOL.find((x) => x.id === offerId);
      if (!o) return false;
      if (jobs.some((j) => j.id === o.id && j.status !== "done")) return false;

      const row: RiderJob = {
        id: o.id,
        store: o.store,
        customer: o.customer,
        address: o.drop,
        payout: o.pay,
        status: "pickup",
        phone: o.phone,
      };
      const nextJobs = [
        ...jobs.filter((j) => !(j.id === o.id && j.status === "done")),
        row,
      ];
      const idx = OFFER_POOL.findIndex((x) => x.id === offerId);
      const nextCursor =
        idx >= 0 ? (idx + 1) % OFFER_POOL.length : offerCursor;
      setJobs(nextJobs);
      setOfferCursor(nextCursor);
      persist({ jobs: nextJobs, offerCursor: nextCursor });
      return true;
    },
    [isOnline, jobs, offerCursor, persist]
  );

  const markPickedUp = useCallback(
    (jobId: string) => {
      setJobs((prev) => {
        const next = prev.map((j) =>
          j.id === jobId && j.status === "pickup"
            ? { ...j, status: "en_route" as const }
            : j
        );
        persist({ jobs: next });
        return next;
      });
    },
    [persist]
  );

  const markDelivered = useCallback(
    (jobId: string): number | null => {
      const target = jobs.find((j) => j.id === jobId);
      if (!target || target.status !== "en_route") return null;
      const tip = 150 + Math.floor(Math.random() * 200);
      const next = jobs.map((j) =>
        j.id === jobId ? { ...j, status: "done" as const } : j
      );
      const d = deliveriesToday + 1;
      const t = tipsToday + tip;
      setJobs(next);
      setDeliveriesToday(d);
      setTipsToday(t);
      persist({ jobs: next, deliveriesToday: d, tipsToday: t });
      return tip;
    },
    [jobs, deliveriesToday, tipsToday, persist]
  );

  const value = useMemo<RiderConsoleContextValue>(
    () => ({
      isOnline,
      setOnline,
      jobs,
      availableOffers,
      deliveriesToday,
      tipsToday,
      onTimePercent: "94%",
      acceptOffer,
      markPickedUp,
      markDelivered,
    }),
    [
      isOnline,
      setOnline,
      jobs,
      availableOffers,
      deliveriesToday,
      tipsToday,
      acceptOffer,
      markPickedUp,
      markDelivered,
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
