// Spend caps. The only thing standing between a public app and an unbounded model bill.
//
// The per-user caps are fairness/abuse limits. What bounds the whole instance's spend is the
// per-address limiting in `api/ratelimit.ts` — which is what makes it safe to run without an
// allowlist, because the funnel this app sits at the end of requires strangers to be able to
// use it without gatekeeping.

import type { Refusal } from "@eait/shared";
import type { EngineDeps } from "./deps.ts";
import type { SpendLimit } from "../store.ts";
import { GatewayRefusal, type OnCall, type OnCost } from "../llm/port.ts";
import { dailyPhotoCap, entitlementFor, freeAnalysesFor } from "./entitlement.ts";
import { isAnonymous } from "./identity.ts";

export type CapScope = "photo" | "text";

/**
 * Whether an account with no live entitlement is refused: always, unless a self-hosted instance
 * switched the paywall off (`config.paywall`), or the admin granted it
 * analyses it has not spent (a development store grants every account some — `dev/grant.ts`).
 * There is no default sample (ieat-app#2364). The profile's `subscriptionRequired` is this answer.
 */
export async function unpaidRefused(deps: EngineDeps, userId: string): Promise<boolean> {
  if (!deps.config.paywall) return false;
  const granted = await freeAnalysesFor(deps, userId);
  return granted === 0 || (await deps.store.countUserAnalyses(userId)) >= granted;
}

/**
 * THE paywall rule, once. `"entitled"` means the paid tier's own limits apply; null is an unpaid
 * account `unpaidRefused` lets through. Read per request, never cached.
 */
async function paywall(deps: EngineDeps, userId: string): Promise<Refusal | null | "entitled"> {
  if ((await entitlementFor(deps, userId)).active) return "entitled";
  return (await unpaidRefused(deps, userId)) ? { kind: "subscription-required" } : null;
}

/**
 * The gate for a log that costs no model call (a catalog food): behind the paywall like a photo.
 * Same identity rule and the same refusal as `checkCaps`.
 */
export async function checkFreeLog(deps: EngineDeps, userId: string): Promise<Refusal | null> {
  if (await isAnonymous(deps, userId)) return { kind: "identity-required" };
  const gate = await paywall(deps, userId);
  return gate === "entitled" ? null : gate;
}

/**
 * Null when the request may proceed, a refusal when it may not.
 *
 * Without an entitlement the account is refused (`unpaidRefused`), photo or text alike — a sentence
 * must not be the free way around the ask. With one, photos meet the paid daily cap and text turns meet no per-user cap
 * at all: charging a question against the photo allowance would mean asking "how much protein
 * have I had" costs the user a meal they could have logged, which quietly teaches people not to
 * use the chat.
 */
export async function checkCaps(
  deps: EngineDeps,
  userId: string,
  date: string,
  scope: CapScope,
  /**
   * A queued job whose charge a dead attempt already stamped (#2679): the spend gates do not
   * apply — its charge exists and `chargeAnalysis` reuses it — while the identity rule still does.
   * Set from the job record's own `analysisId`; a pointer whose row was given back reads the same,
   * and the guarded write charges it fresh under the limit then.
   */
  charged = false,
): Promise<Refusal | null> {
  const { store, config } = deps;

  // No identity, no analysis (S8): sign-up comes before the first meal, so an account carrying no
  // Apple or Google identity is refused here — ahead of every cap and therefore ahead of the
  // charge. `charge` writes
  // `chargeAnalysis` below this, so a refusal returned now has spent nothing.
  if (await isAnonymous(deps, userId)) return { kind: "identity-required" };
  if (charged) return null;

  // Read from the store on every request rather than carried in the session, and that is the
  // point: a subscription that lapsed an hour ago must stop working an hour ago. An entitlement
  // cached for the life of a bearer token would be cached for up to 180 days.
  const gate = await paywall(deps, userId);
  if (gate !== "entitled") return gate;

  // The paid tier is a BIGGER per-user cap — a subscription buys a larger daily photo allowance.
  if (scope === "photo") {
    const cap = dailyPhotoCap(config);
    if (cap > 0) {
      // Photos only — `countUserPhotos` excludes text turns, which is the half of this rule that a
      // shared counter silently broke until a test caught it.
      const mine = await store.countUserPhotos(userId, date);
      if (mine >= cap) return { kind: "cap-exceeded", scope: "user" };
    }
  }

  return null;
}

/**
 * The `kind` an `llm_calls` row carries, off the transport's own name for the call (#602). A
 * `meal_analysis` is not in the map: its kind is the CALLER's word — `photo` or `reread` —
 * which `charge` is told below.
 */
const LLM_CALL_KIND: Record<string, string> = {
  route: "route",
  "text-meal": "text_meal",
  "text-correction": "correction",
  coach: "coach",
};

/**
 * What this account's charge may still spend, resolved per request — an entitlement lapsed an hour
 * ago stops working an hour ago. The paid tier's limit is the daily photo allowance; an unpaid
 * one's is the admin grant counted over a lifetime of rows (`unpaidRefused`'s same rule, which the
 * guarded write then enforces rather than repeats); and the paywall being off, or a scope the caps
 * do not meter, is no limit at all.
 */
