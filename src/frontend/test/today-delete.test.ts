// Home row swipe-to-delete (#3686): pure swipe geometry and localized labels.
import { describe, expect, it } from "bun:test";
import { LANGS } from "../../shared/types.ts";
import { chatScreenCopyFor } from "../../shared/app/chat-copy.ts";
import { mealCopyFor } from "../../shared/app/meal-copy.ts";
import { ROW_DELETE_WIDTH, clampRowSwipe, shouldOpenRowSwipe } from "../row-swipe.ts";

describe("row swipe geometry (#3686)", () => {
  it("clamps drag offset between closed (0) and action width (-ROW_DELETE_WIDTH)", () => {
    expect(clampRowSwipe(0, 20)).toBe(0);
    expect(clampRowSwipe(0, -30)).toBe(-30);
    expect(clampRowSwipe(0, -200)).toBe(-ROW_DELETE_WIDTH);
    expect(clampRowSwipe(-ROW_DELETE_WIDTH, 30)).toBe(-ROW_DELETE_WIDTH + 30);
    expect(clampRowSwipe(-ROW_DELETE_WIDTH, 200)).toBe(0);
    expect(clampRowSwipe(-ROW_DELETE_WIDTH, -40)).toBe(-ROW_DELETE_WIDTH);
  });

  it("opens past threshold and closes when dragged back right", () => {
    expect(shouldOpenRowSwipe(false, -10)).toBe(false);
    expect(shouldOpenRowSwipe(false, -36)).toBe(true);
    expect(shouldOpenRowSwipe(false, -84)).toBe(true);
    expect(shouldOpenRowSwipe(true, 10)).toBe(true);
    expect(shouldOpenRowSwipe(true, 36)).toBe(false);
  });
});

describe("row delete labels cover every app language (#3686)", () => {
  it("has a non-empty Delete label and confirm strings in every language", () => {
    for (const lang of LANGS) {
      const del = chatScreenCopyFor(lang).phone.delete;
      const mc = mealCopyFor(lang);
      expect(del.trim().length, `${lang}: delete`).toBeGreaterThan(0);
      expect(mc.deleteTitle.trim().length, `${lang}: deleteTitle`).toBeGreaterThan(0);
      expect(mc.deleteBody.trim().length, `${lang}: deleteBody`).toBeGreaterThan(0);
      expect(mc.deleteCta.trim().length, `${lang}: deleteCta`).toBeGreaterThan(0);
      expect(mc.cancelCta.trim().length, `${lang}: cancelCta`).toBeGreaterThan(0);
    }
    expect(chatScreenCopyFor("en").phone.delete).toBe("Delete");
  });
});
