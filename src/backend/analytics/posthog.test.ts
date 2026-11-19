import { describe, expect, it, spyOn } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ANALYTICS_EVENTS, SERVER_SENT_WEB_EVENTS } from "@eait/shared";
import { posthogAnalytics } from "./posthog.ts";

const KEY = "phc_test_key_never_logged";
type Call = { url: string; init: RequestInit };

function recording(reply: () => Promise<Response> = async () => new Response("{}", { status: 200 })) {
  const calls: Call[] = [];
  return { calls, fetchImpl: (url: string, init: RequestInit) => { calls.push({ url, init }); return reply(); } };
}

describe("the PostHog adapter (ieat-app#3196)", () => {
  it("is off unless both the key and the host are set", () => {
    const { fetchImpl } = recording();
    expect(posthogAnalytics({ posthogKey: "", posthogHost: "" }, fetchImpl)).toBeUndefined();
    expect(posthogAnalytics({ posthogKey: KEY, posthogHost: "" }, fetchImpl)).toBeUndefined();
    expect(posthogAnalytics({ posthogKey: "", posthogHost: "https://eu.i.posthog.com" }, fetchImpl)).toBeUndefined();
  });

  it("warns, without the key, when only one of the key and the host is set", () => {
    const { fetchImpl } = recording();
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    posthogAnalytics({ posthogKey: KEY, posthogHost: "" }, fetchImpl);
    posthogAnalytics({ posthogKey: "", posthogHost: "https://eu.i.posthog.com" }, fetchImpl);
    posthogAnalytics({ posthogKey: "", posthogHost: "" }, fetchImpl);
    const lines = warn.mock.calls.map((c) => c.map(String).join(" "));
    warn.mockRestore();
    expect(lines).toEqual([
      "[eait] posthog: EAIT__BACKEND__POSTHOG_KEY is set without EAIT__BACKEND__POSTHOG_HOST; analytics is off",
      "[eait] posthog: EAIT__BACKEND__POSTHOG_HOST is set without EAIT__BACKEND__POSTHOG_KEY; analytics is off",
    ]);
  });

  it("posts one event as a batch to the host's capture API", async () => {
    const { calls, fetchImpl } = recording();
    posthogAnalytics({ posthogKey: KEY, posthogHost: "https://eu.i.posthog.com/" }, fetchImpl)!
      .capture("user-1", "signup_completed", { provider: "google" });
    expect(calls).toHaveLength(0);
    await Bun.sleep(0);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://eu.i.posthog.com/batch/");
    expect(calls[0]!.init.method).toBe("POST");
    expect(calls[0]!.init.signal).toBeInstanceOf(AbortSignal);
    const body = JSON.parse(String(calls[0]!.init.body));
    expect(body.api_key).toBe(KEY);
    expect(body.batch).toHaveLength(1);
    expect(body.batch[0]).toMatchObject({ event: "signup_completed", distinct_id: "user-1", properties: { provider: "google" } });
    expect(Number.isNaN(Date.parse(body.batch[0].timestamp))).toBe(false);
  });

  it("merges one person into another with $merge_dangerously", async () => {
    const { calls, fetchImpl } = recording();
    posthogAnalytics({ posthogKey: KEY, posthogHost: "https://eu.i.posthog.com" }, fetchImpl)!.merge("real", "anon");
    await Bun.sleep(0);
    const body = JSON.parse(String(calls[0]!.init.body));
    expect(body.batch[0]).toMatchObject({ event: "$merge_dangerously", distinct_id: "real", properties: { alias: "anon" } });
  });

  it("never throws, never waits, and logs a failure without the key", async () => {
    const errors = spyOn(console, "error").mockImplementation(() => {});
    try {
      const failing = recording(async () => { throw new Error(`refused ${KEY}`); });
      const refused = recording(async () => new Response("no", { status: 401 }));
      const result = posthogAnalytics({ posthogKey: KEY, posthogHost: "https://ph.test" }, failing.fetchImpl)!
        .capture("u", "signed_out", {});
      expect(result).toBeUndefined();
      posthogAnalytics({ posthogKey: KEY, posthogHost: "https://ph.test" }, refused.fetchImpl)!.capture("u", "signed_out", {});
      await Bun.sleep(0);
      expect(errors).toHaveBeenCalledTimes(2);
      for (const call of errors.mock.calls) expect(call.join(" ")).not.toContain(KEY);
    } finally {
      errors.mockRestore();
    }
  });
});

describe("what the server tracks (ieat-app#3196)", () => {
  it("is a server event or one /start sends for the web", () => {
    const backend = join(import.meta.dir, "..");
    const names = (readdirSync(backend, { recursive: true }) as string[])
      .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts") && !f.includes("node_modules"))
      .flatMap((f) => [...readFileSync(join(backend, f), "utf8").matchAll(/\btrack\(\s*[^,()]+,\s*[^,()]+,\s*"([^"]+)"/g)].map((m) => m[1]!));
    expect(names.length).toBeGreaterThan(0);
    const server = (n: string) => Object.hasOwn(ANALYTICS_EVENTS, n) && "server" in ANALYTICS_EVENTS[n as keyof typeof ANALYTICS_EVENTS];
    expect(names.filter((n) => !server(n) && !(SERVER_SENT_WEB_EVENTS as readonly string[]).includes(n))).toEqual([]);
  });
});
