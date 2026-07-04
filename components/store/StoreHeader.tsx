"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ClockIcon, StarIcon } from "@heroicons/react/24/solid";
import {
  TruckIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import type { Store } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { formatDeliveryTime, formatPrice } from "@/lib/utils";

export function StoreHeader({ store }: { store: Store }) {
  return (
    <section>
      <div className="relative h-44 w-full overflow-hidden sm:h-56 lg:h-72 lg:rounded-3xl">
        <Image
          src={store.cover}
          alt={store.name}
          fill
          sizes="(max-width: 640px) 100vw, 800px"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-transparent to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative -mt-10 px-4"
      >
        <div className="rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.03]">
          <div className="flex items-start gap-3">
            <div className="relative h-14 w-14 flex-none overflow-hidden rounded-xl ring-1 ring-[var(--color-line)]">
              <Image
                src={store.image}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="truncate text-[18px] font-extrabold tracking-tight text-[var(--color-ink)]">
                  {store.name}
                </h1>
                {store.isOpen ? (
                  <Badge tone="success">Open now</Badge>
                ) : (
                  <Badge tone="dark">Closed</Badge>
                )}
              </div>
              <p className="mt-0.5 line-clamp-2 text-[13px] text-[var(--color-ink-muted)]">
                {store.tagline}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--color-line)] pt-3">
            <Stat
              icon={<StarIcon className="h-4 w-4 text-[var(--color-accent)]" />}
              label="Rating"
              value={store.rating.toFixed(1)}
              hint={`${store.reviews}+ reviews`}
            />
            <Stat
              icon={<ClockIcon className="h-4 w-4 text-[var(--color-ink-soft)]" />}
              label="Delivery"
              value={formatDeliveryTime(store.deliveryTimeMins)}
            />
            <Stat
              icon={<TruckIcon className="h-4 w-4 text-[var(--color-ink-soft)]" />}
              label="Fee"
              value={formatPrice(store.deliveryFee)}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-[var(--color-ink-muted)]">
            <span className="inline-flex items-center gap-1">
              <MapPinIcon className="h-3.5 w-3.5" />
              {store.location}
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheckIcon className="h-3.5 w-3.5" />
              Min order {formatPrice(store.minOrder)}
            </span>
          </div>

          {store.tags && store.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {store.tags.map((t) => (
                <Badge key={t} tone="brand">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center gap-1 text-[13px] font-bold text-[var(--color-ink)]">
        {icon}
        <span>{value}</span>
      </div>
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">
        {label}
      </p>
      {hint && (
        <p className="text-[10px] text-[var(--color-ink-soft)]">{hint}</p>
      )}
    </div>
  );
}
