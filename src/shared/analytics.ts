// Analytics parity (ieat-app#3196): the context every event carries on every sink, and the catalog
// of every product event, so the app and the web register the same super properties and emit the
// same names. Keys are snake_case because they are PostHog property names as they stand.

import type { AppId } from "./brand.ts";
import type { DistributionChannel } from "./contract.ts";
import type { Lang } from "./types.ts";

export const ANALYTICS_SURFACES = ["app", "web"] as const;
export type AnalyticsSurface = (typeof ANALYTICS_SURFACES)[number];

/** What the server can say about an account — sent in `ProfileResponse.analytics`, stamped on its rows. */
export const ANALYTICS_SERVER_KEYS = [
  "content_version", "lang", "country", "experiment_id", "arm", "template",
  "acq_source", "acq_campaign", "acq_adgroup", "acq_keyword", "referrer",
] as const;

/** What only the client knows about itself; the server reads the first six from request headers. */
export const ANALYTICS_CLIENT_KEYS = [
  "surface", "brand", "app_version", "build", "ota_update_id", "channel", "paywall_offering",
] as const;

export const ANALYTICS_CONTEXT_KEYS = [...ANALYTICS_CLIENT_KEYS, ...ANALYTICS_SERVER_KEYS] as const;
export type AnalyticsContextKey = (typeof ANALYTICS_CONTEXT_KEYS)[number];

/** Null wherever the value is unknown — a property that is present and null, never absent. */
export interface AnalyticsContext {
  surface: AnalyticsSurface;
  brand: AppId;
  app_version: string | null;
  build: string | null;
  ota_update_id: string | null;
  channel: DistributionChannel | null;
  paywall_offering: string | null;
  /** The onboarding copy revision this account is served: its arm's, else the live one. */
  content_version: number | null;
  lang: Lang | null;
  country: string | null;
  experiment_id: string | null;
  /** The assigned variant's content version, as text — the id the admin's arms carry. */
  arm: string | null;
  /** The served screen template as `key@version`, or null. */
  template: string | null;
  acq_source: string | null;
  acq_campaign: string | null;
  acq_adgroup: string | null;
  acq_keyword: string | null;
  /** The referral code this account joined with, or null. */
  referrer: string | null;
}

// The interface and the key list are one set: a key added to either and not the other fails here.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _exact: Same<keyof AnalyticsContext, AnalyticsContextKey> = true;
void _exact;

export type AnalyticsServerContext = Pick<AnalyticsContext, (typeof ANALYTICS_SERVER_KEYS)[number]>;

/** The context columns on `onboarding_events`, stamped by the server at record time. */
export const ONBOARDING_EVENT_CONTEXT_KEYS = [
  "surface", "brand", "app_version", "build", "ota_update_id", "channel",
  "lang", "country", "experiment_id", "arm", "template",
] as const;
export type OnboardingEventContext = Pick<AnalyticsContext, (typeof ONBOARDING_EVENT_CONTEXT_KEYS)[number]>;

export interface AnalyticsEventSpec {
  /** Where the event is emitted — the web half is the target P4 builds to, not today's state. */
  surfaces: readonly AnalyticsSurface[];
  /** Emitted by the server alone, from a delivery no client sees; `surfaces` is then empty. */
  server?: true;
  /** The event's own props; the context rides every event already and is never listed here. */
  props: readonly string[];
}

const BOTH = ["app", "web"] as const;
const APP = ["app"] as const;

/**
 * One RevenueCat webhook delivery, as `subscription_<type lowercased>`. A refund is a cancellation
 * whose `cancel_reason` is `CUSTOMER_SUPPORT`; a trial conversion is a renewal with
 * `is_trial_conversion`. A type not listed below is logged in `revenuecat_events` and sent nowhere.
 */
const SUBSCRIPTION = {
  surfaces: [],
  server: true,
  props: [
    "product_id", "period_type", "presented_offering_id", "price", "currency", "store", "country_code", "environment",
    "is_trial_conversion", "cancel_reason",
  ],
} as const;

/**
 * Every product event by name. The app's `posthog?.capture(…)` calls and `paywall-events.ts` are
 * the source; the server's funnel is `onboarding_events` (`ONBOARDING_ACTIONS`), whose PostHog
 * twin is `onboarding_step`.
 */
