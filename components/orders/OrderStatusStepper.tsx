import { CheckIcon } from "@heroicons/react/24/solid";
import type { OrderStatus } from "@/types";
import { formatPlacedAgo } from "@/lib/ordersStore";
import { cn } from "@/lib/utils";

interface StepDef {
  key: "placed" | "assigned" | "out" | "delivered";
  label: string;
  timestamp: string | null;
}

function stepIndexForStatus(status: OrderStatus): number {
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

export function OrderStatusStepper({
  status,
  placedAt,
  assignedAt,
  outForDeliveryAt,
  deliveredAt,
}: {
  status: OrderStatus;
  placedAt: string;
  assignedAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
}) {
  const activeIndex = stepIndexForStatus(status);

  const steps: StepDef[] = [
    { key: "placed", label: "Placed", timestamp: placedAt },
    { key: "assigned", label: "Assigned", timestamp: assignedAt },
    { key: "out", label: "Out for delivery", timestamp: outForDeliveryAt },
    { key: "delivered", label: "Delivered", timestamp: deliveredAt },
  ];

  return (
    <ol className="space-y-0">
      {steps.map((step, idx) => {
        const isDone = idx < activeIndex || (idx === activeIndex && step.key === "delivered");
        const isActive = idx === activeIndex && step.key !== "delivered";
        const isLast = idx === steps.length - 1;

        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-2 transition-colors",
                  isDone
                    ? "bg-[var(--color-success)] ring-[var(--color-success)] text-white"
                    : isActive
                      ? "bg-[var(--color-primary)] ring-[var(--color-primary)] text-white"
                      : "bg-white ring-[var(--color-line)] text-[var(--color-ink-soft)]"
                )}
              >
                {isDone ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-current" />
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-[28px]",
                    idx < activeIndex ? "bg-[var(--color-success)]" : "bg-[var(--color-line)]"
                  )}
                />
              )}
            </div>
            <div className="pb-7">
              <p
                className={cn(
                  "text-[14px] font-bold tracking-tight",
                  isDone || isActive ? "text-[var(--color-ink)]" : "text-[var(--color-ink-soft)]"
                )}
              >
                {step.label}
              </p>
              <p className="text-[12px] text-[var(--color-ink-muted)]">
                {step.timestamp ? formatPlacedAgo(step.timestamp) : isActive ? "In progress" : "—"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
