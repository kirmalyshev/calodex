import type { Config } from "../config.ts";
import type { RevenueCatEventRow, Store } from "../store.ts";
import { survivorOf } from "./entitlement.ts";

// AppsFlyer web attribution for /start, server to server (ieat-app#3621). Nothing runs in the
// browser: no AppsFlyer script, no AppsFlyer cookie. The one thing stored there is the visitor's own
// answer to the /start consent banner, and without an `accept` nothing is sent at all.
//
// Two things are sent, both only after Accept. A VISIT, once, when /start mints the account,
// carrying the ad's click parameters the landing URL arrived with: AppsFlyer attributes a web event
// only to an earlier visit by the same `customer_user_id` (our user id). And the PURCHASE: our
// RevenueCat webhook forwards each RevenueCat Billing purchase itself, `forwardWebPurchase`.
//
// RevenueCat's own AppsFlyer web routing ("Web S2S") stays OFF: it cannot honour a visitor's
// Decline. Turning it on as well would also double-count every purchase.

/** The banner's two answers, the one spelling every reader and writer uses. */
export type ConsentChoice = "accept" | "decline";
export const isConsentChoice = (v: unknown): v is ConsentChoice => v === "accept" || v === "decline";

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

/** Both halves set. Either empty = off: /start sends no visit and the webhook forwards no web purchase. */
export function webAttributionConfigured(config: WebAttributionConfig): boolean {
  return config.appsflyerWebS2sToken !== "" && config.appsflyerWebAppId !== "";
}

/**
 * THE ONE PREDICATE IN FRONT OF EVERY SEND — the /start visit and every forwarded web purchase.
 * Configured AND the visitor accepted the /start consent banner. A Decline is recorded, and nothing
 * is sent, whatever the operator configured.
 */
export function mayAttribute(config: WebAttributionConfig, consented: boolean): boolean {
  return consented && webAttributionConfigured(config);
}

export interface WebVisit {
  userId: string;
  /** `clickParamsOf`'s answer. Empty means organic, and an organic visit is not sent. */
  clickParams: string;
  /** This server's own origin, as the browser reached it. */
  origin: string;
  /** The address the request was observed from (the last X-Forwarded-For hop, else the socket peer), or null. */
  ip: string | null;
  userAgent: string | null;
  /** The visitor accepted the consent banner. */
  consented: boolean;
}

const TIMEOUT_MS = 3000;

/**
 * AppsFlyer's answer, logged: on a refusal its status and the start of its body, with the token
 * blanked should it be echoed; on success the body is only cancelled. Never throws.
 */
async function settle(res: Response, label: string, token: string): Promise<void> {
  if (res.ok) {
    await res.body?.cancel().catch(() => {});
    return;
  }
  let text = "";
  try {
    text = (await res.text()).slice(0, 200).replaceAll(token, "***");
  } catch { /* the status alone, then */ }
  console.error(`[eait] ${label}: ${res.status}${text === "" ? "" : ` ${text}`}`);
}

/** An error's name and code, never its message: a message can echo the request, which carries the token. */
function errorOf(e: unknown): string {
  const { name, code } = (e ?? {}) as { name?: unknown; code?: unknown };
  return `${String(name ?? "error")}${code === undefined ? "" : ` ${String(code)}`}`;
}

/** Send one visit. Never throws, never blocks longer than its timeout, never logs the token. */
export async function sendWebVisit(config: WebAttributionConfig, visit: WebVisit, fetchFn: typeof fetch = fetch): Promise<void> {
  if (!mayAttribute(config, visit.consented) || visit.clickParams === "") return;
  const body: Record<string, unknown> = {
    user_id: { customer_user_id: visit.userId },
    event_url: `${visit.origin}/start?${visit.clickParams}`,
  };
  if (visit.ip !== null) body.ip = visit.ip;
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
    await settle(res, `appsflyer web visit refused, user ${visit.userId}`, config.appsflyerWebS2sToken);
  } catch (e) {
    console.error(`[eait] appsflyer web visit failed, user ${visit.userId}: ${errorOf(e)}`);
  }
}

/** RevenueCat's `store` for a RevenueCat Web Billing purchase — the only store forwarded. */
export const WEB_BILLING_STORE = "RC_BILLING";

/** The AppsFlyer event a web purchase is, or null for every type that is not forwarded. */
function webPurchaseEventName(row: RevenueCatEventRow, isTrialConversion: boolean | null): string | null {
  if (row.type === "INITIAL_PURCHASE") return row.periodType === "TRIAL" ? "af_start_trial" : "af_subscribe";
  if (row.type === "RENEWAL") return isTrialConversion === true ? "rc_trial_converted_event" : "rc_renewal_event";
  if (row.type === "NON_RENEWING_PURCHASE") return "af_purchase";
  return null;
}

/**
 * Forward one RevenueCat Web Billing purchase to AppsFlyer as an in-app event, only when the
 * account's visitor ACCEPTED the /start consent banner — declined and never asked send nothing —
 * and the environment passes the webhook's own sandbox rule. The account is the survivor a merge
 * left, as the event log names it. No ip and no user agent: the request this answers is
 * RevenueCat's server, not the visitor. Never throws; logs RevenueCat's event id and type with a
 * status or an error's name, never the token.
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
  if (!webAttributionConfigured(config)) return;
  const event = `event ${row.id} ${row.type}`;
  let userId: string;
  let consented: boolean;
  try {
    userId = await survivorOf(deps, row.userId);
    consented = (await deps.store.webAttributionConsentOf(userId)) === true;
  } catch (e) {
    console.error(`[eait] appsflyer web purchase not sent, ${event}: the consent read failed: ${errorOf(e)}`);
    return;
  }
  if (!mayAttribute(config, consented)) return;
  const trialStart = eventName === "af_start_trial";
  let revenue: number;
  let currency: string;
  if (trialStart) {
    revenue = 0;
    currency = row.currency ?? "USD";
  } else if (row.priceInPurchasedCurrency !== null && row.currency !== null) {
    revenue = row.priceInPurchasedCurrency;
    currency = row.currency;
  } else if (row.price !== null) {
    revenue = row.price;
    currency = "USD";
  } else {
    console.error(`[eait] appsflyer web purchase skipped, ${event}: no price`);
    return;
  }
  const body: Record<string, unknown> = {
    user_id: { customer_user_id: userId },
    event_name: eventName,
    event_revenue: revenue,
    event_revenue_currency: currency,
    af_customer_event_id: row.id,
  };
  const at = Date.parse(row.eventAt);
  if (Number.isFinite(at)) body.timestamp = at;
  try {
    const res = await fetchFn(
      `https://events.appsflyer.com/v2.0/s2s/inapps/app/web/${encodeURIComponent(config.appsflyerWebAppId)}`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${config.appsflyerWebS2sToken}`, "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    await settle(res, `appsflyer web purchase refused, ${event}`, config.appsflyerWebS2sToken);
  } catch (e) {
    console.error(`[eait] appsflyer web purchase failed, ${event}: ${errorOf(e)}`);
  }
}
