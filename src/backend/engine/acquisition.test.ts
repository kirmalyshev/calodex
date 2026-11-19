import { describe, expect, it } from "bun:test";
import { configDefaults } from "../config.ts";
import { demoPorts } from "../llm/demo.ts";
import { logMail } from "../mail/log.ts";
import { fakePush } from "../push/fake.ts";
import { memoryStore } from "../store.memory.ts";
import type { AdServicesAnswer } from "../adservices.ts";
import { attributeInstall, type EngineDeps } from "./index.ts";

function setup(answers: AdServicesAnswer[]) {
  const store = memoryStore();
  const calls: string[] = [];
  const deps: EngineDeps = {
    store, config: configDefaults(), llm: demoPorts(), push: fakePush(), mail: logMail(),
    adServices: async (token) => { calls.push(token); return answers.shift() ?? { kind: "unavailable" }; },
  };
  return { store, deps, calls };
}
const user = async (store: ReturnType<typeof memoryStore>) => (await store.upsertDeviceUser(crypto.randomUUID(), "en")).userId;

describe("attributeInstall", () => {
  it("stores an Apple Search Ads attribution, and asks Apple nothing once it has one", async () => {
    const { store, deps, calls } = setup([{ kind: "attribution", attributed: true, campaignId: "11", adGroupId: "22", keywordId: "33" }]);
    const u = await user(store);
    expect(await attributeInstall(deps, u, "tok")).toBe("resolved");
    expect(await store.acquisitionOf(u)).toEqual({ source: "apple_search_ads", campaign: "11", adGroup: "22", keyword: "33", via: "adservices" });
    expect(await attributeInstall(deps, u, "tok")).toBe("resolved");
    expect(calls).toEqual(["tok"]);
  });

  it("stores an organic install", async () => {
    const { store, deps } = setup([{ kind: "attribution", attributed: false, campaignId: null, adGroupId: null, keywordId: null }]);
    const u = await user(store);
    expect(await attributeInstall(deps, u, "tok")).toBe("resolved");
    expect(await store.acquisitionOf(u)).toEqual({ source: "organic", campaign: null, adGroup: null, keyword: null, via: "adservices" });
  });

  it("replaces RevenueCat's copy with Apple's answer", async () => {
    const { store, deps } = setup([{ kind: "attribution", attributed: false, campaignId: null, adGroupId: null, keywordId: null }]);
    const u = await user(store);
    await store.putAcquisition(u, { source: "apple_search_ads", campaign: "x", adGroup: null, keyword: null, via: "revenuecat" });
    expect(await attributeInstall(deps, u, "tok")).toBe("resolved");
    expect((await store.acquisitionOf(u))?.via).toBe("adservices");
  });

  it("passes pending, invalid and unavailable through, storing nothing", async () => {
    const { store, deps } = setup([{ kind: "pending" }, { kind: "invalid" }, { kind: "unavailable" }]);
    const u = await user(store);
    expect(await attributeInstall(deps, u, "tok")).toBe("pending");
    expect(await attributeInstall(deps, u, "tok")).toBe("invalid");
    expect(await attributeInstall(deps, u, "tok")).toBe("unavailable");
    expect(await store.acquisitionOf(u)).toBeNull();
  });

  it("answers unavailable when no AdServices port is wired", async () => {
    const { store, deps } = setup([]);
    const u = await user(store);
    const { adServices: _, ...unwired } = deps;
    expect(await attributeInstall(unwired, u, "tok")).toBe("unavailable");
  });
});
