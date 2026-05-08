"use client";

import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";

interface FavoriteButtonProps {
  productId: string;
  size?: "sm" | "md";
  className?: string;
}

export function FavoriteButton({
  productId,
  size = "md",
  className,
}: FavoriteButtonProps) {
  const { ready, isFavorite, toggleFavorite } = useFavorites();
  const on = ready && isFavorite(productId);
  const dims = size === "sm" ? "h-8 w-8 min-h-8 min-w-8" : "h-10 w-10 min-h-10 min-w-10";
  const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      disabled={!ready}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(productId);
      }}
      aria-label={on ? "Remove from favourites" : "Add to favourites"}
      aria-pressed={on}
      className={cn(
        "flex items-center justify-center rounded-full bg-white/95 text-[var(--color-primary)] shadow-sm ring-1 ring-black/8 backdrop-blur-sm transition-opacity disabled:opacity-50",
        dims,
        className
      )}
    >
      {on ? (
        <HeartSolid className={cn(iconClass, "text-[var(--color-primary)]")} />
      ) : (
        <HeartIcon className={cn(iconClass, "text-[var(--color-ink-soft)]")} />
      )}
    </motion.button>
  );
}
