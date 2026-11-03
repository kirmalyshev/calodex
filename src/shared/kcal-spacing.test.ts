// No space between a figure and its calorie unit, in any language (ieat-app#1358, #2564). A
// template's placeholder is the figure, so "{kcal} ккал" is the same defect "2349 kcal" was.
// Reads the copy as text: the tables, the web copy and the Lingui catalogs.

import { describe, expect, it } from "bun:test";
import { Glob } from "bun";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const SPACED = /\{\w+\}[   ](kcal|ккал|kkal|大卡|千卡)/;

describe("calorie copy", () => {
  it("joins every placeholder to its kcal unit", async () => {
    const hits: string[] = [];
    for (const pattern of ["**/*.ts", "**/*.po"]) {
      for await (const f of new Glob(pattern).scan(ROOT)) {
        if (f.endsWith(".test.ts") || f.includes("node_modules")) continue;
        const text = await Bun.file(join(ROOT, f)).text();
        text.split("\n").forEach((line, i) => { if (SPACED.test(line)) hits.push(`${f}:${i + 1}`); });
      }
    }
    expect(hits).toEqual([]);
  });
});
