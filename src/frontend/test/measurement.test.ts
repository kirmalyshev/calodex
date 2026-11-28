// The ingredient editor's measurement state (calodex_app#3679): chips a catalog item opens on,
// the count a portion pick derives, the item a Done writes — and the grams-only fallback.
import { describe, expect, it } from "bun:test";
import type { MealItem } from "@eait/shared";
import { catalogPortions, mealEditRequest, portionCountFor, portionGrams } from "../../shared/meal-edit.ts";
import { initialPortionIndex, measuredItem } from "../measurement.ts";

const SLICE = { label: "slice", grams: 30 };
const CUP = { label: "cup", grams: 158 };

/** A catalog-grounded item: a `ref` and the snapshot's portions are what the chips read. */
const catalogItem = (over: Partial<MealItem> = {}): MealItem => ({
  name: "Bread, white",
  grams: 60,
  kcal: 160,
  kcal_per_100g: 267,
  protein_g: 5.4,
  ref: "usda-foundation:123",
  food: {
    name: "Bread, white",
    source: "usda-foundation",
    per100: { kcal: 267, protein_g: 9, carbs_g: 49, fat_g: 3.2 },
    attribution: [],
    portions: [SLICE, CUP],
  },
  ...over,
});

/** A grams-only item: no catalog ref, so no portions to measure in. */
const plainItem = (over: Partial<MealItem> = {}): MealItem => ({
  name: "Homemade stew",
  grams: 250,
  kcal: 300,
  ...over,
});

describe("the measurement chips (calodex_app#3679)", () => {
  it("offers every catalog portion of a grounded item, none for a grams-only one", () => {
    expect(catalogPortions(catalogItem())).toEqual([SLICE, CUP]);
    expect(catalogPortions(plainItem())).toEqual([]);
    // A ref without a snapshot's portions is grams-only too — rows stored before portions existed.
    expect(catalogPortions(plainItem({ ref: "usda-foundation:9", food: undefined }))).toEqual([]);
  });

  it("opens on the stored portion when the catalog still carries it, grams otherwise", () => {
    expect(initialPortionIndex(catalogItem())).toBeNull();
    expect(initialPortionIndex(catalogItem({ portion: CUP, portion_count: 0.38 }))).toBe(1);
    expect(initialPortionIndex(catalogItem({ portion: SLICE, portion_count: 2 }))).toBe(0);
    // A stored measurement the catalog no longer carries must not describe the amount.
    expect(initialPortionIndex(catalogItem({ portion: { label: "handful", grams: 20 }, portion_count: 3 }))).toBeNull();
    expect(initialPortionIndex(plainItem())).toBeNull();
  });

  it("derives the count from the current grams when a portion chip is picked", () => {
    const item = catalogItem();
    const portions = catalogPortions(item);
    expect(portionCountFor({ grams: item.grams }, portions[0]!)).toBe(2);
    expect(portionCountFor({ grams: 79 }, portions[1]!)).toBe(0.5);
  });
});

describe("measuredItem — what Done writes", () => {
  it("a portion chip writes grams off portionGrams and stores the measurement", () => {
    const item = catalogItem();
    const out = measuredItem(item, 0, 3, 60);
    expect(out.grams).toBe(portionGrams(SLICE, 3));
    expect(out.grams).toBe(90);
    expect(out.portion).toEqual(SLICE);
    expect(out.portion_count).toBe(3);
    // Nutrition moves with the derived grams off the item's own density.
    expect(out.kcal).toBe(Math.round(267 * 90 / 100));
  });

  it("a null count falls back to what the typed grams already stand for", () => {
    const item = catalogItem();
    const out = measuredItem(item, 0, null, 60);
    expect(out.grams).toBe(60);
    expect(out.portion_count).toBe(2);
  });

  it("a zero count answers in grams rather than writing portion_count zero", () => {
    const item = catalogItem({ portion: SLICE, portion_count: 2 });
    const out = measuredItem(item, 0, 0, 0);
    expect(out.grams).toBe(0);
    expect(out.portion).toBeUndefined();
    expect(out.portion_count).toBeUndefined();
  });

  it("the grams chip drops the measurement even when the item stored one", () => {
    const item = catalogItem({ portion: SLICE, portion_count: 2 });
    const out = measuredItem(item, null, 2, 100);
    expect(out.grams).toBe(100);
    expect(out.portion).toBeUndefined();
    expect(out.portion_count).toBeUndefined();
    expect(out.kcal).toBe(267);
  });

  it("a grams-only item scales in plain grams and never gains a measurement", () => {
    const item = plainItem();
    const out = measuredItem(item, null, null, 500);
    expect(out.grams).toBe(500);
    expect(out.kcal).toBe(600);
    expect(out.portion).toBeUndefined();
    expect(out.portion_count).toBeUndefined();
  });

  it("a portion index the catalog does not carry answers in grams", () => {
    const item = catalogItem();
    const out = measuredItem(item, 7, 2, 80);
    expect(out.grams).toBe(80);
    expect(out.portion).toBeUndefined();
  });

  it("the patch carries the measurement — mealEditRequest sees it as a change", () => {
    const item = catalogItem();
    const meal = { items: [item] };
    const edited = measuredItem(item, 0, 3, 60);
    const req = mealEditRequest(meal, [edited]);
    expect(req).not.toBeNull();
    expect(req!.items![0]!.portion).toEqual(SLICE);
    expect(req!.items![0]!.portion_count).toBe(3);
    // And a Done that moved nothing — same grams, same measurement — writes nothing.
    const unchanged = measuredItem(
      catalogItem({ portion: SLICE, portion_count: 2 }), 0, 2, 60,
    );
    expect(mealEditRequest({ items: [catalogItem({ portion: SLICE, portion_count: 2 })] }, [unchanged])).toBeNull();
  });
});
