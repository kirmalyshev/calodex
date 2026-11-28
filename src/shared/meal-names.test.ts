import { describe, expect, it } from "bun:test";
import { mealDisplayName, mealNames } from "./meal-names.ts";

describe("mealDisplayName", () => {
  const items = [{ name: "chicken breast" }, { name: "rice" }, { name: "broccoli" }];

  it("uses the custom name when set and non-blank", () => {
    expect(mealDisplayName({ name: "Post-workout lunch", items })).toBe("Post-workout lunch");
    expect(mealDisplayName({ name: "  Post-workout lunch  ", items })).toBe("Post-workout lunch");
  });

  it("falls back to mealNames(items) when name is null, absent, or blank", () => {
    expect(mealDisplayName({ name: null, items })).toBe(mealNames(items));
    expect(mealDisplayName({ items })).toBe(mealNames(items));
    expect(mealDisplayName({ name: "", items })).toBe(mealNames(items));
    expect(mealDisplayName({ name: "   ", items })).toBe(mealNames(items));
  });

  it("returns empty string when both custom name and items are empty", () => {
    expect(mealDisplayName({ name: null, items: [] })).toBe("");
    expect(mealDisplayName({ name: "  ", items: [] })).toBe("");
  });
});
