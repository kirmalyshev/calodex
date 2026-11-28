// Add-ingredient copy (calodex_app#3678): every key in every shipped language, the Cal AI
// function's English words exactly, and the claims/Russian guards every user-facing table carries.
import { describe, expect, it } from "bun:test";
import { lintCopy } from "../claims.ts";
import { genderedRussian, LANGS_READY } from "../lang.ts";
import { MEAL_ADD_COPY, mealAddCopyFor, type MealAddCopy } from "./meal-add-copy.ts";

function flat(node: unknown, at = "", out: Record<string, string> = {}): Record<string, string> {
  if (typeof node === "string") { out[at] = node; return out; }
  if (typeof node === "object" && node !== null) {
    for (const [k, v] of Object.entries(node)) flat(v, at === "" ? k : `${at}.${k}`, out);
  }
  return out;
}

const KEYS: readonly (keyof MealAddCopy)[] = ["ingredients", "addMore", "searchPlaceholder", "suggestions"];

describe("MEAL_ADD_COPY", () => {
  it("has every key non-empty in every shipped language", () => {
    for (const lang of LANGS_READY) {
      const copy = MEAL_ADD_COPY[lang];
      expect(copy, lang).toBeDefined();
      for (const key of KEYS) expect(copy![key].trim().length, `${lang}.${key}`).toBeGreaterThan(0);
    }
  });

  it("passes the claims sweep in every shipped language", () => {
    for (const lang of LANGS_READY) {
      expect(lintCopy(flat(MEAL_ADD_COPY[lang]!)).map((v) => `${v.field}: ${v.pattern} "${v.span}"`), lang).toEqual([]);
    }
  }, 30_000);

  it("never lets the Russian decide who the reader is", () => {
    expect(genderedRussian(MEAL_ADD_COPY)).toEqual([]);
  });

  it("uses Cal AI's function words in English", () => {
    const en = mealAddCopyFor("en");
    expect(en.ingredients).toBe("Ingredients");
    expect(en.addMore).toBe("+ Add More");
    expect(en.searchPlaceholder).toBe("Search for an ingredient");
    expect(en.suggestions).toBe("Suggestions");
  });
});
