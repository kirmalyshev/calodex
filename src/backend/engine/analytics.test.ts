import { describe, expect, it } from "bun:test";
import {
  ANALYTICS_CLIENT_KEYS, ANALYTICS_CONTEXT_KEYS, ANALYTICS_SERVER_KEYS, APP_HEADER, BUILD_HEADER, CHANNEL_HEADER,
  DEFAULT_ONBOARDING_CONTENT, UPDATE_HEADER, VERSION_HEADER,
} from "@eait/shared";
import { configDefaults } from "../config.ts";
import { demoPorts } from "../llm/demo.ts";
import { logMail } from "../mail/log.ts";
import { fakePush } from "../push/fake.ts";
import { memoryStore } from "../store.memory.ts";
import { analyticsRequestOf } from "./analytics.ts";
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
});

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
