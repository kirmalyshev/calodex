// The account pane's Pushes tab (ieat-app#3168), driven in a real browser.
//
// Same reason this file exists as admin-order.pw.ts: the admin page is one template literal, so
// no compiler and no unit test ever runs its script. Under test is the page's own rendering —
// every /admin/api/* answer is stubbed: the account list, the profile the pane opens on, and the
// per-account push log the tab draws: every state, the text as sent, the receipt's error, and the
// null text of a transactional send.

import { expect, test, type Page, type Route } from "@playwright/test";
import { adminPage } from "../../api/admin.page.ts";
import { ADMIN_PUSH_LOG_MAX } from "../../engine/index.ts";

const NONCE = "pw-nonce";

/** The policy `adminRoutes` serves the page under. Copied so a CSP violation still fails here. */
const CSP =
  `default-src 'none'; style-src 'nonce-${NONCE}'; script-src 'nonce-${NONCE}'; `
  + "connect-src 'self'; font-src 'self'; img-src data: blob:; base-uri 'none'; form-action 'none'; "
  + "frame-ancestors 'none'";

const USER = "11111111-2222-3333-4444-555555555555";

const USER_ROW = {
  userId: USER, email: "pushes@example.com", lang: "en", createdAt: "2026-11-01T09:00:00.000Z",
  providers: ["apple"], entitled: false, entitlement: null, onboardedAt: null,
  channel: "appstore", channelFirst: null, staff: false, pushOffers: true,
  spent: 0, effective: 3, analysesToday: 0, lastSeen: "2026-11-19T13:00:00.000Z",
};

const PROFILE = {
  userId: USER, email: "pushes@example.com", lang: "en", timezone: "Europe/Berlin",
  createdAt: "2026-11-01T09:00:00.000Z", providers: ["apple"], targets: null,
  entitled: false, entitlement: null, onboardedAt: null, streakDays: 4,
  channel: "appstore", channelFirst: null, staff: false,
};

const CAP = { freeAnalyses: null, spent: 0, effective: 3 };

const SENDS = [
  {
    id: 52, kind: "admin-push", ref: null, templateKey: "re-engage", lang: "en", variant: "b",
    state: "delivered", title: "Still on track?", body: "Your week needs two more days.",
    receiptError: null, createdAt: "2026-11-19T14:20:00.000Z",
    deliveredAt: "2026-11-19T14:22:31.000Z", receiptAt: "2026-11-19T14:21:02.000Z",
  },
  {
    id: 41, kind: "reminder", ref: "streak", templateKey: "streak-save", lang: "en", variant: null,
    state: "failed", title: "Keep the streak", body: "Log dinner to keep 4 days.",
    receiptError: "DeviceNotRegistered", createdAt: "2026-11-18T19:05:00.000Z",
    deliveredAt: null, receiptAt: "2026-11-18T19:05:41.000Z",
  },
  {
    id: 38, kind: "test-push", ref: null, templateKey: "test", lang: "en", variant: "a",
    state: "sent", title: "Test", body: "A push sent from this pane.",
    receiptError: null, createdAt: "2026-11-17T11:00:00.000Z",
    deliveredAt: null, receiptAt: null,
  },
  {
    // A transactional send: title and body stay null by decision in #848 — the row draws a dash,
    // never a template's current text.
    id: 30, kind: "analysis-ready", ref: "meal", templateKey: null, lang: "en", variant: null,
    state: "delivered-to-apns", title: null, body: null,
    receiptError: null, createdAt: "2026-11-16T08:30:00.000Z",
    deliveredAt: null, receiptAt: "2026-11-16T08:30:20.000Z",
  },
  {
    // A dry run is this account's history even though nothing left the server.
    id: 12, kind: "admin-push", ref: "dry", templateKey: "re-engage", lang: "en", variant: "a",
    state: "dry", title: "Dry title", body: "Would have been sent.",
    receiptError: null, createdAt: "2026-11-10T12:00:00.000Z",
    deliveredAt: null, receiptAt: null,
  },
];

