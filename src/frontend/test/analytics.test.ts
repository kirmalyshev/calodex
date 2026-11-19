// Analytics parity (ieat-app#3196): the web emits every catalog event marked `web`, names nothing the
// catalog does not, and registers the whole context from one builder.

import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ANALYTICS_CONTEXT_KEYS, ANALYTICS_EVENTS, ANALYTICS_SERVER_KEYS, SERVER_SENT_WEB_EVENTS, type AnalyticsServerContext,
} from "../../shared/analytics.ts";
import { currentBrand } from "../../shared/brand.ts";
import { capture, webContext } from "../analytics.ts";

const FRONTEND = join(import.meta.dir, "..");
const browserSources = (): string[] =>
  (readdirSync(FRONTEND, { recursive: true }) as string[])
    .filter((f) => f.endsWith(".ts") && !/^(test|server|node_modules|dist)\//.test(f))
    .map((f) => readFileSync(join(FRONTEND, f), "utf8"));

const calls = browserSources().flatMap((src) => [...src.matchAll(/\bcapture\(\s*"([^"]+)"\s*(?:,\s*\{([^}]*)\})?/g)]);
const captured = new Set(calls.map((m) => m[1]!));
const webEvents = Object.entries(ANALYTICS_EVENTS)
  .filter(([, spec]) => (spec.surfaces as readonly string[]).includes("web")).map(([name]) => name);

const SERVER_WRITTEN: readonly string[] = SERVER_SENT_WEB_EVENTS;

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

  it("never captures a prop named like a context key — the context rides every event already", () => {
    const props = calls.flatMap((m) => [...(m[2] ?? "").matchAll(/(?:^|[,{]|\.\.\.\()\s*(\w+)\s*(?=[:,}]|$)/g)].map((p) => p[1]!));
    expect(props.length).toBeGreaterThan(0);
    expect(props.filter((p) => (ANALYTICS_CONTEXT_KEYS as readonly string[]).includes(p))).toEqual([]);
  });

  it("names the language a profile edit set", () => {
    const edits = calls.filter((m) => m[1] === "profile_edited").map((m) => m[2] ?? "");
    expect(edits.some((p) => p.includes("lang_set"))).toBe(true);
  });

  it("types capture to the web's own events", () => {
    // @ts-expect-error an app-only event
    capture("health_connect_result", { connected: true });
    // @ts-expect-error a server-only event
    capture("subscription_renewal");
  });

  it("captures nothing the catalog does not mark web", () => {
    expect([...captured].filter((e) => e !== "$screen" && !webEvents.includes(e))).toEqual([]);
  });
});

describe("webContext — the super properties", () => {
  it("is the browser's own half alone when the server could not say, so registering it blanks nothing", () => {
    const ctx = webContext(null);
    expect(ctx).toMatchObject({ surface: "web" });
    for (const k of ANALYTICS_SERVER_KEYS) expect(ctx).not.toHaveProperty(k);
  });

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
