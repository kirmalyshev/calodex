import { describe, expect, it } from "bun:test";
import {
  ANALYTICS_CLIENT_KEYS, ANALYTICS_CONTEXT_KEYS, ANALYTICS_EVENTS, ANALYTICS_SERVER_KEYS, ANALYTICS_SURFACES,
  ONBOARDING_EVENT_CONTEXT_KEYS, parseClientTag,
} from "./index.ts";

const snake = /^[a-z][a-z0-9_]*$/;

describe("the analytics context (ieat-app#3196)", () => {
  it("names every key once, in snake_case, because each one becomes a PostHog property", () => {
    expect(new Set(ANALYTICS_CONTEXT_KEYS).size).toBe(ANALYTICS_CONTEXT_KEYS.length);
    for (const k of ANALYTICS_CONTEXT_KEYS) expect(k).toMatch(snake);
  });

  it("splits into what the server knows and what only the client knows, with nothing left over", () => {
    const both = [...ANALYTICS_SERVER_KEYS, ...ANALYTICS_CLIENT_KEYS];
    expect(new Set(both).size).toBe(both.length);
    expect([...both].sort()).toEqual([...ANALYTICS_CONTEXT_KEYS].sort());
  });

  it("stamps the funnel with a subset of the context", () => {
    for (const k of ONBOARDING_EVENT_CONTEXT_KEYS) expect(ANALYTICS_CONTEXT_KEYS).toContain(k);
  });
});

describe("the event catalog", () => {
  it("has snake_case names and props, and at least one known surface per event", () => {
    for (const [name, e] of Object.entries(ANALYTICS_EVENTS)) {
      expect(name).toMatch(snake);
      expect(e.surfaces.length).toBeGreaterThan(0);
      for (const s of e.surfaces) expect(ANALYTICS_SURFACES).toContain(s);
      for (const p of e.props) expect(p).toMatch(snake);
    }
  });

  it("never lists a context key as an event prop — the context rides every event already", () => {
    for (const e of Object.values(ANALYTICS_EVENTS)) {
      for (const p of e.props) expect(ANALYTICS_CONTEXT_KEYS as readonly string[]).not.toContain(p);
    }
  });

  it("carries the onboarding step on both surfaces", () => {
    expect(ANALYTICS_EVENTS.onboarding_step.surfaces).toEqual(["app", "web"]);
  });
});

describe("parseClientTag", () => {
  it("keeps a version, a build number and an update id", () => {
    expect(parseClientTag("1.4.2")).toBe("1.4.2");
    expect(parseClientTag("187")).toBe("187");
    expect(parseClientTag("0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0")).toBe("0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0");
  });

  it("drops anything absent, empty, too long, or outside a tag's alphabet", () => {
    expect(parseClientTag(null)).toBeNull();
    expect(parseClientTag(undefined)).toBeNull();
    expect(parseClientTag("")).toBeNull();
    expect(parseClientTag("x".repeat(65))).toBeNull();
    expect(parseClientTag("1.0 <script>")).toBeNull();
    expect(parseClientTag("a\nb")).toBeNull();
  });
});
