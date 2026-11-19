import { beforeEach, describe, expect, it } from "bun:test";
import { DEFAULT_ONBOARDING_CONTENT, FIRST_VERDICT_VERSION, LANGS, TEMPLATE_RENDERER_VERSION, type OnboardingContent, type ScreenTemplateDraft } from "@eait/shared";
import { configDefaults, type Config } from "../config.ts";
import { logMail } from "../mail/log.ts";
import { demoPorts } from "../llm/demo.ts";
import { fakePush } from "../push/fake.ts";
import { memoryStore } from "../store.memory.ts";
import type { Store } from "../store.ts";
import type { EngineDeps } from "./deps.ts";
import { onboardingServedFor, startOnboardingExperiment } from "./onboarding.ts";
import { saveOnboardingVariantScreens, saveScreenTemplate, uploadTemplateAsset } from "./screen-templates.ts";

const CONFIG: Config = { ...configDefaults(), port: 0, databaseUrl: "memory://test", llmProvider: "demo", llmModel: "demo", llmApiKey: "unused" };
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1]);

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
const draft = (over: Partial<ScreenTemplateDraft> = {}): ScreenTemplateDraft => ({
  renderer: 1,
  blocks: [{ type: "headline", text: "h" }, { type: "cta", label: "go", action: "next" }],
  strings: strings({ h: "See how it works", go: "Continue" }),
  ...over,
});
const content = (version: number): OnboardingContent => ({ ...structuredClone(DEFAULT_ONBOARDING_CONTENT), version });
const experiment = (screens: unknown) => ({
  id: crypto.randomUUID(), lang: "en" as const, status: "draft" as const, rules: { surfaces: ["app" as const] } as { surfaces?: ("app" | "web")[] },
  variants: [{ control: true, weight: 0, content: content(41) }, { weight: 1, content: content(42), ...(screens ? { screens } : {}) }],
  created_by: admin, created_at: new Date().toISOString(), started_at: null, stopped_at: null, revision: 1,
});
const at = (tz: string) => ({ lang: "en" as const, surface: "app" as const, region: "DE", tz, orderVersion: 99, renderer: TEMPLATE_RENDERER_VERSION });

describe("saveScreenTemplate (#3167)", () => {
  it("appends a revision and answers its version", async () => {
    const one = await saveScreenTemplate(deps, admin, "evening-beat", draft());
    const two = await saveScreenTemplate(deps, admin, "evening-beat", draft({ note: "second" }));
    expect(one).toEqual({ ok: true, version: 1 });
    expect(two).toEqual({ ok: true, version: 2 });
  });
  it("refuses a bad key and an invalid template, naming why, and stores nothing", async () => {
    expect(await saveScreenTemplate(deps, admin, "Bad Key", draft())).toEqual({ ok: false, errors: ["key must be lowercase letters, digits and hyphens"] });
    const bad = draft();
    delete (bad.strings as Record<string, unknown>).ms;
    const r = await saveScreenTemplate(deps, admin, "t", bad);
    expect(r.ok).toBe(false);
    expect(await store.listScreenTemplates()).toEqual([]);
  });
  it("refuses an image that was never uploaded, and accepts it once it is", async () => {
    const img = (sha: string) => draft({ blocks: [{ type: "headline", text: "h" }, { type: "image", asset: sha, alt: "h" }, { type: "cta", label: "go", action: "next" }] });
    expect((await saveScreenTemplate(deps, admin, "t", img("a".repeat(64)))).ok).toBe(false);
    const up = await uploadTemplateAsset(deps, JPEG);
    expect(up.ok).toBe(true);
    if (!up.ok) return;
    expect(await saveScreenTemplate(deps, admin, "t", img(up.sha256))).toEqual({ ok: true, version: 1 });
  });
});

describe("uploadTemplateAsset (#3167)", () => {
  it("refuses anything but JPEG/PNG/WebP, and anything over the upload cap", async () => {
    expect(await uploadTemplateAsset(deps, new TextEncoder().encode("<svg/>"))).toEqual({ ok: false, errors: ["only JPEG, PNG or WebP"] });
    const big = new Uint8Array(CONFIG.maxUploadBytes + 1);
    big.set(JPEG);
    expect(await uploadTemplateAsset(deps, big)).toEqual({ ok: false, errors: [`over ${CONFIG.maxUploadBytes} bytes`] });
  });
  it("addresses the bytes by their sha256", async () => {
    const r = await uploadTemplateAsset(deps, JPEG);
    const hex = new Bun.CryptoHasher("sha256").update(JPEG).digest("hex");
    expect(r).toEqual({ ok: true, sha256: hex });
    expect((await store.templateAsset(hex))?.mime).toBe("image/jpeg");
  });
});

