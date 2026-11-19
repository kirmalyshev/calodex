// The brand of the request being served (ieat-app#2821). `x-eait-app` picks the words and the mail
// sender; it is never an auth, scoping, limit or entitlement input. The one thing persisted from it is
// `push_tokens.app`. Work outside a request (push ticks, campaigns, jobs, the Telegram connector) gets
// `DEFAULT_APP`; nothing wraps itself in `withBrand(token.app, …)` yet, because no push copy carries a
// brand token. The configuration (mail sender, landing, terms) describes `DEFAULT_APP`.
import { AsyncLocalStorage } from "node:async_hooks";
import { APP_HEADER, BRANDS, currentBrand, DEFAULT_APP, parseApp, setBrandSource, type AppId, type Brand } from "@eait/shared";

const als = new AsyncLocalStorage<Brand>();

/** Points shared copy at the request's brand. Call once at boot. */
export const installBrandSource = (): void => setBrandSource(() => als.getStore() ?? BRANDS[DEFAULT_APP]);

export const withBrand = <T>(app: AppId, fn: () => T): T => als.run(BRANDS[app], fn);

export const withRequestBrand = <T>(req: Request, fn: () => T): T => withBrand(parseApp(req.headers.get(APP_HEADER)), fn);

/**
 * The terms and privacy pages the current brand links. The configuration describes the default
 * brand's; any other brand links its own domain's (eait.fit and calodex.app both serve `/terms/` and
 * `/privacy`). A value left empty links nothing, whatever the brand.
 */
export const legalUrls = (c: { termsUrl: string; landingUrl: string }): { terms: string; privacy: string } => {
  const b = currentBrand();
  const own = b.app !== DEFAULT_APP;
  return {
    terms: c.termsUrl === "" ? "" : own ? `https://${b.domain}/terms/` : c.termsUrl,
    privacy: c.landingUrl === "" ? "" : own ? `https://${b.domain}/privacy` : `${c.landingUrl}/privacy`,
  };
};
