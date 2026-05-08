import { cn } from "@/lib/utils";

type BadgeTone = "brand" | "neutral" | "success" | "warning" | "dark";

const toneStyles: Record<BadgeTone, string> = {
  brand:
    "bg-[var(--color-primary-soft)] text-[var(--color-primary)] ring-[var(--color-primary)]/15",
  neutral: "bg-black/[0.04] text-[var(--color-ink)] ring-black/[0.06]",
  success:
    "bg-[var(--color-success-soft)] text-[var(--color-success)] ring-[var(--color-success)]/20",
  warning: "bg-[var(--color-accent-soft)] text-[#b06b00] ring-[#f4a623]/30",
  dark: "bg-[var(--color-ink)] text-white ring-black/10",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  icon,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight ring-1 ring-inset",
        toneStyles[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
