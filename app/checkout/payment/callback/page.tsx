"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { verifyPayment } from "@/lib/api/payments";
import { ApiError } from "@/lib/api/client";

/**
 * Fallback landing page for Paystack's `callback_url`. The primary checkout
 * flow verifies payment inline via the popup's onSuccess handler and never
 * navigates here — this page only matters if Paystack falls back to a full
 * redirect (e.g. some bank/3DS challenges), so the payment still gets
 * verified even if the user lands on this page instead of back in the app.
 */
function CallbackContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setErrorMsg("Missing payment reference.");
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const res = await verifyPayment(reference);
        if (!isMounted) return;
        if (res.status === "paid") {
          setOrderId(res.order);
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMsg(
            "We couldn't confirm this payment yet. If you completed the transfer, please wait a moment and check your orders."
          );
        }
      } catch (err) {
        if (!isMounted) return;
        setStatus("error");
        setErrorMsg(
          err instanceof ApiError
            ? err.message
            : "Failed to verify your payment. Please contact support with your reference."
        );
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [reference]);

  return (
    <div className="min-h-screen pb-24">
      <Navbar variant="page" title="Payment status" showSearch={false} />
      <main className="mx-auto flex max-w-md flex-col items-center px-6 pt-20 text-center">
        {status === "loading" && (
          <>
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
            <h1 className="font-display mt-6 text-[20px] font-extrabold tracking-tight text-[var(--color-ink)]">
              Confirming your payment…
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
              Payment confirmed
            </h1>
            <p className="mt-2 text-[14px] text-[var(--color-ink-muted)]">
              Order {orderId} is being prepared.
            </p>
            <Link href="/orders" className="mt-6 w-full">
              <Button size="lg" fullWidth>
                View my orders
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
              Payment not confirmed
            </h1>
            <p className="mt-2 text-[14px] text-[var(--color-ink-muted)]">
              {errorMsg}
            </p>
            <div className="mt-6 flex w-full flex-col gap-2">
              <Button size="lg" fullWidth onClick={() => window.location.reload()}>
                Retry verification
              </Button>
              <Link href="/orders" className="w-full">
                <Button size="lg" fullWidth variant="ghost">
                  Go to my orders
                </Button>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function PaymentCallbackPage() {
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
