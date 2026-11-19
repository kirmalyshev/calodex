// Onboarding screen templates (ieat-app#3167): a beat assembled from blocks the app already ships,
// stored on the server, and served by an experiment arm at a named slot.
//
// A template is DATA interpreted by compiled code — no layout, colour, link, HTML or script — which is
// what keeps it inside App Review 2.5.2. It never asks a question: the questions, the under-16 stop and
// the plan maths stay compiled (`onboarding.ts`). It never types a number (a price is StoreKit's, a
// kcal is `explainTargets`'), so every string with a digit is refused, in every script.
// Validated on the WRITE (`validateScreenTemplate`), because a stored template meets no reviewer.

import { lintCopy } from "./claims.ts";
import { genderedRussian } from "./lang.ts";
import type { MascotMood } from "./mascot.ts";
import { ONBOARDING_CLAIM_RULES } from "./onboarding.ts";
import { LANGS, type Lang } from "./types.ts";

/**
 * What a client can draw. BUMP IT with every new block type or action: a client declares its own on
 * `GET /v1/onboarding?renderer=`, and the server enrols it in no experiment holding a template above it.
 */
export const TEMPLATE_RENDERER_VERSION = 1;

/**
 * Where a template may stand: v1 REPLACES one of the two beats, the screens that answer nothing, so
 * no question, no sign-up door and no paywall moves. A slot that inserts a screen (after the plan,
 * before the paywall) is added with the client that can route to it — a slot the app cannot render
 * would be an arm the server accepts and every phone skips.
 */
export const TEMPLATE_SLOTS = ["baseline", "prelim"] as const;
export type TemplateSlot = (typeof TEMPLATE_SLOTS)[number];

/** What a button does. v1: on to the next place, the way the beat it replaces does. */
export const CTA_ACTIONS = ["next"] as const;
export type CtaAction = (typeof CTA_ACTIONS)[number];
const FORWARD: readonly string[] = ["next"];

export const BULLET_ICONS = ["check", "camera", "chart", "heart", "clock", "spark"] as const;
const MOODS: readonly MascotMood[] = ["care", "wave", "think", "idle", "happy", "joy"];

/** A key into the template's own `strings`. */
type StringKey = string;
/** An uploaded asset, by the sha256 of its bytes. */
type AssetRef = string;

export type Block =
  | { type: "headline" | "body"; text: StringKey }
  | { type: "spud"; lines: StringKey[]; mood: MascotMood }
  | { type: "bullets"; items: { icon: (typeof BULLET_ICONS)[number]; text: StringKey }[] }
  | { type: "image"; asset: AssetRef; alt: StringKey }
  | { type: "cta"; label: StringKey; action: CtaAction }
  | { type: "spacer"; size: "s" | "m" | "l" };

/** What an admin writes. The store adds `key`, `version`, `created_by`, `created_at`. */
export interface ScreenTemplateDraft {
  renderer: number;
  blocks: Block[];
  /** EVERY language in `LANGS`, every key a block names. No fallback to English. */
  strings: Partial<Record<Lang, Record<StringKey, string>>>;
  /** The admin's own label, never shown to a user. */
  note?: string;
}

export interface ScreenTemplate extends ScreenTemplateDraft {
  key: string;
  /** Append-only revision per key, like `llm_prompts`: an edit is a new version, never an update. */
  version: number;
}

/** One entry of an arm's slot: the first whose `when` holds in the USER's local hour is served. */
export interface ArmScreen {
  template: string;
  version: number;
  /** `[from, to)` in the user's local hour, may wrap past midnight. Absent: any hour. */
  when?: { hours: [number, number] };
}
export type ArmScreens = Partial<Record<TemplateSlot, ArmScreen[]>>;

/** What `GET /v1/onboarding` sends for one slot: strings already resolved to the served language. */
export interface ServedScreen {
  template: string;
  version: number;
  blocks: Block[];
  strings: Record<StringKey, string>;
  assets: { sha256: string; url: string }[];
}

/** Every slot's screen for one client, beside the words in `GET /v1/onboarding` (#3167). */
export interface ServedScreens {
  slots: Partial<Record<TemplateSlot, ServedScreen>>;
}

