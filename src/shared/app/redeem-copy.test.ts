import { describe, expect, it } from "bun:test";
import { lintCopy } from "../claims.ts";
import { LANGS_READY } from "../lang.ts";
import { REDEEM_COPY, redeemCopyFor, type RedeemCopy } from "./redeem-copy.ts";

const KEYS = ["redeemField", "redeemSubmit", "redeemUnknown", "redeemEnded", "redeemAlready", "redeemDiscount"] as const satisfies readonly (keyof RedeemCopy)[];

describe("REDEEM_COPY (S4, #3695)", () => {
  it("has every key, non-empty, in every language", () => {
    for (const lang of LANGS_READY) for (const k of KEYS) expect(REDEEM_COPY[lang]?.[k]?.trim(), `${lang}.${k}`).toBeTruthy();
  });

  it("keeps {percent} in the discount line of every language, and only there", () => {
    for (const lang of LANGS_READY) {
      const c = redeemCopyFor(lang);
      expect(c.redeemDiscount, lang).toContain("{percent}");
      for (const k of KEYS) if (k !== "redeemDiscount") expect(c[k], `${lang}.${k}`).not.toContain("{");
    }
  });

  it("passes the claims gate in every language", () => {
    for (const lang of LANGS_READY) {
      const fields = Object.fromEntries(KEYS.map((k) => [`REDEEM_COPY.${lang}.${k}`, redeemCopyFor(lang)[k]]));
      expect(lintCopy(fields), lang).toEqual([]);
    }
  });
});
