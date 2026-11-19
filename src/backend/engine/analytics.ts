// The analytics context (ieat-app#3196): what a request says about the binary that sent it, and
// what the server knows about the account. Both are read here and nowhere else, so the funnel rows,
// `ProfileResponse.analytics` and every client's super properties agree.
import {
  APP_HEADER, BUILD_HEADER, CHANNEL_HEADER, UPDATE_HEADER, VERSION_HEADER, parseApp, parseChannel, parseClientTag,
  usableContentFor, type AnalyticsContext, type AnalyticsServerContext, type AnalyticsSurface, type Lang,
  type OnboardingEventContext, type Profile,
} from "@eait/shared";
import type { OnboardingVariant } from "../store.ts";
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

/** What the server knows about an account, for its rows and for every client's super properties. */
export async function analyticsServerContext(deps: EngineDeps, userId: string, profile: Profile): Promise<AnalyticsServerContext> {
  const [held, referral] = await Promise.all([heldArm(deps, userId, profile.lang), deps.store.referralOf(userId)]);
  const referrer = referral?.referredBy ?? null;
  return {
    content_version: held?.variant.content.version
      ?? usableContentFor(profile.lang, await deps.store.getOnboardingContent()).version,
    lang: profile.lang,
    country: profile.country,
    experiment_id: held?.experimentId ?? null,
    arm: held ? String(held.variant.content.version) : null,
    // THE ONE PLACE the served template goes, once ieat-app#3194 records what GET /v1/onboarding served.
    template: null,
    // ponytail: referral is the only source the server knows today; P2/P3 (ieat-app#3196) fill the ASA keys.
    acq_source: referrer === null ? null : "referral", acq_campaign: null, acq_adgroup: null, acq_keyword: null,
    referrer,
  };
}

/** The columns `onboarding_events` carries: the request's half and the account's, nothing from the body. */
export async function onboardingEventContext(
  deps: EngineDeps, userId: string, request: AnalyticsRequest,
): Promise<OnboardingEventContext | undefined> {
  const profile = await deps.store.getProfile(userId);
  if (!profile) return undefined;
  const s = await analyticsServerContext(deps, userId, profile);
  return { ...request, lang: s.lang, country: s.country, experiment_id: s.experiment_id, arm: s.arm, template: s.template };
}
