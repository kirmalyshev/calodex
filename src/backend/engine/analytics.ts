// The analytics context (ieat-app#3196): what a request says about the binary that sent it, and
// what the server knows about the account. The server builds both for its own events and the funnel
// rows, and sends the account's half in `ProfileResponse.analytics` for every client's super
// properties; a funnel row's `template` is the client's own.
import {
  ANALYTICS_CONTEXT_KEYS, ANALYTICS_EVENTS, ANALYTICS_SERVER_KEYS, effectiveAcqSource, type AnalyticsEventName, type AnalyticsEventSpec, APP_HEADER, BUILD_HEADER, CHANNEL_HEADER, UPDATE_HEADER, VERSION_HEADER, parseApp, parseChannel, parseClientTag,
  TEMPLATE_SLOTS, usableContentFor, type AnalyticsContext, type AnalyticsServerContext, type AnalyticsSurface, type Lang,
  type OnboardingEventContext, type Profile,
} from "@eait/shared";
import type { OnboardingServedRecord, OnboardingVariant } from "../store.ts";
import type { EngineDeps } from "./deps.ts";
import { switchOn } from "./switches.ts";

export type AnalyticsRequest = Pick<AnalyticsContext, "surface" | "brand" | "app_version" | "build" | "ota_update_id" | "channel">;

/** CLIENT-REPORTED: labels rows, gates nothing. A value a parser refuses is null, never stored. */
export function analyticsRequestOf(headers: Headers, surface: AnalyticsSurface): AnalyticsRequest {
  return {
    surface,
    brand: parseApp(headers.get(APP_HEADER)),
    channel: parseChannel(headers.get(CHANNEL_HEADER)),
    app_version: parseClientTag(headers.get(VERSION_HEADER)),
    build: parseClientTag(headers.get(BUILD_HEADER)),
    ota_update_id: parseClientTag(headers.get(UPDATE_HEADER)),
  };
}

/**
 * The arm this account HOLDS in the running experiment for its language — read, never enrolled:
 * `assignVariant`'s read half without its write, so recording an event or reading a profile never
 * puts anybody in an experiment. Null when the switch is off, nothing runs, or the read fails.
 */
async function heldArm(deps: EngineDeps, userId: string, lang: Lang): Promise<{ experimentId: string; variant: OnboardingVariant } | null> {
  if (!(await switchOn(deps, "onboarding.experiments"))) return null;
  try {
    const experiment = await deps.store.runningOnboardingExperiment(lang);
    if (!experiment) return null;
    const stored = await deps.store.onboardingAssignment(userId, experiment.id);
    const variant = stored && experiment.variants.find((v) => v.content.version === stored.variant_id);
    return variant ? { experimentId: experiment.id, variant } : null;
  } catch (err) {
    const { name, code } = (err ?? {}) as { name?: unknown; code?: unknown };
    console.error(`[eait] analytics: experiment read failed for ${lang}: ${String(name ?? "error")} ${String(code ?? "-")}`);
    return null;
  }
}

// The arm stamped is the LATEST serving's, read when the batch arrives: events a phone queued
// under an earlier serving and flushed after a re-serve name the newer arm — receipt-time, the
// same semantics the held-arm stamp had before this.
const latestServed = (served: OnboardingServedRecord[]) =>
  served.reduce<OnboardingServedRecord | undefined>((a, r) => (!a || r.lastServedAt >= a.lastServedAt ? r : a), undefined);

/** The serving's templates, `key@version` in slot order, comma-joined; null when none. */
function servedTemplates(latest: OnboardingServedRecord | undefined): string | null {
  const refs = TEMPLATE_SLOTS.flatMap((slot) => {
    const ref = latest?.screens[slot];
    return ref ? [`${ref.template}@${ref.version}`] : [];
  });
  return refs.length > 0 ? refs.join(",") : null;
}

/**
 * What the server knows about an account, for its rows and for every client's super properties.
 * Never throws: a failed read is logged and answers null, which means "unknown", so no sink writes
 * a blank over what it already has.
 */