async function chargeLimit(deps: EngineDeps, userId: string, scope: CapScope): Promise<SpendLimit | null> {
  if ((await entitlementFor(deps, userId)).active) {
    const cap = scope === "photo" ? dailyPhotoCap(deps.config) : 0;
    return cap > 0 ? { over: "day", max: cap } : null;
  }
  return deps.config.paywall ? { over: "lifetime" } : null;
}

export type ChargedAnalysis = { analysisId: string; fresh: boolean; onCost: OnCost; onCall: OnCall };

/**
 * A queued job's charge binding (#2679): the lease it is fenced by (`lost()` ends the attempt when
 * the lease is gone) and the charge a dead attempt stamped — a retry reuses it, never re-charges.
 */
export interface JobCharge {
  clientId: string;
  owner: string;
  lost: () => Error;
  analysisId?: string | null;
}

/**
 * Charge one analysis, BEFORE the model is asked, and return its id — the line that opens the turn
 * names it (#525) — and where its calls report their cost.
 *
 * The cost arrives after the charge and is ADDED to it, because one charge pays for several calls
 * — a schema retry, the router's second call, the coach's rounds — each reporting whenever it
 * lands. A write that fails is a log line: the turn is paid for either way (#484).
 *
 * `onCall` is the same shape one level down (#602): ONE llm_calls ROW PER PROVIDER CALL, metrics
 * only, fired and forgotten like the cost — a row that cannot land is a log line, never a failed
 * turn. `photoKind` is what a `meal_analysis` call is FOR at this callsite — the photo turn
 * or a meal's re-read.
 *
 * The write itself is `chargeAnalysis` (#2679): the cap's count and the insert are one guarded
 * statement under the account row's lock — `checkCaps`' earlier answer was advisory, this one is
 * binding — and a `job` makes it the job's own: fenced by the lease, found again by a retried
 * attempt rather than charged a second time. `fresh` says whether THIS call took the charge, which
 * is how the caller knows a refund may touch it — a charge a dead attempt left behind carries
 * billed calls already and is never given back by this one.
 */
export async function charge(
  deps: EngineDeps, userId: string, date: string, scope: CapScope,
  photoKind: "photo" | "reread" = "photo",
  /** A queued job the charge belongs to: fenced by its lease — `lost()` answers a gone one — and reused by a retry. */
  job?: JobCharge,
): Promise<ChargedAnalysis | Refusal> {
  const limit = await chargeLimit(deps, userId, scope);
  const res = await deps.store.chargeAnalysis(userId, date, scope, {
    ...(limit !== null ? { limit } : {}),
    ...(job !== undefined ? { job: { clientId: job.clientId, owner: job.owner } } : {}),
  });
  // `"lost"` is only ever a job's answer: the attempt ends where the lease did.
  if (res === "lost") throw job!.lost();
  if (res === "cap") return limit?.over === "day" ? { kind: "cap-exceeded", scope: "user" } : { kind: "subscription-required" };
  const id = res.analysisId;
  return { analysisId: id, fresh: res.fresh, onCost: (usd) => {
    void deps.store.addCost(userId, id, usd).then(
      // Refunded or merged away while a call was still out — a schema retry beside a refund, or a merge.
      (landed) => { if (!landed) console.error(`[eait] cost not recorded: analysis ${id} is gone (${usd ?? "unpriced"})`); },
      (e: unknown) => { console.error(`[eait] cost not recorded: ${(e as Error)?.message ?? e}`); },
    );
  }, onCall: (m) => {
    const { call, ...metric } = m;
    void deps.store.recordLlmCall(userId, {
      ...metric, analysisId: id,
      kind: call === "meal_analysis" ? photoKind : (LLM_CALL_KIND[call] ?? call),
    }).then(
      (landed) => { if (!landed) console.error(`[eait] call metric not recorded: analysis ${id} is gone (${call})`); },
      (e: unknown) => { console.error(`[eait] call metric not recorded: ${(e as Error)?.message ?? e}`); },
    );
  } };
}

/**
 * The other half of charging before the call: give the analysis back when the gateway refused
 * before generating anything, and only then.
 *
 * Lives beside `checkCaps` because it is the same rule read backwards, and because both charge
 * sites must answer it identically. Anything that is not a `GatewayRefusal` may have cost real
 * money and stays charged.
 *
 * Never throws. The caller is already inside a catch, handling a failure it is about to word for
 * the user; a store that cannot delete must not turn that handled failure into a 500 — and must not
 * swallow the log line the caller writes after it.
 */
export async function refundGatewayRefusal(
  deps: EngineDeps,
  userId: string,
  analysisId: string,
  e: unknown,
): Promise<boolean> {
  if (!(e instanceof GatewayRefusal)) return false;
  return await deps.store.undoAnalysis(userId, analysisId).catch((x: unknown) => {
    console.error(`[eait] refund failed: ${(x as Error)?.message ?? x}`);
    return false;
  });
}
