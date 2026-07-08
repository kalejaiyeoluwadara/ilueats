"use client";

import { useMemo, useState, use } from "react";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { CheckIcon, StarIcon } from "@heroicons/react/24/solid";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { QuantityStepper } from "@/components/cart/CartItem";
import { Modal } from "@/components/ui/Modal";
import { useCatalog } from "@/context/CatalogContext";
import { getProductBySlug, getStoreBySlug } from "@/data/mockData";
import { cn, formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import type {
  Product,
  ProductOptionChoice,
  ProductOptionGroup,
  Store,
} from "@/types";

interface PageProps {
  params: Promise<{ store: string; product: string }>;
}

function ProductPageContent({
  store,
  product,
}: {
  store: Store;
  product: Product;
}) {
  const router = useRouter();
  const { addItem, storeId, clearCart } = useCart();
  const { cart: cartToast, error: errorToast } = useToast();

  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<
    Record<string, { choice: ProductOptionChoice; qty: number }[]>
  >({});
  const [conflictOpen, setConflictOpen] = useState(false);

  const optionGroups = product.options ?? [];

  const groupMin = (g: ProductOptionGroup) => g.min ?? (g.required ? 1 : 0);

  const missingRequired = useMemo(() => {
    return optionGroups
      .filter((g) => (selections[g.id] ?? []).length < groupMin(g))
      .map((g) => g.name);
  }, [optionGroups, selections]);

  const optionDelta = useMemo(() => {
    return Object.values(selections)
      .flat()
      .reduce((sum, s) => sum + (s.choice.priceDelta ?? 0) * s.qty, 0);
  }, [selections]);

  const unitPrice = product.price + optionDelta;
  const totalPrice = unitPrice * quantity;

  const toggleChoice = (
    group: ProductOptionGroup,
    choice: ProductOptionChoice
  ) => {
    setSelections((prev) => {
      const current = prev[group.id] ?? [];
      if (group.multi) {
        const exists = current.some((s) => s.choice.id === choice.id);
        if (exists) {
          return {
            ...prev,
            [group.id]: current.filter((s) => s.choice.id !== choice.id),
          };
        }
        // Respect the group's max distinct choices
        if (group.max && current.length >= group.max) return prev;
        return { ...prev, [group.id]: [...current, { choice, qty: 1 }] };
      }
      return { ...prev, [group.id]: [{ choice, qty: 1 }] };
    });
  };

  const setChoiceQty = (
    group: ProductOptionGroup,
    choice: ProductOptionChoice,
    qty: number
  ) => {
    setSelections((prev) => {
      const current = prev[group.id] ?? [];
      if (qty <= 0) {
        return {
          ...prev,
          [group.id]: current.filter((s) => s.choice.id !== choice.id),
        };
      }
      const capped = Math.min(qty, 10);
      return {
        ...prev,
        [group.id]: current.map((s) =>
          s.choice.id === choice.id ? { ...s, qty: capped } : s
        ),
      };
    });
  };

  const getSelection = (groupId: string, choiceId: string) =>
    (selections[groupId] ?? []).find((s) => s.choice.id === choiceId);

  const performAdd = () => {
    const flatOptions = optionGroups.flatMap((group) =>
      (selections[group.id] ?? []).map((s) => ({
        groupId: group.id,
        groupName: group.name,
        choice: s.choice,
        qty: s.qty,
      }))
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
    window.setTimeout(performAdd, 50);
  };

  return (
    <div className="min-h-screen pb-32 lg:pb-12">
      <Navbar variant="page" title={product.name} showSearch={false} />

      <main className="mx-auto max-w-2xl lg:grid lg:max-w-5xl lg:grid-cols-2 lg:items-start lg:gap-10 lg:px-6 lg:pt-6">
        {/* Hero image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--color-line)] sm:rounded-b-3xl lg:sticky lg:top-24 lg:rounded-3xl">
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
          <FavoriteButton
            productId={product.id}
            className="absolute right-3 top-3 z-10"
          />
        </div>

        {/* Details column */}
        <div className="min-w-0">
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
          <h1 className="font-display mt-1 text-[24px] font-extrabold leading-tight tracking-tight text-[var(--color-ink)] sm:text-[26px]">
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
            <span className="font-display text-[21px] font-extrabold tracking-tight text-[var(--color-primary)]">
              {formatPrice(unitPrice)}
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
                  {groupMin(group) > 0 ? (
                    <Badge tone="brand">Required</Badge>
                  ) : (
                    <span className="text-[11px] font-semibold text-[var(--color-ink-soft)]">
                      Optional
                    </span>
                  )}
                </div>
                {group.hint && (
                  <p className="mt-0.5 text-[12px] text-[var(--color-ink-muted)]">
                    {group.hint}
                  </p>
                )}
                <div className="mt-2 space-y-2">
                  {group.choices.map((choice) => {
                    const selection = getSelection(group.id, choice.id);
                    const active = !!selection;
                    const showStepper = active && !!group.allowQuantity;
                    return (
                      <div
                        key={choice.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleChoice(group, choice)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleChoice(group, choice);
                          }
                        }}
                        className={cn(
                          "flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-left ring-1 transition-colors",
                          active
                            ? "ring-2 ring-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                            : "ring-[var(--color-line)] hover:bg-black/[0.02]"
                        )}
                        aria-pressed={active}
                      >
                        <div className="flex min-w-0 items-center gap-3">
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
                          <span className="truncate text-[14px] font-semibold text-[var(--color-ink)]">
                            {choice.name}
                          </span>
                        </div>
                        <div className="flex flex-none items-center gap-3">
                          {showStepper && (
                            <span onClick={(e) => e.stopPropagation()}>
                              <QuantityStepper
                                quantity={selection.qty}
                                onIncrement={() =>
                                  setChoiceQty(group, choice, selection.qty + 1)
                                }
                                onDecrement={() =>
                                  setChoiceQty(group, choice, selection.qty - 1)
                                }
                              />
                            </span>
                          )}
                          {choice.priceDelta && choice.priceDelta !== 0 ? (
                            <span className="text-[13px] font-bold text-[var(--color-ink)]">
                              {choice.priceDelta > 0 ? "+ " : "− "}
                              {formatPrice(Math.abs(choice.priceDelta))}
                              {showStepper && selection.qty > 1
                                ? ` ×${selection.qty}`
                                : ""}
                            </span>
                          ) : (
                            <span className="text-[12px] font-semibold text-[var(--color-ink-soft)]">
                              Included
                            </span>
                          )}
                        </div>
                      </div>
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

        {/* Desktop inline total + CTA */}
        <div className="hidden lg:mt-6 lg:flex lg:items-center lg:gap-3 lg:rounded-2xl lg:bg-white lg:p-4 lg:ring-1 lg:ring-[var(--color-line)]">
          <div className="leading-tight">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">
              Total
            </p>
            <p className="font-display text-[18px] font-extrabold tracking-tight text-[var(--color-ink)]">
              {formatPrice(totalPrice)}
            </p>
          </div>
          <Button size="lg" fullWidth onClick={handleAdd} className="flex-1">
            Add {quantity > 1 ? `${quantity} ` : ""}to bag
          </Button>
        </div>

        <div className="px-4 pt-8 pb-4 text-center">
          <p className="text-[12px] text-[var(--color-ink-soft)]">
            Going to {store.name} · est. delivery {store.deliveryTimeMins[0]}–
            {store.deliveryTimeMins[1]} mins
          </p>
        </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-line)] bg-white px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3 lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="leading-tight">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">
              Total
            </p>
            <p className="font-display text-[18px] font-extrabold tracking-tight text-[var(--color-ink)]">
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

export default function ProductPage({ params }: PageProps) {
  const { store: storeSlug, product: productSlug } = use(params);
  const { stores, products } = useCatalog();

  const store = useMemo(
    () => getStoreBySlug(storeSlug),
    [stores, storeSlug]
  );

  const product = useMemo(
    () => getProductBySlug(storeSlug, productSlug),
    [products, storeSlug, productSlug]
  );

  if (!store || !product) {
    notFound();
  }

  return <ProductPageContent store={store} product={product} />;
}
