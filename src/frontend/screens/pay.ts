// The plans (#263): `#/pay` — the web's pay-plans board (W9), drawn as the iOS paywall sheet
// (ieat-app#3359, boards W9/phone-paywall): the welcome-plate hero, the title, its three
// benefits, Yearly and Monthly side by side, the billed amount as each card's figure.
//
// Everything sellable arrives in `ProfileResponse.paywall` (#77): the plans' checkout links with
// this account's id already filled, the prices formatted in its language, the yearly card's
// per-month-plus-save line, and the footer's Terms/Privacy hrefs. The screen computes no price
// and builds no link — a null plan is a plan the host does not sell and never draws. The trial
// is on the yearly plan only, as on the phone: the trial words ride while yearly is picked and
// monthly names its own renewal. A decline (the ×) swaps the plans for the exit offer in place,
// once per account (web/pay-exit, #451); a host with no offer configured, or an account that has
// already met it, closes to Home.

import { fill } from "../../shared/lang.ts";
import { WELCOME_PLATES } from "../../shared/onboarding.ts";
import { paywallPercent, type PaywallPlan, type WebPaywall } from "../../shared/paywall.ts";
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

/** The sheet's plan pair (web/pay-plans' `.pwp2`): Yearly and Monthly side by side, each a real
    radio so selection works as it does on `/start`'s markup — the plan picked is the plan the
    CTA buys. `null` is "nothing to pick": the caller draws the host-sells-nothing offer. */
function planPair(w: WebPaywall, pay: ReturnType<typeof payCopyFor>, label: string):
    { group: HTMLElement; picked: () => PlanPick | null } | null {
  const trial = w.trialDays > 0 ? fill(pay.trialBadge, { days: String(w.trialDays) }) : null;
  const card = (value: "yearly" | "monthly", name: string, price: string,
      extra: { trial?: string | null; save?: string | null }, checked: boolean): HTMLElement => {
    const lab = el("label", "plan2");
    const input = el("input", "") as HTMLInputElement;
    input.type = "radio";
    input.name = "plan";
    input.value = value;
    if (checked) input.checked = true;
    const nr = el("div", "nr");
    nr.append(el("i", "ck"), el("div", "nm", name));
    lab.append(input, nr);
    if (extra.trial != null) lab.append(el("div", "tr", extra.trial));
    const pr = el("div", "pr");
    pr.append(price);
    // No period caption ("a year"/"a month") — the card's own name already says it (#3359,
    // Kirill on the Yearly card). The per-month + save line stays, and the note under the CTA
    // carries the full-period wording the billing copy owes.
    if (extra.save != null) pr.append(el("small", "save", extra.save));
    lab.append(pr);
    return lab;
  };
  const cards: PlanPick[] = [];
  const group = el("div", "pwp2");
  group.setAttribute("role", "radiogroup");
  group.setAttribute("aria-label", label);
  if (w.yearly !== null) {
    cards.push({ value: "yearly", plan: w.yearly });
    group.append(card("yearly", pay.planYearly, w.yearly.price,
      { trial, save: w.yearly.perMonthSave }, true));
  }
  if (w.monthly !== null) {
    cards.push({ value: "monthly", plan: w.monthly });
    group.append(card("monthly", pay.planMonthly, w.monthly.price, {}, w.yearly === null));
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
  col.append(el("h1", "d d34", pay.plansTitle));
  // The sheet's three benefits — the icons the phone draws beside the same lines.
  const bl = el("ul", "bl");
  for (const [icon, line] of
    [["camera", pay.benefitPhoto], ["check", pay.benefitPlan], ["chat", pay.benefitChat]] as const) {
    const li = el("li", "");
    li.append(kitEl(ico(icon)), line);
    bl.append(li);
  }
  col.append(bl);

  const go = el("a", "cta p") as HTMLAnchorElement;
  const note = el("p", "t12 m");
  if (w === undefined || plans === null) {
    col.append(kitEl(payPlansMarkup(
      [{ value: "monthly", name: pay.planMonthly, checked: true }], COPY.offerPlans)));
    go.href = "/start/checkout";
    // No paywall config means nothing about a trial is known — Continue, not a promise of one.
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
      if (days > 0) {
        go.textContent = fill(pay.startTrial, { days: String(days) });
        note.textContent = fill(pay.trialNote, { renewal: fill(pay.pricePerYear, { price: sel.plan.price }) });
      } else {
        go.textContent = pay.continueCta;
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

  // The exit offer (web/pay-exit, #451): the first decline of the plans swaps them for it in
  // place — the regular yearly struck through, the offer price, per month — rather than closing.
  // `offered` keeps the second × (and the ones after it) a plain close for the rest of this
  // mount; the stored flag does the same across visits.
  let offered = false;
  close.addEventListener("click", (ev) => {
    const offer = w?.exitOffer ?? null;
    const uid = frame.me?.profile.user_id;
    if (offered || offer === null || uid === undefined || offerSeen(uid)) {
      analytics.capture("paywall_dismissed", { result: "cancelled", blocked });
      return;
    }
    analytics.capture("paywall_offer_step", { step: "shown" });
    ev.preventDefault();
    offered = true;
    markOfferSeen(uid);
    const card = el("div", "offer pop");
    card.append(
      el("div", "off num", fill(pay.offerOff, { percent: paywallPercent(offer.percentOff, lang) })),
      el("div", "hr"),
    );
    const price = el("div", "price num");
    price.append(
      el("s", "", offer.regularPrice),
      el("span", "", fill(pay.offerPrice, { price: offer.price })),
    );
    card.append(price, el("p", "t13 m num per", fill(pay.offerPerMonth, { price: offer.perMonth })));
    const claim = el("a", "cta p", pay.offerClaim) as HTMLAnchorElement;
    claim.href = offer.checkoutUrl;
    const decline = el("a", "cta g", pay.offerDecline) as HTMLAnchorElement;
    decline.href = "#/";
    claim.addEventListener("click", () => analytics.capture("paywall_offer_step", { step: "claimed" }));
    decline.addEventListener("click", () => {
      analytics.capture("paywall_offer_step", { step: "declined" });
      analytics.capture("paywall_dismissed", { result: "cancelled", blocked });
    });
    const parts = [el("h1", "d d28", pay.offerTitle), card, claim, decline, el("p", "t12 m", pay.offerNote)];
    const foot = legal();
    if (foot !== null) parts.push(foot);
    col.replaceChildren(...parts);
  });

  pane.append(close, col);
  box.append(hero, pane);
  return box;
}
