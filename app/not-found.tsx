import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <main className="mx-auto flex max-w-2xl flex-col items-center px-6 pt-24 text-center">
        <span className="text-6xl">🍽️</span>
        <h1 className="mt-4 text-[24px] font-extrabold tracking-tight">
          Page not found
        </h1>
        <p className="mt-2 max-w-sm text-[14px] text-[var(--color-ink-muted)]">
          We couldn&apos;t find that store, dish, or page. Let&apos;s get you back to
          the good stuff.
        </p>
        <Link href="/" className="mt-6">
          <Button size="lg">Back to home</Button>
        </Link>
      </main>
    </div>
  );
}
