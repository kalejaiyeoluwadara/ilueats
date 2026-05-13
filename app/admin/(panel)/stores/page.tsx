import { PlusIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

type StoreRow = {
  name: string;
  category: string;
  live: boolean;
  orders7d: number;
  rating: string;
};

const stores: StoreRow[] = [
  {
    name: "Mama Put Palace",
    category: "Local & African",
    live: true,
    orders7d: 312,
    rating: "4.8",
  },
  {
    name: "Crisp Bites",
    category: "Fast food",
    live: true,
    orders7d: 204,
    rating: "4.6",
  },
  {
    name: "SmoothCity",
    category: "Drinks",
    live: false,
    orders7d: 0,
    rating: "—",
  },
  {
    name: "Slice House",
    category: "Pizza",
    live: true,
    orders7d: 418,
    rating: "4.9",
  },
];

export default function AdminStoresPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)] sm:text-[26px]">
            Stores
          </h1>
          <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
            Partner overview — onboarding and edits will connect here later.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-5 text-[13px] font-bold text-white shadow-[0_6px_16px_-4px_rgba(232,84,26,0.45)]"
        >
          <PlusIcon className="h-5 w-5" />
          Add store
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stores.map((s) => (
          <article
            key={s.name}
            className="rounded-[1.25rem] bg-[var(--color-surface)] p-5 shadow-crisp ring-1 ring-[var(--color-line)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-[15px] font-extrabold text-[var(--color-ink)]">
                  {s.name}
                </h2>
                <p className="mt-0.5 text-[12px] font-medium text-[var(--color-ink-muted)]">
                  {s.category}
                </p>
              </div>
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-ink-muted)] hover:bg-black/[0.04]"
                aria-label="More options"
              >
                <EllipsisHorizontalIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset",
                  s.live
                    ? "bg-[var(--color-success-soft)] text-[var(--color-success)] ring-emerald-200/80"
                    : "bg-zinc-100 text-zinc-600 ring-zinc-200/80"
                )}
              >
                {s.live ? "Live" : "Paused"}
              </span>
              <p className="text-[12px] font-semibold text-[var(--color-ink-muted)]">
                ★ {s.rating}
              </p>
            </div>
            <div className="mt-4 rounded-2xl bg-[var(--color-bg)] px-3 py-3 ring-1 ring-[var(--color-line)]">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                Orders (7d)
              </p>
              <p className="mt-1 text-[20px] font-extrabold tabular-nums text-[var(--color-ink)]">
                {s.orders7d}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="h-10 rounded-full bg-white text-[12px] font-bold text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)]"
              >
                View menu
              </button>
              <button
                type="button"
                className="h-10 rounded-full bg-[var(--color-ink)] text-[12px] font-bold text-white"
              >
                Edit
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
