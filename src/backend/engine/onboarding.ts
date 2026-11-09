// Onboarding content and the funnel behind it.
//
// Two jobs, and they belong together because they are two halves of one loop: the admin edits the
// words, the app reports what happened to them, and the funnel says whether the edit helped. A
// version number rides on every event so those two facts can actually be joined.
//
// What is NOT here is the sequence — that lives in `@eait/shared/onboarding.ts`, because the app
// derives the same "what comes next" without asking. This module owns storage and aggregation only.

import {
  DEFAULT_ONBOARDING_CONTENT, MAX_ONBOARDING_EVENTS_PER_BATCH, ONBOARDING_ACTIONS,
  ONBOARDING_PLACES, countryFromRegion, isReportableField, isTimezone, localDate, localTime,
  onboardingContentFor as compiledContentFor, storedContentSet, usableContent, usableContentFor,
  validateOnboardingContent,
  type ContentValidation, type FunnelRow, type Lang, type OnboardingContent, type OnboardingEvent,
  type OnboardingFunnel, type OnboardingPlace,
} from "@eait/shared";
import type { EngineDeps } from "./deps.ts";
import { switchOn } from "./switches.ts";
import type { AdminMetrics, OnboardingExperiment, OnboardingVariant } from "../store.ts";

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
  days: number,
): Promise<AdminMetrics> {
  return deps.store.adminMetrics({
    days,
    today: localDate(deps.config.timezone),
    timezone: deps.config.timezone,
  });
}

/** The funnel, in the order the screens are actually shown. */
export async function onboardingFunnel(deps: EngineDeps, days: number): Promise<OnboardingFunnel> {
  const agg = await deps.store.onboardingFunnel(days);
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
    days,
    contentVersion,
    rows,
  };
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
