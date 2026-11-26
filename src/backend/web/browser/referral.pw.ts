// Refer a friend on /start (#899), end to end in a real browser: the friend's link opens the
// invite page, "Start on the web" carries the code through the whole walk, and the step after the
// country applies it silently (#3195).
import { expect, onboard, sessionToken, test } from "./fixtures.ts";

// The fixture answers are metric; en-GB is the locale that draws them, as the other walks pin it.
test.use({ locale: "en-GB" });

test("a friend's link: invite page, the walk, the step prefilled, applied", async ({ page }) => {
  // The referrer: any account holds a code.
  const auth = await page.request.post("/v1/auth/device", {
    data: { deviceId: crypto.randomUUID() + crypto.randomUUID(), locale: "en" },
  });
  const { token } = await auth.json() as { token: string };
  const me = await (await page.request.get("/v1/profile", { headers: { authorization: `Bearer ${token}` } })).json();
  const code = String(me.referral.link).slice(-6);

  await page.goto(`/r/${code}`);
  await expect(page.getByText("A friend sent you a week of Calodex")).toBeVisible();
  await page.getByRole("link", { name: "Start on the web" }).click();
  await page.getByRole("link", { name: "Get started", exact: true }).click();
  await onboard(page);
  await page.getByRole("link", { name: "Continue", exact: true }).click();
  // The streak goal sits between the plan and the sign-up, 14 already picked.
  await expect(page).toHaveURL(/\/start\/streak/);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Continue with Google/i }).click();
  await page.getByRole("textbox").fill(`pw-ref-${Date.now()}`);
  await page.getByRole("button").click();
  await expect(page).toHaveURL(/\/start\/country/);
  await page.locator('label.opt:has(input[value="de"])').click();
  await page.locator('main button[type="submit"]').last().click();

  // No step is asked (#3195): the link the walk carried is applied at the country.
  await expect(page).not.toHaveURL(/\/start\/referral/);
  const webToken = await sessionToken(page);
  const mine = await (await page.request.get("/api/v1/profile", { headers: { authorization: `Bearer ${webToken}` } })).json();
  expect(mine.referral.applied).toBe(true);
});
