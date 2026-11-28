// The meal surface's words (#93): the detail, the correct-as-chat sheet, the phone menu and
// keypad, the delete sheet, and the gone state — web boards `web/meal{,-edit,-edited,-delete}.html`
// and phone boards `phone/meal{,-edit,-edited,-keypad,-menu,-delete,-gone}.html` on ieat-app main.
// Completeness in all eight languages is `localizedGaps`' job in `copy.i18n.test.ts`; this file
// holds the table's own contract: the keys exist, the templates keep their placeholders, and the
// English is the boards' words verbatim.

import { describe, expect, it } from "bun:test";
import { LANGS_READY } from "../lang.ts";
import { LANGS, type Lang } from "../types.ts";
import { MEAL_COPY, mealCopyFor } from "./meal-copy.ts";

const KEYS = [
  "sheetWhen",
  "macroProtein", "macroCarbs", "macroFat",
  "coachLine", "correctOpener", "itemAmount", "composeHint",
  "deleteTitle", "deleteBody", "deleteCta", "cancelCta",
  "webCorrect", "webLoggedPhoto",
  "phoneCorrect", "phoneDone", "phoneEdit",
  "menuAddPhoto", "phoneMenuReread", "phoneMenuMoveYesterday", "menuReport",
  "reportTitle", "reportCount", "reportCta",
  "phoneCorrectTitle", "phoneSheetMeal", "phoneThisMeal", "phoneSaveRecheck",
  "phoneKeypadBackspace",
  "phoneFixMeal", "phoneFixExampleLead", "phoneFixExample", "phoneUpdate",
  "tapToName", "renameTitle", "renameLabel", "renameFailed", "rateTitle", "rateUp", "rateDown",
  "phoneIngredientTitle", "phoneAmount", "phoneRemoveIngredient", "phoneWasAmount",
  "phoneEditNutrition", "phoneNutritionLeftToday", "phoneRevert",
  "phoneGrams", "phoneMealMove",
  "phoneGoneTitle", "phoneGoneBody", "phoneGoneBack",
  "webGoneTitle", "webGoneBody", "webGoneBack", "itemAmount", "menuButton",
  "changeItem", "changeTotal", "changeWithItems",
  "changeStillHighOne", "changeStillHighTwo", "changeStillHighAll",
  "changeToPlan", "changeToHigh", "changeToVeryHigh", "changeAllOnPlan",
] as const;

