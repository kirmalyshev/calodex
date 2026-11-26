import { beforeEach, describe, expect, it } from "bun:test";
import { clickParamsOf, forwardWebPurchase, sendWebVisit, webAttributionAllowed } from "./appsflyer-web.ts";
import { configDefaults, type Config } from "../config.ts";
import { memoryStore } from "../store.memory.ts";
import type { RevenueCatEventRow, Store } from "../store.ts";

const ON = { appsflyerWebS2sToken: "tok_not-a-real-token", appsflyerWebAppId: "website-eait.fit" };
const VISIT = {
  userId: "u-1", clickParams: "utm_source=meta&fbclid=abc", origin: "https://api.eait.fit",
  ip: "203.0.113.7", userAgent: "Mozilla/5.0", consented: true,
};

function recorder(response: () => Promise<Response> = async () => new Response(null, { status: 202 })) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchFn = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return response();
  }) as unknown as typeof fetch;
  return { calls, fetchFn };
}

describe("clickParamsOf", () => {
  it("keeps only the allow-listed click parameters, in a stable order", () => {
    const q = new URLSearchParams("email=a%40b.c&utm_campaign=ny&gclid=G1&ref=friend&utm_source=meta&pid=x&c=y");
    expect(clickParamsOf(q)).toBe("utm_source=meta&utm_campaign=ny&gclid=G1&pid=x&c=y");
  });

  it("is empty when the landing carried none, and drops empty or oversized values", () => {
    expect(clickParamsOf(new URLSearchParams("lang=de"))).toBe("");
    expect(clickParamsOf(new URLSearchParams(`utm_source=&gclid=${"x".repeat(600)}`))).toBe("");
  });
});

describe("webAttributionAllowed", () => {
  it("is off unless BOTH the token and the web app id are set", () => {
    expect(webAttributionAllowed({ appsflyerWebS2sToken: "", appsflyerWebAppId: "" }, true)).toBe(false);
    expect(webAttributionAllowed({ ...ON, appsflyerWebAppId: "" }, true)).toBe(false);
    expect(webAttributionAllowed({ ...ON, appsflyerWebS2sToken: "" }, true)).toBe(false);
    expect(webAttributionAllowed(ON, true)).toBe(true);
  });

  it("is off without the visitor's consent, however configured (Kirill, q93)", () => {
    expect(webAttributionAllowed(ON, false)).toBe(false);
  });
});

describe("sendWebVisit", () => {
  it("posts one visit for the account, with the landing's click parameters on event_url", async () => {
    const { calls, fetchFn } = recorder();
    await sendWebVisit(ON, VISIT, fetchFn);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://events.appsflyer.com/v2.0/s2s/visits/app/web/website-eait.fit");
    expect((calls[0]!.init.headers as Record<string, string>).authorization).toBe("Bearer tok_not-a-real-token");
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({
      user_id: { customer_user_id: "u-1" },
      event_url: "https://api.eait.fit/start?utm_source=meta&fbclid=abc",
      ip: "203.0.113.7",
      user_agent: "Mozilla/5.0",
    });
  });

  it("sends nothing when attribution is off, or the landing carried no click parameters", async () => {
    const { calls, fetchFn } = recorder();
    await sendWebVisit({ ...ON, appsflyerWebS2sToken: "" }, VISIT, fetchFn);
    await sendWebVisit(ON, { ...VISIT, clickParams: "" }, fetchFn);
    await sendWebVisit(ON, { ...VISIT, consented: false }, fetchFn);
    expect(calls).toHaveLength(0);
  });

  it("never throws, and never logs the token, when AppsFlyer refuses or the network fails", async () => {
    const logged: string[] = [];
    const original = console.error;
    console.error = (...a: unknown[]) => { logged.push(a.join(" ")); };
    try {
      await sendWebVisit(ON, VISIT, recorder(async () => new Response("no", { status: 401 })).fetchFn);
      await sendWebVisit(ON, VISIT, recorder(async () => { throw new Error("tok_not-a-real-token boom"); }).fetchFn);
    } finally {
      console.error = original;
    }
    expect(logged).toHaveLength(2);
    expect(logged.join("\n")).not.toContain("not-a-real-token");
  });
});

