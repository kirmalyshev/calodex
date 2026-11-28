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
import type { WebPaywall } from "@eait/shared";
import { offer } from "../page/offer.ts";
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
  promoCheckoutUrl: null,
  promoYearly: null,
  termsUrl: "https://example.com/terms",
  privacyUrl: "https://example.com/privacy",
};

/** Sign in, arm the profile answer with the paywall block, and open `#/pay` on it. */
async function selling(page: Page, subject: string, patch: Partial<typeof PAYWALL> | Record<string, unknown> = {},
    promo?: Record<string, unknown>): Promise<void> {
  await page.route("**/v1/profile", async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    const uid = body.profile.user_id as string;
    body.paywall = JSON.parse(JSON.stringify({ ...PAYWALL, ...patch }).replaceAll("{userId}", uid));
    if (promo !== undefined) body.promo = promo;
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
  // S4 (#3695): Redeem code first, in its own group; no Restore on the web.
  await expect(links).toHaveCount(3);
  await expect(links.nth(0)).toHaveText("Redeem code");
  await expect(links.nth(1)).toHaveAttribute("href", "https://example.com/terms");
  await expect(page.locator(".pay .paylinks")).not.toContainText("Restore");
});

// ieat-app#3606, board pay-cal-a-newyear: A with values changed while the promotion is live and
// priced — no trial title, its band, the regular yearly price struck before its own, its per-month,
// its footer — and Continue on yearly checks out at plan=newyear. Monthly is unchanged.
const NEWYEAR = { promoCheckoutUrl: "https://pay.example/ny/{userId}", promoYearly: { price: "€23.99", pricePerMonth: "€2.00", percent: 40 } };

