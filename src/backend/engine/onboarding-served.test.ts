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
    store.recordOnboardingServed = async () => { throw Object.assign(new Error(`row for ${userId} refused`), { code: "23503" }); };
    const logged: string[] = [];
    const was = console.error;
    console.error = (...a: unknown[]) => { logged.push(a.map(String).join(" ")); };
    try {
      const served = await serveOnboarding(deps, userId, signals);
      expect(served.content.version).toBe(42);
      expect(served.screens?.slots.baseline?.template).toBe("day");
      await Bun.sleep(0);
    } finally {
      console.error = was;
    }
    expect(logged).toEqual(["[eait] onboarding serving not recorded (content v42, app): Error 23503"]);
    expect(logged.join()).not.toContain(userId);
  });
});

describe("adminUserOnboarding: each run as it was served (ieat-app#3194)", () => {
  const served = (contentVersion: number, screens = {}) =>
    store.recordOnboardingServed(userId, { contentVersion, lang: "en", surface: "app", screens });
  const runs = async () => (await adminUserOnboarding(deps, userId))!.runs;

  it("names the arm, the language, the surface, the template and the words of every place", async () => {
    const e = await running();
    await serveOnboarding(deps, userId, signals);
    await store.recordOnboardingEvents(userId, [
      event("s1", "welcome", "view", 42),
      event("s1", "goal", "answer", 42, { field: "goal", value: "lose" }),
      event("s1", "baseline", "view", 42),
    ] as never);
    const [run] = await runs();
    expect(run).toMatchObject({
      sessionId: "s1", contentVersion: 42, experiment: { id: e.id, arm: "variant 2" }, lang: "en",
      served: { surface: "app", screens: { baseline: { template: "day", version: 1 } } },
    });
    expect(typeof run!.served!.at).toBe("string");
    const goalAsk = DEFAULT_ONBOARDING_CONTENT.screens.find((s) => s.id === "goal")!.asks.goal!.lines[0]!;
    expect(run!.copy!.welcome).toContain(DEFAULT_ONBOARDING_CONTENT.welcome.cta);
    expect(run!.copy!.goal).toContain(goalAsk);
    expect(run!.copy!.baseline).toBe("See how it works\n[Continue]");
  });

  it("says control for the control arm, and 'fell back' when an assigned account's run shows another version", async () => {
    const e = await running();
    await store.putOnboardingAssignment(userId, e.id, 41);
    await store.recordOnboardingEvents(userId, [event("c", "welcome", "view", 41), event("x", "welcome", "view", 42)] as never);
    const [control, other] = await runs();
    expect(control!.experiment).toEqual({ id: e.id, arm: "control", fellBack: false });
    expect(other!.experiment).toEqual({ id: e.id, arm: "control", fellBack: true });
  });

  it("derives the arm for a run nothing recorded the serving of, and guesses nothing else", async () => {
    const e = await running();
    await store.putOnboardingAssignment(userId, e.id, 42);
    const stranger = await store.createUser("en");
    await store.recordOnboardingEvents(userId, [event("old", "welcome", "view", 42)] as never);
    await store.recordOnboardingEvents(stranger, [event("lost", "welcome", "view", 9)] as never);
    const [old] = await runs();
    const [lost] = (await adminUserOnboarding(deps, stranger))!.runs;
    expect(old).toMatchObject({ sessionId: "old", experiment: { id: e.id, arm: "variant 2", fellBack: false }, lang: null, served: null, copy: null });
    expect(lost).toMatchObject({ sessionId: "lost", contentVersion: 9, experiment: null, lang: null, served: null, copy: null });
  });

  it("matches each run to the latest serving before it (A, B, A), and a run before every serving to none", async () => {
    const base = Date.parse("2026-11-19T10:00:00Z");
    const at = (min: number) => new Date(base + min * 60_000).toISOString();
    let clock = base;
    store = memoryStore({ now: () => clock });
    deps = { ...deps, store };
    userId = await store.createUser("en");
    await store.recordOnboardingEvents(userId, [event("early", "welcome", "view", 7, { at: at(-30) })] as never);
    clock = Date.parse(at(0)); await served(7, { baseline: { template: "a", version: 1 } });
    clock = Date.parse(at(10)); await served(7, { baseline: { template: "b", version: 1 } });
    clock = Date.parse(at(20)); await served(7, { baseline: { template: "a", version: 1 } });
    await store.recordOnboardingEvents(userId, [
      event("r1", "welcome", "view", 7, { at: at(1) }),
      event("r2", "welcome", "view", 7, { at: at(11) }),
      event("r3", "welcome", "view", 7, { at: at(21) }),
    ] as never);
    const byId = Object.fromEntries((await runs()).map((r) => [r.sessionId, r]));
    expect(byId.early!.served).toBeNull();
    expect(byId.r1!.served!.at).toBe(at(0));
    expect(byId.r2!.served!.at).toBe(at(10));
    expect(byId.r3!.served!.at).toBe(at(20));
  });

  it("prefers a serving before the run to one just after it, and reaches past it only by the drift", async () => {
    const base = Date.parse("2026-11-19T10:00:00Z");
    const at = (min: number) => new Date(base + min * 60_000).toISOString();
    let clock = base;
    store = memoryStore({ now: () => clock });
    deps = { ...deps, store };
    userId = await store.createUser("en");
    const serve = (v: number, lang: "en" | "de", min: number) => {
      clock = Date.parse(at(min));
      return store.recordOnboardingServed(userId, { contentVersion: v, lang, surface: "app", screens: {} });
    };
    await serve(7, "en", -10);
    await serve(7, "de", 1);
    await serve(8, "en", 31);
    await serve(9, "en", 40);
    await store.recordOnboardingEvents(userId, [
      event("before", "welcome", "view", 7, { at: at(0) }),
      // Nothing before it: the client's clock runs a minute behind, so the serving a minute later is its own.
      event("behind", "welcome", "view", 8, { at: at(30) }),
      event("far", "welcome", "view", 9, { at: at(37) }),
    ] as never);
    const byId = Object.fromEntries((await runs()).map((r) => [r.sessionId, r]));
    expect(byId.before!.lang).toBe("en");
    expect(byId.behind!.served!.at).toBe(at(31));
    expect(byId.far!.served).toBeNull();
  });

  it("renders no compiled copy and no word the live row does not itself hold", async () => {
    await store.recordOnboardingServed(userId, { contentVersion: DEFAULT_ONBOARDING_CONTENT.version, lang: "en", surface: "app", screens: {} });
    await store.recordOnboardingEvents(userId, [event("compiled", "welcome", "view", DEFAULT_ONBOARDING_CONTENT.version)] as never);
    const [compiled] = await runs();
    expect(compiled).toMatchObject({ lang: "en", copy: null });

    const other = await store.createUser("en");
    const v = await store.putOnboardingContent("en", { version: 0, welcome: { lines: ["Row hello"], cta: "Row go", signin: "Row in" } } as never, 600);
    await store.recordOnboardingServed(other, { contentVersion: v, lang: "en", surface: "app", screens: {} });
    await store.recordOnboardingEvents(other, [event("row", "welcome", "view", v), event("row", "summary", "view", v)] as never);
    const [row] = (await adminUserOnboarding(deps, other))!.runs;
    expect(row!.copy!.welcome).toBe("Row hello\n[Row go]\n[Row in]");
    expect(row!.copy!.summary).toBeUndefined();
  });

  it("renders today's live copy only for a run at its version, and nothing for a version nothing keeps", async () => {
    const live = { ...structuredClone(DEFAULT_ONBOARDING_CONTENT), welcome: { ...DEFAULT_ONBOARDING_CONTENT.welcome, cta: "Live door" } };
    const v = await store.putOnboardingContent("en", live, 500);
    await served(v);
    await store.recordOnboardingEvents(userId, [event("now", "welcome", "view", v)] as never);
    await served(5);
    await store.recordOnboardingEvents(userId, [event("then", "welcome", "view", 5, { at: new Date(Date.now() + 99_000).toISOString() })] as never);
    const [now, then] = await runs();
    expect(now!.copy!.welcome).toContain("Live door");
    expect(then).toMatchObject({ lang: "en", copy: null });
  });

  it("never fills an arm's missing words from today's copy, and names a template revision it cannot find", async () => {
    const partial = { version: 77, welcome: { lines: ["Arm hello"], cta: "Arm go", signin: "Arm in" } };
    const e = {
      id: crypto.randomUUID(), lang: "en" as const, status: "running" as const, rules: {},
      variants: [{ control: true, weight: 0, content: content(76) }, { weight: 1, content: partial }],
      created_by: admin, created_at: new Date().toISOString(), started_at: null, stopped_at: null, revision: 1,
    };
    await store.putOnboardingExperiment(e as never);
    await store.putOnboardingAssignment(userId, e.id, 77);
    await served(77, { baseline: { template: "gone", version: 9 } });
    await store.recordOnboardingEvents(userId, [
      event("p", "welcome", "view", 77), event("p", "summary", "view", 77), event("p", "baseline", "view", 77),
    ] as never);
    const [run] = await runs();
    expect(run!.copy!.welcome).toBe("Arm hello\n[Arm go]\n[Arm in]");
    expect(run!.copy!.summary).toBeUndefined();
    expect(run!.copy!.baseline).toBe("template gone@v9 not found");
  });
});

