import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { expect, test } from "bun:test";
import * as shared from "@eait/shared";
import * as mail from "./mail/copy.ts";
import * as web from "./web/copy.ts";
import * as front from "../frontend/copy.ts";
import * as reminders from "../shared/app/reminders-web-copy.ts";
import * as scores from "../shared/scores-copy.ts";
import * as onboarding from "../shared/onboarding-content.ts";

// Whitelabel 1/4 (#2821): with brand `eait` every copy accessor returns what it returned before the
// brand became a value. `brand.golden.txt` was generated on unedited main; UPDATE_GOLDEN=1 rewrites it.
const FILE = new URL("./brand.golden.txt", import.meta.url).pathname;

const dump = (v: unknown): string => {
  if (typeof v === "function") {
    try {
      const probe = new Proxy({}, { get: (_t, k) => `<${String(k)}>` });
      return "fn:" + dump((v as (...a: unknown[]) => unknown)(probe, probe, probe));
    } catch {
      return `fn/${v.length}`;
    }
  }
  if (Array.isArray(v)) return "[" + v.map(dump).join(",") + "]";
  if (v && typeof v === "object") return "{" + Object.entries(v).map(([k, x]) => `${k}:${dump(x)}`).join(",") + "}";
  return JSON.stringify(v) ?? "undefined";
};

const lines = (): string[] => {
  const out: string[] = [];
  const mods: Record<string, Record<string, unknown>> = { shared, mail, web, front, reminders, scores, onboarding };
  for (const [m, ns] of Object.entries(mods)) {
    for (const [name, fn] of Object.entries(ns).sort(([a], [b]) => a.localeCompare(b))) {
      if (typeof fn !== "function" || !/(CopyFor|AppCopy|^scoresCopy|^bmiCopy|^onboardingContentFor)$/.test(name)) continue;
      for (const lang of shared.LANGS) {
        let body: string;
        try { body = dump((fn as (l: string) => unknown)(lang)); } catch (e) { body = `throws:${(e as Error).message}`; }
        out.push(`${m}.${name} ${lang} ${createHash("sha256").update(body).digest("hex").slice(0, 16)}`);
      }
    }
  }
  return out;
};

test("copy under the default brand is unchanged", () => {
  const now = lines().join("\n") + "\n";
  if (process.env.UPDATE_GOLDEN || !existsSync(FILE)) { writeFileSync(FILE, now); return; }
  const was = readFileSync(FILE, "utf8").split("\n");
  const diff = now.split("\n").filter((l) => !was.includes(l));
  expect(diff).toEqual([]);
  expect(now.split("\n").length).toBe(was.length);
});
