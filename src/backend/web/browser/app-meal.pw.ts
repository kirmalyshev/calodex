// The web application's meal detail — `#/meal/:id` (Register P's W6, #93).
//
// The board is master-detail: the day's meals stay in a column on the left while the card on the
// right carries the photo, the kcal, the three macro tiles, the ingredients with their own kcal,
// the computed score row, the verdict dots and the one fix — "Correct this meal", which opens the
// conversation. The "…" menu holds Edit, Re-read the photo, Move to yesterday and Delete, which
// asks first. A deleted, moved-away or FOREIGN id reads as gone, never as somebody else's meal.

import { execSync } from "node:child_process";
import type { Page } from "@playwright/test";
import type { DayResponse } from "@eait/shared/contract";
import { wholeNumbers } from "@eait/shared";
import { expect, logMeal, onboardFast, sessionToken, signIn, test } from "./fixtures.ts";

// The review shots (#93's gate). `test-results/` is gitignored; the names carry the sha instead
// of the files living in the tree — and they wait out the boards' rise delays so a card is not
// caught mid-fade.
const SHA = execSync("git rev-parse --short HEAD").toString().trim();
const shot = async (page: Page, name: string): Promise<void> => {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `test-results/shots/w6-${SHA}-${name}.png`, fullPage: true });
};

/** Today's day, fetched under this page's session. */
async function day(page: Page, date = ""): Promise<DayResponse> {
  const res = await page.request.get(`/v1/diary/day${date ? `?date=${date}` : ""}`, {
    headers: { authorization: `Bearer ${await sessionToken(page)}` },
  });
  expect(res.status()).toBe(200);
  return (await res.json()) as DayResponse;
}

/** One photo meal on the page's account, opened at its detail. */
async function openMeal(page: Page): Promise<{ id: string; date: string }> {
  await logMeal(page);
  const d = await day(page);
  const id = d.meals[0]!.id;
  await page.goto(`/#/meal/${id}`);
  await expect(page.locator(".hsr")).toBeVisible();
  return { id, date: d.date };
}

test("the meal opens: photo, kcal, macro tiles, ingredients, verdicts, score", async ({ inWebApp: page }) => {
  const { id } = await openMeal(page);
  // The day's row stays in view on the left; the detail carries the figures and the one fix.
  await expect(page.locator(".meal").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Correct this meal" })).toBeVisible();
  // The health score row is drawn from the server's MealRecord.healthScore, never computed here.
  const record = (await day(page)).meals.find((m) => m.id === id)!;
  await expect(page.locator(".hsr")).toContainText(`${record.healthScore!.score}/10`);
  // The verdict dots are the server's `verdictLabels`, read back off the API's day — words AND
  // tone, never recomputed on the page (#152).
  const labels = record.verdictLabels ?? [];
  const dots = page.locator(".msheet .vs .v");
  await expect(dots).toHaveCount(labels.length);
  for (const [i, v] of labels.entries()) {
    await expect(dots.nth(i)).toHaveText(v.label);
    await expect(dots.nth(i)).toHaveClass(new RegExp(`\\bv ${v.tone}\\b`));
  }
  // Page 1 is the macro trio; page 2 is the meal's four nutrient figures (ieat-app#3676). The
  // click is proven by the pager's own state — both pages are in the DOM, so their text alone
  // would pass even if the page never turned.
  const macros = page.locator(".mtilepage").first();
  const micro = page.locator(".mtilepage").nth(1);
  await expect(macros.locator(".mcard")).toHaveCount(3);
  await expect(micro.locator(".mcard")).toHaveCount(4);
  await expect(macros).toHaveAttribute("aria-hidden", "false");
  await expect(micro).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByRole("button", { name: "Page 1 of 2" })).toHaveAttribute("aria-current", "true");
  await page.getByRole("button", { name: "Page 2 of 2" }).click();
  await expect(macros).toHaveAttribute("aria-hidden", "true");
  await expect(macros).toHaveAttribute("inert", "");
  await expect(micro).toHaveAttribute("aria-hidden", "false");
  await expect(page.getByRole("button", { name: "Page 2 of 2" })).toHaveAttribute("aria-current", "true");
  await expect(page.locator(".mtiletrack")).not.toHaveCSS("transform", "none");
  // The page itself lands under the clip: a wrong distance still has a transform and both pages'
  // text in the DOM, so state alone cannot catch a misaligned track.
  const xGap = async (what: "micro" | "macro") => {
    const tilesBox = await page.locator(".mtiles").boundingBox();
    const box = await (what === "micro" ? micro : macros).boundingBox();
    if (tilesBox === null || box === null) return 9999;
    const want = what === "micro" ? tilesBox.x : tilesBox.x - tilesBox.width;
    return Math.abs(box.x - want);
  };
  await expect.poll(() => xGap("micro"), { timeout: 2000 }).toBeLessThan(1);
  await expect.poll(() => xGap("macro"), { timeout: 2000 }).toBeLessThan(1);
  await expect(micro).toContainText("Fibre");
  await expect(micro).toContainText("Sugar");
  await expect(micro).toContainText("Sodium");
  await expect(micro).toContainText("Saturated fat");
  const whole = wholeNumbers("en");
  await expect(micro).toContainText(`${whole(record.fiber_g)}g`);
  await expect(micro).toContainText(`${whole(record.sugar_g)}g`);
  await expect(micro).toContainText(`${whole(record.sodium_mg)}mg`);
  await expect(micro).toContainText(`${whole(record.satfat_g)}g`);
  // The arrow key on a focused dot is the same page turn, back to the macros.
  await page.keyboard.press("ArrowLeft");
  await expect(macros).toHaveAttribute("aria-hidden", "false");
  await expect(page.getByRole("button", { name: "Page 1 of 2" })).toHaveAttribute("aria-current", "true");
  await expect(page.locator(".ing").first()).toBeVisible();
  await expect(page.locator(".ing").first()).toContainText("g");
  await expect(page.locator(".ing b").first()).toBeVisible();
  await shot(page, "detail");
});

