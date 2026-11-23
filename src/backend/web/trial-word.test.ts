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
    expect(NOTIFICATION_COPY.ru?.["trial-end"].title).toMatch(/триал/i);
  });
});
