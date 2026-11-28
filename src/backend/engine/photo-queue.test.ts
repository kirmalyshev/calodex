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
});