test("the score row opens the breakdown, and Done closes it", async ({ inWebApp: page }) => {
  await openMeal(page);
  await page.locator(".hsr").click();
  // The overlay names every part: the start, the five nutrients, each with its points.
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // The score's name since #337 — "Meal score" on a meal; "Day score" is the day's.
  await expect(dialog.getByText("Meal score", { exact: true })).toBeVisible();
  await expect(dialog.locator(".hsp")).toHaveCount(6);
  await shot(page, "score");
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("Correct opens the meal's fix panel — the Cal-AI sheet, not a chat (#188)", async ({ inWebApp: page }) => {
  const { id } = await openMeal(page);
  // `?fix` is the deep link the OTHER surfaces take into this panel: going straight to it opens
  // the same dialog over the detail.
  await page.getByRole("link", { name: "Correct this meal" }).click();
  const dialog = page.getByRole("dialog", { name: "Correct this meal" });
  await expect(dialog).toBeVisible();
  // The param is consumed once and stripped — a redraw must not reopen a panel already closed.
  await expect(page).toHaveURL(new RegExp(`#\\/meal\\/${id}\\?d=`));
  await shot(page, "fix");

  // Update queues the sentence as a correction job (ieat-app#1347) and the panel closes on the
  // recomputed detail (no change line, ieat-app#1374).
  const field = dialog.locator(".fixfield");
  await expect(field).toHaveAttribute("placeholder", "Say what was wrong");
  const update = dialog.getByRole("button", { name: "Update" });
  await expect(update).toBeDisabled();
  await field.fill("half that");
  await expect(update).toBeEnabled();
  const sent = page.waitForRequest((r) => r.method() === "POST" && r.url().endsWith("/meals/update/queue"));
  await update.click();
  expect((await sent).postDataJSON()).toMatchObject({ kind: "note", mealId: id, text: "half that" });
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("+ Add More opens ingredient search, and a pick appends through the update queue (#3678)", async ({ inWebApp: page }) => {
  const { id } = await openMeal(page);
  const before = (await day(page)).meals.find((m) => m.id === id)!;

  // Apple is one of the board's suggestions; answer that one catalog lookup with the demo
  // banana row, so the empty state is proven to draw what the catalog returns.
  const token = await sessionToken(page);
  const banana = await page.request.get("/v1/foods?q=banana", { headers: { authorization: `Bearer ${token}` } });
  expect(banana.status()).toBe(200);
  await page.route(/\/api\/v1\/foods\?q=apple/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: await banana.text() });
  });

  // The Cal AI row sits in the Ingredients header, not inside the ⋯ menu.
  const addMore = page.getByRole("button", { name: "+ Add More" });
  await expect(addMore).toBeVisible();
  await addMore.click();

  // Pick mode reuses the food search, worded for an ingredient and carrying no meal logging line.
  const sheet = page.locator(".fs");
  await expect(sheet).toBeVisible();
  await expect(sheet.locator("input")).toHaveAttribute("placeholder", "Search for an ingredient");
  await expect(sheet.getByText("Suggestions", { exact: true })).toBeVisible();
  await expect(sheet.locator(".fs-line")).toHaveCount(0);
  await expect(sheet.locator(".fs-body .fs-row", { hasText: "Banana, raw" })).toBeVisible();

  await sheet.locator("input").fill("banana");
  const row = sheet.locator(".fs-row", { hasText: "Banana, raw" }).first();
  await expect(row).toBeVisible();
  await expect(row.locator("button.fs-add")).toHaveAttribute("aria-label", "Banana, raw");
  const sent = page.waitForRequest((r) => r.method() === "POST" && r.url().endsWith("/meals/update/queue"));
  await row.locator("button.fs-add").click();
  const body = (await sent).postDataJSON() as { edit?: { add?: { ref?: string; grams?: number } }; kind?: string; mealId?: string; clientId?: string };
  expect(body).toMatchObject({ kind: "ingredients", mealId: id });
  expect(body.clientId).toEqual(expect.any(String));
  expect(body.edit?.add).toEqual({ ref: "usda-foundation:demo-banana", grams: 118 });
  await expect(sheet).toHaveCount(0);

  // The queued append settles server-side: the detail redraws with the new row, and the total
  // rises by the catalog serving rather than by anything the client computed.
  await expect.poll(async () => {
    const meal = (await day(page)).meals.find((m) => m.id === id);
    return meal?.items.length ?? 0;
  }).toBe(before.items.length + 1);
  const after = (await day(page)).meals.find((m) => m.id === id)!;
  expect(after.items.at(-1)).toMatchObject({ name: "Banana, raw", grams: 118 });
  expect(after.kcal).toBeGreaterThan(before.kcal);
  await expect(page.locator(".ing").last()).toContainText("Banana, raw");
});

test("+ Add More is unavailable while another update on the meal is open (#3678)", async ({ inWebApp: page }) => {
  await openMeal(page);
  let release!: () => void;
  const hold = new Promise<void>((resolve) => { release = resolve; });
  await page.route(/\/api\/v1\/meals\/update\/queue/, async (route) => {
    await hold;
    await route.continue();
  });
  const addMore = page.getByRole("button", { name: "+ Add More" });
  await addMore.click();
  const sheet = page.locator(".fs");
  await sheet.locator("input").fill("banana");
  const row = sheet.locator(".fs-row", { hasText: "Banana, raw" }).first();
  await row.locator("button.fs-add").click();
  await expect(addMore).toHaveCount(0);
  release();
  await expect(addMore).toBeVisible();
});

test("a failed ingredient append does not offer a blind retry (#3678)", async ({ inWebApp: page }) => {
  const { id: _id } = await openMeal(page);
  await page.route(/\/api\/v1\/meals\/update\/queue/, async (route) => {
    await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "server-error" }) });
  });
  await page.getByRole("button", { name: "+ Add More" }).click();
  const sheet = page.locator(".fs");
  await sheet.locator("input").fill("banana");
  const row = sheet.locator(".fs-row", { hasText: "Banana, raw" }).first();
  await row.locator("button.fs-add").click();

  const queued = page.locator(".meal.q").first();
  await expect(queued).toContainText("Couldn't apply your change");
  await expect(queued).toContainText("may still have gone through");
  await expect(queued.getByRole("button", { name: "Try again" })).toHaveCount(0);
});

