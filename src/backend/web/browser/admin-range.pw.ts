// The shared From/To control in /admin (ieat-app#2776), driven in a real browser.
//
// Same reason this file exists as admin-prompts.pw.ts: the admin page is one template literal, so
// no compiler and no unit test ever runs its script. What is under test is the CONTROL, not the
// endpoints — every /admin/api/* answer is stubbed, and the assertions are on which query string
// the page sends, what the hash carries, and which views the control is allowed on.
//
// The seven ranged views all answer the SAME from/to pair; the four content views never show the
// control at all.

import { expect, test, type Page } from "@playwright/test";
import { adminPage } from "../../api/admin.page.ts";

const NONCE = "pw-nonce";

/** The policy `adminRoutes` serves the page under. Copied so a CSP violation still fails here. */
const CSP =
  `default-src 'none'; style-src 'nonce-${NONCE}'; script-src 'nonce-${NONCE}'; `
  + "connect-src 'self'; font-src 'self'; img-src data: blob:; base-uri 'none'; form-action 'none'; "
  + "frame-ancestors 'none'";

const FROM = "2026-11-03T00:00:00.000Z";
const TO = "2026-11-09T00:00:00.000Z";
const RANGE = { from: FROM, to: TO, days: null };

/** The query strings the page sent each admin endpoint, in order. */
type Calls = Record<string, URLSearchParams[]>;

// The `days` a bounded endpoint falls back to when the ask carries nothing, per the routes.
const DEFAULT_DAYS: Record<string, number> = { metrics: 30, funnel: 30, referrals: 7, "push/stats": 7 };

/** What the server would echo back for the ask: `all` reads as unbounded, from/to as sent. */
function echoOf(key: string, q: URLSearchParams) {
  if (q.has("all")) return { from: null, to: null, days: null };
  if (q.get("from") || q.get("to")) return { from: q.get("from"), to: q.get("to"), days: null };
  const days = q.get("days") ? Number(q.get("days")) : DEFAULT_DAYS[key];
  return days ? { from: null, to: null, days } : { from: null, to: null, days: null };
}

async function stubAdmin(page: Page, calls: Calls) {
  const json = (body: unknown, status = 200) =>
    ({ status, contentType: "application/json", body: JSON.stringify(body) });
  const record = (key: string) => (r: import("@playwright/test").Route) => {
    const q = new URL(r.request().url()).searchParams;
    (calls[key] ??= []).push(q);
    const body = BODIES[key];
    return r.fulfill(json(
      body && typeof body === "object" && "range" in body ? { ...body, range: echoOf(key, q) } : body,
    ));
  };

  await page.route("**/admin", (r) => r.fulfill({
    status: 200, contentType: "text/html; charset=utf-8",
    headers: { "content-security-policy": CSP }, body: adminPage(NONCE),
  }));
  await page.route("**/start/session/token", (r) => r.fulfill(json({ token: "pw-not-a-real-bearer" })));
  // The shell's gate answer: the badge reads this on the way in.
  await page.route("**/admin/api/push-templates**", (r) => r.fulfill(json({
    rows: [], langs: ["en"], meta: { placeholders: [] }, keys: [],
  })));
  for (const key of Object.keys(BODIES)) await page.route(`**/admin/api/${key}**`, record(key));
  await page.route("**/admin/api/experiments**", (r) => {
    if (r.request().method() !== "GET") return r.fulfill(json({ experiment: {} }));
    return record("experiments")(r);
  });
}

const BODIES: Record<string, unknown> = {
  "metrics": {
    days: [], range: RANGE,
    d1: { returned: 0, eligible: 0 }, d7: { returned: 0, eligible: 0 },
    latency: { n: 0, queue: { p50: null, p95: null }, firstItem: { p50: null, p95: null }, total: { p50: null, p95: null } },
  },
  "push/stats": { range: RANGE, timezone: "UTC", rows: [] },
  "funnel": { range: RANGE, contentVersion: 1, sessions: 0, completed: 0, rows: [] },
  "experiments": { experiments: [], range: RANGE },
  "campaigns": {
    killed: false, campaigns: [], copy: [], range: RANGE,
    options: {
      langs: ["en"], variants: ["default"], statuses: ["draft"], entitlement: [], streakBands: [],
      sinceLog: [], staffCount: 0,
    },
  },
  "referrals": {
    range: RANGE, timezone: "UTC", days: [], via: [],
    refusals: { unknown: 0, own: 0, already: 0, paid: 0 },
    sharers: 0, sharersJoined: 0, paidMonthly: 0, paidYearly: 0, daysGranted: 0,
  },
  "users": { users: [], nextCursor: null, range: RANGE },
  "content": { langs: ["en"], labels: {}, meta: { screens: [] }, content: { screens: {} } },
  "prompts": { prompts: [] },
  "switches": { switches: [], recent: [] },
};