export const ANALYTICS_EVENTS = {
  // Onboarding
  onboarding_step: { surfaces: BOTH, props: ["place", "action", "ms", "field"] },
  onboarding_plan_completed: { surfaces: BOTH, props: [] },
  health_connect_result: { surfaces: APP, props: ["connected"] },
  // Accounts — the web half of these four is the server's, from /start
  signup_completed: { surfaces: BOTH, props: ["provider", "after_onboarding"] },
  signin_completed: { surfaces: BOTH, props: ["provider", "outcome"] },
  signed_out: { surfaces: BOTH, props: ["everywhere"] },
  account_deleted: { surfaces: BOTH, props: [] },
  profile_edited: { surfaces: BOTH, props: ["fields", "units", "lang_set"] },
  session_revoked: { surfaces: BOTH, props: [] },
  session_owner_unreadable: { surfaces: APP, props: [] },
  land_account_mismatch: { surfaces: APP, props: [] },
  teardown_step_failed: { surfaces: APP, props: ["step", "error"] },
  catch_up_persist_failed: { surfaces: APP, props: ["kind"] },
  // Logging food
  meal_photo_queued: { surfaces: BOTH, props: ["is_first_meal", "has_caption"] },
  meal_logged: { surfaces: BOTH, props: ["requires_follow_up", "is_first_meal"] },
  meal_photo_failed: { surfaces: BOTH, props: ["result", "tries"] },
  meal_update_submitted: { surfaces: BOTH, props: ["update_kind", "has_meal_context", "submitted_from_chat"] },
  meal_edited: { surfaces: BOTH, props: ["items_edited"] },
  meal_deleted: { surfaces: BOTH, props: ["result"] },
  chat_message_sent: { surfaces: BOTH, props: ["has_focus_meal", "is_retry"] },
  chat_outbox_action: { surfaces: BOTH, props: ["action"] },
  // Meal focus (Screen Time — the phone alone)
  meal_focus_setting_changed: { surfaces: APP, props: ["offer", "minutes"] },
  meal_focus_offered: { surfaces: APP, props: ["focus_surface"] },
  meal_focus_declined: { surfaces: APP, props: ["focus_surface"] },
  meal_focus_started: { surfaces: APP, props: ["focus_surface", "minutes"] },
  meal_focus_apps_chosen: { surfaces: APP, props: ["apps", "categories", "sites", "first"] },
  meal_focus_ended: { surfaces: APP, props: ["reason", "minutes", "minutes_elapsed", "shield_views"] },
  screen_time_permission_result: { surfaces: APP, props: ["status"] },
  // Paying
  paywall_opened: { surfaces: BOTH, props: ["blocked", "source"] },
  paywall_plan_selected: { surfaces: BOTH, props: ["plan", "trial_shown", "storefront"] },
  paywall_purchase_started: { surfaces: BOTH, props: ["plan", "trial_shown", "storefront"] },
  paywall_offer_step: { surfaces: BOTH, props: ["step"] },
  paywall_dismissed: { surfaces: BOTH, props: ["result", "blocked"] },
  subscription_purchase_completed: { surfaces: APP, props: ["plan_type"] },
  subscription_purchase_failed: { surfaces: APP, props: ["reason", "code", "readable_code"] },
  purchases_restored: { surfaces: APP, props: ["active"] },
  // The subscription lifecycle, from RevenueCat's webhook
  subscription_initial_purchase: SUBSCRIPTION,
  subscription_renewal: SUBSCRIPTION,
  subscription_product_change: SUBSCRIPTION,
  subscription_cancellation: SUBSCRIPTION,
  subscription_uncancellation: SUBSCRIPTION,
  subscription_billing_issue: SUBSCRIPTION,
  subscription_expiration: SUBSCRIPTION,
  subscription_non_renewing_purchase: SUBSCRIPTION,
  subscription_paused: SUBSCRIPTION,
  subscription_extended: SUBSCRIPTION,
  subscription_temporary_entitlement_grant: SUBSCRIPTION,
  subscription_refund_reversed: SUBSCRIPTION,
  // Coming back
  notification_permission_result: { surfaces: BOTH, props: ["granted", "can_ask_again"] },
  push_opened: { surfaces: BOTH, props: ["reply"] },
  milestone_shared: { surfaces: BOTH, props: [] },
  referral_shared: { surfaces: BOTH, props: ["via"] },
  review_prompt: { surfaces: APP, props: ["result"] },
} as const satisfies Record<string, AnalyticsEventSpec>;

export type AnalyticsEventName = keyof typeof ANALYTICS_EVENTS;