test("Escape in the ingredient picker closes the picker, not the meal (#3678)", async ({ inWebApp: page }) => {
  const { id } = await openMeal(page);
  const addMore = page.getByRole("button", { name: "+ Add More" });
  await addMore.click();
  const sheet = page.locator(".fs");
  await expect(sheet).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  expect(page.url()).toContain(`/#/meal/${id}`);
  await expect(addMore).toBeVisible();
  await expect(addMore).toBeFocused();
});

test("+ Add More is absent when the meal already holds the server's item cap (#3678)", async ({ inWebApp: page }) => {
  await logMeal(page);
  const token = await sessionToken(page);
  const d = await day(page);
  const id = d.meals[0]!.id;
  const items = Array.from({ length: 50 }, (_, i) => ({ name: `item ${i + 1}`, grams: 10, kcal: 20 }));
  const res = await page.request.patch(`/v1/meals/${id}`, {
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    data: { items },
  });
  expect(res.status()).toBe(200);

  await page.goto(`/#/meal/${id}`);
  await expect(page.locator(".ingbtn")).toHaveCount(50);
  await expect(page.getByText("Ingredients", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "+ Add More" })).toHaveCount(0);
});

test("a catalog ingredient measures in a named portion, and Done sends portion, count and grams (#3679)", async ({ inWebApp: page }) => {
  const { id } = await openMeal(page);
  const token = await sessionToken(page);
  const add = await page.request.patch(`/v1/meals/${id}`, {
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
    data: { add: { ref: "usda-foundation:demo-banana", grams: 118 } },
  });
  expect(add.status(), await add.text()).toBe(200);
  await page.goto(`/#/meal/${id}`);
  await page.reload();
  await expect(page.locator(".ingbtn").last()).toContainText("Banana, raw");
  await page.locator(".ingbtn").last().click();

  const dialog = page.getByRole("dialog", { name: "Edit ingredient" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Measurement", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "g", exact: true })).toHaveAttribute("aria-pressed", "true");
  const medium = dialog.getByRole("button", { name: "1 medium", exact: true });
  await expect(medium).toBeVisible();
  await medium.click();
  await expect(medium).toHaveAttribute("aria-pressed", "true");
  // The portioned state has ONE amount control, as the board and phone draw it: the grams row is
  // hidden and Number of Servings is the measurement.
  await expect(dialog.locator(".ingserv")).toBeVisible();
  await expect(dialog.locator(".amlab", { hasText: "Amount" })).toBeHidden();
  const count = dialog.locator(".ingserv input");
  await expect(count).toHaveValue("1");
  await count.fill("2");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await shot(page, "ingredient-portion-1440");
  await page.setViewportSize({ width: 390, height: 844 });
  await shot(page, "ingredient-portion-390");
  await page.setViewportSize({ width: 1280, height: 720 });

  const sent = page.waitForRequest((r) => r.method() === "POST" && r.url().endsWith("/meals/update/queue"));
  await dialog.getByRole("button", { name: "Done" }).click();
  const body = (await sent).postDataJSON() as { edit?: { items?: Array<Record<string, unknown>> } };
  const banana = body.edit?.items?.at(-1);
  expect(banana).toMatchObject({
    name: "Banana, raw", grams: 236,
    portion: { label: "1 medium", grams: 118 }, portion_count: 2,
  });
});

test("a zero portion count falls back to grams rather than sending portion_count zero (#3679)", async ({ inWebApp: page }) => {
  const { id } = await openMeal(page);
  const token = await sessionToken(page);
  const add = await page.request.patch(`/v1/meals/${id}`, {
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
    data: { add: { ref: "usda-foundation:demo-banana", grams: 118 } },
  });
  expect(add.status(), await add.text()).toBe(200);
  await page.goto(`/#/meal/${id}`);
  await page.reload();
  await page.locator(".ingbtn").last().click();
  const dialog = page.getByRole("dialog", { name: "Edit ingredient" });
  await dialog.getByRole("button", { name: "1 medium", exact: true }).click();
  await dialog.locator(".ingserv input").fill("0");

  const sent = page.waitForRequest((r) => r.method() === "POST" && r.url().endsWith("/meals/update/queue"));
  await dialog.getByRole("button", { name: "Done" }).click();
  const body = (await sent).postDataJSON() as { edit?: { items?: Array<Record<string, unknown>> } };
  const banana = body.edit?.items?.at(-1);
  expect(banana?.grams).toBe(0);
  expect(banana).not.toHaveProperty("portion");
  expect(banana).not.toHaveProperty("portion_count");
});

test("the servings chip opens Number of Servings on any meal, and Update sends servings alone (#3677)", async ({ inWebApp: page }) => {
  const { id } = await openMeal(page);
  const before = (await day(page)).meals.find((m) => m.id === id)!;

  // The chip sits beside the meal's name on every meal — not only a label scan — and opens the
  // servings panel itself, rather than the Correct form.
  const chip = page.getByRole("button", { name: "Number of Servings: 1" });
  await expect(chip).toBeVisible();
  await chip.click();
  const dialog = page.getByRole("dialog", { name: "Number of Servings" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Per serving:", { exact: false })).toBeVisible();
  await expect(dialog.locator(".svnum")).toHaveText("1");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await shot(page, "servings-1440");
  await page.setViewportSize({ width: 390, height: 844 });
  await shot(page, "servings-390");
  const update = dialog.getByRole("button", { name: "Update" });
  await expect(update).toBeDisabled();

  // Half steps preview the multiplied total without writing anything.
  await dialog.getByRole("button", { name: "More" }).click();
  await expect(dialog.locator(".svnum")).toHaveText("1.5");
  await expect(dialog.locator(".svtotals")).toContainText(`${Math.round(before.kcal * 1.5)}`);
  await expect(update).toBeEnabled();
  expect((await day(page)).meals.find((m) => m.id === id)!.kcal).toBe(before.kcal);

  // The write is the servings field alone: items, totals and verdicts stay server-computed.
  const sent = page.waitForRequest((r) => r.method() === "POST" && r.url().endsWith("/meals/update/queue"));
  await update.click();
  const body = (await sent).postDataJSON() as { edit?: Record<string, unknown> };
  expect(body).toMatchObject({ kind: "ingredients", mealId: id });
  expect(body.edit).toEqual({ servings: 1.5 });
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Correct remains the sentence form; it does not swallow the servings editor. The write itself
  // closed back to the diary, so reopen the meal before opening it.
  await page.goto(`/#/meal/${id}`);
  await expect(page.locator(".hsr")).toBeVisible();
  await page.getByRole("link", { name: "Correct this meal" }).click();
  const correct = page.getByRole("dialog", { name: "Correct this meal" });
  await expect(correct).toBeVisible();
  await expect(correct.getByText("Servings", { exact: true })).toHaveCount(0);
});

test("the time chip changes the meal's day and time, sending an offset and HH:MM, never a date (#3682)", async ({ inWebApp: page }) => {
  const { id, date } = await openMeal(page);
  await page.locator(".mwhen").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const save = dialog.locator(".cta.p");
  await expect(save).toBeDisabled();
  // Today back to the server's 7-day window, and nothing ahead of today.
  await expect(dialog.locator("select option")).toHaveCount(8);
  await dialog.locator("select").selectOption("2");
  await dialog.locator("input[type=time]").fill("07:45");
  await expect(save).toBeEnabled();
  const sent = page.waitForRequest((r) => r.url().endsWith(`/v1/meals/${id}/redate`) && r.method() === "POST");
  const moved = page.waitForResponse((r) => r.url().endsWith(`/v1/meals/${id}/redate`) && r.ok());
  await save.click();
  expect((await sent).postDataJSON()).toEqual({ dayOffset: 2, time: "07:45" });
  const result = (await (await moved).json()) as { kind: string; date?: string };
  expect(result.kind).toBe("redated");
  expect(result.date).not.toBe(date);
  await expect(page).toHaveURL(new RegExp(`#\\/meal\\/${id}\\?d=${result.date}`));
  await expect(page.locator(".mwhen")).toContainText("07:45");
});

test("tapping the meal title renames it, clears back to derived items, and shows Tap to Name when unnamed (#3681)", async ({ inWebApp: page }) => {
  const { id } = await openMeal(page);
  const titleBtn = page.locator(".mtitle");
  await expect(titleBtn).toBeVisible();
  const derived = (await titleBtn.textContent())!.trim();
  expect(derived.length).toBeGreaterThan(0);

  // Tapping the title opens the rename dialog with Update disabled until changed.
  await titleBtn.click();
  const dialog = page.getByRole("dialog", { name: "Name meal" });
  await expect(dialog).toBeVisible();
  const input = dialog.locator(".nmfield");
  await expect(input).toHaveValue("");
  await expect(input).toHaveAttribute("placeholder", derived);
  const update = dialog.getByRole("button", { name: "Update" });
  await expect(update).toBeDisabled();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await shot(page, "rename-1440");
  await page.setViewportSize({ width: 390, height: 844 });
  await shot(page, "rename-390");
  await page.setViewportSize({ width: 1280, height: 720 });

  // Saving sends PATCH /v1/meals/:id with `{ name }` alone and updates both detail and diary list.
  await input.fill("  Post-workout bowl  ");
  await expect(update).toBeEnabled();
  const sent = page.waitForRequest((r) => r.method() === "PATCH" && r.url().endsWith(`/v1/meals/${id}`));
  await update.click();
  expect((await sent).postDataJSON()).toEqual({ name: "Post-workout bowl" });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".mtitle")).toHaveText("Post-workout bowl");
  await expect(page.locator(".mlist .meal").first()).toContainText("Post-workout bowl");

  // Reloading keeps the custom name from the server.
  await page.reload();
  await expect(page.locator(".mtitle")).toHaveText("Post-workout bowl");

  // Clearing the input and saving sends `{ name: null }` and restores the derived title.
  await page.locator(".mtitle").click();
  const dialog2 = page.getByRole("dialog", { name: "Name meal" });
  const input2 = dialog2.locator(".nmfield");
  await expect(input2).toHaveValue("Post-workout bowl");
  await input2.fill("");
  const clearSent = page.waitForRequest((r) => r.method() === "PATCH" && r.url().endsWith(`/v1/meals/${id}`));
  await dialog2.getByRole("button", { name: "Update" }).click();
  expect((await clearSent).postDataJSON()).toEqual({ name: null });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".mtitle")).toHaveText(derived);

  // A failed save keeps the typed value in the field and shows an alert error.
  await page.route(`**/api/v1/meals/${id}`, (route) =>
    route.request().method() === "PATCH"
      ? route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "boom" }) })
      : route.continue(),
  );
  await page.locator(".mtitle").click();
  const dialogErr = page.getByRole("dialog", { name: "Name meal" });
  await dialogErr.locator(".nmfield").fill("Keep me");
  await dialogErr.getByRole("button", { name: "Update" }).click();
  await expect(dialogErr.getByRole("alert")).toBeVisible();
  await expect(dialogErr.locator(".nmfield")).toHaveValue("Keep me");
  await dialogErr.getByRole("button", { name: "Cancel" }).click();
  await page.unroute(`**/api/v1/meals/${id}`);

  // An unnamed meal with no items shows "Tap to Name".
  await page.route("**/api/v1/diary/day?*", async (route) => {
    const res = await route.fetch();
    const json = (await res.json()) as DayResponse;
    if (Array.isArray(json.meals)) {
      for (const m of json.meals) {
        if (m.id === id) { m.name = null; m.items = []; }
      }
    }
    await route.fulfill({ response: res, json });
  });
  await page.reload();
  await expect(page.locator(".mtitle")).toHaveText("Tap to Name");
  await page.setViewportSize({ width: 390, height: 844 });
  await shot(page, "tap-to-name-390");
  await page.unroute("**/api/v1/diary/day?*");
});

