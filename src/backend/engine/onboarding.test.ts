import { fakePush } from "../push/fake.ts";
import { logMail } from "../mail/log.ts";
// The onboarding engine: content storage, event sanitising, and the funnel.
//
// The event tests are the important ones. `/v1/onboarding/events` is authenticated with an ordinary
// user's token, so every rule about what may be stored has to hold against a caller who is not our
// app — a client that sends a body weight as an event value, or a place name that is a megabyte of
// text, is not hypothetical once the API is public.

import { beforeEach, describe, expect, it } from "bun:test";
import { ONBOARDING_CONTENT, ONBOARDING_PLACES, DEFAULT_ONBOARDING_CONTENT, type OnboardingContent } from "@eait/shared";
import { configDefaults, type Config } from "../config.ts";
import { demoPorts } from "../llm/demo.ts";
import { memoryStore } from "../store.memory.ts";
import type { Store } from "../store.ts";
import type { EngineDeps } from "./deps.ts";
import { appendLines } from "./chat.ts";
import {
  assignVariant, onboardingContent, onboardingContentFor, onboardingFunnel, recordOnboardingEvents,
  resetOnboardingContent, saveOnboardingContent,
} from "./onboarding.ts";

const CONFIG: Config = {
  ...configDefaults(),
  port: 0, databaseUrl: "memory://test",
  llmProvider: "demo", llmModel: "demo", llmApiKey: "unused",
};

let store: Store;
let deps: EngineDeps;
let userId: string;

beforeEach(async () => {
  store = memoryStore();
  deps = { store, config: CONFIG, llm: demoPorts(), push: fakePush(), mail: logMail() };
  userId = await store.createUser("en");
});

const clone = (c: OnboardingContent): OnboardingContent => structuredClone(c);

const event = (over: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  sessionId: "s1",
  place: "goal",
  action: "view",
  contentVersion: 1,
  at: new Date().toISOString(),
  ...over,
});

describe("content", () => {
  it("serves the shipped copy when nothing has been saved", async () => {
    // Not seeded on boot, deliberately: seeding makes "has an admin ever touched this?"
    // unanswerable, and the answer decides whether a copy change is worth attributing anything to.
    expect(await store.getOnboardingContent()).toBeNull();
    expect((await onboardingContent(deps, "en")).version).toBe(DEFAULT_ONBOARDING_CONTENT.version);
  });

  it("bumps the version on save, ignoring whatever the admin sent", async () => {
    const before = (await onboardingContent(deps, "en")).version;
    const payload = clone(DEFAULT_ONBOARDING_CONTENT);
    payload.version = 99; // an admin's stale copy, or a hand-edited JSON
    payload.screens[0]!.asks.goal!.lines = ["Why are you here?"];

    const saved = await saveOnboardingContent(deps, payload, "en");
    expect(saved.ok).toBe(true);
    // The version is the join key between a funnel row and the words that produced it. Accepting
    // the client's number would let two different flows share one, which silently averages two
    // experiments into one meaningless number.
    expect(saved.ok && saved.content.version).toBe(before + 1);
    expect((await onboardingContent(deps, "en")).screens[0]!.asks.goal!.lines).toEqual(["Why are you here?"]);
  });

  it("refuses invalid copy and stores nothing", async () => {
    const payload = clone(DEFAULT_ONBOARDING_CONTENT);
    payload.screens = payload.screens.filter((s) => s.id !== "target");

    const result = await saveOnboardingContent(deps, payload, "en");
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.errors.join(" ")).toContain("target");
    // The refusal is total: a half-saved flow is worse than an unsaved one.
    expect(await store.getOnboardingContent()).toBeNull();
  });

  it("serves a saved hidden line, and an ask coordinate into it appends no empty bubble (ieat-app#2756)", async () => {
    const payload = clone(DEFAULT_ONBOARDING_CONTENT);
    payload.screens[0]!.asks.goal!.lines = ["Which fits you?", ""];
    expect((await saveOnboardingContent(deps, payload, "en")).ok).toBe(true);
    // The hidden line resolves to "" and is refused rather than appended as an empty message.
    expect(await appendLines(deps, userId, [{ role: "assistant", ask: { prompt: "goal", line: 1 } }]))
      .toEqual({ appended: 0, reason: "bad-line" });
    expect(await appendLines(deps, userId, [{ role: "assistant", ask: { prompt: "goal", line: 0 } }]))
      .toEqual({ appended: 1 });
  });

  it("restores the defaults with a version ahead of the edit it replaces", async () => {
    const edited = clone(DEFAULT_ONBOARDING_CONTENT);
    edited.screens[0]!.asks.goal!.lines = ["Broken but valid"];
    await saveOnboardingContent(deps, edited, "en");

    const restored = await resetOnboardingContent(deps, "en");
    expect(restored.screens[0]!.asks.goal!.lines)
      .toEqual(DEFAULT_ONBOARDING_CONTENT.screens[0]!.asks.goal!.lines);
    // Ahead, not back to 1. An app that cached the bad copy compares versions, and a lower number
    // would leave it showing the thing the admin just undid.
    expect(restored.version).toBeGreaterThan(DEFAULT_ONBOARDING_CONTENT.version + 1);
  });
});

