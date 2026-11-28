// The meal edit's arithmetic (#188): grams → numbers on one item, items → the PATCH body, and
// the deep-link query. The tinted line a recomputed detail names the change with is
// `MealUpdated.line` — the engine's `changeLine`, sent on the result rather than composed here;
// and the meal's totals are the SERVER's job on an items-only patch (`editMeal` derives them).

import { describe, expect, it } from "bun:test";
import { catalogPortions, itemAtGrams, itemAtPortion, mealEditParams, mealEditRequest, mealServings, portionCountFor, portionCountText, portionGrams, scaledItem, servingsPreview } from "./meal-edit.ts";
import type { MealItem } from "./types.ts";

const rice = (over: Partial<MealItem> = {}): MealItem => ({
  name: "Rice", name_en: "rice", grams: 150, kcal: 195, kcal_per_100g: 130,
  protein_g: 3, carbs_g: 42, fat_g: 0.6, ...over,
});
const salmon: MealItem = {
  name: "Salmon", name_en: "salmon", grams: 140, kcal: 290, kcal_per_100g: 207,
  protein_g: 30, carbs_g: 0, fat_g: 18,
};
const broccoli: MealItem = { name: "Broccoli", name_en: "broccoli", grams: 90, kcal: 55 };
const MEAL = { items: [salmon, rice(), broccoli] };

describe("scaledItem — one ingredient at a new amount", () => {
  it("scales kcal by the item's own density when it has one", () => {
    expect(scaledItem(rice(), 200)).toMatchObject({ grams: 200, kcal: 260 });
  });
  it("scales the macros proportionally, keeping a tenth", () => {
    const s = scaledItem(rice(), 200);
    expect(s.protein_g).toBe(4);        // 3 × 4/3
    expect(s.carbs_g).toBe(56);         // 42 × 4/3
    expect(s.fat_g).toBe(0.8);          // 0.6 × 4/3
  });
  it("scales kcal proportionally when no density is stored", () => {
    expect(scaledItem(broccoli, 180).kcal).toBe(110);
  });
  it("keeps name_en and role — they are the repertoire's keys, not display", () => {
    expect(scaledItem({ ...rice(), role: "cooking-fat" }, 300).role).toBe("cooking-fat");
    expect(scaledItem(rice(), 300).name_en).toBe("rice");
  });
  it("scales a chosen portion's count with the grams, so meal servings keep the pair honest", () => {
    const portion = { label: "cup", grams: 150 };
    const s = scaledItem({ ...rice(), portion, portion_count: 1 }, 300);
    expect(s.portion).toEqual(portion);
    expect(s.portion_count).toBe(2);
  });
});

describe("named portions on one ingredient", () => {
  const cup = { label: "cup", grams: 150 };

  it("reads portions only from a catalog-grounded item's stored snapshot", () => {
    expect(catalogPortions({ ...rice(), portion: cup, portion_count: 2 })).toEqual([]);
    expect(catalogPortions({ ...rice(), ref: "usda-sr:rice", food: { name: "Rice", source: "usda-sr", attribution: [], portions: [cup], per100: { kcal: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, satfat_g: 0.1, fiber_g: 0.4, sugar_g: 0.1, sodium_mg: 1 } } })).toEqual([cup]);
  });

  it("derives and formats a count as a decimal input, never a grammage", () => {
    expect(portionCountFor({ ...rice(), grams: 300 }, cup)).toBe(2);
    expect(portionCountFor({ ...rice(), grams: 151 }, cup)).toBeCloseTo(1.01, 5);
    expect(portionCountText("en", 1.5)).toBe("1.5");
    expect(portionCountText("en", 2)).toBe("2");
  });

  it("turns a portion and its count into the grams that remain the truth", () => {
    expect(portionGrams(cup, 2)).toBe(300);
    expect(portionGrams({ label: "tbsp", grams: 14.2 }, 1.5)).toBe(21.3);
  });

  it("scales the item at those grams and stores the measurement beside them", () => {
    const next = itemAtPortion(rice(), cup, 2);
    expect(next).toMatchObject({ grams: 300, kcal: 390, portion: cup, portion_count: 2 });
    expect(next.protein_g).toBe(6);
  });

  it("returns to plain grams by dropping the measurement rather than letting it lie", () => {
    const plain = itemAtGrams({ ...rice(), portion: cup, portion_count: 2 }, 180);
    expect(plain.grams).toBe(180);
    expect(plain).not.toHaveProperty("portion");
    expect(plain).not.toHaveProperty("portion_count");
  });
});

describe("mealEditRequest — the PATCH body is items, or null when nothing moved", () => {
  it("is null when the items are the same", () => {
    expect(mealEditRequest(MEAL, MEAL.items)).toBeNull();
  });
  it("sends the edited items and nothing else — the server derives the totals", () => {
    const items = [salmon, scaledItem(rice(), 200), broccoli];
    const req = mealEditRequest(MEAL, items);
    expect(req).toEqual({ items });
    expect(req).not.toHaveProperty("kcal");
    expect(req).not.toHaveProperty("protein_g");
  });
  it("sends the shortened list on a removal", () => {
    expect(mealEditRequest(MEAL, [salmon, broccoli])).toEqual({ items: [salmon, broccoli] });
  });
  it("a measurement alone is a change even when the grams it makes are unchanged", () => {
    const portion = { label: "cup", grams: 150 };
    const items = [salmon, { ...rice(), portion, portion_count: 1 }, broccoli];
    expect(mealEditRequest(MEAL, items)).toEqual({ items });
  });
});

describe("servings on any meal (#3677)", () => {
  const plate = { kcal: 600, protein_g: 30, carbs_g: 60, fat_g: 20 };

  it("reads one serving as logged, a label scan's compatible count first, and the meal's own count after it", () => {
    expect(mealServings({})).toBe(1);
    expect(mealServings({ label: { servings: 2 } })).toBe(2);
    // A released server knows only `label.servings`; while one can still write, that count wins
    // over a top-level count it could not update (#3677 rolling-deploy compatibility).
    expect(mealServings({ servings: 3, label: { servings: 2 } })).toBe(2);
  });

  it("previews the figures at a new count from the stored count, rounded for display", () => {
    expect(servingsPreview({ ...plate, servings: 2 }, 1)).toEqual({ kcal: 300, protein_g: 15, carbs_g: 30, fat_g: 10 });
    expect(servingsPreview(plate, 2)).toEqual({ kcal: 1200, protein_g: 60, carbs_g: 120, fat_g: 40 });
  });

  it("falls back to a label scan's legacy count when the meal has none of its own", () => {
    expect(servingsPreview({ ...plate, label: { servings: 2 } }, 3).kcal).toBe(900);
  });
});

describe("mealEditParams — the ?fix / ?item deep links", () => {
  it("reads the fix flag and a digit item index", () => {
    expect(mealEditParams("fix")).toEqual({ fix: true, item: null });
    expect(mealEditParams("item=2")).toEqual({ fix: false, item: 2 });
    expect(mealEditParams("fix&item=0")).toEqual({ fix: true, item: 0 });
    expect(mealEditParams("")).toEqual({ fix: false, item: null });
    expect(mealEditParams("d=2026-09-27")).toEqual({ fix: false, item: null });
  });
  it("refuses an index that is not all digits — parseInt would have taken '1abc'", () => {
    expect(mealEditParams("item=1abc")).toEqual({ fix: false, item: null });
    expect(mealEditParams("item=-1")).toEqual({ fix: false, item: null });
    expect(mealEditParams("item=")).toEqual({ fix: false, item: null });
  });
});
