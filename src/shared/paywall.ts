// The paywall's configuration shape and its arithmetic (#77).
//
// The web app can be self-hosted, so nothing about the offer may be compiled into a bundle: the
// checkout links, the prices and the trial length are the OPERATOR's, read off
// `EAIT__BACKEND__WEB_*` and sent to the client already computed in `ProfileResponse.paywall` —
// the browser calculates nothing. The phone prices the same screens from StoreKit and calls
// `offerMath` itself, which is why the math takes numbers rather than display strings.

import { LANG_TAG, latn } from "./lang.ts";
import type { Lang } from "./types.ts";

/**
 * One purchasable plan on the web paywall, ready to render: the checkout link with the account's
 * own id already filled into `{userId}` — navigate to it, never template it — and the prices
 * formatted in the account's language and the operator's currency.
 */
export interface PaywallPlan {
  checkoutUrl: string;
  /** The period's price as the card says it: "a year" for yearly, "a month" for monthly. */
  price: string;
}

/** The yearly plan's second figure: what a year of it costs per month. */
export interface YearlyPlan extends PaywallPlan {
  pricePerMonth: string;
  /**
   * "€3.33/month · save 33%" — the per-month figure plus what a year saves against paying
   * monthly for a year. The server derives it (ieat-app#3359) because the browser holds only
   * formatted strings; `null` when monthly is not configured or the saving is under one percent.
   */
  perMonthSave: string | null;
  /**
   * "save 33%" — the tag the Yearly row's NAME carries, the phone's `planSave` beside
   * `planYearly` (ieat-app#3465). Same rule as `perMonthSave`: null when monthly is not
   * configured or the saving is under one percent.
   */
  save: string | null;
}

/**
 * The one offer a decline leads to: the cheaper yearly plan, its regular price struck through.
 */
export interface ExitOffer extends PaywallPlan {
  /** The regular price struck through: twelve monthlies while a monthly plan is sold, else the regular yearly price. */
  regularPrice: string;
  /** Whole percent cheaper than `regularPrice` — floored, never overstated. */
  percentOff: number;
  /** The offer spread over a month, formatted like every other price. */
  perMonth: string;
}

/**
 * The web paywall, as this server is configured — computed in `ProfileResponse.paywall` (#77).
 *
 * A null plan is a plan the operator did not configure and the client does not draw. `yearly`,
 * `monthly` AND `exitOffer` all null means the host sells nothing and no paywall surface exists
 * at all — whatever `entitlement` and `limits` say about the account.
 */
export interface WebPaywall {
  /** Free days the plan's CTA may promise. 0 = no trial line is drawn. */
  trialDays: number;
  /** Yearly, the preselected plan — null when no yearly checkout is configured. */
  yearly: YearlyPlan | null;
  /** Monthly — null when no monthly checkout is configured. */
  monthly: PaywallPlan | null;
  /**
   * The offer shown once after the plans are declined — null = a decline goes to the app. The
   * admin's `web` switch un-arms it too (ieat-app#3155): switched off is this same null, the
   * shape of one never configured.
   */
  exitOffer: ExitOffer | null;
  /**
   * The promotion's web checkout (ieat-app#3604), `{userId}` already filled — navigate to it,
   * never template it. Null outside a live `ProfileResponse.promo`, and while the operator
   * configured no web checkout for it.
   */
  promoCheckoutUrl: string | null;
  /**
   * The promotion's yearly figures for the web plans screen (ieat-app#3606, board
   * pay-cal-a-newyear): its price, formatted like `YearlyPlan.price`, struck against which the
   * regular `yearly.price` is drawn; that price over a month, like `YearlyPlan.pricePerMonth`; and
   * the whole percent the band names. Null unless the promotion is live AND sold here — a web
   * checkout, its `WEB_PRICE_NEWYEAR` and a yearly plan to strike through — and a client then
   * draws today's plans, unchanged.
   */
  promoYearly: PromoYearly | null;
  /**
   * The legal footer's Terms href — the operator's `TERMS_URL`, verbatim. "" means no terms are
   * published and a client draws no link, the shape `/start`'s own consent line takes.
   */
  termsUrl: string;
  /**
   * Same, for the privacy policy: `${LANDING_URL}/privacy` resolved server-side, "" while no
   * landing is configured to publish it.
   */
  privacyUrl: string;
}

/** {@link WebPaywall.promoYearly}. */
export interface PromoYearly {
  price: string;
  pricePerMonth: string;
  percent: number;
}

/**
 * A configured amount written as a price in the operator's currency and the reader's language —
 * the ONLY way a `WEB_PRICE_*` number reaches a page. `Intl` owns the symbol, its side and the
 * decimal mark, because a table of our own got three languages wrong at once before it existed.
 */
export function paywallPrice(amount: number, currency: string, lang: Lang): string {
  // narrowSymbol, so a USD paywall reads "$39.99" to an English reader rather than "US$39.99".
  // Three currencies need more than that (ieat-app#3163): a bare "$" on AUD/NZD reads as US
  // dollars, a ruble price carries no kopecks, and the ringgit is RM. The sign is swapped in the
  // formatted STRING, never through `formatToParts`: Hermes has no NumberFormat.formatToParts
  // (a TypeError in render, a process abort in Release), and its narrowSymbol answers "MYR",
  // "A$" or "AU$" where ICU answers "$" or "RM" - so the pattern takes every spelling.
  const whole = currency === "RUB" ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {};
  const text = latn(new Intl.NumberFormat(LANG_TAG[lang], { style: "currency", currency, currencyDisplay: "narrowSymbol", ...whole }).format(amount));
  return swapCurrencySign(text, currency);
}

