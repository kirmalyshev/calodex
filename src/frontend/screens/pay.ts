// The plans (#263): `#/pay`, drawn as the phone's Cal AI sheet (ieat-app#3465, boards pay-cal-a/b/c):
// a full-screen sheet — the nav leaves the tree and the pane is a phone-width column centred at
// any width. A the plans → × → B try for free (while the trial is sold) → × → C the exit offer
// (once per account, web/pay-exit #451, while the admin's web switch is on) → × closes. Only A
// carries the photo; B and C drop it, like the phone.
//
// Everything sellable arrives in `ProfileResponse.paywall` (#77): the plans' checkout links with
// this account's id already filled, the prices formatted in its language, the per-month figures,
// the offer's struck price (twelve monthlies, ieat-app#3442) and percent, and the footer's
// Terms/Privacy hrefs. The screen computes no price and builds no link — a null plan is a plan
// the host does not sell and never draws; B's zero is the yearly price's own (`zeroLike`). The
// trial rides the picked plan's days: the trial words while one is sold, the renewal otherwise.

import { fill } from "../../shared/lang.ts";
import { WELCOME_PLATES } from "../../shared/onboarding.ts";
import { paywallPercent, zeroLike, type ExitOffer, type PaywallPlan, type WebPaywall } from "../../shared/paywall.ts";
import { payCopyFor } from "../../shared/app/pay-copy.ts";
import { redeemCopyFor } from "../../shared/app/redeem-copy.ts";
import { billedAround, trialBillLine, welcomePlateAlt } from "../../shared/app/pay-lines.ts";
import { ico, payPlans as payPlansMarkup } from "../../shared/ui/kit.ts";
import { COPY, el, lang, type Frame } from "../shell.ts";
import { kitEl } from "../kit.ts";
import * as analytics from "../analytics.ts";
import { ApiError, redeemPromoCode } from "../api.ts";

/** The pay sheet's hero — the welcome plate the phone's sheet draws on A (ieat-app#3465), served
    by the backend off shared/assets/img on this origin. The alt names the plate's own figures
    (#2862/#2863). */
const HERO_SRC = "/start/assets/img/frenchtoast.webp";

/** The exit offer's once-per-account flag, keyed by the account id — a second account on this
    browser still gets its one show. Not the bearer: a flag authenticates nothing. A read that
    fails is "not seen" — the in-memory `offered` below still bounds it to once a visit. */
const SEEN = "eait:exit-offer:";
const offerSeen = (uid: string): boolean => {
  try { return localStorage.getItem(SEEN + uid) !== null; } catch { return false; }
};
const markOfferSeen = (uid: string): void => {
  try { localStorage.setItem(SEEN + uid, "1"); } catch { /* a storage that refuses shows it again */ }
};

interface PlanPick { value: "yearly" | "monthly" | "newyear"; plan: PaywallPlan }

/** A's plan rows (Cal AI 04): Yearly over Monthly, each a real radio so selection works as it does
    on `/start`'s markup — the plan picked is the plan the CTA buys. Yearly carries the trial as a
    band on top, its billed price under the name (3.1.2(c)) and its per-month figure on the right;
    its NAME carries the saving the server derives (`YearlyPlan.save`, the phone's `planSave`).
    `null` is "nothing to pick": the caller draws the host-sells-nothing offer.
    While `promoYearly` is sent (ieat-app#3606, pay-cal-a-newyear) Yearly is the promotion: its
    band, its bare name, the regular price struck before its own, and `/start/checkout?plan=newyear`
    — the same link `/start/offer` submits to. */
