"use client";

import { useReducedMotion } from "framer-motion";
import {
  ClipboardDocumentCheckIcon,
  UserIcon,
  TruckIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";
import type { OrderStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StepDef {
  key: "placed" | "assigned" | "out" | "delivered";
  label: string;
  caption: string;
  icon: typeof TruckIcon;
  timestamp: string | null;
}

export function stepIndexForStatus(status: OrderStatus): number {
  switch (status) {
    case "new":
    case "preparing":
      return 0;
    case "assigned":
      return 1;
    case "out":
      return 2;
    case "delivered":
      return 3;
    default:
      return 0;
  }
}

/** "2:41 PM" for today, "Yesterday, 2:41 PM" / "Mon 12 Jan, 2:41 PM" otherwise. */
function formatStageTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const time = date.toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  });
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return time;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString())
    return `Yesterday, ${time}`;
  const day = date.toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${day}, ${time}`;
}

export function OrderStatusStepper({
  status,
  placedAt,
  assignedAt,
  outForDeliveryAt,
  deliveredAt,
  riderName,
  storeName,
}: {
  status: OrderStatus;
  placedAt: string;
  assignedAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  riderName?: string | null;
  storeName?: string;
}) {
  const reduceMotion = useReducedMotion();
  const activeIndex = stepIndexForStatus(status);
  const delivered = status === "delivered";

  const steps: StepDef[] = [
    {
      key: "placed",
      label: "Order placed",
      caption:
        status === "preparing"
          ? `${storeName ?? "The kitchen"} is preparing it`
          : "Sent to the kitchen",
      icon: ClipboardDocumentCheckIcon,
      timestamp: placedAt,
    },
    {
      key: "assigned",
      label: "Rider assigned",
      caption: riderName ? `${riderName} is picking it up` : "Waiting for a rider",
      icon: UserIcon,
      timestamp: assignedAt,
    },
    {
      key: "out",
      label: "Out for delivery",
      caption: riderName ? `${riderName} is heading your way` : "Heading your way",
      icon: TruckIcon,
      timestamp: outForDeliveryAt,
    },
    {
      key: "delivered",
      label: "Delivered",
      caption: "Enjoy your meal",
      icon: HomeIcon,
      timestamp: deliveredAt,
    },
  ];

  return (
    <ol className="relative">
      {steps.map((step, idx) => {
        const isDone = idx < activeIndex || delivered;
        const isActive = idx === activeIndex && !delivered;
        const isUpcoming = !isDone && !isActive;
        const isLast = idx === steps.length - 1;
        const Icon = step.icon;

        return (
          <li key={step.key} className="relative flex gap-4">
            {/* Spine segment below the node */}
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[21px] top-11 h-[calc(100%-2.75rem)] w-[3px] rounded-full",
                  idx < activeIndex || delivered
                    ? "bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-primary)]/70"
                    : "bg-[var(--color-line)]"
                )}
              />
            )}

            {/* Node */}
            <div className="relative z-[1] shrink-0">
              {isActive && !reduceMotion && (
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-2xl bg-[var(--color-accent)]/40 animate-ping-slow"
                />
              )}
              <div
                className={cn(
                  "relative flex h-11 w-11 items-center justify-center rounded-2xl transition-colors",
                  isDone &&
                    "bg-[var(--color-primary)] text-white shadow-[0_4px_12px_-4px_rgba(230,78,14,0.5)]",
                  isActive &&
                    "bg-white text-[var(--color-primary)] ring-2 ring-[var(--color-primary)] shadow-[0_0_0_5px_var(--color-primary-soft)]",
                  isUpcoming &&
                    "bg-[var(--color-bg)] text-[var(--color-ink-soft)] ring-1 ring-inset ring-[var(--color-line)]"
                )}
              >
                {isDone ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.7} />
                )}
              </div>
            </div>

            {/* Copy */}
            <div className={cn("min-w-0 flex-1 pt-1", !isLast && "pb-8")}>
              <div className="flex items-baseline justify-between gap-3">
                <p
                  className={cn(
                    "font-display tracking-tight",
                    isActive
                      ? "text-[16px] font-extrabold text-[var(--color-ink)]"
                      : "text-[14.5px] font-bold",
                    isDone && "text-[var(--color-ink)]",
                    isUpcoming && "text-[var(--color-ink-soft)]"
                  )}
                >
                  {step.label}
                </p>
                {step.timestamp ? (
                  <p className="shrink-0 text-[11.5px] font-semibold tabular-nums text-[var(--color-ink-soft)]">
                    {formatStageTime(step.timestamp)}
                  </p>
                ) : null}
              </div>
              {!isUpcoming && (
                <p
                  className={cn(
                    "mt-0.5 text-[12.5px]",
                    isActive
                      ? "font-semibold text-[var(--color-primary)]"
                      : "text-[var(--color-ink-muted)]"
                  )}
                >
                  {step.caption}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