describe("MEAL_COPY", () => {
  it("has every key in every language", () => {
    for (const lang of LANGS_READY) {
      const copy = MEAL_COPY[lang];
      expect(copy, lang).toBeDefined();
      for (const key of KEYS) {
        expect(copy![key].length, `${lang}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("carries no photo-provenance meta line in any language (#3041)", () => {
    for (const lang of LANGS) expect(Object.keys(mealCopyFor(lang))).not.toContain("metaPhoto");
  });

  it("keeps every placeholder in every language", () => {
    // A dropped `{coach}` prints the placeholder beside Gabie's avatar; a dropped `{items}` turns
    // the correct-sheet opener into a claim that nothing was read at all.
    const placeholders: Partial<Record<(typeof KEYS)[number], string[]>> = {
      sheetWhen: ["{day}", "{time}"],
      coachLine: ["{coach}"],
      correctOpener: ["{items}"],
      itemAmount: ["{amount}", "{item}"],
      phoneSheetMeal: ["{meal}", "{time}"],
      phoneWasAmount: ["{amount}"],
      phoneNutritionLeftToday: ["{n}"],
      phoneFixMeal: ["{name}", "{kcal}", "{time}"],
      renameLabel: ["{name}"],
      phoneGrams: ["{n}"],
      phoneMealMove: ["{from}", "{to}"],
      reportCount: ["{n}"],
      changeItem: ["{item}", "{before}", "{after}", "{unit}"],
      changeTotal: ["{kcalBefore}", "{kcalAfter}", "{kcal}"],
      changeWithItems: ["{items}", "{total}"],
      changeStillHighOne: ["{dim}"],
      changeToPlan: ["{dim}"],
      changeToHigh: ["{dim}"],
      changeToVeryHigh: ["{dim}"],
    };
    for (const lang of LANGS_READY) {
      const copy = MEAL_COPY[lang]!;
      for (const [key, phs] of Object.entries(placeholders)) {
        for (const ph of phs) {
          expect(copy[key as keyof typeof copy], `${lang}.${key}`).toContain(ph);
        }
      }
    }
  });

  it("never names the coach literally — {coach} fills her name", () => {
    for (const lang of LANGS_READY) {
      expect(MEAL_COPY[lang]!.coachLine, lang).not.toContain("Gabie");
    }
  });

  it("draws the boards' words in English", () => {
    const en = mealCopyFor("en" as Lang);
    // The meal's meta line says when, never "from a photo": the photo is on the screen (#3041).
    expect(en.sheetWhen).toBe("{day} · {time}");
    expect(en.webCorrect).toBe("Correct this meal");
    expect(en.phoneCorrect).toBe("Correct");
    expect(en.phoneDone).toBe("Done");
    expect(en.menuAddPhoto).toBe("Add Photo");
    expect(en.phoneMenuReread).toBe("Re-read the photo");
    expect(en.phoneMenuMoveYesterday).toBe("Move to yesterday");
    expect(en.menuReport).toBe("Report Food");
    expect(en.reportTitle).toBe("What's the issue with this food log?");
    expect(en.reportCount).toBe("{n}/500");
    expect(en.reportCta).toBe("Report");
    expect(en.correctOpener).toBe("I read {items}. Tell me what I got wrong.");
    expect(en.composeHint).toBe("Say what was wrong");
    expect(en.deleteTitle).toBe("Delete this meal?");
    expect(en.deleteBody).toBe("It comes off today’s diary. This can’t be undone.");
    expect(en.deleteCta).toBe("Delete this meal");
    expect(en.phoneGoneTitle).toBe("Not on today’s diary");
    expect(en.phoneGoneBack).toBe("Back to today");
    expect(en.changeItem).toBe("{item} {before} → {after}{unit}");
    expect(en.changeTotal).toBe("{kcalBefore} → {kcalAfter}{kcal}.");
    expect(en.changeWithItems).toBe("{items}: {total}");
    expect(en.changeStillHighOne).toBe("{dim} still high for one meal.");
    expect(en.changeStillHighTwo).toBe("Both still high for one meal.");
    expect(en.changeStillHighAll).toBe("All still high for one meal.");
    expect(en.changeToPlan).toBe("{dim} now on plan.");
    expect(en.changeToHigh).toBe("{dim} now high for one meal.");
    expect(en.changeToVeryHigh).toBe("{dim} now very high for one meal.");
    expect(en.changeAllOnPlan).toBe("All on plan now.");
    // The Cal-AI fix sheet and ingredient editor (#188 — `web/meal-fix.html`,
    // `web/meal-ingredient.html`).
    // The example is TWO keys — the bold lead is its own, never a slice of the sentence.
    expect(en.phoneFixExampleLead).toBe("For example:");
    expect(en.phoneFixExample).toBe("the rice was about 200g, and there was no sauce.");
    expect(en.phoneUpdate).toBe("Update");
    expect(en.tapToName).toBe("Tap to Name");
    expect(en.renameTitle).toBe("Name meal");
    expect(en.renameLabel).toBe("Rename meal: {name}");
    expect(en.phoneIngredientTitle).toBe("Edit ingredient");
    expect(en.phoneEditNutrition).toBe("Edit Calories");
    expect(en.phoneNutritionLeftToday).toBe("Out of {n} left today");
    expect(en.phoneRevert).toBe("Revert");
    expect(en.phoneAmount).toBe("Amount");
    expect(en.phoneRemoveIngredient).toBe("Remove ingredient");
  });
});
