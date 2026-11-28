// Copy a meal onto one or more days (calodex_app#3683): one write path, exact composition,
// verdicts recomputed server-side, per-user scoping, and one replayed request never copies twice.

import { beforeEach, describe, expect, it, setSystemTime } from "bun:test";
import { dateMinus, localDate, localTime, ROUTES, type CopyMealResponse, type MealRecord } from "@eait/shared";
import { grantEveryAccount } from "../dev/grant.ts";
import { configDefaults, type Config } from "../config.ts";
import { demoPorts } from "../llm/demo.ts";
import { memoryStore } from "../store.memory.ts";
import type { Store } from "../store.ts";
import { fakePush } from "../push/fake.ts";
import { logMail } from "../mail/log.ts";
import { createRouter } from "../api/routes.ts";
import { copyMeal, patchProfile, type EngineDeps } from "./index.ts";

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

async function onboard(restrictions: string[] = []): Promise<string> {
  const { userId } = await store.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en");
  await store.addIdentity(userId, "google", "g-" + userId.slice(0, 8));
  const out = await patchProfile(deps, userId, {
    goal: "lose", sex: "female", birth_year: 1990, height_cm: 165, weight_kg: 70,
    target_weight_kg: 65, activity: "some", pace: "steady", country: "de",
    restrictions, complete_onboarding: true,
  });
  if (!out || !out.ok) throw new Error("onboarding failed");
  return userId;
}

const today = () => localDate(CONFIG.timezone);
const meal = (userId: string, over: Partial<MealRecord> = {}): MealRecord => ({
  id: crypto.randomUUID(), user_id: userId, ts: new Date().toISOString(), date: today(),
  isFood: true, items: [{ name: "Rice", grams: 200, name_en: "rice" }, { name: "Chicken", grams: 150 }],
  kcal: 500, protein_g: 40, carbs_g: 56, fat_g: 8, satfat_g: 2, fiber_g: 1, sugar_g: 0.1, sodium_mg: 1800,
  verdicts: { weight: "good" }, healthScore: null, confidence: "high", notes: "", corrected: false, model: "test", ...over,
});

