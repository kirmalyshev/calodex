// The account lifecycle (ieat-app#2696): onboarding completes once, a sign-in merge happens once,
// and an email code is not lost to a sign-in that failed after it.

import { beforeEach, describe, expect, it } from "bun:test";
import { configDefaults, type Config } from "../config.ts";
import { demoPorts } from "../llm/demo.ts";
import { fakePush } from "../push/fake.ts";
import type { MailPort } from "../mail/port.ts";
import { memoryStore } from "../store.memory.ts";
import type { MealRecord } from "@eait/shared";
import type { Store } from "../store.ts";
import { completeSignIn, patchProfile, sendEmailCode, verifyEmailCode, type EngineDeps } from "./index.ts";

const CONFIG: Config = {
  ...configDefaults(),
  port: 0, databaseUrl: "memory://test",
  llmProvider: "demo", llmModel: "demo", llmApiKey: "unused",
};
const CONSENT = { terms: true, marketing: false };

let store: Store;
let codes: string[];
const mail: MailPort = { async sendSignInCode(_to, code) { codes.push(code); } };
const depsFor = (s: Store): EngineDeps => ({ store: s, config: CONFIG, llm: demoPorts(), push: fakePush(), mail });
beforeEach(() => { store = memoryStore(); codes = []; });

const device = () => crypto.randomUUID() + crypto.randomUUID();
const anonymous = async () => (await store.upsertDeviceUser(device(), "en")).userId;
const meal = (userId: string): MealRecord => ({
  id: crypto.randomUUID(), user_id: userId, ts: new Date().toISOString(), date: "2026-08-01",
  isFood: true, items: [{ name: "Rice", grams: 200, name_en: "rice" }], kcal: 260, protein_g: 5,
  carbs_g: 56, fat_g: 1, satfat_g: 0.2, fiber_g: 1, sugar_g: 0.1, sodium_mg: 5,
  verdicts: { weight: "good" }, confidence: "high", notes: "", corrected: false, model: "test", healthScore: null,
});
const mealCount = async (userId: string) => (await store.mealsSince(userId, "2026-01-01", "2026-12-31", 100)).length;

/** Wraps one store method: `before` runs first, then the real call. */
function around(inner: Store, method: keyof Store, before: () => Promise<void>): Store {
  return new Proxy(inner, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop !== method || typeof value !== "function") return value;
      return async (...args: unknown[]) => {
        await before();
        return (value as (...a: unknown[]) => unknown).apply(target, args);
      };
    },
  }) as Store;
}

const onboarded = async () => {
  const id = await store.createUser("en");
  const r = await patchProfile(depsFor(store), id, { goal: "lose", weight_kg: 90, target_weight_kg: 80, pace: "steady", complete_onboarding: true });
  expect(r?.ok).toBe(true);
  return id;
};

describe("complete_onboarding", () => {
  it("stamps onboarded_at once; a later completing PATCH leaves it alone", async () => {
    const id = await onboarded();
    const first = (await store.getProfile(id))!.onboarded_at;
    await new Promise((r) => setTimeout(r, 5));
    const again = await patchProfile(depsFor(store), id, { complete_onboarding: true });
    expect(again?.ok).toBe(true);
    expect((await store.getProfile(id))!.onboarded_at).toBe(first);
  });

  it("refuses to null goal or weight on an onboarded account, naming the field", async () => {
    const id = await onboarded();
    const goal = await patchProfile(depsFor(store), id, { goal: null });
    const weight = await patchProfile(depsFor(store), id, { weight_kg: null });
    expect(goal).toMatchObject({ ok: false, rejected: { field: "goal" } });
    expect(weight).toMatchObject({ ok: false, rejected: { field: "weight_kg" } });
    const p = (await store.getProfile(id))!;
    expect([p.goal, p.weight_kg]).toEqual(["lose", 90]);
  });

  it("lets an account still onboarding change its answers freely", async () => {
    const id = await store.createUser("en");
    const d = depsFor(store);
    expect((await patchProfile(d, id, { goal: "maintain" }))?.ok).toBe(true);
    expect((await patchProfile(d, id, { goal: "lose" }))?.ok).toBe(true);
    expect((await patchProfile(d, id, { weight_kg: 80 }))?.ok).toBe(true);
    expect((await patchProfile(d, id, { weight_kg: null }))?.ok).toBe(true);
  });

  it("lets an onboarded account with a null goal change an unrelated field", async () => {
    const id = await store.createUser("en");
    await store.patchProfile(id, { onboarded_at: new Date().toISOString(), goal: null, weight_kg: null });
    expect((await patchProfile(depsFor(store), id, { country: "DE" }))?.ok).toBe(true);
  });

  it("lets a maintainer leave maintain on the web's one-field PATCH, defaulting pace as system-filled", async () => {
    const id = await store.createUser("en");
    await patchProfile(depsFor(store), id, { goal: "maintain", weight_kg: 80, complete_onboarding: true });
    const r = await patchProfile(depsFor(store), id, { goal: "lose" });
    expect(r?.ok).toBe(true);
    const p = (await store.getProfile(id))!;
    expect([p.goal, p.pace, p.target_weight_kg]).toEqual(["lose", "steady", null]);
    expect(p.filled_fields).toContain("pace");
  });

  it("keeps a pace the request carries when the goal leaves maintain", async () => {
    const id = await store.createUser("en");
    await patchProfile(depsFor(store), id, { goal: "maintain", weight_kg: 80, complete_onboarding: true });
    const r = await patchProfile(depsFor(store), id, { goal: "lose", target_weight_kg: 72, pace: "easy" });
    expect(r?.ok).toBe(true);
    const p = (await store.getProfile(id))!;
    expect([p.pace, p.target_weight_kg]).toEqual(["easy", 72]);
    expect(p.filled_fields ?? []).not.toContain("pace");
  });
});

