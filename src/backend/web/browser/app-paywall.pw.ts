// The web paywall sheet (ieat-app#3359, simplified to the phone's Cal AI sheet by ieat-app#3465):
// `#/pay` a full-screen sheet — no nav, the × top-left over the photo, a phone-width column
// centred at any width — the welcome plate on A only, Yearly over Monthly with the billed
// amount on the row and the saving on its name, the trial on yearly only, renewsPlain under
// the CTA, and the exit offer on a decline.
//
// The plans arrive in `ProfileResponse.paywall` — the suite's demo backend is told nothing about
// them, so the spec injects the block into the real profile answer: the prices and the save
// line are the server's strings, the checkout links carry THIS account's id, and nothing here
// computes a number the server did not already compute.

import type { Page } from "@playwright/test";
import { expect, test, signIn } from "./fixtures.ts";

/** A selling host's `WebPaywall`, `{userId}` intact — filled into the links after sign-in. */
const PAYWALL = {
  trialDays: 3,
  yearly: {
    checkoutUrl: "https://pay.example/y/{userId}",
    price: "€39.99",
    pricePerMonth: "€3.33",
    perMonthSave: "€3.33/month · save 33%",
    save: "save 33%",
  },
  monthly: { checkoutUrl: "https://pay.example/m/{userId}", price: "€4.99" },
  exitOffer: {
    checkoutUrl: "https://pay.example/u/{userId}",
    price: "€19.99",
    regularPrice: "€59.88",
    percentOff: 66,
    perMonth: "€1.67",
  },
  termsUrl: "https://example.com/terms",
  privacyUrl: "https://example.com/privacy",
};

/** Sign in, arm the profile answer with the paywall block, and open `#/pay` on it. */
async function selling(page: Page, subject: string, patch: Partial<typeof PAYWALL> | Record<string, unknown> = {}): Promise<void> {
  await page.route("**/v1/profile", async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    const uid = body.profile.user_id as string;
    body.paywall = JSON.parse(JSON.stringify({ ...PAYWALL, ...patch }).replaceAll("{userId}", uid));
    await route.fulfill({ response: res, json: body });
  });
  await signIn(page, subject);
  await page.goto("/#/pay");
}

