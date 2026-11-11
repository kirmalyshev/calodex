// Onboarding: the order an experiment arm may ask the questions in, and the rules that keep it valid.
//
// The DEFAULT order is `ONBOARDING_PLACES`, fixed in code. An experiment arm may carry its own order of
// the span from the welcome to the sign-up — the tail (country, referral, Health, the streak goal) is
// routes on both surfaces and does not move. Every edge in `ORDER_AFTER` names the reader that breaks
// without it: a reply, an echo or a guard that quotes an earlier answer. The order is validated on the
// SAVE (the admin's experiment write); a surface handed an order it cannot validate falls back to the
// default rather than refusing, because a refusal at runtime is an onboarding that does not start.

import { ONBOARDING_PLACES, type OnboardingPlace } from "./onboarding.ts";

/**
 * The order capability a client declares on `GET /v1/onboarding?order=`.
 *
 * A capability rather than a build number: OTA ships JS without a new binary, so what can read an order
 * is the JS that implements it. A client that declares less is not enrolled in an experiment with an
 * ordered arm at all — it gets the live copy, so every arm's population stays the same.
 */
export const ONBOARDING_ORDER_VERSION = 1;

/** The span an arm may reorder: the welcome to the sign-up, in the default order. */
export const DEFAULT_ORDER: readonly OnboardingPlace[] = ONBOARDING_PLACES.slice(0, ONBOARDING_PLACES.indexOf("signup") + 1);

/** The places an arm may leave out: the two beats, which write nothing. Every question stays. */
export const REMOVABLE_PLACES: readonly OnboardingPlace[] = ["baseline", "prelim"];

const TARGET_INPUTS: readonly OnboardingPlace[] = ["goal", "sex", "age", "height", "weight", "activity"];

/**
 * What each place must come AFTER, and why. A predecessor an arm removed (a beat) is no constraint.
 *
 *   weight    the under-16 stop refuses a minor before they give a body number; the BMI floor reads height
 *   activity  its echo is the resting burn (BMR): sex, age, height, weight
 *   target    a maintainer skips it (goal); checkDirection (weight); the BMI floor (height); echo is the TDEE
 *   pace      a maintainer skips it (goal); pacePreview needs a target
 *   baseline  the BMI, hidden under 18
 *   prelim    explainTargets over every target input, the pace included
 *   barrier   its options gain one named by the goal; "never counted" skips it; its copy variant
 *   situation its copy variant is keyed by `counted_before`
 *   summary   the plan is the end of the questions: planRows reads diet and medical, explainTargets the rest
 */
export const ORDER_AFTER: Readonly<Partial<Record<OnboardingPlace, readonly OnboardingPlace[]>>> = {
  weight: ["age", "height"],
  activity: ["sex", "age", "height", "weight"],
  target: ["goal", "height", "weight", "activity"],
  pace: ["goal", "target"],
  baseline: ["age", "height", "weight"],
  prelim: [...TARGET_INPUTS, "target", "pace"],
  barrier: ["goal", "counted"],
  situation: ["counted"],
  summary: DEFAULT_ORDER.filter((p) => !["welcome", "summary", "signup"].includes(p)),
};

export interface OrderRefusal {
  place: string;
  /**
   *   unknown      not a place in the span
   *   duplicate    listed twice
   *   missing      a question left out (only `REMOVABLE_PLACES` may be)
   *   fixed        the welcome is not first, or the sign-up is not straight after the plan
   *   must-follow  sits before `after`, which it reads
   */
  rule: "unknown" | "duplicate" | "missing" | "fixed" | "must-follow";
  after?: OnboardingPlace;
}

const inSpan = (p: string): p is OnboardingPlace => (DEFAULT_ORDER as readonly string[]).includes(p);

/** Every reason this order is refused; empty when it is valid. The one validator for every caller. */
export function validateOnboardingOrder(order: readonly string[]): OrderRefusal[] {
  const out: OrderRefusal[] = [];
  const seen = new Set<string>();
  for (const p of order) {
    if (!inSpan(p)) out.push({ place: p, rule: "unknown" });
    else if (seen.has(p)) out.push({ place: p, rule: "duplicate" });
    seen.add(p);
  }
  for (const p of DEFAULT_ORDER) {
    if (!seen.has(p) && !REMOVABLE_PLACES.includes(p)) out.push({ place: p, rule: "missing" });
  }
  if (order[0] !== "welcome") out.push({ place: "welcome", rule: "fixed" });
  // Phase 1 (#2788): the sign-up stays straight after the plan. Phase 2 lets it sit straight before.
  if (order.at(-1) !== "signup" || order.at(-2) !== "summary") out.push({ place: "signup", rule: "fixed" });
  for (const [place, before] of Object.entries(ORDER_AFTER) as [OnboardingPlace, readonly OnboardingPlace[]][]) {
    const at = order.indexOf(place);
    if (at === -1) continue;
    for (const q of before) {
      const qi = order.indexOf(q);
      if (qi > at) out.push({ place, rule: "must-follow", after: q });
    }
  }
  return out;
}

/** The order a surface walks: the served one when it is valid, the default otherwise. */
export function servedOrder(order: readonly string[] | undefined): readonly OnboardingPlace[] {
  return order !== undefined && validateOnboardingOrder(order).length === 0 ? (order as readonly OnboardingPlace[]) : DEFAULT_ORDER;
}

/** The progress dash for an order: its places between the welcome and the sign-up (`DASH_PLACES` for the default). */
export function dashPlaces(order: readonly OnboardingPlace[]): OnboardingPlace[] {
  return order.filter((p) => p !== "welcome" && p !== "signup");
}