describe("events", () => {
  it("stores what the app sends", async () => {
    const n = await recordOnboardingEvents(deps, userId, [
      event({ place: "goal", action: "view" }),
      event({ place: "goal", action: "answer", field: "goal", value: "lose", ms: 2400 }),
    ]);
    expect(n).toBe(2);

    const funnel = await onboardingFunnel(deps, 30);
    const goal = funnel.rows.find((r) => r.place === "goal")!;
    expect(goal.views).toBe(1);
    expect(goal.answers).toBe(1);
    expect(goal.medianMs).toBe(2400);
  });

  // #899: the friend's-link step reports its own drop-off, on the app and on the web alike.
  it("counts the friend's-link step as a place of its own", async () => {
    expect(await recordOnboardingEvents(deps, userId, [
      event({ place: "referral", action: "view" }), event({ place: "referral", action: "answer" }),
    ])).toBe(2);
    const rows = (await onboardingFunnel(deps, 30)).rows.map((r) => r.place);
    expect(rows.indexOf("referral")).toBeGreaterThan(rows.indexOf("country"));
  });

  it("is idempotent on the event id", async () => {
    const e = event({ action: "view" });
    expect(await recordOnboardingEvents(deps, userId, [e])).toBe(1);
    // The app re-sends a batch it could not confirm. A funnel that double-counted those would
    // report its best numbers for its worst-connected users.
    expect(await recordOnboardingEvents(deps, userId, [e])).toBe(0);
    expect((await onboardingFunnel(deps, 30)).rows.find((r) => r.place === "goal")!.views).toBe(1);
  });

  it("drops an unknown place or action rather than storing it", async () => {
    const n = await recordOnboardingEvents(deps, userId, [
      event({ place: "the-paywall" }),
      event({ action: "purchased" }),
      event({ place: "x".repeat(5000) }),
    ]);
    expect(n).toBe(0);
  });

  it("strips a value for a field that is not enumerated", async () => {
    // THE PRIVACY RULE, enforced on the write. A client that sends a body weight as an event value
    // must not be able to put it in the analytics table, whatever the app promises to send.
    await recordOnboardingEvents(deps, userId, [
      event({ place: "weight", action: "answer", field: "weight_kg", value: "93" }),
      event({ place: "restrictions", action: "answer", field: "medical_limitations", value: "stage 3 CKD" }),
      event({ place: "goal", action: "answer", field: "goal", value: "lose" }),
    ]);

    const stored = await store.onboardingFunnel({ from: null, to: null });
    expect(stored.rows.find((r) => r.place === "weight")!.answers).toBe(1);
    // The rows exist — the funnel still knows those screens were answered — and the values do not.
    const raw = JSON.stringify(stored);
    expect(raw).not.toContain("93");
    expect(raw).not.toContain("CKD");
  });

  it("caps a batch", async () => {
    const many = Array.from({ length: 500 }, () => event({ action: "view" }));
    expect(await recordOnboardingEvents(deps, userId, many)).toBe(100);
  });

  it("survives junk without throwing", async () => {
    expect(await recordOnboardingEvents(deps, userId, "not an array")).toBe(0);
    expect(await recordOnboardingEvents(deps, userId, [null, 7, {}, { id: "x" }])).toBe(0);
    // A phone whose clock is wrong must not break the insert.
    expect(await recordOnboardingEvents(deps, userId, [event({ at: "tuesday" })])).toBe(1);
  });

  it("is erased with the account", async () => {
    await recordOnboardingEvents(deps, userId, [event({ action: "view" })]);
    expect((await onboardingFunnel(deps, 30)).sessions).toBe(1);

    await store.deleteUser(userId);
    // Onboarding tells the user "deleting your account erases it" while asking about their kidneys.
    // The funnel is not an exception to that sentence.
    expect((await onboardingFunnel(deps, 30)).sessions).toBe(0);
  });
});

