// The analytics context (ieat-app#3196): what a request says about the binary that sent it, and
// what the server knows about the account. Both are read here and nowhere else, so the funnel rows,
// `ProfileResponse.analytics` and every client's super properties agree.
import {
  ANALYTICS_CONTEXT_KEYS, ANALYTICS_EVENTS, type AnalyticsEventName, type AnalyticsEventSpec, APP_HEADER, BUILD_HEADER, CHANNEL_HEADER, UPDATE_HEADER, VERSION_HEADER, parseApp, parseChannel, parseClientTag,
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
    console.error(`[eait] analytics: experiment read failed for ${lang}`, err);
    return null;
  }
}

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

/** What the server knows about an account, for its rows and for every client's super properties. */
export async function analyticsServerContext(deps: EngineDeps, userId: string, profile: Profile): Promise<AnalyticsServerContext> {
  const [held, referral, acq, served] = await Promise.all([
    heldArm(deps, userId, profile.lang), deps.store.referralOf(userId), deps.store.acquisitionOf(userId),
    deps.store.onboardingServed(userId),
  ]);
  const referrer = referral?.referredBy ?? null;
  const latest = latestServed(served);
  const arm = held && latest?.contentVersion === held.variant.content.version ? held : null;
  return {
    content_version: latest?.contentVersion ?? held?.variant.content.version
      ?? usableContentFor(profile.lang, await deps.store.getOnboardingContent()).version,
    lang: profile.lang,
    country: profile.country,
    experiment_id: arm?.experimentId ?? null,
    arm: arm ? String(arm.variant.content.version) : null,
    template: servedTemplates(latest),
    // A paid campaign outranks a referral; a referral outranks Apple's "organic".
    acq_source: acq && acq.source !== "organic" ? acq.source : referrer !== null ? "referral" : acq?.source ?? null,
    acq_campaign: acq?.campaign ?? null, acq_adgroup: acq?.adGroup ?? null, acq_keyword: acq?.keyword ?? null,
    referrer,
  };
}

type EventProps<E extends AnalyticsEventName> = { [K in (typeof ANALYTICS_EVENTS)[E]["props"][number]]?: unknown };

/**
 * One event only the server sees, to the analytics sink, with the whole context: the request's half
 * (null throughout when there is no client request, as on a webhook) and the account's. The
 * acquisition keys are also `$set` on the person. A name or a prop the catalog does not list is
 * dropped. Never throws: a failure is logged and the caller carries on.
 */
export async function track<E extends AnalyticsEventName>(
  deps: EngineDeps, userId: string, event: E, props: EventProps<E>, request: AnalyticsRequest | null,
): Promise<void> {
  if (!deps.analytics || !Object.hasOwn(ANALYTICS_EVENTS, event)) return;
  const spec: AnalyticsEventSpec = ANALYTICS_EVENTS[event];
  try {
    const profile = await deps.store.getProfile(userId);
    const server = profile ? await analyticsServerContext(deps, userId, profile) : {};
    const context: Record<string, unknown> = {
      ...Object.fromEntries(ANALYTICS_CONTEXT_KEYS.map((k) => [k, null])), ...request, ...server,
    };
    const own = Object.fromEntries(Object.entries(props).filter(([k]) => spec.props.includes(k)));
    const $set = Object.fromEntries(PERSON_KEYS.map((k) => [k, context[k]]));
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
  if (!profile) return undefined;
  const s = await analyticsServerContext(deps, userId, profile);
  return { ...request, lang: s.lang, country: s.country, experiment_id: s.experiment_id, arm: s.arm, template: null };
}