test("the menu: re-read recomputes in place, and delete asks first", async ({ inWebApp: page }) => {
  const { id } = await openMeal(page);
  await page.locator(".mdetail .ib").last().click();
  const menu = page.locator(".mpopup");
  await shot(page, "menu");
  await expect(menu.getByText("Correct")).toBeVisible();
  await expect(menu.getByText("Save meal")).toBeVisible();
  await expect(menu.getByText("Add Photo")).toBeVisible();
  await expect(menu.getByText("Re-read the photo")).toBeVisible();
  await expect(menu.getByText("Move to yesterday")).toBeVisible();
  await expect(menu.getByText("Delete this meal")).toBeVisible();

  // Re-read queues the analyzer's second look as a job (ieat-app#1347) and the meal is redrawn when it lands.
  const reread = page.waitForResponse((r) => r.url().endsWith("/v1/meals/update/queue") && r.status() === 202);
  await menu.getByText("Re-read the photo").click();
  const jobId = (await reread).request().postDataJSON().clientId as string;
  await expect.poll(async () => {
    const job = await page.request.get(`/v1/meals/photo/queue/${jobId}`, { headers: { authorization: `Bearer ${await sessionToken(page)}` } });
    return ((await job.json()) as { kind: string }).kind;
  }).toBe("settled");
  await expect(page.locator(".hsr")).toBeVisible();
  // The redrawn figures ARE the stored meal's — the kcal it re-measured and the verdicts it
  // recomputed, not the card's old numbers (#152).
  const updated = (await day(page)).meals.find((m) => m.id === id)!;
  await expect(page.locator(".msheet .kfig .num")).toHaveText(
    new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0, useGrouping: false }).format(updated.kcal),
  );
  const relabelled = updated.verdictLabels ?? [];
  const dots = page.locator(".msheet .vs .v");
  await expect(dots).toHaveCount(relabelled.length);
  for (const [i, v] of relabelled.entries()) {
    await expect(dots.nth(i)).toHaveText(v.label);
    await expect(dots.nth(i)).toHaveClass(new RegExp(`\\bv ${v.tone}\\b`));
  }

  // Delete asks first; cancelling keeps the meal.
  await page.locator(".mdetail .ib").last().click();
  await page.locator(".mpopup").getByText("Delete this meal").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await shot(page, "delete");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator(".hsr")).toBeVisible();

  // Confirming deletes it and closes to the diary (ieat-app#1226), and the row is off the day.
  await page.locator(".mdetail .ib").last().click();
  await page.locator(".mpopup").getByText("Delete this meal").click();
  await dialog.getByRole("button", { name: "Delete this meal" }).click();
  await expect(page).toHaveURL(/#\/$/);
  expect((await day(page)).meals).toHaveLength(0);
});

