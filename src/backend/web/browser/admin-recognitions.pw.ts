// The recognizer review (ieat-app#3422), driven in a real browser.
//
// Same reason this file exists as admin-funnel-users.pw.ts: the admin page is one template
// literal, so no compiler and no unit test ever runs its script. Under test is the page's own
// rendering — every /admin/api/* answer is stubbed: the list, the detail that carries the raw
// answer, and the photo the review sits beside it.

import { expect, test, type Page } from "@playwright/test";
import { adminPage } from "../../api/admin.page.ts";

const NONCE = "pw-nonce";

/** The policy `adminRoutes` serves the page under. Copied so a CSP violation still fails here. */
const CSP =
  `default-src 'none'; style-src 'nonce-${NONCE}'; script-src 'nonce-${NONCE}'; `
  + "connect-src 'self'; font-src 'self'; img-src data: blob:; base-uri 'none'; form-action 'none'; "
  + "frame-ancestors 'none'";

const USER = "11111111-2222-3333-4444-555555555555";
const MEAL = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

// A 1x1 PNG — the photo route's bytes are a blob either way.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const LIST = {
  recognitions: [{
    id: "7", userId: USER, analysisId: "101", mealId: MEAL,
    model: "qwen/qwen3-vl-235b", promptKey: "analysis", promptVersion: 3,
    kcal: 260, createdAt: "2026-11-20T12:05:00.000Z",
    // The list carries no content — the meal's items belong to the detail read, like the raw text.
    meal: { date: "2026-11-20", kcal: 320, corrected: true, photos: 1 },
  }, {
    id: "6", userId: "99999999-8888-7777-6666-555555555555", analysisId: "99", mealId: null,
    model: "other/model", promptKey: "analysis_lean", promptVersion: null,
    kcal: 0, createdAt: "2026-11-19T09:10:00.000Z",
    meal: null,
  }],
};

const DETAIL = {
  ...LIST.recognitions[0],
  raw: `{"isFood":true,"items":[{"name":"Rice","grams":200}],"kcal":260}`,
  items: [{ name: "Rice", grams: 200, kcal: 260 }],
  meal: { date: "2026-11-20", kcal: 320, corrected: true, items: [{ name: "Rice", grams: 250, kcal: 320 }], photos: 1 },
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
  await page.route("**/admin/api/recognitions/7", (r) => r.fulfill(json(DETAIL)));
  await page.route("**/admin/api/recognitions*", (r) => r.fulfill(json(LIST)));
  await page.route(`**/admin/api/users/${USER}/meals/${MEAL}/photos/0`, (r) => r.fulfill({
    status: 200, contentType: "image/png", body: PNG,
  }));
}

/** Console errors are a failure, not noise: this page has no build step to catch them first. */
function watchConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

test("the list shows each answer with its prompt and the meal's fate", async ({ page }) => {
  const errors = watchConsole(page);
  await stub(page);
  await page.goto("/admin#recognitions");

  const rows = page.locator("#rec-list tbody tr");
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText("qwen/qwen3-vl-235b");
  await expect(rows.first()).toContainText("analysis v3");
  await expect(rows.first()).toContainText("edited");           // a meal the user changed after
  await expect(rows.nth(1)).toContainText("analysis_lean");      // no stored revision — no "v"
  await expect(rows.nth(1)).toContainText("refused");            // an answer that logged no meal
  expect(errors).toEqual([]);
});

test("the model box sends the filter, and a row opens the review", async ({ page }) => {
  const errors = watchConsole(page);
  await stub(page);
  await page.goto("/admin#recognitions");

  const asked: string[] = [];
  page.on("request", (r) => { if (r.url().includes("/admin/api/recognitions?")) asked.push(r.url()); });
  await page.fill("#rec-model", "qwen");
  await page.click("#rec-apply");
  await expect.poll(() => asked.some((u) => u.includes("model=qwen"))).toBe(true);

  await page.locator("#rec-list tbody tr").first().click();
  const pane = page.locator("#rec-detail");
  await expect(pane).toContainText("The model's own answer");
  await expect(pane.locator("pre")).toContainText('"isFood"');
  await expect(pane).toContainText("What the parse kept — 260 kcal");
  await expect(pane).toContainText("What stands now — 320 kcal (edited by the user)");
  // The photo arrived through the scoped per-meal route and sits in the pane.
  await expect(pane.locator("img.shot")).toHaveCount(1);

  // Close takes the pane down and hands the list back — the only way out on a phone.
  await page.click("#rec-close");
  await expect(page.locator("#rec-pane")).toHaveClass(/hidden/);
  await expect(page.locator("#rec-list tbody tr.on")).toHaveCount(0);
  expect(errors).toEqual([]);
});
