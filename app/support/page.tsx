import Link from "next/link";
import {
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  CreditCardIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";

/**
 * Support contact details. Replace these placeholders with the real
 * ìlúEats support line before launch (ideally wired to env/config).
 */
const SUPPORT_WHATSAPP = "2348000000000"; // digits only, international format
const SUPPORT_PHONE = "+2348000000000";
const SUPPORT_EMAIL = "support@ilueats.com";

const waHref = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
  "Hi ìlúEats, I need help with…",
)}`;

const channels = [
  {
    href: waHref,
    external: true,
    title: "Chat on WhatsApp",
    subtitle: "Fastest way to reach us · replies in minutes",
    Icon: ChatBubbleLeftRightIcon,
    tint: "bg-[#25D366]/12 text-[#128C4B]",
  },
  {
    href: `tel:${SUPPORT_PHONE}`,
    external: false,
    title: "Call support",
    subtitle: "8am – 10pm, every day",
    Icon: PhoneIcon,
    tint: "bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]",
  },
  {
    href: `mailto:${SUPPORT_EMAIL}`,
    external: false,
    title: "Email us",
    subtitle: SUPPORT_EMAIL,
    Icon: EnvelopeIcon,
    tint: "bg-[var(--color-bg)] text-[var(--color-ink)]",
  },
];

const topics = [
  { href: "/orders", label: "Track or report an order", Icon: ClockIcon },
  { href: "/addresses", label: "Delivery addresses", Icon: MapPinIcon },
  { href: "/wallet", label: "Wallet & payments", Icon: CreditCardIcon },
];

const faqs = [
  {
    q: "How do I place an order?",
    a: "Pick a store from the home screen, add items to your bag, then open your cart and go to checkout. You'll enter delivery details and choose a payment option — right now checkout is a demo, so no real charge is made.",
  },
  {
    q: "Why can I only order from one store at a time?",
    a: "Your bag can only hold items from one restaurant at a time. If you switch stores, we'll ask you to start a new bag so fees and prep times stay accurate.",
  },
  {
    q: "Where are my saved addresses and account stored?",
    a: "Add addresses under Saved addresses, and sign in on the account tab to keep your profile on this device. Data is stored locally for now — it isn't synced to a server yet.",
  },
  {
    q: "My rider can't find me — what do I do?",
    a: "Add a precise pin when saving your address so the rider gets your exact location. You can also chat with us on WhatsApp and we'll relay directions to your rider.",
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen pb-24">
      <Navbar variant="page" title="Support" showSearch={false} />
      <main className="mx-auto max-w-2xl px-4 pt-4">
        {/* Hero */}
        <section className="rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] p-5 text-white shadow-[var(--shadow-lift)]">
          <p className="text-[19px] font-extrabold tracking-tight">
            Hi 👋 How can we help?
          </p>
          <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-white/85">
            Reach a real person, or find quick answers below. We&apos;re here
            for every order.
          </p>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13.5px] font-bold text-[var(--color-primary-dark)] shadow-sm transition active:scale-[0.98]"
          >
            <ChatBubbleLeftRightIcon className="h-[18px] w-[18px]" />
            Start a chat
          </a>
        </section>

        {/* Contact channels */}
        <section className="mt-5">
          <h2 className="px-0.5 text-[12px] font-extrabold uppercase tracking-wider text-[var(--color-ink-soft)]">
            Contact us
          </h2>
          <ul className="mt-2.5 space-y-2">
            {channels.map((c) => {
              const { Icon } = c;
              return (
                <li key={c.title}>
                  <a
                    href={c.href}
                    {...(c.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-[var(--color-line)] transition hover:bg-black/[0.02]"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c.tint}`}
                    >
                      <Icon className="h-[22px] w-[22px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-extrabold text-[var(--color-ink)]">
                        {c.title}
                      </span>
                      <span className="block truncate text-[12.5px] text-[var(--color-ink-muted)]">
                        {c.subtitle}
                      </span>
                    </span>
                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-[var(--color-ink-soft)]" />
                  </a>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Quick topics */}
        <section className="mt-6">
          <h2 className="px-0.5 text-[12px] font-extrabold uppercase tracking-wider text-[var(--color-ink-soft)]">
            Browse help topics
          </h2>
          <ul className="mt-2.5 space-y-2">
            {topics.map((t) => {
              const { Icon } = t;
              return (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    className="flex items-center justify-between rounded-2xl bg-white p-3.5 ring-1 ring-[var(--color-line)] transition hover:bg-black/[0.02]"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-bg)] text-[var(--color-ink)]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-[14px] font-semibold text-[var(--color-ink)]">
                        {t.label}
                      </span>
                    </span>
                    <ChevronRightIcon className="h-4 w-4 text-[var(--color-ink-soft)]" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* FAQ */}
        <section className="mt-6">
          <h2 className="px-0.5 text-[12px] font-extrabold uppercase tracking-wider text-[var(--color-ink-soft)]">
            Frequently asked
          </h2>
          <ul className="mt-2.5 space-y-2">
            {faqs.map((f) => (
              <li key={f.q}>
                <details className="group rounded-2xl bg-white ring-1 ring-[var(--color-line)] [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                    <span className="text-[14px] font-bold text-[var(--color-ink)]">
                      {f.q}
                    </span>
                    <ChevronDownIcon className="h-4 w-4 shrink-0 text-[var(--color-ink-soft)] transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="px-4 pb-4 text-[13.5px] leading-relaxed text-[var(--color-ink-muted)]">
                    {f.a}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-8 text-center text-[11px] font-semibold text-[var(--color-ink-soft)]">
          ìlúEats · we&apos;ll bring it
        </p>
      </main>
      <BottomNav />
    </div>
  );
}
