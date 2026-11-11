// Onboarding content and the funnel behind it.
//
// Two jobs, and they belong together because they are two halves of one loop: the admin edits the
// words, the app reports what happened to them, and the funnel says whether the edit helped. A
// version number rides on every event so those two facts can actually be joined.
//
// What is NOT here is the sequence — that lives in `@eait/shared/onboarding.ts`, because the app
// derives the same "what comes next" without asking. This module owns storage and aggregation only.

import {
  COUNTRY_CODES, DEFAULT_ONBOARDING_CONTENT, MAX_ONBOARDING_EVENTS_PER_BATCH, ONBOARDING_ACTIONS,
  ONBOARDING_PLACES, countryFromRegion, isReportableField, isTimezone, localDate, localTime,
  onboardingContentFor as compiledContentFor, storedContentSet, usableContent, usableContentFor,
  validateOnboardingContent,
  type AdminWindowEcho, type ContentValidation, type CountryCode, type FunnelRow, type Lang, type OnboardingContent,
  type OnboardingEvent, type OnboardingFunnel, type OnboardingPlace,
} from "@eait/shared";
import type { EngineDeps } from "./deps.ts";
import { switchOn } from "./switches.ts";
import type { AdminMetrics, AdminRange, OnboardingExperiment, OnboardingVariant } from "../store.ts";
import { adminRangeOf, adminWindowEcho } from "./admin.ts";

/** Every place an event may name — the questions, and the three places that are not questions. */
const PLACES: readonly string[] = ONBOARDING_PLACES;

/**
 * The copy this server serves, in ONE language.
 *
 * Falls back to that language's compiled-in copy when nothing has been saved for it, so a fresh
 * database serves a complete flow rather than an empty one, and a host whose admin has only ever
 * written German serves German to Germans and the shipped Italian to Italians. The app has the same
 * defaults compiled in — this is what makes the fetch an enhancement rather than a dependency.
 *
 * NOT ENGLISH ON A MISS. Falling back across languages would put English screens in the middle of
 * an Italian onboarding, which is the failure `LANGS_READY` exists to keep out of the picker.
 *
 * THROUGH `usableContentFor`, WHICH WRAPS THE SAME GUARD THE APP RUNS, and it earns its place here
 * for a case the app's copy cannot cover: a row saved by an OLDER BUILD of this server. The app
 * would discard such a revision on arrival and fall back — but the admin editor would load it, an
 * admin would edit two words in it, and the save would be refused for a question that has been
 * missing since before they opened the page. Serving the default instead means the editor opens on
 * something that can be saved.
 */
export async function onboardingContent(deps: EngineDeps, lang: Lang): Promise<OnboardingContent> {
  return usableContentFor(lang, await deps.store.getOnboardingContent());
}

// ── Experiments (ieat-app#2669) ───────────────────────────────────────────────────────────────
//
// A variant is a whole OnboardingContent revision for one language, stored on an experiment row
// and picked server-side — the `content_version` every funnel event already carries IS the
// variant id, so nothing in the event table had to change.

/** What a caller can say about the person asking for onboarding copy. */
export interface OnboardingSignals {
  lang: Lang;
  /** Where the words will render — an experiment may rule a surface out. */
  surface: "app" | "web";
  /** The device locale region (or the browser's Accept-Language one): an ISO alpha-2 code. */
  region?: string | null;
  /** The device's IANA zone, for a local-hours rule. Unknown or absent means "not eligible". */
  tz?: string | null;
}

/**
 * FNV-1a over `userId:experimentId` — the pick inside the weights.
 *
 * Deterministic by spec, so a test can reproduce an assignment without reaching into the store,
 * and so two concurrent first requests compute the same roll for the same person. It seeds a pick,
 * it is not the assignment: the stored row is.
 */
