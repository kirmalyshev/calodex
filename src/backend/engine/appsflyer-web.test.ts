import { describe, expect, it } from "bun:test";
import { clickParamsOf, sendWebVisit, webAttributionAllowed } from "./appsflyer-web.ts";

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
