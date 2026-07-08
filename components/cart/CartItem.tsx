"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  MinusIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { CartItem as CartItemType } from "@/types";
import { formatCartOption, formatPrice } from "@/lib/utils";

interface CartItemProps {
  item: CartItemType;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

export function CartItem({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 360, damping: 30 }}
      className="flex items-stretch gap-3 rounded-2xl bg-white p-3 ring-1 ring-[var(--color-line)]"
    >
      <div className="relative h-20 w-20 flex-none overflow-hidden rounded-xl bg-[var(--color-line)]">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h3 className="line-clamp-1 text-[14px] font-bold tracking-tight text-[var(--color-ink)]">
            {item.name}
          </h3>
          {item.selectedOptions && item.selectedOptions.length > 0 && (
            <p className="mt-0.5 line-clamp-2 text-[11.5px] text-[var(--color-ink-muted)]">
              {item.selectedOptions.map(formatCartOption).join(" · ")}
            </p>
          )}
          <p className="mt-1 text-[13.5px] font-extrabold text-[var(--color-primary)]">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <QuantityStepper
            quantity={item.quantity}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
          />
          <button
            type="button"
            aria-label="Remove from cart"
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-soft)] hover:bg-red-50 hover:text-red-600"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
  size = "sm",
}: {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-8" : "h-10";
  const btn = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const num = size === "sm" ? "w-6 text-[13px]" : "w-7 text-[14px]";

  return (
    <div
      className={`inline-flex items-center rounded-full bg-[var(--color-bg)] ring-1 ring-inset ring-[var(--color-line)] ${dim}`}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={onDecrement}
        className={`flex ${btn} items-center justify-center rounded-full text-[var(--color-ink)] hover:bg-black/5 active:bg-black/10`}
      >
        <MinusIcon className="h-3.5 w-3.5" />
      </button>
      <span className={`text-center font-bold tracking-tight ${num}`}>
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={onIncrement}
        className={`flex ${btn} items-center justify-center rounded-full text-[var(--color-ink)] hover:bg-black/5 active:bg-black/10`}
      >
        <PlusIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
