// Saved meals web client API + swipe geometry (calodex_app#3685).
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import type { MealLogged } from "../../shared/results.ts";
import {
  ApiError, deleteSavedMeal, forget, listSavedMeals, logSavedMeal, saveMeal, signIn,
} from "../api.ts";
import { clampRowSwipe, shouldOpenRowSwipe } from "../row-swipe.ts";

type Call = { url: string; method: string; body: string | null };

let calls: Call[] = [];
let answer: (call: Call) => Response;
const realFetch = globalThis.fetch;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const SAMPLE_SAVED = {
  id: "sv-1",
  source_meal_id: "meal-1",
  name: "Porridge with berries",
  items: [{ name: "Porridge", grams: 250, kcal: 312 }],
  kcal: 312,
  protein_g: 11,
  carbs_g: 52,
  fat_g: 7,
  satfat_g: 1.5,
  fiber_g: 6,
  sugar_g: 12,
  sodium_mg: 90,
  created_at: "2026-11-28T00:00:00.000Z",
};

beforeEach(async () => {
  calls = [];
  forget();
  globalThis.fetch = ((input: string | URL | Request, init: RequestInit = {}) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith("/") || url.startsWith("//")) return realFetch(input as never, init);
    const call = {
      url,
      method: init.method ?? "GET",
      body: typeof init.body === "string" ? init.body : null,
    };
    calls.push(call);
    if (url === "/start/session/token") return Promise.resolve(json({ token: "tok" }));
    return Promise.resolve(answer(call));
  }) as unknown as typeof fetch;
  await signIn();
  calls = [];
});

afterEach(() => { globalThis.fetch = realFetch; });

describe("saved-meals web API helpers", () => {
  it("lists saved meals from GET /api/v1/saved-meals", async () => {
    answer = () => json({ meals: [SAMPLE_SAVED] });
    expect(await listSavedMeals()).toEqual([SAMPLE_SAVED]);
    expect(calls).toEqual([{ url: "/api/v1/saved-meals", method: "GET", body: null }]);
  });

  it("saves a meal via POST /api/v1/saved-meals with { mealId }", async () => {
    answer = () => json({ meal: SAMPLE_SAVED });
    expect(await saveMeal("meal-1")).toEqual(SAMPLE_SAVED);
    expect(calls).toEqual([
      { url: "/api/v1/saved-meals", method: "POST", body: JSON.stringify({ mealId: "meal-1" }) },
    ]);
  });

  it("deletes a saved meal and treats 409 target-gone as already removed", async () => {
    answer = () => json({ ok: true });
    await deleteSavedMeal("sv/1");
    expect(calls[0]).toEqual({ url: "/api/v1/saved-meals/sv%2F1", method: "DELETE", body: null });

    answer = () => json({ error: "target-gone", on: "saved-meal" }, 409);
    await expect(deleteSavedMeal("sv-gone")).resolves.toBeUndefined();

    answer = () => json({ error: "server-error" }, 500);
    await expect(deleteSavedMeal("sv-err")).rejects.toBeInstanceOf(ApiError);
  });

  it("logs a saved meal onto today and maps 409 target-gone to a TargetGone result", async () => {
    const logged: MealLogged = {
      kind: "logged", mealId: "m-new",
      analysis: {
        isFood: true, items: SAMPLE_SAVED.items, kcal: 312,
        protein_g: 11, carbs_g: 52, fat_g: 7, satfat_g: 1.5, fiber_g: 6, sugar_g: 12, sodium_mg: 90,
        confidence: "high", notes: "", verdicts: {}, healthScore: null,
      },
      totals: { kcal: 312, protein_g: 11, carbs_g: 52, fat_g: 7, satfat_g: 1.5, fiber_g: 6, sugar_g: 12, sodium_mg: 90, guessed: false },
      date: "2026-11-28", hint: "correction",
      verdictLabels: [], verdictHeadline: "",
    };
    answer = () => json(logged);
    expect(await logSavedMeal("sv-1")).toEqual(logged);
    expect(calls[0]).toEqual({
      url: "/api/v1/saved-meals/sv-1/log",
      method: "POST",
      body: JSON.stringify({ dayOffset: 0 }),
    });

    answer = () => json({ error: "target-gone", on: "saved-meal" }, 409);
    expect(await logSavedMeal("sv-gone")).toEqual({ kind: "target-gone", on: "saved-meal" });

    answer = () => json({ error: "subscription-required" }, 402);
    await expect(logSavedMeal("sv-1")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("saved-meal row swipe geometry (88px action width)", () => {
  it("clamps drag between 0 and -88", () => {
    expect(clampRowSwipe(0, -120, 88)).toBe(-88);
    expect(clampRowSwipe(-88, 120, 88)).toBe(0);
    expect(clampRowSwipe(0, -40, 88)).toBe(-40);
    expect(shouldOpenRowSwipe(false, -40)).toBe(true);
    expect(shouldOpenRowSwipe(true, 40)).toBe(false);
  });
});
