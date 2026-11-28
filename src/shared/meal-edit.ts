// The meal edit's arithmetic (#188) — what the web's "Edit ingredient" panel and the phone's
// own send to `PATCH /v1/meals/:id`, and the deep links that open those panels.
//
// TWO RULES IT CARRIES:
//
//  1. AN ITEM'S OWN DENSITY WINS. `kcal_per_100g` is what a substitution rescales by, said in
//     MealItem's own comment; an item without one falls back to plain proportion — the same
//     rule `firstMealEdit` applies to a whole plate, so a grams edit and a portion agree where
//     they meet.
//  2. THE CLIENT SENDS ITEMS, NEVER MEAL TOTALS. `editMeal` derives the meal's kcal and macros
//     from the items on an items-only patch — totals the client computed would be a second copy
//     of that rule. Verdicts are recomputed server-side off the user's caps after every write
//     either way, so nothing a client sends can paint over them.

import type { EditMealItem, EditMealRequest } from "./contract.ts";
import { LANG_TAG } from "./lang.ts";
import type { Lang } from "./types.ts";
import type { FoodPortion } from "./foods.ts";
import type { MealAnalysis, MealItem, MealRecord } from "./types.ts";

/** The servings a meal row stands for. A label scan's count comes first while released servers still write only there; then the meal's own count, then one as logged. */
export function mealServings(meal: Pick<MealRecord, "servings" | "label">): number {
  return meal.label?.servings ?? meal.servings ?? 1;
}

const tenth = (n: number): number => Math.round(n * 10) / 10;

/**
 * The figures a servings edit would make, for the stepper's preview only (#3677): the stored
 * totals divided by the stored count and multiplied by the shown count, rounded as display. The
 * write is `{ servings }` alone — this is never sent.
 */
export function servingsPreview(
  meal: Pick<MealRecord, "kcal" | "protein_g" | "carbs_g" | "fat_g" | "servings" | "label">,
  servings: number,
): { kcal: number; protein_g: number; carbs_g: number; fat_g: number } {
  const stored = mealServings(meal);
  const scale = (v: number): number => Math.round((v / stored) * servings);
  return { kcal: scale(meal.kcal), protein_g: scale(meal.protein_g), carbs_g: scale(meal.carbs_g), fat_g: scale(meal.fat_g) };
}

const whole = (n: number): number => Math.round(n);

/**
 * One item at a new amount: the grams the editor typed, its kcal off the stored density (the
 * proportion only when there is none), and the macros scaled in step. `name_en` and `role`
 * survive untouched — they are the repertoire's keys, not display.
 */
export function scaledItem(item: MealItem, grams: number): MealItem {
  const f = item.grams > 0 ? grams / item.grams : 0;
  const macro = (v: number | undefined): number | undefined =>
    v === undefined ? undefined : tenth(v * f);
  return {
    ...item,
    grams,
    ...(item.portion_count !== undefined ? { portion_count: tenth(item.portion_count * f) } : {}),
    kcal: item.kcal_per_100g !== undefined ? whole(item.kcal_per_100g * grams / 100)
      : item.kcal !== undefined ? whole(item.kcal * f) : undefined,
    protein_g: macro(item.protein_g),
    carbs_g: macro(item.carbs_g),
    fat_g: macro(item.fat_g),
  };
}

/** The grams a named portion count stands for, rounded as every item amount is. Grams remain the truth; the portion is how they are shown. */
export function portionGrams(portion: FoodPortion, count: number): number {
  return tenth(portion.grams * count);
}

/** The catalog portions an item may be measured in — its stored snapshot, only while a catalog ref still grounds it. */
export function catalogPortions(item: MealItem): FoodPortion[] {
  return item.ref === undefined ? [] : (item.food?.portions ?? []).filter((p) => p.label.length > 0 && Number.isFinite(p.grams) && p.grams > 0);
}

/** How many of `portion` an item's grams stand for. A count is an amount input, so it keeps hundredths rather than the weight formatter's tenth. */
export function portionCountFor(item: Pick<MealItem, "grams">, portion: FoodPortion): number {
  return Math.round((item.grams / portion.grams) * 100) / 100;
}

/** The count in the input, localized by `Intl` and precise to hundredths. */
export function portionCountText(lang: Lang, count: number): string {
  return new Intl.NumberFormat(LANG_TAG[lang], { maximumFractionDigits: 2 }).format(count);
}

