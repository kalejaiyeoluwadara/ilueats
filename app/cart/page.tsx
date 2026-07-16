"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightIcon,
  ShoppingBagIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { useCatalog } from "@/context/CatalogContext";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const {
    items,
    count,
    subtotal,
    storeSlug,
    storeName,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const { stores } = useCatalog();

  const store = useMemo(
    () => (storeSlug ? stores.find((s) => s.slug === storeSlug) : undefined),
    [storeSlug, stores]
  );
  // Delivery depends on where it's going, which we only know at checkout — so
  // the bag shows the subtotal and says so, rather than quoting a fee here that
  // checkout would then contradict.
  const minOrder = store?.minOrder ?? 0;
  const belowMin = subtotal < minOrder;

  return (
    <div className="min-h-screen pb-40 lg:pb-16">
      <Navbar variant="page" title="Your bag" showSearch={false} />

      <main className="mx-auto max-w-2xl lg:max-w-5xl lg:px-6 lg:pt-4">
        {count === 0 ? (
          <EmptyCart />
        ) : (
          <div className="lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-8">
            <div className="min-w-0">
            <section className="px-4 pt-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                    {count} item{count === 1 ? "" : "s"}
                  </p>
                  <h2 className="font-display truncate text-[19px] font-bold tracking-tight">
                    {storeName ?? store?.name ?? "Your bag"}
                  </h2>
                  {store && (
                    <p className="text-[12.5px] text-[var(--color-ink-muted)]">
                      Est. delivery {store.deliveryTimeMins[0]}–
                      {store.deliveryTimeMins[1]} mins
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearCart}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold text-red-600 hover:bg-red-50"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  Clear
                </button>
              </div>
            </section>

            <section className="px-4 pt-4">
              <ul className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.li key={item.id} layout>
                      <CartItem
                        item={item}
                        onIncrement={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        onDecrement={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        onRemove={() => removeItem(item.id)}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
            </div>

            <div className="lg:sticky lg:top-24">
              <section className="px-4 pt-5 lg:px-0 lg:pt-3">
                <CartSummary subtotal={subtotal} total={subtotal} />
              </section>

              {storeSlug && (
                <div className="px-4 pt-3 lg:px-0">
                  <Link
                    href={`/${storeSlug}`}
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--color-primary)] hover:underline"
                  >
                    + Add more from {store?.name ?? "this store"}
                  </Link>
                </div>
              )}

              {/* Desktop inline checkout */}
              <div className="hidden lg:block lg:pt-4">
                {belowMin && (
                  <p className="mb-2 rounded-xl bg-[var(--color-accent-soft)] px-3 py-2 text-[12px] font-semibold text-[#8a4f00]">
                    Add {formatPrice(minOrder - subtotal)} more to meet minimum
                    order.
                  </p>
                )}
                <Link
                  href={belowMin ? "/cart" : "/checkout"}
                  className="block"
                >
                  <Button
                    size="lg"
                    fullWidth
                    disabled={belowMin}
                    rightIcon={<ArrowRightIcon className="h-4 w-4" />}
                  >
                    Checkout · {formatPrice(subtotal + deliveryFee)}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-[68px] z-50 border-t border-[var(--color-line)] bg-white px-4 pb-3 pt-3 sm:bottom-[72px] lg:hidden">
          <div className="mx-auto max-w-2xl">
            {belowMin && (
              <p className="mb-2 rounded-xl bg-[var(--color-accent-soft)] px-3 py-2 text-[12px] font-semibold text-[#8a4f00]">
                Add {formatPrice(minOrder - subtotal)} more to meet minimum order.
              </p>
            )}
            <Link href={belowMin ? "/cart" : "/checkout"} className="block">
              <Button
                size="lg"
                fullWidth
                disabled={belowMin}
                rightIcon={<ArrowRightIcon className="h-4 w-4" />}
              >
                Checkout · {formatPrice(subtotal + deliveryFee)}
              </Button>
            </Link>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center px-6 pt-16 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 22 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary-soft)]"
      >
        <ShoppingBagIcon className="h-9 w-9 text-[var(--color-primary)]" />
      </motion.div>
      <h2 className="font-display mt-5 text-[20px] font-extrabold tracking-tight">
        Your bag is empty
      </h2>
      <p className="mt-1.5 max-w-xs text-[13.5px] text-[var(--color-ink-muted)]">
        Hungry? Browse our local stores and add something delicious to get
        started.
      </p>
      <Link href="/" className="mt-6">
        <Button size="lg">Browse stores</Button>
      </Link>
    </div>
  );
}
