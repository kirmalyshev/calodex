// Field provenance (ieat-app#2676): a value the system filled is not a value the user answered.

import { beforeEach, describe, expect, it } from "bun:test";
import { configDefaults, type Config } from "../config.ts";
import { demoPorts } from "../llm/demo.ts";
import { fakePush } from "../push/fake.ts";
import { logMail } from "../mail/log.ts";
import { memoryStore } from "../store.memory.ts";
import type { Store } from "../store.ts";
import type { IdentityVerifier } from "../auth/verify.ts";
import { patchProfile, signInWithProvider, type EngineDeps } from "./index.ts";

const CONFIG: Config = {
  ...configDefaults(),
  port: 0, databaseUrl: "memory://test", llmProvider: "demo", llmModel: "demo", llmApiKey: "unused",
  appleAudiences: ["com.eait.fit.ios"],
};
let store: Store;
let deps: EngineDeps;
beforeEach(() => {
  store = memoryStore();
  deps = { store, config: CONFIG, llm: demoPorts(), push: fakePush(), mail: logMail() };
});
const verifier: IdentityVerifier = { async verify(provider, t) { return { provider, subject: t }; } };
const filledOf = async (id: string) => (await store.getProfile(id))!.filled_fields ?? [];

describe("filled_fields", () => {
  it("records a filled write, and a user write to the same field clears it", async () => {
    const id = await store.createUser("en");
    await patchProfile(deps, id, { country: "de", filled: true });
    expect(await filledOf(id)).toEqual(["country"]);
    expect((await store.getProfile(id))!.country).toBe("de");
    await patchProfile(deps, id, { country: "de" });
    expect(await filledOf(id)).toEqual([]);
  });

  it("leaves another field's provenance alone", async () => {
    const id = await store.createUser("en");
    await patchProfile(deps, id, { country: "de", filled: true });
    await patchProfile(deps, id, { goal: "lose" });
    expect(await filledOf(id)).toEqual(["country"]);
  });

  it("a merge does not copy a field the session only filled", async () => {
    const real = await store.createUser("en");
    await store.addIdentity(real, "apple", "sub");
    const anon = (await store.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en")).userId;
    await patchProfile(deps, anon, { goal: "lose" });
    await patchProfile(deps, anon, { country: "us", filled: true });
    const out = await signInWithProvider(deps, verifier, "apple", "sub", undefined, anon, "en", { terms: true, marketing: false });
    expect(out.outcome).toBe("merged");
    const p = (await store.getProfile(real))!;
    expect(p.goal).toBe("lose");
    expect(p.country).toBeNull();
  });

  it("refuses `filled` beside an answer-field, and beside complete_onboarding", async () => {
    const id = await store.createUser("en");
    const a = await patchProfile(deps, id, { goal: "gain", filled: true });
    expect(a && !a.ok && a.rejected.field).toBe("filled");
    expect((await store.getProfile(id))!.goal).toBeNull();
    await patchProfile(deps, id, { weight_kg: 80 });
    await patchProfile(deps, id, { goal: "lose" });
    const b = await patchProfile(deps, id, { country: "de", complete_onboarding: true, filled: true });
    expect(b && !b.ok && b.rejected.field).toBe("filled");
    expect((await store.getProfile(id))!.onboarded_at).toBeNull();
    expect(await filledOf(id)).toEqual([]);
  });

  it("never lets a filled write replace an answer the user gave", async () => {
    const id = await store.createUser("en");
    await patchProfile(deps, id, { country: "gb" });
    await patchProfile(deps, id, { country: "de", filled: true });
    expect((await store.getProfile(id))!.country).toBe("gb");
    expect(await filledOf(id)).toEqual([]);
  });

  it("keeps a filled mark through complete_onboarding", async () => {
    const id = await store.createUser("en");
    await patchProfile(deps, id, { country: "de", filled: true });
    const done = await patchProfile(deps, id, { goal: "lose", weight_kg: 80, complete_onboarding: true });
    expect(done?.ok).toBe(true);
    expect(await filledOf(id)).toEqual(["country"]);
  });

  it("a merge keeps the stale account's filled mark when the session sends no country", async () => {
    const real = await store.createUser("en");
    await store.addIdentity(real, "apple", "sub2");
    await patchProfile(deps, real, { country: "de", filled: true });
    const anon = (await store.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en")).userId;
    await patchProfile(deps, anon, { goal: "lose" });
    await signInWithProvider(deps, verifier, "apple", "sub2", undefined, anon, "en", { terms: true, marketing: false });
    const p = (await store.getProfile(real))!;
    expect(p.country).toBe("de");
    expect(p.filled_fields).toEqual(["country"]);
  });

  it("a merge clears the stale account's filled mark when the session answered the field", async () => {
    const real = await store.createUser("en");
    await store.addIdentity(real, "apple", "sub3");
    await patchProfile(deps, real, { country: "de", filled: true });
    const anon = (await store.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en")).userId;
    await patchProfile(deps, anon, { country: "fr" });
    await signInWithProvider(deps, verifier, "apple", "sub3", undefined, anon, "en", { terms: true, marketing: false });
    const p = (await store.getProfile(real))!;
    expect(p.country).toBe("fr");
    expect(p.filled_fields).toEqual([]);
  });
});
