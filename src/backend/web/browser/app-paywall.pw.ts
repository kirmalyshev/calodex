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
    price: "€23.99",
    regularPrice: "€39.99",
    percentOff: 40,
    perMonth: "€2.00",
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

test("draws the sheet: hero, benefits, the plan pair, trial wording", async ({ page }) => {
  await selling(page, "paywall-sheet");

  // The welcome plate the web's own front door shows, read aloud by its figures.
  const img = page.locator(".pay .hero img");
  await expect(img).toHaveAttribute("src", "/start/assets/img/hero.webp");
  await expect(img).toHaveAttribute("alt", "Protein 8 g, Carbs 50 g, Fat 12 g, 345 kcal");

  await expect(page.locator(".pay h1")).toHaveText("Know if every meal fits");
  const benefits = page.locator(".pay .bl li");
  await expect(benefits).toHaveCount(3);
  await expect(benefits.nth(0)).toContainText("One photo logs a meal");

  // Yearly and Monthly side by side, the billed amount the card's figure. The trial badge
  // rides yearly only — monthly has no trial on the web sheet.
  const cards = page.locator(".pay .plan2");
  await expect(cards).toHaveCount(2);
  const yearly = cards.nth(0);
  const monthly = cards.nth(1);
  await expect(yearly.locator(".nm")).toHaveText("Yearly");
  await expect(yearly.locator(".tr")).toHaveText("3 days free");
  await expect(yearly.locator(".pr")).toContainText("€39.99");
  await expect(yearly.locator(".pr")).toContainText("a year");
  await expect(yearly.locator(".pr .save")).toHaveText("€3.33/month · save 33%");
  await expect(monthly.locator(".nm")).toHaveText("Monthly");
  await expect(monthly.locator(".tr")).toHaveCount(0);
  await expect(monthly.locator(".pr")).toContainText("€4.99");
  await expect(monthly.locator(".pr")).toContainText("a month");

  // Yearly picked: the CTA promises the trial, the note names its renewal price and cadence,
  // and the link carries this account's id — which the route filled for it.
  const cta = page.locator(".pay .cta.p").first();
  await expect(cta).toHaveText("Try 3 days free");
  await expect(cta).toHaveAttribute("href", /pay\.example\/y\//);
  await expect(page.locator(".pay .t12.m").first()).toContainText("€39.99 a year");

  // Monthly picked: no trial rides it — plain Continue and the monthly renewal note.
  await monthly.click();
  await expect(cta).toHaveText("Continue");
  await expect(cta).toHaveAttribute("href", /pay\.example\/m\//);
  await expect(page.locator(".pay .t12.m").first()).toContainText("€4.99 a month");

  // The legal links the operator publishes.
  const links = page.locator(".pay .paylinks a");
  await expect(links).toHaveCount(2);
  await expect(links.nth(0)).toHaveAttribute("href", "https://example.com/terms");
});

test("a decline swaps the plans for the exit offer", async ({ page }) => {
  await selling(page, "paywall-offer");
  await page.locator(".pay .x").click();
  const offer = page.locator(".pay .offer");
  await expect(offer).toContainText("€23.99");
  await expect(offer).toContainText("€2.00");
  const claim = page.locator(".pay .cta.p").first();
  await expect(claim).toHaveAttribute("href", /pay\.example\/u\//);
});