/** One item measured as `count × portion`: the grams and nutrition are derived, then the measurement is stored beside them. */
export function itemAtPortion(item: MealItem, portion: FoodPortion, count: number): MealItem {
  return { ...scaledItem(item, portionGrams(portion, count)), portion, portion_count: count };
}

/** One item back in plain grams: a stale measurement must never describe an amount it no longer makes. */
export function itemAtGrams(item: MealItem, grams: number): MealItem {
  const { portion: _portion, portion_count: _count, ...rest } = scaledItem(item, grams);
  return rest;
}

/**
 * The figures typing an ingredient's calories and macros sends (#3680). `write` keeps every
 * provenance field the item already carries — ref/food/portion are provenance, not truth — so the
 * server's detach rule can judge exactly what the edit grounded itself in. `display` is what the
 * saved item will BECOME: provenance dropped, the typed total made coherent as an estimate by the
 * same density/grams rule the engine applies. `null` until all four core nutrients are present —
 * the server refuses a partial override.
 */
export function nutritionOverrideItem(
  base: MealItem,
  nutrition: Pick<MealItem, "kcal" | "protein_g" | "carbs_g" | "fat_g">,
): { write: EditMealItem; display: MealItem } | null {
  const fields = [nutrition.kcal, nutrition.protein_g, nutrition.carbs_g, nutrition.fat_g];
  if (fields.some((v) => v === undefined || !Number.isFinite(v))) return null;
  const write: EditMealItem = { ...base, ...nutrition, nutrition_override: true };
  const display: MealItem = { ...write };
  delete display.ref;
  delete display.food;
  delete display.portion;
  delete display.portion_count;
  delete (display as Partial<EditMealItem>).nutrition_override;
  if (display.grams > 0 && display.kcal_per_100g !== undefined) {
    const consistent = Math.abs((display.kcal_per_100g * display.grams) / 100 - nutrition.kcal) < 0.5;
    if (!consistent) delete display.kcal_per_100g;
  }
  return { write, display };
}

const ITEM_TOTALS = ["kcal", "protein_g", "carbs_g", "fat_g"] as const;

/**
 * The `PATCH /v1/meals/:id` body for an edited item list — `{ items }` and nothing else; the
 * server derives the meal's totals from them — or NULL when nothing moved, so a Done pressed
 * unchanged writes nothing (#49's rule: no card about a meal that did not change).
 */
export function mealEditRequest(
  meal: Pick<MealAnalysis, "items">,
  items: MealItem[],
): EditMealRequest | null {
  const same = meal.items.length === items.length && meal.items.every((o, i) => {
    const it = items[i]!;
    return o.name === it.name && o.name_en === it.name_en && o.grams === it.grams &&
      o.portion?.label === it.portion?.label && o.portion?.grams === it.portion?.grams &&
      o.portion_count === it.portion_count &&
      ITEM_TOTALS.every((f) => o[f] === it[f]);
  });
  return same ? null : { items };
}

/**
 * The ingredient editor's live figures (`meal-ingredient`'s "540 → 605"): the item's own kcal at
 * the new grams, and the meal's total moved by that delta — the meal's kcal is its items' sum
 * (the one doctrine `prepareAnalysis` writes), so the item's own move is the meal's move. A
 * preview moves a number, never a verdict: the write recomputes those. `null` when the item
 * carries no kcal — a guessed figure is worse than none, and the saved answer is the server's
 * either way.
 */
export function previewKcal(
  meal: { kcal: number; items: readonly MealItem[] },
  index: number,
  grams: number,
): { item: number; meal: number } | null {
  const target = meal.items[index];
  if (target === undefined) return null;
  const next = scaledItem(target, grams);
  if (target.kcal === undefined || next.kcal === undefined) return null;
  return { item: next.kcal, meal: meal.kcal + (next.kcal - target.kcal) };
}

/**
 * The `#/meal/<id>` deep links' query (#188): `fix` opens the fix sheet, `item=<n>` the
 * ingredient's editor. `item` accepts digits only — `parseInt("1abc")` must not open a row.
 */
export function mealEditParams(query: string): { fix: boolean; item: number | null } {
  const p = new URLSearchParams(query);
  const raw = p.get("item");
  return { fix: p.has("fix"), item: raw !== null && /^\d+$/.test(raw) ? Number(raw) : null };
}
