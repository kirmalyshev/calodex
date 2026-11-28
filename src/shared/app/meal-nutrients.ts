// The meal sheet's second tile page (#3676): fibre · sugar · sodium · saturated fat. The words
// are the numbers form's existing, localizer-reviewed nutrient names — one copy of each — and the
// figures are the meal's own stored numbers; the helper exists so the phone and the browser cannot
// order or unit them apart.

import { spellUnit, wholeNumbers } from "../lang.ts";
import type { Lang, MealRecord } from "../types.ts";
import { numbersCopyFor } from "./numbers-copy.ts";

export interface MealNutrientTile {
  key: "fiber" | "sugar" | "sodium" | "satfat";
  icon: "fibre" | "sugar" | "salt" | "satfat";
  value: string;
  label: string;
}

/** The second page's four tiles in the board's order. Sodium is milligrams; the rest are grams. */
export const mealNutrientTiles = (
  meal: Pick<MealRecord, "fiber_g" | "sugar_g" | "sodium_mg" | "satfat_g">,
  lang: Lang,
): MealNutrientTile[] => {
  const copy = numbersCopyFor(lang);
  const n = wholeNumbers(lang);
  const g = spellUnit(lang, "g");
  const mg = spellUnit(lang, "mg");
  return [
    { key: "fiber", icon: "fibre", value: `${n(meal.fiber_g)}${g}`, label: copy.fibre },
    { key: "sugar", icon: "sugar", value: `${n(meal.sugar_g)}${g}`, label: copy.sugar },
    { key: "sodium", icon: "salt", value: `${n(meal.sodium_mg)}${mg}`, label: copy.sodium },
    { key: "satfat", icon: "satfat", value: `${n(meal.satfat_g)}${g}`, label: copy.satfat },
  ];
};
