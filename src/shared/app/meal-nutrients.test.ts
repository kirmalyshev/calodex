import { describe, expect, it } from "bun:test";
import { LANGS_READY } from "../lang.ts";
import type { MealRecord } from "../types.ts";
import { MEAL_NUTRIENT_COPY, mealNutrientTiles } from "./meal-nutrients.ts";

const meal = {
  fiber_g: 1.4,
  sugar_g: 2.2,
  sodium_mg: 319.2,
  satfat_g: 5.6,
} as Pick<MealRecord, "fiber_g" | "sugar_g" | "sodium_mg" | "satfat_g">;

describe("mealNutrientTiles", () => {
  it("draws the four figures in the meal-sheet order, with the board's English words", () => {
    expect(mealNutrientTiles(meal, "en")).toEqual([
      { key: "fiber", icon: "fibre", value: "1g", label: "Fiber" },
      { key: "sugar", icon: "sugar", value: "2g", label: "Sugar" },
      { key: "sodium", icon: "salt", value: "319mg", label: "Sodium" },
      { key: "satfat", icon: "satfat", value: "6g", label: "Sat fat" },
    ]);
  });

  it("formats through the reader's locale and keeps sodium in milligrams", () => {
    const tiles = mealNutrientTiles({ ...meal, sodium_mg: 1234.4 }, "ru");
    expect(tiles.map((t) => t.value)).toEqual(["1г", "2г", "1 234мг", "6г"]);
  });

  it("has the four tile labels in every shipped language", () => {
    for (const lang of LANGS_READY) {
      const copy = MEAL_NUTRIENT_COPY[lang];
      expect(copy, lang).toBeDefined();
      for (const key of ["fiber", "sugar", "sodium", "satfat"] as const) {
        expect(copy![key].length, `${lang}.${key}`).toBeGreaterThan(0);
      }
    }
  });
});
