import { describe, expect, it } from "bun:test";
import { configDefaults } from "../config.ts";
import { demoPorts } from "../llm/demo.ts";
import { logMail } from "../mail/log.ts";
import { fakePush } from "../push/fake.ts";
import { memoryStore } from "../store.memory.ts";
import type { EngineDeps } from "./deps.ts";
import { entitlementFor } from "./entitlement.ts";
import { checkoutDiscount, normalizePromoCode, redeemPromo } from "./promo-code.ts";

const setup = async () => {
  const store = memoryStore();
  const deps: EngineDeps = {
    store, llm: demoPorts(), push: fakePush(), mail: logMail(),
    config: { ...configDefaults(), port: 0, databaseUrl: "memory://test", llmProvider: "demo", llmModel: "demo", llmApiKey: "unused" },
  };
  const free = { kind: "free" as const, days: 30, discountCode: null, percent: null, expiresAt: null, maxRedemptions: null };
  const off = { kind: "discount" as const, days: null, discountCode: "RC_TEN", percent: 10, expiresAt: null, maxRedemptions: null };
  return { store, deps, free, off, userId: await store.createUser("en") };
};
const kindOf = (o: object): string => ("kind" in o ? (o as { kind: string }).kind : "");

describe("normalizePromoCode", () => {
  it("trims and upper-cases, and rejects what is not a code", () => {
    expect(normalizePromoCode("  blog-30 ")).toBe("BLOG-30");
    for (const bad of ["", "ab", "has space", "x".repeat(33), 7, null, undefined]) expect(normalizePromoCode(bad)).toBeNull();
  });
});

describe("redeemPromo (S4, #3695)", () => {
  it("a free code grants its days through bonus_until, and the tier is decided by entitlementFor", async () => {
    const { store, deps, free, userId } = await setup();
    await store.putPromoCode({ code: "BLOG30", ...free });
    expect((await entitlementFor(deps, userId)).active).toBe(false);
    const out = await redeemPromo(deps, userId, "blog30");
    expect(kindOf(out)).toBe("free");
    expect((await entitlementFor(deps, userId)).active).toBe(true);
    const until = Date.parse((await store.bonusUntil(userId))!);
    expect(Math.round((until - Date.now()) / 86_400_000)).toBe(30);
  });

  it("is once per account, ever, across codes", async () => {
    const { store, deps, free, userId } = await setup();
    await store.putPromoCode({ code: "ONE", ...free });
    await store.putPromoCode({ code: "TWO", ...free });
    expect(kindOf(await redeemPromo(deps, userId, "ONE"))).toBe("free");
    const before = await store.bonusUntil(userId);
    expect(await redeemPromo(deps, userId, "TWO")).toEqual({ kind: "promo-already" });
    expect(await redeemPromo(deps, userId, "ONE")).toEqual({ kind: "promo-already" });
    expect(await store.bonusUntil(userId)).toBe(before);
  });

  it("refuses an unknown, an expired and a spent code, granting nothing", async () => {
    const { store, deps, free, userId } = await setup();
    const other = await store.createUser("en");
    await store.putPromoCode({ code: "OLD", ...free, expiresAt: new Date(Date.now() - 1000).toISOString() });
    await store.putPromoCode({ code: "CAP", ...free, maxRedemptions: 1 });
    expect(await redeemPromo(deps, userId, "NOPE")).toEqual({ kind: "promo-unknown" });
    expect(await redeemPromo(deps, userId, "not a code")).toEqual({ kind: "promo-unknown" });
    expect(await redeemPromo(deps, userId, "OLD")).toEqual({ kind: "promo-expired" });
    expect(kindOf(await redeemPromo(deps, other, "CAP"))).toBe("free");
    expect(await redeemPromo(deps, userId, "CAP")).toEqual({ kind: "promo-exhausted" });
    expect(await store.bonusUntil(userId)).toBeNull();
  });

  it("a discount code grants nothing and answers its percent; it can be asked again", async () => {
    const { store, deps, off, userId } = await setup();
    await store.putPromoCode({ code: "TEN", ...off });
    for (let i = 0; i < 2; i++) {
      const out = await redeemPromo(deps, userId, "ten");
      expect(out).toMatchObject({ kind: "discount", code: "TEN", percent: 10, discountCode: "RC_TEN" });
    }
    expect(await store.bonusUntil(userId)).toBeNull();
  });

  it("an expired discount is refused too", async () => {
    const { store, deps, off, userId } = await setup();
    await store.putPromoCode({ code: "TEN", ...off, expiresAt: new Date(Date.now() - 1000).toISOString() });
    expect(await redeemPromo(deps, userId, "TEN")).toEqual({ kind: "promo-expired" });
  });
});

describe("checkoutDiscount", () => {
  it("resolves a live discount code to the RevenueCat code, and nothing for a free, expired or unknown one", async () => {
    const { store, deps, free, off } = await setup();
    await store.putPromoCode({ code: "TEN", ...off });
    await store.putPromoCode({ code: "FREE", ...free });
    await store.putPromoCode({ code: "OLD", ...off, expiresAt: new Date(Date.now() - 1000).toISOString() });
    expect(await checkoutDiscount(deps, "ten")).toEqual({ discountCode: "RC_TEN", percent: 10 });
    for (const c of ["FREE", "OLD", "NOPE", null, "x y"]) expect(await checkoutDiscount(deps, c)).toBeNull();
  });
});