describe("forwardWebPurchase (ieat-app#3621, option A)", () => {
  const AT = Date.UTC(2026, 10, 26, 12);
  const config: Config = { ...configDefaults(), ...ON };
  let store: Store;
  const accountWith = async (consent: boolean | null) => {
    const { userId } = await store.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en");
    if (consent !== null) await store.setWebAttributionConsent(userId, consent);
    return userId;
  };
  const row = (userId: string, over: Partial<RevenueCatEventRow> = {}): RevenueCatEventRow => ({
    id: "rc-evt-1", userId, type: "INITIAL_PURCHASE", productId: "yearly", periodType: "TRIAL",
    presentedOfferingId: null, price: 0, currency: "EUR", priceInPurchasedCurrency: 0, store: "RC_BILLING",
    countryCode: "DE", environment: "PRODUCTION", eventAt: new Date(AT).toISOString(), offerCode: null,
    acquisition: null, ...over,
  });
  const forward = async (r: RevenueCatEventRow, trialConversion: boolean | null = null, c: Config = config) => {
    const rec = recorder();
    await forwardWebPurchase({ config: c, store }, r, trialConversion, rec.fetchFn);
    return rec.calls;
  };

  beforeEach(() => { store = memoryStore(); });

  it("an accepted account's web trial start sends exactly one in-app event", async () => {
    const u = await accountWith(true);
    const calls = await forward(row(u));
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://events.appsflyer.com/v2.0/s2s/inapps/app/web/website-eait.fit");
    expect(calls[0]!.init.method).toBe("POST");
    expect(calls[0]!.init.headers).toEqual({ authorization: "Bearer tok_not-a-real-token", "content-type": "application/json" });
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({
      user_id: { customer_user_id: u },
      event_name: "af_start_trial",
      event_revenue: 0,
      event_revenue_currency: "EUR",
      af_customer_event_id: "rc-evt-1",
      timestamp: AT,
    });
  });

  it("names each lifecycle event, prices paid ones, and sends nothing for any other type", async () => {
    const u = await accountWith(true);
    const paid = { periodType: "NORMAL", priceInPurchasedCurrency: 49.99, price: 54.1 };
    const sent = async (over: Partial<RevenueCatEventRow>, conv: boolean | null = null) =>
      (await forward(row(u, over), conv)).map((c) => JSON.parse(String(c.init.body)));
    const [subscribe] = await sent({ ...paid });
    expect(subscribe).toMatchObject({ event_name: "af_subscribe", event_revenue: 49.99, event_revenue_currency: "EUR" });
    expect((await sent({ ...paid, type: "RENEWAL" }, true))[0].event_name).toBe("rc_trial_converted_event");
    expect((await sent({ ...paid, type: "RENEWAL" }, false))[0].event_name).toBe("rc_renewal_event");
    // No purchased-currency price: RevenueCat's USD figure, in USD.
    expect((await sent({ ...paid, priceInPurchasedCurrency: null }))[0]).toMatchObject({ event_revenue: 54.1, event_revenue_currency: "USD" });
    for (const type of ["CANCELLATION", "EXPIRATION", "BILLING_ISSUE", "PRODUCT_CHANGE", "UNCANCELLATION", "TRANSFER"]) {
      expect(await sent({ ...paid, type })).toEqual([]);
    }
  });

  it("a declined account's web purchase sends NOTHING (Kirill)", async () => {
    expect(await forward(row(await accountWith(false)))).toEqual([]);
  });

  it("an account never asked sends nothing", async () => {
    expect(await forward(row(await accountWith(null)))).toEqual([]);
    expect(await forward(row(crypto.randomUUID()))).toEqual([]);
  });

  it("an App Store purchase on an accepted account sends nothing", async () => {
    const u = await accountWith(true);
    for (const s of ["APP_STORE", "PLAY_STORE", "STRIPE", null]) expect(await forward(row(u, { store: s }))).toEqual([]);
  });

  it("sends nothing when unconfigured", async () => {
    const u = await accountWith(true);
    expect(await forward(row(u), null, { ...config, appsflyerWebS2sToken: "" })).toEqual([]);
    expect(await forward(row(u), null, { ...config, appsflyerWebAppId: "" })).toEqual([]);
  });

  it("refuses a sandbox event unless sandbox is accepted, as the webhook does", async () => {
    const u = await accountWith(true);
    expect(await forward(row(u, { environment: "SANDBOX" }))).toEqual([]);
    expect(await forward(row(u, { environment: "SANDBOX" }), null, { ...config, revenueCatAcceptSandbox: true })).toHaveLength(1);
  });

  it("never throws, and logs only the error's name or the status, never the token", async () => {
    const u = await accountWith(true);
    const logged: string[] = [];
    const original = console.error;
    console.error = (...a: unknown[]) => { logged.push(a.join(" ")); };
    try {
      await forwardWebPurchase({ config, store }, row(u), null, recorder(async () => new Response("tok_not-a-real-token", { status: 401 })).fetchFn);
      await forwardWebPurchase({ config, store }, row(u), null, recorder(async () => { throw new Error("tok_not-a-real-token boom"); }).fetchFn);
      const broken = { ...store, webAttributionConsentOf: async () => { throw new Error("db down"); } } as Store;
      await forwardWebPurchase({ config, store: broken }, row(u), null, recorder().fetchFn);
    } finally {
      console.error = original;
    }
    expect(logged).toEqual([
      "[eait] appsflyer web purchase refused: 401",
      "[eait] appsflyer web purchase failed: Error",
      "[eait] appsflyer web purchase failed: Error",
    ]);
  });
});
