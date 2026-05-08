"use client";

import { useMemo, useState, use } from "react";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { CheckIcon, StarIcon } from "@heroicons/react/24/solid";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { QuantityStepper } from "@/components/cart/CartItem";
import { Modal } from "@/components/ui/Modal";
import {
  getProductBySlug,
  getStoreBySlug,
} from "@/data/mockData";
import { cn, formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import type { ProductOptionChoice } from "@/types";

interface PageProps {
  params: Promise<{ store: string; product: string }>;
}

export default function ProductPage({ params }: PageProps) {
  const { store: storeSlug, product: productSlug } = use(params);
  const store = getStoreBySlug(storeSlug);
  const product = getProductBySlug(storeSlug, productSlug);

  if (!store || !product) {
    notFound();
  }

  const router = useRouter();
  const { addItem, storeId, clearCart } = useCart();
  const { cart: cartToast, error: errorToast } = useToast();

  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<
    Record<string, ProductOptionChoice[]>
  >({});
  const [conflictOpen, setConflictOpen] = useState(false);

  const optionGroups = product.options ?? [];

  const missingRequired = useMemo(() => {
    return optionGroups
      .filter((g) => g.required)
      .filter(
        (g) =>
          !selections[g.id] || selections[g.id].length === 0
      )
      .map((g) => g.name);
  }, [optionGroups, selections]);

  const optionDelta = useMemo(() => {
    return Object.values(selections)
      .flat()
      .reduce((sum, c) => sum + (c.priceDelta ?? 0), 0);
  }, [selections]);

  const unitPrice = product.price + optionDelta;
  const totalPrice = unitPrice * quantity;

  const toggleChoice = (
    groupId: string,
    multi: boolean,
    choice: ProductOptionChoice
  ) => {
    setSelections((prev) => {
      const current = prev[groupId] ?? [];
      if (multi) {
        const exists = current.find((c) => c.id === choice.id);
        return {
          ...prev,
          [groupId]: exists
            ? current.filter((c) => c.id !== choice.id)
            : [...current, choice],
        };
      }
      return { ...prev, [groupId]: [choice] };
    });
  };

  const isChoiceActive = (groupId: string, choiceId: string) =>
    (selections[groupId] ?? []).some((c) => c.id === choiceId);

  const performAdd = () => {
    const flatOptions = Object.entries(selections).flatMap(([groupId, choices]) =>
      choices.map((choice) => ({ groupId, choice }))
    );
    const result = addItem({
      product,
      storeName: store.name,
      quantity,
      selectedOptions: flatOptions,
    });
    if (result.ok) {
      cartToast(
        `Added to bag`,
        `${quantity} × ${product.name} from ${store.name}`
      );
      router.push(`/${store.slug}`);
    } else if (result.reason === "different-store") {
      setConflictOpen(true);
    }
  };

  const handleAdd = () => {
    if (missingRequired.length > 0) {
      errorToast(
        "Pick a choice",
        `Please select ${missingRequired.join(", ")}`
      );
      return;
    }
    if (storeId && storeId !== product.storeId) {
      setConflictOpen(true);
      return;
    }
    performAdd();
  };

  const handleReplaceCart = () => {
    clearCart();
    setConflictOpen(false);
    // Re-run on next tick so the cart clears first
    window.setTimeout(performAdd, 50);
  };

  return (
    <div className="min-h-screen pb-32">
      <Navbar variant="page" title={product.name} showSearch={false} />

      <main className="mx-auto max-w-2xl">
        {/* Hero image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--color-line)] sm:rounded-b-3xl">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, 800px"
            className="object-cover"
            priority
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {product.isPopular && <Badge tone="brand">Popular</Badge>}
            {product.isNew && <Badge tone="warning">New</Badge>}
          </div>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="px-4 pt-4"
        >
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
            {store.name}
          </p>
          <h1 className="mt-1 text-[22px] font-extrabold leading-tight tracking-tight text-[var(--color-ink)] sm:text-[24px]">
            {product.name}
          </h1>
          {product.rating ? (
            <div className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--color-ink-muted)]">
              <StarIcon className="h-4 w-4 text-[var(--color-accent)]" />
              <span className="text-[var(--color-ink)]">
                {product.rating.toFixed(1)}
              </span>
              {product.reviews ? (
                <span>({product.reviews} reviews)</span>
              ) : null}
            </div>
          ) : null}
          <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-ink-muted)]">
            {product.description}
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[20px] font-extrabold tracking-tight text-[var(--color-primary)]">
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-[13px] font-medium text-[var(--color-ink-soft)] line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>
        </motion.div>

        {/* Options */}
        {optionGroups.length > 0 && (
          <div className="mt-5 space-y-4">
            {optionGroups.map((group) => (
              <section key={group.id} className="px-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[15px] font-extrabold tracking-tight text-[var(--color-ink)]">
                    {group.name}
                  </h2>
                  {group.required ? (
                    <Badge tone="brand">Required</Badge>
                  ) : (
                    <span className="text-[11px] font-semibold text-[var(--color-ink-soft)]">
                      Optional
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-2">
                  {group.choices.map((choice) => {
                    const active = isChoiceActive(group.id, choice.id);
                    return (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() =>
                          toggleChoice(group.id, !!group.multi, choice)
                        }
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-left ring-1 transition-colors",
                          active
                            ? "ring-2 ring-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                            : "ring-[var(--color-line)] hover:bg-black/[0.02]"
                        )}
                        aria-pressed={active}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-5 w-5 flex-none items-center justify-center transition-colors",
                              group.multi
                                ? "rounded-md ring-1"
                                : "rounded-full ring-1",
                              active
                                ? "bg-[var(--color-primary)] ring-[var(--color-primary)] text-white"
                                : "ring-[var(--color-line)] bg-white"
                            )}
                          >
                            {active && <CheckIcon className="h-3.5 w-3.5" />}
                          </span>
                          <span className="text-[14px] font-semibold text-[var(--color-ink)]">
                            {choice.name}
                          </span>
                        </div>
                        {choice.priceDelta && choice.priceDelta !== 0 ? (
                          <span className="text-[13px] font-bold text-[var(--color-ink)]">
                            {choice.priceDelta > 0 ? "+ " : "− "}
                            {formatPrice(Math.abs(choice.priceDelta))}
                          </span>
                        ) : (
                          <span className="text-[12px] font-semibold text-[var(--color-ink-soft)]">
                            Included
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Quantity */}
        <section className="px-4 pt-6">
          <h2 className="text-[15px] font-extrabold tracking-tight text-[var(--color-ink)]">
            Quantity
          </h2>
          <div className="mt-2 flex items-center justify-between rounded-2xl bg-white p-3 ring-1 ring-[var(--color-line)]">
            <span className="text-[13.5px] font-semibold text-[var(--color-ink-muted)]">
              How many?
            </span>
            <QuantityStepper
              quantity={quantity}
              onIncrement={() => setQuantity((q) => Math.min(q + 1, 99))}
              onDecrement={() => setQuantity((q) => Math.max(q - 1, 1))}
              size="md"
            />
          </div>
        </section>

        <div className="px-4 pt-8 pb-4 text-center">
          <p className="text-[12px] text-[var(--color-ink-soft)]">
            Going to {store.name} · est. delivery {store.deliveryTimeMins[0]}–
            {store.deliveryTimeMins[1]} mins
          </p>
        </div>
      </main>

      {/* Sticky add-to-cart footer */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-line)] bg-white px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="leading-tight">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">
              Total
            </p>
            <p className="text-[18px] font-extrabold tracking-tight text-[var(--color-ink)]">
              {formatPrice(totalPrice)}
            </p>
          </div>
          <Button
            size="lg"
            fullWidth
            onClick={handleAdd}
            className="flex-1"
          >
            Add {quantity > 1 ? `${quantity} ` : ""}to bag
          </Button>
        </div>
      </div>

      <Modal
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        title="Start a new bag?"
        description="Your bag has items from another store. You can only order from one store at a time."
        variant="sheet"
        footer={
          <div className="flex gap-2">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setConflictOpen(false)}
            >
              Keep current bag
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleReplaceCart}
            >
              Start new bag
            </Button>
          </div>
        }
      >
        <p className="text-[13.5px] text-[var(--color-ink-muted)]">
          Adding <span className="font-semibold text-[var(--color-ink)]">{product.name}</span> from{" "}
          <span className="font-semibold text-[var(--color-ink)]">{store.name}</span> will replace what&apos;s in your bag.
        </p>
      </Modal>
    </div>
  );
}
