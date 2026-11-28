// Meal screen "Add Photo" web client helper + bounds (calodex_app#3684).
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { ApiError, attachMealPhotos, forget, remainingMealPhotos, signIn } from "../api.ts";
import { refusalWords } from "../shell.ts";

type Call = { url: string; method: string; body: FormData | string | null };

let calls: Call[] = [];
let answer: (call: Call) => Response;
const realFetch = globalThis.fetch;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(async () => {
  calls = [];
  forget();
  globalThis.fetch = ((input: string | URL | Request, init: RequestInit = {}) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith("/") || url.startsWith("//")) return realFetch(input as never, init);
    const call: Call = {
      url,
      method: init.method ?? "GET",
      body: init.body instanceof FormData || typeof init.body === "string" ? init.body : null,
    };
    calls.push(call);
    if (url === "/start/session/token") return Promise.resolve(json({ token: "tok" }));
    return Promise.resolve(answer(call));
  }) as unknown as typeof fetch;
  await signIn();
  calls = [];
});

afterEach(() => { globalThis.fetch = realFetch; forget(); });

describe("attachMealPhotos (POST /api/v1/meals/:id/photos)", () => {
  it("uploads photos as multipart FormData without calling any analysis route", async () => {
    answer = () => json({ mealId: "meal/1", photos: 1 });
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "plate.jpg", { type: "image/jpeg" });
    const res = await attachMealPhotos("meal/1", [file], 0.8, 768);
    expect(res).toEqual({ mealId: "meal/1", photos: 1 });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("/api/v1/meals/meal%2F1/photos");
    expect(calls[0]!.method).toBe("POST");
    const form = calls[0]!.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect(form.getAll("photo")).toHaveLength(1);
    expect(form.get("compression")).toBe("0.8");
    expect(form.get("maxEdge")).toBe("768");
  });

  it("omits compression and maxEdge when the browser sent original bytes", async () => {
    answer = () => json({ mealId: "m-2", photos: 2 });
    const f1 = new File([new Uint8Array([0xff, 0xd8, 0xff])], "a.jpg", { type: "image/jpeg" });
    const f2 = new File([new Uint8Array([0xff, 0xd8, 0xff])], "b.jpg", { type: "image/jpeg" });
    expect(await attachMealPhotos("m-2", [f1, f2])).toEqual({ mealId: "m-2", photos: 2 });
    const form = calls[0]!.body as FormData;
    expect(form.getAll("photo")).toHaveLength(2);
    expect(form.get("compression")).toBeNull();
    expect(form.get("maxEdge")).toBeNull();
  });

  it("propagates server errors (400 too-many-photos, 415 unsupported-image, 409 target-gone)", async () => {
    answer = () => json({ error: "too-many-photos", limit: 4 }, 400);
    const f = new File([new Uint8Array([1, 2, 3])], "bad.bin", { type: "application/octet-stream" });
    await expect(attachMealPhotos("m-1", [f])).rejects.toMatchObject({
      status: 400,
      body: { error: "too-many-photos", limit: 4 },
    });

    answer = () => json({ error: "unsupported-image" }, 415);
    await expect(attachMealPhotos("m-1", [f])).rejects.toMatchObject({
      status: 415,
      body: { error: "unsupported-image" },
    });

    answer = () => json({ error: "target-gone", on: "correction" }, 409);
    await expect(attachMealPhotos("m-1", [f])).rejects.toMatchObject({
      status: 409,
      body: { error: "target-gone" },
    });
  });
});

describe("remainingMealPhotos", () => {
  it("computes remaining photo slots against the server limit", () => {
    expect(remainingMealPhotos(undefined, 4)).toBe(4);
    expect(remainingMealPhotos(0, 4)).toBe(4);
    expect(remainingMealPhotos(1, 4)).toBe(3);
    expect(remainingMealPhotos(4, 4)).toBe(0);
    expect(remainingMealPhotos(6, 4)).toBe(0);
  });
});

describe("refusalWords for too-many-photos", () => {
  it("formats the server limit into photosMax copy", () => {
    const err = new ApiError(400, { error: "too-many-photos", limit: 4 }, "POST /meals/1/photos: 400");
    expect(refusalWords(err)).toContain("4");
  });

  it("falls back cleanly when limit is absent", () => {
    const err = new ApiError(400, { error: "too-many-photos" }, "POST /meals/1/photos: 400");
    expect(refusalWords(err)).toBe("That is more angles than one meal can have.");
  });
});
