// The brand of the request being served (ieat-app#2821). `x-eait-app` picks the words and the mail
// sender; it is never an auth, scoping, limit or entitlement input. The one thing persisted from it is
// `push_tokens.app`. Work outside a request (push ticks, campaigns, jobs) gets `DEFAULT_APP` unless it wraps
// itself in `withBrand(token.app, …)`.
import { AsyncLocalStorage } from "node:async_hooks";
import { APP_HEADER, BRANDS, currentBrand, DEFAULT_APP, parseApp, setBrandSource, type AppId, type Brand } from "@eait/shared";

const als = new AsyncLocalStorage<Brand>();

/** Points shared copy at the request's brand. Call once at boot. */
export const installBrandSource = (): void => setBrandSource(() => als.getStore() ?? BRANDS[DEFAULT_APP]);

export const withBrand = <T>(app: AppId, fn: () => T): T => als.run(BRANDS[app], fn);

export const withRequestBrand = <T>(req: Request, fn: () => T): T => withBrand(parseApp(req.headers.get(APP_HEADER)), fn);

/**
 * The terms and privacy pages the current brand links. The default instance's are configured; another
 * brand's are its own domain's (calodex.app serves `/terms/` and `/privacy`). An instance that
 * configures neither links neither, whatever the brand.
 */
export const legalUrls = (c: { termsUrl: string; landingUrl: string }): { terms: string; privacy: string } => {
  const b = currentBrand();
  const own = b.app !== "eait";
  return {
    terms: c.termsUrl === "" ? "" : own ? `https://${b.domain}/terms/` : c.termsUrl,
    privacy: c.landingUrl === "" ? "" : own ? `https://${b.domain}/privacy` : `${c.landingUrl}/privacy`,
  };
};
