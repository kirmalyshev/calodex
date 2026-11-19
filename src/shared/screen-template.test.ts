import { describe, expect, it } from "bun:test";
import {
  hourInWindow,
  resolveScreen,
  TEMPLATE_RENDERER_VERSION,
  validateScreenTemplate,
  validateArmScreens,
  type ScreenTemplateDraft,
} from "./screen-template.ts";
import { LANGS } from "./types.ts";

const everyLang = (s: Record<string, string>) => Object.fromEntries(LANGS.map((l) => [l, { ...s }]));

const good = (): ScreenTemplateDraft => ({
  renderer: 1,
  blocks: [
    { type: "headline", text: "h" },
    { type: "image", asset: "a".repeat(64), alt: "alt" },
    { type: "spud", lines: ["l1"], mood: "wave" },
    { type: "cta", label: "go", action: "next" },
  ],
  strings: everyLang({ h: "See it work", alt: "A plate", l1: "Here is how", go: "Continue" }),
});

describe("validateScreenTemplate (#3167)", () => {
  it("accepts a template built from known blocks with every language", () => {
    expect(validateScreenTemplate(good(), new Set(["a".repeat(64)]))).toEqual([]);
  });

  it("refuses a language that lacks a key, naming both", () => {
    const t = good();
    delete (t.strings as Record<string, Record<string, string>>).ms!.go;
    expect(validateScreenTemplate(t, new Set(["a".repeat(64)]))).toContain("strings.ms.go is missing");
  });

  it("refuses a missing language outright, never an English fallback", () => {
    const t = good();
    delete (t.strings as Record<string, unknown>).hr;
    expect(validateScreenTemplate(t, new Set(["a".repeat(64)]))).toContain("strings.hr is missing");
  });

  it("refuses an unknown block type and an unknown action", () => {
    const t = good();
    (t.blocks as unknown[]).push({ type: "webview", url: "https://x" });
    (t.blocks as unknown[])[3] = { type: "cta", label: "go", action: "open-url" };
    const errs = validateScreenTemplate(t, new Set(["a".repeat(64)]));
    expect(errs).toContain("blocks[4].type 'webview' is not a block");
    expect(errs).toContain("blocks[3].action 'open-url' is not an action");
  });

  it("refuses a typed number in any language: prices, kcal and trial lengths are never typed", () => {
    const t = good();
    t.strings.de!.h = "Nur 2,99 € im Monat";
    expect(validateScreenTemplate(t, new Set(["a".repeat(64)]))).toContain("strings.de.h has a digit");
  });

  it("runs the claims gate on every string", () => {
    const t = good();
    t.strings.en!.h = "Guaranteed weight loss";
    expect(validateScreenTemplate(t, new Set(["a".repeat(64)])).some((e) => e.startsWith("strings.en.h claims"))).toBe(true);
  });

  it("refuses an image whose asset was never uploaded", () => {
    expect(validateScreenTemplate(good(), new Set())).toContain(`blocks[1].asset ${"a".repeat(64)} was not uploaded`);
  });

  it("needs exactly one forward cta", () => {
    const t = good();
    t.blocks = t.blocks.filter((b) => b.type !== "cta");
    expect(validateScreenTemplate(t, new Set(["a".repeat(64)]))).toContain("needs exactly one cta that moves forward");
  });

  it("refuses a renderer newer than this build knows", () => {
    expect(validateScreenTemplate({ ...good(), renderer: TEMPLATE_RENDERER_VERSION + 1 }, new Set(["a".repeat(64)])))
      .toContain(`renderer ${TEMPLATE_RENDERER_VERSION + 1} is newer than ${TEMPLATE_RENDERER_VERSION}`);
  });
});

describe("validateArmScreens (#3167)", () => {
  it("accepts known slots with hour windows", () => {
    expect(validateArmScreens({ "after:signup": [{ template: "t", version: 1, when: { hours: [18, 23] } }, { template: "u", version: 2 }] })).toEqual([]);
  });
  it("refuses an unknown slot and an out-of-range hour", () => {
    const errs = validateArmScreens({ "after:goal": [{ template: "t", version: 1 }], welcome: [{ template: "t", version: 1, when: { hours: [18, 24] } }] } as never);
    expect(errs).toContain("screens.after:goal is not a slot");
    expect(errs).toContain("screens.welcome[0].when.hours must be two different hours 0–23 (omit `when` for any hour)");
  });
});

