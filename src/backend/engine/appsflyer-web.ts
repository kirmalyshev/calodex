import type { Config } from "../config.ts";
import type { RevenueCatEventRow, Store } from "../store.ts";

// AppsFlyer web attribution for /start, server to server (ieat-app#3621). Nothing runs in the
// browser: no AppsFlyer script, no AppsFlyer cookie. The one thing stored there is the visitor's own
// answer to the /start consent banner, and without an `accept` nothing is sent at all (q93).
//
// A web purchase is a RevenueCat Billing purchase, and RevenueCat reports it to AppsFlyer itself
// ("Web S2S"), naming the buyer by `customer_user_id` = the RevenueCat app user id = our user id.
// AppsFlyer attributes such an event only to an earlier VISIT by the same user — "If you send an
// event before a visit, the system classifies it as organic." This file sends that visit, once,
// when /start mints the account, carrying the ad's click parameters the landing URL arrived with.
//
// RevenueCat does NOT forward web purchases to AppsFlyer (Kirill, option A): it cannot honour a
// visitor's Decline. Our webhook does it instead, `forwardWebPurchase`, and only for an account
// whose visitor pressed Accept on the /start banner. Turning RevenueCat's own forwarding on as well
// would double-count every purchase.

/** The click parameters worth carrying from the landing to the visit. Nothing else ever leaves. */
export const CLICK_PARAMS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "gclid", "gbraid", "wbraid", "fbclid", "ttclid", "msclkid",
  "pid", "c", "af_c_id", "af_adset", "af_adset_id", "af_ad", "af_ad_id", "af_channel", "af_sub1",
] as const;

const MAX_VALUE = 500;

/** The landing's allow-listed click parameters as a query string, or "" when it carried none. */
export function clickParamsOf(search: URLSearchParams): string {
  const kept = new URLSearchParams();
  for (const key of CLICK_PARAMS) {
    const value = search.get(key);
    if (value !== null && value !== "" && value.length <= MAX_VALUE) kept.set(key, value);
  }
  return kept.toString();
}

type WebAttributionConfig = { appsflyerWebS2sToken: string; appsflyerWebAppId: string };

/**
 * THE ONE PREDICATE IN FRONT OF EVERY VISIT. Off unless both halves are configured AND the visitor
 * accepted the /start consent banner (Kirill, q93): without consent nothing is kept and nothing is
 * sent, whatever the operator configured.
 */
export function webAttributionAllowed(config: WebAttributionConfig, consented: boolean): boolean {
  return consented && config.appsflyerWebS2sToken !== "" && config.appsflyerWebAppId !== "";
}

export interface WebVisit {
  userId: string;
  /** `clickParamsOf`'s answer. Empty means organic, and an organic visit is not sent. */
  clickParams: string;
  /** This server's own origin, as the browser reached it. */
  origin: string;
  ip: string;
  userAgent: string | null;
  /** The visitor accepted the consent banner. */
  consented: boolean;
}

const TIMEOUT_MS = 3000;

/** Send one visit. Never throws, never blocks longer than its timeout, never logs the token. */
export async function sendWebVisit(config: WebAttributionConfig, visit: WebVisit, fetchFn: typeof fetch = fetch): Promise<void> {
  if (!webAttributionAllowed(config, visit.consented) || visit.clickParams === "") return;
  const body: Record<string, unknown> = {
    user_id: { customer_user_id: visit.userId },
    event_url: `${visit.origin}/start?${visit.clickParams}`,
    ip: visit.ip,
  };
  if (visit.userAgent) body.user_agent = visit.userAgent.slice(0, 1024);
  try {
    const res = await fetchFn(
      `https://events.appsflyer.com/v2.0/s2s/visits/app/web/${encodeURIComponent(config.appsflyerWebAppId)}`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${config.appsflyerWebS2sToken}`, "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    if (!res.ok) console.error(`[eait] appsflyer web visit refused: ${res.status}`);
  } catch (e) {
    // The name only: a message can echo the request, and the request carries the token.
    console.error(`[eait] appsflyer web visit failed: ${(e as Error | null)?.name ?? "error"}`);
  }
}

/** RevenueCat's `store` for a RevenueCat Web Billing purchase — the only store forwarded. */
export const WEB_BILLING_STORE = "RC_BILLING";

/** The AppsFlyer event a web purchase is, or null for every type that is not forwarded. */
function webPurchaseEventName(row: RevenueCatEventRow, isTrialConversion: boolean | null): string | null {
  if (row.type === "INITIAL_PURCHASE") return row.periodType === "TRIAL" ? "af_start_trial" : "af_subscribe";
  if (row.type === "RENEWAL") return isTrialConversion === true ? "rc_trial_converted_event" : "rc_renewal_event";
  return null;
}

/**
 * Forward one RevenueCat Web Billing purchase to AppsFlyer as an in-app event, only when the
 * account's visitor ACCEPTED the /start consent banner — declined and never asked send nothing —
 * and the environment passes the webhook's own sandbox rule. No ip and no user agent: the request
 * this answers is RevenueCat's server, not the visitor. Never throws; logs a status or an error's
 * name, never the token.
 */
export async function forwardWebPurchase(
  deps: { config: Config; store: Store },
  row: RevenueCatEventRow,
  isTrialConversion: boolean | null,
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  const { config } = deps;
  const eventName = webPurchaseEventName(row, isTrialConversion);
  if (eventName === null || row.store !== WEB_BILLING_STORE || row.userId === null) return;
  if (row.environment === "SANDBOX" && !config.revenueCatAcceptSandbox) return;
  if (!webAttributionAllowed(config, true)) return;
  try {
    if (!webAttributionAllowed(config, (await deps.store.webAttributionConsentOf(row.userId)) === true)) return;
    const trialStart = eventName === "af_start_trial";
    const purchased = row.priceInPurchasedCurrency !== null;
    const body: Record<string, unknown> = {
      user_id: { customer_user_id: row.userId },
      event_name: eventName,
      event_revenue: trialStart ? 0 : (row.priceInPurchasedCurrency ?? row.price ?? 0),
      event_revenue_currency: (trialStart || purchased) && row.currency !== null ? row.currency : "USD",
      af_customer_event_id: row.id,
      timestamp: Date.parse(row.eventAt),
    };
    const res = await fetchFn(
      `https://events.appsflyer.com/v2.0/s2s/inapps/app/web/${encodeURIComponent(config.appsflyerWebAppId)}`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${config.appsflyerWebS2sToken}`, "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    if (!res.ok) console.error(`[eait] appsflyer web purchase refused: ${res.status}`);
  } catch (e) {
    console.error(`[eait] appsflyer web purchase failed: ${(e as Error | null)?.name ?? "error"}`);
  }
}