describe("the funnel", () => {
  beforeEach(async () => {
    const at = new Date().toISOString();
    // Two runs. One completes; one abandons on the body screen, which is the screen a real
    // onboarding loses people on.
    await recordOnboardingEvents(deps, userId, [
      { id: "a1", sessionId: "a", place: "goal", action: "view", contentVersion: 1, at },
      { id: "a2", sessionId: "a", place: "goal", action: "answer", field: "goal", value: "lose", ms: 1000, at },
      { id: "a3", sessionId: "a", place: "weight", action: "view", contentVersion: 1, at },
      { id: "a4", sessionId: "a", place: "weight", action: "answer", field: "weight_kg", ms: 5000, at },
      { id: "a5", sessionId: "a", place: "summary", action: "complete", contentVersion: 1, at },
      { id: "b1", sessionId: "b", place: "goal", action: "view", contentVersion: 1, at },
      { id: "b2", sessionId: "b", place: "goal", action: "answer", field: "goal", value: "gain", ms: 3000, at },
      { id: "b3", sessionId: "b", place: "weight", action: "view", contentVersion: 1, at },
      { id: "b4", sessionId: "b", place: "weight", action: "back", ms: 9000, at },
    ] as never);
  });

  it("counts runs and completions", async () => {
    const f = await onboardingFunnel(deps, 30);
    expect(f.sessions).toBe(2);
    expect(f.completed).toBe(1);
  });

  it("shows the drop-off as views minus answers", async () => {
    const f = await onboardingFunnel(deps, 30);
    const body = f.rows.find((r) => r.place === "weight")!;
    expect(body.views).toBe(2);
    expect(body.answers).toBe(1);
    expect(body.backs).toBe(1);
  });

  it("medians the time to answer, ignoring views", async () => {
    const f = await onboardingFunnel(deps, 30);
    // 1000 and 3000 → 2000. A median that had counted the view events (which carry no elapsed
    // time) or the 9000ms back would be measuring something else entirely.
    expect(f.rows.find((r) => r.place === "goal")!.medianMs).toBe(2000);
  });

  it("lists every place in order, including ones nobody reached", async () => {
    const f = await onboardingFunnel(deps, 30);
    const places = f.rows.map((r) => r.place);
    // The order a person meets them in — the welcome beat, the questions (the profile ones and the
    // one that is conversation), the plan being built, the plan. A drop between two adjacent rows
    // is only readable as a drop if the rows are in the order they happened. Fixed in code: the
    // chat asks in an order its own replies depend on, so there is no admin ordering to follow.
    expect(places).toEqual([...ONBOARDING_PLACES]);
    // A screen with no events is a row of zeroes, not a missing row: "nobody got here" is the most
    // important thing a funnel can say, and it cannot say it by omission.
    expect(f.rows.find((r) => r.place === "country")!.views).toBe(0);
  });

  it("reports the content version the numbers belong to", async () => {
    const f = await onboardingFunnel(deps, 30);
    expect(f.contentVersion).toBe(DEFAULT_ONBOARDING_CONTENT.version);
  });
});

describe("copy is stored per language, in one row", () => {
  it("serves each language its own compiled-in copy when nothing has been saved", async () => {
    expect((await onboardingContent(deps, "de")).welcome.lines).toEqual(ONBOARDING_CONTENT.de!.welcome.lines);
    expect((await onboardingContent(deps, "vi")).summary.cta).toBe(ONBOARDING_CONTENT.vi!.summary.cta);
  });

  it("does not let a save in one language reach a reader of another", async () => {
    // The whole reason the row holds a map. An admin editing German must not be able to put German
    // in front of an Italian, and must not be able to blank the Italian somebody else wrote.
    const german = clone(ONBOARDING_CONTENT.de!);
    german.welcome.cta = "Auf geht's";
    const italian = clone(ONBOARDING_CONTENT.it!);
    italian.welcome.cta = "Andiamo";

    expect((await saveOnboardingContent(deps, italian, "it")).ok).toBe(true);
    expect((await saveOnboardingContent(deps, german, "de")).ok).toBe(true);

    expect((await onboardingContent(deps, "de")).welcome.cta).toBe("Auf geht's");
    expect((await onboardingContent(deps, "it")).welcome.cta).toBe("Andiamo");
    // Untouched languages are the SHIPPED copy, never the other admin's.
    expect((await onboardingContent(deps, "fr")).welcome.cta).toBe(ONBOARDING_CONTENT.fr!.welcome.cta);
    expect((await onboardingContent(deps, "en")).welcome.cta).toBe(DEFAULT_ONBOARDING_CONTENT.welcome.cta);
    expect(Object.keys((await store.getOnboardingContent())!).sort()).toEqual(["de", "it"]);
  });

  it("reads a row written before the language dimension as English", async () => {
    // Every host that pressed Save before #358 has one, and it was English because English was all
    // there was. Adopting it for every language would serve an admin's English to a German.
    const legacy = clone(DEFAULT_ONBOARDING_CONTENT);
    legacy.welcome.cta = "Onwards";
    // SEEDED, not written: `putOnboardingContent` takes one language now, so the shape this test is
    // about — a bare revision with no language dimension at all — can no longer be written through
    // the port. Which is the point: only an older server could have made this row.
    const legacyDeps = { ...deps, store: memoryStore({ seed: { onboardingContent: legacy } }) };

    expect((await onboardingContent(legacyDeps, "en")).welcome.cta).toBe("Onwards");
    expect((await onboardingContent(legacyDeps, "de")).welcome.cta).toBe(ONBOARDING_CONTENT.de!.welcome.cta);
  });

  it("numbers every revision from ONE counter, so two languages never share a version", async () => {
    // `version` is the join key between a funnel row and the words that produced it. Counting per
    // language would let a German save and an English save both land on the same number — two
    // revisions, different words, one row in the funnel.
    const base = DEFAULT_ONBOARDING_CONTENT.version;
    const german = clone(ONBOARDING_CONTENT.de!);
    const english = clone(DEFAULT_ONBOARDING_CONTENT);

    await saveOnboardingContent(deps, german, "de");
    expect((await onboardingContent(deps, "de")).version).toBe(base + 1);
    await saveOnboardingContent(deps, english, "en");
    expect((await onboardingContent(deps, "en")).version).toBe(base + 2);
    await saveOnboardingContent(deps, german, "de");
    expect((await onboardingContent(deps, "de")).version).toBe(base + 3);

    // A reset takes a new number too: it is a change to what is live, not a return to an old row.
    expect((await resetOnboardingContent(deps, "en")).version).toBe(base + 4);
    // And the funnel names the newest revision in ANY language, not English's.
    await saveOnboardingContent(deps, german, "de");
    expect((await onboardingFunnel(deps, 30)).contentVersion).toBe(base + 5);
  });

  it("resets one language and leaves the rest alone", async () => {
    const german = clone(ONBOARDING_CONTENT.de!);
    german.welcome.cta = "Auf geht's";
    await saveOnboardingContent(deps, german, "de");
    const english = clone(DEFAULT_ONBOARDING_CONTENT);
    english.welcome.cta = "Onwards";
    await saveOnboardingContent(deps, english, "en");

    await resetOnboardingContent(deps, "de");
    expect((await onboardingContent(deps, "de")).welcome.cta).toBe(ONBOARDING_CONTENT.de!.welcome.cta);
    expect((await onboardingContent(deps, "en")).welcome.cta).toBe("Onwards");
  });
});

