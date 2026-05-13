import type { RiderJob, RiderOrderLineItem } from "@/types";

/** Total units (qty sum) across lines — for rider “5 items” copy. */
export function riderBagPieceCount(items: readonly RiderOrderLineItem[]): number {
  return items.reduce((s, line) => s + line.qty, 0);
}

export function sanitizeRiderOrderLineItems(
  raw: unknown,
  fallback: RiderOrderLineItem[]
): RiderOrderLineItem[] {
  if (!Array.isArray(raw) || raw.length === 0) return fallback;

  const out: RiderOrderLineItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name.trim() : "";
    const qtyRaw = typeof r.qty === "number" ? r.qty : Number(r.qty);
    const qty =
      Number.isFinite(qtyRaw) && qtyRaw >= 1
        ? Math.min(999, Math.floor(qtyRaw))
        : 0;
    if (!name || qty < 1) continue;

    const mods = Array.isArray(r.modifiers)
      ? r.modifiers.filter((m): m is string => typeof m === "string" && m.trim().length > 0)
      : undefined;

    out.push({
      name,
      qty,
      modifiers: mods?.length ? mods : undefined,
    });
  }

  return out.length > 0 ? out : fallback;
}

export function riderLegacyFallbackBag(
  store: string,
  orderId: string
): RiderOrderLineItem[] {
  return [
    {
      name: "Order contents not on file",
      qty: 1,
      modifiers: [
        `${store}`,
        `${orderId} — ask staff to verify label before leaving`,
      ],
    },
  ];
}

/** Ensure jobs from older localStorage payloads always have lineItems. */
export function normalizeStoredRiderJob(j: RiderJob): RiderJob {
  const sanitized = sanitizeRiderOrderLineItems(j.lineItems, []);
  const lineItems =
    sanitized.length > 0 ? sanitized : riderLegacyFallbackBag(j.store, j.id);
  return { ...j, lineItems };
}