/** The sign swap on its own, so a test can hand it the spellings Hermes answers with. */
export function swapCurrencySign(text: string, currency: string): string {
  const swap = CURRENCY_SWAP[currency];
  return swap ? text.replace(swap[0], swap[1]) : text;
}

const CURRENCY_SWAP: Record<string, [RegExp, string]> = {
  AUD: [/AU\$|A\$|\$AU|\$/, "A$"],
  NZD: [/NZ\$|\$NZ|\$/, "NZ$"],
  MYR: [/MYR|RM/, "RM"],
};

/**
 * The offer's percent off written in the reader's language — "40%" to an English reader, "40 %" to
 * a French, German, Spanish or Russian one. `Intl`'s percent style owns the sign's spacing, because
 * the copy's `"{percent}"` placeholder used to carry a bare number and every template baked the
 * English " %" in — an English card read "40 % off" (#451 review).
 */
export function paywallPercent(percentOff: number, lang: Lang): string {
  return latn(new Intl.NumberFormat(LANG_TAG[lang], { style: "percent", maximumFractionDigits: 0 })
    .format(percentOff / 100));
}

/**
 * What a yearly amount costs per month, to the cent — the "≈ €2.00 a month" line on BOTH the
 * yearly plan's card and the exit offer's. One copy, shared with the native paywall (#928), so
 * the two lines can never drift apart.
 */
export function perMonth(yearlyAmount: number): number {
  return Math.round((yearlyAmount / 12) * 100) / 100;
}

/**
 * What the exit-offer card needs derived from its two prices: the percent cheaper — FLOORED, so a
 * fractional discount can only ever read smaller, never bigger — and the offer spread over a
 * month, to the cent. The struck-through price is the caller's own first argument; it needs no
 * second copy.
 *
 * Null rather than wrong figures when either price cannot stand — a regular price of nothing
 * makes the percent a division by zero — and null when the floored saving is under one percent:
 * an offer priced at or above the regular plan, or cheaper by a rounding error, has no card to
 * draw, so a decline goes straight to the app.
 */
export interface OfferMath {
  percentOff: number;
  perMonth: number;
}

export function offerMath(regularYearly: number, offer: number): OfferMath | null {
  if (!Number.isFinite(regularYearly) || !Number.isFinite(offer) || regularYearly <= 0 || offer < 0) {
    return null;
  }
  const percentOff = Math.floor(((regularYearly - offer) / regularYearly) * 100);
  if (percentOff < 1) return null;
  return { percentOff, perMonth: perMonth(offer) };
}

/**
 * The admin's per-platform arming of the decline → offer (ieat-app#3155), as
 * `ProfileResponse.exitOfferEnabled` carries it. One flag per platform the offer can surface on,
 * each defaulting OFF.
 */
export interface ExitOfferSwitches {
  ios: boolean;
  web: boolean;
}

/**
 * A time-boxed promotion, as `ProfileResponse.promo` carries it (ieat-app#3604) — present ONLY
 * while it is live: the admin's switch on AND the server's clock inside the operator's configured
 * window. Every figure is the operator's; the client computes none of it.
 */
export interface PaywallPromo {
  /** Which promotion. One today; a second is a new literal here, never a reused id. */
  id: "newyear";
  /** Whole percent off, as configured (1–90). */
  percent: number;
  /** Free days the promotion adds; 0 = none. */
  trialDays: number;
  /** When it stops being live — an ISO-8601 instant, exclusive. */
  endsAt: string;
  /** The App Store offer code to redeem on the phone; null when none is configured. */
  iosCode: string | null;
}

/**
 * The admin's arm for the decline → offer, per platform (ieat-app#3155), read off a profile
 * answer's `exitOfferEnabled`. Present AND true means on — anything else is off, including a
 * server that predates the field and sends none at all, which is why the parameter's own type
 * lets the field be absent rather than asking every caller to cast an old answer into a new one.
 */
export function exitOfferOn(
  profile: { exitOfferEnabled?: ExitOfferSwitches } | null | undefined,
  platform: "ios" | "web",
): boolean {
  return profile?.exitOfferEnabled?.[platform] === true;
}

/**
 * A price string's own zero (#3442): B's "Try for {price}" on the web, where the browser holds the
 * server's formatted strings and no currency. The number run is replaced by 0, keeping the sign, its
 * side and the decimal mark — "€39.99" → "€0.00", "39,99 €" → "0,00 €", "¥4,800" → "¥0". A
 * separator followed by one or two digits is a decimal mark; three is grouping. Null when the string
 * holds no number, so the caller draws its wordless fallback rather than a wrong zero.
 */
export function zeroLike(price: string): string | null {
  const m = /\d(?:[\d.,'’\s  ]*\d)?/.exec(price);
  if (m === null) return null;
  const dec = /[.,](\d{1,2})$/.exec(m[0]);
  const zero = dec ? `0${dec[0][0]}${"0".repeat(dec[1]!.length)}` : "0";
  return price.slice(0, m.index) + zero + price.slice(m.index + m[0].length);
}
