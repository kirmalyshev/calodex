import { describe, expect, it } from "bun:test";
import { LANGS, type Lang } from "./types.ts";
import { chatCopyFor } from "./onboarding-chat-copy.ts";
import { onboardingContentFor } from "./onboarding-content.ts";

// Kirill, 19 Nov (ieat-app#3176): "Remove any texts like 'here's'. Just 'Your plan'." A title or a
// plan line names the thing; it does not present it. One opener per language, matched at the START
// of the string, because "Hier ist keine Mahlzeit offen" is a place and not a lead-in.
const OPENERS: Record<Lang, RegExp> = {
  en: /^(here('| i)s|here are|this is)\b/i,
  fr: /^(voici|voilà|c'est)\b/i,
  de: /^(hier (ist|sind)|das ist|dies ist)\b/i,
  it: /^(ecco|questo è)\b/i,
  es: /^(aquí (está|tienes)|este es|esto es)\b/i,
  "pt-PT": /^(aqui (está|estão)|este é|isto é)\b/i,
  "pt-BR": /^(aqui (está|estão)|este é|isto é)\b/i,
  ca: /^(aquí tens|aquest és|això és)\b/i,
  nl: /^(hier is|dit is)\b/i,
  sv: /^(här är|det här är)\b/i,
  no: /^her er\b/i,
  da: /^her er\b/i,
  fi: /^(tässä on|tämä on)\b/i,
  hu: /^itt (a|van)\b/i,
  tr: /^(işte|bu)\b/i,
  ro: /^(iată|acesta este)\b/i,
  cs: /^(tady je|toto je)\b/i,
  sk: /^(tu je|toto je)\b/i,
  sl: /^to je\b/i,
  hr: /^(ovo je|to je)\b/i,
  pl: /^(oto|to jest)\b/i,
  el: /^(αυτό είναι|ορίστε)\b/i,
  ru: /^(вот|это)\b/i,
  uk: /^(ось|це)\b/i,
  vi: /^(đây là|đây)\b/i,
  id: /^(inilah|ini)\b/i,
  ms: /^(inilah|ini)\b/i,
  th: /^นี่คือ/,
  "zh-Hans": /^(这是|这就是)/,
  "zh-Hant": /^(這是|這就是)/,
  ja: /です$/,
  ko: /(이에요|됐어요)$/,
  hi: /^(यह रहा|यह है)/,
  bn: /^(এই হলো|এটি)/,
  gu: /^(આ રહ્યો|આ છે)/,
  kn: /^ಇದು /,
  ml: /^ഇതാ/,
  mr: /^(हा आहे|ही आहे)/,
  or: /^ଏହା /,
  pa: /^ਇਹ ਰਿਹਾ/,
  ta: /^இதோ/,
  te: /^ఇదే/,
};

describe("a title names the thing, it does not present it", () => {
  it("has an opener for every shipped language", () => {
    for (const lang of LANGS) expect(OPENERS[lang], lang).toBeInstanceOf(RegExp);
  });

  for (const lang of LANGS) {
    it(`${lang}: the plan line, the baseline title and the first-meal follow-up carry no lead-in`, () => {
      const c = onboardingContentFor(lang);
      const strings = [
        ...c.summary.lines, c.beats.baseline.title,
        chatCopyFor(lang).baseline.title, chatCopyFor(lang).prelim.title,
      ];
      for (const s of strings) expect(s, `${lang}: ${s}`).not.toMatch(OPENERS[lang]);
      // "That was one" is a recap and stays; only a "here's the first" is a lead-in.
      expect(c.firstMeal.afterAsk, lang).not.toMatch(/^(here('| i)s|voici|voilà|hier ist|ecco|aquí está|aqui está|вот|ось)\b/i);
    });
  }

  it("en: the plan line is just 'Your plan'", () => {
    expect(onboardingContentFor("en").summary.lines).toEqual(["Your plan"]);
  });
});
