// Servings on ANY meal (#3677): 1 serving = the meal as logged; N scales items and totals, the
// verdicts are recomputed, and the count is stored so a re-open starts at it.

import { beforeEach, describe, expect, it } from "bun:test";
import { grantEveryAccount } from "../dev/grant.ts";
import { configDefaults, type Config } from "../config.ts";
import { demoPorts } from "../llm/demo.ts";
import { memoryStore } from "../store.memory.ts";
import type { Store } from "../store.ts";
import { fakePush } from "../push/fake.ts";
import { logMail } from "../mail/log.ts";
import { confirmPendingMeal, editMeal, handleText, patchProfile, type EngineDeps } from "./index.ts";

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

describe("servings on a meal that is not a label scan", () => {
  it("scales items and totals, stores the count, and a second edit scales from the stored count", async () => {
    const { userId, mealId } = await loggedMeal();
    const before = (await store.getMeal(userId, mealId))!;
    expect(before.label ?? null).toBeNull();

    const two = await editMeal(deps, userId, mealId, { servings: 2 });
    if (two.kind !== "updated") throw new Error(`expected updated, got ${two.kind}`);
    const m2 = (await store.getMeal(userId, mealId))!;
    expect(m2.kcal).toBe(Math.round(before.kcal * 2));
    expect(m2.items[0]!.grams).toBeCloseTo(before.items[0]!.grams * 2, 0);
    expect(m2.servings).toBe(2);
    expect(m2.label ?? null).toBeNull();

    const half = await editMeal(deps, userId, mealId, { servings: 0.5 });
    if (half.kind !== "updated") throw new Error("expected updated");
    const mh = (await store.getMeal(userId, mealId))!;
    expect(mh.kcal).toBe(Math.round(before.kcal * 0.5));
    expect(mh.servings).toBe(0.5);
    expect(mh.label ?? null).toBeNull();
  });

  it("keeps a nutrition-label meal marked as a label, and scales from the label count stored before this field existed", async () => {
    const { userId, mealId } = await loggedMeal();
    await store.updateMeal(userId, mealId, {
      label: { servings: 2 },
      items: [{ name: "Rice", grams: 100, kcal: 100, protein_g: 10, carbs_g: 20, fat_g: 5 }],
      kcal: 100, protein_g: 10, carbs_g: 20, fat_g: 5,
    });
    const before = (await store.getMeal(userId, mealId))!;

    const three = await editMeal(deps, userId, mealId, { servings: 3 });
    if (three.kind !== "updated") throw new Error("expected updated");
    const m = (await store.getMeal(userId, mealId))!;
    expect(m.servings).toBe(3);
    expect(m.label?.servings).toBe(3);
    expect(m.kcal).toBe(150);
  });

  it("reads a label scan's count first, so a write from a released server cannot diverge from the meal column", async () => {
    const { userId, mealId } = await loggedMeal();
    // The mixed-deploy state: the meal column says one count, while a released server — which
    // knows only `label.servings` — has since written another. The count it wrote is the count
    // the totals actually represent.
    await store.updateMeal(userId, mealId, { label: { servings: 2 }, servings: 3 });
    const before = (await store.getMeal(userId, mealId))!;

    const four = await editMeal(deps, userId, mealId, { servings: 4 });
    if (four.kind !== "updated") throw new Error("expected updated");
    const m = (await store.getMeal(userId, mealId))!;
    expect(m.kcal).toBe(Math.round(before.kcal * 2));
    expect(m.servings).toBe(4);
    expect(m.label?.servings).toBe(4);
  });

  it("keeps a density-backed item consistent with itself, and the meal total as its items' sum", async () => {
    const { userId, mealId } = await loggedMeal();
    const items = [{
      name: "Rice", name_en: "rice", grams: 101, kcal: 101, kcal_per_100g: 100,
      protein_g: 2.1, carbs_g: 22.2, fat_g: 0.3,
    }];
    await store.updateMeal(userId, mealId, { items, kcal: 101, protein_g: 2.1, carbs_g: 22.2, fat_g: 0.3 });

    const half = await editMeal(deps, userId, mealId, { servings: 0.5 });
    if (half.kind !== "updated") throw new Error("expected updated");
    const m = (await store.getMeal(userId, mealId))!;
    expect(m.items[0]).toMatchObject({ grams: 50.5, kcal: 51, kcal_per_100g: 100 });
    expect(m.kcal).toBe(51);
    expect(m.items[0]!.protein_g).toBe(m.protein_g);
    expect(m.items[0]!.carbs_g).toBe(m.carbs_g);
    expect(m.items[0]!.fat_g).toBe(m.fat_g);
  });

  it("refuses another user's meal", async () => {
    const { mealId } = await loggedMeal();
    const other = await loggedMeal();
    const r = await editMeal(deps, other.userId, mealId, { servings: 2 });
    expect(r.kind).toBe("target-gone");
  });
});
