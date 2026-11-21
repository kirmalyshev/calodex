// #3297 — the web hero frames show a photo at its real aspect ratio, the way the app's
// `photoFitHeight` does (`src/mobile/lib/photo-fit.ts`): `heroAspect` is the ratio the frame takes
// once the image's natural size is known — never below the surface's designed floor — and the
// screen's `max-height` stays the cap for anything taller. The CSS half is pinned by reading the
// sheets: a `height:` on `.hero` is the fixed frame this issue removes.
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { heroAspect } from "../kit.ts";

describe("heroAspect", () => {
  it("a landscape photo keeps its own ratio above the designed floor", () => {
    expect(heroAspect(768, 356, 4 / 3)).toBeCloseTo(2.157, 2);
    expect(heroAspect(1280, 960, 4 / 3)).toBeCloseTo(4 / 3, 2);
  });

  it("a portrait photo floors at the designed frame — never taller than designed", () => {
    expect(heroAspect(356, 768, 4 / 3)).toBeCloseTo(4 / 3, 2);
  });

  it("floor 0 follows the photo in both directions", () => {
    expect(heroAspect(768, 356)).toBeCloseTo(2.157, 2);
    expect(heroAspect(356, 768)).toBeCloseTo(0.464, 2);
  });

  it("degenerate dimensions fall back to the floor", () => {
    expect(heroAspect(0, 0, 4 / 3)).toBeCloseTo(4 / 3, 2);
    expect(heroAspect(768, 0)).toBe(0);
  });
});

describe("hero frames carry no fixed height — the photo's aspect rules them", () => {
  // `.pay`'s hero draws a store asset, not a meal photo — it keeps its fixed frame by design.
  const sheets = readdirSync(new URL("../screens", import.meta.url).pathname)
    .filter((f) => f.endsWith(".css.ts") && f !== "pay.css.ts");
  // A `height:` that is not `max-height`/`min-height` inside a `.hero` block is the fixed frame.
  const FIXED = /[{(;\s]height\s*:/;
  for (const file of sheets) {
    const rules = (readFileSync(new URL(`../screens/${file}`, import.meta.url).pathname, "utf8").match(/\.[^{}]*hero[^{]*\{[^}]*\}/g) ?? [])
      // The box is the frame: keep a rule only when its LAST compound selector names a hero —
      // descendants (the img that fills the box, a callout dot) carry their own sizes.
      .filter((r) => {
        const last = r.slice(0, r.indexOf("{")).trim().split(/\s+/).pop()!;
        return /hero/i.test(last) && !last.includes(".big") && !last.includes("mnoimg");
      });
    it(`${file}: every .hero rule is a bound, not a fixed height`, () => {
      for (const rule of rules) expect(FIXED.test(rule)).toBe(false);
    });
  }
});
