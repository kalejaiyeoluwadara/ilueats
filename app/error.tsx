"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { isChunkLoadError, recoverFromChunkError } from "@/lib/chunkErrors";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // A stale-build chunk failure is recoverable without ever showing an error.
  const [recovering] = useState(
    () => isChunkLoadError(error) && recoverFromChunkError()
  );

  useEffect(() => {
    if (!recovering) console.error(error);
  }, [error, recovering]);

  if (recovering) return null;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <main className="mx-auto flex max-w-2xl flex-col items-center px-6 pt-24 text-center">
        <span className="text-6xl">🍳</span>
        <h1 className="font-display mt-4 text-[24px] font-extrabold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-2 max-w-sm text-[14px] text-[var(--color-ink-muted)]">
          That page didn&apos;t load properly. Give it another go — your cart is
          still safe.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={reset}>
            Try again
          </Button>
          <Link href="/">
            <Button size="lg" variant="outline">
              Back to home
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
