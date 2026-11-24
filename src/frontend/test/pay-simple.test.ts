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
  test("C: no subtitle, one legal note (the offer's renewal), nothing else priced", () => {
    const c = part("const showOffer", "let step");
    expect(c).not.toContain("offerSub");
    expect(c).not.toContain("offerNote");
    expect(count(c, "pay.renewNoteYearly")).toBe(1);
    expect(count(c, "pay.renewsPlain")).toBe(0); // the renewNote IS this screen's one line
  });
  test("the photo is screen A's, and only A's", () => {
    expect(count(src, "frenchtoast.webp")).toBe(1);
    expect(part("const showTry", "const showOffer")).toContain("dropHero()");
    expect(part("const showOffer", "let step")).toContain("dropHero()");
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

// Kirill, 24 Nov 17:27: the special-offer card is Cal AI 12's soft silver gradient.
describe("the web special-offer card is silver", () => {
  test("#/pay: a gradient behind the percent", () => {
    expect(/\.pay \.offer\s*\{[^}]*linear-gradient\(135deg/.test(css)).toBe(true);
  });
});
