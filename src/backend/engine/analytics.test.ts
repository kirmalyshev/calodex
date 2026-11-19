import { describe, expect, it, spyOn } from "bun:test";
import {
  ANALYTICS_CLIENT_KEYS, ANALYTICS_CONTEXT_KEYS, ANALYTICS_SERVER_KEYS, APP_HEADER, BUILD_HEADER, CHANNEL_HEADER,
  DEFAULT_ONBOARDING_CONTENT, UPDATE_HEADER, VERSION_HEADER,
} from "@eait/shared";
import { configDefaults } from "../config.ts";
import { demoPorts } from "../llm/demo.ts";
import { logMail } from "../mail/log.ts";
import { fakePush } from "../push/fake.ts";
import { memoryStore } from "../store.memory.ts";
import type { Store } from "../store.ts";
import { fakeAnalytics } from "../analytics/fake.ts";
import { analyticsRequestOf, track } from "./analytics.ts";
import type { EngineDeps } from "./deps.ts";
import { profileView } from "./profile.ts";

describe("ProfileResponse.analytics (ieat-app#3196)", () => {
  const setup = async () => {
    const store = memoryStore();
    const deps: EngineDeps = {
      store, llm: demoPorts(), push: fakePush(), mail: logMail(),
      config: { ...configDefaults(), port: 0, databaseUrl: "memory://test", llmProvider: "demo", llmModel: "demo", llmApiKey: "unused" },
    };
    return { store, deps, userId: await store.createUser("de") };
  };

  it("carries every server key, and with the request's half and the offering makes the whole context", async () => {
    const { deps, userId } = await setup();
    const analytics = (await profileView(deps, userId))!.analytics;
    expect(Object.keys(analytics).sort()).toEqual([...ANALYTICS_SERVER_KEYS].sort());
    const whole = { ...analyticsRequestOf(new Headers(), "app"), paywall_offering: null, ...analytics };
    expect(Object.keys(whole).sort()).toEqual([...ANALYTICS_CONTEXT_KEYS].sort());
    expect(ANALYTICS_CLIENT_KEYS).toContain("paywall_offering");
  });

  it("names the account's language, country, live copy and the code it joined with", async () => {
    const { store, deps, userId } = await setup();
    const referrer = await store.createUser("en");
    const code = (await store.referralOf(referrer))!.code;
    await store.redeemReferral(userId, code, 7);
    await store.patchProfile(userId, { country: "de" });
    expect((await profileView(deps, userId))!.analytics).toEqual({
      content_version: DEFAULT_ONBOARDING_CONTENT.version, lang: "de", country: "de",
      experiment_id: null, arm: null, template: null,
      acq_source: "referral", acq_campaign: null, acq_adgroup: null, acq_keyword: null, referrer: code,
    });
  });

  it("names the install's Apple Search Ads campaign, ad group and keyword, over the referral", async () => {
    const { store, deps, userId } = await setup();
    await store.putAcquisition(userId, { source: "apple_search_ads", campaign: "c1", adGroup: "g1", keyword: "k1", via: "adservices" });
    const a = (await profileView(deps, userId))!.analytics;
    expect([a.acq_source, a.acq_campaign, a.acq_adgroup, a.acq_keyword]).toEqual(["apple_search_ads", "c1", "g1", "k1"]);
  });

  it("keeps the referral when Apple says the install was organic", async () => {
    const { store, deps, userId } = await setup();
    const code = (await store.referralOf(await store.createUser("en")))!.code;
    await store.redeemReferral(userId, code, 7);
    await store.putAcquisition(userId, { source: "organic", campaign: null, adGroup: null, keyword: null, via: "adservices" });
    expect((await profileView(deps, userId))!.analytics.acq_source).toBe("referral");
  });

  it("names the copy last served, else the held arm's, else the live one", async () => {
    const { store, deps, userId } = await setup();
    const version = async () => (await profileView(deps, userId))!.analytics.content_version;
    expect(await version()).toBe(DEFAULT_ONBOARDING_CONTENT.version);
    await holdArm(store, userId, 42);
    expect(await version()).toBe(42);
    await serve(store, userId, 7);
    expect(await version()).toBe(7);
  });

  it("names the held arm only when the copy last served is that arm's", async () => {
    const { store, deps, userId } = await setup();
    const arm = async () => { const a = (await profileView(deps, userId))!.analytics; return [a.experiment_id, a.arm]; };
    const id = await holdArm(store, userId, 42);
    expect(await arm()).toEqual([null, null]);
    await serve(store, userId, DEFAULT_ONBOARDING_CONTENT.version);
    expect(await arm()).toEqual([null, null]);
    await serve(store, userId, 42);
    expect(await arm()).toEqual([id, "42"]);
  });

  it("names the templates the account was last served, key@version, in slot order", async () => {
    const { store, deps, userId } = await setup();
    await store.recordOnboardingServed(userId, { contentVersion: 1, lang: "de", surface: "app", screens: { baseline: { template: "old", version: 1 } } });
    await store.recordOnboardingServed(userId, {
      contentVersion: 2, lang: "de", surface: "app",
      screens: { prelim: { template: "hero", version: 3 }, baseline: { template: "plate", version: 2 } },
    });
    expect((await profileView(deps, userId))!.analytics.template).toBe("plate@2,hero@3");
  });
});

