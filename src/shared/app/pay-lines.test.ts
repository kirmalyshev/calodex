import { describe, expect, it } from "bun:test";
import { LANGS } from "../types.ts";
import { PAY_COPY } from "./pay-copy.ts";
import { trialPromiseLine, yearlySaveLine } from "./pay-lines.ts";

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
    for (const lang of LANGS) {
      const line = yearlySaveLine(PAY_COPY[lang]!, lang, "EUR", 4.99, 39.99)!;
      expect(line, lang).not.toContain("{");
      expect(line, lang).toContain("33");
    }
  });
});

describe("trialPromiseLine", () => {
  it("shows for yearly with a trial", () => {
    expect(trialPromiseLine(PAY_COPY.en, "yearly", 3)).toBe("Free now. Pay in 3 days. We'll remind you.");
  });
  it("is absent for monthly, a spent trial and unknown offerings", () => {
    expect(trialPromiseLine(PAY_COPY.en, "monthly", 3)).toBeNull();
    expect(trialPromiseLine(PAY_COPY.en, "yearly", null)).toBeNull();
    expect(trialPromiseLine(PAY_COPY.en, "yearly", undefined)).toBeNull();
  });
});
