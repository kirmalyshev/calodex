// Campaign codes (S4, #3695). A FREE code grants its days through `users.bonus_until`, the third grant
// `entitlementLive` counts — so the tier is still decided in `entitlement.ts` and nowhere here. A
// DISCOUNT code grants nothing: it resolves to the host's RevenueCat Web Billing discount code, which
// `/start/checkout` appends as `?discount_code=`. The account is an argument resolved from credentials,
// never read from the request; codes are made by the operator, so a client can only name one.

import type { PromoRedeemResponse } from "@eait/shared";
import type { PromoCode } from "../store.ts";
import type { EngineDeps } from "./deps.ts";
import { profileView } from "./profile.ts";

export type PromoRefusal = { kind: "promo-unknown" | "promo-expired" | "promo-exhausted" | "promo-already" };

const CODE = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;

/** What was typed, as the stored code: trimmed, upper-cased; null when it is not shaped like a code. */
export function normalizePromoCode(input: unknown): string | null {
  const c = typeof input === "string" ? input.trim().toUpperCase() : "";
  return CODE.test(c) ? c : null;
}

const live = (c: PromoCode, now: number): boolean => c.expiresAt === null || Date.parse(c.expiresAt) > now;

/** Redeem `input` for the caller. Free: once per account, ever; discount: nothing is written. */
export async function redeemPromo(deps: EngineDeps, userId: string, input: unknown): Promise<PromoRedeemResponse | PromoRefusal> {
  const code = normalizePromoCode(input);
  const c = code === null ? null : await deps.store.promoCode(code);
  if (c === null) return { kind: "promo-unknown" };
  const now = Date.now();
  if (!live(c, now)) return { kind: "promo-expired" };
  if (c.kind === "free") {
    const out = await deps.store.redeemPromoFree(userId, c.code, now);
    if (out !== "ok") return { kind: `promo-${out}` };
  }
  return { kind: c.kind, code: c.code, percent: c.kind === "discount" ? c.percent : null,
    discountCode: c.kind === "discount" ? c.discountCode : null, profile: (await profileView(deps, userId))! };
}

/** The RevenueCat discount code a live DISCOUNT code stands for, and its percent, or null — what the checkout URL carries. */
export async function checkoutDiscount(deps: EngineDeps, input: unknown): Promise<{ discountCode: string; percent: number } | null> {
  const code = normalizePromoCode(input);
  const c = code === null ? null : await deps.store.promoCode(code);
  return c !== null && c.kind === "discount" && c.discountCode !== null && c.percent !== null && live(c, Date.now())
    ? { discountCode: c.discountCode, percent: c.percent } : null;
}
