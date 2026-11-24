import { describe, expect, it, test } from "bun:test";
import { exitOfferOn, offerMath, paywallPercent, paywallPrice, perMonth, swapCurrencySign, zeroLike } from "./paywall.ts";

// The one arithmetic the web paywall (#96) and the native one (#928) share: the exit offer's
// percent off and its per-month equivalent, derived from the two prices that were actually
// configured — never a percentage typed by hand.

describe("offerMath", () => {
  it("derives the offer card's figures from the two prices", () => {
    expect(offerMath(39.99, 23.99)).toEqual({
      percentOff: 40,
      perMonth: 2.00,
    });
  });

  it("floors the discount, so the card never overstates it", () => {
    // 28.99 / 39.99 is 27.5% — the card says 27, never 28.
    expect(offerMath(39.99, 28.99)!.percentOff).toBe(27);
  });

  it("gives the per-month equivalent to the cent", () => {
    expect(offerMath(39.99, 23.99)!.perMonth).toBe(2.00);
    expect(offerMath(50, 10)!.perMonth).toBe(0.83);
  });

  it("answers null when either price is missing or worthless", () => {
    expect(offerMath(0, 23.99)).toBeNull();
    expect(offerMath(39.99, -1)).toBeNull();
    expect(offerMath(NaN, 23.99)).toBeNull();
  });

  it("answers null when the floored saving is under one percent — there is no offer to draw", () => {
    // Priced ABOVE the regular plan, equal to it, or 0.25 % off: every card would say "0 % off"
    // or worse, so the answer is no offer at all and a decline goes to the app.
    expect(offerMath(19.99, 29.99)).toBeNull();
    expect(offerMath(39.99, 39.99)).toBeNull();
    expect(offerMath(40, 39.99)).toBeNull();
  });
});

describe("perMonth", () => {
  it("spreads a yearly amount over a month, to the cent — the one figure both cards share", () => {
    expect(perMonth(23.99)).toBe(2.00);
    expect(perMonth(39.99)).toBe(3.33);
    expect(perMonth(0.09)).toBe(0.01);
  });
});

describe("paywallPrice", () => {
  it("formats an amount in the configured currency and the reader's language", () => {
    expect(paywallPrice(39.99, "EUR", "en")).toBe("€39.99");
    expect(paywallPrice(39.99, "EUR", "de")).toBe("39,99 €");
    expect(paywallPrice(39.99, "USD", "en")).toBe("$39.99");
  });

  // ieat-app#3163: a bare "$" on an Australian or New Zealand sheet reads as US dollars, a ruble
  // price shows kopecks nobody quotes, and the ringgit is RM.
  it("names AUD and NZD with their own sign, in every language", () => {
    expect(paywallPrice(39.99, "AUD", "en")).toBe("A$39.99");
    expect(paywallPrice(39.99, "NZD", "en")).toBe("NZ$39.99");
    expect(paywallPrice(39.99, "AUD", "de").replace(/\s/g, " ")).toBe("39,99 A$");
    expect(paywallPrice(39.99, "NZD", "fr")).toContain("NZ$");
  });

  it("drops the kopecks on RUB, rounded to the whole ruble", () => {
    expect(paywallPrice(3333, "RUB", "ru").replace(/\s/g, " ")).toBe("3 333 ₽");
    expect(paywallPrice(277.75, "RUB", "ru").replace(/\s/g, " ")).toBe("278 ₽");
    expect(paywallPrice(277.75, "RUB", "en")).not.toContain(".");
  });

  it("writes MYR as RM", () => {
    expect(paywallPrice(39.99, "MYR", "en")).toContain("RM");
    expect(paywallPrice(39.99, "MYR", "en")).not.toContain("MYR");
  });
});

