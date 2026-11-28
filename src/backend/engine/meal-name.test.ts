// Rename a meal (calodex_app#3681): a nullable user-given `name` on the meal row, set via
// `EditMealRequest.name` (trimmed, length-capped, empty/null clears). Null falls back to `mealNames`.

import { beforeEach, describe, expect, it } from "bun:test";
import { MAX_MEAL_NAME, ROUTES, mealDisplayName, mealNames, type DayResponse } from "@eait/shared";
import { grantEveryAccount } from "../dev/grant.ts";
import { configDefaults, type Config } from "../config.ts";
import { demoPorts } from "../llm/demo.ts";
import { memoryStore } from "../store.memory.ts";
import type { Store } from "../store.ts";
import { fakePush } from "../push/fake.ts";
import { logMail } from "../mail/log.ts";
import { createRouter } from "../api/routes.ts";
import { confirmPendingMeal, editMeal, handleText, logSavedMeal, patchProfile, saveMealFromLog, type EngineDeps } from "./index.ts";

const CONFIG: Config = {
  ...configDefaults(), port: 0, databaseUrl: "memory://test",
  llmProvider: "demo", llmModel: "demo", llmApiKey: "unused", appleAudiences: [], googleAudiences: [],
};
let store: Store;
let deps: EngineDeps;
beforeEach(() => {
  store = grantEveryAccount(memoryStore(), 1_000_000);
  deps = { store, config: CONFIG, llm: demoPorts(), push: fakePush(), mail: logMail() };
});

async function loggedMeal(): Promise<{ userId: string; mealId: string }> {
  const { userId } = await store.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en");
  await store.addIdentity(userId, "google", "g-" + userId.slice(0, 8));
  const out = await patchProfile(deps, userId, {
    goal: "lose", sex: "female", birth_year: 1990, height_cm: 165, weight_kg: 70,
    target_weight_kg: 65, activity: "some", pace: "steady", country: "de",
    restrictions: [], complete_onboarding: true,
  });
  if (!out || !out.ok) throw new Error("onboarding failed");
  const res = await handleText(deps, userId, { text: "two eggs on toast" });
  if (res.kind !== "proposed") throw new Error("expected proposed");
  const c = await confirmPendingMeal(deps, userId, res.pendingId);
  if (c.kind !== "logged") throw new Error("expected logged");
  return { userId, mealId: c.mealId };
}

