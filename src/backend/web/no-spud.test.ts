import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";

// ieat-app#3177: no web page draws the Calodex mascot.
test("no /start page draws or styles Calodex", () => {
  const dir = new URL("./page/", import.meta.url).pathname;
  const files = readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
  for (const f of files) {
    const src = readFileSync(dir + f, "utf8");
    expect(src, f).not.toMatch(/spudSvg|class="spud|\.spud\b|offer-hero|shared\/mascot/);
  }
});

// The referral question wears the app icon, as the mobile QuestionHead does (#3177).
test("the referral question draws the app icon, not a mascot", () => {
  const src = readFileSync(new URL("./page/referral.ts", import.meta.url).pathname, "utf8");
  expect(src).toMatch(/class="say sayi">\$\{brandSvg\("eait"/);
});