describe("a row an older build left behind", () => {
  // Both store implementations MIGRATE these on write, and until now only the READ was tested —
  // a reviewer wrote onto each shape and found the memory store spreading a JSON string into
  // 3,724 numeric keys while Postgres repaired it, and BOTH stores accepting a German save onto a
  // bare pre-#358 row, versioning it, and then discarding it on every read forever.

  it("takes a German save onto a BARE pre-#358 revision, and serves it back", async () => {
    // `storedContentSet` branches on a top-level `screens`, so hanging the language off the bare
    // revision left the whole row reading as English: the save succeeded, returned a version, and
    // was invisible. On any host that pressed Save before #358 that was every non-English save.
    const legacy = structuredClone(DEFAULT_ONBOARDING_CONTENT);
    legacy.welcome.cta = "Onwards";
    const store = memoryStore({ seed: { onboardingContent: legacy } });
    const deps = { store, config: CONFIG, llm: demoPorts(), push: fakePush(), mail: logMail() };

    const saved = await saveOnboardingContent(deps, contentWith("Los geht's"), "de");
    expect(saved.ok).toBe(true);
    expect((await onboardingContent(deps, "de")).welcome.cta).toBe("Los geht's");
    // ...and the English the bare row carried is still there, because it WAS the English.
    expect((await onboardingContent(deps, "en")).welcome.cta).toBe("Onwards");
  });

  it("takes a save onto a row stored as a JSON STRING, which every deployed host holds", async () => {
    // `${JSON.stringify(doc)}::jsonb` is a no-op cast — bun's driver already encodes a bound value
    // — so the column held text. Spreading that scatters it character by character.
    const legacy = structuredClone(DEFAULT_ONBOARDING_CONTENT);
    legacy.welcome.cta = "Onwards";
    const store = memoryStore({ seed: { onboardingContent: JSON.stringify({ en: legacy }) } });
    const deps = { store, config: CONFIG, llm: demoPorts(), push: fakePush(), mail: logMail() };

    await saveOnboardingContent(deps, contentWith("Los geht's"), "de");
    expect((await onboardingContent(deps, "de")).welcome.cta).toBe("Los geht's");
    expect((await onboardingContent(deps, "en")).welcome.cta).toBe("Onwards");
    expect(Object.keys((await store.getOnboardingContent())!).sort()).toEqual(["de", "en"]);
  });
});

