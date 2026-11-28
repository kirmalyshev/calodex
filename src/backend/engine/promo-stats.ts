import type { PromoCodeStats, PromoStatsResponse } from "@eait/shared";
import type { EngineDeps } from "./deps.ts";
import { adminRangeOf } from "./admin.ts";
import { entitlementFor } from "./entitlement.ts";

/** Offer-code conversion over the trailing `days` × 24 hours, as aggregates only. */
export async function promoStats(deps: EngineDeps, days: number, sandbox = false): Promise<PromoStatsResponse> {
  const range = adminRangeOf(days, 30, 400);
  const rows = await deps.store.promoStats(range.from!, sandbox ? "SANDBOX" : "PRODUCTION");

  // ponytail: one entitlement read per redeemed account; a set-based read when a code has thousands.
  const activeByUser = new Map<string, boolean>();
  for (const userId of new Set(rows.map((r) => r.userId))) {
    activeByUser.set(userId, (await entitlementFor(deps, userId)).active);
  }

  const byCode = new Map<string, PromoCodeStats & { firstMs: number; lastMs: number }>();
  for (const row of rows) {
    const firstMs = Date.parse(row.firstSeenAt), lastMs = Date.parse(row.lastSeenAt);
    const out = byCode.get(row.offerCode) ?? {
      offerCode: row.offerCode, redeemed: 0, active: 0, paid: 0,
      firstSeenAt: row.firstSeenAt, lastSeenAt: row.lastSeenAt, firstMs, lastMs,
    };
    out.redeemed += 1;
    if (activeByUser.get(row.userId)) out.active += 1;
    if (row.paid) out.paid += 1;
    if (firstMs < out.firstMs) { out.firstMs = firstMs; out.firstSeenAt = row.firstSeenAt; }
    if (lastMs > out.lastMs) { out.lastMs = lastMs; out.lastSeenAt = row.lastSeenAt; }
    byCode.set(row.offerCode, out);
  }
  return {
    days: range.days!,
    codes: [...byCode.values()]
      .sort((a, b) => a.offerCode.localeCompare(b.offerCode))
      .map(({ firstMs: _first, lastMs: _last, ...row }) => row),
  };
}