export const TEMPLATE_KEY = /^[a-z0-9][a-z0-9-]{0,47}$/;
const MAX_BLOCKS = 12;
const MAX_TEXT = 240;
const SHA = /^[0-9a-f]{64}$/;
// Any script's digits (Thai, Devanagari, Bengali included): a typed number is a price, a kcal or a
// trial length nobody computed.
const DIGIT = /\p{Nd}/u;
// Format characters and lone surrogates, as `validateStoredPrompt` refuses them.
const BAD_CHAR = /\p{Cf}|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u;

// `[h, h]` is refused: an empty window is an entry that saves, starts and is never served.
const isHourPair = (h: unknown): h is [number, number] =>
  Array.isArray(h) && h.length === 2 && h.every((n) => Number.isInteger(n) && n >= 0 && n <= 23) && h[0] !== h[1];

/** `[from, to)`, wrapping past midnight: `[22, 6)` is ten at night to six in the morning. */
export const hourInWindow = (hour: number, [from, to]: [number, number]): boolean =>
  from <= to ? hour >= from && hour < to : hour >= from || hour < to;

/** The string keys a block reads. */
function keysOf(b: Block): StringKey[] {
  switch (b.type) {
    case "headline": case "body": return [b.text];
    case "spud": return b.lines;
    case "bullets": return b.items.map((i) => i.text);
    case "image": return [b.alt];
    case "cta": return [b.label];
    default: return [];
  }
}

const isStr = (v: unknown): v is string => typeof v === "string" && v !== "";

/** The fields each block type may carry. Anything else is refused, never stored: a template is data
 *  the client reads by these names, and a `url` or `color` riding along is the free form it is not. */
const BLOCK_FIELDS: Record<Block["type"], readonly string[]> = {
  headline: ["text"], body: ["text"], spud: ["lines", "mood"], bullets: ["items"], image: ["asset", "alt"],
  cta: ["label", "action"], spacer: ["size"],
};

/** One message per problem; empty means valid. Every block field is checked, because the input is JSON. */
function blockErrors(raw: unknown, at: string, assets: ReadonlySet<string>): string[] {
  const b = raw as Record<string, unknown>;
  if (typeof b !== "object" || b === null) return [`${at} must be an object`];
  // Own keys only: `{type: "toString"}` must be "not a block", not a TypeError and a 500.
  const allowed = typeof b.type === "string" && Object.hasOwn(BLOCK_FIELDS, b.type) ? BLOCK_FIELDS[b.type as Block["type"]] : undefined;
  if (allowed) {
    const extra = Object.keys(b).filter((k) => k !== "type" && !allowed.includes(k));
    if (extra.length > 0) return [`${at} has unknown fields: ${extra.join(", ")}`];
  }
  if (b.type === "bullets" && Array.isArray(b.items) && b.items.some((i) => typeof i === "object" && i !== null && Object.keys(i).some((k) => k !== "icon" && k !== "text"))) {
    return [`${at}.items has unknown fields`];
  }
  const need = (f: string) => (isStr(b[f]) ? [] : [`${at}.${f} must be a string key`]);
  switch (b.type) {
    case "headline": case "body": return need("text");
    case "spud":
      return [
        ...(Array.isArray(b.lines) && b.lines.length >= 1 && b.lines.length <= 3 && b.lines.every(isStr) ? [] : [`${at}.lines must be 1–3 string keys`]),
        ...(MOODS.includes(b.mood as MascotMood) ? [] : [`${at}.mood '${String(b.mood)}' is not a mood`]),
      ];
    case "bullets":
      return Array.isArray(b.items) && b.items.length >= 1 && b.items.length <= 4 &&
        b.items.every((i) => isStr(i?.text) && (BULLET_ICONS as readonly string[]).includes(i?.icon))
        ? [] : [`${at}.items must be 1–4 of { icon, text }`];
    case "image":
      return [
        ...need("alt"),
        ...(typeof b.asset === "string" && SHA.test(b.asset)
          ? assets.has(b.asset) ? [] : [`${at}.asset ${b.asset} was not uploaded`]
          : [`${at}.asset must be a sha256`]),
      ];
    case "cta": {
      const a = String(b.action);
      const known = (CTA_ACTIONS as readonly string[]).includes(a);
      return [...need("label"), ...(known ? [] : [`${at}.action '${a}' is not an action`])];
    }
    case "spacer": return ["s", "m", "l"].includes(b.size as string) ? [] : [`${at}.size must be s, m or l`];
    default: return [`${at}.type '${String(b.type)}' is not a block`];
  }
}

