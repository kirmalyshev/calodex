// Saved meals copy (#907, calodex_app#3685): every key in every shipped language, every
// placeholder kept, and the English labels matching iOS and the design boards.
import { describe, expect, it } from "bun:test";
import { LANGS_READY } from "../lang.ts";
import { SAVED_MEALS_COPY, savedMealsCopyFor, type SavedMealsCopy } from "./saved-meals-copy.ts";

const KEYS: readonly (keyof SavedMealsCopy)[] = [
  "menuSave", "menuRemove", "saveFailed", "section", "empty",
  "failedLog", "remove", "logLabel", "loggedLabel", "removeLabel",
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

  it("matches the iOS and design-board English labels", () => {
    const en = savedMealsCopyFor("en");
    expect(en.menuSave).toBe("Save meal");
    expect(en.menuRemove).toBe("Remove from saved");
    expect(en.section).toBe("Saved");
    expect(en.remove).toBe("Remove");
    expect(en.empty).toContain("Nothing saved yet.");
  });
});
