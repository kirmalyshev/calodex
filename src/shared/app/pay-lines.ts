// The phone sheet's two derived lines (ieat-app#3163), here so `bun test` reaches them: the yearly
// card's per-month saving, computed from the two StoreKit prices, and the trial promise, which
// rides only while the yearly plan with a trial is the one picked.

import { dayMonthAt, fill, spellUnit } from "../lang.ts";
import type { WelcomePlate } from "../onboarding.ts";
import { chatScreenCopyFor } from "./chat-copy.ts";
import { offerMath, paywallPercent, paywallPrice } from "../paywall.ts";
import type { Lang } from "../types.ts";
import type { PayCopy } from "./pay-copy.ts";

const nb = (x: string) => x.replace(/[\u0020\u00A0\u202F]/g, "\u00A0");

/** pay-cal-a-newyear's Yearly billed line in pieces (ieat-app#3606): `billedYearly` either side of
    its `{price}`, where both web surfaces draw the regular price struck and then the promotion's. */
export function billedAround(pay: Pick<PayCopy, "billedYearly">): [before: string, after: string] {
  const [before = "", after = ""] = pay.billedYearly.split("{price}");
  return [before, after];
}

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

/** "save 33%" — the tag the Yearly row's NAME carries (the phone's `planSave` beside `planYearly`),
    null on the same inputs `yearlySaveLine` refuses. ieat-app#3465. */
export function yearlySave(
  pay: Pick<PayCopy, "planSave">, lang: Lang,
  monthlyPrice: number | null, yearlyPrice: number | null,
): string | null {
  if (monthlyPrice === null || yearlyPrice === null) return null;
  const m = offerMath(monthlyPrice * 12, yearlyPrice);
  return m === null ? null : fill(pay.planSave, { percent: nb(paywallPercent(m.percentOff, lang)) });
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



/**
 * Guideline 3.1.2(c): the billed amount and the day billing starts, drawn beside the CTA priced at zero —
 * "Then €39.99 a year from 27 Nov". `renewal` is `pricePerYear` already priced; the phone and the web
 * sheet say the same thing. The day is `days` after `now`, in the reader's own zone.
 */
export function trialBillLine(
  pay: Pick<PayCopy, "tryThenBilled">, lang: Lang, zone: string, now: Date, days: number, renewal: string,
): string {
  return fill(pay.tryThenBilled, { renewal, date: dayMonthAt(lang, zone, new Date(now.getTime() + days * 86_400_000)) });
}
