"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]/50 focus-visible:ring-offset-[var(--color-bg)] select-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white shadow-[0_6px_16px_-4px_rgba(232,84,26,0.45)] hover:bg-[#d04714] active:bg-[#bd3f10]",
  secondary:
    "bg-[var(--color-ink)] text-white hover:bg-black active:bg-black",
  ghost:
    "bg-transparent text-[var(--color-ink)] hover:bg-black/5 active:bg-black/10",
  outline:
    "bg-white text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)] hover:bg-black/[0.03] active:bg-black/[0.06]",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-[14px]",
  lg: "h-13 px-6 text-[15px] min-h-[52px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    fullWidth,
    loading,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props
  },
  ref
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      whileHover={disabled ? undefined : { y: -1 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!loading && rightIcon}
    </motion.button>
  );
});
