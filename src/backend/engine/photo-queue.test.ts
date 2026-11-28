import { describe, expect, it } from "bun:test";
import { mealUpdateRequestVersion, retryableMealUpdate } from "./photo-queue.ts";

describe("a queued meal update's retryability", () => {
  it("retries overwrite edits but never an append, which a second run would duplicate", () => {
    expect(retryableMealUpdate({ kind: "ingredients", mealId: "m", clientId: "c", edit: { kcal: 500 } })).toBe(true);
    expect(retryableMealUpdate({ kind: "ingredients", mealId: "m", clientId: "c", edit: { add: { ref: "usda-sr:olive-oil", grams: 30 } } })).toBe(false);
    expect(retryableMealUpdate({ kind: "reread", mealId: "m", clientId: "c" })).toBe(true);
    expect(retryableMealUpdate({ kind: "note", mealId: "m", clientId: "c", text: "half that" })).toBe(false);
  });
});

describe("a queued meal update's handler version", () => {
  it("keeps plain overwrites on version 1 and sends appends or named portions only to a worker that knows them", () => {
    expect(mealUpdateRequestVersion({ kind: "ingredients", mealId: "m", clientId: "c", edit: { kcal: 500 } })).toBe(1);
    expect(mealUpdateRequestVersion({ kind: "ingredients", mealId: "m", clientId: "c", edit: { add: { ref: "usda-sr:olive-oil", grams: 30 } } })).toBe(3);
    expect(mealUpdateRequestVersion({ kind: "ingredients", mealId: "m", clientId: "c", edit: { items: [{ name: "egg", grams: 100, portion: { label: "large", grams: 50 }, portion_count: 2 }] } })).toBe(3);
    expect(mealUpdateRequestVersion({ kind: "note", mealId: "m", clientId: "c", text: "half that" })).toBe(1);
  });

  it("sends a typed catalog nutrient only to a worker whose edits can detach the row", () => {
    const food = {
      name: "Olive oil", source: "usda-sr" as const, attribution: [],
      per100: { kcal: 884, protein_g: 0, carbs_g: 0, fat_g: 100 },
    };
    const exact = { name: "Olive oil", grams: 30, ref: "usda-sr:olive-oil", food, kcal: 265, protein_g: 0, carbs_g: 0, fat_g: 30 };
    const typed = { ...exact, kcal: 300, nutrition_override: true as const };
    expect(mealUpdateRequestVersion({ kind: "ingredients", mealId: "m", clientId: "c", edit: { items: [exact] } })).toBe(1);
    expect(mealUpdateRequestVersion({ kind: "ingredients", mealId: "m", clientId: "c", edit: { items: [typed] } })).toBe(4);
    expect(mealUpdateRequestVersion({ kind: "ingredients", mealId: "m", clientId: "c", edit: { items: [{ ...typed, portion: { label: "tbsp", grams: 13.5 }, portion_count: 2 }] } })).toBe(4);
  });
});
