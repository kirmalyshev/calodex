// The app's brand as a value (ieat-app#2821). Copy carries `{app}` and `{domain}`; `branded` fills
// them where copy is resolved (`t` in lang.ts), so every accessor keeps its `(lang)` signature.
// This file imports nothing at runtime: lang.ts ships in the browser bundle and on Hermes.
//
// Grammar that assumes today's name, to review per language when a second brand has one:
// `rg "\p{L}['’]\{app\}|\{app\}[\p{L}'’-]"` — French/Catalan elision, Korean particles, Turkish
// vowel harmony, Finnish/Hungarian case endings, Indic suffixes after a hyphen.

export const APPS = ["eait"] as const;
export type AppId = (typeof APPS)[number];

export interface Brand {
  app: AppId;
  name: string;
  storeName: string;
  domain: string;
  mailFrom: string;
}

export const BRANDS: Record<AppId, Brand> = {
  eait: { app: "eait", name: "eait", storeName: "eait", domain: "eait.fit", mailFrom: "eait <login@eait.fit>" },
};

/** The request header that picks the brand's words. Never an auth input: nothing may key off it. */
export const APP_HEADER = "x-eait-app";

export const parseApp = (raw?: string | null): AppId => (APPS as readonly string[]).includes(raw ?? "") ? (raw as AppId) : "eait";

export const BRAND_TOKENS = ["app", "domain"] as const;

let source: () => Brand = () => BRANDS.eait;
/** Mobile sets this once before its first render; the server points it at the request's brand. */
export const setBrandSource = (src: () => Brand): void => { source = src; };
export const currentBrand = (): Brand => source();

const cache = new WeakMap<object, WeakMap<Brand, unknown>>();
const fill = (s: string, b: Brand): string => (s.includes("{") ? s.replaceAll("{app}", b.name).replaceAll("{domain}", b.domain) : s);

export function branded<T>(v: T, b: Brand = source()): T {
  if (typeof v === "string") return fill(v, b) as T;
  if (v === null || (typeof v !== "object" && typeof v !== "function")) return v;
  const obj = v as object;
  const hit = cache.get(obj)?.get(b);
  if (hit !== undefined) return hit as T;
  let out: unknown;
  if (typeof v === "function") out = (...a: unknown[]) => branded((v as (...x: unknown[]) => unknown)(...a), b);
  else if (Array.isArray(v)) {
    const m = v.map((x) => branded(x, b));
    out = m.every((x, i) => x === v[i]) ? v : m;
  } else if (Object.getPrototypeOf(v) === Object.prototype) {
    const e = Object.entries(v);
    const m = e.map(([k, x]) => [k, branded(x, b)] as const);
    // Nothing inside carried a token: hand back the table itself, so identity holds and nothing is copied.
    out = m.every(([, x], i) => x === e[i]![1]) ? v : Object.fromEntries(m);
  } else return v;
  let per = cache.get(obj);
  if (!per) cache.set(obj, (per = new WeakMap()));
  per.set(b, out);
  return out as T;
}