describe("arm screens (#3167)", () => {
  it("refuses a template version that does not exist, and the control arm", async () => {
    const e = experiment(null);
    await store.putOnboardingExperiment(e as never);
    const r = await saveOnboardingVariantScreens(deps, e.id, 1, { prelim: [{ template: "nope", version: 1 }] });
    expect(r).toEqual({ ok: false, errors: ["screens.prelim[0]: nope@1 does not exist"] });
    expect((await saveOnboardingVariantScreens(deps, e.id, 0, {})).ok).toBe(false);
  });

  it("serves the arm's screen in the user's LOCAL hour, and the evening one only in the evening", async () => {
    await saveScreenTemplate(deps, admin, "day", draft());
    await saveScreenTemplate(deps, admin, "evening", draft({ strings: strings({ h: "Evening already", go: "Continue" }) }));
    const e = experiment(null);
    await store.putOnboardingExperiment(e as never);
    expect(await saveOnboardingVariantScreens(deps, e.id, 1, {
      prelim: [{ template: "evening", version: 1, when: { hours: [18, 23] } }, { template: "day", version: 1 }],
    })).toEqual({ ok: true });
    await store.setSwitch("onboarding.experiments", true, admin);
    expect(await startOnboardingExperiment(deps, e.id)).toEqual({ ok: true });

    // 19:30 UTC is 20:30 in Berlin and 04:30 in Tokyo the next day: same instant, two local hours.
    const now = new Date("2026-11-19T19:30:00Z");
    const berlin = await onboardingServedFor(deps, userId, at("Europe/Berlin"), now);
    expect(berlin.screens?.slots.prelim?.template).toBe("evening");
    expect(berlin.screens?.slots.prelim?.strings.h).toBe("Evening already");
    const tokyo = await onboardingServedFor(deps, userId, at("Asia/Tokyo"), now);
    expect(tokyo.screens?.slots.prelim?.template).toBe("day");
  });

  it("never enrols a client below the templates' renderer, and serves it no screens", async () => {
    await saveScreenTemplate(deps, admin, "day", draft());
    const e = experiment(null);
    await store.putOnboardingExperiment(e as never);
    await saveOnboardingVariantScreens(deps, e.id, 1, { baseline: [{ template: "day", version: 1 }] });
    await store.setSwitch("onboarding.experiments", true, admin);
    await startOnboardingExperiment(deps, e.id);
    const old = await onboardingServedFor(deps, userId, { ...at("Europe/Berlin"), renderer: 0 });
    expect(old.screens).toBeUndefined();
    expect(await store.onboardingAssignment(userId, e.id)).toBeNull();
  });
});

