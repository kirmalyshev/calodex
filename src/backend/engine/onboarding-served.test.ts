import { beforeEach, describe, expect, it } from "bun:test";
import { DEFAULT_ONBOARDING_CONTENT, LANGS, TEMPLATE_RENDERER_VERSION, type OnboardingContent, type ScreenTemplateDraft } from "@eait/shared";
import { configDefaults, type Config } from "../config.ts";
import { logMail } from "../mail/log.ts";
import { demoPorts } from "../llm/demo.ts";
import { fakePush } from "../push/fake.ts";
import { memoryStore } from "../store.memory.ts";
import type { Store } from "../store.ts";
import type { EngineDeps } from "./deps.ts";
import { adminUserOnboarding, serveOnboarding, startOnboardingExperiment } from "./onboarding.ts";
import { saveOnboardingVariantScreens, saveScreenTemplate } from "./screen-templates.ts";

const CONFIG: Config = { ...configDefaults(), port: 0, databaseUrl: "memory://test", llmProvider: "demo", llmModel: "demo", llmApiKey: "unused" };

let store: Store;
let deps: EngineDeps;
let admin: string;
let userId: string;

beforeEach(async () => {
  store = memoryStore();
  deps = { store, config: CONFIG, llm: demoPorts(), push: fakePush(), mail: logMail() };
  admin = await store.createUser("en");
  userId = await store.createUser("en");
});

const strings = (s: Record<string, string>) => Object.fromEntries(LANGS.map((l) => [l, { ...s }]));
const draft: ScreenTemplateDraft = {
  renderer: 1,
  blocks: [{ type: "headline", text: "h" }, { type: "cta", label: "go", action: "next" }],
  strings: strings({ h: "See how it works", go: "Continue" }),
};
const content = (version: number): OnboardingContent => ({ ...structuredClone(DEFAULT_ONBOARDING_CONTENT), version });
const signals = { lang: "en" as const, surface: "app" as const, region: "DE", tz: "Europe/Berlin", orderVersion: 99, renderer: TEMPLATE_RENDERER_VERSION };

/** A running experiment whose second arm (version 42) replaces the baseline beat with `day@1`. */
async function running() {
  await saveScreenTemplate(deps, admin, "day", draft);
  const e = {
    id: crypto.randomUUID(), lang: "en" as const, status: "draft" as const, rules: { surfaces: ["app" as const] },
    variants: [{ control: true, weight: 0, content: content(41) }, { weight: 1, content: content(42) }],
    created_by: admin, created_at: new Date().toISOString(), started_at: null, stopped_at: null, revision: 1,
  };
  await store.putOnboardingExperiment(e as never);
  expect(await saveOnboardingVariantScreens(deps, e.id, 1, { baseline: [{ template: "day", version: 1 }] })).toEqual({ ok: true });
  await store.setSwitch("onboarding.experiments", true, admin);
  expect(await startOnboardingExperiment(deps, e.id)).toEqual({ ok: true });
  return e;
}

let n = 0;
const event = (sessionId: string, place: string, action: string, contentVersion: number, over: Record<string, unknown> = {}) => ({
  id: `ev-${++n}`, sessionId, place, action, contentVersion, at: new Date(Date.now() + n * 1000).toISOString(), ...over,
});

describe("serveOnboarding records what it served (ieat-app#3194)", () => {
  it("records the version, language, surface and each slot's template — once per distinct serving", async () => {
    await running();
    const served = await serveOnboarding(deps, userId, signals);
    expect(served.content.version).toBe(42);
    expect(served.screens?.slots.baseline?.template).toBe("day");
    await serveOnboarding(deps, userId, signals);
    const rows = await store.onboardingServed(userId);
    expect(rows.map((r) => [r.contentVersion, r.lang, r.surface, r.screens])).toEqual([
      [42, "en", "app", { baseline: { template: "day", version: 1 } }],
    ]);
  });

  it("records an unassigned client's live copy, no screens", async () => {
    const served = await serveOnboarding(deps, userId, signals);
    expect((await store.onboardingServed(userId)).map((r) => [r.contentVersion, r.screens]))
      .toEqual([[served.content.version, {}]]);
  });

  it("never fails GET /v1/onboarding when the record cannot be written", async () => {
    await running();
    store.recordOnboardingServed = async () => { throw new Error("db down"); };
    const served = await serveOnboarding(deps, userId, signals);
    expect(served.content.version).toBe(42);
    expect(served.screens?.slots.baseline?.template).toBe("day");
  });
});

describe("adminUserOnboarding: each run as it was served (ieat-app#3194)", () => {
  it("names the arm, the language, the surface, the template and the words of every place", async () => {
    const e = await running();
    await serveOnboarding(deps, userId, signals);
    await store.recordOnboardingEvents(userId, [
      event("s1", "welcome", "view", 42),
      event("s1", "goal", "answer", 42, { field: "goal", value: "lose" }),
      event("s1", "baseline", "view", 42),
    ] as never);
    const view = await adminUserOnboarding(deps, userId);
    expect(view!.runs).toHaveLength(1);
    const run = view!.runs[0]!;
    expect(run).toMatchObject({
      sessionId: "s1", contentVersion: 42,
      experiment: { id: e.id, arm: "variant 2", isControl: false },
      lang: "en", surface: "app",
      screens: { baseline: { template: "day", version: 1 } },
    });
    expect(typeof run.servedAt).toBe("string");
    const goalAsk = DEFAULT_ONBOARDING_CONTENT.screens.find((s) => s.id === "goal")!.asks.goal!.lines[0]!;
    expect(run.copy!.welcome).toContain(DEFAULT_ONBOARDING_CONTENT.welcome.cta);
    expect(run.copy!.goal).toContain(goalAsk);
    expect(run.copy!.baseline).toBe("See how it works\n[Continue]");
  });

  it("says control for the control arm", async () => {
    const e = await running();
    await store.putOnboardingAssignment(userId, e.id, 41);
    await store.recordOnboardingEvents(userId, [event("s1", "welcome", "view", 41)] as never);
    const run = (await adminUserOnboarding(deps, userId))!.runs[0]!;
    expect(run.experiment).toEqual({ id: e.id, arm: "control", isControl: true });
  });

  it("derives what it can for a run nothing recorded the serving of, and invents nothing", async () => {
    const e = await running();
    await store.putOnboardingAssignment(userId, e.id, 42);
    await store.recordOnboardingEvents(userId, [
      event("old", "welcome", "view", 42),
      event("lost", "welcome", "view", 9, { at: new Date(Date.now() + 99_000).toISOString() }),
    ] as never);
    const [old, lost] = (await adminUserOnboarding(deps, userId))!.runs;
    // The arm comes from the assignment, the language from the arm's experiment; the serving was never recorded.
    expect(old).toMatchObject({ sessionId: "old", experiment: { id: e.id, arm: "variant 2" }, lang: "en", surface: null, servedAt: null, screens: null });
    expect(old!.copy!.welcome).toContain(DEFAULT_ONBOARDING_CONTENT.welcome.cta);
    // A version no copy is kept for, on a run with no record: nothing to say but that.
    expect(lost).toMatchObject({ sessionId: "lost", contentVersion: 9, experiment: null, lang: null, surface: null, screens: null, copy: null });
  });
});