function planPair(w: WebPaywall, pay: ReturnType<typeof payCopyFor>, label: string, offer: ExitOffer | null = null):
    { group: HTMLElement; picked: () => PlanPick | null } | null {
  // C (ieat-app#3617, #3630): the exit offer takes Yearly's row — its percent in the band, the
  // regular struck before the billed price. No promotion and no trial on C.
  const ny = offer === null && w.yearly !== null ? w.promoYearly : null;
  const band = offer !== null ? fill(pay.offerOff, { percent: paywallPercent(offer.percentOff, lang) })
    : ny !== null ? fill(pay.promoBand, { percent: paywallPercent(ny.percent, lang) })
    : w.trialDays > 0 ? fill(pay.trialBadge, { days: String(w.trialDays) }) : null;
  const row = (value: PlanPick["value"], name: string, billed: (string | HTMLElement)[] | null, perMonth: string,
      trial: string | null, checked: boolean): HTMLElement => {
    const lab = el("label", "plan2");
    const input = el("input", "") as HTMLInputElement;
    input.type = "radio";
    input.name = "plan";
    input.value = value;
    if (checked) input.checked = true;
    lab.append(input);
    if (trial !== null) lab.append(el("div", "band", trial));
    const nr = el("div", "nr");
    const nm = el("div", "nmc");
    nm.append(el("div", "nm", name));
    if (billed !== null) {
      const small = el("small", "billed");
      small.append(...billed);
      nm.append(small);
    }
    nr.append(el("i", "ck"), nm, el("div", "pm num", perMonth));
    lab.append(nr);
    return lab;
  };
  const cards: PlanPick[] = [];
  const group = el("div", "pwp2");
  group.setAttribute("role", "radiogroup");
  group.setAttribute("aria-label", label);
  if (offer !== null) {
    const [before, after] = billedAround(pay);
    cards.push({ value: "yearly", plan: offer });
    group.append(row("yearly", pay.planYearly,
      [before, el("s", "", offer.regularPrice), " ", offer.price, after],
      fill(pay.perMonthShort, { price: offer.perMonth }), band, true));
  } else if (w.yearly !== null && ny !== null) {
    const [before, after] = billedAround(pay);
    cards.push({ value: "newyear", plan: { checkoutUrl: "/start/checkout?plan=newyear", price: ny.price } });
    group.append(row("newyear", pay.planYearly,
      [before, el("s", "", w.yearly.price), " ", el("b", "", ny.price), after],
      fill(pay.perMonthShort, { price: ny.pricePerMonth }), band, true));
  } else if (w.yearly !== null) {
    cards.push({ value: "yearly", plan: w.yearly });
    group.append(row("yearly",
      w.yearly.save === null ? pay.planYearly : `${pay.planYearly} · ${w.yearly.save}`,
      [fill(pay.billedYearly, { price: w.yearly.price })],
      fill(pay.perMonthShort, { price: w.yearly.pricePerMonth }), band, true));
  }
  if (w.monthly !== null) {
    cards.push({ value: "monthly", plan: w.monthly });
    group.append(row("monthly", pay.planMonthly, null,
      fill(pay.perMonthShort, { price: w.monthly.price }), null, offer === null && w.yearly === null));
  }
  if (cards.length === 0) return null;
  const picked = (): PlanPick | null => {
    const sel = group.querySelector<HTMLInputElement>("input[name=plan]:checked");
    return cards.find((c) => c.value === sel?.value) ?? null;
  };
  return { group, picked };
}

