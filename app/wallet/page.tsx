"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownCircleIcon,
  ArrowPathIcon,
  ArrowUpCircleIcon,
  LockClosedIcon,
  ReceiptRefundIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/useToast";
import {
  getWalletTransactions,
  initializeTopup,
  verifyTopup,
  type WalletTransaction,
} from "@/lib/api/wallet";
import { ApiError } from "@/lib/api/client";
import { resumePaystackTransaction } from "@/lib/paystack";
import { cn, formatPrice } from "@/lib/utils";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];
const MIN_TOPUP = 100;
const MAX_TOPUP = 500_000;

export default function WalletPage() {
  const { user, ready: authReady } = useAuth();
  const { balance, ready: walletReady, refresh } = useWallet();
  const { success, error: toastError } = useToast();

  const [amount, setAmount] = useState<number | null>(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [topupState, setTopupState] = useState<"idle" | "paying" | "verifying">(
    "idle"
  );

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txnPage, setTxnPage] = useState(1);
  const [txnPageCount, setTxnPageCount] = useState(1);
  const [txnLoading, setTxnLoading] = useState(true);

  const loadTransactions = useCallback(
    async (page: number, replace: boolean) => {
      setTxnLoading(true);
      try {
        const res = await getWalletTransactions(page, 10);
        setTransactions((prev) =>
          replace ? res.items : [...prev, ...res.items]
        );
        setTxnPage(res.page);
        setTxnPageCount(res.pageCount);
      } catch {
        // Silent — the empty state below covers it.
      } finally {
        setTxnLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setTxnLoading(false);
      return;
    }
    void loadTransactions(1, true);
  }, [authReady, user, loadTransactions]);

  const parsedCustom = customAmount.trim()
    ? Number(customAmount.replace(/[,\s]/g, ""))
    : null;
  const effectiveAmount = parsedCustom ?? amount;
  const amountValid =
    effectiveAmount !== null &&
    Number.isInteger(effectiveAmount) &&
    effectiveAmount >= MIN_TOPUP &&
    effectiveAmount <= MAX_TOPUP;

  const onTopup = async () => {
    if (!amountValid || effectiveAmount === null || topupState !== "idle")
      return;
    setTopupState("paying");
    try {
      const payment = await initializeTopup(effectiveAmount);

      const finalize = async () => {
        setTopupState("verifying");
        try {
          let status = "pending";
          let newBalance: number | null = null;
          for (let attempt = 0; attempt < 5; attempt++) {
            const res = await verifyTopup(payment.reference);
            status = res.status;
            newBalance = res.balance;
            if (status === "success" || status === "failed") break;
            await new Promise((r) => setTimeout(r, 2500));
          }
          if (status !== "success") {
            throw new Error(
              status === "failed"
                ? "The payment did not go through. You have not been charged."
                : `We couldn't confirm the top-up yet. If you were debited, your wallet will be credited automatically — reference ${payment.reference}.`
            );
          }
          success(
            "Wallet topped up!",
            `${formatPrice(effectiveAmount)} added. New balance: ${formatPrice(newBalance ?? 0)}.`
          );
          setCustomAmount("");
          await Promise.all([refresh(), loadTransactions(1, true)]);
        } catch (err) {
          toastError(
            "Top-up not confirmed",
            err instanceof Error ? err.message : "Please try again."
          );
          await Promise.all([refresh(), loadTransactions(1, true)]);
        } finally {
          setTopupState("idle");
        }
      };

      await resumePaystackTransaction({
        accessCode: payment.accessCode,
        onSuccess: finalize,
        onCancel: () => setTopupState("idle"),
        // Popup unavailable — fall back to Paystack's hosted page; the
        // /wallet/callback page verifies the top-up on redirect back.
        onError: () => {
          window.location.href = payment.authorizationUrl;
        },
      });
    } catch (err) {
      toastError(
        "Could not start top-up",
        err instanceof ApiError ? err.message : "Something went wrong. Try again."
      );
      setTopupState("idle");
    }
  };

  if (!authReady) {
    return (
      <Shell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
        </div>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <main className="mx-auto flex max-w-md flex-col items-center px-6 pt-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/10">
            <LockClosedIcon className="h-9 w-9" />
          </div>
          <h1 className="font-display mt-6 text-[22px] font-extrabold tracking-tight text-[var(--color-ink)]">
            Sign in to use your wallet
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-ink-muted)]">
            Top up once, then pay for orders in one tap — no bank transfer each
            time.
          </p>
          <Link href="/account?redirect=/wallet" className="mt-6 w-full">
            <Button size="lg" fullWidth>
              Sign in / Register
            </Button>
          </Link>
        </main>
      </Shell>
    );
  }

  return (
    <Shell>
      <main className="mx-auto max-w-2xl space-y-5 px-4 pt-4">
        {/* Balance */}
        <section className="relative overflow-hidden rounded-2xl bg-[var(--color-primary)] p-5 text-white">
          <WalletIcon className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 text-white/10" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
            Wallet balance
          </p>
          {walletReady ? (
            <p className="font-display mt-1 text-[32px] font-extrabold tracking-tight">
              {formatPrice(balance ?? 0)}
            </p>
          ) : (
            <div className="mt-2 h-8 w-32 rounded bg-white/20 skeleton" />
          )}
          <p className="mt-1 text-[12.5px] text-white/75">
            Pay for orders instantly at checkout.
          </p>
        </section>

        {/* Top up */}
        <section className="rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
          <h3 className="text-[13.5px] font-extrabold tracking-tight text-[var(--color-ink)]">
            Top up wallet
          </h3>
          <p className="mt-0.5 text-[12px] text-[var(--color-ink-muted)]">
            Secured by Paystack. Between {formatPrice(MIN_TOPUP)} and{" "}
            {formatPrice(MAX_TOPUP)}.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((a) => {
              const active = customAmount.trim() === "" && amount === a;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    setAmount(a);
                    setCustomAmount("");
                  }}
                  className={cn(
                    "rounded-full px-4 py-2 text-[13px] font-bold ring-1 transition-colors",
                    active
                      ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] ring-[var(--color-primary)]/35"
                      : "bg-[var(--color-bg)] text-[var(--color-ink)] ring-[var(--color-line)] hover:bg-black/[0.03]"
                  )}
                >
                  {formatPrice(a)}
                </button>
              );
            })}
          </div>

          <label className="mt-3 block">
            <span className="text-[12px] font-semibold text-[var(--color-ink-muted)]">
              Or enter an amount
            </span>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[14px] font-bold text-[var(--color-ink-soft)]">
                ₦
              </span>
              <input
                inputMode="numeric"
                value={customAmount}
                onChange={(e) =>
                  setCustomAmount(e.target.value.replace(/[^\d,]/g, ""))
                }
                placeholder="e.g. 3000"
                className="h-11 w-full rounded-xl bg-[var(--color-bg)] pl-8 pr-3.5 text-[14px] font-medium text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)] placeholder:text-[var(--color-ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
              />
            </div>
          </label>
          {customAmount.trim() !== "" && !amountValid && (
            <p className="mt-1.5 text-[12px] font-semibold text-red-500">
              Enter a whole amount between {formatPrice(MIN_TOPUP)} and{" "}
              {formatPrice(MAX_TOPUP)}.
            </p>
          )}

          <Button
            size="lg"
            fullWidth
            className="mt-4"
            onClick={onTopup}
            disabled={!amountValid || topupState !== "idle"}
            loading={topupState !== "idle"}
          >
            {topupState === "verifying"
              ? "Confirming top-up…"
              : topupState === "paying"
                ? "Opening secure payment…"
                : amountValid && effectiveAmount !== null
                  ? `Top up ${formatPrice(effectiveAmount)}`
                  : "Top up"}
          </Button>
        </section>

        {/* History */}
        <section className="rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
          <h3 className="text-[13.5px] font-extrabold tracking-tight text-[var(--color-ink)]">
            Recent activity
          </h3>

          {txnLoading && transactions.length === 0 ? (
            <div className="mt-3 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[var(--color-line)] skeleton" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-28 rounded bg-[var(--color-line)] skeleton" />
                    <div className="h-3 w-40 rounded bg-[var(--color-line)] skeleton" />
                  </div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="mt-3 rounded-xl bg-[var(--color-bg)] p-4 text-center text-[13px] text-[var(--color-ink-muted)]">
              No wallet activity yet. Your top-ups and payments will show up
              here.
            </p>
          ) : (
            <>
              <ul className="mt-2 divide-y divide-dashed divide-[var(--color-line)]">
                {transactions.map((t) => (
                  <TransactionRow key={t.id} txn={t} />
                ))}
              </ul>
              {txnPage < txnPageCount && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  fullWidth
                  className="mt-2"
                  loading={txnLoading}
                  onClick={() => loadTransactions(txnPage + 1, false)}
                >
                  Load more
                </Button>
              )}
            </>
          )}
        </section>
      </main>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-24">
      <Navbar variant="page" title="Wallet" showSearch={false} />
      {children}
      <BottomNav />
    </div>
  );
}

