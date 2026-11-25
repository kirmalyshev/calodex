// The onboarding copy view in /admin loads every language and names a failure truthfully (ieat-app#3582).

import { expect, test, type Page } from "@playwright/test";
import { LANGS, ROUTES } from "@eait/shared";
import { adminPage } from "../../api/admin.page.ts";
import { configDefaults } from "../../config.ts";
import { demoPorts } from "../../llm/demo.ts";
import { memoryStore } from "../../store.memory.ts";
import { createRouter } from "../../api/routes.ts";
import { fakePush } from "../../push/fake.ts";
import { logMail } from "../../mail/log.ts";
import type { Verifier } from "../../auth/verify.ts";

const NONCE = "pw-nonce";
const CSP =
  `default-src 'none'; style-src 'nonce-${NONCE}'; script-src 'nonce-${NONCE}'; `
  + "connect-src 'self'; font-src 'self'; img-src data: blob:; base-uri 'none'; form-action 'none'; "
  + "frame-ancestors 'none'";

const verifier: Verifier = {
  async verify() { throw new Error("unused"); },
  async verifyAppleNotification() { throw new Error("unused"); },
};

async function realContent() {
  const store = memoryStore();
  const config = { ...configDefaults(), port: 0, databaseUrl: "memory://pw", llmProvider: "demo" as const, llmModel: "demo", llmApiKey: "unused" };
  const handle = createRouter({ store, config, llm: demoPorts(), push: fakePush(), mail: logMail() }, store, verifier);
  const res = await handle(new Request(`http://localhost${ROUTES.authDevice}`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ deviceId: crypto.randomUUID() + crypto.randomUUID(), locale: "en" }),
  }));
  const token = (await res.json() as { token: string }).token;
  await store.setRole((await store.userIdForToken(token))!, "admin");
  return (lang: string) => handle(new Request(`http://localhost/admin/api/content?lang=${lang}`, {
    headers: { authorization: `Bearer ${token}` },
  })).then((r) => r.text());
}

async function stub(page: Page, content: (lang: string) => Promise<string>) {
  const json = (body: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  await page.route("**/admin", (r) => r.fulfill({
    status: 200, contentType: "text/html; charset=utf-8",
    headers: { "content-security-policy": CSP }, body: adminPage(NONCE),
  }));
  await page.route("**/start/session/token", (r) => r.fulfill(json({ token: "pw-not-a-real-bearer" })));
  await page.route("**/admin/api/push-templates**", (r) => r.fulfill(json({ rows: [], langs: ["en"], meta: { placeholders: [] }, keys: [] })));
  await page.route("**/admin/api/switches**", (r) => r.fulfill(json({ switches: [], recent: [] })));
  await page.route("**/admin/api/content**", async (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: await content(new URL(r.request().url()).searchParams.get("lang") ?? "en"),
  }));
}

for (const lang of LANGS) {
  test(`onboarding copy loads in ${lang}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await stub(page, await realContent());
    await page.goto(`/admin#onboarding`);
    await expect(page.locator("#screens > *").first()).toBeAttached({ timeout: 10_000 });
    expect(errors).toEqual([]);
    await expect(page.locator("#state-onboarding .aerr")).toHaveCount(0);
  });
}

test("a throw while rendering the copy is not reported as a network failure", async ({ page }) => {
  await stub(page, async () => JSON.stringify({ langs: ["en"], labels: {}, meta: {}, content: {} }));
  await page.goto(`/admin#onboarding`);
  const bar = page.locator("#state-onboarding .aerr");
  await expect(bar).toContainText("The page failed:");
  await expect(bar).not.toContainText("did not get an answer");
});

test("every onboarding section in the nav opens exactly one panel with its host", async ({ page }) => {
  await stub(page, await realContent());
  await page.goto(`/admin#onboarding`);
  const nav = page.locator("#ob-nav button");
  await expect(nav.first()).toBeVisible({ timeout: 10_000 });
  const n = await nav.count();
  expect(n).toBeGreaterThan(6);
  for (let i = 0; i < n; i++) {
    await nav.nth(i).click();
    const open = page.locator("#body-onboarding [data-sec]:not(.hidden)");
    await expect(open).toHaveCount(1);
    await expect(open.locator(":scope > div[id]:not([id^=ob-])").first()).not.toBeEmpty();
  }
});

test("a request that gets no answer is still reported as one", async ({ page }) => {
  await stub(page, await realContent());
  await page.route("**/admin/api/content**", (r) => r.abort());
  await page.goto(`/admin#onboarding`);
  await expect(page.locator("#state-onboarding .aerr")).toContainText("did not get an answer");
});
