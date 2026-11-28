// The paywall's words (W9 · kirmalyshev/eait#96): plans → gift → the one offer, then
// catching-up and welcome, plus the phone's dock, trial reminder and lapsed cards.
// The boards are `product/design/pro/{web,phone}/pay-*.html` on ieat-app main (3d2b4357+).
// Completeness in all eight languages is `localizedGaps`' job in `copy.i18n.test.ts`; this file
// holds the table's own contract: the keys exist, the placeholders survive, the English is the
// boards' words, and the claims gate passes over every language.

import { describe, expect, it } from "bun:test";
import { lintCopy } from "../claims.ts";
import { fill, LANGS_READY } from "../lang.ts";
import { paywallPercent } from "../paywall.ts";
import { LANGS, type Lang } from "../types.ts";
import { PAY_COPY, payCopyFor } from "./pay-copy.ts";

const KEYS = [
  "plansTitle", "plansHeroAlt",
  "planYearly", "planMonthly", "trialBadge", "pricePerYear", "pricePerMonth",
  "yearlySub", "monthlySub", "perMonthSave", "benefitPhoto", "benefitPlan", "benefitChat",
  "startTrial", "trialNote", "trialNotePhone",
  "giftTitle", "giftAlt", "giftNote", "giftOpen",
  "offerTitle", "offerAlt", "offerOff", "offerPrice", "offerPerMonth",
  "offerClaim", "offerDecline", "offerNote",
  "storeThanks", "catchingUp",
  "welcomeTitle", "welcomeSub", "welcomeBack",
  "subscribingPhone",
  "goalCtaPhone", "subscribePhone", "seePlansPhone", "declinedNotePhone",
  "trialEnds", "trialEndsNote", "trialEndsCancel", "renewsLabelPhone",
  "lapsedTitlePhone",
  "closeLabel", "restoreLink", "redeemLink", "termsLink", "privacyLink",
  "plansTrialTitle", "plansUnlockTitle", "planSave", "billedYearly", "perMonthShort",
  "tryTitle", "tryToday", "tryDay", "tryRemind", "tryBill", "tryThenBilled", "noPaymentDue",
  "tryCta", "offerSpecialTitle", "offerClaimTrial", "offerTrialNote", "offerVsMonthly",
  "promoBand", "promoFooter", "offerTrialFoot",
] as const;