const VIEW_API: Record<string, string> = {
  numbers: "metrics", pushes: "push/stats", funnel: "funnel", experiments: "experiments",
  campaigns: "campaigns", referrals: "referrals", accounts: "users",
};

/** The panel lives behind the gate and then behind a route. */
async function openAdmin(page: Page, hash: string) {
  await page.goto(`/admin#${hash}`);
  await expect(page.locator("#app")).toBeVisible();
}

/** Console errors are a failure, not noise: this page has no build step to catch them first. */
function watchConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

test("a hash carrying from/to makes every ranged view send them, and the control stays filled", async ({ page }) => {
  const errors = watchConsole(page);
  const calls: Calls = {};
  await stubAdmin(page, calls);

  for (const [view, api] of Object.entries(VIEW_API)) {
    await openAdmin(page, `${view}?from=${encodeURIComponent(FROM)}&to=${encodeURIComponent(TO)}`);
    await expect.poll(() => calls[api]?.length ?? 0, { message: `${view} should have asked ${api}` }).toBeGreaterThan(0);
    const q = calls[api]![0]!;
    expect(q.get("from"), `${view} -> ${api}`).toBe(FROM);
    expect(q.get("to"), `${view} -> ${api}`).toBe(TO);
    // The same ask is still in the boxes — the control is filled, not spent.
    await expect(page.locator("#range-from")).toHaveValue(/^\d{4}-\d\d-\d\d$/);
    await expect(page.locator("#range-to")).toHaveValue(/^\d{4}-\d\d-\d\d$/);
  }
  expect(errors).toEqual([]);
});

test("typing a date re-asks the server from the admin's own midnight, and writes the hash", async ({ page }) => {
  const errors = watchConsole(page);
  const calls: Calls = {};
  await stubAdmin(page, calls);
  await openAdmin(page, "funnel");

  // A date box is a calendar day in the browser's zone; the server gets that day's first instant.
  await page.locator("#range-from").fill("2026-11-03");
  const instant = await page.evaluate(() => new Date(2026, 10, 3).toISOString());

  await expect.poll(() => calls.funnel?.at(-1)?.get("from") ?? null).toBe(instant);
  expect(calls.funnel!.at(-1)!.get("to")).toBeNull();   // an open end stays open
  expect(page.url()).toContain(`from=${encodeURIComponent(instant)}`);
  await expect(page.locator("#range-note")).toContainText("now");
  await expect(page.locator("#range-zone")).toContainText("sent as UTC");
  expect(errors).toEqual([]);
});

test.describe("across a DST change", () => {
  test.use({ timezoneId: "Europe/Berlin" });
  test("To covers its whole day, the 25-hour one included", async ({ page }) => {
    const errors = watchConsole(page);
    const calls: Calls = {};
    await stubAdmin(page, calls);
    await openAdmin(page, "funnel");
    // 25 Oct 2026 is the night Berlin leaves summer time: the day starts at UTC+2, ends at UTC+1.
    await page.locator("#range-from").fill("2026-10-25");
    await page.locator("#range-to").fill("2026-10-25");
    await expect.poll(() => calls.funnel?.at(-1)?.get("to") ?? null).toBe("2026-10-25T22:59:59.999Z");
    expect(calls.funnel!.at(-1)!.get("from")).toBe("2026-10-24T22:00:00.000Z");
    await expect(page.locator("#range-zone")).toContainText("Europe/Berlin");
    expect(errors).toEqual([]);
  });
});

