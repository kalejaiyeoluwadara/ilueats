"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn as nextAuthSignIn } from "next-auth/react";
import {
  ChevronRightIcon,
  HeartIcon,
  ClockIcon,
  MapPinIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import { WalletCard } from "@/components/wallet/WalletCard";
import { FoodAvatar } from "@/components/account/FoodAvatar";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

const links = [
  { href: "/orders", label: "Order history", icon: ClockIcon },
  { href: "/addresses", label: "Saved addresses", icon: MapPinIcon },
  { href: "/favorites", label: "Favourites", icon: HeartIcon },
  { href: "/support", label: "Help & support", icon: QuestionMarkCircleIcon },
  { href: "/privacy", label: "Privacy & terms", icon: ShieldCheckIcon },
];

type AuthMode = "signin" | "signup";

function AccountPageContent() {
  const { user, ready, signIn, signUp, signOut, updateProfile } = useAuth();
  const { balance, ready: walletReady } = useWallet();
  const { success, error: toastError } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirect") || null;

  const onGoogleSignIn = () => {
    nextAuthSignIn("google", { redirect: true, callbackUrl: redirectTo || "/" });
  };

  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editing, setEditing] = useState(false);

  const onSubmitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const r = await signIn(email, password, { allowedRoles: ["customer"] });
        if (!r.ok) toastError("Sign in failed", r.error);
        else {
          success("Welcome back", "You're signed in on this device.");
          setPassword("");
          if (redirectTo) {
            router.replace(redirectTo);
          }
        }
      } else {
        const r = await signUp(name, email, password);
        if (!r.ok) toastError("Could not create account", r.error);
        else {
          success("Account created", "You're signed in on this device.");
          setPassword("");
          if (redirectTo) {
            router.replace(redirectTo);
          }
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const startEdit = () => {
    if (!user) return;
    setEditName(user.name);
    setEditPhone(user.phone ?? "");
    setEditing(true);
  };

  const saveProfile = async () => {
    try {
      await updateProfile({ name: editName, phone: editPhone });
      setEditing(false);
      success("Profile updated");
    } catch (err) {
      toastError("Could not update profile", err instanceof Error ? err.message : "Please try again.");
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <Navbar variant="page" title="Account" showSearch={false} />
      <main className="mx-auto max-w-2xl px-4 pt-4">
        {!ready ? (
          <section className="rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 shrink-0 rounded-full bg-[var(--color-line)] skeleton" />
              <div className="min-w-0 flex-1 space-y-2 py-1">
                <div className="h-4.5 w-32 rounded bg-[var(--color-line)] skeleton" />
                <div className="h-3.5 w-48 rounded bg-[var(--color-line)] skeleton" />
              </div>
            </div>
          </section>
        ) : user ? (
          <>
            <section className="rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
              <div className="flex items-start gap-3">
                <FoodAvatar />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-extrabold tracking-tight">
                    {user.name}
                  </p>
                  <p className="mt-0.5 truncate text-[12.5px] text-[var(--color-ink-muted)]">
                    {user.email}
                  </p>
                  {user.phone && (
                    <p className="mt-0.5 text-[12.5px] text-[var(--color-ink-muted)]">
                      {user.phone}
                    </p>
                  )}
                </div>
              </div>
              {!editing ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={startEdit}>
                    Edit profile
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[var(--color-ink-soft)]"
                    leftIcon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
                    onClick={async () => {
                      await signOut();
                      success("Signed out");
                    }}
                  >
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                      Name
                    </span>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                      Phone 
                    </span>
                    <input
                      inputMode="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. 0803…"
                      className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
                    />
                  </label>
                  <div className="flex gap-2 pt-1">
                    <Button type="button" size="sm" onClick={saveProfile}>
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </section>

            <WalletCard balance={balance} ready={walletReady} />
          </>
        ) : (
          <section className="rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
            <div
              className="flex rounded-xl bg-[var(--color-bg)] p-0.5"
              role="tablist"
              aria-label="Sign in or sign up"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signin"}
                className={cn(
                  "flex-1 rounded-[10px] py-2 text-[13px] font-semibold transition-colors",
                  mode === "signin"
                    ? "bg-white text-[var(--color-ink)] shadow-sm ring-1 ring-black/[0.06]"
                    : "text-[var(--color-ink-muted)]"
                )}
                onClick={() => setMode("signin")}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signup"}
                className={cn(
                  "flex-1 rounded-[10px] py-2 text-[13px] font-semibold transition-colors",
                  mode === "signup"
                    ? "bg-white text-[var(--color-ink)] shadow-sm ring-1 ring-black/[0.06]"
                    : "text-[var(--color-ink-muted)]"
                )}
                onClick={() => setMode("signup")}
              >
                Create account
              </button>
            </div>
            <form onSubmit={onSubmitAuth} className="mt-5 space-y-3">
              {mode === "signup" && (
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                    Name
                  </span>
                  <input
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
                    placeholder="Your name"
                  />
                </label>
              )}
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                  Email
                </span>
                <input
                  autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
                  placeholder="you@example.com"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                  Password
                </span>
                <input
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
                  placeholder="••••••••"
                />
              </label>
              <Button type="submit" fullWidth size="lg" loading={busy}>
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <div className="relative mt-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-line)]" />
              </div>
              <span className="relative bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
                Or
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              fullWidth
              size="lg"
              className="mt-3 bg-white"
              onClick={onGoogleSignIn}
              leftIcon={<GoogleIcon className="h-5 w-5" />}
            >
              Continue with Google
            </Button>
          </section>
        )}

        <ul className="mt-4 space-y-2">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className="flex items-center justify-between rounded-2xl bg-white p-3.5 ring-1 ring-[var(--color-line)] hover:bg-black/[0.02]"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-bg)] text-[var(--color-ink)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[14px] font-semibold text-[var(--color-ink)]">
                      {l.label}
                    </span>
                  </span>
                  <ChevronRightIcon className="h-4 w-4 text-[var(--color-ink-soft)]" />
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-center text-[11px] font-semibold text-[var(--color-ink-soft)]">
          ilú v0.1 · made for Ilisan
        </p>
      </main>
      <BottomNav />
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pb-24">
        <Navbar variant="page" title="Account" showSearch={false} />
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
        </div>
        <BottomNav />
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#EA4335"
        d="M23.49 12.275c0-.825-.075-1.62-.21-2.385H12v4.515h6.45c-.285 1.485-1.125 2.745-2.385 3.585v2.985h3.855c2.265-2.085 3.57-5.145 3.57-8.7z"
      />
      <path
        fill="#4285F4"
        d="M12 24c3.24 0 5.955-1.08 7.935-2.91l-3.855-2.985c-1.08.72-2.46 1.155-4.08 1.155-3.135 0-5.805-2.115-6.75-4.965H1.365v3.075C3.345 21.225 7.425 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.25 14.295a7.143 7.143 0 0 1 0-4.59V6.63H1.365a11.936 11.936 0 0 0 0 10.74l3.885-3.075z"
      />
      <path
        fill="#34A853"
        d="M12 4.74c1.77 0 3.345.615 4.59 1.8l3.435-3.435C17.94 1.185 15.225 0 12 0 7.425 0 3.345 2.775 1.365 6.63l3.885 3.075c.945-2.85 3.615-4.965 6.75-4.965z"
      />
    </svg>
  );
}