export function payScreen(frame: Frame): HTMLElement {
  const box = el("section", "pay");
  const sheet = el("div", "sheet");
  const pay = payCopyFor(lang);
  const w = frame.me?.paywall;
  // An account already entitled has no plans left to draw: the fallthrough lands Home, as an
  // unbound route does. A host that sells nothing still shows the offer the flow always drew —
  // one named, checked radio and the `/start/checkout` route, which is a 404 on exactly such a
  // host — the shape the offer had before the plans learned prices and selection.
  if (frame.me?.entitlement?.active === true) {
    location.hash = "#/";
    return box;
  }
  const plans = w === undefined ? null : planPair(w, pay, COPY.offerPlans);
  // `#/pay?blocked` is the spent free sample's link (`log.ts`); every other way in — the settings
  // row, a `subscription` push — is source `settings`.
  const blocked = location.hash.includes("?blocked");
  analytics.capture("paywall_opened", { blocked, source: blocked ? "blocked" : "settings" });
  const sold = () => {
    const sel = plans?.picked() ?? null;
    return { plan: sel?.value ?? "monthly", trial_shown: sel?.value === "yearly" && (w?.trialDays ?? 0) > 0, storefront: null };
  };

  // A redeemed DISCOUNT code (S4, #3695): RevenueCat's own code, appended to every checkout link below.
  let discount: string | null = null;
  const buy = (href: string): string =>
    discount === null ? href : `${href}${href.includes("?") ? "&" : "?"}discount_code=${encodeURIComponent(discount)}`;
  let relink = (): void => { /* set where the plans exist */ };

  // The × over the photo, top-left like the phone's CloseButton.
  const close = el("a", "ib x") as HTMLAnchorElement;
  close.href = "#/";
  close.setAttribute("aria-label", pay.closeLabel);
  close.append(kitEl(ico("x")));

  // Only A carries the photo; B and C drop it like the phone does (`dropHero`), and the pane
  // takes the whole sheet (`:has(.hero)` in the css decides).
  const hero = el("div", "hero");
  const img = el("img", "") as HTMLImageElement;
  img.src = HERO_SRC;
  img.alt = welcomePlateAlt(WELCOME_PLATES["french-toast"], lang);
  hero.append(img);
  const dropHero = (): void => { hero.remove(); };

  const pane = el("div", "pane");
  const col = el("div", "pcol");
  // Cal AI 04: the title promises the trial only while the picked plan carries one.
  const title = el("h1", "d d22");
  col.append(title);

  const go = el("a", "cta p") as HTMLAnchorElement;
  const note = el("p", "t12 m");
  if (w === undefined || plans === null) {
    col.append(kitEl(payPlansMarkup(
      [{ value: "monthly", name: pay.planMonthly, checked: true }], COPY.offerPlans)));
    go.href = "/start/checkout";
    // No paywall config means nothing about a trial is known — Continue, not a promise of one.
    title.textContent = fill(pay.plansUnlockTitle, {});
    go.textContent = pay.continueCta;
    note.textContent = "";
  } else {
    const update = (): void => {
      const sel = plans.picked();
      if (sel === null) return;
      go.href = buy(sel.plan.checkoutUrl);
      // The trial is on yearly only: the trial words ride while yearly is picked; a plan that
      // sells no trial takes the store's own Subscribe (the phone's subscribePhone). The New Year
      // promotion is the board's Continue, no trial, and its own footer (pay-cal-a-newyear).
      // A discount overrides the trial at checkout (RevenueCat), so the sheet stops promising one.
      const days = sel.value === "yearly" && discount === null ? w.trialDays : 0;
      const ny = sel.value === "newyear" && w.yearly !== null ? w.promoYearly : null;
      title.textContent = days > 0 ? fill(pay.plansTrialTitle, { days: String(days) }) : fill(pay.plansUnlockTitle, {});
      go.textContent = days > 0 || ny !== null ? pay.continueCta : pay.subscribePhone;
      // #3465: the billed amount is said ONCE on this screen — the Yearly row's own line (3.1.2(c)).
      // The line under the CTA is the price-free renewsPlain, but for the promotion's own terms.
      note.textContent = ny !== null && w.yearly !== null
        ? fill(pay.promoFooter, { price: ny.price, regular: w.yearly.price }) : pay.renewsPlain;
    };
    plans.group.addEventListener("change", update);
    relink = update;
    plans.group.addEventListener("change", () => analytics.capture("paywall_plan_selected", sold()));
    update();
    col.append(plans.group);
  }
  col.append(go, note);
  go.addEventListener("click", () => analytics.capture("paywall_purchase_started", sold()));
  // The footer — board you-subscription / pay-cal-a, web line (S4, #3695): `Redeem code` then
  // `Terms · Privacy`, two groups; no Restore (the web has no store to restore from; a purchase lands
  // here by webhook). Terms and Privacy only where the operator publishes them (`WebPaywall` carries
  // "" for a link it does not have). Both states of the column draw it, so it is built on demand.
  const redeemWords = redeemCopyFor(lang);
  const legal = (): HTMLElement => {
    const foot = el("p", "t12 m paylinks");
    const form = el("form", "redeem") as HTMLFormElement;
    form.hidden = true;
    const field = el("input", "") as HTMLInputElement;
    field.type = "text";
    field.name = "code";
    field.autocomplete = "off";
    field.autocapitalize = "characters";
    field.maxLength = 40;
    field.required = true;
    field.setAttribute("aria-label", redeemWords.redeemField);
    field.placeholder = redeemWords.redeemField;
    const submit = el("button", "cta s", redeemWords.redeemSubmit) as HTMLButtonElement;
    submit.type = "submit";
    const status = el("p", "t12 m");
    status.setAttribute("role", "status");
    form.append(field, submit, status);
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      submit.disabled = true;
      status.textContent = "";
      void redeemPromoCode(field.value).then((out) => {
        if (out.kind === "free") {
          // Entitled through `bonus_until`: Home reads the profile afresh and the sheet is gone.
          location.hash = "#/";
          location.reload();
          return;
        }
        discount = out.discountCode;
        status.textContent = fill(redeemWords.redeemDiscount, { percent: paywallPercent(out.percent ?? 0, lang) });
        // The sheet is C's values without the trial: the percent in Yearly's band, never "N days free".
        const yearly = col.querySelector<HTMLElement>(".pwp2 .plan2");
        if (yearly !== null) {
          const band = yearly.querySelector<HTMLElement>(".band") ?? yearly.insertBefore(el("div", "band"), yearly.firstChild!.nextSibling);
          band.textContent = fill(pay.offerOff, { percent: paywallPercent(out.percent ?? 0, lang) });
        }
        relink();
      }).catch((err: unknown) => {
        // A refusal drops a discount held from an earlier code, so the links never carry what the status disowns.
        discount = null;
        relink();
        if (!(err instanceof ApiError)) return;
        const kind = err.body?.error;
        status.textContent = kind === "promo-already" ? redeemWords.redeemAlready
          : kind === "promo-unknown" ? redeemWords.redeemUnknown
          : kind === "promo-expired" || kind === "promo-exhausted" ? redeemWords.redeemEnded : "";
      }).finally(() => { submit.disabled = false; });
    });
    const redeemLink = el("a", "", pay.redeemLink) as HTMLAnchorElement;
    redeemLink.href = "#/pay";
    redeemLink.setAttribute("role", "button");
    redeemLink.addEventListener("click", (ev) => {
      ev.preventDefault();
      form.hidden = !form.hidden;
      if (!form.hidden) field.focus();
    });
    const groups: HTMLElement[] = [];
    const g1 = el("span", "g");
    g1.append(redeemLink);
    groups.push(g1);
    const links: [words: string, href: string][] = [];
    if ((w?.termsUrl ?? "") !== "") links.push([pay.termsLink, w!.termsUrl]);
    if ((w?.privacyUrl ?? "") !== "") links.push([pay.privacyLink, w!.privacyUrl]);
    if (links.length > 0) {
      const g2 = el("span", "g");
      links.forEach(([words, href], i) => {
        if (i > 0) g2.append(" · ");
        const a = el("a", "", words) as HTMLAnchorElement;
        a.href = href;
        a.target = "_blank";
        a.rel = "noopener";
        g2.append(a);
      });
      groups.push(g2);
    }
    groups.forEach((g, i) => {
      if (i > 0) foot.append(el("span", "sep", " · "));
      foot.append(g);
    });
    const wrap = el("div", "foot");
    wrap.append(foot, form);
    return wrap;
  };
  col.append(legal());

  // A step swap replaces the whole column: focus would fall to <body>, so the screen reader would
  // stay silent on the new screen. The new h1 takes it (tabindex -1: focusable, not a tab stop).
  const focusTitle = (): void => {
    const h = col.querySelector<HTMLElement>("h1");
    if (h === null) return;
    h.tabIndex = -1;
    h.focus({ preventScroll: true });
  };

  // B · try for free (Cal AI 06): the trial as a timeline — today, the reminder the day before it
  // ends, the day it bills (its `what` IS the billed line, said once, #3465) — then "No payment
  // due now" and the yearly checkout priced at its zero. No photo: the pane takes the sheet.
  const showTry = (yearly: PaywallPlan, days: number): void => {
    dropHero();
    const renewal = fill(pay.pricePerYear, { price: yearly.price });
    const steps = el("ol", "tl");
    for (const [ic, when, what, billed] of [
      ["check", pay.tryToday, pay.benefitPlan, false],
      ["clock", fill(pay.tryDay, { day: String(Math.max(1, days - 1)) }), pay.tryRemind, false],
      // 3.1.2(c): the billed amount and its day, at the weight of the zero on the button below.
      ["card", fill(pay.tryDay, { day: String(days) }),
        trialBillLine(pay, lang, Intl.DateTimeFormat().resolvedOptions().timeZone, new Date(), days, renewal), true],
    ] as const) {
      const li = el("li", "");
      const dot = el("i", "td");
      dot.append(kitEl(ico(ic)));
      li.append(dot, el("b", "", when), el("span", billed ? "num" : "t13 m", what));
      steps.append(li);
    }
    const zero = zeroLike(yearly.price);
    const cta = el("a", "cta p", zero === null ? pay.continueCta : fill(pay.tryCta, { price: zero })) as HTMLAnchorElement;
    cta.href = buy(yearly.checkoutUrl);
    cta.addEventListener("click", () => analytics.capture("paywall_purchase_started", { plan: "yearly", trial_shown: true, storefront: null }));
    const nopay = el("p", "nopay");
    nopay.append(kitEl(ico("check")), pay.noPaymentDue);
    // No photo on B, so nothing floats (ieat-app#3505): `margin: auto 0` centres the timeline in
    // the space the title and the CTA block leave — the phone's `s.tryMid`.
    const parts: HTMLElement[] = [el("h1", "d d28", fill(pay.tryTitle, {})), steps,
      nopay, cta, el("p", "t12 m", pay.renewsPlain)];
    parts.push(legal());
    col.replaceChildren(...parts);
    focusTitle();
  };

  // C · the special offer is A with values changed (Kirill q90 = A, ieat-app#3617, #3630; boards
  // pay-cal-c, pay-cal-c-notrial): A's photo and plan rows with the offer on Yearly's, Claim, and
  // A's one note carrying the offer's renewal while it is picked. The web offer sells no free days,
  // so the title is A's unlock title.
  const showOffer = (offer: ExitOffer): void => {
    if (!hero.isConnected) sheet.insertBefore(hero, pane);
    const pair = planPair(w!, pay, COPY.offerPlans, offer)!;
    const claim = el("a", "cta p") as HTMLAnchorElement;
    const line = el("p", "t12 m");
    const sync = (): void => {
      const sel = pair.picked();
      if (sel === null) return;
      const isOffer = sel.plan === offer;
      claim.href = buy(sel.plan.checkoutUrl);
      claim.textContent = isOffer ? pay.offerClaim : pay.subscribePhone;
      line.textContent = isOffer ? fill(pay.renewNoteYearly, { price: offer.price }) : pay.renewsPlain;
    };
    pair.group.addEventListener("change", sync);
    sync();
    claim.addEventListener("click", () => {
      if (pair.picked()?.plan === offer) analytics.capture("paywall_offer_step", { step: "claimed" });
      else analytics.capture("paywall_purchase_started", { plan: "monthly", trial_shown: false, storefront: null });
    });
    const parts: HTMLElement[] = [el("h1", "d d22", fill(pay.plansUnlockTitle, {})), pair.group, claim, line];
    parts.push(legal());
    col.replaceChildren(...parts);
    focusTitle();
  };

  // The × walks A → B → C, then closes (Kirill, 24 Nov: exactly Cal AI). B only while the yearly
  // trial is sold; C once per account (`offered` this mount, the stored flag across visits) and only
  // while the server sent an offer, which it does only while the admin's web switch is on.
  let step: "plans" | "try" | "offer" = "plans";
  close.addEventListener("click", (ev) => {
    const offer = w?.exitOffer ?? null;
    const uid = frame.me?.profile.user_id;
    // While the promotion is drawn and `skipTrialStep` (ieat-app#3606), no B: × on its A closes.
    const skipTry = discount !== null || (frame.me?.promo?.skipTrialStep === true && w?.promoYearly != null);
    if (step === "plans" && w?.yearly != null && w.trialDays > 0 && !skipTry) {
      ev.preventDefault();
      step = "try";
      showTry(w.yearly, w.trialDays);
      return;
    }
    if (step === "offer" || offer === null || uid === undefined || offerSeen(uid)) {
      if (step === "offer") analytics.capture("paywall_offer_step", { step: "declined" });
      analytics.capture("paywall_dismissed", { result: "cancelled", blocked });
      return;
    }
    analytics.capture("paywall_offer_step", { step: "shown" });
    ev.preventDefault();
    step = "offer";
    markOfferSeen(uid);
    showOffer(offer);
  });

  pane.append(col);
  sheet.append(close, hero, pane);
  box.append(sheet);
  return box;
}