describe("copying a meal", () => {
  it("copies the composition once per deduped target day, with verdicts recomputed rather than inherited", async () => {
    const userId = await onboard(["kidneys"]);
    const source = meal(userId, {
      name: "Weekday lunch", servings: 1.5, label: { servings: 1.5 },
      notes: "label scan", confidence: "medium", model: "label-model",
      verdicts: { weight: "good" }, // stale on purpose: the copy must never inherit it
    });
    await store.insertMeal(source);
    // One target already holds a small meal, so the response's totals prove they are that target
    // day's totals rather than today's or the copy's own numbers.
    await store.insertMeal(meal(userId, { date: dateMinus(today(), 1), kcal: 100 }));

    const copied = await copyMeal(deps, userId, source.id, [1, -2, 1]);
    if (copied.kind !== "copied") throw new Error(`expected copied, got ${copied.kind}`);
    expect(copied.meals).toHaveLength(2);

    // Dedupe keeps the request's first occurrence and its order: tomorrow, then two days ago.
    expect(copied.sourceMealId).toBe(source.id);
    expect(copied.meals.map((m) => m.date)).toEqual([dateMinus(today(), 1), dateMinus(today(), -2)]);
    for (const copy of copied.meals) {
      const row = (await store.getMeal(userId, copy.mealId))!;
      expect(row.id).not.toBe(source.id);
      expect(row.items).toEqual(source.items);
      for (const key of ["isFood", "kcal", "protein_g", "carbs_g", "fat_g", "satfat_g", "fiber_g", "sugar_g", "sodium_mg", "confidence", "notes", "label", "model"] as const) {
        expect(row[key]).toEqual(source[key]);
      }
      expect(row.healthScore).not.toBeNull();
      expect(row.name).toBe("Weekday lunch");
      expect(row.servings).toBe(1.5);
      expect(row.corrected).toBe(false);
      expect(row.question ?? null).toBeNull();
      expect(row.photos ?? 0).toBe(0);
      expect(row.rating ?? null).toBeNull();
      expect(row.verdicts.kidneys).toBe("bad");
      expect(row.verdicts.weight).not.toBeUndefined();
      expect(copy.totals.kcal).toBe(row.kcal + (copy.date === dateMinus(today(), 1) ? 100 : 0));
      expect(copy.verdictLabels.length).toBeGreaterThan(0);
    }
    expect(await store.mealsForDate(userId, today())).toHaveLength(1);
  });

  it("keeps the source meal's time of day on every target date, clamped only when copying ahead of now on today", async () => {
    setSystemTime(new Date("2026-05-12T10:00:00.000Z")); // 12:00 in the fixture's Europe/Berlin zone
    try {
      const userId = await onboard();
      const source = meal(userId, { ts: "2026-05-12T11:30:00.000Z" }); // 13:30 local, still ahead of now today
      await store.insertMeal(source);

      const copied = await copyMeal(deps, userId, source.id, [1, -1, 0]);
      if (copied.kind !== "copied") throw new Error(`expected copied, got ${copied.kind}`);
      expect(copied.meals).toHaveLength(3);
      const rows = await Promise.all(copied.meals.map((m) => store.getMeal(userId, m.mealId)));
      const byDate = new Map(rows.map((r) => [r!.date, r!]));
      expect(localTime(CONFIG.timezone, new Date(byDate.get(dateMinus(today(), 1))!.ts))).toBe("13:30");
      expect(localTime(CONFIG.timezone, new Date(byDate.get(dateMinus(today(), -1))!.ts))).toBe("13:30");
      expect(byDate.get(today())!.ts).toBe("2026-05-12T10:00:00.000Z");
    } finally {
      setSystemTime();
    }
  });

  it("refuses another user's meal and writes nothing", async () => {
    const owner = await onboard();
    const other = await onboard();
    const source = meal(owner);
    await store.insertMeal(source);

    const copied = await copyMeal(deps, other, source.id, [1]);
    expect(copied.kind).toBe("target-gone");
    expect(await store.mealsForDate(other, dateMinus(today(), 1))).toHaveLength(0);
    expect(await store.getMeal(owner, source.id)).not.toBeNull();
  });

  it("is a log behind the same paywall rule, not a free way around it", async () => {
    const raw = memoryStore();
    const ungranted = { ...deps, store: raw };
    const { userId } = await raw.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en");
    await raw.addIdentity(userId, "google", "g-" + userId.slice(0, 8));
    const out = await patchProfile(ungranted, userId, {
      goal: "lose", sex: "female", birth_year: 1990, height_cm: 165, weight_kg: 70,
      target_weight_kg: 65, activity: "some", pace: "steady", country: "de",
      restrictions: [], complete_onboarding: true,
    });
    if (!out || !out.ok) throw new Error("onboarding failed");
    const source = meal(userId);
    await raw.insertMeal(source);

    const copied = await copyMeal(ungranted, userId, source.id, [1]);
    expect(copied.kind).toBe("subscription-required");
    expect(await raw.mealsForDate(userId, dateMinus(today(), 1))).toHaveLength(0);
  });

  it("answers a replay under the same client id from the first write, never a second set of copies", async () => {
    const userId = await onboard();
    const source = meal(userId);
    await store.insertMeal(source);
    const clientId = crypto.randomUUID();

    const first = await copyMeal(deps, userId, source.id, [1, -1], clientId);
    const replay = await copyMeal(deps, userId, source.id, [1, -1], clientId);
    expect(first.kind).toBe("copied");
    expect(replay).toEqual(first);
    expect((await store.mealsForDate(userId, dateMinus(today(), 1))).filter((m) => m.id !== source.id)).toHaveLength(1);
    expect((await store.mealsForDate(userId, dateMinus(today(), -1))).filter((m) => m.id !== source.id)).toHaveLength(1);
  });

  it("POST /v1/meals/:id/copy maps the paywall refusal instead of answering it as a copy", async () => {
    const raw = memoryStore();
    const ungranted = { ...deps, store: raw };
    const { userId } = await raw.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en");
    await raw.addIdentity(userId, "google", "g-" + userId.slice(0, 8));
    const out = await patchProfile(ungranted, userId, {
      goal: "lose", sex: "female", birth_year: 1990, height_cm: 165, weight_kg: 70,
      target_weight_kg: 65, activity: "some", pace: "steady", country: "de",
      restrictions: [], complete_onboarding: true,
    });
    if (!out || !out.ok) throw new Error("onboarding failed");
    const source = meal(userId);
    await raw.insertMeal(source);
    const token = await raw.issueToken(userId);
    const handle = createRouter(ungranted, raw, {
      verify: async () => { throw new Error("unused"); },
      verifyAppleNotification: async () => { throw new Error("unused"); },
    });

    const res = await handle(new Request(`http://local${ROUTES.mealCopy(source.id)}`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
      body: JSON.stringify({ dayOffsets: [1] }),
    }));
    expect(res.status).toBe(402);
    expect(await res.json()).toEqual({ error: "subscription-required" });
    expect(await raw.mealsForDate(userId, dateMinus(today(), 1))).toHaveLength(0);
  });

  it("POST /v1/meals/:id/copy validates, scopes, and answers every copy", async () => {
    const userId = await onboard();
    const other = await onboard();
    const source = meal(userId);
    await store.insertMeal(source);
    const tokA = await store.issueToken(userId);
    const tokB = await store.issueToken(other);
    const handle = createRouter(deps, store, {
      verify: async () => { throw new Error("unused"); },
      verifyAppleNotification: async () => { throw new Error("unused"); },
    });
    const post = (tok: string, body: unknown, clientId = crypto.randomUUID()) => handle(new Request(`http://local${ROUTES.mealCopy(source.id)}`, {
      method: "POST",
      headers: { authorization: `Bearer ${tok}`, "content-type": "application/json", "idempotency-key": clientId },
      body: JSON.stringify(body),
    }));

    expect((await post(tokA, { dayOffsets: [] })).status).toBe(400);
    expect((await post(tokA, { dayOffsets: [8] })).status).toBe(400);
    expect((await post(tokB, { dayOffsets: [1] })).status).toBe(409);
    const noKey = await handle(new Request(`http://local${ROUTES.mealCopy(source.id)}`, {
      method: "POST",
      headers: { authorization: `Bearer ${tokA}`, "content-type": "application/json" },
      body: JSON.stringify({ dayOffsets: [1] }),
    }));
    expect(noKey.status).toBe(400);

    const key = crypto.randomUUID();
    // The body's clientId is the same replay key when no header carries one (#2701's shape).
    const bodyKey = crypto.randomUUID();
    const bodyKeyReq = () => handle(new Request(`http://local${ROUTES.mealCopy(source.id)}`, {
      method: "POST",
      headers: { authorization: `Bearer ${tokA}`, "content-type": "application/json" },
      body: JSON.stringify({ dayOffsets: [-3], clientId: bodyKey }),
    }));
    const bodyKeyRes = await bodyKeyReq();
    expect(bodyKeyRes.status).toBe(200);
    const bodyKeyJson = await bodyKeyRes.json();
    const bodyKeyReplay = await bodyKeyReq();
    expect(bodyKeyReplay.status).toBe(200);
    expect(await bodyKeyReplay.json()).toEqual(bodyKeyJson);
    expect((await store.mealsForDate(userId, dateMinus(today(), -3))).filter((m) => m.id !== source.id)).toHaveLength(1);

    const ok = await post(tokA, { dayOffsets: [1, -1, 1] }, key);
    expect(ok.status).toBe(200);
    const body = await ok.json() as CopyMealResponse;
    expect(body.kind).toBe("copied");
    expect(body.meals).toHaveLength(2);
    const replay = await post(tokA, { dayOffsets: [1, -1, 1] }, key);
    expect(replay.status).toBe(200);
    expect(await replay.json()).toEqual(body);
    // The header is the replay key when both carry one: a different body clientId starts no second turn.
    const conflict = await handle(new Request(`http://local${ROUTES.mealCopy(source.id)}`, {
      method: "POST",
      headers: { authorization: `Bearer ${tokA}`, "content-type": "application/json", "idempotency-key": key },
      body: JSON.stringify({ dayOffsets: [1, -1, 1], clientId: crypto.randomUUID() }),
    }));
    expect(conflict.status).toBe(200);
    expect(await conflict.json()).toEqual(body);
    expect(body.sourceMealId).toBe(source.id);
    expect(body.meals.map((m) => m.date)).toEqual([dateMinus(today(), 1), dateMinus(today(), -1)]);
    expect((await store.mealsForDate(userId, dateMinus(today(), 1))).filter((m) => m.id !== source.id)).toHaveLength(1);
  });
});
