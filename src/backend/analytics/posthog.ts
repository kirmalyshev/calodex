// PostHog's capture API (ieat-app#3196): the events no client can see — what the server-rendered
// /start does and what RevenueCat's webhook reports — reach the same project the app and the web
// client send to. A port, like `mail` and `push`, so no test reaches PostHog.
//
// FIRE-AND-FORGET: `capture` returns before the request is made and never throws, so an analytics
// outage can neither slow nor fail a request. THE KEY IS NEVER LOGGED.

export interface AnalyticsPort {
  capture(userId: string, event: string, props: Record<string, unknown>): void;
  /** `from`'s events become `into`'s: a sign-in that landed an anonymous session on an existing account. */
  merge(into: string, from: string): void;
}

/** Short: an event lost to a slow sink costs less than a socket held open. */
const TIMEOUT_MS = 3_000;

/** Off — undefined — unless both the project key and the host are set. */
export function posthogAnalytics(
  config: { posthogKey: string; posthogHost: string },
  fetchImpl: (url: string, init: RequestInit) => Promise<Response> = fetch,
  timeoutMs = TIMEOUT_MS,
): AnalyticsPort | undefined {
  const key = config.posthogKey.trim();
  const host = config.posthogHost.trim().replace(/\/+$/, "");
  if (key === "" || host === "") return undefined;
  const url = `${host}/batch/`;
  const send = (userId: string, event: string, props: Record<string, unknown>) => {
    const body = JSON.stringify({
      api_key: key,
      batch: [{ event, distinct_id: userId, properties: props, timestamp: new Date().toISOString() }],
    });
    Promise.resolve()
      .then(() => fetchImpl(url, {
        method: "POST", headers: { "content-type": "application/json" }, body, signal: AbortSignal.timeout(timeoutMs),
      }))
      .then((res) => { if (!res.ok) console.error(`[eait] posthog: ${event} refused with ${res.status}`); })
      .catch((e: unknown) => console.error(`[eait] posthog: ${event} not sent: ${(e as Error | null)?.name ?? "error"}`));
  };
  return { capture: send, merge: (into, from) => send(into, "$merge_dangerously", { alias: from }) };
}
