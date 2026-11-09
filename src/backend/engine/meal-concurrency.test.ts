// ieat-app#2695: concurrent edits, a redate over a correction, a re-shown proposal's verdicts,
// a confirm whose insert throws after committing, and a read that deletes.

import { beforeEach, describe, expect, it } from "bun:test";
import { configDefaults, type Config } from "../config.ts";
import { demoPorts } from "../llm/demo.ts";
import { memoryStore } from "../store.memory.ts";
import { fakePush } from "../push/fake.ts";
import { logMail } from "../mail/log.ts";
import { day } from "./diary.ts";
import { confirmPendingMeal, editMeal, gatedVerdicts, pendingMeals } from "./meals.ts";
import { patchProfile, type EngineDeps } from "./index.ts";
import type { PendingMeal } from "../store.ts";

const CONFIG: Config = {
  ...configDefaults(),
  port: 0, databaseUrl: "memory://test",
  llmProvider: "demo", llmModel: "demo", llmApiKey: "unused",
  appleAudiences: ["com.eait.fit.ios"], googleAudiences: ["test.apps.googleusercontent.com"],
};
let deps: EngineDeps;
let userId: string;

beforeEach(async () => {
  deps = { store: memoryStore(), config: CONFIG, llm: demoPorts(), push: fakePush(), mail: logMail() };
  ({ userId } = await deps.store.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en"));
  await deps.store.addIdentity(userId, "google", "g-" + userId.slice(0, 8));
  const out = await patchProfile(deps, userId, {
    goal: "lose", sex: "female", birth_year: 1990, height_cm: 165, weight_kg: 70,
    target_weight_kg: 65, activity: "some", pace: "steady", country: "de",
    restrictions: [], complete_onboarding: true,
  });
  if (!out || !out.ok) throw new Error("onboarding failed");
});

const analysis = (kcal = 300) => ({
  isFood: true, confidence: "low", kcal, protein_g: 5, carbs_g: 60, fat_g: 2, satfat_g: 1, fiber_g: 1,
  sugar_g: 1, sodium_mg: 100, notes: "", verdicts: {}, healthScore: 5,
  items: [{ name: "rice", name_en: "rice", grams: 200, kcal, protein_g: 5, carbs_g: 60, fat_g: 2, kcal_per_100g: 150 }],
}) as never;

const pending = (over: Partial<PendingMeal> = {}): PendingMeal => ({
  id: crypto.randomUUID(), userId, analysis: analysis(), date: "2026-11-09", expiresAt: Date.now() + 600_000, ...over,
});

describe("#2695", () => {
  it("hole 6: a re-shown proposal carries verdicts for the targets that hold NOW", async () => {
    const p = pending({ analysis: { ...(analysis() as object), verdicts: { kcal: "over" } } as never });
    await deps.store.putPending(p);
    const [shown] = await pendingMeals(deps, userId);
    expect(shown!.analysis.verdicts).toEqual(await gatedVerdicts(deps, userId, p.analysis));
  });

  it("hole 5: an insert that throws after committing leaves no live proposal", async () => {
    const p = pending();
    await deps.store.putPending(p);
    const real = deps.store.insertMeal.bind(deps.store);
    deps = { ...deps, store: { ...deps.store, insertMeal: async (m) => { await real(m); throw new Error("deadline"); } } };
    expect((await confirmPendingMeal(deps, userId, p.id)).kind).toBe("logged");
    expect(await deps.store.getMeal(userId, p.id)).not.toBeNull();
    expect(await deps.store.getPending(userId, p.id)).toBeNull();
  });

  it("hole 7: a read does not delete an expired proposal", async () => {
    const p = pending({ expiresAt: Date.now() - 1 });
    await deps.store.putPending(p);
    expect(await deps.store.getPending(userId, p.id)).toBeNull();
    expect(await deps.store.pruneExpiredPendings()).toBe(1);
  });

  it("hole 4: a redate is a column write and keeps an amended analysis", async () => {
    const p = pending();
    await deps.store.putPending(p);
    // The turn that read `p` is still holding the old analysis when the amend lands.
    await deps.store.updatePending(userId, { ...p, analysis: analysis(500) });
    expect(await deps.store.setPendingDate(userId, p.id, "2026-11-08")).toBe(true);
    const now = await deps.store.getPending(userId, p.id);
    expect(now!.date).toBe("2026-11-08");
    expect(now!.analysis.kcal).toBe(500);
  });

  it("hole 1: a write from a stale read is a conflict, not a silent overwrite", async () => {
    const m = await (async () => {
      const id = crypto.randomUUID();
      const p = pending({ id });
      await deps.store.putPending(p);
      await confirmPendingMeal(deps, userId, id);
      return (await deps.store.getMealVersioned(userId, id))!;
    })();
    const read = m.version;
    expect(await deps.store.updateMealIfVersion(userId, m.id, { notes: "a" }, read)).not.toBe("conflict");
    expect(await deps.store.updateMealIfVersion(userId, m.id, { notes: "b" }, read)).toBe("conflict");
    expect((await deps.store.getMeal(userId, m.id))!.notes).toBe("a");
  });

  it("hole 1: editMeal re-reads and re-merges when its read went stale", async () => {
    const id = crypto.randomUUID();
    await deps.store.putPending(pending({ id }));
    await confirmPendingMeal(deps, userId, id);
    let raced = false;
    const real = deps.store.updateMealIfVersion.bind(deps.store);
    deps = {
      ...deps,
      store: {
        ...deps.store,
        updateMealIfVersion: async (u, m, patch, v) => {
          if (!raced) { raced = true; await deps.store.updateMeal(u, m, { notes: "older build" }); }
          return real(u, m, patch, v);
        },
      },
    };
    const out = await editMeal(deps, userId, id, { protein_g: 9 });
    expect(out.kind).toBe("updated");
    const after = (await deps.store.getMeal(userId, id))!;
    expect(after.protein_g).toBe(9);
    expect(after.notes).toBe("older build");
    expect(raced).toBe(true);
  });

  it("hole 2: a stored question is not offered once the account cannot pay to answer it", async () => {
    const id = crypto.randomUUID();
    await deps.store.putPending(pending({ id, analysis: { ...(analysis() as object), question: { text: "Oil?", options: ["Yes", "No"] } } as never }));
    await confirmPendingMeal(deps, userId, id);
    await deps.store.updateMeal(userId, id, { question: { text: "Oil?", options: ["Yes", "No"] } });
    const paid: EngineDeps = { ...deps, config: { ...CONFIG, paywall: true } };
    await deps.store.setFreeAnalyses(userId, 5);
    expect((await day(paid, userId, "2026-11-09"))!.meals[0]!.question).not.toBeNull();
    await deps.store.setFreeAnalyses(userId, null);
    expect((await day(paid, userId, "2026-11-09"))!.meals[0]!.question).toBeNull();
  });
});