async function stub(page: Page, sends: unknown[], calls: string[]) {
  const json = (body: unknown, status = 200) =>
    ({ status, contentType: "application/json", body: JSON.stringify(body) });
  await page.route("**/admin", (r) => r.fulfill({
    status: 200, contentType: "text/html; charset=utf-8",
    headers: { "content-security-policy": CSP }, body: adminPage(NONCE),
  }));
  await page.route("**/start/session/token", (r) => r.fulfill(json({ token: "pw-not-a-real-bearer" })));
  await page.route("**/admin/api/push-templates**", (r) => r.fulfill(json({
    rows: [], langs: ["en"], meta: { placeholders: [] }, keys: [],
  })));
  await page.route("**/admin/api/campaigns**", (r) => r.fulfill(json({ copy: [] })));
  await page.route("**/admin/api/users?*", (r) => r.fulfill(json({
    users: [USER_ROW], nextCursor: null, range: { from: null, to: null, days: null },
  })));
  await page.route(`**/admin/api/users/${USER}`, (r) => r.fulfill(json(PROFILE)));
  await page.route(`**/admin/api/users/${USER}/cap`, (r) => r.fulfill(json(CAP)));
  await page.route(`**/admin/api/users/${USER}/push-log**`, (r: Route) => {
    calls.push(r.request().url());
    return r.fulfill(json({ sends }));
  });
}

/** Console errors are a failure, not noise: this page has no build step to catch them first. */
function watchConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

async function openPushesTab(page: Page) {
  await page.goto("/admin#accounts");
  await expect(page.locator("#app")).toBeVisible();
  await page.locator("#users tbody tr", { hasText: "pushes@example.com" }).click();
  await expect(page.locator("#pane")).toBeVisible();
  await page.locator('#tabs [data-tab="pushes"]').click();
}

test("the Pushes tab lists every send the account has, with its text, state and receipt error", async ({ page }) => {
  const errors = watchConsole(page);
  const calls: string[] = [];
  await stub(page, SENDS, calls);
  await openPushesTab(page);

  // The tab asks for the whole history, not the composer's newest twenty.
  expect(calls).toHaveLength(1);
  expect(calls[0]).toContain(`/admin/api/users/${USER}/push-log?limit=${ADMIN_PUSH_LOG_MAX}`);

  const rows = page.locator("#pushlog tbody tr");
  await expect(rows).toHaveCount(5);

  // Newest first: the delivered admin push leads, with its on-device stamp under the state.
  await expect(rows.nth(0)).toContainText("Still on track?");
  await expect(rows.nth(0)).toContainText("Your week needs two more days.");
  await expect(rows.nth(0)).toContainText("re-engage");
  await expect(rows.nth(0)).toContainText("delivered");
  await expect(rows.nth(0)).toContainText("on device 11-19 14:22");

  // A failure names the receipt's own error; the dry run stays in the history.
  await expect(rows.nth(1)).toContainText("failed");
  await expect(rows.nth(1)).toContainText("DeviceNotRegistered");
  await expect(rows.nth(1)).toContainText("streak");

  // A transactional send has no stored text: a dash, never the template's current wording.
  await expect(rows.nth(3)).toContainText("delivered-to-apns");
  await expect(rows.nth(3).locator("td").nth(5)).toHaveText("—");

  await expect(rows.nth(4)).toContainText("dry");
  await expect(page.locator("#pushlog-status")).toHaveText("5 sends");
  expect(errors).toEqual([]);
});

test("an account nothing was ever sent to says so", async ({ page }) => {
  const errors = watchConsole(page);
  const calls: string[] = [];
  await stub(page, [], calls);
  await openPushesTab(page);

  await expect(page.locator("#pushlog tbody tr")).toHaveCount(0);
  await expect(page.locator("#pushlog-status")).toHaveText("Nothing has been sent to this account.");
  expect(errors).toEqual([]);
});
