import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";

function ProseSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]"
    >
      <h2 className="text-[15px] font-extrabold tracking-tight text-[var(--color-ink)]">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[13.5px] leading-relaxed text-[var(--color-ink-muted)]">
        {children}
      </div>
    </section>
  );
}

const strong = "font-semibold text-[var(--color-ink)]";

export default function TermsPage() {
  return (
    <div className="min-h-screen pb-24">
      <Navbar variant="page" title="Terms & conditions" showSearch={false} />
      <main className="mx-auto max-w-2xl px-4 pt-4">
        <p className="mb-5 text-[12px] font-medium text-[var(--color-ink-soft)]">
          Last updated: 23 July 2026
        </p>

        <div className="space-y-4">
          <ProseSection title="1. About these terms">
            <p>
              These terms of use (&quot;Terms&quot;) govern your use of the
              ìlúEats website and app (the &quot;Platform&quot;). By creating an
              account, placing an order, or otherwise using the Platform, you
              agree to be bound by these Terms. If you do not agree, please do
              not use the Platform.
            </p>
            <p>
              ìlúEats is a food-ordering and delivery service operating in and
              around Ilisan-Remo. We may update these Terms from time to time;
              the version shown here always applies to your current use.
            </p>
          </ProseSection>

          <ProseSection title="2. Our service">
            <p>
              ìlúEats connects you with restaurants, kitchens, and vendors
              (&quot;Stores&quot;) and arranges for your order to be delivered
              to you or made available for you to meet the rider. We facilitate
              ordering and delivery; the Stores are responsible for preparing
              your food and for its quality, packaging, and accuracy.
            </p>
            <p>
              We don&apos;t guarantee that the Platform will always be available,
              uninterrupted, or error-free. Store availability, menus, prices,
              and delivery times can change.
            </p>
          </ProseSection>

          <ProseSection title="3. Your account">
            <p>
              You must be at least 18 years old (or have the consent of a parent
              or guardian) to use ìlúEats. You agree to provide accurate
              information, keep your login details confidential, and accept
              responsibility for activity on your account. Tell us straight away
              if you think your account has been used without your permission.
            </p>
          </ProseSection>

          <ProseSection title="4. Placing an order">
            <p>
              Please review your cart, delivery details, and total at checkout
              before you confirm. Photos of items are for illustration and the
              food you receive may differ slightly. When you place an order, you
              are making an offer that the Store may accept or decline.
            </p>
            <p>
              You can cancel an order only before the Store has accepted it.
              Once a Store has started preparing your order, it generally cannot
              be cancelled — see <span className={strong}>Cancellations &amp;
              refunds</span> below.
            </p>
          </ProseSection>

          <ProseSection title="5. Payment">
            <p>
              You can pay with your ìlúEats wallet, debit card, bank transfer,
              or pay on delivery where available. Card and transfer payments are
              handled by our third-party payment processor; we don&apos;t store
              your full card details. Prices shown include applicable fees and
              taxes unless stated otherwise.
            </p>
            <p>
              A delivery fee and service fee may apply and are shown before you
              confirm. Delivery fees for some orders are priced by distance from
              the Store.
            </p>
          </ProseSection>

          <ProseSection id="delivery" title="6. Delivery & your availability">
            <p>
              For door delivery we bring your order to the address you provide;
              for &quot;meet at landmark&quot; you meet the rider at the spot you
              choose. You are responsible for giving an accurate address or
              landmark and clear directions.
            </p>
            <p>
              <span className={strong}>
                Food is time-sensitive. After you place a delivery order, please
                stay reachable for up to an hour.
              </span>{" "}
              Keep your phone switched on, charged, and nearby, and answer calls
              or messages from your rider. If we can&apos;t reach you, the rider
              can&apos;t find you, or you&apos;re not available to receive your
              order within a reasonable time of arrival, the order may be
              returned and treated as completed — and you may not be entitled to
              a refund.
            </p>
            <p>
              Please check your order on delivery and report any missing or
              incorrect items straight away so we can help.
            </p>
          </ProseSection>

          <ProseSection title="7. Cancellations & refunds">
            <p>
              If a Store cancels your order, or part of your order can&apos;t be
              fulfilled, we&apos;ll refund the affected amount to your original
              payment method or ìlúEats wallet. Refunds for issues you report
              (such as missing or incorrect items) are assessed case by case.
            </p>
            <p>
              Refunds are not generally available where an order failed because
              you were unreachable or unavailable to receive a delivery, as
              described in <span className={strong}>Delivery &amp; your
              availability</span> above.
            </p>
          </ProseSection>

          <ProseSection title="8. Promotional codes">
            <p>
              Promo codes must be used lawfully and as intended. They can&apos;t
              be resold or transferred, may have conditions or expiry dates, and
              can be withdrawn or disabled at any time without notice.
            </p>
          </ProseSection>

          <ProseSection title="9. Acceptable use">
            <p>
              You agree not to use ìlúEats for anything unlawful or fraudulent,
              to impersonate anyone, to submit false information, or to interfere
              with, scrape, or tamper with the Platform in ways that harm it or
              other users. We may suspend or close accounts that breach these
              Terms.
            </p>
          </ProseSection>

          <ProseSection title="10. Liability">
            <p>
              The Platform is provided &quot;as is&quot;. To the extent
              permitted by law, ìlúEats is not liable for indirect or
              consequential losses, for service interruptions, or for the acts
              of Stores or third parties. Nothing in these Terms excludes
              liability that cannot lawfully be excluded under Nigerian law.
            </p>
          </ProseSection>

          <ProseSection title="11. Privacy">
            <p>
              We handle your personal information in line with our{" "}
              <Link
                href="/privacy"
                className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
              >
                Privacy notice
              </Link>
              .
            </p>
          </ProseSection>

          <ProseSection title="12. Governing law">
            <p>
              These Terms are governed by the laws of the Federal Republic of
              Nigeria, and any disputes are subject to the jurisdiction of the
              Nigerian courts.
            </p>
          </ProseSection>

          <ProseSection title="13. Contact us">
            <p>
              Questions about these Terms or a problem with an order? Reach us
              through{" "}
              <Link
                href="/support"
                className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
              >
                Help &amp; support
              </Link>
              .
            </p>
          </ProseSection>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link href="/">
            <Button size="lg">Back to home</Button>
          </Link>
          <Link
            href="/privacy"
            className="text-[13px] font-semibold text-[var(--color-primary)]"
          >
            Privacy notice
          </Link>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
