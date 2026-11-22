// The phone sheet's two derived lines (ieat-app#3163), here so `bun test` reaches them: the yearly
// card's per-month saving, computed from the two StoreKit prices, and the trial promise, which
// rides only while the yearly plan with a trial is the one picked.

import { fill, spellUnit } from "../lang.ts";
import type { WelcomePlate } from "../onboarding.ts";
import { chatScreenCopyFor } from "./chat-copy.ts";
import { offerMath, paywallPercent, paywallPrice } from "../paywall.ts";
import type { Lang } from "../types.ts";
import type { PayCopy } from "./pay-copy.ts";

const nb = (x: string) => x.replace(/[\u0020\u00A0\u202F]/g, "\u00A0");

/** "€3.33/month · save 33%" — null when a price is missing or yearly is no real saving. */
export function yearlySaveLine(
  pay: Pick<PayCopy, "perMonthSave">, lang: Lang, currency: string,
  monthlyPrice: number | null, yearlyPrice: number | null,
): string | null {
  if (monthlyPrice === null || yearlyPrice === null) return null;
  const m = offerMath(monthlyPrice * 12, yearlyPrice);
  if (m === null) return null;
  return fill(pay.perMonthSave, {
    price: nb(paywallPrice(m.perMonth, currency, lang)),
    percent: nb(paywallPercent(m.percentOff, lang)),
  });
}

/**
 * The plans hero's alt text (ieat-app#3359): the plate's own figures in the chat labels' words —
 * "Protein 8 g, Carbs 50 g, Fat 12 g, 345 kcal" — the unit after each number, the calorie count
 * last. The phone's `usePlansHero` and the web sheet say the same thing for the same plate.
 */
export function welcomePlateAlt(plate: WelcomePlate, lang: Lang): string {
  const labels = chatScreenCopyFor(lang).macroLabels;
  const g = spellUnit(lang, "g");
  return [
    `${labels.protein} ${plate.proteinG} ${g}`, `${labels.carbs} ${plate.carbsG} ${g}`,
    `${labels.fat} ${plate.fatG} ${g}`, `${plate.kcal} ${spellUnit(lang, "kcal")}`,
  ].join(", ");
}


