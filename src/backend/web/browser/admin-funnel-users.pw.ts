// The per-account funnel (kirmalyshev/calodex#812), driven in a real browser.
//
// Same reason this file exists as admin-range.pw.ts: the admin page is one template literal, so
// no compiler and no unit test ever runs its script. Under test is the page's own rendering —
// every /admin/api/* answer is stubbed: the aggregate's paid step, the per-account list, and the
// stored journal an expanded row draws, with its revisit and back-step marks.

import { expect, test, type Page } from "@playwright/test";
import { adminPage } from "../../api/admin.page.ts";

const NONCE = "pw-nonce";

/** The policy `adminRoutes` serves the page under. Copied so a CSP violation still fails here. */
const CSP =
  `default-src 'none'; style-src 'nonce-${NONCE}'; script-src 'nonce-${NONCE}'; `
  + "connect-src 'self'; font-src 'self'; img-src data: blob:; base-uri 'none'; form-action 'none'; "
  + "frame-ancestors 'none'";

const USER = "11111111-2222-3333-4444-555555555555";
const RANGE = { from: null, to: null, days: 30 };

const FUNNEL = {
  range: RANGE, contentVersion: 7, sessions: 3, completed: 2,
  paid: { converted: 1, trial: 0, lifetime: 0, monthly: 1, yearly: 0, other: 0, medianMs: 7200000 },
  rows: [
    { place: "welcome", views: 3, people: 3, answers: 0, backs: 0, rejects: 0, medianMs: null },
    { place: "summary", views: 3, people: 3, answers: 0, backs: 0, rejects: 0, medianMs: null },
  ],
};

const ACCOUNTS = {
  range: RANGE, nextCursor: null,
  accounts: [{
    userId: USER, lang: "en", country: "de", startedAt: "2026-11-08T10:00:00.000Z",
    lastPlace: "summary", sessions: 1, completed: true, paywall: true,
    paid: { kind: "monthly", productId: "monthly_499", msFromStart: 7200000 },
  }, {
    userId: "99999999-8888-7777-6666-555555555555", lang: "de", country: "at",
    startedAt: "2026-11-07T09:00:00.000Z", lastPlace: "goal", sessions: 2,
    completed: false, paywall: false, paid: null,
  }],
};

const JOURNAL = {
  ...ACCOUNTS.accounts[0],
  events: [
    { sessionId: "sess-aaaa-1", place: "welcome", action: "view", ms: null, field: null, value: null, at: "2026-11-08T10:00:00.000Z" },
    { sessionId: "sess-aaaa-1", place: "goal", action: "view", ms: null, field: null, value: null, at: "2026-11-08T10:00:05.000Z" },
    { sessionId: "sess-aaaa-1", place: "goal", action: "answer", ms: 4200, field: "goal", value: "lose", at: "2026-11-08T10:00:09.000Z" },
    { sessionId: "sess-aaaa-1", place: "goal", action: "back", ms: null, field: null, value: null, at: "2026-11-08T10:00:12.000Z" },
    { sessionId: "sess-aaaa-1", place: "goal", action: "view", ms: null, field: null, value: null, at: "2026-11-08T10:00:15.000Z" },
    { sessionId: "sess-aaaa-1", place: "summary", action: "view", ms: null, field: null, value: null, at: "2026-11-08T10:00:30.000Z" },
    { sessionId: "sess-aaaa-1", place: "summary", action: "complete", ms: null, field: null, value: null, at: "2026-11-08T10:01:00.000Z" },
  ],
};

