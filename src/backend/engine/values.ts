// The admin's numeric knobs (ieat-app#3421) — the counterpart of `switches.ts`. The store holds an
// append-only history; this file is the default, the range each key accepts, the read-per-request,
// and the admin's view and write.

import {
  PHOTO_COMPRESSION_DEFAULT, PHOTO_COMPRESSION_MAX, PHOTO_COMPRESSION_MIN,
  PHOTO_MAX_EDGE_DEFAULT, PHOTO_MAX_EDGE_MAX, PHOTO_MAX_EDGE_MIN,
} from "@eait/shared";
import { VALUE_KEYS, type AdminValueKey } from "../store.ts";
import type { EngineDeps } from "./deps.ts";

/** What a never-set value means: the behaviour every client already had (#3421's 0.8 JPEG quality). */
export const VALUE_DEFAULT: Record<AdminValueKey, number> = {
  "photo.compression": PHOTO_COMPRESSION_DEFAULT,
  "photo.max_edge_px": PHOTO_MAX_EDGE_DEFAULT,
};

/** What a set may say, per key. `photo.compression` is the issue's 0.1–1 coefficient. */
export const VALUE_RANGE: Record<AdminValueKey, { min: number; max: number }> = {
  "photo.compression": { min: PHOTO_COMPRESSION_MIN, max: PHOTO_COMPRESSION_MAX },
  "photo.max_edge_px": { min: PHOTO_MAX_EDGE_MIN, max: PHOTO_MAX_EDGE_MAX },
};

export async function adminValueOf(deps: EngineDeps, key: AdminValueKey): Promise<number> {
  try {
    return (await deps.store.adminValue(key)) ?? VALUE_DEFAULT[key];
  } catch {
    // Logged without detail, and the default taken: a coefficient must never fail a meal.
    console.error(`[eait] admin value read failed: ${key}`);
    return VALUE_DEFAULT[key];
  }
}

export interface ValueView {
  key: AdminValueKey;
  value: number;
  /** Who set it last and when; null while it has never been set (the default applies). */
  setBy: string | null;
  setAt: string | null;
  /** The actor's sign-in address, resolved at read time — same rule as `SwitchView.setByEmail`. */
  setByEmail: string | null;
}

/** One set of the audit trail as the admin sees it — same fields as `ValueView`, minus the id being always set. */
export interface SetView {
  key: AdminValueKey;
  value: number;
  setBy: string;
  setAt: string;
  setByEmail: string | null;
}

const RECENT = 20;

export async function adminValues(deps: EngineDeps): Promise<{ values: ValueView[]; recent: SetView[] }> {
  // One read, wide enough to hold the newest set of every key as well as the page's list.
  const history = await deps.store.adminValueHistory(Math.max(RECENT, 200));
  const actors = new Map<string, Promise<string | null>>();
  const emailOf = (id: string): Promise<string | null> => {
    let e = actors.get(id);
    if (e === undefined) { e = deps.store.emailForUser(id); actors.set(id, e); }
    return e;
  };
  const values = await Promise.all(VALUE_KEYS.map(async (key): Promise<ValueView> => {
    const last = history.find((f) => f.key === key);
    return {
      key,
      value: await adminValueOf(deps, key),
      setBy: last?.set_by ?? null,
      setAt: last?.set_at ?? null,
      setByEmail: last === undefined ? null : await emailOf(last.set_by),
    };
  }));
  const recent = await Promise.all(history.slice(0, RECENT).map(async (f): Promise<SetView> => ({
    key: f.key, value: f.value, setBy: f.set_by, setAt: f.set_at, setByEmail: await emailOf(f.set_by),
  })));
  return { values, recent };
}

export type ValueSave = { ok: true } | { ok: false; errors: string[] };

export async function saveValue(deps: EngineDeps, key: unknown, value: unknown, adminId: string): Promise<ValueSave> {
  if (typeof key !== "string" || !(VALUE_KEYS as readonly string[]).includes(key)) return { ok: false, errors: ["unknown value"] };
  if (typeof value !== "number" || !Number.isFinite(value)) return { ok: false, errors: ["value must be a number"] };
  const { min, max } = VALUE_RANGE[key as AdminValueKey];
  if (value < min || value > max) return { ok: false, errors: [`value must be between ${min} and ${max}`] };
  await deps.store.setAdminValue(key as AdminValueKey, value, adminId);
  return { ok: true };
}