test("Last 24 hours is a rolling instant window, not the day table", async ({ page }) => {
  const errors = watchConsole(page);
  const calls: Calls = {};
  await stubAdmin(page, calls);
  await openAdmin(page, "pushes");

  const before = Date.now();
  await page.locator("#range-24h").click();
  const after = Date.now();
  await expect.poll(() => calls["push/stats"]?.length ?? 0).toBeGreaterThan(0);
  const q = calls["push/stats"]!.at(-1)!;
  const from = Date.parse(q.get("from")!), to = Date.parse(q.get("to")!);
  // A day is 86400 s — the ask is now-minus-a-day to now, to the millisecond.
  expect(to - from).toBe(86_400_000);
  expect(to).toBeGreaterThanOrEqual(before);
  expect(to).toBeLessThanOrEqual(after);
  expect(page.url()).toContain("from=");
  expect(errors).toEqual([]);
});

test("the control is for the ranged views only", async ({ page }) => {
  const errors = watchConsole(page);
  const calls: Calls = {};
  await stubAdmin(page, calls);

  for (const view of ["onboarding", "templates", "prompts", "food"]) {
    await openAdmin(page, view);
    await expect(page.locator("#head-window")).toBeHidden();
  }
  for (const view of Object.keys(VIEW_API)) {
    await openAdmin(page, view);
    await expect(page.locator("#head-window")).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("the scope line quotes the server's echo, and All time clears the boxes", async ({ page }) => {
  const errors = watchConsole(page);
  const calls: Calls = {};
  await stubAdmin(page, calls);
  await openAdmin(page, `funnel?from=${encodeURIComponent(FROM)}&to=${encodeURIComponent(TO)}`);

  await expect(page.locator("#funnel-scope")).toContainText("→");
  await page.locator("#range-all").click();
  await expect.poll(() => calls.funnel?.length ?? 0).toBeGreaterThan(1);
  // Nothing is "no choice yet" — a bounded endpoint would fall back to its `days` default, so
  // All time is a signal of its own and the hash carries it too.
  expect(calls.funnel!.at(-1)!.get("from")).toBeNull();
  expect(calls.funnel!.at(-1)!.get("to")).toBeNull();
  expect(calls.funnel!.at(-1)!.get("all")).toBe("1");
  await expect(page.locator("#range-note")).toHaveText("All time");
  expect(page.url()).toContain("#funnel?all=1");
  expect(errors).toEqual([]);
});

test("a hash carrying all=1 asks for the unbounded window", async ({ page }) => {
  const errors = watchConsole(page);
  const calls: Calls = {};
  await stubAdmin(page, calls);
  await openAdmin(page, "funnel?all=1");

  await expect.poll(() => calls.funnel?.length ?? 0).toBeGreaterThan(0);
  const q = calls.funnel![0]!;
  expect(q.get("all")).toBe("1");
  expect(q.get("from")).toBeNull();
  expect(q.get("to")).toBeNull();
  await expect(page.locator("#range-from")).toHaveValue("");
  await expect(page.locator("#range-to")).toHaveValue("");
  await expect(page.locator("#range-note")).toHaveText("All time");
  expect(errors).toEqual([]);
});

// One case per ranged section: a preset changes the request that section sends and its URL.
for (const [view, api] of Object.entries(VIEW_API)) {
  test(`${view}: 7 days and 30 days re-ask ${api} and land in the URL`, async ({ page }) => {
    const errors = watchConsole(page);
    const calls: Calls = {};
    await stubAdmin(page, calls);
    await openAdmin(page, view);
    for (const [id, days] of [["#range-7d", 7], ["#range-30d", 30]] as const) {
      const n = calls[api]?.length ?? 0;
      await page.locator(id).click();
      await expect.poll(() => calls[api]?.length ?? 0).toBeGreaterThan(n);
      const q = calls[api]!.at(-1)!;
      expect(Date.parse(q.get("to")!) - Date.parse(q.get("from")!)).toBe(days * 86_400_000);
      expect(page.url()).toContain(`#${view}?from=`);
    }
    expect(errors).toEqual([]);
  });
}

test("the window carries to the next section, and a reload keeps it", async ({ page }) => {
  const errors = watchConsole(page);
  const calls: Calls = {};
  await stubAdmin(page, calls);
  await openAdmin(page, "pushes");
  await expect.poll(() => calls["push/stats"]?.length ?? 0).toBe(1);   // read once, before any choice

  await page.locator('[data-nav="funnel"]').first().click();
  await page.locator("#range-from").fill("2026-11-03");
  const instant = await page.evaluate(() => new Date(2026, 10, 3).toISOString());
  await expect.poll(() => calls.funnel?.at(-1)?.get("from") ?? null).toBe(instant);

  // Pushes was "ready" under the old window: it must read again, not show the old numbers.
  await page.locator('[data-nav="pushes"]').first().click();
  await expect.poll(() => calls["push/stats"]?.length ?? 0).toBe(2);
  expect(calls["push/stats"]!.at(-1)!.get("from")).toBe(instant);
  expect(page.url()).toContain(`#pushes?from=${encodeURIComponent(instant)}`);
  await expect(page.locator("#range-from")).toHaveValue("2026-11-03");

  await page.reload();
  await expect(page.locator("#app")).toBeVisible();
  await expect.poll(() => calls["push/stats"]?.length ?? 0).toBe(3);
  expect(calls["push/stats"]!.at(-1)!.get("from")).toBe(instant);
  await expect(page.locator("#range-from")).toHaveValue("2026-11-03");
  expect(errors).toEqual([]);
});

test("Campaigns keeps its head actions under a ranged hash", async ({ page }) => {
  const errors = watchConsole(page);
  const calls: Calls = {};
  await stubAdmin(page, calls);
  await openAdmin(page, `campaigns?from=${encodeURIComponent(FROM)}&to=${encodeURIComponent(TO)}`);
  await expect.poll(() => calls.campaigns?.length ?? 0).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: "Stop all campaigns" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("the presets sit on the boxes' centre line, and the chosen one reads as chosen", async ({ page }) => {
  const errors = watchConsole(page);
  await page.setViewportSize({ width: 1440, height: 800 });
  await stubAdmin(page, {});
  await openAdmin(page, "funnel");
  const mid = async (sel: string) => {
    const b = (await page.locator(sel).boundingBox())!;
    return b.y + b.height / 2;
  };
  expect(Math.abs(await mid("#range-7d") - await mid("#range-from"))).toBeLessThanOrEqual(1);
  expect(Math.abs(await mid("#range-zone") - await mid("#range-from"))).toBeLessThanOrEqual(1);

  await page.locator("#range-30d").click();
  await expect(page.locator("#range-30d")).toHaveClass(/\bon\b/);
  await expect(page.locator("#range-7d")).not.toHaveClass(/\bon\b/);
  // The choice survives a section change, and typing a date clears it.
  await page.locator('[data-nav="pushes"]').first().click();
  await expect(page.locator("#range-30d")).toHaveClass(/\bon\b/);
  await page.locator("#range-from").fill("2026-11-03");
  await expect(page.locator("#range-30d")).not.toHaveClass(/\bon\b/);
  expect(errors).toEqual([]);
});

test("the funnel counts people, not showings, and a negative gap is not a drop", async ({ page }) => {
  const errors = watchConsole(page);
  await stubAdmin(page, {});
  const row = (place: string, views: number, people: number) =>
    ({ place, views, people, answers: 0, backs: 0, rejects: 0, medianMs: null });
  // Registered after stubAdmin, so it wins for this one endpoint.
  await page.route("**/admin/api/funnel**", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({
      range: RANGE, contentVersion: 1, sessions: 4, completed: 1,
      rows: [row("welcome", 5, 3), row("goal", 9, 2), row("sex", 4, 4)],
    }),
  }));
  await openAdmin(page, "funnel");
  await expect(page.locator(".fp-cnt")).toHaveText(["3", "2", "4", "1"]);
  await expect(page.locator(".fp-gap").nth(0)).toContainText("1 left");
  await expect(page.locator(".fp-gap").nth(1)).toContainText("+2 joined here");
  await expect(page.locator(".fp-gap").nth(1)).not.toContainText("-");
  expect(errors).toEqual([]);
});
