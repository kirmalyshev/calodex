import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { NOTIFICATION_COPY } from "../../shared/notifications.ts";
import { PAY_COPY } from "../../shared/app/pay-copy.ts";
import { YOU_COPY } from "../../shared/app/you-copy.ts";
import { WEB_COPY } from "../../frontend/copy.ts";
import { PAGE_COPY_BY_LANG } from "./copy.ts";

// #3393: Kirill, 23 Nov — "Пробный период -> Триал. Many people know what a trial is." Russian says
// "триал" (триала, триалом), never "пробный период", everywhere the user reads it.
const strings = (v: unknown, out: string[] = []): string[] => {
  if (typeof v === "string") out.push(v);
  else if (v && typeof v === "object") for (const x of Object.values(v)) strings(x, out);
  return out;
};

describe("Russian trial word (#3393)", () => {
  const roots = {
    NOTIFICATION_COPY: NOTIFICATION_COPY.ru,
    PAY_COPY: PAY_COPY.ru,
    YOU_COPY: YOU_COPY.ru,
    WEB_COPY: WEB_COPY.ru,
    PAGE_COPY_BY_LANG: PAGE_COPY_BY_LANG.ru,
  };
  for (const [name, root] of Object.entries(roots)) {
    it(`${name} has no «пробный период»`, () => {
      expect(strings(root).filter((s) => /пробн/i.test(s))).toEqual([]);
    });
  }
  // The Lingui catalog feeds the chat thread; the compiled file is what ships, so check both.
  for (const f of ["messages.po", "messages.ts"]) {
    it(`locales/ru/${f} has no «пробн»`, () => {
      const text = readFileSync(new URL(`../../shared/locales/ru/${f}`, import.meta.url), "utf8");
      expect(text.match(/.{0,20}пробн.{0,20}/gi) ?? []).toEqual([]);
    });
  }
  it("uses «триал» in the trial-end push", () => {
    expect(NOTIFICATION_COPY.ru?.["trial-end"].title).toContain("Триал");
  });
});

// #3393 (Kirill, 23 Nov, q37 "all-trial"): every language that spelt the trial as a long compound now
// uses the short word. The key is the language; the value matches the OLD word in any inflection.
const OLD_TRIAL_WORD: Record<string, RegExp> = {
  uk: /пробн/i,
  bg: /проб(ен|ни|на|но)|безплатния си период/i,
  hr: /probn/i,
  sl: /preizkusn/i,
  sk: /skúšobn/i,
  cs: /zkušební/i,
  pl: /okres\S* próbn|triale\b/i,
  nl: /proefperiod/i,
  sv: /provperiod/i,
  da: /prøveperiod/i,
  no: /prøveperiod/i,
  fi: /kokeilujakso|kokeilujakson/i,
  hu: /próbaidő/i,
  ro: /perioad\S*( \S+)? de prob/i,
  "pt-PT": /avaliação/i,
};
const SHORT_WORD: Record<string, RegExp> = {
  uk: /тріал/i, bg: /триал/i, hr: /trial/i, sl: /trial/i, sk: /trial/i, cs: /trial/i, pl: /trial/i,
  nl: /trial/i, sv: /trial/i, da: /trial/i, no: /trial/i, fi: /kokeilu/i, hu: /trial/i, ro: /\bproba\b|\bprobă\b|probei/i,
  "pt-PT": /teste grátis/i,
};

describe("short trial word in every other language (#3393)", () => {
  for (const [lang, old] of Object.entries(OLD_TRIAL_WORD)) {
    const roots = {
      NOTIFICATION_COPY: (NOTIFICATION_COPY as Record<string, unknown>)[lang],
      PAY_COPY: (PAY_COPY as Record<string, unknown>)[lang],
      YOU_COPY: (YOU_COPY as Record<string, unknown>)[lang],
      WEB_COPY: (WEB_COPY as Record<string, unknown>)[lang],
      PAGE_COPY_BY_LANG: (PAGE_COPY_BY_LANG as Record<string, unknown>)[lang],
    };
    for (const [name, root] of Object.entries(roots)) {
      it(`${lang} ${name} has no ${old}`, () => {
        expect(root).toBeDefined(); // a missing language must not pass silently
        expect(strings(root).filter((s) => old.test(s))).toEqual([]);
      });
    }
    for (const f of ["messages.po", "messages.ts"]) {
      it(`locales/${lang}/${f} has no ${old}`, () => {
        const text = readFileSync(new URL(`../../shared/locales/${lang}/${f}`, import.meta.url), "utf8");
        expect(text.match(new RegExp(`.{0,20}(${old.source}).{0,20}`, "gi")) ?? []).toEqual([]);
      });
    }
    it(`${lang} trial-end push uses the short word`, () => {
      const n = (NOTIFICATION_COPY as Record<string, { "trial-end"?: { title: string } } | undefined>)[lang];
      expect(n?.["trial-end"]?.title).toMatch(SHORT_WORD[lang]!);
    });
  }
});
