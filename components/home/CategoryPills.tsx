"use client";

import { motion } from "framer-motion";
import { categories } from "@/data/mockData";
import type { CategoryId } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryPillsProps {
  active: CategoryId;
  onChange: (id: CategoryId) => void;
}

export function CategoryPills({ active, onChange }: CategoryPillsProps) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-1">
      {categories.map((c, idx) => {
        const isActive = c.id === active;
        return (
          <motion.button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.025, duration: 0.25 }}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "relative flex h-10 flex-none items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold tracking-tight transition-colors",
              isActive
                ? "bg-[var(--color-ink)] text-white"
                : "bg-white text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)] hover:bg-black/[0.03]"
            )}
            aria-pressed={isActive}
          >
            <span aria-hidden className="text-[15px]">
              {c.emoji}
            </span>
            <span>{c.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
