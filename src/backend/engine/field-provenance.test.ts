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

  it("a merge copies answered fields only, and keeps the stale account's filled marks", async () => {
    const real = await store.createUser("en");
    await store.addIdentity(real, "apple", "sub");
    const anon = (await store.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en")).userId;
    await patchProfile(deps, anon, { goal: "lose", country: "fr", filled: false });
    await patchProfile(deps, anon, { country: "us", filled: true });
    const out = await signInWithProvider(deps, verifier, "apple", "sub", undefined, anon, "en", { terms: true, marketing: false });
    expect(out.outcome).toBe("merged");
    const p = (await store.getProfile(real))!;
    expect(p.goal).toBe("lose");
    expect(p.country).toBeNull();
    expect(p.filled_fields ?? []).toEqual([]);
  });
});
