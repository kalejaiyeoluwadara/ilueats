"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBagIcon } from "@heroicons/react/24/solid";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

/**
 * Floating cart bar shown at the bottom of store/product pages while
 * the cart has items. Hidden when the cart is empty.
 */
export function CartFooter() {
  const { count, subtotal, storeSlug } = useCart();

  return (
    <AnimatePresence>
      {count > 0 && storeSlug && (
        <motion.div
          key="cart-footer"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 30 }}
          className="fixed inset-x-0 bottom-[68px] z-30 px-4 sm:bottom-[72px] lg:bottom-6"
        >
          <div className="mx-auto max-w-2xl lg:max-w-3xl">
            <Link
              href="/cart"
              className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-ink)] px-4 py-3 text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/30"
            >
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)]">
                  <ShoppingBagIcon className="h-5 w-5 text-white" />
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-extrabold text-[var(--color-primary)] ring-2 ring-[var(--color-ink)]">
                    {count}
                  </span>
                </span>
                <div className="leading-tight">
                  <p className="text-[12px] font-semibold text-white/65">
                    {count} item{count === 1 ? "" : "s"} in bag
                  </p>
                  <p className="font-display text-[14.5px] font-extrabold tracking-tight">
                    {formatPrice(subtotal)}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-white px-3.5 py-2 text-[13px] font-bold text-[var(--color-ink)]">
                View cart
              </span>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