async function stub(page: Page) {
  const json = (body: unknown) =>
    ({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  await page.route("**/admin", (r) => r.fulfill({
    status: 200, contentType: "text/html; charset=utf-8",
    headers: { "content-security-policy": CSP }, body: adminPage(NONCE),
  }));
  await page.route("**/start/session/token", (r) => r.fulfill(json({ token: "pw-not-a-real-bearer" })));
  await page.route("**/admin/api/push-templates**", (r) => r.fulfill(json({
    rows: [], langs: ["en"], meta: { placeholders: [] }, keys: [],
  })));
  await page.route("**/admin/api/funnel**", (r) => r.fulfill(json(FUNNEL)));
  await page.route("**/admin/api/funnel/users**", (r) => r.fulfill(json(ACCOUNTS)));
  await page.route(`**/admin/api/users/${USER}/onboarding**`, (r) => r.fulfill(json(JOURNAL)));
}

/** Console errors are a failure, not noise: this page has no build step to catch them first. */
function watchConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

test("the funnel shows conversion to paid, the account rows, and an expanded journal", async ({ page }) => {
  const errors = watchConsole(page);
  await stub(page);
  await page.goto("/admin#funnel");
  await expect(page.locator("#app")).toBeVisible();

  // The aggregate's last step is the payment, off the server's own record.
  const path = page.locator("#funnel-path");
  await expect(path).toContainText("Converted to paid");
  await expect(path).toContainText("1 monthly");
  await expect(path).toContainText("2h");

  // One row per account that started: id, where they stopped, the finished/paywall/paid flags.
  const row = page.locator("#funnel-users .fa-row", { hasText: USER.slice(0, 8) });
  await expect(row).toBeVisible();
  await expect(row).toContainText("Saw their plan");
  await expect(row).toContainText("finished");
  await expect(row).toContainText("paywall");
  await expect(row).toContainText("monthly · 2h");

  // A run that stopped before finishing says so — the last screen alone read as an outcome.
  const quit = page.locator("#funnel-users .fa-row", { hasText: "99999999" });
  await expect(quit).toContainText("left at Chose a goal");

  // Expanding fetches the journal: every event in order, grouped by run, with the revisit and
  // the back-step marked — and never an innerHTML sink on the way (server data is textContent).
  await expect(row).toHaveAttribute("aria-expanded", "false");
  await row.click();
  await expect(row).toHaveAttribute("aria-expanded", "true");
  const flow = page.locator(".fa-open");
  await expect(flow).toContainText("run 1");
  await expect(flow).toContainText("back-step");
  // The second `goal` view is the revisit: exactly one "again" mark.
  await expect(flow.locator(".chip", { hasText: "again" })).toHaveCount(1);
  await expect(flow).toContainText("lose");
  await expect(flow).toContainText("4s");

  // The row is a keyboard button too: Enter opens, Enter again closes.
  await row.click();
  await expect(page.locator(".fa-open")).toHaveCount(0);
  await row.press("Enter");
  await expect(page.locator(".fa-open .fl-ev").first()).toBeVisible();

  expect(errors).toEqual([]);
});

test("the account page's Onboarding tab reads the same journal", async ({ page }) => {
  const errors = watchConsole(page);
  await stub(page);
  // The list, then the account's profile and cap — the pane loads them before the tab answers.
  await page.route("**/admin/api/users**", (r) => {
    const p = new URL(r.request().url()).pathname;
    if (p.endsWith("/onboarding")) return r.fulfill(json(JOURNAL));
    if (p.endsWith("/cap")) return r.fulfill(json({ freeAnalyses: null, spent: 0, effective: 20 }));
    if (p.endsWith(`/${USER}`)) return r.fulfill(json({
      createdAt: "2026-11-01T00:00:00.000Z", providers: ["apple"], lang: "en",
      timezone: "Europe/Berlin", streakDays: 3, staff: false,
      onboardedAt: "2026-11-08T10:01:00.000Z", entitled: true,
      entitlement: { trial: false, expiresAt: "2026-12-08T00:00:00.000Z", lifetimeProductId: null },
      targets: { kcal: 2100, goal: "lose", paceKgPerWeek: -0.5 },
    }));
    return r.fulfill(json({
      users: [{
        userId: USER, email: "user@example.com", createdAt: "2026-11-01T00:00:00.000Z",
        providers: ["apple"], spent: 0, effective: 20, analysesToday: 0,
        lastSeen: "2026-11-10T10:00:00.000Z", pushDailyMax: null, pushOffers: false,
        staff: false, streakDays: 3, entitled: true, onboardedAt: "2026-11-08T10:01:00.000Z",
        lang: "en", country: "de",
      }],
      nextCursor: null, range: RANGE,
    }));
  });
  await page.route("**/admin/api/campaigns**", (r) => r.fulfill(json({
    killed: false, campaigns: [], copy: [], range: RANGE,
    options: { langs: ["en"], variants: ["default"], statuses: ["draft"], entitlement: [], streakBands: [], sinceLog: [], staffCount: 0 },
  })));

  await page.goto("/admin#accounts");
  await expect(page.locator("#app")).toBeVisible();
  await page.locator("#users tbody tr").first().click();
  await page.locator('[data-tab="onboarding"]').click();

  // The tab must load THIS account's stored journal — once upon a time it loaded the copy
  // editor's answer instead, because the tab's loader shared loadOnboarding's name.
  const flow = page.locator("#onboarding-flow");
  await expect(flow.locator(".fl-ev")).toHaveCount(7);
  await expect(flow).toContainText("back-step");
  await expect(flow.locator(".chip", { hasText: "again" })).toHaveCount(1);
  await expect(page.locator("#onboarding-summary")).toContainText("monthly · 2h");
  expect(errors).toEqual([]);
});

function json(body: unknown) {
  return { status: 200, contentType: "application/json", body: JSON.stringify(body) } as const;
}
