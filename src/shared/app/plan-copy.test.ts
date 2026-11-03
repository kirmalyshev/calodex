// The plan screen's words. No space between a figure and its unit (ieat-app#1358): the first step
// read "2349 kcal" in every language but English while the same screen said "2349kcal am Tag"
// (ieat-app#2562).

import { describe, expect, it } from "bun:test";
import { LANGS } from "../types.ts";
import { planCopyFor } from "./plan-copy.ts";

describe("PLAN_COPY", () => {
  it("joins the first step's figure to its unit in every language", () => {
    for (const lang of LANGS) {
      expect(`${lang}: ${planCopyFor(lang).firstStep}`).not.toMatch(/\{kcal\}\s/);
      expect(`${lang}: ${planCopyFor(lang).firstStep}`).toContain("{kcal}");
    }
  });
});
