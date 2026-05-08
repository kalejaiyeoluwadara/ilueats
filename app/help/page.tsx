import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";

export default function HelpPage() {
  return (
    <div className="min-h-screen pb-24">
      <Navbar variant="page" title="Help & support" showSearch={false} />
      <main className="mx-auto max-w-2xl px-4 pt-4">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
          <p className="text-[13.5px] leading-relaxed text-[var(--color-ink-muted)]">
            ilu<span className="font-bold text-[var(--color-primary)]">Eats</span>{" "}
            is built for Ilisan — here&apos;s how to get the most out of it.
          </p>
        </div>

        <section className="mt-5 space-y-4">
          <h2 className="px-0.5 text-[12px] font-extrabold uppercase tracking-wider text-[var(--color-ink-soft)]">
            Common questions
          </h2>

          <article className="rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
            <h3 className="text-[15px] font-extrabold text-[var(--color-ink)]">
              How do I place an order?
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-ink-muted)]">
              Pick a store from the home screen, add items to your bag, then open
              your cart and go to checkout. You&apos;ll enter delivery details and
              choose a payment option — right now checkout is a demo, so no real
              charge is made.
            </p>
          </article>

          <article className="rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
            <h3 className="text-[15px] font-extrabold text-[var(--color-ink)]">
              One store per order
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-ink-muted)]">
              Your bag can only hold items from one restaurant at a time. If you
              switch stores, we&apos;ll ask you to start a new bag so fees and prep
              stay accurate.
            </p>
          </article>

          <article className="rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
            <h3 className="text-[15px] font-extrabold text-[var(--color-ink)]">
              Saved addresses & account
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-ink-muted)]">
              Add addresses under{" "}
              <Link
                href="/addresses"
                className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
              >
                Saved addresses
              </Link>
              . Sign in on the account tab to keep your profile on this device.
              Data is stored locally for now — it isn&apos;t synced to a server yet.
            </p>
          </article>

          <article className="rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
            <h3 className="text-[15px] font-extrabold text-[var(--color-ink)]">
              Need more help?
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-ink-muted)]">
              This is an early version of IluEats. For real support when we
              launch, we&apos;ll add in-app chat, email, and a phone line for
              riders and customers.
            </p>
          </article>
        </section>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link href="/">
            <Button size="lg">Back to home</Button>
          </Link>
          <Link
            href="/account"
            className="text-[13px] font-semibold text-[var(--color-primary)]"
          >
            Account
          </Link>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
