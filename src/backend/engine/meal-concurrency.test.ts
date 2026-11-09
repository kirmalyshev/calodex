// ieat-app#2695: concurrent edits, a redate over a correction, a re-shown proposal's verdicts,
// a confirm whose insert throws after committing, and a read that deletes.

import { beforeEach, describe, expect, it } from "bun:test";
import { configDefaults, type Config } from "../config.ts";
import { demoPorts } from "../llm/demo.ts";
import { memoryStore } from "../store.memory.ts";
import { fakePush } from "../push/fake.ts";
import { logMail } from "../mail/log.ts";
import { day } from "./diary.ts";
import { confirmPendingMeal, editMeal, gatedVerdicts, logPhotoMeal, pendingMeals, reanalyzeMeal } from "./meals.ts";
import { handleText } from "./text.ts";
import type { MealLogged } from "@eait/shared";
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
  await deps.store.setFreeAnalyses(userId, 50);
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

  // Runs `once` before the turn's FIRST model call: the window a PATCH or a second turn can land in.
  const duringModelCall = (once: () => Promise<unknown>): EngineDeps => {
    let fired = false;
    return {
      ...deps,
      llm: new Proxy(deps.llm, {
        get: (t, k) => {
          const v = (t as never as Record<string | symbol, unknown>)[k];
          return typeof v !== "function" ? v : async (...a: unknown[]) => {
            if (!fired) { fired = true; await once(); }
            return (v as (...x: unknown[]) => unknown).apply(t, a);
          };
        },
      }),
    };
  };
  const logged = async (): Promise<string> => {
    const id = crypto.randomUUID();
    await deps.store.putPending(pending({ id }));
    await confirmPendingMeal(deps, userId, id);
    return id;
  };

  it("hole 1: a chat correction computed from an older read is refused, not laid over a PATCH", async () => {
    const id = await logged();
    const d = duringModelCall(() => editMeal(deps, userId, id, { kcal: 777 }));
    const out = await handleText(d, userId, { text: "only half of it", focusMealId: id });
    expect(out.kind).toBe("meal-changed");
    expect((await deps.store.getMeal(userId, id))!.kcal).toBe(777);
  });

  it("hole 1: a re-read that lost to an edit is refused and nothing is overwritten", async () => {
    const out0 = (await logPhotoMeal(deps, userId, { images: [async () => { const b = new Uint8Array(10).fill(1); b[0] = 0xff; b[1] = 0xd8; return b; }] })) as MealLogged;
    const d = duringModelCall(() => editMeal(deps, userId, out0.mealId, { kcal: 777 }));
    const out = await reanalyzeMeal(d, userId, out0.mealId);
    expect(out.kind).toBe("meal-changed");
    expect((await deps.store.getMeal(userId, out0.mealId))!.kcal).toBe(777);
  });

  it("a redate does not move the version, so it does not turn an edit into a conflict", async () => {
    const id = await logged();
    const read = (await deps.store.getMealVersioned(userId, id))!;
    await deps.store.updateMeal(userId, id, { date: "2026-11-01" });
    expect(await deps.store.updateMealIfVersion(userId, id, { kcal: 5 }, read.version)).not.toBe("conflict");
  });

  it("hole 4: an amend whose turn read the offer before a redate keeps the redate", async () => {
    const p = pending();
    await deps.store.putPending(p);
    const d = duringModelCall(() => deps.store.setPendingDate(userId, p.id, "2026-11-08"));
    const out = await handleText(d, userId, { text: "only half of it", focusMealId: p.id });
    expect(out.kind).toBe("proposed");
    expect((out as { date: string }).date).toBe("2026-11-08");
    expect((await deps.store.getPending(userId, p.id))!.date).toBe("2026-11-08");
  });

  it("hole 4: a redate whose turn read the offer before an amend keeps the amend, with today's verdicts", async () => {
    const p = pending({ analysis: { ...(analysis() as object), verdicts: { kcal: "over" } } as never });
    await deps.store.putPending(p);
    const d = duringModelCall(() => deps.store.updatePending(userId, { ...p, analysis: analysis(500) }));
    const out = await handleText(d, userId, { text: "that was yesterday", focusMealId: p.id });
    expect(out.kind).toBe("proposed");
    const shown = out as { analysis: { kcal: number; verdicts: unknown } };
    expect(shown.analysis.kcal).toBe(500);
    expect(shown.analysis.verdicts).toEqual(await gatedVerdicts(deps, userId, shown.analysis as never));
  });

  it("hole 5: a proposal for a meal that is already logged cannot be stored", async () => {
    const id = await logged();
    await deps.store.putPending(pending({ id }));
    expect(await deps.store.getPending(userId, id)).toBeNull();
  });
});
