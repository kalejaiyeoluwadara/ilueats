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
import { cn } from "@/lib/utils";
import { ADMIN_URL } from "@/lib/site";
import type { UserRole } from "@/types";

interface OperatorLoginConfig {
  role: UserRole;
  home: string;
  title: string;
  subtitle: string;
  welcomeTitle: string;
  welcomeBody: string;
  /** ì-mark tile treatment */
  tileClassName: string;
  accentGlowClassName: string;
  sibling: { label: string; href: string };
}

/**
 * The admin console moved to its own subdomain, so its sign-in no longer lives
 * here — only the rider variant remains. The config shape is kept so a second
 * operator console can be added back without reworking the component.
 */
const CONFIGS: Record<"rider", OperatorLoginConfig> = {
  rider: {
    role: "rider",
    home: "/rider",
    title: "Rider console",
    subtitle: "Clock in, pick up, deliver. Your town is hungry.",
    welcomeTitle: "You're clocked in",
    welcomeBody: "Rider console ready on this device.",
    tileClassName:
      "bg-gradient-to-br from-[#f96e22] via-[#e64e0e] to-[#c43e04] text-white",
    accentGlowClassName: "bg-[var(--color-primary)]/[0.12]",
    sibling: { label: "Ops console", href: `${ADMIN_URL}/login` },
  },
};

export function OperatorLogin({ variant }: { variant: "rider" }) {
  const config = CONFIGS[variant];
  const router = useRouter();
  const { user, ready, signIn } = useAuth();
  const { success, error: toastError } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    if (user.role === config.role) router.replace(config.home);
  }, [ready, user, router, config.role, config.home]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await signIn(email, password, { allowedRoles: [config.role] });
      if (!r.ok) {
        toastError("Sign in failed", r.error);
        return;
      }
      success(config.welcomeTitle, config.welcomeBody);
      router.push(config.home);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className={cn(
            "absolute -left-24 top-[-10%] h-[420px] w-[420px] rounded-full blur-3xl",
            config.accentGlowClassName
          )}
        />
        <div className="absolute bottom-[-20%] right-[-10%] h-[480px] w-[480px] rounded-full bg-[var(--color-accent)]/[0.09] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to ìlúEats
        </Link>

        <div className="flex flex-1 flex-col justify-center pb-10 pt-8">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <span
                className={cn(
                  "font-display flex h-14 w-14 items-center justify-center rounded-2xl text-[26px] font-extrabold shadow-[0_10px_28px_-8px_rgba(35,21,18,0.35)]",
                  config.tileClassName
                )}
              >
                ì
              </span>
              <h1 className="font-display mt-5 text-[26px] font-extrabold leading-tight tracking-tight text-[var(--color-ink)]">
                {config.title}
              </h1>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--color-ink-muted)]">
                {config.subtitle}
              </p>
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
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@ilueats.com"
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
                      required
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

                <Button type="submit" fullWidth size="lg" className="mt-2" loading={busy}>
                  Sign in
                </Button>
              </form>

              {variant === "rider" && (
                <p className="mt-5 rounded-xl bg-[var(--color-bg)] px-3 py-2.5 text-[12px] leading-relaxed text-[var(--color-ink-muted)] ring-1 ring-[var(--color-line)]">
                  Rider accounts are created by the ìlúEats team. No login yet?
                  Ask your ops contact to set you up.
                </p>
              )}

              <p className="mt-5 text-center text-[12px] text-[var(--color-ink-muted)]">
                Looking for the{" "}
                <a
                  href={config.sibling.href}
                  className="font-bold text-[var(--color-primary)] underline-offset-2 hover:underline"
                >
                  {config.sibling.label}
                </a>
                ?
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
