import { beforeEach, describe, expect, it } from "bun:test";
import { configDefaults, type Config } from "../config.ts";
import { demoPorts } from "../llm/demo.ts";
import { fakePush } from "../push/fake.ts";
import { logMail } from "../mail/log.ts";
import { memoryStore } from "../store.memory.ts";
import type { Store } from "../store.ts";
import type { EngineDeps } from "./index.ts";
import { PUSH_STATS_MAX_DAYS, pushOpenView, pushRecentView, recordPushDelivered, recordPushOpen } from "./push-open.ts";
import { sendLogged } from "./notify.ts";

const CONFIG: Config = {
  ...configDefaults(),
  port: 0, databaseUrl: "memory://test",
  llmProvider: "demo", llmModel: "demo", llmApiKey: "unused",
  timezone: "Europe/Berlin",
};

let store: Store;
let deps: EngineDeps;

beforeEach(() => {
  store = memoryStore();
  deps = { store, config: CONFIG, llm: demoPorts(), push: fakePush(), mail: logMail() };
});

async function userWithSend(): Promise<{ userId: string; sendId: string }> {
  const { userId } = await store.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en");
  const sendId = crypto.randomUUID();
  await store.createSend(userId, {
    id: sendId, kind: "campaign", ref: null, templateKey: "t1", lang: "en", variant: null,
    token: "ExponentPushToken[x]", state: "accepted",
  });
  return { userId, sendId };
}

describe("recordPushOpen", () => {
  it("answers ok however many times the phone reports, and counts the send opened once", async () => {
    const { userId, sendId } = await userWithSend();
    expect(await recordPushOpen(deps, userId, { sendId })).toEqual({ ok: true });
    expect(await recordPushOpen(deps, userId, { sendId, action: "reply" })).toEqual({ ok: true });
    const view = await pushOpenView(deps, 7);
    expect(view.rows).toHaveLength(1);
    expect(view.rows[0]).toMatchObject({ templateKey: "t1", sent: 1, accepted: 1, opened: 1 });
  });

  it("answers the same for another account's send, and records nothing", async () => {
    const { sendId } = await userWithSend();
    const { userId: stranger } = await store.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en");
    expect(await recordPushOpen(deps, stranger, { sendId })).toEqual({ ok: true });
    expect((await pushOpenView(deps, 7)).rows[0]!.opened).toBe(0);
  });
});

describe("recordPushDelivered", () => {
  it("answers ok however often the extension reports, and counts the send delivered once", async () => {
    const { userId, sendId } = await userWithSend();
    expect(await recordPushDelivered(deps, userId, { sendId })).toEqual({ ok: true });
    expect(await recordPushDelivered(deps, userId, { sendId })).toEqual({ ok: true });
    const row = (await pushOpenView(deps, 7)).rows[0]!;
    expect(row).toMatchObject({ sent: 1, accepted: 1, delivered: 1, opened: 0 });
  });

  it("answers the same for another account's send, and records nothing", async () => {
    const { sendId } = await userWithSend();
    const { userId: stranger } = await store.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en");
    expect(await recordPushDelivered(deps, stranger, { sendId })).toEqual({ ok: true });
    expect((await pushOpenView(deps, 7)).rows[0]!.delivered).toBe(0);
  });

  it("leaves the receipt state alone", async () => {
    const { userId, sendId } = await userWithSend();
    await recordPushDelivered(deps, userId, { sendId });
    expect((await store.sendLogFor(userId, 5))[0]).toMatchObject({ state: "accepted", deliveredAt: expect.any(String) });
  });
});

describe("pushOpenView", () => {
  it("dates the days in the instance zone and says so", async () => {
    await userWithSend();
    const view = await pushOpenView(deps, 7);
    expect(view.timezone).toBe("Europe/Berlin");
    expect(view.range.days).toBe(7);
  });

  it("bounds the window", async () => {
    expect((await pushOpenView(deps, 100_000)).range.days).toBe(PUSH_STATS_MAX_DAYS);
    expect((await pushOpenView(deps, 0)).range.days).toBe(1);
    expect((await pushOpenView(deps, Number.NaN)).range.days).toBe(7);
  });
});

describe("pushRecentView (#844)", () => {
  it("stores no text for a transactional push: it carries the account's own meal", async () => {
    const { userId } = await store.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en");
    await sendLogged(
      deps, userId, [{ token: "ExponentPushToken[t]" }],
      { kind: "transactional", ref: "meal-1", templateKey: "photo-counted", lang: "en" },
      { title: "Logged", body: "Salmon, rice · 480kcal" },
    );
    expect((await pushRecentView(deps, 5)).sends[0]).toMatchObject({ title: null, body: null, templateKey: "photo-counted" });
  });

  it("names the recipient and the text sent, as stored at send time", async () => {
    const { userId } = await store.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en");
    await store.addIdentity(userId, "google", "sub-844");
    await store.setIdentityEmail(userId, "google", "sub-844", "who@example.com");
    const out = await sendLogged(
      deps, userId, [{ token: "ExponentPushToken[a]" }],
      { kind: "campaign", ref: "c1", templateKey: "t1", lang: "en", variant: "a" },
      { title: "Hello", body: "Log your lunch" },
    );
    expect(out.sent).toBe(1);
    const view = await pushRecentView(deps, 50);
    expect(view.sends).toHaveLength(1);
    expect(view.sends[0]).toMatchObject({
      userId, email: "who@example.com", templateKey: "t1", title: "Hello", body: "Log your lunch", state: "accepted",
    });
    expect(JSON.stringify(view)).not.toContain("ExponentPushToken");
  });

  it("is newest first, bounded by the limit, and null text for a row from before the column", async () => {
    const { userId, sendId } = await userWithSend();
    const second = crypto.randomUUID();
    await store.createSend(userId, { id: second, kind: "campaign", ref: null, templateKey: "t2", lang: "en", variant: null, token: "x", state: "accepted", title: "T", body: "B" });
    const one = await pushRecentView(deps, 1);
    expect(one.sends.map((s) => s.id)).toEqual([second]);
    const all = await pushRecentView(deps, 50);
    expect(all.sends.find((s) => s.id === sendId)).toMatchObject({ title: null, body: null, email: null });
  });
});
