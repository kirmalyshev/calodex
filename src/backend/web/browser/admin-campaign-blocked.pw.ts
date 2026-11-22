// A campaign whose template is incomplete shows as "blocked", not as its raw status (ieat-app#3382).
//
// Same reason admin-range.pw.ts exists: the page is one template literal, so only a real browser
// run proves the chip. Every /admin/api/* answer is stubbed; what is under test is the chip.

import { expect, test } from "@playwright/test";
import { adminPage } from "../../api/admin.page.ts";

const NONCE = "pw-nonce";
const CSP =
  `default-src 'none'; style-src 'nonce-${NONCE}'; script-src 'nonce-${NONCE}'; `
  + "connect-src 'self'; font-src 'self'; img-src data: blob:; base-uri 'none'; form-action 'none'; "
  + "frame-ancestors 'none'";

const CAMPAIGN = {
  id: "c1", name: "Win-back", templateKey: "campaign:win-back", segment: {},
  localSendTime: "18:30", rolloutPct: 100, promotional: false, variants: 1, holdoutPct: 0,
  status: "running", blocked: true, createdBy: "t", createdAt: "x", updatedAt: "x",
  report: { sent: 0, accepted: 0, dead: 0, dry: 0, opened: 0, test: 0, held: 0, groups: [] },
  effect: null,
};

test("a blocked campaign wears a blocked chip in the list and in the detail", async ({ page }) => {
  const json = (body: unknown, status = 200) =>
    ({ status, contentType: "application/json", body: JSON.stringify(body) });
  await page.route("**/admin/api/**", (r) => r.fulfill(json({})));
  await page.route("**/admin/api/campaigns**", (r) => r.fulfill(json({
    killed: false, range: { from: null, to: null, days: 30 },
    copy: [{ key: "campaign:win-back", rows: [], gaps: ["de/default"], langs: ["de"], sendable: false }],
    campaigns: [CAMPAIGN],
    options: { langs: ["en"], variants: ["default"], statuses: ["draft"], entitlement: [], streakBands: [], sinceLog: [], staffCount: 0 },
  })));
  await page.route("**/admin", (r) => r.fulfill({
    status: 200, contentType: "text/html; charset=utf-8",
    headers: { "content-security-policy": CSP }, body: adminPage(NONCE),
  }));
  await page.route("**/start/session/token", (r) => r.fulfill(json({ token: "pw" })));

  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("/admin#campaigns");
  await expect(page.locator("#app")).toBeVisible();

  const chip = page.locator("#camp-list .chip", { hasText: "blocked" });
  await expect(chip).toHaveText("blocked");
  await expect(page.locator("#camp-list .chip", { hasText: "running" })).toHaveCount(0);
  await page.locator("#camp-list .citem").click();
  await expect(page.locator("#camp-detail .ph .chip")).toHaveText("blocked");
  expect(errors).toEqual([]);
});
