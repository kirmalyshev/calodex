// Apple's AdServices attribution API (ieat-app#3196): the app hands over the token
// `AAAttribution.attributionToken()` gives it and the server asks Apple where the install came
// from. No credential is involved — the token is the whole request. A port, like `mail` and
// `push`, so no test reaches Apple.
//
// THE TOKEN IS NEVER LOGGED, and this file logs nothing at all.

export const ADSERVICES_URL = "https://api-adservices.apple.com/api/v1/";

/** Long enough for Apple's documented latency; short enough not to hold a request open. */
const TIMEOUT_MS = 5_000;

/**
 * Apple's answer. `pending` is its 404 — the attribution is not ready yet and the SAME token may be
 * sent again shortly; `invalid` is its 400; `unavailable` is everything else, a timeout included.
 */
export type AdServicesAnswer =
  | { kind: "attribution"; attributed: boolean; campaignId: string | null; adGroupId: string | null; keywordId: string | null }
  | { kind: "pending" }
  | { kind: "invalid" }
  | { kind: "unavailable" };

export type AdServicesPort = (token: string) => Promise<AdServicesAnswer>;

const id = (v: unknown): string | null => (typeof v === "number" || typeof v === "string") && v !== "" ? String(v) : null;

export function appleAdServices(
  fetchImpl: (url: string, init: RequestInit) => Promise<Response> = fetch,
  timeoutMs = TIMEOUT_MS,
): AdServicesPort {
  return async (token) => {
    try {
      const res = await fetchImpl(ADSERVICES_URL, {
        method: "POST", headers: { "content-type": "text/plain" }, body: token,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.status === 404) return { kind: "pending" };
      if (res.status === 400) return { kind: "invalid" };
      if (!res.ok) return { kind: "unavailable" };
      const b = await res.json() as Record<string, unknown> | null;
      if (typeof b?.attribution !== "boolean") return { kind: "unavailable" };
      return {
        kind: "attribution", attributed: b.attribution,
        campaignId: id(b.campaignId), adGroupId: id(b.adGroupId), keywordId: id(b.keywordId),
      };
    } catch {
      return { kind: "unavailable" };
    }
  };
}