describe("PAY_COPY", () => {
  it("has every key in every language", () => {
    for (const lang of LANGS_READY) {
      const copy = PAY_COPY[lang];
      expect(copy, lang).toBeDefined();
      for (const key of KEYS) {
        const value = copy![key as keyof typeof copy];
        for (const [sub, text] of typeof value === "object" ? Object.entries(value) : [["", value]]) {
          expect((text as string).length, `${lang}.${key}${sub ? "." + sub : ""}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("keeps every placeholder in every language", () => {
    // A dropped `{price}` renders the words around a hole — a plan card that cannot say what it
    // costs. The same class of bug `catalogArgs` catches for the migrated tables.
    const want: Record<string, readonly string[]> = {
      trialBadge: ["{days}"],
      pricePerYear: ["{price}"],
      pricePerMonth: ["{price}"],
      perMonthSave: ["{price}", "{percent}"],
      yearlySub: ["{trial}", "{price}"],
      monthlySub: ["{trial}", "{price}"],
      startTrial: ["{days}"],
      trialNote: ["{renewal}"],
      trialNotePhone: ["{renewal}"],
      offerOff: ["{percent}"],
      offerPrice: ["{price}"],
      offerPerMonth: ["{price}"],
      trialEndsNote: ["{renewal}"],
      plansTrialTitle: ["{days}"],
      plansUnlockTitle: ["{app_name}"],
      planSave: ["{percent}"],
      billedYearly: ["{price}"],
      perMonthShort: ["{price}"],
      tryTitle: ["{app_name}"],
      tryDay: ["{day}"],
      tryBill: ["{renewal}"],
      tryThenBilled: ["{renewal}", "{date}"],
      tryCta: ["{price}"],
      offerTrialNote: ["{days}", "{renewal}"],
      offerTrialFoot: ["{days}", "{price}"],
      offerVsMonthly: ["{percent}"],
      promoBand: ["{percent}"],
      promoFooter: ["{price}", "{regular}"],
    };
    for (const lang of LANGS_READY) {
      const copy = PAY_COPY[lang]!;
      for (const [key, phs] of Object.entries(want)) {
        for (const ph of phs) {
          expect(copy[key as keyof typeof copy], `${lang}.${key}`).toContain(ph);
        }
      }
    }
  });

  it("gives every promo* string and offerTrialFoot exactly English's placeholders, in every language (ieat-app#3605, #3617)", () => {
    // Containment above misses the other direction: a translation that ADDS `{regular}` where the
    // English has none renders a literal brace the client never fills.
    const placeholders = (s: string) => [...s.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();
    for (const lang of LANGS_READY) {
      for (const key of ["promoBand", "promoFooter", "offerTrialFoot"] as const) {
        expect(placeholders(PAY_COPY[lang]![key]), `${lang}.${key}`).toEqual(placeholders(PAY_COPY.en[key]));
      }
    }
  });

  it("draws C's footer as the book does (pay-cal-c, ieat-app#3617)", () => {
    expect(PAY_COPY.en.offerTrialFoot.replace("{days}", "3").replace("{price}", "€19.99")).toBe("3 days free, then €19.99/year, renews automatically.");
  });

  it("uses natural spoken phrasing in paywall copy (ieat-app#3454)", () => {
    // Replaces stiff / literal machine-translation phrasing:
    // ja: plansUnlockTitle must say アンロック, not 解除 (cancel/release)
    expect(PAY_COPY.ja!.plansUnlockTitle).toContain("アンロック");
    expect(PAY_COPY.ja!.plansUnlockTitle).not.toContain("解除");
    // fr: noPaymentDue says "Rien à payer maintenant" (not "dû maintenant")
    expect(PAY_COPY.fr!.noPaymentDue).toBe("Rien à payer maintenant");
    // it: noPaymentDue says "Nessun pagamento adesso" (not "dovuto ora")
    expect(PAY_COPY.it!.noPaymentDue).toBe("Nessun pagamento adesso");
    // es: noPaymentDue says "No pagas nada ahora" (not "pendiente")
    expect(PAY_COPY.es!.noPaymentDue).toBe("No pagas nada ahora");
    // de: noPaymentDue says "Jetzt nichts zu zahlen" (not "Zahlung fällig")
    expect(PAY_COPY.de!.noPaymentDue).toBe("Jetzt nichts zu zahlen");
    // ru: offerSpecialTitle says "Специальное предложение"
    expect(PAY_COPY.ru!.offerSpecialTitle).toBe("Специальное предложение");
    // ru: plansUnlockTitle says "Открой {app_name}, чтобы продолжить"
    expect(PAY_COPY.ru!.plansUnlockTitle).toBe("Открой {app_name}, чтобы продолжить");
    // ro: offerClaimTrial does not use "Revendică"
    expect(PAY_COPY.ro!.offerClaimTrial).not.toContain("Revendică");
    // es: offerClaimTrial does not use "Canjea"
    expect(PAY_COPY.es!.offerClaimTrial).not.toContain("Canjea");
    // pt-BR: offerClaimTrial does not use "Resgatar"
    expect(PAY_COPY["pt-BR"]!.offerClaimTrial).not.toContain("Resgatar");
    // no: plansTrialTitle does not use "den gratis trialen"
    expect(PAY_COPY.no!.plansTrialTitle).not.toContain("den gratis trialen");
  });

  it("never restates the trial the CTA already named, in any language (ieat-app#3160)", () => {
    // `startTrial` owns the trial's length — "Try {days} days free" — and the terms line under it
    // opened with the same "{days} days free", saying it twice on one screen. The line keeps what
    // the store requires (the price after the trial, the period, auto-renew, the cancel path) but
    // must not restate the length: no `{days}` placeholder, and it cannot open with the badge's
    // own phrase — the rendered check also refuses a hardcoded restatement ("3 days free, then").
    for (const lang of LANGS_READY) {
      const copy = PAY_COPY[lang]!;
      const phrase = fill(copy.trialBadge, { days: "7" });
      for (const key of ["trialNote", "trialNotePhone"] as const) {
        expect(copy[key], `${lang}.${key}`).not.toContain("{days}");
        expect(fill(copy[key], { days: "7", renewal: "X" }).startsWith(phrase), `${lang}.${key}`).toBe(false);
      }
    }
  });

  it("draws the boards' words in English", () => {
    const en = payCopyFor("en" as Lang);
    // pay-plans
    expect(en.plansTitle).toBe("Know if every meal fits");
    expect(en.plansHeroAlt).toBe("Salmon, rice and greens on a plate");
    expect(en.planYearly).toBe("Yearly");
    expect(en.planMonthly).toBe("Monthly");
    expect(en.trialBadge).toBe("{days} days free");
    expect(en.pricePerYear).toBe("{price} a year");
    expect(en.pricePerMonth).toBe("{price} a month");
    // pay-paywall (phone): the benefits, the yearly sub-line, the captions, the free-meal card
    expect(en.perMonthSave).toBe("{price}/month · save {percent}");
    expect(en.benefitPhoto).toBe("One photo logs a meal");
    expect(en.benefitPlan).toBe("Every meal checked against your plan");
    expect(en.benefitChat).toBe("Ask Calodex about your day");
    expect(en.yearlySub).toBe("{trial}, {price} a year");
    expect(en.monthlySub).toBe("{trial}, {price} a month");
    expect(en.startTrial).toBe("Try {days} days free");
    expect(en.trialNote).toBe("Then {renewal} after the trial. Renews automatically until cancelled. Cancel any time in Profile › Subscription.");
    expect(en.trialNotePhone).toBe("Then {renewal} after the trial. Renews automatically until cancelled. Cancel in Settings › Apple ID › Subscriptions at least 24 hours before the trial ends. We'll remind you before the trial ends.");
    // pay-gift
    expect(en.giftTitle).toBe("We have a gift for you");
    expect(en.giftAlt).toBe("A wrapped gift box");
    expect(en.giftNote).toBe("One offer, shown only this once.");
    expect(en.giftOpen).toBe("Open");
    // pay-ultra
    expect(en.offerTitle).toBe("Your gift: yearly, for less");
    expect(en.offerAlt).toBe("Porridge with berries");
    expect(en.offerOff).toBe("{percent} off");
    expect(en.offerPrice).toBe("{price} / year");
    expect(en.offerPerMonth).toBe("≈ {price} a month");
    expect(en.offerClaim).toBe("Claim");
    expect(en.offerDecline).toBe("No thanks");
    expect(en.offerNote).toBe("Billed yearly. Cancel any time");
    // pay-catching-up
    expect(en.storeThanks).toBe("Thanks, the store has it");
    expect(en.catchingUp).toBe("Your account is catching up. A few seconds.");
    expect(en.subscribingPhone).toBe("Subscribing");
    // pay-welcome
    expect(en.welcomeTitle).toBe("You’re all set");
    expect(en.welcomeSub).toBe("Every meal gets an honest answer now, and your plan moves when your weight does.");
    expect(en.welcomeBack).toBe("Back to today");
    // pay-dock / pay-lapsed (phone, ieat-app#2816): one full-width goal-worded button
    expect(en.goalCtaPhone).toEqual({ lose: "Start losing weight", gain: "Start gaining weight", maintain: "Keep my weight", none: "Count calories" });
    expect(en.subscribePhone).toBe("Subscribe");
    // pay-var-c (#3443): after a decline Home shows one calm line over "See plans"
    expect(en.seePlansPhone).toBe("See plans");
    expect(en.declinedNotePhone).toBe("Your plan is saved. Choose a plan to start logging.");
    // pay-trial-ends (phone and web): the one reminder, named from the board
    expect(en.trialEnds).toBe("Your free trial ends tomorrow");
    expect(en.trialEndsNote).toBe("Then {renewal}. Cancel today and nothing is charged.");
    expect(en.trialEndsCancel).toBe("Cancel today and nothing is charged.");
    expect(en.renewsLabelPhone).toBe("Renews");
    // pay-lapsed (phone)
    expect(en.lapsedTitlePhone).toBe("Your subscription has ended");
    // every modal board's chrome and the legal footer
    expect(en.closeLabel).toBe("Close");
    expect(en.restoreLink).toBe("Restore");
    expect(en.redeemLink).toBe("Redeem code");
    expect(en.termsLink).toBe("Terms");
    expect(en.privacyLink).toBe("Privacy");
    // pay-cal-a-newyear (ieat-app#3605): A's band and footer while the promotion is live; the board's words.
    expect(fill(en.promoBand, { percent: paywallPercent(50, "en") }).toUpperCase()).toBe("NEW YEAR \u221250%");
    expect(fill(en.promoFooter, { price: "€19.99", regular: "€39.99" })).toBe("€19.99 first year, then €39.99/year. Cancel any time.");
  });

  it("names the redeem-code foot link in the ruled languages (ieat-app#3694)", () => {
    expect(PAY_COPY.en.redeemLink).toBe("Redeem code");
    expect(PAY_COPY.de!.redeemLink).toBe("Code einlösen");
    expect(PAY_COPY.ru!.redeemLink).toBe("Ввести промокод");
    for (const lang of LANGS_READY) {
      expect(PAY_COPY[lang]!.redeemLink, lang).toBeTruthy();
    }
  });

  it("carries no claim the gate refuses, in any of the eight", () => {
    // The paywall is the most-attended copy in the product — a discount that overstates itself is
    // exactly what `exclusivity`/`guarantee` exist to stop, so the sweep runs here by name rather
    // than trusting a reviewer to notice.
    for (const lang of LANGS_READY) {
      // Flatten nested records so CLAIM_EXEMPTIONS can name a leaf (`PAY_COPY.goalCtaPhone.lose`).
      const fields: Record<string, string> = {};
      for (const [key, value] of Object.entries(PAY_COPY[lang]!)) {
        if (typeof value === "object") for (const [sub, text] of Object.entries(value)) fields[`PAY_COPY.${key}.${sub}`] = text as string;
        else fields[`PAY_COPY.${key}`] = value;
      }
      expect(lintCopy(fields), lang).toEqual([]);
    }
  }, 30_000);
});

describe("renewsPlain (ieat-app#3465)", () => {
  it("is the price-free auto-renew line in every language", () => {
    for (const lang of LANGS_READY) {
      const line = PAY_COPY[lang]!.renewsPlain;
      expect(line, lang).toBeTruthy();
      expect(line, lang).not.toMatch(/[{}\p{Nd}\p{Sc}]/u);
      expect(lintCopy({ "PAY_COPY.renewsPlain": line }), lang).toEqual([]);
    }
  });
});

// ieat-app#3628: `{days}` is filled with a bare number, so a count noun after it must agree with
// every count the store sells. SOLD is what is sold today (the 3-day trial, the 7-day promotion
// trial); a new length added here goes red wherever the copy cannot carry it. Czech and Slovak
// decline the noun by count (1 den/deň, 2–4 dny/dni, 5+ dní), so their strings use the
// abbreviation they already ship ("d" / "d.") instead of a declined noun.
describe("trial-day counts agree with the noun after them (ieat-app#3628)", () => {
  const SOLD = [3, 7];
  const KEYS = ["introTitle", "offerTrialFoot", "offerTrialNote", "plansTrialTitle", "startTrial", "trialBadge", "trialPromise"] as const;
  // `\b` is ASCII-only in JS, so "dní" never ends on one: the noun is closed by "not a letter" instead.
  const word = (n: number, nouns: string) => new RegExp(`(?<![\\p{L}\\d])${n} (${nouns})(?!\\p{L})`, "u");
  const wrong: Record<string, (n: number) => RegExp> = {
    // "po dobu 3 dnů" is the genitive plural, right for every count from 2.
    cs: (n) => word(n, n === 1 ? "dny|dní|dnů" : n <= 4 ? "den|dní" : "den|dny"),
    sk: (n) => word(n, n === 1 ? "dni|dní" : n <= 4 ? "deň|dní" : "deň|dni"),
  };

  for (const [lang, bad] of Object.entries(wrong)) {
    it(`${lang}: no declined day noun disagrees with a sold count`, () => {
      const copy = PAY_COPY[lang as keyof typeof PAY_COPY]!;
      for (const key of KEYS) {
        for (const n of SOLD) {
          const s = copy[key].replaceAll("{days}", String(n));
          expect(s, `${lang}.${key} at ${n}`).not.toMatch(bad(n));
        }
      }
    });
  }
});
