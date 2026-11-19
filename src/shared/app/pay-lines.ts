// The phone sheet's two derived lines (ieat-app#3163), here so `bun test` reaches them: the yearly
// card's per-month saving, computed from the two StoreKit prices, and the trial promise, which
// rides only while the yearly plan with a trial is the one picked.

import { fill } from "../lang.ts";
import { offerMath, paywallPercent, paywallPrice } from "../paywall.ts";
import type { Lang } from "../types.ts";
import type { PayCopy } from "./pay-copy.ts";

const nb = (x: string) => x.replace(/[  ]/g, " ");

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