test("Move to yesterday puts the meal on yesterday's diary", async ({ inWebApp: page }) => {
  const { id, date } = await openMeal(page);
  await page.locator(".mdetail .ib").last().click();
  // "Move to yesterday" is the re-date route — unbilled, {dayOffset: 1}, the row moved (#150).
  const moved = page.waitForResponse((r) => r.url().endsWith(`/v1/meals/${id}/redate`) && r.request().method() === "POST" && r.ok());
  await page.locator(".mpopup").getByText("Move to yesterday").click();
  const result = (await (await moved).json()) as { kind: string; date?: string };
  expect(result.kind).toBe("redated");
  const yesterday = result.date!;
  expect(yesterday).not.toBe(date);
  // The detail follows the meal onto yesterday, and today's list no longer holds the row.
  await expect(page).toHaveURL(new RegExp(`#\\/meal\\/${id}\\?d=${yesterday}`));
  await expect(page.locator(".hsr")).toBeVisible();
  expect((await day(page, yesterday)).meals.map((m) => m.id)).toContain(id);
  expect((await day(page)).meals).toHaveLength(0);
});

test("another user's meal id resolves to the gone state, never to their meal", async ({ inWebApp: page, browser }) => {
  // A second account logs a meal; this page asks for its id.
  const other = await browser.newContext();
  try {
    const page2 = await other.newPage();
    await signIn(page2, `pw-foreign-${Date.now()}`);
    await onboardFast(page2);
    await logMeal(page2);
    const foreignId = (await day(page2)).meals[0]!.id;
    await page.goto(`/#/meal/${foreignId}`);
    await expect(page.locator(".mgone")).toBeVisible();
    await expect(page.locator(".hsr")).toHaveCount(0);
    await shot(page, "gone");
  } finally {
    await other.close();
  }
});