// ieat-app#3155: the admin arms the decline → offer per platform and the flag travels on
// `ProfileResponse.exitOfferEnabled`. The read is the subtle part — a server that predates the
// field sends NO `exitOfferEnabled` at all, and absent must answer the same as off.
describe("exitOfferOn", () => {
  it("answers the platform's flag, one arm per platform", () => {
    const p = { exitOfferEnabled: { ios: true, web: false } };
    expect(exitOfferOn(p, "ios")).toBe(true);
    expect(exitOfferOn(p, "web")).toBe(false);
    expect(exitOfferOn({ exitOfferEnabled: { ios: false, web: true } }, "web")).toBe(true);
  });

  it("answers false where the field is absent — an older server arms nothing", () => {
    expect(exitOfferOn({}, "ios")).toBe(false);
    expect(exitOfferOn(null, "ios")).toBe(false);
    expect(exitOfferOn(undefined, "web")).toBe(false);
  });

  it("answers false off the flag alone — a present false, never merely truthy", () => {
    expect(exitOfferOn({ exitOfferEnabled: { ios: false, web: false } }, "ios")).toBe(false);
  });
});

describe("paywallPercent", () => {
  it("writes the sign the locale's own way — tight in English, spaced in French and German (#451)", () => {
    // The badge used to read "40 % off" in English: `{percent}` carried a bare number and every
    // template baked the " %" in. Now `Intl` owns the spacing — the NBSP is CLDR's, not ours.
    expect(paywallPercent(40, "en")).toBe("40%");
    expect(paywallPercent(40, "fr")).toBe("40 %");
    expect(paywallPercent(40, "de")).toBe("40 %");
  });
});

// ieat-app#3163: the yearly card's second line is computed from the storefront's own two prices.
describe("yearly per-month line", () => {
  it("reads €3.33 and 33% off twelve monthlies at €4.99 / €39.99", () => {
    const m = offerMath(4.99 * 12, 39.99);
    expect(m).toEqual({ percentOff: 33, perMonth: 3.33 });
  });
  it("is absent when the yearly is no cheaper than twelve monthlies", () => {
    expect(offerMath(4.99 * 12, 59.88)).toBeNull();
  });
});

// Hermes has no NumberFormat.formatToParts and answers its own symbols (#3163 review): the price
// must still come out, with the right sign, when the method is gone.
describe("paywallPrice without formatToParts", () => {
  it("still prices AUD, NZD, MYR and RUB", () => {
    const proto = Intl.NumberFormat.prototype as { formatToParts?: unknown };
    const saved = proto.formatToParts;
    delete proto.formatToParts;
    try {
      expect(paywallPrice(39.99, "AUD", "en")).toBe("A$39.99");
      expect(paywallPrice(39.99, "NZD", "en")).toBe("NZ$39.99");
      expect(paywallPrice(39.99, "MYR", "en")).toContain("RM");
      expect(paywallPrice(278, "RUB", "en")).not.toContain(".");
    } finally { proto.formatToParts = saved; }
  });
});

// The spellings Hermes answers with, which bun's ICU never produces.
describe("swapCurrencySign", () => {
  it("takes every spelling of the sign", () => {
    expect(swapCurrencySign("AU$39.99", "AUD")).toBe("A$39.99");
    expect(swapCurrencySign("39,99 $AU", "AUD")).toBe("39,99 A$");
    expect(swapCurrencySign("$39.99", "AUD")).toBe("A$39.99");
    expect(swapCurrencySign("$NZ39.99", "NZD")).toBe("NZ$39.99");
    expect(swapCurrencySign("MYR 39.99", "MYR")).toBe("RM 39.99");
    expect(swapCurrencySign("RM39.99", "MYR")).toBe("RM39.99");
    expect(swapCurrencySign("$39.99", "USD")).toBe("$39.99");
  });
});

describe("zeroLike — a price string's own zero (#3442: B's \"Try for €0.00\")", () => {
  test("keeps the sign, its side and the decimal mark", () => {
    expect(zeroLike("€39.99")).toBe("€0.00");
    expect(zeroLike("39,99 €")).toBe("0,00 €");
    expect(zeroLike("$1,299.00")).toBe("$0.00");
  });
  test("a typographic apostrophe groups like an ASCII one (Swiss CHF 1’299.00)", () => {
    expect(zeroLike("CHF 1’299.00")).toBe("CHF 0.00");
  });
  test("a currency without decimals stays without", () => {
    expect(zeroLike("¥4,800")).toBe("¥0");
    expect(zeroLike("1 499 ₽")).toBe("0 ₽");
  });
  test("no number is no answer", () => {
    expect(zeroLike("Free")).toBeNull();
  });
});