describe("renaming a meal", () => {
  it("stores a trimmed custom name and clears it on empty string, whitespace, or null", async () => {
    const { userId, mealId } = await loggedMeal();
    const before = (await store.getMeal(userId, mealId))!;
    expect(before.name).toBeNull();
    expect(mealDisplayName(before)).toBe(mealNames(before.items));

    const renamed = await editMeal(deps, userId, mealId, { name: "  Morning\nbreakfast\tbowl  " });
    if (renamed.kind !== "updated") throw new Error(`expected updated, got ${renamed.kind}`);
    expect(renamed.line).toBeNull();
    const after = (await store.getMeal(userId, mealId))!;
    expect(after.name).toBe("Morning breakfast bowl");
    expect(mealDisplayName(after)).toBe("Morning breakfast bowl");
    expect(after.kcal).toBe(before.kcal);
    expect(after.items).toEqual(before.items);

    const clearedEmpty = await editMeal(deps, userId, mealId, { name: "" });
    if (clearedEmpty.kind !== "updated") throw new Error("expected updated");
    expect((await store.getMeal(userId, mealId))!.name).toBeNull();

    await editMeal(deps, userId, mealId, { name: "Lunch" });
    await editMeal(deps, userId, mealId, { name: "   \n  " });
    expect((await store.getMeal(userId, mealId))!.name).toBeNull();

    await editMeal(deps, userId, mealId, { name: "Dinner" });
    await editMeal(deps, userId, mealId, { name: null });
    const cleared = (await store.getMeal(userId, mealId))!;
    expect(cleared.name).toBeNull();
    expect(mealDisplayName(cleared)).toBe(mealNames(cleared.items));
  });

  it("caps a name at MAX_MEAL_NAME and preserves it across numeric edits", async () => {
    const { userId, mealId } = await loggedMeal();
    const long = "x".repeat(MAX_MEAL_NAME + 20);
    const res = await editMeal(deps, userId, mealId, { name: long });
    if (res.kind !== "updated") throw new Error("expected updated");
    expect((await store.getMeal(userId, mealId))!.name).toBe("x".repeat(MAX_MEAL_NAME));

    await editMeal(deps, userId, mealId, { name: "Post-run oats" });
    const edited = await editMeal(deps, userId, mealId, { kcal: 550 });
    if (edited.kind !== "updated") throw new Error("expected updated");
    const m = (await store.getMeal(userId, mealId))!;
    expect(m.name).toBe("Post-run oats");
    expect(m.kcal).toBe(550);
  });

  it("does not clear an open question or flip corrected on a name-only edit", async () => {
    const { userId, mealId } = await loggedMeal();
    const question = { text: "Cooked in oil or dry?", options: ["In oil", "Dry"] };
    await store.updateMeal(userId, mealId, { question, corrected: false });

    const res = await editMeal(deps, userId, mealId, { name: "Weekday breakfast" });
    if (res.kind !== "updated") throw new Error("expected updated");
    const m = (await store.getMeal(userId, mealId))!;
    expect(m.name).toBe("Weekday breakfast");
    expect(m.question).toEqual(question);
    expect(m.corrected).toBe(false);
  });

  it("carries a custom name when saving and re-logging a saved meal", async () => {
    const { userId, mealId } = await loggedMeal();
    await editMeal(deps, userId, mealId, { name: "Weekday eggs" });

    const saved = await saveMealFromLog(deps, userId, mealId);
    if (saved.kind !== "saved") throw new Error(`expected saved, got ${saved.kind}`);
    expect(saved.meal.name).toBe("Weekday eggs");

    const relogged = await logSavedMeal(deps, userId, saved.meal.id, 0);
    if (relogged.kind !== "logged") throw new Error(`expected logged, got ${relogged.kind}`);
    const row = (await store.getMeal(userId, relogged.mealId))!;
    expect(row.name).toBe("Weekday eggs");
  });

  it("refuses another user's meal and leaves its name untouched", async () => {
    const { userId, mealId } = await loggedMeal();
    const other = await loggedMeal();
    await editMeal(deps, userId, mealId, { name: "Mine" });

    const r = await editMeal(deps, other.userId, mealId, { name: "Theirs" });
    expect(r.kind).toBe("target-gone");
    expect((await store.getMeal(userId, mealId))!.name).toBe("Mine");
  });

  it("PATCH /v1/meals/:id validates, saves, clears, and returns name on GET /v1/diary/day", async () => {
    const { userId, mealId } = await loggedMeal();
    const other = await loggedMeal();
    const tokA = await store.issueToken(userId);
    const tokB = await store.issueToken(other.userId);
    const handle = createRouter(deps, store, {
      verify: async () => { throw new Error("unused"); },
      verifyAppleNotification: async () => { throw new Error("unused"); },
    });
    const patch = (tok: string, body: unknown) => handle(new Request(`http://local${ROUTES.meal(mealId)}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${tok}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    }));

    expect((await patch(tokA, { name: "x".repeat(MAX_MEAL_NAME + 1) })).status).toBe(400);
    expect((await patch(tokA, { name: 123 })).status).toBe(400);
    expect((await patch(tokB, { name: "Stolen" })).status).toBe(409);

    const ok = await patch(tokA, { name: "  Friday lunch  " });
    expect(ok.status).toBe(200);
    const dayRes = await handle(new Request(`http://local${ROUTES.day}`, {
      headers: { authorization: `Bearer ${tokA}` },
    }));
    const dayBody = await dayRes.json() as DayResponse;
    expect(dayBody.meals.find((m) => m.id === mealId)?.name).toBe("Friday lunch");

    const cleared = await patch(tokA, { name: "" });
    expect(cleared.status).toBe(200);
    const dayAfter = await (await handle(new Request(`http://local${ROUTES.day}`, {
      headers: { authorization: `Bearer ${tokA}` },
    }))).json() as DayResponse;
    expect(dayAfter.meals.find((m) => m.id === mealId)?.name).toBeNull();
  });
});
