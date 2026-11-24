// The self-host Caddyfile sends exactly the paths the web server answers to the frontend container.
// A path the server answers and `@app` omits falls through to the backend catch-all and 404s.
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BUNDLE_PATH, SHELL_PATH, WORKER_PATH } from "../frontend/server/index.ts";

const caddyfile = readFileSync(join(import.meta.dir, "..", "iac", "Caddyfile"), "utf8");
const patterns = /^\s*@app path (.+)$/m.exec(caddyfile)?.[1]?.trim().split(/\s+/) ?? [];

// Caddy's `path` matcher: exact, or a trailing `*` glob.
const routed = (p: string): boolean =>
  patterns.some((m) => (m.endsWith("*") ? p.startsWith(m.slice(0, -1)) : m === p));

test("@app routes every path the frontend server serves", () => {
  expect(patterns.length).toBeGreaterThan(0);
  // The medal sample is any name MEDAL_PATH accepts.
  for (const p of [SHELL_PATH, BUNDLE_PATH, WORKER_PATH, "/medals/01-first-meal.webp"]) {
    expect({ p, routed: routed(p) }).toEqual({ p, routed: true });
  }
});
