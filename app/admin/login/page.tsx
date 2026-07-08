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
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
} from "@/lib/operatorDemoAccounts";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, ready, signIn } = useAuth();
  const { success, error: toastError } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    if (user.role === "admin") router.replace("/admin");
  }, [ready, user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await signIn(email, password, { allowedRoles: ["admin"] });
      if (!r.ok) {
        toastError("Sign in failed", r.error);
        return;
      }
      success("Welcome", "Admin console unlocked on this device.");
      router.push("/admin");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        aria-hidden
      >
        <div className="absolute -left-24 top-[-10%] h-[420px] w-[420px] rounded-full bg-[var(--color-primary)]/[0.12] blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[480px] w-[480px] rounded-full bg-[var(--color-accent)]/[0.1] blur-3xl" />
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
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[16px] font-extrabold text-white shadow-[0_10px_28px_-8px_rgba(232,84,26,0.55)]">
                IE
              </span>
              <div>
                <h1 className="text-[20px] font-extrabold tracking-tight text-[var(--color-ink)]">
                  Operator sign in
                </h1>
                <p className="text-[12.5px] text-[var(--color-ink-muted)]">
                  IluEats admin console
                </p>
              </div>
            </div>

            <div className="rounded-[1.35rem] bg-[var(--color-surface)] p-6 shadow-crisp ring-1 ring-[var(--color-line)] sm:p-8">
              <form className="space-y-4" onSubmit={onSubmit}>
                <label className="block">
                  <span className="text-[12px] font-bold text-[var(--color-ink)]">
                    Work email
                  </span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={DEMO_ADMIN_EMAIL}
                    className="mt-2 h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)] px-4 text-[14px] font-semibold text-[var(--color-ink)] outline-none transition placeholder:font-medium placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-primary)]/40 focus:ring-2 focus:ring-[var(--color-primary)]/20"
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
                      className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)] py-0 pl-4 pr-12 text-[14px] font-semibold text-[var(--color-ink)] outline-none transition placeholder:font-medium placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-primary)]/40 focus:ring-2 focus:ring-[var(--color-primary)]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-[var(--color-ink-soft)] transition hover:bg-black/[0.04] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/35"
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

                <p className="rounded-xl bg-[var(--color-bg)] px-3 py-2 text-[11.5px] font-medium leading-relaxed text-[var(--color-ink-muted)] ring-1 ring-[var(--color-line)]">
                  Demo admin:{" "}
                  <span className="font-mono text-[var(--color-ink)]">
                    {DEMO_ADMIN_EMAIL}
                  </span>{" "}
                  /{" "}
                  <span className="font-mono text-[var(--color-ink)]">
                    {DEMO_ADMIN_PASSWORD}
                  </span>
                </p>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <label className="flex cursor-pointer items-center gap-2 text-[12.5px] font-semibold text-[var(--color-ink-muted)]">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded border-[var(--color-line)] text-[var(--color-primary)]"
                    />
                    Stay signed in
                  </label>
                  <button
                    type="button"
                    className="text-[12.5px] font-bold text-[var(--color-primary)] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" fullWidth size="lg" className="mt-2" loading={busy}>
                  Continue
                </Button>
              </form>

              <p className="mt-5 text-center text-[12px] text-[var(--color-ink-muted)]">
                Riders use{" "}
                <Link
                  href="/rider/login"
                  className="font-bold text-[var(--color-primary)] underline-offset-2 hover:underline"
                >
                  the rider console
                </Link>
                .
              </p>
            </div>

            <p className="mt-6 text-center text-[11px] font-medium text-[var(--color-ink-soft)]">
              Customer ordering lives on the{" "}
              <Link href="/" className="font-bold text-[var(--color-ink-muted)] hover:underline">
                home page
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
