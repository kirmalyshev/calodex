// Where an account came from, and the RevenueCat event log (ieat-app#3196). Analytics only:
// nothing here decides access, and nothing here is sent to a client.

import type { RevenueCatEventRow } from "../store.ts";
import type { EngineDeps } from "./deps.ts";

/**
 * Log one RevenueCat delivery and, when it carries RevenueCat's acquisition attributes and names
 * one of our accounts, copy them onto it. The store keeps Apple's own AdServices answer over them.
 */
export async function logRevenueCatEvent(deps: EngineDeps, row: RevenueCatEventRow): Promise<void> {
  await deps.store.recordRevenueCatEvent(row);
  if (row.userId !== null && row.acquisition !== null) {
    await deps.store.putAcquisition(row.userId, { ...row.acquisition, via: "revenuecat" });
  }
}
