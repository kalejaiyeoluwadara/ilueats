"use client";

import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ShoppingBagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { ToastMessage, ToastVariant } from "@/types";
import { shortId } from "@/lib/utils";

interface ToastContextValue {
  toasts: ToastMessage[];
  show: (toast: Omit<ToastMessage, "id">) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  cart: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

/** Auto-dismiss after a few seconds (cart + default). */
const DEFAULT_DURATION = 4000;

function resolveToastDuration(ms: number | undefined): number {
  if (typeof ms === "number" && Number.isFinite(ms) && ms > 0) return ms;
  return DEFAULT_DURATION;
}

const variantStyles: Record<
  ToastVariant,
  { icon: React.ElementType; tint: string; ring: string }
> = {
  success: {
    icon: CheckCircleIcon,
    tint: "text-[var(--color-success)] bg-[var(--color-success-soft)]",
    ring: "ring-[var(--color-success)]/20",
  },
  error: {
    icon: ExclamationCircleIcon,
    tint: "text-red-600 bg-red-50",
    ring: "ring-red-200",
  },
  info: {
    icon: InformationCircleIcon,
    tint: "text-blue-600 bg-blue-50",
    ring: "ring-blue-200",
  },
  cart: {
    icon: ShoppingBagIcon,
    tint: "text-[var(--color-primary)] bg-[var(--color-primary-soft)]",
    ring: "ring-[var(--color-primary)]/20",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const dismissTimers = useRef<Map<string, number>>(new Map());

  useEffect(
    () => () => {
      for (const t of dismissTimers.current.values()) window.clearTimeout(t);
      dismissTimers.current.clear();
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    const pending = dismissTimers.current.get(id);
    if (pending !== undefined) {
      window.clearTimeout(pending);
      dismissTimers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback<ToastContextValue["show"]>(
    (toast) => {
      const id = shortId("t_");
      const duration = resolveToastDuration(toast.duration);
      setToasts((prev) => [
        ...prev,
        { id, ...toast, duration },
      ]);
      const timerId = window.setTimeout(() => dismiss(id), duration);
      dismissTimers.current.set(id, timerId);
      return id;
    },
    [dismiss]
  );

  const success: ToastContextValue["success"] = useCallback(
    (title, description) => show({ variant: "success", title, description }),
    [show]
  );
  const error: ToastContextValue["error"] = useCallback(
    (title, description) => show({ variant: "error", title, description }),
    [show]
  );
  const info: ToastContextValue["info"] = useCallback(
    (title, description) => show({ variant: "info", title, description }),
    [show]
  );
  const cart: ToastContextValue["cart"] = useCallback(
    (title, description) => show({ variant: "cart", title, description }),
    [show]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, show, success, error, info, cart, dismiss }}
    >
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3 sm:top-5">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const variant = variantStyles[t.variant];
          const Icon = variant.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ y: -24, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -16, opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="pointer-events-auto w-full max-w-sm rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.10)] ring-1 ring-black/5"
            >
              <div className="flex items-start gap-3 p-3 pr-2">
                <div
                  className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ring-1 ${variant.tint} ${variant.ring}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[14px] font-semibold leading-tight text-[var(--color-ink)]">
                    {t.title}
                  </p>
                  {t.description ? (
                    <p className="mt-0.5 text-[13px] leading-snug text-[var(--color-ink-muted)]">
                      {t.description}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => onDismiss(t.id)}
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-[var(--color-ink-soft)] hover:bg-black/5"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
