// The New Year promotion window (ieat-app#3604): live = the admin's switch on AND a complete
// config AND from <= now < until. Everything else is no promotion, and while one is live the exit
// offer is suppressed on both platforms without the stored switches being written.

import { describe, expect, it } from "bun:test";
import { configDefaults, type PromoConfig, type WebPaywallConfig } from "../config.ts";
import { demoPorts } from "../llm/demo.ts";
import { logMail } from "../mail/log.ts";
import { fakePush } from "../push/fake.ts";
import { memoryStore } from "../store.memory.ts";
import { patchProfile, profileView, promoOf, promoWindow, type EngineDeps } from "./index.ts";

const PROMO: PromoConfig = {
  from: "2026-12-26T00:00:00.000Z",
  until: "2027-01-08T00:00:00.000Z",
  percent: 40,
  trialDays: 7,
  iosCode: "NEWYEAR",
  webCheckoutUrl: "https://pay.rev.cat/ny/{userId}",
};

const at = (iso: string) => new Date(iso);

describe("promoWindow", () => {
  const inside = at("2027-01-01T12:00:00.000Z");

  it("is the promotion while armed and inside [from, until)", () => {
    expect(promoWindow(PROMO, true, inside)).toEqual({
      id: "newyear", percent: 40, trialDays: 7, endsAt: "2027-01-08T00:00:00.000Z", iosCode: "NEWYEAR",
    });
    // `from` is inclusive.
    expect(promoWindow(PROMO, true, at(PROMO.from))).not.toBeNull();
  });

  it("is null before the window opens and from the instant it closes", () => {
    expect(promoWindow(PROMO, true, at("2026-12-25T23:59:59.999Z"))).toBeNull();
    expect(promoWindow(PROMO, true, at(PROMO.until))).toBeNull();
    expect(promoWindow(PROMO, true, at("2027-02-01T00:00:00.000Z"))).toBeNull();
  });

  it("is null while the admin's switch is off, whatever the dates", () => {
    expect(promoWindow(PROMO, false, inside)).toBeNull();
  });

  it("is null with no promotion configured", () => {
    expect(promoWindow(null, true, inside)).toBeNull();
  });

  it("sends a null iOS code when none is configured, never an empty string", () => {
    expect(promoWindow({ ...PROMO, iosCode: "" }, true, inside)?.iosCode).toBeNull();
  });
});

const PAYWALL: WebPaywallConfig = {
  ...configDefaults().webPaywall,
  yearlyCheckoutUrl: "https://pay.rev.cat/y/{userId}", yearlyPrice: 39.99, currency: "EUR",
  exitOfferCheckoutUrl: "https://pay.rev.cat/u/{userId}", exitOfferPrice: 23.99, exitOfferRegularPrice: 39.99,
};

/** A window around the real clock, since `profileView` reads `new Date()`. */
const liveNow = (): PromoConfig => ({
  ...PROMO,
  from: new Date(Date.now() - 3_600_000).toISOString(),
  until: new Date(Date.now() + 3_600_000).toISOString(),
});

const mount = (promoNewYear: PromoConfig | null) => {
  const store = memoryStore();
  const deps: EngineDeps = {
    store,
    config: { ...configDefaults(), port: 0, databaseUrl: "memory://test", llmProvider: "demo", llmModel: "demo", llmApiKey: "unused",
      webPaywall: PAYWALL, promoNewYear },
    llm: demoPorts(), push: fakePush(), mail: logMail(),
  };
  return { store, deps };
};
const account = async (store: ReturnType<typeof memoryStore>) =>
  (await store.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en")).userId;
const admin = crypto.randomUUID();

describe("promoOf", () => {
  it("reads the admin's switch, which ships OFF", async () => {
    const { store, deps } = mount(PROMO);
    const inside = at("2027-01-01T12:00:00.000Z");
    expect(await promoOf(deps, inside)).toBeNull();
    await store.setSwitch("paywall.promo.newyear", true, admin);
    expect((await promoOf(deps, inside))?.percent).toBe(40);
  });
});

describe("ProfileResponse.promo and the exit offer it suppresses", () => {
  it("is null and leaves the exit offer alone outside a live promotion", async () => {
    const { store, deps } = mount(liveNow());
    const u = await account(store);
    await store.setSwitch("paywall.exit-offer.ios", true, admin);
    await store.setSwitch("paywall.exit-offer.web", true, admin);
    const view = (await profileView(deps, u))!;
    expect(view.promo).toBeNull();
    expect(view.exitOfferEnabled).toEqual({ ios: true, web: true });
    expect(view.paywall.exitOffer).not.toBeNull();
    expect(view.paywall.promoCheckoutUrl).toBeNull();
  });

  it("sends the promotion, its checkout and no exit offer while it is live — and writes no switch", async () => {
    const { store, deps } = mount(liveNow());
    const u = await account(store);
    await store.setSwitch("paywall.exit-offer.ios", true, admin);
    await store.setSwitch("paywall.exit-offer.web", true, admin);
    await store.setSwitch("paywall.promo.newyear", true, admin);
    const view = (await profileView(deps, u))!;
    expect(view.promo).toMatchObject({ id: "newyear", percent: 40, trialDays: 7, iosCode: "NEWYEAR" });
    expect(view.exitOfferEnabled).toEqual({ ios: false, web: false });
    expect(view.paywall.exitOffer).toBeNull();
    expect(view.paywall.promoCheckoutUrl).toBe(`https://pay.rev.cat/ny/${u}`);
    // Suppressed on the response, not in the store: switching the promotion off restores the offer.
    expect(await store.switchEnabled("paywall.exit-offer.ios")).toBe(true);
    expect(await store.switchEnabled("paywall.exit-offer.web")).toBe(true);
  });

  it("sends a null checkout link while live when no web checkout is configured for it", async () => {
    const { store, deps } = mount({ ...liveNow(), webCheckoutUrl: "" });
    const u = await account(store);
    await store.setSwitch("paywall.promo.newyear", true, admin);
    const view = (await profileView(deps, u))!;
    expect(view.promo).not.toBeNull();
    expect(view.paywall.promoCheckoutUrl).toBeNull();
  });

  it("is on the edit-profile answer too", async () => {
    const { store, deps } = mount(liveNow());
    const u = await account(store);
    await store.setSwitch("paywall.exit-offer.web", true, admin);
    await store.setSwitch("paywall.promo.newyear", true, admin);
    const out = await patchProfile(deps, u, { lang: "en" });
    expect(out?.ok).toBe(true);
    if (!out?.ok) return;
    expect(out.view.promo?.id).toBe("newyear");
    expect(out.view.exitOfferEnabled.web).toBe(false);
    expect(out.view.paywall.exitOffer).toBeNull();
  });
});
