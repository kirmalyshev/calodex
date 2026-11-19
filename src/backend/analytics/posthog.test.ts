import { describe, expect, it, spyOn } from "bun:test";
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
