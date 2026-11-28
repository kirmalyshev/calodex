import { describe, expect, it } from "bun:test";
import { configDefaults } from "../config.ts";
import { demoPorts } from "../llm/demo.ts";
import { logMail } from "../mail/log.ts";
import { fakePush } from "../push/fake.ts";
import { memoryStore } from "../store.memory.ts";
import type { RevenueCatEventRow } from "../store.ts";
import { promoStats, type EngineDeps } from "./index.ts";

const setup = () => {
  const store = memoryStore();
  const deps: EngineDeps = { store, config: configDefaults(), llm: demoPorts(), push: fakePush(), mail: logMail() };
  return { store, deps };
};
const account = async (store: ReturnType<typeof memoryStore>) =>
  (await store.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en")).userId;
const event = (userId: string, offerCode: string, eventAt: string): RevenueCatEventRow => ({
  id: `rc-${crypto.randomUUID()}`, userId, type: "INITIAL_PURCHASE", productId: "eait_pro_yearly",
  periodType: "TRIAL", presentedOfferingId: "default", price: 0, currency: "EUR",
  priceInPurchasedCurrency: 0, store: "APP_STORE", countryCode: "DE", environment: "PRODUCTION",
  eventAt, offerCode, acquisition: null,
});

describe("promoStats", () => {
  it("answers the trailing window as contract rows", async () => {
    const { store, deps } = setup();
    const day = 86_400_000;
    const recent = await account(store);
    const old = await account(store);
    await store.recordRevenueCatEvent(event(recent, "RECENT", new Date(Date.now() - 10 * day).toISOString()));
    await store.recordRevenueCatEvent(event(old, "OLD", new Date(Date.now() - 40 * day).toISOString()));

    const view = await promoStats(deps, 30);
    expect(view.days).toBe(30);
    expect(view.codes.map((c) => c.offerCode)).toEqual(["RECENT"]);
    expect(view.codes[0]).toMatchObject({ redeemed: 1, active: 0, paid: 0 });
  });


  it("computes active through entitlementFor, not a store-side copy of the rule", async () => {
    const { store, deps } = setup();
    const userId = await account(store);
    const at = new Date().toISOString();
    await store.recordRevenueCatEvent(event(userId, "LIVECODE", at));
    await store.putEntitlement(userId, {
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(), productId: "eait_pro_yearly", eventAt: at,
    });

    const view = await promoStats(deps, 30);
    expect(view.codes).toMatchObject([{ offerCode: "LIVECODE", redeemed: 1, active: 1, paid: 0 }]);
    expect(JSON.stringify(view)).not.toContain(userId);
  });

  it("reads PRODUCTION by default and SANDBOX only when asked", async () => {
    const { store, deps } = setup();
    const prod = await account(store);
    const sand = await account(store);
    const at = new Date().toISOString();
    await store.recordRevenueCatEvent(event(prod, "PRODCODE", at));
    await store.recordRevenueCatEvent({ ...event(sand, "SANDBOXCODE", at), environment: "SANDBOX" });

    expect((await promoStats(deps, 30)).codes.map((c) => c.offerCode)).toEqual(["PRODCODE"]);
    expect((await promoStats(deps, 30, true)).codes.map((c) => c.offerCode)).toEqual(["SANDBOXCODE"]);
  });

  it("answers no rows when no coded event is in the window", async () => {
    const { deps } = setup();
    expect(await promoStats(deps, 30)).toEqual({ days: 30, codes: [] });
  });
});
