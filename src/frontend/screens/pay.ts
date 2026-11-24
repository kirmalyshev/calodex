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
import { paywallPercent, zeroLike, type PaywallPlan, type WebPaywall } from "../../shared/paywall.ts";
import { payCopyFor } from "../../shared/app/pay-copy.ts";
import { trialBillLine, welcomePlateAlt } from "../../shared/app/pay-lines.ts";
import { ico, payPlans as payPlansMarkup } from "../../shared/ui/kit.ts";
import { COPY, el, lang, type Frame } from "../shell.ts";
import { kitEl } from "../kit.ts";
import * as analytics from "../analytics.ts";

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

interface PlanPick { value: "yearly" | "monthly"; plan: PaywallPlan }

/** A's plan rows (Cal AI 04): Yearly over Monthly, each a real radio so selection works as it does
    on `/start`'s markup — the plan picked is the plan the CTA buys. Yearly carries the trial as a
    band on top, its billed price under the name (3.1.2(c)) and its per-month figure on the right;
    its NAME carries the saving the server derives (`YearlyPlan.save`, the phone's `planSave`).
    `null` is "nothing to pick": the caller draws the host-sells-nothing offer. */
function planPair(w: WebPaywall, pay: ReturnType<typeof payCopyFor>, label: string):
    { group: HTMLElement; picked: () => PlanPick | null } | null {
  const band = w.trialDays > 0 ? fill(pay.trialBadge, { days: String(w.trialDays) }) : null;
  const row = (value: "yearly" | "monthly", name: string, billed: string | null, perMonth: string,
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
    if (billed !== null) nm.append(el("small", "billed", billed));
    nr.append(el("i", "ck"), nm, el("div", "pm num", perMonth));
    lab.append(nr);
    return lab;
  };
  const cards: PlanPick[] = [];
  const group = el("div", "pwp2");
  group.setAttribute("role", "radiogroup");
  group.setAttribute("aria-label", label);
  if (w.yearly !== null) {
    cards.push({ value: "yearly", plan: w.yearly });
    group.append(row("yearly",
      w.yearly.save === null ? pay.planYearly : `${pay.planYearly} · ${w.yearly.save}`,
      fill(pay.billedYearly, { price: w.yearly.price }),
      fill(pay.perMonthShort, { price: w.yearly.pricePerMonth }), band, true));
  }
  if (w.monthly !== null) {
    cards.push({ value: "monthly", plan: w.monthly });
    group.append(row("monthly", pay.planMonthly, null,
      fill(pay.perMonthShort, { price: w.monthly.price }), null, w.yearly === null));
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
      go.href = sel.plan.checkoutUrl;
      // The trial is on yearly only: the trial words ride while yearly is picked; a plan that
      // sells no trial takes the store's own Subscribe (the phone's subscribePhone).
      const days = sel.value === "yearly" ? w.trialDays : 0;
      title.textContent = days > 0 ? fill(pay.plansTrialTitle, { days: String(days) }) : fill(pay.plansUnlockTitle, {});
      go.textContent = days > 0 ? pay.continueCta : pay.subscribePhone;
    };
    plans.group.addEventListener("change", update);
    plans.group.addEventListener("change", () => analytics.capture("paywall_plan_selected", sold()));
    update();
    col.append(plans.group);
    // #3465: the billed amount is said ONCE on this screen — the Yearly row's own line (3.1.2(c)).
    // The line under the CTA is the price-free renewsPlain on every step that carries it.
    note.textContent = pay.renewsPlain;
  }
  col.append(go, note);
  go.addEventListener("click", () => analytics.capture("paywall_purchase_started", sold()));
  // The footer's legal links — only the ones the operator publishes (`WebPaywall` carries "" for
  // a link it does not have). No Restore: the web has no store to restore from; a purchase lands
  // here by webhook. Both states of the column draw it, so it is built on demand.
  const legal = (): HTMLElement | null => {
    const links: [words: string, href: string][] = [];
    if ((w?.termsUrl ?? "") !== "") links.push([pay.termsLink, w!.termsUrl]);
    if ((w?.privacyUrl ?? "") !== "") links.push([pay.privacyLink, w!.privacyUrl]);
    if (links.length === 0) return null;
    const foot = el("p", "t12 m paylinks");
    links.forEach(([words, href], i) => {
      if (i > 0) foot.append(" · ");
      const a = el("a", "", words) as HTMLAnchorElement;
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener";
      foot.append(a);
    });
    return foot;
  };
  const plansFoot = legal();
  if (plansFoot !== null) col.append(plansFoot);

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
    cta.href = yearly.checkoutUrl;
    cta.addEventListener("click", () => analytics.capture("paywall_purchase_started", { plan: "yearly", trial_shown: true, storefront: null }));
    const nopay = el("p", "nopay");
    nopay.append(kitEl(ico("check")), pay.noPaymentDue);
    const parts: HTMLElement[] = [el("h1", "d d28", fill(pay.tryTitle, {})), steps,
      el("div", "fill"), nopay, cta, el("p", "t12 m", pay.renewsPlain)];
    const foot = legal();
    if (foot !== null) parts.push(foot);
    col.replaceChildren(...parts);
    focusTitle();
  };

  // C · the special offer (Cal AI 12, web/pay-exit #451): one card — the percent, twelve monthlies
  // struck through, the offer per year, and the monthly-rate line while a monthly plan is sold —
  // then the claim and ONE legal line (the renewal at the offer price). No subtitle, no photo.
  const showOffer = (offer: NonNullable<WebPaywall["exitOffer"]>): void => {
    dropHero();
    const card = el("div", "offer pop");
    card.append(
      el("div", "off num", fill(pay.offerOff, { percent: paywallPercent(offer.percentOff, lang) }).toUpperCase()),
      el("div", "hr"),
    );
    const price = el("div", "price num");
    price.append(el("s", "", offer.regularPrice), el("span", "", fill(pay.offerPrice, { price: offer.price })));
    card.append(price, el("p", "t13 m num per", w?.monthly != null
      ? fill(pay.offerVsMonthly, { percent: paywallPercent(offer.percentOff, lang) })
      : fill(pay.offerPerMonth, { price: offer.perMonth })));
    const mid = el("div", "mid");
    mid.append(card);
    const claim = el("a", "cta p", pay.offerClaim) as HTMLAnchorElement;
    claim.href = offer.checkoutUrl;
    claim.addEventListener("click", () => analytics.capture("paywall_offer_step", { step: "claimed" }));
    const parts: HTMLElement[] = [el("h1", "d d28", pay.offerSpecialTitle), mid, claim,
      el("p", "t13 m", fill(pay.renewNoteYearly, { price: offer.price }))];
    const foot = legal();
    if (foot !== null) parts.push(foot);
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
    if (step === "plans" && w?.yearly != null && w.trialDays > 0) {
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
