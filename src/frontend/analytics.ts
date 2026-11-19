// Product analytics (ieat-app#2054). OFF UNLESS CONFIGURED: the server puts PostHog's public key in
// `<meta name="eait-posthog">` only when `EAIT__FRONTEND__POSTHOG_KEY` is set, and without it every
// function here is a no-op.
//
// ONE ORIGIN STILL HOLDS. Events go to `/ingest` on this origin and the edge forwards them to
// PostHog's EU host, so `connect-src 'self'` is unchanged. The `no-external` slim build loads no
// script of its own — the nonce policy would refuse one anyway.
//
// Events carry names, flags and the analytics context (build, language, country, arm, acquisition,
// referral code) — never a weight, kcal, meal, photo or typed text; a person is our user id, never
// an email. Nothing is captured automatically: no clicks, no
// page views, no recordings, no surveys. Nothing is persisted in this browser, and the client
// starts only once somebody is signed in, AS them (`bootstrap`): an anonymous id minted per page
// load and merged on every identify would pile ids onto one person until PostHog stops showing it.
import posthog, { type PostHog } from "posthog-js/dist/module.slim.no-external";
import type { ANALYTICS_EVENTS, AnalyticsContext, AnalyticsEventName, AnalyticsServerContext } from "@eait/shared";
import { currentBrand } from "../shared/brand.ts";
import { scrubPageUrls } from "./route.ts";

// `typeof document`: the bun tests import this file for `webContext`, and there is no page there.
const key = typeof document === "undefined" ? "" : document.querySelector<HTMLMetaElement>('meta[name="eait-posthog"]')?.content ?? "";

/** The whole context, the ONE builder: what a browser knows of itself, then what the server sent. */
export const webContext = (server: AnalyticsServerContext | null): Partial<AnalyticsContext> => ({
  surface: "web", brand: currentBrand().app,
  // No binary, no OTA, no store channel, no RevenueCat offering: the web sells the profile's checkout links.
  app_version: null, build: null, ota_update_id: null, channel: null, paywall_offering: null,
  ...(server ?? {}),
});

let client: PostHog | null = null;

/** Start as this account, or switch to it, and (re-)register its context on every event. */
export function identify(userId: string, server: AnalyticsServerContext | null): void {
  if (key === "") return;
  if (client === null) {
    posthog.init(key, {
      api_host: "/ingest",
      ui_host: "https://eu.posthog.com",
      persistence: "memory",
      bootstrap: { distinctID: userId, isIdentifiedID: true },
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      disable_surveys: true,
      capture_exceptions: false,
      capture_heatmaps: false,
      capture_dead_clicks: false,
      capture_performance: false,
      rageclick: false,
      advanced_disable_flags: true,
      before_send: (event) => {
        // posthog-js adds URLs of its own to every event, and the hash route in them names meals.
        if (event !== null) for (const p of [event.properties, event.$set, event.$set_once]) scrubPageUrls(p, location.origin);
        return event;
      },
    });
    // `init` hands back nothing for the default instance; the singleton IS the client.
    client = posthog;
  } else if (client.get_distinct_id() !== userId) {
    client.reset();
    client.identify(userId);
  }
  client.register(webContext(server));
}

type Value = string | number | boolean | null | readonly string[];
type WebEvent = {
  [K in AnalyticsEventName]: "web" extends (typeof ANALYTICS_EVENTS)[K]["surfaces"][number] ? K : never
}[AnalyticsEventName];
/** A catalog event takes only the catalog's props for it; `$screen` takes its name. */
type Props<E> = E extends WebEvent ? { [K in (typeof ANALYTICS_EVENTS)[E]["props"][number]]?: Value } : { $screen_name: string };

/** One named event; nothing is sent before `identify`. `beforeUnload` sends it now, by beacon. */
export const capture = <E extends WebEvent | "$screen">(event: E, props?: Props<E>, beforeUnload = false): void => {
  client?.capture(event, props as Record<string, unknown> | undefined,
    beforeUnload ? { send_instantly: true, transport: "sendBeacon" } : undefined);
};

/** Signing out: whoever signs in next is somebody else. */
export const reset = (): void => { client?.reset(); };
