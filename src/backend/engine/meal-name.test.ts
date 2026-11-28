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

  it("does not clear an open question, flip corrected, bump version, or touch chat on a name-only edit", async () => {
    const { userId, mealId } = await loggedMeal();
    const question = { text: "Cooked in oil or dry?", options: ["In oil", "Dry"] };
    // Set a non-good verdict and a prior assistant comment on today's meal so any accidental
    // `afterCorrection` call would supersede the comment and append cap warnings.
    await store.updateMeal(userId, mealId, {
      question, corrected: false, kcal: 4500, verdicts: { weight: "bad" },
    });
    await store.appendChat(userId, [
      { role: "assistant", kind: "text", text: "Existing comment on this meal", speaker: "gabie", mealId },
    ]);
    const beforeVersion = (await store.getMealVersioned(userId, mealId))!.version;
    const chatBefore = await store.chatBefore(userId, null, 50);

    const res = await editMeal(deps, userId, mealId, { name: "Weekday breakfast" });
    if (res.kind !== "updated") throw new Error("expected updated");
    expect(res.line).toBeNull();
    const m = (await store.getMealVersioned(userId, mealId))!;
    expect(m.name).toBe("Weekday breakfast");
    expect(m.question).toEqual(question);
    expect(m.corrected).toBe(false);
    expect(m.version).toBe(beforeVersion);

    // Chat thread is completely untouched: existing comment survives and no duplicate cap line is added.
    const chatAfter = await store.chatBefore(userId, null, 50);
    expect(chatAfter.map((l) => [l.id, l.text])).toEqual(chatBefore.map((l) => [l.id, l.text]));

    // A concurrent version-pinned numeric edit taken before the rename still succeeds and preserves the name.
    const concurrent = await editMeal(deps, userId, mealId, { kcal: 520 }, { readVersion: beforeVersion });
    if (concurrent.kind !== "updated") throw new Error(`expected updated, got ${concurrent.kind}`);
    const afterConcurrent = (await store.getMeal(userId, mealId))!;
    expect(afterConcurrent.kcal).toBe(520);
    expect(afterConcurrent.name).toBe("Weekday breakfast");
  });

  it("strips control/NUL/bidi/zero-width chars, avoids lone UTF-16 surrogates, and preserves ZWJ emoji", async () => {
    const { userId, mealId } = await loggedMeal();

    // NUL byte, C0 control, bidi override, and Unicode line separator are cleaned cleanly.
    await editMeal(deps, userId, mealId, { name: "Chef\u0000\u0007\u202E\u2028bowl\u200B  \uFEFFspecial" });
    expect((await store.getMeal(userId, mealId))!.name).toBe("Chef bowl special");

    // Invisible-only string clears back to null.
    await editMeal(deps, userId, mealId, { name: "\u200B\uFEFF\u0000" });
    expect((await store.getMeal(userId, mealId))!.name).toBeNull();

    // ZWJ emoji survives intact.
    await editMeal(deps, userId, mealId, { name: "👨‍🍳 Home pasta" });
    expect((await store.getMeal(userId, mealId))!.name).toBe("👨‍🍳 Home pasta");

    // Astral emoji straddling MAX_MEAL_NAME does not leave a lone high surrogate.
    const atEdge = "a".repeat(MAX_MEAL_NAME - 1) + "🍲";
    await editMeal(deps, userId, mealId, { name: atEdge });
    const stored = (await store.getMeal(userId, mealId))!.name!;
    expect(stored).toBe("a".repeat(MAX_MEAL_NAME - 1));
    expect(/[\uD800-\uDFFF]/.test(stored)).toBe(false);
  });

  it("applies name together with a numeric edit, updating corrected, question, and changeLine", async () => {
    const { userId, mealId } = await loggedMeal();
    await store.updateMeal(userId, mealId, {
      question: { text: "Cooked in oil?", options: ["Yes", "No"] }, corrected: false,
    });
    const res = await editMeal(deps, userId, mealId, { name: "Big lunch", kcal: 777 });
    if (res.kind !== "updated") throw new Error("expected updated");
    expect(res.line).not.toBeNull();
    const m = (await store.getMeal(userId, mealId))!;
    expect(m.name).toBe("Big lunch");
    expect(m.kcal).toBe(777);
    expect(m.corrected).toBe(true);
    expect(m.question).toBeNull();
  });

  it("carries a custom name when saving and re-logging a saved meal, and leaves unnamed saved meals null", async () => {
    const first = await loggedMeal();
    const unnamedSaved = await saveMealFromLog(deps, first.userId, first.mealId);
    if (unnamedSaved.kind !== "saved") throw new Error("expected saved");
    const reloggedUnnamed = await logSavedMeal(deps, first.userId, unnamedSaved.meal.id, 0);
    if (reloggedUnnamed.kind !== "logged") throw new Error("expected logged");
    expect((await store.getMeal(first.userId, reloggedUnnamed.mealId))!.name).toBeNull();

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