const TXN_META: Record<
  WalletTransaction["type"],
  { label: string; icon: typeof ArrowDownCircleIcon; credit: boolean }
> = {
  topup: { label: "Wallet top-up", icon: ArrowDownCircleIcon, credit: true },
  order_payment: {
    label: "Order payment",
    icon: ArrowUpCircleIcon,
    credit: false,
  },
  refund: { label: "Refund", icon: ReceiptRefundIcon, credit: true },
};

function TransactionRow({ txn }: { txn: WalletTransaction }) {
  const meta = TXN_META[txn.type] ?? {
    label: "Transaction",
    icon: ArrowPathIcon,
    credit: false,
  };
  const Icon = meta.icon;
  const failed = txn.status === "failed";
  const pending = txn.status === "pending";

  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className={cn(
          "flex h-9 w-9 flex-none items-center justify-center rounded-xl",
          failed
            ? "bg-red-50 text-red-500"
            : meta.credit
              ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
              : "bg-[var(--color-bg)] text-[var(--color-ink)]"
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-[var(--color-ink)]">
          {meta.label}
          {txn.orderCode ? ` · ${txn.orderCode}` : ""}
        </p>
        <p className="mt-0.5 text-[12px] text-[var(--color-ink-muted)]">
          {new Date(txn.createdAt).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}{" "}
          ·{" "}
          {new Date(txn.createdAt).toLocaleTimeString("en-NG", {
            hour: "numeric",
            minute: "2-digit",
          })}
          {pending && " · Pending"}
          {failed && " · Failed"}
        </p>
      </div>
      <span
        className={cn(
          "whitespace-nowrap text-[13.5px] font-extrabold",
          failed || pending
            ? "text-[var(--color-ink-soft)] line-through decoration-transparent"
            : meta.credit
              ? "text-[var(--color-success)]"
              : "text-[var(--color-ink)]"
        )}
      >
        {meta.credit ? "+" : "−"}
        {formatPrice(txn.amount)}
      </span>
    </li>
  );
}
