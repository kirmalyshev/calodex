// The ingredient editor's measurement state (calodex_app#3679), as data: which chip the panel
// opens on, and the `MealItem` a Done writes. PURE AND DOM-FREE ON PURPOSE, beside `portion.ts`
// for the same reason its header names — the browser tsconfig has `types: []`, so the arithmetic
// a test must reach cannot live behind a DOM it would have to fake. `test/measurement.test.ts`
// is the bun half.
//
// GRAMS REMAIN THE TRUTH. A portion is how the amount is SHOWN: picking a chip derives its count
// from the grams already typed, editing the count moves the grams (`portionGrams`), and Done
// writes the item through `itemAtPortion` — or `itemAtGrams`, which drops the measurement, when
// the grams chip is the selected one. An item with no catalog portions never reaches any of
// this: `catalogPortions` answers empty and the editor stays grams-only.

import type { MealItem } from "@eait/shared";
import { catalogPortions, itemAtGrams, itemAtPortion, portionCountFor } from "../shared/meal-edit.ts";

/**
 * The portion chip an item opens on: the catalog index of its STORED portion, so a meal already
 * measured in "slice" reopens on "slice". Null — the grams chip — when nothing is stored or the
 * stored measurement no longer matches a catalog row (a swap re-grounds the item, and a stale
 * measurement must never describe an amount it no longer makes).
 */
export function initialPortionIndex(item: MealItem): number | null {
  if (item.portion === undefined) return null;
  const found = catalogPortions(item).findIndex(
    (p) => p.label === item.portion!.label && p.grams === item.portion!.grams,
  );
  return found === -1 ? null : found;
}

/**
 * The item a Done writes. The grams chip is `portionIndex` NULL and drops the measurement
 * (`itemAtGrams`); a portion chip derives grams and nutrition off `count × portion` and stores
 * the measurement beside them (`itemAtPortion`). A null count — a field the user left unparseable
 * — falls back to what the typed grams already stand for, so the write never carries a count the
 * grams contradict. An index the catalog no longer carries is the grams chip's answer.
 */
export function measuredItem(
  item: MealItem,
  portionIndex: number | null,
  count: number | null,
  grams: number,
): MealItem {
  const portion = portionIndex === null ? undefined : catalogPortions(item)[portionIndex];
  if (portion === undefined) return itemAtGrams(item, grams);
  return itemAtPortion(item, portion, count ?? portionCountFor({ grams }, portion));
}
