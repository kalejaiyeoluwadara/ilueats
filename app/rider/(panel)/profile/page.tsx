"use client";

import { UserIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function RiderProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)]">
          Profile
        </h1>
        <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
          Linked to your rider account session.
        </p>
      </div>

      <section className="rounded-[1.25rem] bg-[var(--color-surface)] p-5 shadow-crisp ring-1 ring-[var(--color-line)]">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80">
            <UserIcon className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <p className="text-[16px] font-extrabold text-[var(--color-ink)]">
              {user?.name ?? "Rider"}
            </p>
            <p className="truncate text-[13px] font-medium text-[var(--color-ink-muted)]">
              {user?.email}
            </p>
            <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-200/80">
              Verified rider · Ilisan
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.25rem] bg-[var(--color-surface)] p-5 shadow-crisp ring-1 ring-[var(--color-line)]">
        <h2 className="text-[13px] font-extrabold text-[var(--color-ink)]">
          Vehicle &amp; documents
        </h2>
        <p className="mt-1 text-[12px] text-[var(--color-ink-muted)]">
          Upload flow placeholder — nothing is saved yet.
        </p>
        <Button type="button" variant="outline" fullWidth className="mt-4" size="md">
          Manage documents
        </Button>
      </section>

      <Button
        type="button"
        variant="danger"
        fullWidth
        size="lg"
        onClick={() => {
          signOut();
          router.push("/rider/login");
        }}
      >
        Sign out everywhere on this device
      </Button>
    </div>
  );
}
