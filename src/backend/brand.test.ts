import { expect, test } from "bun:test";
import { installBrandSource, legalUrls, withBrand } from "./brand.ts";

installBrandSource();
const config = { termsUrl: "https://eait.fit/terms/", landingUrl: "https://eait.fit" };

// ieat-app#3154: the legal pages a Calodex surface links are calodex.app's own, which serves both.
test("the default brand links its own domain's terms and privacy", () => {
  expect(legalUrls(config)).toEqual({ terms: "https://calodex.app/terms/", privacy: "https://calodex.app/privacy" });
});

test("the eait brand keeps the configured pages", () => {
  expect(withBrand("eait", () => legalUrls(config))).toEqual({ terms: "https://eait.fit/terms/", privacy: "https://eait.fit/privacy" });
});

test("an instance that configures no page links none, whatever the brand", () => {
  expect(legalUrls({ termsUrl: "", landingUrl: "" })).toEqual({ terms: "", privacy: "" });
});