describe("hourInWindow — the USER's local hour (#3167 Q1)", () => {
  it("is [from, to) and wraps past midnight", () => {
    expect(hourInWindow(18, [18, 23])).toBe(true);
    expect(hourInWindow(23, [18, 23])).toBe(false);
    expect(hourInWindow(2, [22, 6])).toBe(true);
    expect(hourInWindow(12, [22, 6])).toBe(false);
  });
});

describe("resolveScreen (#3167)", () => {
  it("sends only the served language's strings", () => {
    const s = resolveScreen({ key: "t", version: 3, ...good() }, "de", (sha) => `/v1/onboarding/assets/${sha}`);
    if (!s) throw new Error("expected a screen");
    expect(s.template).toBe("t");
    expect(s.version).toBe(3);
    expect(s.strings.go).toBe("Continue");
    expect(Object.keys(s.strings).sort()).toEqual(["alt", "go", "h", "l1"]);
    expect(s.assets).toEqual([{ sha256: "a".repeat(64), url: `/v1/onboarding/assets/${"a".repeat(64)}` }]);
  });
});

describe("pickArmScreen (#3167)", () => {
  const { pickArmScreen } = require("./screen-template.ts") as typeof import("./screen-template.ts");
  const evening = { template: "eve", version: 1, when: { hours: [18, 23] as [number, number] } };
  const always = { template: "all", version: 1 };
  it("serves the first entry whose window holds in the user's local hour, else the unwindowed one", () => {
    expect(pickArmScreen([evening, always], 19)?.template).toBe("eve");
    expect(pickArmScreen([evening, always], 9)?.template).toBe("all");
  });
  it("falls through to the unwindowed entry when the hour is unknown", () => {
    expect(pickArmScreen([evening, always], null)?.template).toBe("all");
  });
  it("serves nothing when no window holds and no entry is unwindowed, or the hour is unknown", () => {
    expect(pickArmScreen([evening], 9)).toBeNull();
    expect(pickArmScreen([evening], null)).toBeNull();
  });
});

describe("validateScreenTemplate — review round 1 (#3167)", () => {
  const assets = new Set(["a".repeat(64)]);
  it("refuses a field a block does not have: a template is data, not a layout", () => {
    const t = good();
    (t.blocks[0] as Record<string, unknown>).color = "#f00";
    expect(validateScreenTemplate(t, assets)).toContain("blocks[0] has unknown fields: color");
  });
  it("refuses a skip action: no template may jump past a compiled question", () => {
    const t = good();
    (t.blocks as unknown[])[3] = { type: "cta", label: "go", action: "skip-to:paywall" };
    expect(validateScreenTemplate(t, assets)).toContain("blocks[3].action 'skip-to:paywall' is not an action");
  });
  it("refuses a format character that would hide a claim from the gate", () => {
    const t = good();
    t.strings.en!.h = "Guaran\u200Bteed";
    expect(validateScreenTemplate(t, assets)).toContain("strings.en.h has a format character");
  });
  it("refuses Russian that genders the reader", () => {
    const t = good();
    t.strings.ru!.h = "Что ты ел?";
    expect(validateScreenTemplate(t, assets).some((e) => e.startsWith("strings.ru") && e.includes("gendered"))).toBe(true);
  });
});

describe("validateArmScreens — review round 1 (#3167)", () => {
  it("refuses an empty window, an unknown field, and an unwindowed entry before another", () => {
    const errs = validateArmScreens({
      welcome: [{ template: "t", version: 1, when: { hours: [9, 9] } }],
      "after:signup": [{ template: "all", version: 1 }, { template: "eve", version: 1, when: { hours: [18, 23] } }],
      prelim: [{ template: "t", version: 1, href: "x" }],
    } as never);
    expect(errs).toContain("screens.welcome[0].when.hours must be two different hours 0–23 (omit `when` for any hour)");
    expect(errs).toContain("screens.after:signup[0] has no window, so the entries after it are never served — put it last");
    expect(errs).toContain("screens.prelim[0] has unknown fields: href");
  });
});

describe("resolveScreen — a language added later (#3167)", () => {
  it("is null when the served language lacks a key, so the slot is skipped, never blank", () => {
    const t = { key: "t", version: 1, ...good() };
    delete t.strings.fr!.go;
    expect(resolveScreen(t, "fr", (x) => x)).toBeNull();
  });
});