const holdArm = async (store: Store, userId: string, version: number) => {
  const content = structuredClone(DEFAULT_ONBOARDING_CONTENT);
  content.version = version;
  const id = crypto.randomUUID();
  await store.putOnboardingExperiment({
    id, lang: "de", status: "draft", rules: {}, created_by: userId, created_at: new Date().toISOString(),
    started_at: null, stopped_at: null, revision: 1,
    variants: [{ control: true, weight: 0, content: structuredClone(DEFAULT_ONBOARDING_CONTENT) }, { weight: 1, content }],
  } as never);
  await store.startOnboardingExperiment(id);
  await store.setSwitch("onboarding.experiments", true, userId);
  await store.putOnboardingAssignment(userId, id, version);
  return id;
};
const serve = (store: Store, userId: string, contentVersion: number) =>
  store.recordOnboardingServed(userId, { contentVersion, lang: "de", surface: "app", screens: {} });

describe("analyticsRequestOf (ieat-app#3196)", () => {
  it("reads the binary's own headers", () => {
    const h = new Headers({
      [APP_HEADER]: "eait", [CHANNEL_HEADER]: "testflight",
      [VERSION_HEADER]: "1.4.2", [BUILD_HEADER]: "187", [UPDATE_HEADER]: "0b1c2d3e-4f50",
    });
    expect(analyticsRequestOf(h, "app")).toEqual({
      surface: "app", brand: "eait", channel: "testflight", app_version: "1.4.2", build: "187", ota_update_id: "0b1c2d3e-4f50",
    });
  });

  it("is null where a header is absent or refused, and the brand is the default one", () => {
    const h = new Headers({ [CHANNEL_HEADER]: "sideload", [VERSION_HEADER]: "1.0 <b>", [BUILD_HEADER]: "x".repeat(200) });
    expect(analyticsRequestOf(h, "web")).toEqual({
      surface: "web", brand: "calodex", channel: null, app_version: null, build: null, ota_update_id: null,
    });
  });
});

describe("track — one server-side event, with the whole context (ieat-app#3196)", () => {
  const setup = async (wired = true) => {
    const store = memoryStore();
    const sink = fakeAnalytics();
    const deps: EngineDeps = {
      store, llm: demoPorts(), push: fakePush(), mail: logMail(),
      config: { ...configDefaults(), port: 0, databaseUrl: "memory://test", llmProvider: "demo", llmModel: "demo", llmApiKey: "unused" },
      ...(wired ? { analytics: sink } : {}),
    };
    return { store, deps, sink, userId: await store.createUser("de") };
  };

  it("sends the event's props plus every context key, and sets the acquisition person props", async () => {
    const { store, deps, sink, userId } = await setup();
    await store.patchProfile(userId, { country: "de" });
    await track(deps, userId, "signup_completed", { provider: "google", after_onboarding: true }, analyticsRequestOf(new Headers(), "web"));
    expect(sink.captured).toHaveLength(1);
    const { event, userId: who, props } = sink.captured[0]!;
    expect(event).toBe("signup_completed");
    expect(who).toBe(userId);
    expect(props).toMatchObject({ provider: "google", after_onboarding: true, surface: "web", lang: "de", country: "de" });
    for (const k of ANALYTICS_CONTEXT_KEYS) expect(props).toHaveProperty(k);
    expect(props.$set).toEqual({ acq_source: null, acq_campaign: null, acq_adgroup: null, acq_keyword: null, referrer: null });
  });

  it("with no request, says so with nulls rather than inventing a surface", async () => {
    const { deps, sink, userId } = await setup();
    await track(deps, userId, "subscription_renewal", { product_id: "yearly" }, null);
    expect(sink.captured[0]!.props).toMatchObject({ surface: null, brand: null, app_version: null, product_id: "yearly", lang: "de" });
  });

  it("drops a name or a prop the catalog does not list", async () => {
    const { deps, sink, userId } = await setup();
    await track(deps, userId, "nope" as "signed_out", {}, null);
    await track(deps, userId, "signed_out", { everywhere: true, email: "x@y.z" } as { everywhere: boolean }, null);
    expect(sink.captured.map((c) => c.event)).toEqual(["signed_out"]);
    expect(sink.captured[0]!.props).not.toHaveProperty("email");
  });

  it("sends nothing when no sink is configured, and never throws", async () => {
    const { deps, userId } = await setup(false);
    await track(deps, userId, "signed_out", {}, null);
    const { deps: broken, sink, userId: other } = await setup();
    broken.store.getProfile = async () => { throw new Error("db down"); };
    const errors = spyOn(console, "error").mockImplementation(() => {});
    try {
      await track(broken, other, "signed_out", {}, null);
      expect(errors).toHaveBeenCalledTimes(1);
    } finally {
      errors.mockRestore();
    }
    expect(sink.captured).toHaveLength(0);
  });
});
