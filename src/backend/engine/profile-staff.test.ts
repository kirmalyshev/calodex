// `ProfileResponse.isStaff` (ieat-app#3162): the app tags the PostHog person with it so staff and
// test accounts can be excluded from the paywall funnel. Same decision as the campaign's staff
// segment (`isStaffAccount`: the DB flag, or the env bootstrap list) — advisory, never an authority.

import { describe, expect, it } from "bun:test";
import { configDefaults } from "../config.ts";
import { demoPorts } from "../llm/demo.ts";
import { logMail } from "../mail/log.ts";
import { fakePush } from "../push/fake.ts";
import { memoryStore } from "../store.memory.ts";
import { profileView, type EngineDeps } from "./index.ts";

const mount = (over = {}) => {
  const store = memoryStore();
  const deps: EngineDeps = {
    store, config: { ...configDefaults(), port: 0, databaseUrl: "memory://test", llmProvider: "demo", llmModel: "demo", llmApiKey: "unused", ...over },
    llm: demoPorts(), push: fakePush(), mail: logMail(),
  };
  return { store, deps };
};
const account = async (store: ReturnType<typeof memoryStore>) => (await store.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en")).userId;

describe("profileView.isStaff", () => {
  it("is false for an ordinary account", async () => {
    const { store, deps } = mount();
    expect((await profileView(deps, await account(store)))!.isStaff).toBe(false);
  });
  it("is true for the DB staff flag", async () => {
    const { store, deps } = mount();
    const u = await account(store);
    await store.setStaff(u, true);
    expect((await profileView(deps, u))!.isStaff).toBe(true);
  });
  it("is true for the env bootstrap list", async () => {
    const { store, deps } = mount();
    const u = await account(store);
    deps.config = { ...deps.config, campaignStaffIds: [u] };
    expect((await profileView(deps, u))!.isStaff).toBe(true);
  });
});