describe("review round 1 (#3167)", () => {
  const running = async (screens: unknown, weights = [0, 1]) => {
    await saveScreenTemplate(deps, admin, "day", draft());
    const e = experiment(null);
    e.variants[0]!.weight = weights[0]!;
    e.variants[1]!.weight = weights[1]!;
    await store.putOnboardingExperiment(e as never);
    expect(await saveOnboardingVariantScreens(deps, e.id, 1, screens)).toEqual({ ok: true });
    await store.setSwitch("onboarding.experiments", true, admin);
    expect(await startOnboardingExperiment(deps, e.id)).toEqual({ ok: true });
    return e;
  };

  it("serves the arm's words with no screens when a template read throws — never stops onboarding", async () => {
    await running({ baseline: [{ template: "day", version: 1 }] });
    await onboardingServedFor(deps, userId, at("Europe/Berlin"));
    store.screenTemplate = async () => { throw new Error("db down"); };
    const r = await onboardingServedFor(deps, userId, at("Europe/Berlin"));
    expect(r.content.version).toBe(42);
    expect(r.screens).toBeUndefined();
  });

  it("serves no screens to an enrolled user's later client that cannot draw them", async () => {
    const e = await running({ baseline: [{ template: "day", version: 1 }] });
    expect((await onboardingServedFor(deps, userId, at("Europe/Berlin"))).screens).toBeDefined();
    const old = await onboardingServedFor(deps, userId, { ...at("Europe/Berlin"), renderer: 0 });
    expect(old.screens).toBeUndefined();
    expect(old.content.version).toBe(42);
    expect((await store.onboardingAssignment(userId, e.id))?.variant_id).toBe(42);
  });

  it("keeps an old client out even when it would have rolled control", async () => {
    const e = await running({ baseline: [{ template: "day", version: 1 }] }, [1, 0]);
    await onboardingServedFor(deps, userId, { ...at("Europe/Berlin"), renderer: 0 });
    expect(await store.onboardingAssignment(userId, e.id)).toBeNull();
  });

  it("serves the unwindowed entry when the device zone is unknown", async () => {
    await saveScreenTemplate(deps, admin, "eve", draft());
    await running({ baseline: [{ template: "eve", version: 1, when: { hours: [18, 23] } }, { template: "day", version: 1 }] });
    const r = await onboardingServedFor(deps, userId, at("Not/AZone"));
    expect(r.screens?.slots.baseline?.template).toBe("day");
  });

  it("omits screens entirely when no slot's window holds now", async () => {
    await saveScreenTemplate(deps, admin, "eve", draft());
    await running({ baseline: [{ template: "eve", version: 1, when: { hours: [18, 23] } }] });
    const r = await onboardingServedFor(deps, userId, at("Europe/Berlin"), new Date("2026-11-19T08:00:00Z"));
    expect(r.screens).toBeUndefined();
  });

  it("freezes a running arm's screens", async () => {
    const e = await running({ baseline: [{ template: "day", version: 1 }] });
    expect((await saveOnboardingVariantScreens(deps, e.id, 1, {})).ok).toBe(false);
    const stored = (await store.listOnboardingExperiments()).find((x) => x.id === e.id)!;
    expect(stored.variants[1]!.screens).toEqual({ baseline: [{ template: "day", version: 1 }] });
  });

  it("refuses to start an arm whose stored screens name a revision that was never saved", async () => {
    const e = experiment({ baseline: [{ template: "nope", version: 1 }] });
    await store.putOnboardingExperiment(e as never);
    await store.setSwitch("onboarding.experiments", true, admin);
    expect(await startOnboardingExperiment(deps, e.id)).toEqual({ ok: false, errors: ["arm 1: screens.baseline[0]: nope@1 does not exist"] });
    expect((await store.listOnboardingExperiments()).find((x) => x.id === e.id)?.status).toBe("draft");
  });

  it("refuses to start a screens arm that the web would enrol nobody into", async () => {
    await saveScreenTemplate(deps, admin, "day", draft());
    const e = experiment(null);
    e.rules = {};
    await store.putOnboardingExperiment(e as never);
    await saveOnboardingVariantScreens(deps, e.id, 1, { baseline: [{ template: "day", version: 1 }] });
    await store.setSwitch("onboarding.experiments", true, admin);
    expect(await startOnboardingExperiment(deps, e.id)).toEqual({ ok: false, errors: ['an arm with template screens runs on the app only — set surfaces to ["app"]'] });
  });

  it("serves an arm's first verdict and its screens together", async () => {
    await saveScreenTemplate(deps, admin, "day", draft());
    const e = experiment(null);
    (e.variants[1] as Record<string, unknown>).firstVerdict = "welcome-plate";
    await store.putOnboardingExperiment(e as never);
    expect(await saveOnboardingVariantScreens(deps, e.id, 1, { baseline: [{ template: "day", version: 1 }] })).toEqual({ ok: true });
    await store.setSwitch("onboarding.experiments", true, admin);
    expect(await startOnboardingExperiment(deps, e.id)).toEqual({ ok: true });
    const r = await onboardingServedFor(deps, userId, { ...at("Europe/Berlin"), verdictVersion: FIRST_VERDICT_VERSION });
    expect(r.firstVerdict).toBe("welcome-plate");
    expect(r.screens?.slots.baseline?.template).toBe("day");
  });

  it("answers a lost version race as a conflict", async () => {
    store.putScreenTemplate = async () => null;
    expect(await saveScreenTemplate(deps, admin, "t", draft())).toEqual({ ok: false, conflict: true, errors: ["another save took this version — save again"] });
  });
});
