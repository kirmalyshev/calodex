import { describe, expect, it } from "bun:test";
import { retryableMealUpdate } from "./photo-queue.ts";

describe("a queued meal update's retryability", () => {
  it("retries overwrite edits but never an append, which a second run would duplicate", () => {
    expect(retryableMealUpdate({ kind: "ingredients", mealId: "m", clientId: "c", edit: { kcal: 500 } })).toBe(true);
    expect(retryableMealUpdate({ kind: "ingredients", mealId: "m", clientId: "c", edit: { add: { ref: "usda-sr:olive-oil", grams: 30 } } })).toBe(false);
    expect(retryableMealUpdate({ kind: "reread", mealId: "m", clientId: "c" })).toBe(true);
    expect(retryableMealUpdate({ kind: "note", mealId: "m", clientId: "c", text: "half that" })).toBe(false);
  });
});
