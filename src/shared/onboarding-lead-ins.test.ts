import { describe, expect, it } from "bun:test";
import { LANGS, type Lang } from "./types.ts";
import { chatCopyFor } from "./onboarding-chat-copy.ts";
import { onboardingContentFor } from "./onboarding-content.ts";

// Kirill, 19 Nov (ieat-app#3176): "Remove any texts like 'here's'. Just 'Your plan'." A title or a
// plan line names the thing; it does not present it. One opener per language, matched at the START
// of the string, because "Hier ist keine Mahlzeit offen" is a place and not a lead-in.
const OPENERS: Record<Lang, RegExp> = {
  en: /^(here('| i)s|here are|this is)(?![\p{L}\p{M}])/iu,
  fr: /^(voici|voilà|c'est)(?![\p{L}\p{M}])/iu,
  de: /^(hier (ist|sind)|das ist|dies ist)(?![\p{L}\p{M}])/iu,
  it: /^(ecco|questo è)(?![\p{L}\p{M}])/iu,
  es: /^(aquí (está|tienes)|este es|esto es)(?![\p{L}\p{M}])/iu,
  "pt-PT": /^(aqui (está|estão)|este é|isto é)(?![\p{L}\p{M}])/iu,
  "pt-BR": /^(aqui (está|estão)|este é|isto é)(?![\p{L}\p{M}])/iu,
  ca: /^(aquí tens|aquest és|això és)(?![\p{L}\p{M}])/iu,
  nl: /^(hier is|dit is)(?![\p{L}\p{M}])/iu,
  sv: /^(här är|det här är)(?![\p{L}\p{M}])/iu,
  no: /^her er(?![\p{L}\p{M}])/iu,
  da: /^her er(?![\p{L}\p{M}])/iu,
  fi: /^(tässä on|tämä on)(?![\p{L}\p{M}])/iu,
  hu: /^itt (a|van)(?![\p{L}\p{M}])/iu,
  tr: /^([İIiı]\u0307?şte|bu)(?![\p{L}\p{M}])/iu,
  ro: /^(iată|acesta este)(?![\p{L}\p{M}])/iu,
  cs: /^(tady je|toto je)(?![\p{L}\p{M}])/iu,
  sk: /^(tu je|toto je)(?![\p{L}\p{M}])/iu,
  sl: /^to je(?![\p{L}\p{M}])/iu,
  hr: /^(ovo je|to je)(?![\p{L}\p{M}])/iu,
  pl: /^(oto|to jest)(?![\p{L}\p{M}])/iu,
  el: /^(αυτό είναι|ορίστε)(?![\p{L}\p{M}])/iu,
  ru: /^(вот|это)(?![\p{L}\p{M}])/iu,
  uk: /^(ось|це)(?![\p{L}\p{M}])/iu,
  vi: /^(đây là|đây)(?![\p{L}\p{M}])/iu,
  id: /^(inilah|ini)(?![\p{L}\p{M}])/iu,
  ms: /^(inilah|ini)(?![\p{L}\p{M}])/iu,
  th: /^นี่คือ/u,
  "zh-Hans": /^(这是|这就是)/u,
  "zh-Hant": /^(這是|這就是)/u,
  ja: /です$/u,
  ko: /(이에요|됐어요)$/u,
  hi: /^(यह रहा|यह है)/u,
  bn: /^(এই হলো|এটি)/u,
  gu: /^(આ રહ્યો|આ છે)/u,
  kn: /^ಇದು /u,
  ml: /^ഇതാ/u,
  mr: /^(हा आहे|ही आहे)/u,
  or: /^ଏହା /u,
  pa: /^ਇਹ ਰਿਹਾ/u,
  ta: /^இதோ/u,
  te: /^ఇదే/u,
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
      expect(c.firstMeal.afterAsk, lang).not.toMatch(/^(here('| i)s|voici|voilà|hier ist|ecco|aquí está|aqui está|вот|ось)(?![\p{L}\p{M}])/iu);
    });
  }

  it("en: the plan line is just 'Your plan'", () => {
    expect(onboardingContentFor("en").summary.lines).toEqual(["Your plan"]);
  });
});
