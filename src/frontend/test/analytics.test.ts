// Analytics parity (ieat-app#3196): the web emits every catalog event marked `web`, names nothing the
// catalog does not, and registers the whole context from one builder.

import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ANALYTICS_CONTEXT_KEYS, ANALYTICS_EVENTS, type AnalyticsServerContext } from "../../shared/analytics.ts";
import { currentBrand } from "../../shared/brand.ts";
import { webContext } from "../analytics.ts";

const FRONTEND = join(import.meta.dir, "..");
const browserSources = (): string[] =>
  (readdirSync(FRONTEND, { recursive: true }) as string[])
    .filter((f) => f.endsWith(".ts") && !/^(test|server|node_modules|dist)\//.test(f))
    .map((f) => readFileSync(join(FRONTEND, f), "utf8"));

const captured = new Set(browserSources().flatMap((src) => [...src.matchAll(/\bcapture\(\s*"([^"]+)"/g)].map((m) => m[1]!)));
const webEvents = Object.entries(ANALYTICS_EVENTS)
  .filter(([, spec]) => (spec.surfaces as readonly string[]).includes("web")).map(([name]) => name);

// The web's onboarding is `/start`, served by the backend before this client has anybody to be:
// its steps, the plan and the sign-ups are the server's to send, with surface `web`, never a browser capture.
const SERVER_WRITTEN = ["onboarding_step", "onboarding_plan_completed", "signup_completed", "signin_completed"];

describe("the web's events are the catalog's", () => {
  it("captures every event the catalog marks web", () => {
    expect(webEvents.filter((e) => !captured.has(e) && !SERVER_WRITTEN.includes(e))).toEqual([]);
  });

  it("sends /start's events server-side, as the web", () => {
    const start = readFileSync(join(FRONTEND, "../backend/web/start.ts"), "utf8");
    expect(start).toContain('analyticsRequestOf(req.headers, "web")');
    for (const e of SERVER_WRITTEN) expect(start).toContain(`"${e}"`);
    expect([...captured].filter((e) => SERVER_WRITTEN.includes(e))).toEqual([]);
  });

  it("captures nothing the catalog does not mark web", () => {
    expect([...captured].filter((e) => e !== "$screen" && !webEvents.includes(e))).toEqual([]);
  });
});

describe("webContext — the super properties", () => {
  const server: AnalyticsServerContext = {
    content_version: 7, lang: "de", country: "DE", experiment_id: "x1", arm: "7", template: "plan@2",
    acq_source: "asa", acq_campaign: "c", acq_adgroup: "g", acq_keyword: "k", referrer: "R1",
  };

  it("carries every context key, the server's half as sent", () => {
    const ctx = webContext(server);
    expect(Object.keys(ctx).sort()).toEqual([...ANALYTICS_CONTEXT_KEYS].sort());
    expect(ctx).toMatchObject(server);
  });

  it("names the web, and is null where a browser has no answer", () => {
    expect(webContext(server)).toMatchObject({
      surface: "web", brand: currentBrand().app, app_version: null, build: null, ota_update_id: null, channel: null, paywall_offering: null,
    });
  });
});
