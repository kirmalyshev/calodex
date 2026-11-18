// A push was opened (#1759): the phone reports it, the admin reads the funnel.
//
// Both halves are thin on purpose. Whose send an id is gets decided by the store (`recordPushOpen`
// selects through `send_log`), so there is nothing here to get wrong about scoping — and the answer
// is `{ ok: true }` whether the open was recorded, was a repeat, or named an account's send that is
// not the caller's. A route that distinguished them would let a caller probe for other accounts'
// send ids.

import type { PushDeliveredRequest, PushDeliveredResponse, PushOpenRequest, PushOpenResponse } from "@eait/shared";
import type { AdminWindowEcho } from "@eait/shared";
import type { AdminRange, PushStatRow } from "../store.ts";
import type { EngineDeps } from "./deps.ts";
import { adminRangeOf, adminWindowEcho } from "./admin.ts";

/** The widest window the admin view reads. A bound rather than a page: it is a per-day table. */
export const PUSH_STATS_MAX_DAYS = 90;
const DEFAULT_DAYS = 7;

export async function recordPushOpen(
  deps: EngineDeps, userId: string, body: PushOpenRequest,
): Promise<PushOpenResponse> {
  await deps.store.recordPushOpen(userId, body.sendId, body.action ?? "tap");
  return { ok: true };
}

/** The notification extension's beacon (ieat-app#1763). Same answer whatever the store decided. */
export async function recordPushDelivered(
  deps: EngineDeps, userId: string, body: PushDeliveredRequest,
): Promise<PushDeliveredResponse> {
  await deps.store.recordPushDelivered(userId, body.sendId);
  return { ok: true };
}

export interface PushOpenView {
  /** The window this was read over (ieat-app#2776). */
  range: AdminWindowEcho;
  /** The zone each row's `day` is dated in: the instance's, as the evening line is. */
  timezone: string;
  rows: PushStatRow[];
}

export async function pushOpenView(deps: EngineDeps, range: AdminRange & { days?: number } | number): Promise<PushOpenView> {
  const ask = adminRangeOf(range, DEFAULT_DAYS, PUSH_STATS_MAX_DAYS);
  const timezone = deps.config.timezone;
  return { range: adminWindowEcho(ask), timezone, rows: await deps.store.pushOpenStats(ask, timezone) };
}

/** The rows the admin's recent-pushes table shows. No token: the device is named by nothing. */
export interface RecentSend {
  id: string; userId: string; email: string | null;
  kind: string; templateKey: string; lang: string; variant: string | null; state: string;
  /** As sent (#844); null for a row written before the text was stored. */
  title: string | null; body: string | null;
  createdAt: string;
}

export const PUSH_RECENT_MAX = 200;

/** The newest sends, each with the account that got it and the text it carried. */
export async function pushRecentView(deps: EngineDeps, limit: number): Promise<{ sends: RecentSend[] }> {
  const rows = await deps.store.recentSends(Math.min(Math.max(1, Math.floor(limit)), PUSH_RECENT_MAX));
  const emails = new Map<string, string | null>();
  for (const r of rows) if (!emails.has(r.userId)) emails.set(r.userId, await deps.store.emailForUser(r.userId));
  return {
    sends: rows.map((r) => ({
      id: r.id, userId: r.userId, email: emails.get(r.userId) ?? null, kind: r.kind, templateKey: r.templateKey,
      lang: r.lang, variant: r.variant, state: r.state, title: r.title, body: r.body, createdAt: r.createdAt,
    })),
  };
}
