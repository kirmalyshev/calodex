// The app's brand as a value (ieat-app#2821). Copy carries `{app}` and `{domain}`; `branded` fills
// them where copy is resolved (`t` in lang.ts, `onboardingServedFor`, and the exported `DEFAULT_ONBOARDING_CONTENT`), so every accessor keeps its `(lang)` signature.
// This file imports nothing at runtime: lang.ts ships in the browser bundle and on Hermes.
//
// Grammar that assumes today's name, to review per language when a second brand has one:
// `rg "\p{L}['’]\{app\}|\{app\}[\p{L}'’-]"` — French/Catalan elision, Korean particles, Turkish
// vowel harmony, Finnish/Hungarian case endings, Indic suffixes after a hyphen.

export const APPS = ["eait", "calodex"] as const;
export type AppId = (typeof APPS)[number];

export interface Brand {
  readonly app: AppId;
  readonly name: string;
  readonly storeName: string;
  readonly domain: string;
  readonly mailFrom: string;
}

export const BRANDS: Readonly<Record<AppId, Brand>> = {
  eait: { app: "eait", name: "eait", storeName: "eait", domain: "eait.fit", mailFrom: "eait <login@eait.fit>" },
  // Domain and sender stay on eait.fit until calodex.fit DNS is live (ieat-app#2822). Same App Store record.
  calodex: { app: "calodex", name: "Calodex", storeName: "Calodex: AI calorie tracker", domain: "eait.fit", mailFrom: "Calodex <login@eait.fit>" },
};

/**
 * The request header that picks the brand's words and mail sender. Never an auth, scoping, limit or
 * entitlement input. The one thing persisted from it is `push_tokens.app`, for push wording.
 */
export const APP_HEADER = "x-eait-app";

/** The brand a header or column names, or null when it names none. */
export const knownApp = (raw?: string | null): AppId | null => ((APPS as readonly string[]).includes(raw ?? "") ? (raw as AppId) : null);

/** `knownApp`, falling back to the default brand: for copy, where a wrong word beats a refusal. */
export const parseApp = (raw?: string | null): AppId => knownApp(raw) ?? "eait";

export const BRAND_TOKENS = ["app", "domain", "app_gs", "apps"] as const;

let source: () => Brand = () => BRANDS.eait;
/**
 * The server points it at the request's brand (backend/brand.ts). A client with a non-default brand
 * must call it once before its first render; nothing outside the server does yet. Outside a request
 * and with no source installed the brand is `eait`.
 */
export const setBrandSource = (src: () => Brand): void => { source = src; };
export const currentBrand = (): Brand => source();

const cache = new WeakMap<object, Map<AppId, unknown>>();
// Grammar that bends around the name (ieat-app#2837). `eait` starts with a vowel and ends in "t",
// so every form below is a no-op for it; a name that starts with a consonant or ends in a sibilant
// gets the form that language needs. fr/ca `d'{app}` -> "de Calodex"; hu `az {app}` -> "a Calodex",
// `{app}-tel` -> "Calodex-szel". Two tokens carry the genitive, which differs by language:
// `{app_gs}` German (eaits / Calodex'), `{apps}` Scandinavian (eaits / Calodex).
const VOWEL_START = /^[aeiouyhàáâäåæèéêëìíîïòóôöøùúûüœ]/i;
const SIBILANT_END = /[sßxz]$/i;

const fill = (s: string, b: Brand): string => {
  if (!s.includes("{")) return s;
  let o = s;
  if (!VOWEL_START.test(b.name)) {
    o = o.replace(/\b(d|qu)'\{app\}/gi, "$1e {app}").replace(/\b(az) \{app\}/gi, (_, w: string) => `${w.slice(0, -1)} {app}`);
  }
  if (SIBILANT_END.test(b.name)) o = o.replaceAll("{app}-tel", "{app}-szel");
  return o
    .replaceAll("{app_gs}", b.name + (SIBILANT_END.test(b.name) ? "'" : "s"))
    .replaceAll("{apps}", b.name + (SIBILANT_END.test(b.name) ? "" : "s"))
    .replaceAll("{app}", b.name)
    .replaceAll("{domain}", b.domain);
};

export function branded<T>(v: T, b: Brand = source()): T {
  if (typeof v === "string") return fill(v, b) as T;
  if (v === null || (typeof v !== "object" && typeof v !== "function")) return v;
  const obj = v as object;
  const hit = cache.get(obj)?.get(b.app);
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
  if (!per) cache.set(obj, (per = new Map()));
  per.set(b.app, out);
  return out as T;
}
