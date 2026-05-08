import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";

function ProseSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
      <h2 className="text-[15px] font-extrabold tracking-tight text-[var(--color-ink)]">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[13.5px] leading-relaxed text-[var(--color-ink-muted)]">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pb-24">
      <Navbar variant="page" title="Privacy & terms" showSearch={false} />
      <main className="mx-auto max-w-2xl px-4 pt-4">
        <p className="mb-5 text-[12px] font-medium text-[var(--color-ink-soft)]">
          Last updated: 8 May 2026 · iluEats demo
        </p>

        <div className="space-y-4">
          <ProseSection title="Summary">
            <p>
              IluEats is in active development. This page describes how the
              current demo treats your information and the basic rules for using
              the app. When we launch publicly, this text will be reviewed with
              legal counsel and updated.
            </p>
          </ProseSection>

          <ProseSection title="Privacy">
            <p>
              The app runs mostly in your browser. Cart, favourites, saved
              addresses, and optional sign-in details may be stored in{" "}
              <strong className="font-semibold text-[var(--color-ink)]">
                local storage
              </strong>{" "}
              on your device. We do not run a production backend tied to this demo,
              so your data is not uploaded to IluEats servers as part of this
              version.
            </p>
            <p>
              Images and menu content you see are for demonstration. Third-party
              services (for example image hosts) may receive normal web requests
              when those assets load.
            </p>
          </ProseSection>

          <ProseSection title="Cookies & analytics">
            <p>
              Core Next.js and tooling may set technical cookies or similar
              storage as part of running the site. We are not using advertising
              or cross-site tracking cookies in this demo.
            </p>
          </ProseSection>

          <ProseSection title="Terms of use">
            <p>
              The service is provided &quot;as is&quot; for testing and feedback.
              Do not rely on it for real food orders, payments, or deliveries until
              an official launch is announced.
            </p>
            <p>
              You agree not to misuse the app (including attempting to disrupt it,
              scrape it in ways that harm performance, or use it for anything
              unlawful). Store names and items shown may be illustrative and not
              represent real commercial relationships yet.
            </p>
          </ProseSection>

          <ProseSection title="Contact">
            <p>
              Questions about this policy? Use{" "}
              <Link
                href="/help"
                className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
              >
                Help &amp; support
              </Link>{" "}
              for now; formal contact channels will be listed at launch.
            </p>
          </ProseSection>
        </div>

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