test("A · the New Year promotion: its band, the struck yearly price, its price and footer, plan=newyear (#3606)", async ({ page }) => {
  await selling(page, "paywall-newyear", NEWYEAR);
  await expect(page.locator(".pay h1")).toHaveText("Unlock Calodex to continue");
  const yearly = page.locator(".pay .plan2").first();
  await expect(yearly.locator(".band")).toHaveText("New Year −40%");
  await expect(yearly.locator(".nm")).toHaveText("Yearly");
  await expect(yearly.locator(".billed s")).toHaveText("€39.99");
  await expect(yearly.locator(".billed b")).toHaveText("€23.99");
  await expect(yearly.locator(".billed")).toHaveText("€39.99 €23.99 billed yearly");
  await expect(yearly.locator(".pm")).toHaveText("€2.00/mo");
  const cta = page.locator(".pay .cta.p").first();
  await expect(cta).toHaveText("Continue");
  await expect(cta).toHaveAttribute("href", "/start/checkout?plan=newyear");
  await expect(page.locator(".pay .t12.m").first()).toHaveText("€23.99 first year, then €39.99/year. Cancel any time.");

  // Monthly picked: today's monthly — its title, Subscribe, its own link and renewal line.
  await page.locator(".pay .plan2").nth(1).click();
  await expect(page.locator(".pay h1")).toHaveText("Unlock Calodex to continue");
  await expect(cta).toHaveText("Subscribe");
  await expect(cta).toHaveAttribute("href", /pay\.example\/m\//);
  await expect(page.locator(".pay .t12.m").first()).toHaveText("Renews automatically. Cancel any time.");
});

// PaywallPromo.skipTrialStep (ieat-app#3606): × on the promotion's A closes — no B, and the server
// already sends no exit offer while it is live — unless the operator kept the step.
const PROMO = { id: "newyear", percent: 40, trialDays: 0, endsAt: "2027-01-08T00:00:00.000Z", iosCode: null, skipTrialStep: true };

test("A · the promotion with skipTrialStep: × closes, no try-for-free step (#3606)", async ({ page }) => {
  await selling(page, "paywall-newyear-skip", { ...NEWYEAR, exitOffer: null }, PROMO);
  await expect(page.locator(".pay .band")).toHaveText("New Year −40%");
  await page.locator(".pay .x").click();
  await expect(page).not.toHaveURL(/#\/pay/);
});

test("A · the promotion with skipTrialStep off: × walks to B as today (#3606)", async ({ page }) => {
  await selling(page, "paywall-newyear-keep", { ...NEWYEAR, exitOffer: null }, { ...PROMO, skipTrialStep: false });
  await expect(page.locator(".pay .band")).toHaveText("New Year −40%");
  await page.locator(".pay .x").click();
  await expect(page.locator(".pay h1")).toHaveText("We want you to try Calodex for free");
});

test("A · no promotion figures from the server: today's plans, no promotion anywhere (#3606)", async ({ page }) => {
  await selling(page, "paywall-newyear-off", { promoCheckoutUrl: "https://pay.example/ny/{userId}" });
  await expect(page.locator(".pay h1")).toHaveText("Start your 3-day free trial to continue");
  await expect(page.locator(".pay")).not.toContainText("New Year");
  await expect(page.locator(".pay .billed s")).toHaveCount(0);
  await expect(page.locator(".pay .cta.p").first()).toHaveAttribute("href", /pay\.example\/y\//);
});

/** `/start/offer`'s A, rendered by its own module into this origin — the browser suite's backends
    sell nothing, so the page is served the way admin-order.pw.ts serves the admin's. */
async function startOffer(page: Page, patch: Record<string, unknown>): Promise<void> {
  const paywall = { ...PAYWALL, ...patch } as unknown as WebPaywall;
  await page.route("**/start/offer", (r) => r.fulfill({
    status: 200, contentType: "text/html; charset=utf-8",
    body: offer({ step: "plans", paywall, checkoutUrl: "/start/checkout", privacyHref: null, termsHref: null,
      closeHref: "/start/offer?step=try", timezone: "UTC", now: new Date(), lang: "en" }),
  }));
  await page.goto("/start/offer");
}

test("/start/offer · the same New Year A, its footer following the pick, and none once it is off (#3606)", async ({ page }) => {
  await startOffer(page, NEWYEAR);
  await expect(page.locator("h1:visible")).toHaveText("Unlock Calodex to continue");
  const yearly = page.locator(".plan2").first();
  await expect(yearly.locator(".band")).toHaveText("New Year −40%");
  await expect(yearly.locator(".nm")).toHaveText("Yearly");
  await expect(yearly.locator(".billed s")).toHaveText("€39.99");
  await expect(yearly.locator(".billed b")).toHaveText("€23.99");
  await expect(yearly.locator(".pm")).toHaveText("€2.00/mo");
  await expect(page.locator(".note:visible")).toHaveText("€23.99 first year, then €39.99/year. Cancel any time.");
  // Continue submits the checked radio: yearly is plan=newyear.
  await expect(page.locator("input[name=plan]:checked")).toHaveAttribute("value", "newyear");
  await page.route("**/start/checkout?plan=newyear", (r) => r.fulfill({ status: 200, body: "checkout" }));
  await page.locator(".plan2").nth(1).click();
  await expect(page.locator(".note:visible")).toHaveText("Renews automatically. Cancel any time.");
  await yearly.click();
  await page.locator("button[type=submit]").click();
  await expect(page).toHaveURL(/\/start\/checkout\?plan=newyear$/);

  await startOffer(page, { promoCheckoutUrl: "https://pay.example/ny/x" });
  await expect(page.locator("h1:visible")).toHaveText("Start your 3-day free trial to continue");
  await expect(page.locator("body")).not.toContainText("New Year");
  await expect(page.locator(".billed s")).toHaveCount(0);
  await expect(page.locator("input[name=plan]:checked")).toHaveAttribute("value", "yearly");
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
  await expect(page.locator(".pay .paylinks a")).toHaveCount(3);

  // C is A with the offer's values (Kirill q90 = A, ieat-app#3617, #3630; pay-cal-c-notrial): A's
  // photo and rows, the offer on Yearly's row — its percent in the band, twelve monthlies struck
  // before the billed price — Claim to the offer link, and A's one note at the offer's own price.
  await page.locator(".pay .x").click();
  await expect(page.locator(".pay h1")).toHaveText("Unlock Calodex to continue");
  await expect(page.locator(".pay h1")).toBeFocused();
  await expect(page.locator(".pay .hero")).toHaveCount(1);
  const offerRow = page.locator(".pay .plan2").first();
  await expect(offerRow.locator(".band")).toHaveText(/^66% off$/i);
  await expect(offerRow.locator(".nm")).toHaveText("Yearly");
  await expect(offerRow.locator(".billed s")).toHaveText("€59.88");
  await expect(offerRow.locator(".billed")).toHaveText("€59.88 €19.99 billed yearly");
  const claim = page.locator(".pay .cta.p").first();
  await expect(claim).toHaveText("Claim");
  await expect(claim).toHaveAttribute("href", /pay\.example\/u\//);
  const line = page.locator(".pay .pcol > p.t12.m").first();
  await expect(line).toHaveText("€19.99 a year. Renews automatically. Cancel any time.");
  // Monthly stays a choice: the regular monthly, the store's own Subscribe, A's price-free line.
  await page.locator(".pay .plan2").nth(1).click();
  await expect(claim).toHaveText("Subscribe");
  await expect(claim).not.toHaveAttribute("href", /pay\.example\/u\//);
  await expect(line).toHaveText("Renews automatically. Cancel any time.");

  // C's × closes to Home.
  await page.locator(".pay .x").click();
  await expect(page).not.toHaveURL(/#\/pay/);
});

test("A · the billed amount is dark and medium, never lighter than the per-month figure (3.1.2(c), #3442, q54)", async ({ page }) => {
  await selling(page, "paywall-billed");
  const yearly = page.locator(".pay .plan2").first();
  const billed = yearly.locator(".billed");
  await expect(billed).toHaveText("€39.99 billed yearly");
  // Kirill q54: the primary text colour at medium weight (the picked name's own colour), 13px like the per-month figure.
  await expect(billed).toHaveCSS("font-weight", "500");
  await expect(billed).toHaveCSS("font-size", "13px");
  await expect(yearly.locator(".pm")).toHaveCSS("font-size", "13px");
  const ink = await yearly.locator(".nm").evaluate((e: unknown) => (globalThis as unknown as { getComputedStyle(x: unknown): { color: string } }).getComputedStyle(e).color);
  await expect(billed).toHaveCSS("color", ink);
  // Unpicked, it stays dark: only the name and the per-month figure go grey.
  await page.locator(".pay .plan2").nth(1).click();
  await expect(billed).toHaveCSS("color", ink);
});

test("no trial owed: A's × goes straight to C, never through B (#3442)", async ({ page }) => {
  await selling(page, "paywall-notrial", { trialDays: 0 });
  await page.locator(".pay .x").click();
  await expect(page.locator(".pay .plan2 .billed s")).toHaveText("€59.88"); // C: the offer row
  await expect(page.locator(".pay h1")).toBeFocused();
});

test("the offer is drawn once per account: a second visit's × closes (#3442)", async ({ page }) => {
  await selling(page, "paywall-once", { trialDays: 0 });
  await page.locator(".pay .x").click();
  await expect(page.locator(".pay .plan2 .billed s")).toHaveText("€59.88"); // C: the offer row
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

// S4 (kirmalyshev-org/calodex_app#3695): the `Redeem code` link opens a code field; a discount code
// puts RevenueCat's own `discount_code` on every checkout link, and a refusal says its sentence.
test("Redeem code · a discount appends discount_code to the checkout, a refusal says why (#3695)", async ({ page }) => {
  await selling(page, "paywall-redeem");
  await page.route("**/v1/promo/redeem", async (route) => {
    const code = (route.request().postDataJSON() as { code: string }).code;
    if (code === "TEN") {
      await route.fulfill({ status: 200, json: { kind: "discount", code: "TEN", percent: 10, discountCode: "RC_TEN", profile: {} } });
    } else await route.fulfill({ status: 422, json: { error: "promo-unknown" } });
  });
  const form = page.locator(".pay .redeem");
  await expect(form).toBeHidden();
  await page.locator(".pay .paylinks a", { hasText: "Redeem code" }).click();
  await expect(form).toBeVisible();
  await expect(form.locator("input")).toBeFocused();

  await form.locator("input").fill("nope");
  await form.locator("button").click();
  await expect(form.locator("p")).toHaveText("That code isn't valid.");
  await expect(page.locator(".pay .cta.p")).toHaveAttribute("href", /^https:\/\/pay\.example\/y\/[^?]+$/);

  await form.locator("input").fill("TEN");
  await form.locator("button").click();
  await expect(form.locator("p")).toHaveText("10% off, applied at checkout.");
  await expect(page.locator(".pay .cta.p")).toHaveAttribute("href", /pay\.example\/y\/[^?]+\?discount_code=RC_TEN$/);
  // A discount overrides the trial at checkout: the sheet promises none (C's values, percent in the band).
  await expect(page.locator(".pay .plan2 .band").first()).toHaveText("10% off");
  await expect(page.locator(".pay h1")).toHaveText("Unlock Calodex to continue");
  await expect(page.locator(".pay")).not.toContainText(/free trial|days free/i);
  await page.locator(".pay .plan2", { hasText: "Monthly" }).click();
  await expect(page.locator(".pay .cta.p")).toHaveAttribute("href", /pay\.example\/m\/[^?]+\?discount_code=RC_TEN$/);
});

test("Redeem code · a refusal after a discount restores the trial band and the plain links (#3695)", async ({ page }) => {
  await selling(page, "paywall-redeem-undo");
  await page.route("**/v1/promo/redeem", async (route) => {
    const code = (route.request().postDataJSON() as { code: string }).code;
    if (code === "TEN") await route.fulfill({ status: 200, json: { kind: "discount", code: "TEN", percent: 10, discountCode: "RC_TEN", profile: {} } });
    else await route.fulfill({ status: 422, json: { error: "promo-unknown" } });
  });
  await page.locator(".pay .paylinks a", { hasText: "Redeem code" }).click();
  const form = page.locator(".pay .redeem");
  await form.locator("input").fill("TEN");
  await form.locator("button").click();
  await expect(page.locator(".pay .plan2 .band").first()).toHaveText("10% off");
  await form.locator("input").fill("nope");
  await form.locator("button").click();
  await expect(form.locator("p")).toHaveText("That code isn't valid.");
  await expect(page.locator(".pay .plan2 .band").first()).toHaveText("3 days free");
  await expect(page.locator(".pay h1")).toHaveText("Start your 3-day free trial to continue");
  await expect(page.locator(".pay .cta.p")).toHaveAttribute("href", /^https:\/\/pay\.example\/y\/[^?]+$/);
});

const redeemTen = async (page: Page): Promise<void> => {
  await page.route("**/v1/promo/redeem", (route) => route.fulfill({ status: 200,
    json: { kind: "discount", code: "TEN", percent: 10, discountCode: "RC_TEN", profile: {} } }));
  await page.locator(".pay .paylinks a", { hasText: "Redeem code" }).click();
  await page.locator(".pay .redeem input").fill("TEN");
  await page.locator(".pay .redeem button").click();
  await expect(page.locator(".pay .redeem p")).toHaveText("10% off, applied at checkout.");
};

test("Redeem code · a link through /start/checkout names our code, the server maps it (#3695)", async ({ page }) => {
  await selling(page, "paywall-redeem-ny", NEWYEAR);
  await redeemTen(page);
  await expect(page.locator(".pay .cta.p").first()).toHaveAttribute("href", "/start/checkout?plan=newyear&code=TEN");
});

test("Redeem code · a code redeemed on B returns to A with the percent and no trial words (#3695)", async ({ page }) => {
  await selling(page, "paywall-redeem-b");
  await page.locator(".pay .x").click();
  await expect(page.locator(".pay h1")).toHaveText(/try .*for free/i);
  await redeemTen(page);
  await expect(page.locator(".pay h1")).toHaveText("Unlock Calodex to continue");
  await expect(page.locator(".pay .plan2 .band").first()).toHaveText("10% off");
  await expect(page.locator(".pay")).not.toContainText(/free trial|days free|Try for/i);
  await expect(page.locator(".pay .cta.p")).toHaveAttribute("href", /pay\.example\/y\/[^?]+\?discount_code=RC_TEN$/);
});