test("an id that was never a meal reads gone the same way", async ({ inWebApp: page }) => {
  await logMeal(page);
  await page.goto(`/#/meal/${crypto.randomUUID()}`);
  await expect(page.locator(".mgone")).toBeVisible();
});

test("reduced motion: the detail is at its end state with nothing running", async ({ inWebApp: page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openMeal(page);
  await expect(page.locator(".mtilepage").first().locator(".mcard")).toHaveCount(3);
  expect(await page.evaluate<number>("document.getAnimations().length")).toBe(0);
  // And the drawn elements sit AT that end state — getAnimations() == 0 alone can't tell an
  // opacity:0 that never ran from a card that is up (#152).
  const states = await page.evaluate<string[]>(`[...document.querySelectorAll(".mdetail .card, .mdetail .hero, .mdetail .rise, .mdetail .co")]
    .map((e) => getComputedStyle(e).opacity + ":" + getComputedStyle(e).transform)`);
  expect(states.length).toBeGreaterThan(0);
  for (const s of states) expect(s).toBe("1:none");
});

test("Add Photo from the ⋯ menu stores the photo without analysis or charge and shows it in the hero (#3684)", async ({ inWebApp: page }) => {
  const token = await sessionToken(page);
  const created = await page.request.post("/v1/meals/numbers", {
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    data: { name: "Oatmeal & banana", kcal: 340, protein_g: 12, carbs_g: 58, fat_g: 6 },
  });
  expect(created.status(), await created.text()).toBe(200);
  const beforeDay = await day(page);
  const meal = beforeDay.meals[0]!;
  expect(meal.photos ?? 0).toBe(0);

  await page.goto(`/#/meal/${meal.id}`);
  await expect(page.locator(".hero.mnoimg")).toBeVisible();

  // Before attaching: Add Photo is offered; Re-read is not (nothing stored yet).
  await page.locator(".mdetail .ib").last().click();
  const menu = page.locator(".mpopup");
  await expect(menu.getByText("Add Photo")).toBeVisible();
  await expect(menu.getByText("Re-read the photo")).toHaveCount(0);

  // Track every POST so we prove no billed analysis or correction job is triggered.
  const posts: string[] = [];
  page.on("request", (req) => {
    if (req.method() === "POST" && req.url().includes("/api/v1/")) {
      posts.push(new URL(req.url()).pathname);
    }
  });

  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    menu.getByText("Add Photo").click(),
  ]);
  const attached = page.waitForResponse(
    (r) => r.url().endsWith(`/v1/meals/${meal.id}/photos`) && r.request().method() === "POST" && r.status() === 200,
  );
  await chooser.setFiles("src/backend/web/browser/fixture-meal.png");
  const body = (await (await attached).json()) as { mealId: string; photos: number };
  expect(body).toEqual({ mealId: meal.id, photos: 1 });

  // Hero replaces the placeholder with the uploaded image, and the diary row thumbnail updates too.
  const heroImg = page.locator(".mdet .hero:not(.mnoimg) img");
  await expect(heroImg).toBeVisible();
  await expect(heroImg).toHaveAttribute("src", /^data:image\//);
  await expect.poll(() => heroImg.evaluate((img) => (img as unknown as { naturalWidth: number }).naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator(".mlist .meal.sel img")).toHaveAttribute("src", /^data:image\//);

  // Stored only: no analysis route called, macros/kcal/verdicts untouched.
  expect(posts).toEqual([`/api/v1/meals/${meal.id}/photos`]);
  const afterMeal = (await day(page)).meals.find((m) => m.id === meal.id)!;
  expect(afterMeal.photos).toBe(1);
  expect(afterMeal.kcal).toBe(meal.kcal);
  expect(afterMeal.protein_g).toBe(meal.protein_g);
  expect(afterMeal.carbs_g).toBe(meal.carbs_g);
  expect(afterMeal.fat_g).toBe(meal.fat_g);
  expect(afterMeal.verdictLabels).toEqual(meal.verdictLabels);

  // Now that the meal holds a photo, Re-read the photo also appears in the ⋯ menu.
  await page.locator(".mdetail .ib").last().click();
  await expect(page.locator(".mpopup").getByText("Add Photo")).toBeVisible();
  await expect(page.locator(".mpopup").getByText("Re-read the photo")).toBeVisible();

  // Picking more photos than remaining slots alerts locally without sending a request.
  const postsBeforeLimit = posts.length;
  const [tooManyChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.locator(".mpopup").getByText("Add Photo").click(),
  ]);
  await tooManyChooser.setFiles([
    "src/backend/web/browser/fixture-meal.png",
    "src/backend/web/browser/fixture-meal.png",
    "src/backend/web/browser/fixture-meal.png",
    "src/backend/web/browser/fixture-meal.png",
  ]);
  await expect(page.locator(".notice[role='alert']")).toContainText("One meal takes up to 4 photos.");
  expect(posts.length).toBe(postsBeforeLimit);

  // An unsupported file answers 415 and shows the refusal notice without changing the meal.
  await page.locator(".mdetail .ib").last().click();
  const [badChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.locator(".mpopup").getByText("Add Photo").click(),
  ]);
  const rejected = page.waitForResponse(
    (r) => r.url().endsWith(`/v1/meals/${meal.id}/photos`) && r.request().method() === "POST" && r.status() === 415,
  );
  await badChooser.setFiles({
    name: "not-a-photo.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from("not an image"),
  });
  await rejected;
  await expect(page.locator(".notice[role='alert']")).toContainText("JPEG, PNG or WebP");
  expect((await day(page)).meals.find((m) => m.id === meal.id)!.photos).toBe(1);

  // Filling up to maxPhotosPerMeal (4) hides Add Photo from the ⋯ menu.
  await page.getByRole("button", { name: "Meal actions" }).click();
  const [fillChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.locator(".mpopup").getByText("Add Photo").click(),
  ]);
  const filled = page.waitForResponse(
    (r) => r.url().endsWith(`/v1/meals/${meal.id}/photos`) && r.request().method() === "POST" && r.status() === 200,
  );
  const redrawn = page.waitForResponse(
    (r) => r.url().includes("/v1/diary/day") && r.request().method() === "GET" && r.status() === 200,
  );
  await fillChooser.setFiles([
    "src/backend/web/browser/fixture-meal.png",
    "src/backend/web/browser/fixture-meal.png",
    "src/backend/web/browser/fixture-meal.png",
  ]);
  expect(((await (await filled).json()) as { photos: number }).photos).toBe(4);
  await redrawn;
  await page.getByRole("button", { name: "Meal actions" }).click();
  await expect(page.locator(".mpopup")).toBeVisible();
  await expect(page.locator(".mpopup").getByText("Re-read the photo")).toBeVisible();
  await expect(page.locator(".mpopup").getByText("Add Photo")).toHaveCount(0);
});

