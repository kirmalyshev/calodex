import { billedAround, fill, payCopyFor, paywallPercent, trialBillLine, welcomePlateAlt, WELCOME_PLATES, zeroLike } from "@eait/shared";
import type { ExitOffer, Lang, PayCopy, WebPaywall } from "@eait/shared";
import { pageCopyFor } from "../copy.ts";
import { IMG_URL_DIR } from "./board.ts";
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
  /** A discount code the server honours (S4, #3695), carried through the steps as `code`; null when none. */
  code?: string | null;
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
  const code = v.code ?? null;
  const withCode = (href: string): string => (code === null ? href : `${href}${href.includes("?") ? "&" : "?"}code=${encodeURIComponent(code)}`);
  const fine = offerFoot(v, pay);
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
${cta(withCode(`${v.checkoutUrl}?plan=yearly`), zero === null ? pay.continueCta : fill(pay.tryCta, { price: zero }))}
<p class="note">${escape(pay.renewsPlain)}</p>`);
  }

  // C · the special offer is A with values changed (Kirill q90 = A, ieat-app#3617; boards pay-cal-c,
  // pay-cal-c-notrial): the offer on Yearly's row, its percent in the band, the regular struck before
  // the billed price, Claim, and A's one note carrying the offer's renewal. The web offer sells no
  // free days, so the title is A's unlock title.
  return plans(v.step === "offer" ? w.exitOffer : null);

  function plans(o: ExitOffer | null): string {
    // A · the plans: Yearly over Monthly, each a real radio — the plan checked is the plan checkout
    // sends. The trial rides yearly only (pay.ts): its title, band and note follow the pick.
    // The New Year promotion (ieat-app#3606, pay-cal-a-newyear) swaps values only: no trial, its
    // band, the regular yearly price struck before its own, its footer, and yearly buys plan=newyear.
    const ny = o === null && w.yearly !== null ? w.promoYearly : null;
    const days = o === null && w.yearly !== null && ny === null ? w.trialDays : 0;
    const band = o !== null ? fill(pay.offerOff, { percent: paywallPercent(o.percentOff, v.lang) })
      : ny !== null ? fill(pay.promoBand, { percent: paywallPercent(ny.percent, v.lang) })
      : days > 0 ? fill(pay.trialBadge, { days: String(days) }) : null;
    const row = (value: "yearly" | "monthly" | "newyear" | "exit", name: string, billed: string | null, perMonth: string,
        trial: string | null, checked: boolean): string => `<label class="plan2">
<input type="radio" name="plan" value="${value}"${checked ? " checked" : ""}>
${trial === null ? "" : `<div class="band">${escape(trial)}</div>`}
<div class="nr"><i class="ck"></i><div class="nmc"><div class="nm">${escape(name)}</div>${billed === null ? "" : `<small class="billed">${billed}</small>`}</div><div class="pm num">${escape(perMonth)}</div></div>
</label>`;
    const [before, after] = billedAround(pay);
    const rows = [
      o !== null ? row("exit", pay.planYearly,
        `${escape(before)}<s>${escape(o.regularPrice)}</s> ${escape(o.price)}${escape(after)}`,
        fill(pay.perMonthShort, { price: o.perMonth }), band, true)
      : w.yearly === null ? "" : ny !== null
        ? row("newyear", pay.planYearly,
          `${escape(before)}<s>${escape(w.yearly.price)}</s> <b>${escape(ny.price)}</b>${escape(after)}`,
          fill(pay.perMonthShort, { price: ny.pricePerMonth }), band, true)
        : row("yearly",
          w.yearly.save === null ? pay.planYearly : `${pay.planYearly} · ${w.yearly.save}`,
          escape(fill(pay.billedYearly, { price: w.yearly.price })),
          fill(pay.perMonthShort, { price: w.yearly.pricePerMonth }), band, true),
      w.monthly === null ? "" : row("monthly", pay.planMonthly, null,
        fill(pay.perMonthShort, { price: w.monthly.price }), null, o === null && w.yearly === null),
    ].join("\n");
    // The footer follows the pick like the title: the offer's renewal or the promotion's terms while
    // yearly is checked, A's price-free line while Monthly is.
    const note = o !== null ? `<p class="note t-y">${escape(fill(pay.renewNoteYearly, { price: o.price }))}</p>
<p class="note t-m">${escape(pay.renewsPlain)}</p>`
      : ny === null || w.yearly === null ? `<p class="note">${escape(pay.renewsPlain)}</p>`
      : `<p class="note t-y">${escape(fill(pay.promoFooter, { price: ny.price, regular: w.yearly.price }))}</p>
<p class="note t-m">${escape(pay.renewsPlain)}</p>`;
    return shell(PAGE_COPY.titleOffer, `
<form class="offer" action="${escape(v.checkoutUrl)}" method="get">
${code === null ? "" : `<input type="hidden" name="code" value="${escape(code)}">\n`}<img class="heroimg" src="${IMG_URL_DIR}/frenchtoast.webp" alt="${escape(welcomePlateAlt(WELCOME_PLATES["french-toast"], v.lang))}">
${x}
<h1 class="t-y">${escape(fill(days > 0 ? pay.plansTrialTitle : pay.plansUnlockTitle, { days: String(days) }))}</h1>
<h1 class="t-m">${escape(fill(pay.plansUnlockTitle, {}))}</h1>
<div class="pwp2" role="radiogroup" aria-label="${escape(PAGE_COPY.titlePlan)}">
${rows}
</div>
<button class="button primary" type="submit">${escape(o === null ? pay.continueCta : pay.offerClaim)}</button>
${note}
${fine}
</form>
`, v.lang);
  }
}

/**
 * The offer's foot — board you-subscription / pay-cal-a, web line (S4, #3695): `Redeem code` then
 * `Terms · Privacy`, two groups that never break at a separator, and no Restore (a web purchase
 * lands by webhook, `frontend/screens/pay.ts`). A line too wide for a phone stacks the groups and
 * drops the separator (`long`); the measure is the text, so it is the same on every surface.
 */
export function offerFoot(v: Pick<OfferView, "termsHref" | "privacyHref">, pay: Pick<PayCopy, "redeemLink" | "termsLink" | "privacyLink">): string {
  const link = (href: string, words: string): string => `<a href="${escape(href)}">${escape(words)}</a>`;
  const legal = [
    ...(v.termsHref === null ? [] : [[v.termsHref, pay.termsLink] as const]),
    ...(v.privacyHref === null ? [] : [[v.privacyHref, pay.privacyLink] as const]),
  ];
  const groups = [`<span class="g">${link("/start/redeem", pay.redeemLink)}</span>`];
  if (legal.length > 0) groups.push(`<span class="g">${legal.map(([h, w]) => link(h, w)).join(" · ")}</span>`);
  const width = [pay.redeemLink, ...legal.map(([, w]) => w)].join(" · ").length;
  return `<p class="fine${width > 36 ? " long" : ""}">${groups.join(' <span class="sep">·</span> ')}</p>`;
}
