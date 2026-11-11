// Onboarding: the order an experiment arm may ask the questions in, and the rules that keep it valid.
//
// The DEFAULT order is `ONBOARDING_PLACES`, fixed in code. An experiment arm may carry its own order of
// the span from the welcome to the sign-up; the tail (country, referral, Health, the streak goal) is
// routed separately on both surfaces and does not move. Every edge in `ORDER_AFTER` names why it holds:
// a reader that quotes an earlier answer (a reply, an echo, a guard), or a stated rule. An order is
// meant to be refused when it is SAVED; a client handed one it cannot validate walks the default
// instead (`servedOrder`), because a refusal at runtime is an onboarding that does not start — and
// `orderFellBack` says so, so the funnel can tell that client apart from the arm it was assigned.

import { ONBOARDING_PLACES, type OnboardingPlace } from "./onboarding.ts";

/**
 * The order capability a client declares on `GET /v1/onboarding?order=`.
 *
 * A capability rather than a build number: OTA ships JS without a new binary, so what can read an order
 * is the JS that implements it. BUMP IT whenever `DEFAULT_ORDER` or `ORDER_AFTER` changes — a client
 * validates against its own copy of the rules, so a client on the old rules must stop being enrolled in
 * an ordered arm rather than silently walking the default inside it. A test pins the rules to it.
 */
export const ONBOARDING_ORDER_VERSION = 1;

/** The span an arm may reorder: the welcome to the sign-up, in the default order. */
export const DEFAULT_ORDER: readonly OnboardingPlace[] = ONBOARDING_PLACES.slice(0, ONBOARDING_PLACES.indexOf("signup") + 1);

/** The places an arm may leave out: the two beats, which write nothing. Every question stays. */
export const REMOVABLE_PLACES: readonly OnboardingPlace[] = ["baseline", "prelim"];

const OTHER_QUESTIONS = DEFAULT_ORDER.filter(
  (p) => !["welcome", "diet", "medical", "summary", "signup", ...REMOVABLE_PLACES].includes(p),
);

/**
 * What each place must come AFTER, and why. A predecessor an arm removed (a beat) is no constraint.
 *
 *   weight    a rule: the under-16 stop refuses a minor before they give their weight. Height may
 *             still come before age — sex, age and height are free among themselves (#2788, ruled)
 *   activity  its echo is the resting burn (BMR): sex, age, height, weight
 *   target    a maintainer skips it (goal); checkDirection (weight); the BMI floor (height); its echo
 *             is the TDEE (activity)
 *   pace      a maintainer skips it (goal); pacePreview needs a target
 *   baseline  the BMI, hidden under 18
 *   prelim    explainTargets over every target input, the pace included
 *   barrier   its options gain one named by the goal; "never counted" skips it; its copy variant
 *   situation its copy variant is keyed by `counted_before`
 *   diet,     the LAST questions, either order between them: `isAnswered` counts medical answered
 *   medical   only once onboarding is complete (a Balanced diet likewise), so a question after them
 *             is one `resumeAt` rewinds past on every resume — and the app completes on that answer
 *   summary   a rule: the plan is the end of the questions. planRows reads diet and medical and
 *             explainTargets the target inputs; the rest follow the rule
 */
export const ORDER_AFTER: Readonly<Partial<Record<OnboardingPlace, readonly OnboardingPlace[]>>> = {
  weight: ["age"],
  activity: ["sex", "age", "height", "weight"],
  target: ["goal", "height", "weight", "activity"],
  pace: ["goal", "target"],
  baseline: ["age", "height", "weight"],
  prelim: ["goal", "sex", "age", "height", "weight", "activity", "target", "pace"],
  barrier: ["goal", "counted"],
  situation: ["counted"],
  diet: OTHER_QUESTIONS,
  medical: OTHER_QUESTIONS,
  summary: DEFAULT_ORDER.filter((p) => !["welcome", "summary", "signup"].includes(p)),
};

/** Why an order is refused. Only `must-follow` names a second place. */
export type OrderRefusal =
  /**
   *   not-a-list the order is not an array at all (`place` is empty)
   *   unknown    not a place in the span
   *   duplicate  listed twice
   *   missing    a question left out (only `REMOVABLE_PLACES` may be)
   *   fixed      the welcome is not first, or the sign-up is not straight after the plan
   */
  | { place: string; rule: "not-a-list" | "unknown" | "duplicate" | "missing" | "fixed" }
  /** `place` sits before `after`, which it must follow. */
  | { place: OnboardingPlace; rule: "must-follow"; after: OnboardingPlace };

const inSpan = (p: unknown): p is OnboardingPlace => (DEFAULT_ORDER as readonly unknown[]).includes(p);

/**
 * Every reason this order is refused; empty when it is valid. The one validator for every caller.
 * Takes `unknown` because every caller holds parsed JSON — a stored arm, a request body, a response.
 */
export function validateOnboardingOrder(order: unknown): OrderRefusal[] {
  if (!Array.isArray(order)) return [{ place: "", rule: "not-a-list" }];
  const out: OrderRefusal[] = [];
  const seen = new Set<unknown>();
  for (const p of order as readonly unknown[]) {
    if (!inSpan(p)) out.push({ place: String(p), rule: "unknown" });
    else if (seen.has(p)) out.push({ place: p, rule: "duplicate" });
    seen.add(p);
  }
  for (const p of DEFAULT_ORDER) {
    if (!seen.has(p) && !REMOVABLE_PLACES.includes(p)) out.push({ place: p, rule: "missing" });
  }
  if (order[0] !== "welcome") out.push({ place: "welcome", rule: "fixed" });
  // Phase 1 (#2788): the sign-up stays straight after the plan. Phase 2 lets it sit straight before.
  if (order.at(-1) !== "signup" || order.at(-2) !== "summary") out.push({ place: "signup", rule: "fixed" });
  for (const place of DEFAULT_ORDER) {
    const at = order.indexOf(place);
    if (at === -1) continue;
    for (const after of ORDER_AFTER[place] ?? []) {
      if (order.indexOf(after) > at) out.push({ place, rule: "must-follow", after });
    }
  }
  return out;
}

/** The order a surface walks: the served one when it is valid, the default otherwise. */
export function servedOrder(order: unknown): readonly OnboardingPlace[] {
  return Array.isArray(order) && validateOnboardingOrder(order).length === 0 ? order.filter(inSpan) : DEFAULT_ORDER;
}

/** Whether a client handed this order walks the default instead — the signal the funnel reports. */
export function orderFellBack(order: unknown): boolean {
  return order !== undefined && validateOnboardingOrder(order).length > 0;
}

/**
 * The progress dash for an order: its places between the welcome and the sign-up. `DASH_PLACES` is
 * this for the default order; an arm that drops a beat draws one segment fewer.
 */
export function dashPlaces(order: readonly OnboardingPlace[]): OnboardingPlace[] {
  return order.filter((p) => p !== "welcome" && p !== "signup");
}