function hashPick(userId: string, experimentId: string): number {
  let h = 0x811c9dc5;
  const s = `${userId}:${experimentId}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Whether the signals pass every rule the experiment set. A missing needed signal is a no. */
function eligible(rules: OnboardingExperiment["rules"], signals: OnboardingSignals, at: Date): boolean {
  const surfaces = rules.surfaces ?? [];
  if (surfaces.length > 0 && !surfaces.includes(signals.surface)) return false;

  const countries = rules.countries ?? [];
  if (countries.length > 0) {
    if (typeof signals.region !== "string" || signals.region.trim() === "") return false;
    if (!countries.includes(countryFromRegion(signals.region))) return false;
  }

  if (rules.hours) {
    // The zone is checked against the runtime's own list: a name Intl cannot date is "not
    // eligible", not an exception.
    if (typeof signals.tz !== "string" || !isTimezone(signals.tz)) return false;
    const hour = Number(localTime(signals.tz, at).slice(0, 2));
    const [from, to] = rules.hours;
    if (!(from <= to ? hour >= from && hour < to : hour >= from || hour < to)) return false;
  }

  return true;
}

/** The arm `seed` rolls into, by integer weight. Null when no arm carries weight. */
function pickVariant(variants: readonly OnboardingVariant[], seed: number): OnboardingVariant | null {
  const total = variants.reduce((s, v) => s + Math.max(0, v.weight), 0);
  if (total <= 0) return null;
  let roll = seed % total;
  for (const v of variants) {
    roll -= Math.max(0, v.weight);
    if (roll < 0) return v;
  }
  return variants[variants.length - 1] ?? null;
}

/**
 * The variant this user serves, or null for control.
 *
 * STICKY BY THE STORED ROW, assigned on first eligibility and never recomputed: the targeting
 * inputs drift (local hour, region, a language switch), so a user who opened onboarding at 23:00
 * keeps their variant at 09:00. `putOnboardingAssignment` returns the row that WON — under a
 * concurrent first request the answer is what is stored, not what was picked here.
 *
 * Not eligible means no row: a later request that HAS the missing signal can still enroll them.
 * A user whose language changed since assignment gets control in the new language — the row keys
 * on the experiment, which is per language.
 *
 * Never throws for a store problem: an experiment must never stop onboarding, so a failed read
 * logs one line and serves control — `switchOn`'s rule, applied to the tables behind it too.
 */
export async function assignVariant(
  deps: EngineDeps,
  userId: string,
  signals: OnboardingSignals,
  at: Date = new Date(),
): Promise<{ experiment: OnboardingExperiment; variant: OnboardingVariant } | null> {
  // OFF means invisible: no reads, no writes, every request control.
  if (!(await switchOn(deps, "onboarding.experiments"))) return null;
  try {
    const experiment = await deps.store.runningOnboardingExperiment(signals.lang);
    if (!experiment) return null;

    const stored = await deps.store.onboardingAssignment(userId, experiment.id);
    if (stored) {
      const variant = experiment.variants.find((v) => v.content.version === stored.variant_id);
      return variant ? { experiment, variant } : null;
    }

    if (!eligible(experiment.rules, signals, at)) return null;
    const picked = pickVariant(experiment.variants, hashPick(userId, experiment.id));
    if (!picked) return null;

    const row = await deps.store.putOnboardingAssignment(userId, experiment.id, picked.content.version);
    const variant = experiment.variants.find((v) => v.content.version === row.variant_id);
    return variant ? { experiment, variant } : null;
  } catch {
    console.error(`[eait] onboarding experiment read failed for ${signals.lang}`);
    return null;
  }
}

/**
 * The copy this server serves — the assigned variant when one applies, control otherwise.
 *
 * `onboardingContent` with the experiment layer on top; the callers are `GET /v1/onboarding`,
 * `web/start.ts` and `chat.ts` (ieat-app#2669). A variant that fails the shape check the app runs
 * falls back BLOCK BY BLOCK to control, through the same `usableContent` — an experiment that was
 * not saved for every field cannot produce a flow that skips a question.
 *
 * `userId` may be null: `/start`'s front door and pre-account question walk render before an
 * account exists, and a visitor nobody can assign is control by definition.
 */
export async function onboardingContentFor(
  deps: EngineDeps,
  userId: string | null,
  signals: OnboardingSignals,
): Promise<OnboardingContent> {
  const control = usableContentFor(signals.lang, await deps.store.getOnboardingContent());
  if (userId === null) return control;
  const assigned = await assignVariant(deps, userId, signals);
  if (!assigned) return control;
  return usableContent(assigned.variant.content, control);
}

/**
 * Save admin-edited copy for ONE language, leaving the other seven exactly as they were.
 *
 * THE MERGE IS THE STORE'S. This used to read the whole set, spread its own language over it and
 * write the lot back — safe while nobody else is saving, and a lost update the moment two admins
 * save two languages at once. `putOnboardingContent` does it with `jsonb_set` on the locked row.
 *
 * The version is assigned by the STORE, not accepted from the admin and no longer computed here:
 * it is the join key between a funnel row and the words that produced it, and an admin who saves
 * twice with the same number silently merges two experiments into one meaningless average. Two
 * concurrent saves computing it from the same read did exactly that.
 *
 * ONE COUNTER ACROSS ALL EIGHT LANGUAGES. Counting per language would let a German save and an
 * English save both land on 7 — two revisions, different words, one number, which is the same
 * meaningless average wearing a translation. The compiled-in revisions share a number because they
 * ARE one editorial revision; every save after that takes the next number nobody has used, in
 * whichever language it was made. What is passed from here is only the FLOOR, which is a compiled-in
 * constant rather than a read.
 */
export async function saveOnboardingContent(
  deps: EngineDeps,
  input: unknown,
  lang: Lang,
): Promise<ContentValidation> {
  // The validator wants a version, so it gets the FLOOR — the compiled-in revision plus one, which
  // is the lowest number a save may land on. The store decides the real one against the row it is
  // writing, under its lock, and hands it back; that number is what goes to the admin, because a
  // concurrent save in another language may legitimately have taken the one asked for.
  const floor = compiledContentFor(lang).version + 1;
  const withVersion =
    typeof input === "object" && input !== null
      ? { ...(input as Record<string, unknown>), version: floor }
      : input;

  const result = validateOnboardingContent(withVersion);
  if (!result.ok) return result;
  const version = await deps.store.putOnboardingContent(lang, result.content, floor);
  return { ...result, content: { ...result.content, version } };
}

/** Restore the shipped copy for one language. The undo button for an edit that went wrong. */
export async function resetOnboardingContent(deps: EngineDeps, lang: Lang): Promise<OnboardingContent> {
  const floor = compiledContentFor(lang).version + 1;
  const restored = { ...compiledContentFor(lang), version: floor };
  return { ...restored, version: await deps.store.putOnboardingContent(lang, restored, floor) };
}


/**
 * Accept a batch of funnel events.
 *
 * SANITISED, NOT TRUSTED. The app is the only intended caller, but the route is authenticated with
 * a user's own token, so anything here reaches the table if it is let through:
 *
 *   - an unknown `place` or `action` becomes a row nobody's query counts, and a funnel with an
 *     unbounded vocabulary cannot be indexed or read;
 *   - `value` is dropped for any field not on the reportable list, which is the mechanism that
 *     keeps body weight and free text out of analytics even if a client sends them. The rule is
 *     enforced on the WRITE — a client-side promise about what it sends is not a control;
 *   - strings are truncated, because an event id is a primary key and a megabyte of it is a
 *     denial-of-service with extra steps.
 *
 * Returns how many rows were new. A duplicate is not an error: the app retries batches.
 */
export async function recordOnboardingEvents(
  deps: EngineDeps,
  userId: string,
  events: unknown,
): Promise<number> {
  if (!Array.isArray(events)) return 0;

  const clean: OnboardingEvent[] = [];
  for (const raw of events.slice(0, MAX_ONBOARDING_EVENTS_PER_BATCH)) {
    if (typeof raw !== "object" || raw === null) continue;
    const e = raw as Record<string, unknown>;

    const id = str(e.id, 100);
    const sessionId = str(e.sessionId, 100);
    const place = str(e.place, 40);
    const action = str(e.action, 20);
    if (!id || !sessionId) continue;
    if (!PLACES.includes(place)) continue;
    if (!(ONBOARDING_ACTIONS as readonly string[]).includes(action)) continue;

    const field = str(e.field, 40);
    const contentVersion = Number.isInteger(e.contentVersion) ? (e.contentVersion as number) : 0;
    const ms = Number.isFinite(e.ms) ? Math.max(0, Math.round(e.ms as number)) : undefined;
    // The privacy rule, enforced server-side. A value for a field that is not enumerated is
    // discarded rather than the event being rejected — losing one column beats losing the funnel.
    const value = field && isReportableField(field) ? str(e.value, 120) : "";

    clean.push({
      id,
      sessionId,
      place: place as OnboardingPlace,
      action: action as OnboardingEvent["action"],
      contentVersion,
      at: isoOrNow(e.at),
      ...(ms !== undefined ? { ms } : {}),
      ...(field ? { field } : {}),
      ...(value ? { value } : {}),
    });
  }

  if (clean.length === 0) return 0;
  return deps.store.recordOnboardingEvents(userId, clean);
}

/**
 * The numbers past the funnel (#377).
 *
 * ONE PAIR THAT MATTERS, not a wall. The funnel answers how far into onboarding people get and
 * nothing else; these answer the two questions an operator acts on — **what is being spent** (the
 * bill, per day beside the count) and **whether anybody came back**.
 *
 * SPEND IS WHAT THE PROVIDER REPORTED (#484): `costUsd` is a floor whenever `unpriced` is not
 * zero, and nothing here prices a call itself.
 */
export async function adminMetrics(
  deps: EngineDeps,
  window: number | { days?: number; from?: Date | null; to?: Date | null },
): Promise<AdminMetrics & { range: AdminWindowEcho }> {
  const ask = typeof window === "number" ? { days: window } : window;
  return {
    ...await deps.store.adminMetrics({
      ...ask,
      today: localDate(deps.config.timezone),
      timezone: deps.config.timezone,
    }),
    range: adminWindowEcho(ask),
  };
}

/** The funnel, in the order the screens are actually shown. */
export async function onboardingFunnel(deps: EngineDeps, range: AdminRange & { days?: number } | number): Promise<OnboardingFunnel> {
  const ask = adminRangeOf(range, 30, 365);
  const agg = await deps.store.onboardingFunnel(ask);
  // THE NEWEST REVISION IN ANY LANGUAGE, because the counter is one counter (`store.putOnboardingContent`) and
  // this row names which words the numbers below were collected against. Reading English's alone
  // would report a stale number on a host whose last edit was German.
  const set = storedContentSet(await deps.store.getOnboardingContent());
  const contentVersion = Math.max(
    DEFAULT_ONBOARDING_CONTENT.version,
    ...Object.values(set).map((c) => c?.version).filter((v): v is number => typeof v === "number"),
  );
  // The order a person meets them in, which is what makes a drop between two rows readable as a
  // drop. It is fixed in code now: the chat asks in an order its own replies depend on, so there is
  // no admin ordering left to follow.
  const order = ONBOARDING_PLACES as readonly OnboardingPlace[];
  const byPlace = new Map(agg.rows.map((r) => [r.place, r]));

  const rows: FunnelRow[] = order.map((place) => {
    const r = byPlace.get(place);
    return {
      place,
      views: r?.views ?? 0,
      answers: r?.answers ?? 0,
      backs: r?.backs ?? 0,
      rejects: r?.rejects ?? 0,
      medianMs: r?.medianMs ?? null,
    };
  });

  return {
    sessions: agg.sessions,
    completed: agg.completed,
    range: adminWindowEcho(ask),
    contentVersion,
    rows,
  };
}


// ── The admin's experiments (ieat-app#2669, PR 3) ─────────────────────────────────────────────

/**
 * The 95% Wilson score interval around a completion rate.
 *
 * A funnel's honest error bars: the normal approximation lies badly near 0 and 1, and an
 * experiment that "wins" 3/3 and loses 900/1000 means nothing without them.
 */
export function wilsonInterval(completed: number, sessions: number): { lo: number; hi: number } {
  if (sessions === 0) return { lo: 0, hi: 1 };
  const z = 1.96;
  const p = completed / sessions;
  const zz = z * z;
  const denom = 1 + zz / sessions;
  const centre = p + zz / (2 * sessions);
  const span = z * Math.sqrt((p * (1 - p) + zz / (4 * sessions)) / sessions);
  return { lo: Math.max(0, (centre - span) / denom), hi: Math.min(1, (centre + span) / denom) };
}

export interface OnboardingExperimentView {
  experiment: OnboardingExperiment;
  /** One row per arm, in the experiment's own order. `stats` is null until results exist. */
  arms: {
    variant: OnboardingVariant;
    stats: { assigned: number; sessions: number; completed: number; completed_users: number;
             fell_back: number; rate: number | null; ci: { lo: number; hi: number } | null };
  }[];
}

/** Every experiment with its per-variant funnel — the admin's list. */
export async function onboardingExperiments(
  deps: EngineDeps, range: AdminRange & { days?: number } | number = { from: null, to: null },
): Promise<OnboardingExperimentView[]> {
  const ask = adminRangeOf(range, 30);
  const list = await deps.store.listOnboardingExperiments();
  // The fill exists for DRAFTS, whose arms the editor opens: a draft written before a content
  // block existed would throw in `uiCard()`/`beatsCard()` and fail its save, so it is read
  // through the same block-by-block fill a phone gets — with the arm's OWN version kept, because
  // the funnel row keys on it. A running arm comes back exactly as stored: what it served is the
  // truth the admin is looking at.
  const stored = list.some((e) => e.status === "draft") ? await deps.store.getOnboardingContent() : null;
  const out: OnboardingExperimentView[] = [];
  for (const experiment of list) {
    const control = experiment.status === "draft" ? usableContentFor(experiment.lang, stored) : null;
    const funnel = await deps.store.onboardingExperimentFunnel(experiment.id, ask);
    const arms = experiment.variants.map((variant) => {
      if (control !== null) {
        const filled = usableContent(variant.content, control);
        variant = { ...variant, content: { ...filled, version: variant.content?.version ?? filled.version } };
      }
      const row = funnel.find((r) => r.variant_id === variant.content.version);
      // INTENTION TO TREAT: the rate is per ASSIGNED user — completed_users / assigned — not per
      // session, or a restart would inflate the denominator.
      const stats = row === undefined || row.assigned === 0
        ? {
            assigned: row?.assigned ?? 0, sessions: row?.sessions ?? 0,
            completed: row?.completed ?? 0, completed_users: row?.completed_users ?? 0,
            fell_back: row?.fell_back ?? 0,
            rate: null, ci: null,
          }
        : {
            assigned: row.assigned, sessions: row.sessions, completed: row.completed,
            completed_users: row.completed_users, fell_back: row.fell_back,
            rate: row.completed_users / row.assigned,
            ci: wilsonInterval(row.completed_users, row.assigned),
          };
      return { variant, stats };
    });
    out.push({ experiment, arms });
  }
  return out;
}

/**
 * A new draft for a language: the control arm is a clone of the copy that serves now, at weight 1 —
 * the editor's "Clone current copy" button (ieat-app#2669). The draft holds no variant until the
 * admin adds one; control alone is a save nobody has to make to have something to compare.
 */
export async function createOnboardingExperiment(
  deps: EngineDeps, adminId: string, lang: Lang,
): Promise<OnboardingExperiment> {
  const control = await onboardingContent(deps, lang);
  const experiment: OnboardingExperiment = {
    id: crypto.randomUUID(),
    lang,
    status: "draft",
    rules: {},
    variants: [{ control: true, weight: 1, content: control }],
    created_by: adminId,
    created_at: new Date().toISOString(),
    started_at: null,
    stopped_at: null,
    revision: 1,
  };
  await deps.store.putOnboardingExperiment(experiment);
  return experiment;
}

/**
 * Sanitize the rules an admin sent. Answers {ok, rules} or {ok:false, errors} — never stores a
 * shape the engine would not read. An `hours` window is app-only, enforced HERE as well as in the
 * editor (ieat-app#2669): the web's first render has no `tz` to check one against.
 */
export function sanitizeExperimentRules(raw: unknown):
  { ok: true; rules: OnboardingExperiment["rules"] } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const out: OnboardingExperiment["rules"] = {};
  const body = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? raw as Record<string, unknown> : null;
  if (body === null) return { ok: false, errors: ["rules must be an object"] };

  // REFUSE, never filter: an admin typo silently dropped is a rule the experiment quietly
  // stops enforcing — "countries: ['xx']" saved as "everyone" is worse than a refused save.
  for (const key of Object.keys(body)) {
    if (!["countries", "hours", "surfaces"].includes(key)) errors.push(`unknown rule: ${key}`);
  }

  if (body.countries !== undefined) {
    if (!Array.isArray(body.countries) || body.countries.some((c) => typeof c !== "string")) {
      errors.push("countries must be an array of codes");
    } else {
      const codes = body.countries.map((c) => String(c).trim().toLowerCase());
      // Only the codes the country question itself knows — eligible() maps the region through
      // countryFromRegion, so a code outside COUNTRY_CODES could never match anyone.
      const bad = codes.filter((c) => !(COUNTRY_CODES as readonly string[]).includes(c) || c === "other");
      if (bad.length > 0) errors.push(`countries has codes the app does not know: ${bad.join(", ")}`);
      else if (codes.length > 0) out.countries = [...new Set(codes)] as CountryCode[];
    }
  }

  if (body.hours !== undefined && body.hours !== null) {
    const h = body.hours;
    const ok = Array.isArray(h) && h.length === 2
      && h.every((n) => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 23);
    if (!ok) errors.push("hours must be [from, to) with whole hours 0–23");
    else if (h[0] === h[1]) errors.push("hours [h, h) matches nobody");
    else out.hours = [h[0] as number, h[1] as number];
  }

  if (body.surfaces !== undefined) {
    if (!Array.isArray(body.surfaces)
        || body.surfaces.some((s) => s !== "app" && s !== "web")) {
      errors.push("surfaces may only name 'app' and 'web'");
    } else if (body.surfaces.length > 0) {
      out.surfaces = [...new Set(body.surfaces)] as ("app" | "web")[];
    }
  }

  if (out.hours && out.surfaces?.includes("web")) {
    errors.push("an hours rule is app-only: the web's first render has no timezone to check");
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, rules: out };
}

/**
 * Update a draft's rules and weights — the one put the editor's targeting form maps to. Read,
 * shape, write: the store's own draft guard is what freezes a running row, so this answers false
 * for anything that is not a draft.
 */
export async function setOnboardingExperiment(
  deps: EngineDeps, id: string,
  input: { rules?: unknown; weights?: unknown },
): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const experiment = (await deps.store.listOnboardingExperiments()).find((e) => e.id === id);
  if (!experiment) return { ok: false, errors: ["experiment not found"] };

  if (input.rules !== undefined) {
    const rules = sanitizeExperimentRules(input.rules);
    if (!rules.ok) return rules;
    experiment.rules = rules.rules;
  }

  if (input.weights !== undefined) {
    if (!Array.isArray(input.weights) || input.weights.length !== experiment.variants.length
        || input.weights.some((w) => !Number.isInteger(w) || (w as number) < 0)) {
      return { ok: false, errors: ["weights must be a non-negative integer per variant"] };
    }
    experiment.variants = experiment.variants.map((v, i) => ({ ...v, weight: (input.weights as number[])[i]! }));
  }

  // An hours window is app-only, so a surfaces edit that re-admits the web refuses here, not in
  // the editor alone.
  if (experiment.rules.hours && experiment.rules.surfaces?.includes("web")) {
    return { ok: false, errors: ["an hours rule is app-only: the web's first render has no timezone to check"] };
  }

  const wrote = await deps.store.putOnboardingExperiment(experiment, experiment.revision);
  return wrote ? { ok: true } : { ok: false, errors: ["the experiment changed under you — reload the page"] };
}

/**
 * Write a variant's copy: the same validator a normal save goes through, a version off the shared
 * counter — never a number a live revision already carries — and a draft-only write, because a
 * running variant is frozen (ieat-app#2669).
 */
export async function saveOnboardingVariant(
  deps: EngineDeps, id: string, index: number, input: unknown,
): Promise<{ ok: true; version: number } | { ok: false; errors: string[] }> {
  const experiment = (await deps.store.listOnboardingExperiments()).find((e) => e.id === id);
  if (!experiment) return { ok: false, errors: ["experiment not found"] };
  if (!Number.isInteger(index) || index < 0 || index >= experiment.variants.length) {
    return { ok: false, errors: ["no such variant"] };
  }
  // The control IS the live copy's clone — an edited control is a variant wearing the name, and
  // the funnel would compare "the copy that serves" to something else.
  if (experiment.variants[index]!.control) {
    return { ok: false, errors: ["the control arm is the live copy's clone — it is not editable"] };
  }

  // The validator wants a version, so it gets the FLOOR — the compiled-in revision plus one, the
  // same floor a normal save validates against. The counter hands back the real one.
  const floor = compiledContentFor(experiment.lang).version + 1;
  const withVersion =
    typeof input === "object" && input !== null
      ? { ...(input as Record<string, unknown>), version: floor }
      : input;
  const result = validateOnboardingContent(withVersion);
  if (!result.ok) return { ok: false, errors: result.errors };

  const version = await deps.store.bumpOnboardingContentVersion(floor);
  experiment.variants = experiment.variants.map((v, i) =>
    i === index ? { ...v, content: { ...result.content, version } } : v);
  const wrote = await deps.store.putOnboardingExperiment(experiment, experiment.revision);
  return wrote
    ? { ok: true, version }
    : { ok: false, errors: ["the experiment changed under you — reload the page"] };
}

/** Clone the control arm — the editor's "add a variant" is a copy of the copy that serves. */
export async function addOnboardingVariant(
  deps: EngineDeps, id: string,
): Promise<{ ok: true; index: number } | { ok: false; errors: string[] }> {
  const experiment = (await deps.store.listOnboardingExperiments()).find((e) => e.id === id);
  if (!experiment) return { ok: false, errors: ["experiment not found"] };
  const control = experiment.variants.find((v) => v.control) ?? experiment.variants[0];
  if (!control) return { ok: false, errors: ["the experiment has no control to clone"] };
  // A clone gets its own version: two arms naming one revision would be indistinguishable in the
  // funnel, where content_version IS the variant's name. The clone is usable-first: a control
  // written before a content block existed produces an arm the editor cannot open and the
  // validator cannot save (ieat-app#2757).
  const floor = compiledContentFor(experiment.lang).version + 1;
  const version = await deps.store.bumpOnboardingContentVersion(floor);
  const content = usableContent(structuredClone(control.content), compiledContentFor(experiment.lang));
  experiment.variants = [
    ...experiment.variants,
    { weight: control.weight, content: { ...content, version } },
  ];
  const wrote = await deps.store.putOnboardingExperiment(experiment, experiment.revision);
  return wrote
    ? { ok: true, index: experiment.variants.length - 1 }
    : { ok: false, errors: ["the experiment changed under you — reload the page"] };
}

/**
 * draft → running, through the store's guarded statement. An experiment with no weighted arm is
 * refused HERE — a running experiment that assigns nothing is a bug the funnel cannot show.
 */
export async function startOnboardingExperiment(
  deps: EngineDeps, id: string,
): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const experiment = (await deps.store.listOnboardingExperiments()).find((e) => e.id === id);
  if (!experiment) return { ok: false, errors: ["experiment not found"] };
  if (experiment.status !== "draft") return { ok: false, errors: ["only a draft can start"] };
  if (experiment.variants.every((v) => v.weight <= 0)) {
    return { ok: false, errors: ["no variant carries weight"] };
  }
  // A running card that enrolls nobody is worse than a refused start: the switch is the gate the
  // enrolment reads, so start only once it is on.
  if (!(await switchOn(deps, "onboarding.experiments"))) {
    return { ok: false, errors: ["the onboarding.experiments switch is off — turn it on first"] };
  }
  const started = await deps.store.startOnboardingExperiment(id);
  return started
    ? { ok: true }
    : { ok: false, errors: ["another experiment is already running for this language"] };
}

/** running → stopped, the per-experiment kill switch. Stops serving variants on the next fetch. */
export async function stopOnboardingExperiment(
  deps: EngineDeps, id: string,
): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const stopped = await deps.store.stopOnboardingExperiment(id);
  return stopped ? { ok: true } : { ok: false, errors: ["the experiment is not running"] };
}

/** A bounded string, or "" for anything that is not one. */
function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

/** A client clock we can store, or ours. A phone with a wrong date must not break the insert. */
function isoOrNow(v: unknown): string {
  if (typeof v === "string") {
    const t = Date.parse(v);
    if (Number.isFinite(t)) return new Date(t).toISOString();
  }
  return new Date().toISOString();
}
