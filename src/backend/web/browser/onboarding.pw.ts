// The W2 walk (`#89`), driven in a real browser.
//
// What is here is only what a browser can prove: the welcome draws its photo and chips, the seg
// toggle really re-renders the ruler in the other system, a pick on a card checks the radio inside
// it, and a browser with no script at all still reaches the plan. Markup and arithmetic are unit-tested in `start.test.ts`.

import { expect, onboard, sessionToken, signIn, test } from "./fixtures.ts";

test.describe("the welcome", () => {
  // Under Reduce Motion the welcome is its last frame: the photo with its four estimate chips.
  test("is the photo with its four estimate chips, served from this origin", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/start");
    await expect(page.locator(".whero")).toBeVisible();
    await expect(page.locator(".whero .wchip")).toHaveCount(4);
    expect((await page.request.get("/start/assets/img/hero.webp")).status()).toBe(200);
    await ctx.close();
  });
});

test.describe("the walk", () => {
  test("metric, by clicking what a person clicks, ends on the plan", async ({ page }) => {
    await page.goto("/start");
    await page.locator("a.cta").first().click();
    await expect(page).toHaveURL(/\/start\/q/);
    // The goal cards: clicking the card's label checks the radio inside it.
    await page.locator('label.opt:has(input[value="lose"])').click();
    await expect(page.locator('input[value="lose"]')).toBeChecked();
    await page.locator('main button[type="submit"]').last().click();
    // The next question follows the goal; the how-it-works card waits until after the last one.
    await expect(page.locator('input[name="prompt"]')).toHaveAttribute("value", "sex");
    await onboard(page);
  });

  test("imperial: the toggle redraws the ruler and the answer stores metric", async ({ page }) => {
    await signIn(page, `pw-imperial-${Date.now()}`);
    // To the height screen in metric…
    for (const [id, answer] of Object.entries({ goal: "lose", sex: "male", birth_year: "35" })) {
      // Past an interstitial first, if the redirect left us on one.
      const cta = page.locator("a.cta");
      if (!await page.locator('input[name="prompt"]').count() && await cta.count()) await cta.first().click();
      const openEl = page.locator('input[name="prompt"]').first();
      const open = (await openEl.count()) ? await openEl.getAttribute("value") : null;
      expect(open).toBe(id);
      const row = page.locator(`label.opt:has(input[name="answer"][value="${answer}"])`);
      if (await row.count()) {
        await row.click();
      } else {
        const field = page.locator('input[name="answer"]').first();
        if (await field.isVisible()) await field.fill(answer);
        else await field.evaluate((el, v) => { (el as { value: string }).value = String(v); }, answer);
      }
      await page.locator('main button[type="submit"]').last().click();
    }
    // The cm ruler is up; switching to ft,in redraws the same height the other way.
    await expect(page.locator('input[name="prompt"]')).toHaveAttribute("value", "height_cm");
    await page.locator('form.seg button', { hasText: "ft, in" }).click();
    await expect(page.locator(".bign .bv").first()).toContainText("′");
    // The wire is inches now — 68″ is the 172 cm the store keeps.
    await page.locator('input[name="answer"]').first()
      .evaluate((el) => { (el as { value: string }).value = "68"; });
    await page.locator('main button[type="submit"]').last().click();
    // The choice carries: the weight ruler opens in pounds without being asked again.
    await expect(page.locator('input[name="prompt"]')).toHaveAttribute("value", "weight_kg");
    await expect(page.locator(".bign small").first()).toContainText("lb");
    await page.locator('input[name="answer"]').first()
      .evaluate((el) => { (el as { value: string }).value = "163"; });
    await page.locator('main button[type="submit"]').last().click();
    // … and the stored values are metric, because every unit here is display-only.
    const res = await page.request.get("/v1/profile", {
      headers: { authorization: `Bearer ${await sessionToken(page)}` },
    });
    const body = await res.json();
    expect(Math.abs((body.height_cm ?? body.profile?.height_cm) - 172)).toBeLessThan(1.5);
    expect(Math.abs((body.weight_kg ?? body.profile?.weight_kg) - 73.9)).toBeLessThan(0.6);
  });

  // A ruler is role="slider": a screen reader reads aria-valuetext (68 alone is not a height — "5′ ft
  // 8″ in" is), and the slider keyboard pattern moves Home/End to its ends, not only by one step.
  test("the ruler reads as a height and its keyboard reaches both ends", async ({ page }) => {
    await signIn(page, `pw-slider-${Date.now()}`);
    for (const [id, answer] of Object.entries({ goal: "lose", sex: "male", birth_year: "35" })) {
      const cta = page.locator("a.cta");
      if (!await page.locator('input[name="prompt"]').count() && await cta.count()) await cta.first().click();
      await expect(page.locator('input[name="prompt"]').first()).toHaveAttribute("value", id);
      const row = page.locator(`label.opt:has(input[name="answer"][value="${answer}"])`);
      if (await row.count()) await row.click();
      await page.locator('main button[type="submit"]').last().click();
    }
    await expect(page.locator('input[name="prompt"]')).toHaveAttribute("value", "height_cm");
    const slider = page.getByRole("slider");
    await expect(slider).toHaveAttribute("aria-valuetext", /\d.*cm/);
    await slider.focus();
    await page.keyboard.press("End");
    await expect(slider).toHaveAttribute("aria-valuenow", (await slider.getAttribute("aria-valuemax"))!);
    await page.keyboard.press("Home");
    await expect(slider).toHaveAttribute("aria-valuenow", (await slider.getAttribute("aria-valuemin"))!);
    await page.locator('form.seg button', { hasText: "ft, in" }).click();
    // Spoken, not drawn: "5 ft 8 in", never "5 prime ft 8 double prime in".
    await expect(page.getByRole("slider")).toHaveAttribute("aria-valuetext", /^\d+ ft \d+ in$/);
  });

  // ieat-app#2984: the age wheel was a focusable div with no role or value, and the pace's radios
  // are hidden once the script runs, leaving a track and stops a keyboard could not reach.
  test("the age wheel and the pace are sliders a keyboard and a screen reader can use", async ({ page }) => {
    await signIn(page, `pw-wheel-${Date.now()}`);
    await onboard(page, {}, "birth_year");
    const wheel = page.getByRole("slider");
    await expect(wheel).toHaveAttribute("aria-valuetext", /\d/);
    const age = page.locator('input[name="answer"]').first();
    const before = await age.inputValue();
    await wheel.focus();
    await page.keyboard.press("ArrowUp");
    await expect(age).not.toHaveValue(before);
    await page.keyboard.press("Home");
    await expect(wheel).toHaveAttribute("aria-valuenow", (await wheel.getAttribute("aria-valuemin"))!);
    await expect(age).toHaveValue((await wheel.getAttribute("aria-valuemin"))!);
    await page.keyboard.press("End");
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowUp");
    await page.locator('main button[type="submit"]').last().click();

    await onboard(page, {}, "pace");
    const pace = page.getByRole("slider");
    await expect(pace).toHaveAttribute("aria-valuetext", /\S/);
    await pace.focus();
    await page.keyboard.press("End");
    await expect(page.locator('input[name="answer"][value="push"]')).toBeChecked();
    await expect(pace).toHaveAttribute("aria-valuenow", "2");
    await page.keyboard.press("Home");
    await expect(page.locator('input[name="answer"][value="easy"]')).toBeChecked();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator('input[name="answer"][value="steady"]')).toBeChecked();
  });

  // With the script on, the age is the wheel, which starts at 16 and owns the hidden field: its
  // settle timer writes the row it sits on back into `answer`, so a "14" written under it raced
  // that timer and, on a loaded host, lost (the walk went on to Height). The stop arrives only
  // through the typed field, which is the no-script page, so that is the page this walks.
  test("the under-16 answer stops the walk and deletes the account", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await signIn(page, `pw-under16-${Date.now()}`);
    for (const [id, answer] of Object.entries({ goal: "lose", sex: "male", birth_year: "14" })) {
      const cta = page.locator("a.cta");
      if (!await page.locator('input[name="prompt"]').count() && await cta.count()) await cta.first().click();
      const row = page.locator(`label.opt:has(input[name="answer"][value="${answer}"])`);
      if (await row.count()) await row.click();
      else await page.locator('input[name="answer"]').first().fill(answer);
      await page.locator('main button[type="submit"]').last().click();
    }
    // The token before the stop — after the delete it must resolve nothing.
    const token = await sessionToken(page);
    // 14 is the stop: the confirm is offered once, then the card says nothing was kept.
    await page.getByRole("button", { name: /16 and over|Yes, delete|I'm under/i }).or(
      page.locator('button[name="confirm"]'),
    ).first().click();
    await expect(page.getByText(/16 and over/)).toBeVisible();
    await expect(page.locator('input[name="prompt"]')).toHaveCount(0);
    // The stop is the account deleted, not a screen shown: the session token resolves nothing.
    const res = await page.request.get("/v1/profile", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(401);
    await ctx.close();
  });

  test("no script at all still reaches the plan", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await signIn(page, `pw-nojs-${Date.now()}`);
    await onboard(page);
    await ctx.close();
  });
});

// The walk's numbers are spoken in the units on screen — en-GB pins metric (98 kg,
// not 98 lb), so the answers below are metric numbers and the floors hold.
test.use({ locale: "en-GB" });