test("the rating card asks once, posts the thumb, and is gone for good (calodex_app#3687)", async ({ inWebApp: page }) => {
  const { id } = await openMeal(page);
  const card = page.locator(".mrate");
  await expect(card).toContainText("How did Calodex do?");
  await expect(card.getByRole("button")).toHaveCount(2);
  const posted = page.waitForRequest((r) => r.url().endsWith(`/meals/${id}/rating`) && r.method() === "POST");
  await card.getByRole("button", { name: "Not good" }).click();
  expect((await posted).postDataJSON()).toEqual({ up: false });
  await expect(card).toHaveCount(0);
  // The server keeps it, so a reload draws no card and the record carries the thumb.
  await page.reload();
  await expect(page.locator(".hsr")).toBeVisible();
  await expect(page.locator(".mrate")).toHaveCount(0);
  expect((await day(page)).meals.find((m) => m.id === id)!.rating).toBe("down");
});

test("the thumbs-up posts up:true, and a failed rating keeps the card with live buttons", async ({ inWebApp: page }) => {
  const { id } = await openMeal(page);
  const card = page.locator(".mrate");
  await page.route("**/meals/*/rating", (r) => r.fulfill({ status: 500, contentType: "application/json", body: "{}" }));
  await card.getByRole("button", { name: "Good", exact: true }).click();
  await expect(card.getByRole("button").first()).toBeEnabled();
  await expect(card).toBeVisible();
  expect((await day(page)).meals.find((m) => m.id === id)!.rating ?? null).toBeNull();
  await page.unroute("**/meals/*/rating");
  const posted = page.waitForRequest((r) => r.url().endsWith(`/meals/${id}/rating`) && r.method() === "POST");
  await card.getByRole("button", { name: "Good", exact: true }).click();
  expect((await posted).postDataJSON()).toEqual({ up: true });
  await expect(card).toHaveCount(0);
});
