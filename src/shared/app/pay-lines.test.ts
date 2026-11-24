import { describe, expect, it } from "bun:test";
import { LANGS_READY } from "../lang.ts";
import { LANGS } from "../types.ts";
import { WELCOME_PLATES } from "../onboarding.ts";
import { PAY_COPY } from "./pay-copy.ts";
import { trialBillLine, welcomePlateAlt, yearlySaveLine } from "./pay-lines.ts";

describe("yearlySaveLine", () => {
  it("is computed from the two prices, per storefront currency", () => {
    expect(yearlySaveLine(PAY_COPY.en, "en", "EUR", 4.99, 39.99)).toBe("€3.33/month · save 33%");
    expect(yearlySaveLine(PAY_COPY.en, "en", "AUD", 7.99, 59.99)).toBe("A$5.00/month · save 37%");
  });
  it("is null with a price missing or no saving", () => {
    expect(yearlySaveLine(PAY_COPY.en, "en", "EUR", null, 39.99)).toBeNull();
    expect(yearlySaveLine(PAY_COPY.en, "en", "EUR", 4.99, null)).toBeNull();
    expect(yearlySaveLine(PAY_COPY.en, "en", "EUR", 4.99, 59.88)).toBeNull();
  });
  it("leaves no placeholder in any language", () => {
    for (const lang of LANGS_READY) {
      const line = yearlySaveLine(PAY_COPY[lang]!, lang, "EUR", 4.99, 39.99)!;
      expect(line, lang).not.toContain("{");
      expect(line, lang).toContain("33");
    }
  });
});

// ieat-app#3359 — the paywall hero's alt, the plate's own figures spoken for the image; the web
// sheet reads the same string the phone's `usePlansHero` builds.
describe("welcomePlateAlt", () => {
  it("reads the plate's macros in the chat labels' words", () => {
    expect(welcomePlateAlt(WELCOME_PLATES["grain-bowl"], "en"))
      .toBe("Protein 8 g, Carbs 50 g, Fat 12 g, 345 kcal");
    expect(welcomePlateAlt(WELCOME_PLATES["french-toast"], "ru"))
      .toContain("365");
  });
});


// ieat-app#3442 (3.1.2(c)): the billed amount and its date beside the zero-priced CTA.
describe("trialBillLine", () => {
  const now = new Date("2026-11-24T10:00:00Z");
  it("names the renewal price and the day the trial ends", () => {
    expect(trialBillLine(PAY_COPY.en, "en", "UTC", now, 3, "€39.99 a year")).toBe("Then €39.99 a year from 27 Nov");
  });
  it("leaves no placeholder in any language", () => {
    for (const lang of LANGS_READY) {
      expect(trialBillLine(PAY_COPY[lang] ?? PAY_COPY.en, lang, "UTC", now, 3, "X")).not.toContain("{");
    }
  });
});
