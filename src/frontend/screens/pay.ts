// The plans (#263): `#/pay`, drawn on Cal AI's paywall flow (ieat-app#3442, boards pay-cal-a/b/c —
// the phone's three steps): A the plans → × → B try for free (while the trial is sold) → × → C the
// exit offer (once per account, web/pay-exit #451, while the admin's web switch is on) → × closes.
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
import { welcomePlateAlt } from "../../shared/app/pay-lines.ts";
import { ico, payPlans as payPlansMarkup } from "../../shared/ui/kit.ts";
import { COPY, el, lang, type Frame } from "../shell.ts";
import { kitEl } from "../kit.ts";
import * as analytics from "../analytics.ts";

/** The web's welcome plate — the grain bowl `/start` opens with, served by the backend off
    shared/assets/img on this origin. The alt names the plate's own figures (#2862/#2863). */
const HERO_SRC = "/start/assets/img/hero.webp";

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
    band on top, its billed price under the name (3.1.2(c)) and its per-month figure on the right.
    `null` is "nothing to pick": the caller draws the host-sells-nothing offer. */
function planPair(w: WebPaywall, pay: ReturnType<typeof payCopyFor>, label: string):
    { group: HTMLElement; picked: () => PlanPick | null } | null {
  const band = w.trialDays > 0 ? fill(pay.trialBadge, { days: String(w.trialDays) }).toLocaleUpperCase(lang) : null;
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
    group.append(row("yearly", pay.planYearly, fill(pay.billedYearly, { price: w.yearly.price }),
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

  const hero = el("div", "hero");
  const img = el("img", "") as HTMLImageElement;
  img.src = HERO_SRC;
  img.alt = welcomePlateAlt(WELCOME_PLATES["grain-bowl"], lang);
  hero.append(img);

  const pane = el("div", "pane");
  const close = el("a", "ib x") as HTMLAnchorElement;
  close.href = "#/";
  close.setAttribute("aria-label", pay.closeLabel);
  close.append(kitEl(ico("x")));

  const col = el("div", "pcol");
  // Cal AI 04: the title promises the trial only while the picked plan carries one.
  const title = el("h1", "d d34");
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
      // The trial is on yearly only: the trial CTA and `{renewal}` ride while yearly is picked
      // (yearly's own `pricePerYear`), and monthly names its monthly renewal instead.
      const days = sel.value === "yearly" ? w.trialDays : 0;
      title.textContent = days > 0 ? fill(pay.plansTrialTitle, { days: String(days) }) : fill(pay.plansUnlockTitle, {});
      go.textContent = pay.continueCta;
      if (days > 0) {
        note.textContent = fill(pay.trialNote, { renewal: fill(pay.pricePerYear, { price: sel.plan.price }) });
      } else {
        note.textContent = fill(
          sel.value === "yearly" ? pay.renewNoteYearly : pay.renewNoteMonthly,
          { price: sel.plan.price });
      }
    };
    plans.group.addEventListener("change", update);
    plans.group.addEventListener("change", () => analytics.capture("paywall_plan_selected", sold()));
    update();
    col.append(plans.group);
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

  // B · try for free (Cal AI 06): the trial as a timeline — today, the reminder the day before it
  // ends, the day it bills — then "No payment due now" and the yearly checkout priced at its zero.
  const showTry = (yearly: PaywallPlan, days: number): void => {
    const renewal = fill(pay.pricePerYear, { price: yearly.price });
    const steps = el("ol", "tl");
    for (const [when, what] of [
      [pay.tryToday, pay.benefitPlan],
      [fill(pay.tryDay, { day: String(Math.max(1, days - 1)) }), pay.tryRemind],
      [fill(pay.tryDay, { day: String(days) }), fill(pay.tryBill, { renewal })],
    ] as const) {
      const li = el("li", "");
      li.append(el("b", "", when), el("span", "t13 m", what));
      steps.append(li);
    }
    const zero = zeroLike(yearly.price);
    const cta = el("a", "cta p", zero === null ? pay.continueCta : fill(pay.tryCta, { price: zero })) as HTMLAnchorElement;
    cta.href = yearly.checkoutUrl;
    cta.addEventListener("click", () => analytics.capture("paywall_purchase_started", { plan: "yearly", trial_shown: true, storefront: null }));
    const parts: HTMLElement[] = [el("h1", "d d28", fill(pay.tryTitle, {})), steps,
      el("p", "nopay", pay.noPaymentDue), cta, el("p", "t12 m", fill(pay.trialNote, { renewal }))];
    const foot = legal();
    if (foot !== null) parts.push(foot);
    col.replaceChildren(...parts);
  };

  // C · the special offer (Cal AI 12, web/pay-exit #451): one card — the percent, twelve monthlies
  // struck through, the offer per year, and the monthly-rate line while a monthly plan is sold.
  const showOffer = (offer: NonNullable<WebPaywall["exitOffer"]>): void => {
    const card = el("div", "offer pop");
    card.append(
      el("div", "off num", fill(pay.offerOff, { percent: paywallPercent(offer.percentOff, lang) }).toLocaleUpperCase(lang)),
      el("div", "hr"),
    );
    const price = el("div", "price num");
    price.append(el("s", "", offer.regularPrice), el("span", "", fill(pay.offerPrice, { price: offer.price })));
    card.append(price, el("p", "t13 m num per", w?.monthly != null
      ? fill(pay.offerVsMonthly, { percent: paywallPercent(offer.percentOff, lang) })
      : fill(pay.offerPerMonth, { price: offer.perMonth })));
    const claim = el("a", "cta p", pay.offerClaim) as HTMLAnchorElement;
    claim.href = offer.checkoutUrl;
    claim.addEventListener("click", () => analytics.capture("paywall_offer_step", { step: "claimed" }));
    const parts: HTMLElement[] = [el("h1", "d d28", pay.offerSpecialTitle), el("p", "m sub", fill(pay.offerSub, {})),
      card, claim, el("p", "t12 m", pay.offerNote)];
    const foot = legal();
    if (foot !== null) parts.push(foot);
    col.replaceChildren(...parts);
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

  pane.append(close, col);
  box.append(hero, pane);
  return box;
}
