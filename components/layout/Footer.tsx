import Link from "next/link";

const links = [
  { href: "/support", label: "Support" },
  { href: "/privacy", label: "Privacy" },
  { href: "/orders", label: "My orders" },
  { href: "/rider", label: "Deliver with us" },
];

export function Footer() {
  return (
    <footer className="mt-14 border-t border-[var(--color-line)] px-4 pt-10 pb-8">
      <p className="font-display text-[44px] font-extrabold leading-none tracking-tight text-[var(--color-ink)] lg:text-[72px]">
        <span className="sr-only">ìlúEats.</span>
        <span aria-hidden>
          <span className="relative inline-block">
            ı
            <span
              className="absolute left-[-0.03em] top-[0.10em] block h-[0.095em] w-[0.30em] origin-left rotate-[40deg] rounded-full bg-gradient-to-br from-[#ffd35c] to-[#f2a413]"
            />
          </span>
          lú<span className="text-[var(--color-primary)]">Eats.</span>
        </span>
      </p>
      <p className="mt-3 text-[13px] font-semibold text-[var(--color-ink-muted)]">
        Your town. Your taste. Delivered.
      </p>

      <nav aria-label="Footer" className="mt-6">
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-[12.5px] font-semibold text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-primary)]"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-7 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-[var(--color-line)] pt-4">
        <p className="text-[11px] font-medium text-[var(--color-ink-soft)]">
          Made for Ilisan-Remo 
        </p>
        <p className="text-[11px] font-medium text-[var(--color-ink-soft)]">
          © {new Date().getFullYear()} ìlúEats
        </p>
      </div>
    </footer>
  );
}
