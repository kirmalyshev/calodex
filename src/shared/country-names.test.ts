// The country-name table is generated at build time (Node has full ICU) and checked in, because
// Hermes has no Intl.DisplayNames. These fail when a language or a country is missing, or when the
// file drifts from what CLDR says.
import { describe, expect, test } from "bun:test";
import { COUNTRY_NAMES } from "./country-names.generated.ts";
import { countryLabel, countryMatches, countryOptions, countrySearchNames, COUNTRY_CODES } from "./onboarding.ts";
import { LANG_TAG } from "./lang.ts";
import { LANGS } from "./types.ts";

const REGIONS = COUNTRY_CODES.filter((c) => c !== "other");

describe("COUNTRY_NAMES", () => {
  test("has every language and every curated country, non-empty", () => {
    for (const lang of LANGS) {
      for (const c of REGIONS) expect(COUNTRY_NAMES[lang]?.[c], `${lang}/${c}`).toBeTruthy();
    }
  });

  test("every non-English language differs from English somewhere (full ICU, not a silent fallback)", () => {
    for (const lang of LANGS.filter((l) => l !== "en")) {
      expect(REGIONS.some((c) => COUNTRY_NAMES[lang][c] !== COUNTRY_NAMES.en[c]), lang).toBe(true);
    }
  });

  test("equals what CLDR says (re-run `bun src/scripts/country-names.ts` on a diff)", () => {
    for (const lang of LANGS) {
      const dn = new Intl.DisplayNames([LANG_TAG[lang]], { type: "region" });
      for (const c of REGIONS) expect(COUNTRY_NAMES[lang][c], `${lang}/${c}`).toBe(dn.of(c.toUpperCase()));
    }
  });
});

describe("countryLabel without Intl.DisplayNames (Hermes)", () => {
  test("is the local name, not English", () => {
    const intl = Intl as { DisplayNames?: unknown };
    const real = intl.DisplayNames;
    intl.DisplayNames = undefined; // Hermes
    try {
      expect(countryLabel("de", "de")).toBe("Deutschland");
      expect(countryLabel("de", "ru")).toBe("Германия");
    } finally {
      intl.DisplayNames = real;
    }
  });
});

describe("countrySearchNames", () => {
  test("carries the local and the English name, once when equal", () => {
    expect(countrySearchNames("de", "de")).toEqual(["Deutschland", "Germany"]);
    expect(countrySearchNames("us", "en")).toHaveLength(1);
  });
});

describe("countryMatches", () => {
  test("finds a country by its local name and by its English name, folded", () => {
    expect(countryMatches("de", "de", "deutsch")).toBe(true);
    expect(countryMatches("de", "de", "german")).toBe(true);
    expect(countryMatches("ch", "de", "SCHWEIZ")).toBe(true);
    expect(countryMatches("at", "ru", "австр")).toBe(true);
    expect(countryMatches("at", "ru", "austri")).toBe(true);
    expect(countryMatches("at", "ru", "france")).toBe(false);
    expect(countryMatches("at", "de", "osterreich")).toBe(true);
    expect(countryMatches("es", "es", "espana")).toBe(true);
    expect(countryMatches("other", "en", "o")).toBe(false);
  });
});

describe("countryOptions sorts by the local name", () => {
  test("Österreich files under Ö, after Deutschland, in German; other last", () => {
    const de = countryOptions("de");
    expect(de.indexOf("at")).toBeGreaterThan(de.indexOf("de"));
    expect(de.at(-1)).toBe("other");
    const ru = countryOptions("ru");
    expect(ru.indexOf("at")).toBeLessThan(ru.indexOf("de")); // Австрия before Германия
  });
});
