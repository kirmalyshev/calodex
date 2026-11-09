// The account lifecycle (ieat-app#2696): onboarding completes once, a sign-in merge happens once,
// and an email code is not lost to a sign-in that failed after it.

import { beforeEach, describe, expect, it } from "bun:test";
import { configDefaults, type Config } from "../config.ts";
import { demoPorts } from "../llm/demo.ts";
import { fakePush } from "../push/fake.ts";
import type { MailPort } from "../mail/port.ts";
import { memoryStore } from "../store.memory.ts";
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

  it("refuses to null goal or weight on an onboarded account", async () => {
    const id = await onboarded();
    for (const req of [{ goal: null }, { weight_kg: null }] as const) {
      const r = await patchProfile(depsFor(store), id, req);
      expect(r?.ok).toBe(false);
    }
    const p = (await store.getProfile(id))!;
    expect(p.goal).toBe("lose");
    expect(p.weight_kg).toBe(90);
  });

  it("refuses maintain -> lose without a target weight and pace in the same PATCH", async () => {
    const id = await store.createUser("en");
    await patchProfile(depsFor(store), id, { goal: "maintain", weight_kg: 80, complete_onboarding: true });
    expect((await patchProfile(depsFor(store), id, { goal: "lose" }))?.ok).toBe(false);
    expect((await store.getProfile(id))!.goal).toBe("maintain");
    const ok = await patchProfile(depsFor(store), id, { goal: "lose", target_weight_kg: 72, pace: "easy" });
    expect(ok?.ok).toBe(true);
  });
});

describe("complete_onboarding, legacy and editor cases", () => {
  it("lets an onboarded account with a null goal change an unrelated field", async () => {
    const id = await store.createUser("en");
    await store.patchProfile(id, { onboarded_at: new Date().toISOString(), goal: null, weight_kg: null });
    const r = await patchProfile(depsFor(store), id, { country: "DE" });
    expect(r?.ok).toBe(true);
  });

  it("defaults a maintainer's missing pace when the goal leaves maintain with a target", async () => {
    const id = await store.createUser("en");
    await patchProfile(depsFor(store), id, { goal: "maintain", weight_kg: 80, complete_onboarding: true });
    const r = await patchProfile(depsFor(store), id, { goal: "lose", target_weight_kg: 72 });
    expect(r?.ok).toBe(true);
    expect((await store.getProfile(id))!.pace).toBe("steady");
  });
});

describe("the sign-in merge", () => {
  it("runs once when two sign-ins race from one anonymous session", async () => {
    const { userId: anon } = await store.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en");
    const real = await store.createUser("en");
    await store.addIdentity(real, "apple", "racer");
    const deps = depsFor(store);
    const v = { provider: "apple" as const, subject: "racer" };
    const [a, b] = await Promise.all([
      completeSignIn(deps, "apple", v, anon, "en", CONSENT),
      completeSignIn(deps, "apple", v, anon, "en", CONSENT),
    ]);
    expect(a.userId).toBe(real);
    expect(b.userId).toBe(real);
    // Both say `merged`: the phone retags its outbox on `merged` and clears it on `switched`.
    expect([a.outcome, b.outcome]).toEqual(["merged", "merged"]);
    expect([a.mergedMeals, b.mergedMeals].sort()).toEqual([0, 0]);
  });

  it("refuses the merge when the session gained a real identity first, and keeps both accounts", async () => {
    const { userId: anon } = await store.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en");
    const real = await store.createUser("en");
    await store.addIdentity(real, "apple", "target");
    await store.addIdentity(anon, "google", "linked-meanwhile");
    const out = await completeSignIn(depsFor(store), "apple", { provider: "apple", subject: "target" }, anon, "en", CONSENT);
    expect(out.outcome).toBe("switched");
    expect(await store.userIdForIdentity("google", "linked-meanwhile")).toBe(anon);
  });

  it("keeps the turn row that has an outcome when both sides claimed one client id", async () => {
    const { userId: anon } = await store.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en");
    const real = await store.createUser("en");
    await store.claimTurn(real, "c1");
    await store.claimTurn(anon, "c1");
    await store.settleTurn(anon, "c1", { kind: "logged" });
    await store.mergeUsers(anon, real);
    expect((await store.getTurn(real, "c1"))?.outcome).toEqual({ kind: "logged" });
  });
});

describe("the email code", () => {
  it("is still usable when the sign-in that spent it failed", async () => {
    await sendEmailCode(depsFor(store), "a@example.com", "en");
    const flaky: Store = new Proxy(store, {
      get(t, p, r) {
        const v = Reflect.get(t, p, r);
        return p === "recordConsent" ? async () => { throw new Error("connection reset"); } : v;
      },
    });
    await expect(verifyEmailCode(depsFor(flaky), "a@example.com", codes[0]!, null, "en", CONSENT)).rejects.toThrow();
    const again = await verifyEmailCode(depsFor(store), "a@example.com", codes[0]!, null, "en", CONSENT);
    expect("token" in again).toBe(true);
  });
});
