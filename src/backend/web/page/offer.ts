import { fill, payCopyFor, paywallPercent, trialBillLine, zeroLike } from "@eait/shared";
import type { Lang, WebPaywall } from "@eait/shared";
import { pageCopyFor } from "../copy.ts";
import { escape, shell } from "./shell.ts";

/**
 * The web offer before sign-up (ieat-app#3464), Cal AI's flow in three server-rendered steps:
 * A the plans → × → B try for free → × → C the special offer → × the sign-up. Same words and the
 * same figures as the in-app `#/pay` (`frontend/screens/pay.ts`): every price arrives formatted
 * in `paywall` (the engine's `paywallOf`), the page computes none. No script — A's checked radio
 * rides the form's GET as `?plan=`, its title and note follow it through `:has`, and each × is
 * a link to the next step.
 */
export type OfferStep = "plans" | "try" | "offer";

export interface OfferView {
  step: OfferStep;
  /** The account's sellable plans, prices and checkout links — `paywallOf`'s answer. */
  paywall: WebPaywall;
  /** `/start/checkout`, A's form action — it fills `{userId}` from the session, never a client. */
  checkoutUrl: string;
  /** The published privacy policy, or null where no landing is configured to publish one. */
  privacyHref: string | null;
  /** The terms document — the operator's `TERMS_URL`, or null where none is published. */
  termsHref: string | null;
  /** Where × goes: the next step, or after the last one the flow's own next place. */
  closeHref: string;
  /** The host's zone, for the day billing starts. */
  timezone: string;
  now: Date;
  lang: Lang;
}

export function offer(v: OfferView): string {
  const PAGE_COPY = pageCopyFor(v.lang);
  const pay = payCopyFor(v.lang);
  const w = v.paywall;
  const legal: string[] = [];
  if (v.termsHref !== null) legal.push(`<a href="${escape(v.termsHref)}">${escape(pay.termsLink)}</a>`);
  if (v.privacyHref !== null) legal.push(`<a href="${escape(v.privacyHref)}">${escape(pay.privacyLink)}</a>`);
  const fine = legal.length === 0 ? "" : `<p class="fine">${legal.join(" · ")}</p>`;
  const x = `<a class="x" href="${escape(v.closeHref)}" aria-label="${escape(PAGE_COPY.offerClose)}">×</a>`;
  const cta = (href: string, words: string): string =>
    `<a class="button primary" href="${escape(href)}">${escape(words)}</a>`;
  const page = (inner: string): string => shell(PAGE_COPY.titleOffer, `
<div class="offer">
${x}
${inner}
${fine}
</div>
`, v.lang);

  if (v.step === "try" && w.yearly !== null) {
    const days = w.trialDays;
    const renewal = fill(pay.pricePerYear, { price: w.yearly.price });
    const zero = zeroLike(w.yearly.price);
    const li = (when: string, what: string, cls = ""): string => `<li${cls === "" ? "" : ` class="${cls}"`}><b>${escape(when)}</b><span>${escape(what)}</span></li>`;
    return page(`<h1>${escape(fill(pay.tryTitle, {}))}</h1>
<ol class="tl">
${li(pay.tryToday, pay.benefitPlan)}
${li(fill(pay.tryDay, { day: String(Math.max(1, days - 1)) }), pay.tryRemind)}
${li(fill(pay.tryDay, { day: String(days) }), trialBillLine(pay, v.lang, v.timezone, v.now, days, renewal), "bill")}
</ol>
<p class="nopay">${escape(pay.noPaymentDue)}</p>
${cta(`${v.checkoutUrl}?plan=yearly`, zero === null ? pay.continueCta : fill(pay.tryCta, { price: zero }))}`);
  }

  if (v.step === "offer" && w.exitOffer !== null) {
    const o = w.exitOffer;
    const percent = paywallPercent(o.percentOff, v.lang);
    return page(`<h1>${escape(pay.offerSpecialTitle)}</h1>
<p class="sub">${escape(fill(pay.offerSub, {}))}</p>
<div class="card special">
<div class="off num">${escape(fill(pay.offerOff, { percent }))}</div>
<div class="price num"><s>${escape(o.regularPrice)}</s><span>${escape(fill(pay.offerPrice, { price: o.price }))}</span></div>
<p class="per num">${escape(w.monthly !== null ? fill(pay.offerVsMonthly, { percent }) : fill(pay.offerPerMonth, { price: o.perMonth }))}</p>
</div>
${cta(`${v.checkoutUrl}?plan=exit`, pay.offerClaim)}`);
  }

  // A · the plans: Yearly over Monthly, each a real radio — the plan checked is the plan checkout
  // sends. The trial rides yearly only (pay.ts): its title, band and note follow the pick.
  const days = w.yearly !== null ? w.trialDays : 0;
  const band = days > 0 ? fill(pay.trialBadge, { days: String(days) }) : null;
  const row = (value: "yearly" | "monthly", name: string, billed: string | null, perMonth: string,
      trial: string | null, checked: boolean): string => `<label class="plan2">
<input type="radio" name="plan" value="${value}"${checked ? " checked" : ""}>
${trial === null ? "" : `<div class="band">${escape(trial)}</div>`}
<div class="nr"><i class="ck"></i><div class="nmc"><div class="nm">${escape(name)}</div>${billed === null ? "" : `<small class="billed">${escape(billed)}</small>`}</div><div class="pm num">${escape(perMonth)}</div></div>
</label>`;
  const rows = [
    w.yearly === null ? "" : row("yearly", pay.planYearly, fill(pay.billedYearly, { price: w.yearly.price }),
      fill(pay.perMonthShort, { price: w.yearly.pricePerMonth }), band, true),
    w.monthly === null ? "" : row("monthly", pay.planMonthly, null,
      fill(pay.perMonthShort, { price: w.monthly.price }), null, w.yearly === null),
  ].join("\n");
  return shell(PAGE_COPY.titleOffer, `
<form class="offer" action="${escape(v.checkoutUrl)}" method="get">
${x}
<h1 class="t-y">${escape(fill(days > 0 ? pay.plansTrialTitle : pay.plansUnlockTitle, { days: String(days) }))}</h1>
<h1 class="t-m">${escape(fill(pay.plansUnlockTitle, {}))}</h1>
<div class="pwp2" role="radiogroup" aria-label="${escape(PAGE_COPY.titlePlan)}">
${rows}
</div>
<button class="button primary" type="submit">${escape(pay.continueCta)}</button>
${fine}
</form>
`, v.lang);
}