test("A · the plans on Cal AI's flow: the trial title, Yearly over Monthly, Continue (#3442)", async ({ page }) => {
  await selling(page, "paywall-sheet");

  // The welcome plate the phone's sheet draws, read aloud by its figures (#3465).
  const img = page.locator(".pay .hero img");
  await expect(img).toHaveAttribute("src", "/start/assets/img/frenchtoast.webp");
  await expect(img).toHaveAttribute("alt", "Protein 10 g, Carbs 53 g, Fat 13 g, 365 kcal");

  // The phone's sheet: no nav while it is up, a phone-width column centred, the × at ITS
  // top-left (on a desktop viewport the sheet is centred, so the × is measured against it).
  await expect(page.locator(".wtop")).not.toBeVisible();
  const sheet = await page.locator(".pay .sheet").boundingBox();
  expect(sheet).not.toBeNull();
  expect(sheet!.width).toBeLessThanOrEqual(430);
  const x = await page.locator(".pay .x").boundingBox();
  expect(x).not.toBeNull();
  expect(x!.x - sheet!.x).toBeLessThan(60);
  expect(x!.y).toBeLessThan(60);

  await expect(page.locator(".pay h1")).toHaveText("Start your 3-day free trial to continue");
  await expect(page.locator(".pay .bl")).toHaveCount(0);

  // Yearly over Monthly: the trial band on Yearly only, its billed price under the name (3.1.2(c)),
  // the per-month figure on the right of each row.
  const cards = page.locator(".pay .plan2");
  await expect(cards).toHaveCount(2);
  const yearly = cards.nth(0);
  const monthly = cards.nth(1);
  await expect(yearly.locator(".band")).toHaveText(/^3 days free$/i);
  await expect(yearly.locator(".band")).toHaveCSS("text-transform", "uppercase");
  await expect(yearly.locator(".nm")).toHaveText("Yearly · save 33%");
  await expect(yearly.locator(".billed")).toHaveText("€39.99 billed yearly");
  await expect(yearly.locator(".pm")).toHaveText("€3.33/mo");
  await expect(monthly.locator(".band")).toHaveCount(0);
  await expect(monthly.locator(".nm")).toHaveText("Monthly");
  await expect(monthly.locator(".pm")).toHaveText("€4.99/mo");

  // Yearly picked: Continue, the price-free renewsPlain under it (#3465), the link carries this
  // account's id.
  const cta = page.locator(".pay .cta.p").first();
  await expect(cta).toHaveText("Continue");
  await expect(cta).toHaveAttribute("href", /pay\.example\/y\//);
  await expect(page.locator(".pay .t12.m").first()).toHaveText("Renews automatically. Cancel any time.");

  // Monthly picked: no trial rides it — the unlock title and the store's own Subscribe.
  await monthly.click();
  await expect(page.locator(".pay h1")).toHaveText("Unlock Calodex to continue");
  await expect(cta).toHaveText("Subscribe");
  await expect(cta).toHaveAttribute("href", /pay\.example\/m\//);
  await expect(page.locator(".pay .t12.m").first()).toHaveText("Renews automatically. Cancel any time.");

  // The legal links the operator publishes.
  const links = page.locator(".pay .paylinks a");
  await expect(links).toHaveCount(2);
  await expect(links.nth(0)).toHaveAttribute("href", "https://example.com/terms");
});

test("× walks A → B (try for free) → C (the special offer) → closes (#3442)", async ({ page }) => {
  await selling(page, "paywall-offer");
  await page.locator(".pay .x").click();

  // B: the trial as a timeline with an icon per step, no payment due, the yearly checkout priced
  // at its zero. No photo on B — only A carries it (#3465).
  await expect(page.locator(".pay h1")).toHaveText("We want you to try Calodex for free");
  await expect(page.locator(".pay .hero")).toHaveCount(0);
  await expect(page.locator(".pay .tl li")).toHaveCount(3);
  await expect(page.locator(".pay .tl li .td .ico")).toHaveCount(3);
  // 3.1.2(c): the billed amount and its day are the Day-3 step's own line — said once.
  await expect(page.locator(".pay .tl li").nth(2)).toContainText("Day 3");
  await expect(page.locator(".pay .tl li").nth(2).locator(".num"))
    .toHaveText(/^Then €39\.99 a year from \d{1,2} \p{L}+/u);
  await expect(page.locator(".pay .nopay").first()).toHaveText("No payment due now");
  await expect(page.locator(".pay .nopay.num")).toHaveCount(0);
  // The × swapped the whole column: the new title holds focus, so a screen reader announces it.
  await expect(page.locator(".pay h1")).toBeFocused();
  const tryCta = page.locator(".pay .cta.p").first();
  await expect(tryCta).toHaveText("Try for €0.00");
  await expect(tryCta).toHaveAttribute("href", /pay\.example\/y\//);
  await expect(page.locator(".pay .t12.m").first()).toHaveText("Renews automatically. Cancel any time.");
  await expect(page.locator(".pay .paylinks a")).toHaveCount(2);

  // C: twelve monthlies struck, the offer per year, the monthly-rate line, Claim to the offer
  // link — no subtitle, no photo, one legal line at the offer's own price (#3465).
  await page.locator(".pay .x").click();
  await expect(page.locator(".pay h1")).toHaveText("Your special offer");
  await expect(page.locator(".pay .hero")).toHaveCount(0);
  await expect(page.locator(".pay .sub")).toHaveCount(0);
  const offer = page.locator(".pay .offer");
  await expect(offer.locator(".off")).toHaveText(/^66% off$/i);
  await expect(offer.locator(".off")).toHaveCSS("text-transform", "uppercase");
  await expect(offer.locator("s")).toHaveText("€59.88");
  await expect(offer).toContainText("€19.99");
  await expect(offer).toContainText("66% less than our monthly rate!");
  const claim = page.locator(".pay .cta.p").first();
  await expect(claim).toHaveAttribute("href", /pay\.example\/u\//);
  await expect(page.locator(".pay .t13.m").last())
    .toHaveText("€19.99 a year. Renews automatically. Cancel any time.");

  // C's × closes to Home.
  await page.locator(".pay .x").click();
  await expect(page).not.toHaveURL(/#\/pay/);
});

test("A · the billed amount weighs what the per-month figure weighs (3.1.2(c), #3442)", async ({ page }) => {
  await selling(page, "paywall-billed");
  const yearly = page.locator(".pay .plan2").first();
  const billed = yearly.locator(".billed");
  await expect(billed).toHaveText("€39.99 billed yearly");
  await expect(billed).toHaveCSS("font-weight", "600");
  await expect(billed).toHaveCSS("font-size", "14px");
  await expect(yearly.locator(".pm")).toHaveCSS("font-size", "14px");
});

test("no trial owed: A's × goes straight to C, never through B (#3442)", async ({ page }) => {
  await selling(page, "paywall-notrial", { trialDays: 0 });
  await page.locator(".pay .x").click();
  await expect(page.locator(".pay h1")).toHaveText("Your special offer");
  await expect(page.locator(".pay h1")).toBeFocused();
});

test("the offer is drawn once per account: a second visit's × closes (#3442)", async ({ page }) => {
  await selling(page, "paywall-once", { trialDays: 0 });
  await page.locator(".pay .x").click();
  await expect(page.locator(".pay h1")).toHaveText("Your special offer");
  await page.goto("/#/");
  await page.goto("/#/pay");
  await page.locator(".pay .x").click();
  await expect(page).not.toHaveURL(/#\/pay/);
});

test("no exit offer from the server: B's × closes (#3442)", async ({ page }) => {
  await selling(page, "paywall-nooffer", { exitOffer: null });
  await page.locator(".pay .x").click();
  await expect(page.locator(".pay h1")).toHaveText("We want you to try Calodex for free");
  await page.locator(".pay .x").click();
  await expect(page).not.toHaveURL(/#\/pay/);
});
