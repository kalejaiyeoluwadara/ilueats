"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlusIcon } from "@heroicons/react/24/solid";
import type { Product, Store } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";

interface ProductCardProps {
  product: Product;
  store: Store;
  index?: number;
}

export function ProductCard({ product, store, index = 0 }: ProductCardProps) {
  const { addItem, storeId, count } = useCart();
  const { cart: cartToast, error: errorToast } = useToast();

  const hasOptions = (product.options?.length ?? 0) > 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasOptions) return; // routed via Link

    if (storeId && storeId !== product.storeId) {
      errorToast(
        "Different store in cart",
        "Clear your cart first to order from a new store."
      );
      return;
    }

    const result = addItem({
      product,
      storeName: store.name,
      quantity: 1,
    });
    if (result.ok) {
      cartToast(`Added ${product.name}`, `${count + 1} item(s) in your bag`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <Link
        href={`/${product.storeSlug}/${product.slug}`}
        className="group flex items-stretch gap-3 rounded-2xl bg-white p-3 ring-1 ring-[var(--color-line)] transition-shadow hover:shadow-[0_4px_18px_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40"
      >
        <div className="min-w-0 flex-1 py-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="line-clamp-1 text-[14.5px] font-bold tracking-tight text-[var(--color-ink)]">
              {product.name}
            </h3>
            {product.isPopular && <Badge tone="brand">Popular</Badge>}
            {product.isNew && <Badge tone="warning">New</Badge>}
          </div>
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-[var(--color-ink-muted)]">
            {product.description}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-[14.5px] font-bold text-[var(--color-primary)]">
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-[12px] font-medium text-[var(--color-ink-soft)] line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>
        </div>

        <div className="relative h-24 w-24 flex-none">
          <FavoriteButton
            productId={product.id}
            size="sm"
            className="absolute -left-1 -top-1 z-10"
          />
          <div className="relative h-full w-full overflow-hidden rounded-xl bg-[var(--color-line)]">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="96px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />
          </div>
          <motion.button
            type="button"
            aria-label={
              hasOptions ? "Customize and add" : `Add ${product.name} to cart`
            }
            onClick={handleQuickAdd}
            whileTap={{ scale: 0.9 }}
            className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-[0_6px_16px_-4px_rgba(232,84,26,0.55)] ring-2 ring-white"
          >
            <PlusIcon className="h-5 w-5" />
          </motion.button>
        </div>
      </Link>
    </motion.div>
  );
}
