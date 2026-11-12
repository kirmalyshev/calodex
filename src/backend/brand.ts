// The brand of the request being served (ieat-app#2821). `x-eait-app` picks the words and the mail
// sender; it is never an auth, scoping, limit or entitlement input. The one thing persisted from it is
// `push_tokens.app`. Work outside a request (push ticks, campaigns, jobs) gets `eait` unless it wraps
// itself in `withBrand(token.app, …)`.
import { AsyncLocalStorage } from "node:async_hooks";
import { APP_HEADER, BRANDS, parseApp, setBrandSource, type AppId, type Brand } from "@eait/shared";

const als = new AsyncLocalStorage<Brand>();

/** Points shared copy at the request's brand. Call once at boot. */
export const installBrandSource = (): void => setBrandSource(() => als.getStore() ?? BRANDS.eait);

export const withBrand = <T>(app: AppId, fn: () => T): T => als.run(BRANDS[app], fn);

export const withRequestBrand = <T>(req: Request, fn: () => T): T => withBrand(parseApp(req.headers.get(APP_HEADER)), fn);
