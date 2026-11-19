import { expect, test } from "bun:test";
import { currentBrand } from "@eait/shared";
import { installBrandSource, legalUrls, withBrand, withRequestBrand } from "./brand.ts";

installBrandSource();
const config = { termsUrl: "https://eait.fit/terms/", landingUrl: "https://eait.fit" };

// ieat-app#3154: the configuration describes the DEFAULT brand (a self-hosted or dev instance's
// own pages); a request naming another brand links that brand's own domain.
test("the default brand links the configured terms and privacy", () => {
  const own = { termsUrl: "https://self.example/terms", landingUrl: "https://self.example" };
  expect(legalUrls(own)).toEqual({ terms: "https://self.example/terms", privacy: "https://self.example/privacy" });
});

test("another brand links its own domain's pages", () => {
  expect(withBrand("eait", () => legalUrls(config))).toEqual({ terms: "https://eait.fit/terms/", privacy: "https://eait.fit/privacy" });
  const other = { termsUrl: "https://self.example/terms", landingUrl: "https://self.example" };
  expect(withBrand("eait", () => legalUrls(other))).toEqual({ terms: "https://eait.fit/terms/", privacy: "https://eait.fit/privacy" });
});

test("an instance that configures no page links none, whatever the brand", () => {
  expect(legalUrls({ termsUrl: "", landingUrl: "" })).toEqual({ terms: "", privacy: "" });
});

test("the request's header picks the brand, and no header is the default", () => {
  const app = (h: Record<string, string>) => withRequestBrand(new Request("https://x.example/", { headers: h }), () => currentBrand().app);
  expect(app({ "x-eait-app": "eait" })).toBe("eait");
  expect(app({ "x-eait-app": "calodex" })).toBe("calodex");
  expect(app({})).toBe("calodex");
});
