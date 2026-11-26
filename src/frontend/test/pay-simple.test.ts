// ieat-app#3465: the in-app web pay screen is the phone's Cal AI sheet — same elements, same
// order, same one billing fact per screen. A's billed amount is the Yearly row's own line, every
// step's renew line is the price-free `renewsPlain`, no screen but A carries the photo, and C has
// no subtitle. The screen is DOM code, so the guard reads its source like the phone's does
// (scripts/paywall-sheet-simple.test.ts on ieat-app).
import { describe, expect, test } from "bun:test";

const src = await Bun.file(new URL("../screens/pay.ts", import.meta.url)).text();
const css = await Bun.file(new URL("../screens/pay.css.ts", import.meta.url)).text();
/** One part of the source, from a marker to the next. A renamed marker fails here, not on "". */
const part = (from: string, to: string) => {
  const a = src.indexOf(from), b = src.indexOf(to, a + from.length);
  expect(a, `marker ${from}`).toBeGreaterThan(-1);
  expect(b, `marker ${to}`).toBeGreaterThan(a);
  return src.slice(a, b);
};
const count = (s: string, needle: string) => s.split(needle).length - 1;

describe("the web pay sheet stays the phone's simple sheet (ieat-app#3465)", () => {
  test("A: the billed amount is the Yearly row's line; the note under the CTA is renewsPlain", () => {
    const a = part("function planPair", "const showTry");
    expect(count(a, "pay.billedYearly")).toBe(1);
    expect(count(a, "pay.renewsPlain")).toBe(1); // the price-free auto-renew line (3.1.2), over the links
    for (const note of ["renewNote", "pricePerYear", "trialNote"]) expect(a).not.toContain(note);
    // The store's own Subscribe where no trial is owed (the phone's subscribePhone).
    expect(count(a, "pay.subscribePhone")).toBe(1);
  });
  test("B: the billed amount and its date are the Day-3 step, once; no second billing line", () => {
    const b = part("const showTry", "const showOffer");
    expect(count(b, "trialBillLine(")).toBe(1);
    expect(b).not.toContain("trialNote");
    expect(b).not.toContain("tryBill");
    expect(count(b, "pay.renewsPlain")).toBe(1);
    expect(count(b, '"nopay"')).toBe(1); // "No payment due now" alone — the bill line lives in the timeline
  });
  // Kirill q90 = A (ieat-app#3617, #3630; boards pay-cal-c, pay-cal-c-notrial): C is A with the
  // offer's values — A's plan rows with the offer on Yearly's, Claim, and A's one note.
  test("C is A with changed values: the plan rows, Claim, one note; no card of its own", () => {
    const c = part("const showOffer", "let step");
    expect(c).toContain("planPair(w!, pay, COPY.offerPlans, offer)");
    expect(c).toContain("pay.offerClaim");
    expect(count(c, "pay.renewNoteYearly")).toBe(1); // the offer's renewal while it is picked
    expect(count(c, "pay.renewsPlain")).toBe(1); // A's price-free line while Monthly is
    for (const gone of ["offerSpecialTitle", "offerVsMonthly", "offerPrice", "offerSub", "offerNote", '"offer pop"']) {
      expect(c, gone).not.toContain(gone);
    }
    const pair = part("function planPair", "export function payScreen");
    expect(pair).toContain("fill(pay.offerOff, { percent: paywallPercent(offer.percentOff, lang) })");
    expect(pair).toContain('el("s", "", offer.regularPrice)');
  });
  test("the photo is screen A's, and only A's", () => {
    expect(count(src, "frenchtoast.webp")).toBe(1);
    expect(part("const showTry", "const showOffer")).toContain("dropHero()");
    // C is A, so it carries A's photo: back in the sheet if B took it out.
    expect(part("const showOffer", "let step")).toContain("sheet.insertBefore(hero, pane)");
  });
  // ieat-app#3505: A's photo takes ALL the free height and the title/plans/CTA sit together at the
  // bottom — the phone's `s.heroFull` with no spacer in the foot. On B (no photo) the timeline
  // centres in the free height like C's card, never floating between the title and the CTA.
  test("A: the hero takes the free height; nothing floats under the plans", () => {
    const hero = /\.pay \.hero\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(hero).toContain("flex: 1");
    expect(hero).toContain("min-height");
    const a = part("const pane", "const showTry");
    expect(a).not.toContain('"fill"');
    expect(a).not.toContain('"mid"');
  });
  test("B: the timeline centres vertically — no floating spacer (ieat-app#3505)", () => {
    const b = part("const showTry", "const showOffer");
    expect(b).not.toContain('el("div", "fill")');
    const tl = /\.pay \.tl\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(tl).toContain("margin: auto 0;");
  });
  test("a full-screen sheet: fixed over the app, the × top-left, phone-width centred", () => {
    expect(css).toContain("position: fixed");
    expect(css).toContain("body:has(.pay) .wtop"); // the nav leaves the tree, not just the pixels
    const x = /\.pay \.x\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(x).toContain("left:");
    expect(x).not.toContain("right:");
    const sheet = /\.pay \.sheet\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(sheet).toContain("max-width");
    expect(sheet).toContain("margin: 0 auto");
  });
});

// Kirill, 24 Nov 16:56 ("sloppy, corner-y, not smooth"): the polish pass, the same on the phone's
// sheet (ieat-app scripts/paywall-sheet-simple.test.ts) and on /start/offer (page/shell.ts).
const shell = await Bun.file(new URL("../../backend/web/page/shell.ts", import.meta.url)).text();
describe("the web pay sheet is smooth, not corner-y", () => {
  for (const [name, text] of [["#/pay", css], ["/start/offer", shell]] as const) {
    test(`${name}: the photo fades into the page, Continue is a pill, cards are 18`, () => {
      expect(text).toMatch(/mask-image: linear-gradient\(to bottom, #000/);
      expect(text).toMatch(/\.cta\s*\{\s*border-radius: 999px/);
      expect(/\.plan2\s*\{[^}]*border-radius: 18px/.test(text)).toBe(true);
    });
    test(`${name}: only the title is heavy — name medium, billed and per-month regular`, () => {
      expect(text).toMatch(/\.plan2 \.nm \{[^}]*font-weight: 500/);
      expect(text).toMatch(/\.plan2 \.billed, (?:\.pay )?\.plan2 \.pm \{[^}]*font-weight: 400/);
    });
  }
});

// C has no card on any surface (ieat-app#3617): it is A with the offer's values.
describe("no special-offer card is left", () => {
  test("#/pay and /start/offer carry no card styles", () => {
    expect(css).not.toMatch(/\.pay \.offer\s*\{/);
    expect(shell).not.toContain(".offer .special");
  });
});

// Kirill q54 (24 Nov): a white page; the billed line is the primary text colour at medium weight (3.1.2(c)).
describe("the web pay sheet is white with a dark medium billed line", () => {
  test("#/pay: the sheet is --surface; billed is ink 500, never muted", () => {
    expect(/\.pay \{[^}]*background: var\(--surface\)/.test(css)).toBe(true);
    expect(css).toMatch(/\.pay \.plan2 \.billed \{[^}]*font-weight: 500; color: var\(--ink\)/);
    expect(css).not.toMatch(/:is\(\.nm, \.billed/);
  });
  test("/start/offer: the same", () => {
    expect(shell).toMatch(/body:has\(\.offer\) \{ background: var\(--surface\)/);
    expect(shell).toMatch(/\.plan2 \.billed \{[^}]*font-weight: 500; color: var\(--ink\)/);
    expect(shell).not.toMatch(/:is\(\.nm, \.billed/);
  });
});
