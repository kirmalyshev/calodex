// Saved meals on the web app (#907, calodex_app#3685):
// Save / Remove from saved in the meal ⋯ menu, and the Saved list on empty food search
// (one-tap re-log onto the diary + desktop hover remove + 390px swipe-left remove).

import type { DayResponse, SavedMealsResponse } from "@eait/shared/contract";
import type { Page } from "@playwright/test";
import { expect, logMeal, sessionToken, test } from "./fixtures.ts";

async function day(page: Page): Promise<DayResponse> {
  const res = await page.request.get("/v1/diary/day", {
    headers: { authorization: `Bearer ${await sessionToken(page)}` },
  });
  expect(res.status()).toBe(200);
  return (await res.json()) as DayResponse;
}

async function savedList(page: Page): Promise<SavedMealsResponse["meals"]> {
  const res = await page.request.get("/v1/saved-meals", {
    headers: { authorization: `Bearer ${await sessionToken(page)}` },
  });
  expect(res.status()).toBe(200);
  return ((await res.json()) as SavedMealsResponse).meals;
}

async function openFoodSearch(page: Page): Promise<void> {
  await page.goto("/#/chat");
  const logBtn = page.getByRole("button", { name: "Log a meal" });
  await expect(logBtn).toBeVisible();
  await logBtn.click();
  await page.getByRole("menuitem", { name: "Search" }).click();
  await expect(page.locator(".fs")).toBeVisible();
}

test("meal ⋯ menu saves and unsaves a meal, persists across reload, and leaves the logged meal intact", async ({ inWebApp: page }) => {
  await logMeal(page);
  const id = (await day(page)).meals[0]!.id;
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/#/meal/${id}`);
  await expect(page.locator(".hsr")).toBeVisible();

  // Save meal sits second in the ⋯ menu, right after Correct.
  await page.locator(".mdetail .ib").last().click();
  const menu = page.locator(".mpopup");
  await expect(menu).toBeVisible();
  await expect(menu.locator(".mi").nth(0)).toHaveText("Correct");
  await expect(menu.locator(".mi").nth(1)).toHaveText("Save meal");

  const savedRes = page.waitForResponse((r) => r.url().endsWith("/v1/saved-meals") && r.request().method() === "POST" && r.ok());
  await menu.getByText("Save meal").click();
  await savedRes;
  await expect(menu).toBeHidden();
  expect(await savedList(page)).toHaveLength(1);

  // Re-opening the menu shows "Remove from saved", and reloading keeps that state.
  await page.locator(".mdetail .ib").last().click();
  await expect(menu.locator(".mi").nth(1)).toHaveText("Remove from saved");
  await page.reload();
  await expect(page.locator(".hsr")).toBeVisible();
  await page.locator(".mdetail .ib").last().click();
  await expect(menu.locator(".mi").nth(1)).toHaveText("Remove from saved");

  // Unsaving deletes the saved row and leaves the logged meal untouched.
  const delRes = page.waitForResponse((r) => r.url().includes("/v1/saved-meals/") && r.request().method() === "DELETE" && r.ok());
  await menu.getByText("Remove from saved").click();
  await delRes;
  expect(await savedList(page)).toHaveLength(0);
  expect((await day(page)).meals).toHaveLength(1);

  await page.locator(".mdetail .ib").last().click();
  await expect(menu.locator(".mi").nth(1)).toHaveText("Save meal");
});

test("empty food search shows saved meals, one-tap + re-logs onto today, and desktop hover removes without deleting logged meals", async ({ inWebApp: page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  // Empty saved state first.
  await openFoodSearch(page);
  await expect(page.locator(".fs-sec")).toHaveText("Saved");
  await expect(page.locator(".fs-empty")).toContainText("Nothing saved yet.");
  await page.locator(".fs-close").click();

  // Log a meal and save it from its ⋯ menu.
  await logMeal(page);
  const meal = (await day(page)).meals[0]!;
  await page.goto(`/#/meal/${meal.id}`);
  await expect(page.locator(".hsr")).toBeVisible();
  await page.locator(".mdetail .ib").last().click();
  const savedRes = page.waitForResponse((r) => r.url().endsWith("/v1/saved-meals") && r.request().method() === "POST" && r.ok());
  await page.locator(".mpopup").getByText("Save meal").click();
  await savedRes;

  // Empty search now lists the saved meal with kcal, macros, and +.
  await openFoodSearch(page);
  const row = page.locator(".fs-srow").first();
  await expect(row).toBeVisible();
  await expect(row.locator(".fs-sub")).toContainText("kcal");
  await expect(row.locator(".macs .mac")).toHaveCount(3);
  const lineBefore = await page.locator(".fs-line").textContent();

  // One tap on + re-logs onto today via POST /v1/saved-meals/:id/log { dayOffset: 0 }.
  const logReq = page.waitForRequest((r) => /\/v1\/saved-meals\/[^/]+\/log$/.test(r.url()) && r.method() === "POST");
  await row.locator("button.fs-add").click();
  expect((await logReq).postDataJSON()).toEqual({ dayOffset: 0 });
  await expect(row.locator("button.fs-add")).toHaveClass(/\bfs-done\b/);
  await expect(page.locator(".fs-close")).toHaveText("Done");
  await expect(page.locator(".fs-line")).not.toHaveText(lineBefore!);
  expect((await day(page)).meals).toHaveLength(2);

  // Desktop hover reveals the quiet remove button; clicking removes immediately (no confirm).
  await row.hover();
  const delRes = page.waitForResponse((r) => r.url().includes("/v1/saved-meals/") && r.request().method() === "DELETE" && r.ok());
  await row.locator("button.fs-srem").click();
  await delRes;
  await expect(page.locator(".fs-srow")).toHaveCount(0);
  await expect(page.locator(".fs-empty")).toContainText("Nothing saved yet.");
  // Removing a saved meal never touches meals already logged from it.
  expect((await day(page)).meals).toHaveLength(2);
});

test("narrow 390px: swipe left on a saved meal reveals Remove and removes it", async ({ inWebApp: page }) => {
  await logMeal(page);
  const meal = (await day(page)).meals[0]!;
  // Save via API so the test focuses on the 390px swipe removal interaction.
  const saveRes = await page.request.post("/v1/saved-meals", {
    headers: { authorization: `Bearer ${await sessionToken(page)}` },
    data: { mealId: meal.id },
  });
  expect(saveRes.status()).toBe(200);

  await page.setViewportSize({ width: 390, height: 844 });
  await openFoodSearch(page);
  const row = page.locator(".fs-srow").first();
  await expect(row).toBeVisible();
  const box = (await row.boundingBox())!;

  await page.mouse.move(box.x + box.width - 60, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 30, box.y + box.height / 2, { steps: 30 });
  await page.mouse.up();

  await expect(row).toHaveClass(/\bopen\b/);
  const remBtn = row.locator("button.fs-srem");
  await expect(remBtn).toContainText("Remove");
  const delRes = page.waitForResponse((r) => r.url().includes("/v1/saved-meals/") && r.request().method() === "DELETE" && r.ok());
  await remBtn.click();
  await delRes;
  await expect(page.locator(".fs-srow")).toHaveCount(0);
  await expect(page.locator(".fs-empty")).toBeVisible();
});