describe("the sign-in merge", () => {
  const target = async () => {
    const real = await store.createUser("en");
    await store.addIdentity(real, "apple", "racer");
    return real;
  };
  const verified = { provider: "apple" as const, subject: "racer" };

  it("runs once when two sign-ins race from one anonymous session", async () => {
    const anon = await anonymous();
    const real = await target();
    await store.insertMeal(meal(anon));
    const deps = depsFor(store);
    const [a, b] = await Promise.all([
      completeSignIn(deps, "apple", verified, anon, "en", CONSENT),
      completeSignIn(deps, "apple", verified, anon, "en", CONSENT),
    ]);
    expect([a.userId, b.userId]).toEqual([real, real]);
    // Both say `merged`: the phone retags its outbox on `merged` and clears it on `switched`.
    expect([a.outcome, b.outcome]).toEqual(["merged", "merged"]);
    expect([a.mergedMeals, b.mergedMeals].sort()).toEqual([0, 1]);
    expect(await mealCount(real)).toBe(1);
  });

  it("answers `merged` with 0 meals when the anonymous account is already gone", async () => {
    const anon = await anonymous();
    const real = await target();
    await store.insertMeal(meal(anon));
    await store.mergeUsers(anon, real);
    const out = await completeSignIn(depsFor(store), "apple", verified, anon, "en", CONSENT);
    expect([out.outcome, out.mergedMeals, out.userId]).toEqual(["merged", 0, real]);
    expect(await mealCount(real)).toBe(1);
  });

  it("refuses the merge when the session gains a real identity between the read and the merge", async () => {
    const anon = await anonymous();
    const real = await target();
    await store.patchProfile(anon, { goal: "gain" });
    await store.insertMeal(meal(anon));
    const racing = around(store, "mergeUsers", async () => {
      await store.addIdentity(anon, "google", "linked-meanwhile");
    });
    const out = await completeSignIn(depsFor(racing), "apple", verified, anon, "en", CONSENT);
    expect(out.outcome).toBe("switched");
    expect(out.mergedMeals).toBeUndefined();
    expect(await store.userIdForIdentity("google", "linked-meanwhile")).toBe(anon);
    expect(await mealCount(anon)).toBe(1);
    expect(await mealCount(real)).toBe(0);
    expect((await store.getProfile(real))!.goal).toBeNull();
  });

  it("keeps the turn row that has an outcome when both sides claimed one client id", async () => {
    const anon = await anonymous();
    const real = await store.createUser("en");
    await store.claimTurn(real, "c1");
    await store.claimTurn(anon, "c1");
    await store.settleTurn(anon, "c1", { kind: "logged" });
    await store.mergeUsers(anon, real);
    expect((await store.getTurn(real, "c1"))?.outcome).toEqual({ kind: "logged" });
  });
});

describe("the email code", () => {
  const failingConsent = (inner: Store): Store => new Proxy(inner, {
    get(t, p, r) {
      const v = Reflect.get(t, p, r);
      return p === "recordConsent" ? async () => { throw new Error("connection reset"); } : v;
    },
  });

  it("is still usable when the sign-in that spent it failed", async () => {
    await sendEmailCode(depsFor(store), "a@example.com", "en");
    await expect(verifyEmailCode(depsFor(failingConsent(store)), "a@example.com", codes[0]!, null, "en", CONSENT)).rejects.toThrow();
    const again = await verifyEmailCode(depsFor(store), "a@example.com", codes[0]!, null, "en", CONSENT);
    expect("token" in again).toBe(true);
  });

  it("is still usable when the sign-in failed AFTER the merge, and the retry lands on `merged`", async () => {
    const email = "b@example.com";
    const real = await store.createUser("en");
    await store.addIdentity(real, "email", email);
    const anon = await anonymous();
    await store.insertMeal(meal(anon));
    await sendEmailCode(depsFor(store), email, "en");
    await expect(verifyEmailCode(depsFor(failingConsent(store)), email, codes[0]!, anon, "en", CONSENT)).rejects.toThrow();
    expect(await mealCount(real)).toBe(1);
    const again = await verifyEmailCode(depsFor(store), email, codes[0]!, anon, "en", CONSENT);
    expect(again).toMatchObject({ userId: real, outcome: "merged", mergedMeals: 0 });
  });
});
