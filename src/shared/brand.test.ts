import { expect, test } from "bun:test";
import { BRANDS, branded, parseApp } from "./brand.ts";

// ieat-app#3154: the store app is Calodex, so a request or build that names no brand is Calodex.
// The eait entry stays for binaries that still send `x-eait-app: eait`.
test("no brand named is Calodex", () => {
  expect(parseApp(undefined)).toBe("calodex");
  expect(parseApp(null)).toBe("calodex");
  expect(parseApp("nonsense")).toBe("calodex");
});

test("a binary that names eait keeps eait", () => {
  expect(parseApp("eait")).toBe("eait");
  expect(branded("{app_name}", BRANDS.eait)).toBe("eait");
});

test("outside a request, with no source installed, the brand is Calodex", () => {
  const out = Bun.spawnSync(["bun", "-e", `import { currentBrand } from "${import.meta.dir}/brand.ts"; console.log(currentBrand().app)`]);
  expect(out.stdout.toString().trim()).toBe("calodex");
});
