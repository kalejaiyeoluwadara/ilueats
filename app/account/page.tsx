"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRightIcon,
  HeartIcon,
  ClockIcon,
  MapPinIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

const links = [
  { href: "/orders", label: "Order history", icon: ClockIcon },
  { href: "/addresses", label: "Saved addresses", icon: MapPinIcon },
  { href: "/favorites", label: "Favourites", icon: HeartIcon },
  { href: "/help", label: "Help & support", icon: QuestionMarkCircleIcon },
  { href: "/privacy", label: "Privacy & terms", icon: ShieldCheckIcon },
];

type AuthMode = "signin" | "signup";

export default function AccountPage() {
  const { user, ready, signIn, signUp, signOut, updateProfile } = useAuth();
  const { success, error: toastError } = useToast();
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
        const r = signIn(email, password);
        if (!r.ok) toastError("Sign in failed", r.error);
        else {
          success("Welcome back", "You're signed in on this device.");
          setPassword("");
        }
      } else {
        const r = signUp(name, email, password);
        if (!r.ok) toastError("Could not create account", r.error);
        else {
          success("Account created", "You're signed in on this device.");
          setPassword("");
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

  const saveProfile = () => {
    updateProfile({ name: editName, phone: editPhone });
    setEditing(false);
    success("Profile updated");
  };

  return (
    <div className="min-h-screen pb-24">
      <Navbar variant="page" title="Account" showSearch={false} />
      <main className="mx-auto max-w-2xl px-4 pt-4">
        {!ready ? (
          <section className="rounded-2xl bg-white p-6 ring-1 ring-[var(--color-line)]">
            <p className="text-center text-[14px] text-[var(--color-ink-muted)]">
              Loading…
            </p>
          </section>
        ) : user ? (
          <>
            <section className="rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  <UserIcon className="h-6 w-6" />
                </div>
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
                    onClick={() => {
                      signOut();
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
                      Phone (optional)
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
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11.5px] font-medium text-amber-900/90 ring-1 ring-amber-200/80">
              Demo only: sign-in is stored in this browser. No server or real security yet.
            </p>
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
            <p className="mt-3 text-center text-[11px] font-medium text-[var(--color-ink-soft)]">
              Local demo auth — passwords stay in browser storage only.
            </p>
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
