// The New Year promotion window (ieat-app#3604): ONE answer to "is a promotion live right now",
// read by the profile answer, the exit offer it suppresses and `/start/checkout?plan=newyear`, so
// no two surfaces can disagree about it.

import type { PaywallPromo } from "@eait/shared";
import type { PromoConfig } from "../config.ts";
import type { EngineDeps } from "./deps.ts";
import { switchOn } from "./switches.ts";

/**
 * Live = the admin armed it AND it is configured AND `from <= now < until`. Pure, so the window's
 * edges are tested without a clock; `config.ts` already refused a half-configured promotion.
 */
export function promoWindow(promo: PromoConfig | null, armed: boolean, now: Date): PaywallPromo | null {
  if (promo === null || !armed) return null;
  const t = now.getTime();
  if (t < Date.parse(promo.from) || t >= Date.parse(promo.until)) return null;
  return { id: "newyear", percent: promo.percent, trialDays: promo.trialDays, endsAt: promo.until, iosCode: promo.iosCode || null,
    skipTrialStep: promo.skipTrialStep };
}

/** The live promotion, or null. The switch is read only when one is configured. */
export async function promoOf(deps: EngineDeps, now: Date): Promise<PaywallPromo | null> {
  const promo = deps.config.promoNewYear;
  if (promo === null) return null;
  return promoWindow(promo, await switchOn(deps, "paywall.promo.newyear"), now);
}
