// Meal copying web client helper (calodex_app#3683).
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { copyMeal, forget, signIn } from "../api.ts";

type Call = { url: string; method: string; body: string | null };

let calls: Call[] = [];
const realFetch = globalThis.fetch;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(async () => {
  calls = [];
  forget();
  globalThis.fetch = ((input: string | URL | Request, init: RequestInit = {}) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith("/") || url.startsWith("//")) return realFetch(input as never, init);
    const call = { url, method: init.method ?? "GET", body: typeof init.body === "string" ? init.body : null };
    calls.push(call);
    if (url === "/start/session/token") return Promise.resolve(json({ token: "tok" }));
    return Promise.resolve(json({ kind: "copied", sourceMealId: "meal/1", meals: [] }));
  }) as unknown as typeof fetch;
  await signIn();
  calls = [];
});

afterEach(() => { globalThis.fetch = realFetch; forget(); });

describe("copyMeal (POST /api/v1/meals/:id/copy)", () => {
  it("posts the offsets under the request's idempotency key to the meal-scoped copy route", async () => {
    await copyMeal("meal/1", [1, 0, -1], "client-key");
    expect(calls).toEqual([{
      url: "/api/v1/meals/meal%2F1/copy",
      method: "POST",
      body: JSON.stringify({ dayOffsets: [1, 0, -1], clientId: "client-key" }),
    }]);
  });
});
