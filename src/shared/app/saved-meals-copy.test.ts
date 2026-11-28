// Saved meals copy (#907, calodex_app#3685): every key in every shipped language, every
// placeholder kept, and the English labels matching iOS and the design boards.
import { describe, expect, it } from "bun:test";
import { lintCopy } from "../claims.ts";
import { genderedRussian, LANGS_READY } from "../lang.ts";
import { SAVED_MEALS_COPY, savedMealsCopyFor, type SavedMealsCopy } from "./saved-meals-copy.ts";


/** Every string in the table, keyed well enough to name — `lintCopy` takes a flat record. */
function flat(node: unknown, at = "", out: Record<string, string> = {}): Record<string, string> {
  if (typeof node === "string") { out[at] = node; return out; }
  if (typeof node === "object" && node !== null) {
    for (const [k, v] of Object.entries(node)) flat(v, at === "" ? k : `${at}.${k}`, out);
  }
  return out;
}

const KEYS: readonly (keyof SavedMealsCopy)[] = [
  "menuSave", "menuRemove", "saveFailed", "section", "empty",
  "removeFailed", "removeDone", "remove", "logLabel", "loggedLabel", "removeLabel",
];

describe("SAVED_MEALS_COPY", () => {
  it("has every key non-empty in every shipped language", () => {
    for (const lang of LANGS_READY) {
      const copy = SAVED_MEALS_COPY[lang];
      expect(copy, lang).toBeDefined();
      for (const key of KEYS) {
        expect(copy![key].trim().length, `${lang}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("keeps {name} placeholders in every shipped language", () => {
    for (const lang of LANGS_READY) {
      const copy = savedMealsCopyFor(lang);
      expect(copy.logLabel, `${lang}.logLabel`).toContain("{name}");
      expect(copy.loggedLabel, `${lang}.loggedLabel`).toContain("{name}");
      expect(copy.removeLabel, `${lang}.removeLabel`).toContain("{name}");
    }
  });

  it("passes the claims sweep in every shipped language", () => {
    for (const lang of LANGS_READY) {
      expect(lintCopy(flat(SAVED_MEALS_COPY[lang]!)).map((v) => `${v.field}: ${v.pattern} "${v.span}"`), lang).toEqual([]);
    }
  }, 30_000);

  it("never lets the Russian decide who the reader is", () => {
    expect(genderedRussian(SAVED_MEALS_COPY)).toEqual([]);
  });

  it("matches the iOS and design-board English labels", () => {
    const en = savedMealsCopyFor("en");
    expect(en.menuSave).toBe("Save meal");
    expect(en.menuRemove).toBe("Remove from saved");
    expect(en.section).toBe("Saved");
    expect(en.remove).toBe("Remove");
    expect(en.empty).toContain("Nothing saved yet.");
  });
});
