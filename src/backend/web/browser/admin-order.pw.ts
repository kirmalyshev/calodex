// The arm order editor in /admin (ieat-app#2788), driven in a real browser.
//
// The admin page is one template literal, so no compiler and no unit test ever runs its script —
// the reason admin-prompts.pw.ts and admin-range.pw.ts exist. Every /admin/api/* answer is stubbed;
// what is under test is the page's own JavaScript: the moves, the remove/add of a beat, the body it
// saves, and a refusal landing on the row it names without the order being thrown away.

import { expect, test, type Page, type Route } from "@playwright/test";
import { DEFAULT_ORDER, REMOVABLE_PLACES } from "@eait/shared";
import { adminPage } from "../../api/admin.page.ts";

const NONCE = "pw-nonce";
const CSP =
  `default-src 'none'; style-src 'nonce-${NONCE}'; script-src 'nonce-${NONCE}'; `
  + "connect-src 'self'; font-src 'self'; img-src data: blob:; base-uri 'none'; form-action 'none'; "
  + "frame-ancestors 'none'";
const RANGE = { from: null, to: null, days: null };
const STATS = { assigned: 0, sessions: 0, completed: 0, completed_users: 0, fell_back: 0, rate: null, ci: null };
const TAIL = ["country", "referral", "health", "streak"];
const places = (order: readonly string[]) => [...order, ...TAIL].map((place) => ({
  place, views: 0, people: 0, answers: 0, backs: 0, rejects: 0, medianMs: null,
}));

const EXPERIMENT = {
  experiment: {
    id: "exp-order-1", lang: "en", status: "draft", rules: {}, revision: 1,
    created_by: "a", created_at: "2026-11-11T00:00:00Z", started_at: null, stopped_at: null,
    variants: [],
  },
  arms: [
    { variant: { control: true, weight: 1, content: { version: 41 } }, stats: STATS, places: places(DEFAULT_ORDER) },
    { variant: { weight: 1, content: { version: 42 } }, stats: STATS, places: places(DEFAULT_ORDER) },
  ],
};

async function stub(page: Page, saves: unknown[], answer: (n: number) => { status: number; body: unknown }) {
  const json = (body: unknown, status = 200) => ({ status, contentType: "application/json", body: JSON.stringify(body) });
  await page.route("**/admin", (r) => r.fulfill({
    status: 200, contentType: "text/html; charset=utf-8",
    headers: { "content-security-policy": CSP }, body: adminPage(NONCE),
  }));
  await page.route("**/start/session/token", (r) => r.fulfill(json({ token: "pw-not-a-real-bearer" })));
  await page.route("**/admin/api/push-templates**", (r) => r.fulfill(json({ rows: [], langs: ["en"], meta: { placeholders: [] }, keys: [] })));
  await page.route("**/admin/api/content**", (r) => r.fulfill(json({ langs: ["en"], labels: {}, meta: { screens: [] }, content: { screens: {} } })));
  await page.route("**/admin/api/switches**", (r) => r.fulfill(json({ switches: [], recent: [] })));
  await page.route("**/admin/api/experiments**", (r: Route) => {
    if (r.request().method() === "GET") {
      return r.fulfill(json({ experiments: [EXPERIMENT], range: RANGE, order: { span: DEFAULT_ORDER, removable: REMOVABLE_PLACES } }));
    }
    saves.push(r.request().postDataJSON());
    const a = answer(saves.length);
    return r.fulfill(json(a.body, a.status));
  });
}

function watchConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("422")) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

const rows = (page: Page) => page.locator('[data-order-key="exp-order-1:1"] li').evaluateAll(
  (lis) => lis.map((li) => li.getAttribute("data-place")),
);

test("moves a place, saves the order, and shows a refusal on the row it names", async ({ page }) => {
  const errors = watchConsole(page);
  const saves: unknown[] = [];
  await stub(page, saves, () => ({
    status: 422,
    body: { errors: ["pace must come after target"], refusals: [{ place: "pace", rule: "must-follow", after: "target" }] },
  }));
  await page.goto("/admin#experiments");
  await expect(page.locator('[data-order-key="exp-order-1:1"]')).toBeVisible();
  // The control arm takes no order: one panel, for the variant.
  await expect(page.locator("[data-order-key]")).toHaveCount(1);
  expect(await rows(page)).toEqual([...DEFAULT_ORDER]);

  await page.getByRole("button", { name: "Move pace up" }).click();
  const moved = await rows(page);
  expect(moved.indexOf("pace")).toBeLessThan(moved.indexOf("target"));

  await page.getByRole("button", { name: "Save order" }).click();
  await expect(page.locator('li[data-place="pace"] .order-error')).toHaveText("pace must come after target");
  await expect(page.locator("#exp-errors")).toBeVisible();
  expect(saves).toEqual([{ order: moved }]);
  // Nothing reloaded: the order being arranged is still the one on screen.
  expect(await rows(page)).toEqual(moved);
  expect(errors).toEqual([]);
});

test("removes a beat, adds it back where the default has it, and resets to the default", async ({ page }) => {
  const errors = watchConsole(page);
  const saves: unknown[] = [];
  await stub(page, saves, () => ({ status: 200, body: { ok: true } }));
  await page.goto("/admin#experiments");
  const panel = page.locator('[data-order-key="exp-order-1:1"]');
  await expect(panel).toBeVisible();

  await panel.locator('li[data-place="prelim"]').getByRole("button", { name: "Remove" }).click();
  expect(await rows(page)).not.toContain("prelim");
  await page.getByRole("button", { name: "Add prelim back" }).click();
  expect(await rows(page)).toEqual([...DEFAULT_ORDER]);

  await panel.locator('li[data-place="baseline"]').getByRole("button", { name: "Remove" }).click();
  await page.getByRole("button", { name: "Save order" }).click();
  await expect.poll(() => saves.length).toBe(1);
  expect(saves[0]).toEqual({ order: DEFAULT_ORDER.filter((p) => p !== "baseline") });

  await page.getByRole("button", { name: "Default order" }).click();
  await expect.poll(() => saves.length).toBe(2);
  expect(saves[1]).toEqual({ order: null });
  // Each arm gets its own place table.
  await expect(page.locator("details summary", { hasText: "variant 2" })).toHaveCount(1);
  expect(errors).toEqual([]);
});
