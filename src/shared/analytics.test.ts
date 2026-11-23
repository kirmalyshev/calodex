import { describe, expect, it } from "bun:test";
import {
  ANALYTICS_CLIENT_KEYS, ANALYTICS_CONTEXT_KEYS, ANALYTICS_EVENT_OVERRIDES, ANALYTICS_EVENTS, ANALYTICS_SERVER_KEYS, ANALYTICS_SURFACES,
  ONBOARDING_EVENT_CONTEXT_KEYS, assignmentProps, parseClientTag,
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
  it("has snake_case names and props, and a known surface per event unless only the server emits it", () => {
    for (const [name, e] of Object.entries(ANALYTICS_EVENTS)) {
      expect(name).toMatch(snake);
      const server = "server" in e && e.server === true;
      expect(e.surfaces.length > 0 || server).toBe(true);
      if (server) expect(e.surfaces).toEqual([]);
      for (const s of e.surfaces) expect(ANALYTICS_SURFACES).toContain(s);
      for (const p of e.props) expect(p).toMatch(snake);
    }
  });

  it("never lists a context key as an event prop — the context rides every event already", () => {
    for (const e of Object.values(ANALYTICS_EVENTS)) {
      for (const p of e.props) expect(ANALYTICS_CONTEXT_KEYS as readonly string[]).not.toContain(p);
    }
  });

  it("every paywall_* and onboarding_* event stamps the arm and the shown offering itself (ieat-app#3401)", () => {
    const names = Object.keys(ANALYTICS_EVENTS).filter((n) => n.startsWith("paywall_") || n.startsWith("onboarding_"));
    expect(names.length).toBeGreaterThan(0);
    for (const n of names) {
      for (const k of ["experiment_id", "arm", "paywall_offering"] as const) {
        const overrides: readonly string[] | undefined = ANALYTICS_EVENT_OVERRIDES[n as keyof typeof ANALYTICS_EVENT_OVERRIDES];
        expect(overrides, `${n} must stamp ${k}`).toContain(k);
      }
    }
    // The overrides are the ONLY context keys an event may set itself, and every override is a
    // context key on an event the catalog lists.
    for (const [n, keys] of Object.entries(ANALYTICS_EVENT_OVERRIDES)) {
      expect(ANALYTICS_EVENTS, `${n} is no catalog event`).toHaveProperty(n);
      for (const k of keys!) expect(ANALYTICS_CONTEXT_KEYS, `${n}.${k} is no context key`).toContain(k);
    }
  });

  it("assignmentProps emits the three keys — the assignment's values, the shown offering, present-null when unknown", () => {
    expect(assignmentProps({ experiment_id: "exp1", arm: "42" }, "default"))
      .toEqual({ experiment_id: "exp1", arm: "42", paywall_offering: "default" });
    expect(assignmentProps(null, "exit_offer"))
      .toEqual({ experiment_id: null, arm: null, paywall_offering: "exit_offer" });
    expect(assignmentProps(undefined, null))
      .toEqual({ experiment_id: null, arm: null, paywall_offering: null });
  });

  it("carries the onboarding step on both surfaces", () => {
    expect(ANALYTICS_EVENTS.onboarding_step.surfaces).toEqual(["app", "web"]);
  });

  it("carries the sign-ups and the plan on the web too, because /start's server emits them", () => {
    for (const name of ["signup_completed", "signin_completed", "onboarding_plan_completed"] as const) {
      expect(ANALYTICS_EVENTS[name].surfaces).toEqual(["app", "web"]);
    }
  });

  it("lists the subscription lifecycle as the server's alone", () => {
    const server = Object.entries(ANALYTICS_EVENTS).filter(([, e]) => "server" in e).map(([n]) => n);
    expect(server).toContain("subscription_initial_purchase");
    expect(server).toContain("subscription_renewal");
    expect(server).toContain("subscription_cancellation");
    expect(server).toContain("subscription_expiration");
    for (const n of server) expect(n.startsWith("subscription_")).toBe(true);
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