/** Every reason a template may not be saved. `assets` is the set of uploaded sha256s. Takes raw JSON. */
export function validateScreenTemplate(raw: unknown, assets: ReadonlySet<string>): string[] {
  const t = raw as ScreenTemplateDraft;
  const errs: string[] = [];
  if (!Number.isInteger(t?.renderer) || t.renderer < 1) errs.push("renderer must be a positive integer");
  else if (t.renderer > TEMPLATE_RENDERER_VERSION) errs.push(`renderer ${t.renderer} is newer than ${TEMPLATE_RENDERER_VERSION}`);
  if (!Array.isArray(t?.blocks) || t.blocks.length === 0 || t.blocks.length > MAX_BLOCKS) {
    errs.push(`blocks must be 1–${MAX_BLOCKS} blocks`);
    return errs;
  }
  t.blocks.forEach((b, i) => errs.push(...blockErrors(b, `blocks[${i}]`, assets)));
  if (errs.length > 0) return errs;

  if (t.blocks.filter((b) => b.type === "cta" && FORWARD.includes(b.action)).length !== 1) {
    errs.push("needs exactly one cta that moves forward");
  }

  const keys = [...new Set(t.blocks.flatMap(keysOf))];
  const strings = (t.strings ?? {}) as Record<string, Record<string, unknown> | undefined>;
  for (const lang of LANGS) {
    const table = strings[lang];
    if (typeof table !== "object" || table === null) { errs.push(`strings.${lang} is missing`); continue; }
    const fields: Record<string, string> = {};
    for (const k of keys) {
      const v = table[k];
      if (typeof v !== "string" || v.trim() === "") { errs.push(`strings.${lang}.${k} is missing`); continue; }
      if (v.length > MAX_TEXT) errs.push(`strings.${lang}.${k} is over ${MAX_TEXT} characters`);
      if (DIGIT.test(v)) errs.push(`strings.${lang}.${k} has a digit`);
      if (BAD_CHAR.test(v)) errs.push(`strings.${lang}.${k} has a format character`);
      fields[`strings.${lang}.${k}`] = v;
    }
    for (const v of [...lintCopy(fields), ...lintCopy(fields, ONBOARDING_CLAIM_RULES)]) {
      errs.push(`${v.field} claims '${v.span}' (${v.pattern})`);
    }
  }
  // Russian past tense has no neutral form; stored copy meets the same check compiled copy does.
  for (const g of genderedRussian(strings.ru ?? {})) errs.push(`strings.ru.${g.at} is gendered: "${g.text}"`);
  if (t.note !== undefined && (typeof t.note !== "string" || t.note.length > MAX_TEXT)) errs.push(`note must be a string of at most ${MAX_TEXT} characters`);
  return errs;
}

