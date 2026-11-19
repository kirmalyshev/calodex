import { describe, expect, it, spyOn } from "bun:test";
import { ADSERVICES_URL, appleAdServices } from "./adservices.ts";

const reply = (status: number, body?: unknown) => async () =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

describe("Apple's AdServices adapter", () => {
  it("posts the raw token as text/plain to Apple's endpoint", async () => {
    let seen: { url: string; init: RequestInit } | null = null;
    const port = appleAdServices(async (url, init) => {
      seen = { url: String(url), init: init! };
      return new Response(JSON.stringify({ attribution: false }), { status: 200 });
    });
    await port("tok-123");
    expect(seen!.url).toBe(ADSERVICES_URL);
    expect(seen!.init.method).toBe("POST");
    expect(seen!.init.body).toBe("tok-123");
    expect(new Headers(seen!.init.headers).get("content-type")).toBe("text/plain");
    expect(seen!.init.signal).toBeInstanceOf(AbortSignal);
  });

  it("reads an attribution with Apple's ids", async () => {
    const port = appleAdServices(reply(200, {
      attribution: true, orgId: 1, campaignId: 11, adGroupId: 22, keywordId: 33, conversionType: "Download",
    }));
    expect(await port("t")).toEqual({ kind: "attribution", attributed: true, campaignId: "11", adGroupId: "22", keywordId: "33" });
  });

  it("reads an organic install", async () => {
    expect(await appleAdServices(reply(200, { attribution: false }))("t"))
      .toEqual({ kind: "attribution", attributed: false, campaignId: null, adGroupId: null, keywordId: null });
  });

  it("maps 404 to pending, 400 to invalid, anything else to unavailable", async () => {
    expect(await appleAdServices(reply(404))("t")).toEqual({ kind: "pending" });
    expect(await appleAdServices(reply(400))("t")).toEqual({ kind: "invalid" });
    expect(await appleAdServices(reply(500))("t")).toEqual({ kind: "unavailable" });
    expect(await appleAdServices(reply(200, { nope: 1 }))("t")).toEqual({ kind: "unavailable" });
    expect(await appleAdServices(async () => { throw new Error("network"); })("t")).toEqual({ kind: "unavailable" });
  });

  it("logs the status or error name of every outcome that is not an attribution, never the token", async () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    await appleAdServices(reply(404))("secret-token");
    await appleAdServices(reply(400))("secret-token");
    await appleAdServices(reply(503))("secret-token");
    await appleAdServices(reply(200, { nope: 1 }))("secret-token");
    await appleAdServices(async () => { throw Object.assign(new Error("x"), { name: "TimeoutError" }); })("secret-token");
    await appleAdServices(reply(200, { attribution: false }))("secret-token");
    const lines = warn.mock.calls.map((c) => c.map(String).join(" "));
    warn.mockRestore();
    expect(lines).toEqual([
      "[eait] adservices: pending, status 404",
      "[eait] adservices: invalid, status 400",
      "[eait] adservices: unavailable, status 503",
      "[eait] adservices: unavailable, unreadable answer, status 200",
      "[eait] adservices: unavailable, TimeoutError",
    ]);
    for (const l of lines) expect(l).not.toContain("secret-token");
  });

  it("gives up after its timeout", async () => {
    const port = appleAdServices((_u, init) => new Promise((_, reject) =>
      init!.signal!.addEventListener("abort", () => reject(new Error("aborted")))), 20);
    expect(await port("t")).toEqual({ kind: "unavailable" });
  });
});