export async function analyticsServerContext(deps: EngineDeps, userId: string, profile: Profile): Promise<AnalyticsServerContext | null> {
  try {
    return await readServerContext(deps, userId, profile);
  } catch (e) {
    const err = e as { name?: string; code?: string } | null;
    console.error(`[eait] analytics: context read failed: ${err?.name ?? "error"} ${err?.code ?? "-"}`);
    return null;
  }
}

async function readServerContext(deps: EngineDeps, userId: string, profile: Profile): Promise<AnalyticsServerContext> {
  const [held, referral, acq, served] = await Promise.all([
    heldArm(deps, userId, profile.lang), deps.store.referralOf(userId), deps.store.acquisitionOf(userId),
    deps.store.onboardingServed(userId),
  ]);
  const referrer = referral?.referredBy ?? null;
  const latest = latestServed(served);
  // ieat-app#3401: the arm is read off the serving itself, recorded when GET /v1/onboarding
  // answered — so a later event names the same assignment even after the experiment stops or its
  // content moves on, and never claims an arm for a live-flow serving. `held` stays only as the
  // content_version fallback for an account nothing was served to yet.
  return {
    content_version: latest?.contentVersion ?? held?.variant.content.version
      ?? usableContentFor(profile.lang, await deps.store.getOnboardingContent()).version,
    lang: profile.lang,
    country: profile.country,
    experiment_id: latest?.experimentId ?? null,
    arm: latest?.arm ?? null,
    template: servedTemplates(latest),
    acq_source: effectiveAcqSource(acq?.source ?? null, referrer !== null),
    acq_campaign: acq?.campaign ?? null, acq_adgroup: acq?.adGroup ?? null, acq_keyword: acq?.keyword ?? null,
    referrer,
  };
}

type EventProps<E extends AnalyticsEventName> = { [K in (typeof ANALYTICS_EVENTS)[E]["props"][number]]?: unknown };

/**
 * One event only the server sees, to the analytics sink, with the whole context: the request's half
 * (null throughout when there is no client request, as on a webhook) and the account's. The
 * acquisition and referral keys it knows are also `$set` on the person; an id that is no account sends nothing. A name or a prop the catalog does not list is
 * dropped. Never throws: a failure is logged and the caller carries on.
 */
export async function track<E extends AnalyticsEventName>(
  deps: EngineDeps, userId: string, event: E, props: EventProps<E>, request: AnalyticsRequest | null,
): Promise<void> {
  if (!deps.analytics || !Object.hasOwn(ANALYTICS_EVENTS, event)) return;
  const spec: AnalyticsEventSpec = ANALYTICS_EVENTS[event];
  try {
    const profile = await deps.store.getProfile(userId);
    if (!profile) return;
    const server = await analyticsServerContext(deps, userId, profile);
    const context: Record<string, unknown> = {
      ...Object.fromEntries(ANALYTICS_CONTEXT_KEYS.map((k) => [k, null])), ...request, ...(server ?? {}),
    };
    const own = Object.fromEntries(Object.entries(props).filter(([k]) => spec.props.includes(k)));
    const $set = Object.fromEntries(PERSON_KEYS.flatMap((k) => (context[k] == null ? [] : [[k, context[k]]])));
    deps.analytics.capture(userId, event, { ...own, ...context, $set });
  } catch (e) {
    console.error(`[eait] analytics: ${event} not tracked: ${(e as Error | null)?.name ?? "error"}`);
  }
}

const PERSON_KEYS = ["acq_source", "acq_campaign", "acq_adgroup", "acq_keyword", "referrer"] as const;

/** The columns `onboarding_events` carries: the request's half and the account's. `template` is the row's own, from the body. */
export async function onboardingEventContext(
  deps: EngineDeps, userId: string, request: AnalyticsRequest,
): Promise<OnboardingEventContext | undefined> {
  const profile = await deps.store.getProfile(userId);
  const s = profile ? await analyticsServerContext(deps, userId, profile) : null;
  // `template` and `paywall_offering` are the row's own, from the body — the server stamps null.
  return { ...request, lang: s?.lang ?? null, country: s?.country ?? null, experiment_id: s?.experiment_id ?? null, arm: s?.arm ?? null, template: null, paywall_offering: null };
}
