"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getWallet } from "@/lib/api/wallet";

/**
 * Wallet balance for the signed-in backend user. `balance` is null until the
 * first successful fetch; guests resolve to ready with a null balance.
 */
export function useWallet() {
  const { data: session, status } = useSession();
  const [balance, setBalance] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const wallet = await getWallet();
      setBalance(wallet.balance);
    } catch {
      // Keep the last known balance; the page using it can retry.
    } finally {
      setReady(true);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.accessToken) {
      setBalance(null);
      setReady(true);
      return;
    }
    void refresh();
  }, [status, session?.accessToken, refresh]);

  return { balance, ready, refresh };
}
