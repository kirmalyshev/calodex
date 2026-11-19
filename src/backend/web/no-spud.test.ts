import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";

// ieat-app#3177: no web page draws the Spud mascot.
test("no /start page draws or styles Spud", () => {
  const dir = new URL("./page/", import.meta.url).pathname;
  const files = readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
  for (const f of files) {
    const src = readFileSync(dir + f, "utf8");
    expect(src, f).not.toMatch(/spudSvg|class="spud|\.spud\b|offer-hero|shared\/mascot/);
  }
});
