// The web paywall sheet (ieat-app#3359): `#/pay` drawn as the iOS sheet — the welcome-plate
// hero, the title and its three benefits, Yearly and Monthly side by side with the billed
// amount as each card's figure, the trial on yearly only, and the exit offer on a decline.
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
async function selling(page: Page, subject: string): Promise<void> {
  await page.route("**/v1/profile", async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    const uid = body.profile.user_id as string;
    body.paywall = JSON.parse(JSON.stringify(PAYWALL).replaceAll("{userId}", uid));
    await route.fulfill({ response: res, json: body });
  });
  await signIn(page, subject);
  await page.goto("/#/pay");
}

test("A · the plans on Cal AI's flow: the trial title, Yearly over Monthly, Continue (#3442)", async ({ page }) => {
  await selling(page, "paywall-sheet");

  // The welcome plate the web's own front door shows, read aloud by its figures.
  const img = page.locator(".pay .hero img");
  await expect(img).toHaveAttribute("src", "/start/assets/img/hero.webp");
  await expect(img).toHaveAttribute("alt", "Protein 8 g, Carbs 50 g, Fat 12 g, 345 kcal");

  await expect(page.locator(".pay h1")).toHaveText("Start your 3-day free trial to continue");
  await expect(page.locator(".pay .bl")).toHaveCount(0);

  // Yearly over Monthly: the trial band on Yearly only, its billed price under the name (3.1.2(c)),
  // the per-month figure on the right of each row.
  const cards = page.locator(".pay .plan2");
  await expect(cards).toHaveCount(2);
  const yearly = cards.nth(0);
  const monthly = cards.nth(1);
  await expect(yearly.locator(".band")).toHaveText("3 DAYS FREE");
  await expect(yearly.locator(".nm")).toHaveText("Yearly");
  await expect(yearly.locator(".billed")).toHaveText("€39.99 billed yearly");
  await expect(yearly.locator(".pm")).toHaveText("€3.33/mo");
  await expect(monthly.locator(".band")).toHaveCount(0);
  await expect(monthly.locator(".nm")).toHaveText("Monthly");
  await expect(monthly.locator(".pm")).toHaveText("€4.99/mo");

  // Yearly picked: Continue, the note names the renewal, the link carries this account's id.
  const cta = page.locator(".pay .cta.p").first();
  await expect(cta).toHaveText("Continue");
  await expect(cta).toHaveAttribute("href", /pay\.example\/y\//);
  await expect(page.locator(".pay .t12.m").first()).toContainText("€39.99 a year");

  // Monthly picked: no trial rides it — the unlock title and the monthly renewal note.
  await monthly.click();
  await expect(page.locator(".pay h1")).toHaveText("Unlock Calodex to continue");
  await expect(cta).toHaveAttribute("href", /pay\.example\/m\//);
  await expect(page.locator(".pay .t12.m").first()).toContainText("€4.99 a month");

  // The legal links the operator publishes.
  const links = page.locator(".pay .paylinks a");
  await expect(links).toHaveCount(2);
  await expect(links.nth(0)).toHaveAttribute("href", "https://example.com/terms");
});

test("× walks A → B (try for free) → C (the special offer) → closes (#3442)", async ({ page }) => {
  await selling(page, "paywall-offer");
  await page.locator(".pay .x").click();

  // B: the trial as a timeline, no payment due, the yearly checkout priced at its zero.
  await expect(page.locator(".pay h1")).toHaveText("We want you to try Calodex for free");
  await expect(page.locator(".pay .tl li")).toHaveCount(3);
  await expect(page.locator(".pay .tl li").nth(2)).toContainText("Day 3");
  await expect(page.locator(".pay .nopay")).toHaveText("No payment due now");
  const tryCta = page.locator(".pay .cta.p").first();
  await expect(tryCta).toHaveText("Try for €0.00");
  await expect(tryCta).toHaveAttribute("href", /pay\.example\/y\//);
  await expect(page.locator(".pay .paylinks a")).toHaveCount(2);

  // C: twelve monthlies struck, the offer per year, the monthly-rate line, Claim to the offer link.
  await page.locator(".pay .x").click();
  await expect(page.locator(".pay h1")).toHaveText("Your special offer");
  const offer = page.locator(".pay .offer");
  await expect(offer.locator(".off")).toHaveText("66% OFF");
  await expect(offer.locator("s")).toHaveText("€59.88");
  await expect(offer).toContainText("€19.99");
  await expect(offer).toContainText("66% less than our monthly rate!");
  const claim = page.locator(".pay .cta.p").first();
  await expect(claim).toHaveAttribute("href", /pay\.example\/u\//);

  // C's × closes to Home.
  await page.locator(".pay .x").click();
  await expect(page).not.toHaveURL(/#\/pay/);
});