/** Every reason an arm's `screens` may not be saved. Whether each template exists is the engine's check. Takes raw JSON. */
export function validateArmScreens(raw: unknown): string[] {
  const screens = raw as ArmScreens;
  const errs: string[] = [];
  if (typeof screens !== "object" || screens === null || Array.isArray(screens)) return ["screens must be an object"];
  for (const [slot, entries] of Object.entries(screens)) {
    if (!(TEMPLATE_SLOTS as readonly string[]).includes(slot)) { errs.push(`screens.${slot} is not a slot`); continue; }
    if (!Array.isArray(entries) || entries.length === 0) { errs.push(`screens.${slot} must list at least one template`); continue; }
    entries.forEach((e, i) => {
      const at = `screens.${slot}[${i}]`;
      const extra = typeof e === "object" && e !== null ? Object.keys(e).filter((k) => !["template", "version", "when"].includes(k)) : [];
      if (extra.length > 0) errs.push(`${at} has unknown fields: ${extra.join(", ")}`);
      // The first entry with no window is served at every hour, so one listed before another hides it.
      if (e?.when === undefined && i < entries.length - 1) errs.push(`${at} has no window, so the entries after it are never served — put it last`);
      if (typeof e?.template !== "string" || !TEMPLATE_KEY.test(e.template)) errs.push(`${at}.template must be a template key`);
      if (!Number.isInteger(e?.version) || e.version < 1) errs.push(`${at}.version must be a positive integer`);
      if (e?.when !== undefined && (typeof e.when !== "object" || e.when === null || Object.keys(e.when).some((k) => k !== "hours"))) errs.push(`${at}.when takes hours only`);
      else if (e?.when !== undefined && !isHourPair(e.when?.hours)) errs.push(`${at}.when.hours must be two different hours 0–23 (omit \`when\` for any hour)`);
    });
  }
  return errs;
}

/** The entry an arm serves at `hour` (the USER's local hour), or null when none holds now. */
export function pickArmScreen(entries: readonly ArmScreen[], hour: number | null): ArmScreen | null {
  for (const e of entries) {
    if (!e.when) return e;
    if (hour !== null && hourInWindow(hour, e.when.hours)) return e;
  }
  return null;
}

/**
 * The client's own check of a served screen (ieat-app#3167): a newer server's block, action or slot
 * this build cannot draw, a missing string, or an asset URL that is neither a path nor https is null,
 * and the client walks the compiled beat. The server validated on the write; this is what a SHIPPED
 * binary trusts.
 */
export function usableServedScreen(raw: unknown): ServedScreen | null {
  const s = raw as ServedScreen;
  if (typeof s !== "object" || s === null || typeof s.template !== "string" || !Number.isInteger(s.version)) return null;
  if (!Array.isArray(s.blocks) || s.blocks.length === 0 || typeof s.strings !== "object" || s.strings === null) return null;
  if (!Array.isArray(s.assets) || !s.assets.every((a) => typeof a?.sha256 === "string" && typeof a.url === "string" && /^(\/(?!\/)|https:\/\/)/.test(a.url))) return null;
  const shas = new Set(s.assets.map((a) => a.sha256));
  for (const [i, b] of s.blocks.entries()) {
    if (blockErrors(b, `blocks[${i}]`, shas).length > 0) return null;
    if (keysOf(b).some((k) => typeof s.strings[k] !== "string" || s.strings[k] === "")) return null;
  }
  return s.blocks.filter((b) => b.type === "cta").length === 1 ? s : null;
}

/** The strings a template keeps: every `LANGS` table, cut to the keys its blocks read. */
export function keptStrings(t: ScreenTemplateDraft): ScreenTemplateDraft["strings"] {
  const keys = [...new Set(t.blocks.flatMap(keysOf))];
  return Object.fromEntries(LANGS.map((l) => [l, Object.fromEntries(keys.map((k) => [k, t.strings[l]![k]!]))]));
}

/**
 * One template as one client sees it: only its language's strings, assets as URLs. Null when the
 * language lacks a key — a language added after the template was saved — so the slot is skipped
 * rather than served with a blank button.
 */
export function resolveScreen(t: ScreenTemplate, lang: Lang, assetUrl: (sha256: string) => string): ServedScreen | null {
  const table = t.strings[lang] ?? {};
  const keys = [...new Set(t.blocks.flatMap(keysOf))];
  if (keys.some((k) => typeof table[k] !== "string" || table[k] === "")) return null;
  const shas = [...new Set(t.blocks.flatMap((b) => (b.type === "image" ? [b.asset] : [])))];
  return {
    template: t.key,
    version: t.version,
    blocks: t.blocks,
    strings: Object.fromEntries(keys.map((k) => [k, table[k]!])),
    assets: shas.map((sha256) => ({ sha256, url: assetUrl(sha256) })),
  };
}
