// Where an account came from, and the RevenueCat event log (ieat-app#3196). Analytics only:
// nothing here decides access, and nothing here is sent to a client.

import type { RevenueCatEventRow } from "../store.ts";
import type { AttributionStatus } from "@eait/shared";
import { track } from "./analytics.ts";
import type { EngineDeps } from "./deps.ts";

/**
 * Log one RevenueCat delivery and, when it carries RevenueCat's acquisition attributes and names
 * one of our accounts, copy them onto it. The store keeps Apple's own AdServices answer over them.
 * A FIRST delivery naming an account is also one `subscription_<type>` analytics event; a retried
 * one is not, because the event id is already logged.
 */
export async function logRevenueCatEvent(
  deps: EngineDeps, row: RevenueCatEventRow,
  lifecycle: { is_trial_conversion: boolean | null; cancel_reason: string | null } = { is_trial_conversion: null, cancel_reason: null },
): Promise<void> {
  const fresh = await deps.store.recordRevenueCatEvent(row);
  if (row.userId !== null && row.acquisition !== null) {
    await deps.store.putAcquisition(row.userId, { ...row.acquisition, via: "revenuecat" });
  }
  if (!fresh || row.userId === null) return;
  // Every subscription_* event shares one prop list; `track` drops a type the catalog does not list.
  const event = `subscription_${row.type.toLowerCase()}` as "subscription_renewal";
  await track(deps, row.userId, event, {
    product_id: row.productId, period_type: row.periodType, presented_offering_id: row.presentedOfferingId,
    price: row.price, currency: row.currency, store: row.store, country_code: row.countryCode,
    environment: row.environment, ...lifecycle,
  }, null);
}

/**
 * Resolve this install's AdServices token against Apple and store the answer on the account. The
 * first answer wins: once one is stored, Apple is not asked again. The token is neither stored nor
 * logged. `userId` is the caller's, from credentials.
 */
export async function attributeInstall(deps: EngineDeps, userId: string, token: string): Promise<AttributionStatus> {
  if ((await deps.store.acquisitionOf(userId))?.via === "adservices") return "resolved";
  if (!deps.adServices) return "unavailable";
  const a = await deps.adServices(token);
  if (a.kind !== "attribution") return a.kind;
  await deps.store.putAcquisition(userId, a.attributed
    ? { source: "apple_search_ads", campaign: a.campaignId, adGroup: a.adGroupId, keyword: a.keywordId, via: "adservices" }
    : { source: "organic", campaign: null, adGroup: null, keyword: null, via: "adservices" });
  return "resolved";
}
