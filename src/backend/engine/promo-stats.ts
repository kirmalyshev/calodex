import type { PromoStatsResponse } from "@eait/shared";
import type { EngineDeps } from "./deps.ts";

const DAY_MS = 86_400_000;

/** Offer-code conversion over the trailing `days` × 24 hours, as aggregates only. */
export async function promoStats(deps: EngineDeps, days: number): Promise<PromoStatsResponse> {
  const since = new Date(Date.now() - days * DAY_MS);
  return { days, codes: await deps.store.promoStats(since) };
}
