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

test("the menu: re-read recomputes in place, and delete asks first", async ({ inWebApp: page }) => {
  const { id } = await openMeal(page);
  await page.locator(".mdetail .ib").last().click();
  const menu = page.locator(".mpopup");
  await shot(page, "menu");
  await expect(menu.getByText("Correct")).toBeVisible();
  await expect(menu.getByText("Save meal")).toBeVisible();
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
