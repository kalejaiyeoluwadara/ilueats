"use client";

import { usePathname } from "next/navigation";
import { MoonIcon } from "@heroicons/react/24/solid";
import { usePlatformStatus } from "@/context/PlatformStatusContext";
import { cn } from "@/lib/utils";

/** Console routes keep full color/control even while the storefront is closed. */
const EXEMPT_PREFIXES = ["/admin", "/rider"];

function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12}${suffix}` : `${hour12}:${String(m).padStart(2, "0")}${suffix}`;
}

/**
 * Greys out the storefront and pins a "we're closed" banner whenever the
 * platform is closed (manual kill switch or outside opening hours).
 */
export function PlatformClosedFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isOpen, status } = usePlatformStatus();

  const exempt = EXEMPT_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const closed = !isOpen && !exempt;

  return (
    <>
      {closed ? (
        <div
          role="status"
          className="sticky top-0 z-[60] flex items-center justify-center gap-2.5 bg-zinc-900 px-4 py-2.5 text-center"
        >
          <MoonIcon className="h-4 w-4 shrink-0 text-amber-300" />
          <p className="text-[12.5px] font-semibold text-zinc-100">
            {status?.message ?? "We're currently closed."}
            {status?.reason === "schedule" && status.autoScheduleEnabled ? (
              <span className="ml-1.5 text-zinc-400">
                Open {formatTime12h(status.openTime)}–
                {formatTime12h(status.closeTime)}
              </span>
            ) : null}
          </p>
        </div>
      ) : null}
      <div className={cn(closed && "platform-closed-dim")}>{children}</div>
    </>
  );
}
