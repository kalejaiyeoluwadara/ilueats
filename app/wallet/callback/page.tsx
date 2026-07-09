"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { verifyTopup } from "@/lib/api/wallet";
import { ApiError } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";

/**
 * Fallback landing page for wallet top-ups when Paystack falls back to a full
 * redirect instead of the inline popup (set PAYSTACK_WALLET_CALLBACK_URL on
 * the backend to this route). The primary flow verifies inline on /wallet.
 */
function CallbackContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setErrorMsg("Missing top-up reference.");
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const res = await verifyTopup(reference);
        if (!isMounted) return;
        if (res.status === "success") {
          setBalance(res.balance);
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMsg(
            "We couldn't confirm this top-up yet. If you were debited, your wallet will be credited automatically in a moment."
          );
        }
      } catch (err) {
        if (!isMounted) return;
        setStatus("error");
        setErrorMsg(
          err instanceof ApiError
            ? err.message
            : "Failed to verify your top-up. Please contact support with your reference."
        );
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [reference]);

  return (
    <div className="min-h-screen pb-24">
      <Navbar variant="page" title="Wallet top-up" showSearch={false} />
      <main className="mx-auto flex max-w-md flex-col items-center px-6 pt-20 text-center">
        {status === "loading" && (
          <>
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
            <h1 className="font-display mt-6 text-[20px] font-extrabold tracking-tight text-[var(--color-ink)]">
              Confirming your top-up…
            </h1>
            <p className="mt-2 text-[14px] text-[var(--color-ink-muted)]">
              Please don&apos;t close this page.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)]">
              <CheckCircleIcon className="h-11 w-11" />
            </div>
            <h1 className="font-display mt-6 text-[22px] font-extrabold tracking-tight text-[var(--color-ink)]">
              Wallet topped up
            </h1>
            <p className="mt-2 text-[14px] text-[var(--color-ink-muted)]">
              {balance !== null
                ? `Your new balance is ${formatPrice(balance)}.`
                : "Your wallet has been credited."}
            </p>
            <Link href="/wallet" className="mt-6 w-full">
              <Button size="lg" fullWidth>
                Back to my wallet
              </Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
              <XCircleIcon className="h-11 w-11" />
            </div>
            <h1 className="font-display mt-6 text-[22px] font-extrabold tracking-tight text-[var(--color-ink)]">
              Top-up not confirmed
            </h1>
            <p className="mt-2 text-[14px] text-[var(--color-ink-muted)]">
              {errorMsg}
            </p>
            <div className="mt-6 flex w-full flex-col gap-2">
              <Button size="lg" fullWidth onClick={() => window.location.reload()}>
                Retry verification
              </Button>
              <Link href="/wallet" className="w-full">
                <Button size="lg" fullWidth variant="ghost">
                  Go to my wallet
                </Button>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function WalletCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
