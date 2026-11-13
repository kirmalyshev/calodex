import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { expect, test } from "bun:test";
import * as shared from "@eait/shared";
import * as mail from "./mail/copy.ts";
import * as web from "./web/copy.ts";
import * as telegram from "./telegram/copy.ts";
import * as front from "../frontend/copy.ts";
import * as reminders from "../shared/app/reminders-web-copy.ts";
import * as scores from "../shared/scores-copy.ts";
import * as onboarding from "../shared/onboarding-content.ts";

// ieat-app#2821: with brand `eait` every accessor matching NAME_RE, in the modules listed below,
// returns what it returned before the brand became a value. One sha256 per accessor and language, so a
// mismatch names the accessor and language, not the text. `brand.golden.txt` was generated on main
// (re-hashed at e9c983c, payCopyFor at 8ffd68e); the second test serves everything under a probe brand and fails on any leftover `eait`. UPDATE_GOLDEN=1 rewrites it, and a missing file fails rather than re-baselines.
const NAME_RE = /(CopyFor|AppCopy|^scoresCopy|^bmiCopy|^onboardingContentFor|^usableContentFor)$/;
const FILE = new URL("./brand.golden.txt", import.meta.url).pathname;

let flagged = 0; // a probe that threw: its output is not compared, so the test refuses to go green
const dump = (v: unknown): string => {
  if (typeof v === "function") {
    try {
      const probe = new Proxy({}, { get: (_t, k) => `<${String(k)}>` });
      return "fn:" + dump((v as (...a: unknown[]) => unknown)(probe, probe, probe));
    } catch {
      flagged++;
      return `fn/${v.length}`;
    }
  }
  if (Array.isArray(v)) return "[" + v.map(dump).join(",") + "]";
  if (v && typeof v === "object") return "{" + Object.entries(v).map(([k, x]) => `${k}:${dump(x)}`).join(",") + "}";
  return JSON.stringify(v) ?? "undefined";
};

const lines = (sink?: (id: string, body: string) => void): string[] => {
  const out: string[] = [];
  const mods: Record<string, Record<string, unknown>> = { shared, mail, web, telegram, front, reminders, scores, onboarding };
  for (const [m, ns] of Object.entries(mods)) {
    for (const [name, fn] of Object.entries(ns).sort(([a], [b]) => a.localeCompare(b))) {
      if (typeof fn !== "function" || !NAME_RE.test(name)) continue;
      for (const lang of shared.LANGS) {
        let body: string;
        try {
          const call = fn as (l: string, stored?: unknown) => unknown;
          body = name === "usableContentFor"
            ? [null, {}, { [lang]: call("en", null) }].map((x) => dump(shared.branded(call(lang, x)))).join("|")
            : dump(call(lang));
        } catch (e) { flagged++; body = `throws:${(e as Error).message}`; }
        sink?.(`${m}.${name} ${lang}`, body);
        out.push(`${m}.${name} ${lang} ${createHash("sha256").update(body).digest("hex").slice(0, 16)}`);
      }
    }
  }
  return out;
};

test("copy under the default brand is unchanged", () => {
  const now = lines().join("\n") + "\n";
  expect(flagged, "accessors whose probe threw").toBe(0);
  if (process.env.UPDATE_GOLDEN === "1") { writeFileSync(FILE, now); return; }
  expect(existsSync(FILE), "brand.golden.txt is missing; UPDATE_GOLDEN=1 writes it").toBe(true);
  const was = readFileSync(FILE, "utf8").split("\n");
  const diff = now.split("\n").filter((l) => !was.includes(l));
  expect(diff).toEqual([]);
  expect(now.split("\n").length).toBe(was.length);
});

test("a probe brand leaves no default name in the copy it serves", () => {
  const probe = { app: "probe" as never, name: "Zapex", storeName: "Zapex", domain: "zz.example", mailFrom: "Zapex <x@zz.example>" } as const;
  shared.setBrandSource(() => probe);
  const left: string[] = [];
  try { lines((id, body) => { if (body.includes("eait") || /d'Zapex|qu'Zapex|Zapexs|\{(app|domain|d_app|qu_app|app_s)\}/.test(body)) left.push(id); }); } finally { shared.setBrandSource(() => shared.BRANDS.eait); }
  expect(left).toEqual([]);
});
