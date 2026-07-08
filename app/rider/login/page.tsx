"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  DEMO_RIDER_EMAIL,
  DEMO_RIDER_PASSWORD,
} from "@/lib/operatorDemoAccounts";

export default function RiderLoginPage() {
  const router = useRouter();
  const { user, ready, signIn } = useAuth();
  const { success, error: toastError } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    if (user.role === "rider") router.replace("/rider");
  }, [ready, user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await signIn(email, password, { allowedRoles: ["rider"] });
      if (!r.ok) {
        toastError("Sign in failed", r.error);
        return;
      }
      success("You're clocked in", "Rider console ready on this device.");
      router.push("/rider");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.45]" aria-hidden>
        <div className="absolute -right-16 top-[-8%] h-[380px] w-[380px] rounded-full bg-emerald-500/[0.11] blur-3xl" />
        <div className="absolute bottom-[-18%] left-[-12%] h-[420px] w-[420px] rounded-full bg-[var(--color-primary)]/[0.08] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to IluEats
        </Link>

        <div className="flex flex-1 flex-col justify-center pb-10 pt-8">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-[0_10px_28px_-8px_rgba(5,150,105,0.55)]">
                <span className="text-[20px]" aria-hidden>
                  🛵
                </span>
              </span>
              <div>
                <h1 className="text-[20px] font-extrabold tracking-tight text-[var(--color-ink)]">
                  Rider sign in
                </h1>
                <p className="text-[12.5px] text-[var(--color-ink-muted)]">
                  Delivery partner console
                </p>
              </div>
            </div>

            <div className="rounded-[1.35rem] bg-[var(--color-surface)] p-6 shadow-crisp ring-1 ring-[var(--color-line)] sm:p-8">
              <form className="space-y-4" onSubmit={onSubmit}>
                <label className="block">
                  <span className="text-[12px] font-bold text-[var(--color-ink)]">
                    Email
                  </span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={DEMO_RIDER_EMAIL}
                    className="mt-2 h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)] px-4 text-[14px] font-semibold text-[var(--color-ink)] outline-none transition placeholder:font-medium placeholder:text-[var(--color-ink-soft)] focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-[12px] font-bold text-[var(--color-ink)]">
                    Password
                  </span>
                  <div className="relative mt-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)] py-0 pl-4 pr-12 text-[14px] font-semibold text-[var(--color-ink)] outline-none transition placeholder:font-medium placeholder:text-[var(--color-ink-soft)] focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-[var(--color-ink-soft)] transition hover:bg-black/[0.04] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </label>

                <p className="rounded-xl bg-emerald-50/80 px-3 py-2 text-[11.5px] font-medium leading-relaxed text-emerald-950/80 ring-1 ring-emerald-200/80">
                  Demo rider:{" "}
                  <span className="font-mono text-emerald-950">{DEMO_RIDER_EMAIL}</span>{" "}
                  /{" "}
                  <span className="font-mono text-emerald-950">{DEMO_RIDER_PASSWORD}</span>
                </p>

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  className="mt-2 bg-emerald-600 shadow-[0_6px_16px_-4px_rgba(5,150,105,0.45)] hover:bg-emerald-700 active:bg-emerald-800"
                  loading={busy}
                >
                  Go online
                </Button>
              </form>

              <p className="mt-5 text-center text-[12px] text-[var(--color-ink-muted)]">
                Operators manage the marketplace in the{" "}
                <Link
                  href="/admin/login"
                  className="font-bold text-emerald-700 underline-offset-2 hover:underline"
                >
                  admin console
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
