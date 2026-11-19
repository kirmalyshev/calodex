import { expect, it } from "bun:test";
import { MAX_ATTRIBUTION_TOKEN, ROUTES } from "@eait/shared";
import { configDefaults, type Config } from "../config.ts";
import { demoPorts } from "../llm/demo.ts";
import { logMail } from "../mail/log.ts";
import { fakePush } from "../push/fake.ts";
import { memoryStore } from "../store.memory.ts";
import type { AdServicesAnswer } from "../adservices.ts";
import { AuthError, type Verifier } from "../auth/verify.ts";
import { createRouter } from "./routes.ts";

const verifier: Verifier = {
  async verify() { throw new AuthError("invalid"); },
  async verifyAppleNotification() { throw new AuthError("invalid"); },
};
const config: Config = { ...configDefaults(), port: 0, databaseUrl: "memory://test", llmProvider: "demo", llmModel: "demo", llmApiKey: "unused" };

function mount(answer: AdServicesAnswer) {
  const store = memoryStore();
  const handle = createRouter(
    { store, config, llm: demoPorts(), push: fakePush(), mail: logMail(), adServices: async () => answer }, store, verifier);
  return { store, handle };
}
async function signIn(handle: (r: Request) => Promise<Response>) {
  const res = await handle(new Request(`http://localhost${ROUTES.authDevice}`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ deviceId: crypto.randomUUID() + crypto.randomUUID(), locale: "en" }),
  }));
  return await res.json() as { token: string; userId: string };
}
const post = (handle: (r: Request) => Promise<Response>, bearer: string | null, body: unknown) =>
  handle(new Request(`http://localhost${ROUTES.attribution}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(bearer ? { authorization: `Bearer ${bearer}` } : {}) },
    body: JSON.stringify(body),
  }));

it("needs a bearer", async () => {
  const { handle } = mount({ kind: "pending" });
  expect((await post(handle, null, { token: "t" })).status).toBe(401);
});

it("refuses a missing, empty or oversized token", async () => {
  const { handle } = mount({ kind: "pending" });
  const { token } = await signIn(handle);
  for (const body of [{}, { token: "" }, { token: 5 }, { token: "x".repeat(MAX_ATTRIBUTION_TOKEN + 1) }]) {
    expect((await post(handle, token, body)).status).toBe(400);
  }
});

it("stores the caller's attribution and answers resolved, saying nothing about it", async () => {
  const { store, handle } = mount({ kind: "attribution", attributed: true, campaignId: "1", adGroupId: "2", keywordId: "3" });
  const { token, userId } = await signIn(handle);
  const res = await post(handle, token, { token: "apple-token" });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ status: "resolved" });
  expect((await store.acquisitionOf(userId))?.campaign).toBe("1");
});

it("maps pending to 202, invalid to 422, unavailable to 503", async () => {
  for (const [kind, status] of [["pending", 202], ["invalid", 422], ["unavailable", 503]] as const) {
    const { handle } = mount({ kind });
    const { token } = await signIn(handle);
    const res = await post(handle, token, { token: "t" });
    expect(res.status).toBe(status);
    expect(await res.json()).toEqual({ status: kind });
  }
});