describe("experiments (ieat-app#2669)", () => {
  const variantContent = (version: number, cta = "Variant"): OnboardingContent => {
    const c = structuredClone(DEFAULT_ONBOARDING_CONTENT);
    c.version = version;
    c.welcome.cta = cta;
    return c;
  };
  const experiment = (over: Record<string, unknown> = {}) => ({
    id: crypto.randomUUID(),
    lang: "en" as const,
    status: "draft" as const,
    rules: {},
    variants: [
      { control: true, weight: 0, content: variantContent(41, "Control") },
      { weight: 1, content: variantContent(42) },
    ],
    created_by: userId,
    created_at: new Date().toISOString(),
    started_at: null,
    stopped_at: null,
    revision: 1,
    ...over,
  });
  const signals = { lang: "en" as const, surface: "app" as const, region: "DE", tz: "Europe/Berlin" };
  const startExperiment = async (e = experiment()) => {
    await store.putOnboardingExperiment(e as never);
    await store.startOnboardingExperiment(e.id as string);
    await store.setSwitch("onboarding.experiments", true, userId);
    return e;
  };

  it("serves control and writes nothing while the switch is off", async () => {
    const e = experiment();
    await store.putOnboardingExperiment(e as never);
    await store.startOnboardingExperiment(e.id);
    expect(await assignVariant(deps, userId, signals)).toBeNull();
    expect(await store.onboardingAssignments(e.id)).toEqual([]);
    expect((await onboardingContentFor(deps, userId, signals)).welcome.cta).not.toBe("Variant");
  });

  it("serves control when no experiment runs for the language", async () => {
    await store.setSwitch("onboarding.experiments", true, userId);
    expect(await assignVariant(deps, userId, signals)).toBeNull();
    expect(await assignVariant(deps, userId, { ...signals, lang: "de" })).toBeNull();
  });

  it("enrolls an eligible user once and serves the same variant on every later call", async () => {
    const e = await startExperiment();
    const first = await assignVariant(deps, userId, signals);
    expect(first?.variant.content.version).toBe(42);
    expect((await store.onboardingAssignment(userId, e.id))?.variant_id).toBe(42);

    // Sticky by the stored row, not by recomputing: the signals that enrolled the user can all
    // change and the variant does not move.
    const again = await assignVariant(deps, userId, { ...signals, region: "BR", tz: "Asia/Tokyo" });
    expect(again?.variant.content.version).toBe(42);
    expect((await onboardingContentFor(deps, userId, signals)).welcome.cta).toBe("Variant");
  });

  it("does not enroll a user missing a signal the experiment needs — and writes no row", async () => {
    const e = await startExperiment(experiment({ rules: { countries: ["de"], hours: [22, 6] } }));
    // No region, no tz: control, and NO row, so a later request that has them can still enroll.
    expect(await assignVariant(deps, userId, { ...signals, region: null, tz: null })).toBeNull();
    expect(await store.onboardingAssignment(userId, e.id)).toBeNull();
    // An unknown zone is "not eligible", not an exception.
    expect(await assignVariant(deps, userId, { ...signals, tz: "Mars/Olympus" })).toBeNull();
    expect(await store.onboardingAssignment(userId, e.id)).toBeNull();
  });

  it("enforces the countries, hours and surfaces rules", async () => {
    const e = await startExperiment(experiment({ rules: { countries: ["de"], surfaces: ["app"] } }));
    // The device region maps through countryFromRegion: a region outside the curated list is
    // "other" and matches nothing; a web surface is ruled out outright.
    expect(await assignVariant(deps, userId, { ...signals, region: "JP" })).toBeNull();
    expect(await assignVariant(deps, userId, { ...signals, surface: "web" })).toBeNull();
    expect((await assignVariant(deps, userId, signals))?.variant.content.version).toBe(42);

    // The hour window is the user's LOCAL hour — here [22,6): 23:00 eligible, 09:00 not, and a
    // stored assignment outlives the window passing. On `de`, because one experiment per language.
    const night = await startExperiment(experiment({ lang: "de", rules: { hours: [22, 6] } }));
    const deSignals = { ...signals, lang: "de" as const };
    const other = await store.createUser("de");
    expect(await assignVariant(deps, other, deSignals, new Date("2026-11-09T22:30:00Z"))).not.toBeNull();
    const third = await store.createUser("de");
    expect(await assignVariant(deps, third, deSignals, new Date("2026-11-10T08:00:00Z"))).toBeNull();
    expect(await store.onboardingAssignment(third, night.id)).toBeNull();
  });

  it("serves control in a language the experiment is not for — the assignment stays, unread", async () => {
    const e = await startExperiment();
    await assignVariant(deps, userId, signals);
    expect(await assignVariant(deps, userId, { ...signals, lang: "de" })).toBeNull();
    // The row is kept: back in the experiment's language the same variant returns.
    expect((await assignVariant(deps, userId, signals))?.variant.content.version).toBe(42);
    expect((await store.onboardingAssignment(userId, e.id))?.variant_id).toBe(42);
  });

  it("serves control through usableContent when a variant revision is missing a question", async () => {
    const broken = variantContent(43, "Variant");
    broken.screens = broken.screens.filter((s) => s.id !== "goal");
    await startExperiment(experiment({
      variants: [
        { control: true, weight: 0, content: variantContent(41, "Control") },
        { weight: 1, content: broken },
      ],
    }));
    expect((await onboardingContentFor(deps, userId, signals)).welcome.cta).not.toBe("Variant");
  });

  it("serves control when the experiment read fails, logging a line", async () => {
    // An experiment must never stop onboarding: a store that throws answers control, like
    // `switchOn` answering the default when the switch row cannot be read.
    await startExperiment();
    const failing = {
      ...deps,
      store: {
        ...store,
        runningOnboardingExperiment: async () => { throw new Error("down"); },
        onboardingAssignment: async () => { throw new Error("down"); },
        putOnboardingAssignment: async () => { throw new Error("down"); },
      },
    };
    expect(await assignVariant(failing, userId, signals)).toBeNull();
    expect((await onboardingContentFor(failing, userId, signals)).welcome.cta).not.toBe("Variant");
  });

  it("a visitor nobody can assign is control — /start's pre-account paths send no user", async () => {
    const e = await startExperiment();
    expect(await assignVariant(deps, "anything", signals)).not.toBeNull();
    // A null userId: the front door and the pre-account walk render before an account exists.
    expect((await onboardingContentFor(deps, null, signals)).welcome.cta).not.toBe("Variant");
    expect(await store.onboardingAssignments(e.id)).toHaveLength(1);
  });

  it("admin: create clones control, rules sanitize, start/stop guard", async () => {
    const { createOnboardingExperiment, sanitizeExperimentRules, setOnboardingExperiment,
      startOnboardingExperiment: startExp, stopOnboardingExperiment: stopExp,
      saveOnboardingVariant, addOnboardingVariant, onboardingExperiments } = await import("./onboarding.ts");
    const e = await createOnboardingExperiment(deps, userId, "en");
    expect(e.status).toBe("draft");
    expect(e.variants).toHaveLength(1);
    expect(e.variants[0]!.control).toBe(true);

    // Rules: bad shapes and hours-on-web are refused, never stored.
    expect(sanitizeExperimentRules({ hours: [9, 17], surfaces: ["web"] }).ok).toBe(false);
    expect(sanitizeExperimentRules({ countries: "de" }).ok).toBe(false);
    expect(sanitizeExperimentRules({ countries: ["DE"], surfaces: ["app"], hours: [22, 6] })).toEqual({
      ok: true, rules: { countries: ["de"], surfaces: ["app"], hours: [22, 6] },
    });
    expect((await setOnboardingExperiment(deps, e.id, { rules: { hours: [22, 6] } })).ok).toBe(true);
    // The rules replace wholesale, and the final state is what is checked: hours on web refuses.
    expect((await setOnboardingExperiment(deps, e.id, { rules: { hours: [9, 17], surfaces: ["web"] } })).ok).toBe(false);

    // A clone arm gets its OWN version off the shared counter.
    const added = await addOnboardingVariant(deps, e.id);
    expect(added.ok).toBe(true);
    const updated = (await onboardingExperiments(deps)).find((v) => v.experiment.id === e.id)!;
    expect(updated.arms.map((a) => a.variant.content.version)).toHaveLength(2);
    expect(new Set(updated.arms.map((a) => a.variant.content.version)).size).toBe(2);

    // A variant save validates and takes a fresh version — and the WELCOME answers to the full
    // claims set (PR2): a health claim a question may carry is refused in a stranger's first line.
    const bad = await saveOnboardingVariant(deps, e.id, 1, { version: 1 });
    expect(bad.ok).toBe(false);
    const claimed = structuredClone(DEFAULT_ONBOARDING_CONTENT);
    claimed.welcome.lines = ["Lose weight fast"];
    const refused = await saveOnboardingVariant(deps, e.id, 1, claimed);
    expect(refused.ok).toBe(false);
    if (!refused.ok) expect(refused.errors.join(" ")).toContain("welcome");
    const good = await saveOnboardingVariant(deps, e.id, 1, structuredClone(DEFAULT_ONBOARDING_CONTENT));
    expect(good.ok).toBe(true);

    // Start needs a weighted arm and a draft; stop hands control back. And the switch on — a
    // running card enrolling nobody is refused before it is ever a lie.
    expect((await setOnboardingExperiment(deps, e.id, { weights: [1, 0] })).ok).toBe(true);
    expect((await startExp(deps, e.id)).ok).toBe(false);
    await store.setSwitch("onboarding.experiments", true, userId);
    expect((await startExp(deps, e.id)).ok).toBe(true);
    expect((await saveOnboardingVariant(deps, e.id, 0, structuredClone(DEFAULT_ONBOARDING_CONTENT))).ok).toBe(false);
    expect((await stopExp(deps, e.id)).ok).toBe(true);
    expect((await stopExp(deps, e.id)).ok).toBe(false);
  });

  it("a draft arm missing blocks opens in the editor filled; a running arm comes back exactly as stored", async () => {
    const { onboardingExperiments } = await import("./onboarding.ts");
    // The arm predates ui/beats — what the editor opens must not crash uiCard()/beatsCard() nor
    // fail its save; the fill wears the arm's OWN version, never control's.
    const old = variantContent(43, "Old arm") as unknown as Record<string, unknown>;
    delete old.ui;
    delete old.beats;
    const e = experiment({
      variants: [
        { control: true, weight: 0, content: variantContent(41, "Control") },
        { weight: 1, content: old },
      ],
    });
    await store.putOnboardingExperiment(e as never);
    let view = (await onboardingExperiments(deps)).find((v) => v.experiment.id === e.id)!;
    let arm = view.arms[1]!.variant.content;
    expect(arm.ui).toEqual(DEFAULT_ONBOARDING_CONTENT.ui);
    expect(arm.beats).toEqual(DEFAULT_ONBOARDING_CONTENT.beats);
    expect(arm.welcome.cta).toBe("Old arm");
    expect(arm.version).toBe(43);

    // Running, the view shows what is frozen — a fill would lie about what served, and a swapped
    // version would un-hook the funnel row, which keys on the arm's own content_version.
    await store.startOnboardingExperiment(e.id);
    await store.setSwitch("onboarding.experiments", true, userId);
    const assigned = await assignVariant(deps, userId, signals);
    expect(assigned).not.toBeNull();
    await store.recordOnboardingEvents(userId, [event({ contentVersion: 43 })] as never);
    view = (await onboardingExperiments(deps)).find((v) => v.experiment.id === e.id)!;
    const raw = view.arms[1]!.variant.content as unknown as Record<string, unknown>;
    expect(raw.ui).toBeUndefined();
    expect(raw.beats).toBeUndefined();
    expect(raw.version).toBe(43);
    expect(view.arms[1]!.stats.assigned).toBe(1);
    expect(view.arms[1]!.stats.sessions).toBe(1);
  });

  it("clones a control that predates ui/beats into an arm the editor can open", async () => {
    const { addOnboardingVariant, onboardingExperiments } = await import("./onboarding.ts");
    const oldControl = variantContent(40, "Old control") as unknown as Record<string, unknown>;
    delete oldControl.ui;
    delete oldControl.beats;
    const e = experiment({ variants: [{ control: true, weight: 1, content: oldControl }] });
    await store.putOnboardingExperiment(e as never);
    const added = await addOnboardingVariant(deps, e.id);
    expect(added.ok).toBe(true);
    const view = (await onboardingExperiments(deps)).find((v) => v.experiment.id === e.id)!;
    const clone = view.arms[1]!.variant.content;
    expect(clone.ui).toEqual(DEFAULT_ONBOARDING_CONTENT.ui);
    expect(clone.beats).toEqual(DEFAULT_ONBOARDING_CONTENT.beats);
    expect(clone.welcome.cta).toBe("Old control");
    expect(clone.version).toBeGreaterThanOrEqual(DEFAULT_ONBOARDING_CONTENT.version + 1);
  });

  it("results read by assignment: rate and Wilson interval per arm", async () => {
    const { wilsonInterval, onboardingExperiments } = await import("./onboarding.ts");
    const ci = wilsonInterval(3, 10);
    expect(ci.lo).toBeCloseTo(0.1078, 3);
    expect(ci.hi).toBeCloseTo(0.6032, 3);
    expect(wilsonInterval(0, 0)).toEqual({ lo: 0, hi: 1 });

    const e = await startExperiment();
    const assigned = await assignVariant(deps, userId, signals);
    expect(assigned).not.toBeNull();
    await store.recordOnboardingEvents(userId, [
      event({ contentVersion: 42 }),
      event({ action: "complete", contentVersion: 42 }),
    ] as never);
    const view = (await onboardingExperiments(deps)).find((v) => v.experiment.id === e.id)!;
    const arm = view.arms.find((a) => a.variant.content.version === 42)!;
    expect(arm.stats.assigned).toBe(1);
    expect(arm.stats.sessions).toBe(1);
    expect(arm.stats.completed).toBe(1);
    expect(arm.stats.rate).toBe(1);
  });

  it("a stopped experiment hands everybody control — the assignment rows are kept", async () => {
    const e = await startExperiment();
    await assignVariant(deps, userId, signals);
    await store.stopOnboardingExperiment(e.id);
    expect(await assignVariant(deps, userId, signals)).toBeNull();
    expect((await store.onboardingAssignment(userId, e.id))?.variant_id).toBe(42);
  });

  describe("an arm's order (ieat-app#2788)", () => {
    // diet before medical is the default; medical first is a valid arm that drops the prelim beat.
    const ARM_ORDER = [
      "welcome", "goal", "sex", "age", "height", "weight", "activity", "baseline", "target", "pace",
      "counted", "barrier", "situation", "medical", "diet", "summary", "signup",
    ];
    const ordered = (order: string[] | null = ARM_ORDER) => experiment({
      variants: [
        { control: true, weight: 0, content: variantContent(41, "Control") },
        { weight: 1, content: variantContent(42), ...(order ? { order } : {}) },
      ],
    });
    const capable = { ...signals, orderVersion: 1 };

    it("saves a valid order on a draft arm, and clears it with null", async () => {
      const { saveOnboardingVariantOrder } = await import("./onboarding.ts");
      const e = ordered(null);
      await store.putOnboardingExperiment(e as never);
      expect(await saveOnboardingVariantOrder(deps, e.id, 1, ARM_ORDER)).toEqual({ ok: true });
      const arm = async () => (await store.listOnboardingExperiments()).find((x) => x.id === e.id)!.variants[1]!;
      expect((await arm()).order).toEqual(ARM_ORDER as never);
      expect(await saveOnboardingVariantOrder(deps, e.id, 1, null)).toEqual({ ok: true });
      expect((await arm()).order).toBeUndefined();
    });

    it("refuses an invalid order with the validator's own refusals, and stores nothing", async () => {
      const { saveOnboardingVariantOrder } = await import("./onboarding.ts");
      const e = ordered(null);
      await store.putOnboardingExperiment(e as never);
      const swapped = ARM_ORDER.map((p) => (p === "target" ? "pace" : p === "pace" ? "target" : p));
      const res = await saveOnboardingVariantOrder(deps, e.id, 1, swapped);
      expect(res.ok).toBe(false);
      if (res.ok) return;
      expect(res.refusals).toContainEqual({ place: "pace", rule: "must-follow", after: "target" });
      expect(res.errors).toContain("pace must come after target");
      expect((await saveOnboardingVariantOrder(deps, e.id, 1, "welcome")).ok).toBe(false);
      expect((await store.listOnboardingExperiments()).find((x) => x.id === e.id)!.variants[1]!.order).toBeUndefined();
    });

    it("refuses an order on the control arm", async () => {
      const { saveOnboardingVariantOrder } = await import("./onboarding.ts");
      const e = ordered(null);
      await store.putOnboardingExperiment(e as never);
      expect((await saveOnboardingVariantOrder(deps, e.id, 0, ARM_ORDER)).ok).toBe(false);
    });

    it("refuses to start an experiment whose stored order no longer validates", async () => {
      const { startOnboardingExperiment } = await import("./onboarding.ts");
      const e = ordered(["welcome", "pace", "summary", "signup"]);
      await store.putOnboardingExperiment(e as never);
      await store.setSwitch("onboarding.experiments", true, userId);
      const res = await startOnboardingExperiment(deps, e.id);
      expect(res.ok).toBe(false);
      expect((await store.listOnboardingExperiments()).find((x) => x.id === e.id)!.status).toBe("draft");
    });

    it("enrolls only a client that declared the order capability", async () => {
      const e = await startExperiment(ordered());
      expect(await assignVariant(deps, userId, signals)).toBeNull();
      expect(await assignVariant(deps, userId, { ...signals, orderVersion: 0 })).toBeNull();
      expect(await store.onboardingAssignments(e.id)).toEqual([]);
      expect((await assignVariant(deps, userId, capable))?.variant.content.version).toBe(42);
    });

    it("does not gate an experiment none of whose arms carries an order", async () => {
      await startExperiment(ordered(null));
      expect((await assignVariant(deps, userId, signals))?.variant.content.version).toBe(42);
    });

    it("serves the arm's order to a capable client, and control to an older one already assigned", async () => {
      const { onboardingServedFor } = await import("./onboarding.ts");
      await startExperiment(ordered());
      const served = await onboardingServedFor(deps, userId, capable);
      expect(served.content.welcome.cta).toBe("Variant");
      expect(served.order).toEqual(ARM_ORDER as never);
      // Sticky on the server, but this client cannot walk the order: the live copy, no order — which
      // its events then count as fell back, beside the arm's rate.
      const older = await onboardingServedFor(deps, userId, signals);
      expect(older.content.welcome.cta).not.toBe("Variant");
      expect(older.order).toBeUndefined();
      expect((await onboardingContentFor(deps, userId, capable)).welcome.cta).toBe("Variant");
    });

    it("reads each arm's place funnel in that arm's order, without a beat it removed", async () => {
      const { onboardingExperiments } = await import("./onboarding.ts");
      const e = await startExperiment(ordered());
      await assignVariant(deps, userId, capable);
      await recordOnboardingEvents(deps, userId, [
        event({ place: "medical", contentVersion: 42 }),
        event({ place: "diet", contentVersion: 42, action: "answer", ms: 900 }),
      ]);
      const view = (await onboardingExperiments(deps)).find((v) => v.experiment.id === e.id)!;
      const arm = view.arms[1]!;
      const places = arm.places.map((r) => r.place);
      expect(places).not.toContain("prelim");
      expect(places.indexOf("medical")).toBeLessThan(places.indexOf("diet"));
      expect(places.slice(-4)).toEqual(["country", "referral", "health", "streak"]);
      expect(arm.places.find((r) => r.place === "medical")?.views).toBe(1);
      expect(arm.places.find((r) => r.place === "diet")?.answers).toBe(1);
      // Control reads in the default order.
      expect(view.arms[0]!.places.map((r) => r.place)).toEqual([...ONBOARDING_PLACES]);
    });
  });
});

/** A valid revision with one word changed, for the legacy-row tests above. */
function contentWith(cta: string): OnboardingContent {
  const c = structuredClone(DEFAULT_ONBOARDING_CONTENT);
  c.welcome.cta = cta;
  return c;
}
