import Link from "next/link";
import { ClockIcon } from "@heroicons/react/24/outline";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";

export default function OrdersPage() {
  return (
    <div className="min-h-screen pb-24">
      <Navbar variant="page" title="Your orders" showSearch={false} />
      <main className="mx-auto flex max-w-2xl flex-col items-center px-6 pt-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary-soft)]">
          <ClockIcon className="h-9 w-9 text-[var(--color-primary)]" />
        </div>
        <h1 className="mt-5 text-[20px] font-extrabold tracking-tight">
          No orders yet
        </h1>
        <p className="mt-1.5 max-w-xs text-[13.5px] text-[var(--color-ink-muted)]">
          Place your first order and it will show up here. Tracking,
          re-ordering, and history coming soon.
        </p>
        <Link href="/" className="mt-6">
          <Button size="lg">Start an order</Button>
        </Link>
      </main>
      <BottomNav />
    </div>
  );
}
