"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** Renders as a bottom sheet on mobile, centered dialog on desktop. */
  variant?: "sheet" | "dialog";
  /** Show the X close button in the top right */
  showClose?: boolean;
  /** Optional action area pinned to the bottom */
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  variant = "sheet",
  showClose = true,
  footer,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-root"
          className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={
              variant === "sheet"
                ? { y: "100%", opacity: 1 }
                : { y: 16, opacity: 0, scale: 0.98 }
            }
            animate={
              variant === "sheet"
                ? { y: 0, opacity: 1 }
                : { y: 0, opacity: 1, scale: 1 }
            }
            exit={
              variant === "sheet"
                ? { y: "100%", opacity: 1 }
                : { y: 8, opacity: 0, scale: 0.98 }
            }
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            className={cn(
              "relative w-full bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.18)] sm:max-w-lg sm:shadow-[0_24px_60px_rgba(0,0,0,0.18)]",
              variant === "sheet"
                ? "rounded-t-3xl sm:rounded-3xl"
                : "rounded-3xl",
              className
            )}
          >
            {variant === "sheet" && (
              <div className="flex justify-center pt-3 sm:hidden">
                <span className="h-1.5 w-10 rounded-full bg-black/10" />
              </div>
            )}

            {(title || showClose) && (
              <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4 sm:pt-5">
                <div className="min-w-0 flex-1">
                  {title && (
                    <h2 className="text-[17px] font-bold tracking-tight text-[var(--color-ink)]">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-0.5 text-[13px] text-[var(--color-ink-muted)]">
                      {description}
                    </p>
                  )}
                </div>
                {showClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="-mr-1 -mt-1 flex h-9 w-9 flex-none items-center justify-center rounded-full text-[var(--color-ink-soft)] hover:bg-black/5"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            <div className="max-h-[70vh] overflow-y-auto px-5 pb-5 pt-2">
              {children}
            </div>

            {footer && (
              <div className="border-t border-[var(--color-line)] bg-white px-5 py-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] sm:rounded-b-3xl">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
