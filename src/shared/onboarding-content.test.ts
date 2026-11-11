import { describe, expect, it } from "bun:test";
import { LANGS, type Lang } from "./types.ts";
import { LANG_LABEL } from "./lang.ts";
import {
  DEFAULT_ONBOARDING_CONTENT, ONBOARDING_SCREENS, SCREEN_FIELDS, optionLabel, screenOptionValues,
  validateOnboardingContent,
} from "./onboarding.ts";
import { ONBOARDING_CONTENT, onboardingContentFor, usableContentFor } from "./onboarding-content.ts";
import { genderedRussian } from "./lang.ts";
import { usableFirstMeal } from "./onboarding.ts";
import { AMBIGUOUS_AGE, checkDirection, checkNumber, switchedLine } from "./onboarding-chat.ts";
import { chatCopyFor } from "./onboarding-chat-copy.ts";

// Onboarding is the one flow where a missing sentence is not a wart: `usableContent` drops a whole
// revision that is missing an ask, because a question with nothing to ask it with is a conversation
// that stops. So a translation of it is checked the way the English is — through the validator that
// guards the admin's write, in every language.

describe("every language's onboarding content", () => {
  it("is the same editorial revision, so one funnel number covers all eight", () => {
    for (const lang of LANGS) {
      expect(onboardingContentFor(lang).version, lang).toBe(DEFAULT_ONBOARDING_CONTENT.version);
    }
  });

  it("passes the validator the admin's own saves go through", () => {
    for (const lang of LANGS) {
      const result = validateOnboardingContent(onboardingContentFor(lang));
      // Printed rather than merely asserted: a failure here should say WHICH sentence is wrong.
      if (!result.ok) throw new Error(`${lang} (${LANG_LABEL[lang]}):\n${result.errors.join("\n")}`);
      expect(result.ok).toBe(true);
    }
  });

  it("has a sentence for every question, in every language", () => {
    for (const lang of LANGS) {
      for (const screen of onboardingContentFor(lang).screens) {
        for (const field of SCREEN_FIELDS[screen.id]) {
          expect(screen.asks[field]?.lines?.length, `${lang}.${screen.id}.${field}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("labels every option in every language — a blank chip is a tappable hole", () => {
    // THROUGH THE SAME FALLBACK THE RENDERER USES, not against the stored content, because the
    // content is no longer the only source: a country's name is CLDR's (`optionLabel`), and
    // asserting the content carries one would demand fifteen countries in eight languages be
    // typed by hand. What must hold is that the chip has words on it, wherever they came from.
    for (const lang of LANGS) {
      for (const screen of onboardingContentFor(lang).screens) {
        for (const key of screenOptionValues(screen.id, lang)) {
          const label = screen.options?.[key]?.label ?? optionLabel(screen.id, key, lang);
          expect(label.trim(), `${lang}.${screen.id}.${key}`).toBeTruthy();
          // And it is a NAME, not the code falling through. `optionLabel` returns the bare value
          // when it has nothing, which on a chip looks like a label and is not one.
          expect(label.trim(), `${lang}.${screen.id}.${key} rendered its own code`).not.toBe(key);
        }
      }
    }
  });

  it("keeps every placeholder the composer fills — a dropped one renders as a hole in a number", () => {
    // `{floor}`, `{share}` and the limit-cap `{n}` are substituted by code. A translator who drops
    // one produces a sentence with a figure missing and no error anywhere.
    for (const lang of LANGS) {
      const c = onboardingContentFor(lang);
      expect(c.building.floorTitle, lang).toContain("{floor}");
      expect(c.building.limitCap.ldl, lang).toContain("{n}");
      expect(c.building.limitCap.kidneys, lang).toContain("{n}");
      expect(c.summary.floorMarker, lang).toContain("{floor}");
      expect(c.summary.capNote, lang).toContain("{share}");
      // The beats' computed fills — a hidden (empty) template drops its placeholder legitimately.
      if (c.beats.echo.rest !== "") expect(c.beats.echo.rest, lang).toContain("{rest}");
      if (c.beats.echo.days !== "") expect(c.beats.echo.days, lang).toContain("{burn}");
      expect(c.beats.prelim.gap, lang).toContain("{delta}");
      expect(c.beats.prelim.keepTitle, lang).toContain("{burn}");
      // The target ruler's and the pace screen's computed fills.
      for (const k of ["lowest", "now", "nowLowest", "deltaDown", "deltaUp"] as const) {
        expect(c.target.markers[k], lang).toContain("{weight}");
      }
      expect(c.target.suggestion.down, lang).toContain("{weight}");
      expect(c.target.suggestion.up, lang).toContain("{pct}");
      expect(c.pace.rate, lang).toContain("{rate}");
      expect(c.pace.result, lang).toContain("{target}");
      expect(c.pace.result, lang).toContain("{kcal}");
      if (c.pace.echo !== "") {
        expect(c.pace.echo, lang).toContain("{from}");
        expect(c.pace.echo, lang).toContain("{to}");
      }
      // The plan screen's computed fills.
      for (const k of [c.plan.goal.lose, c.plan.goal.gain, c.plan.info.targetLose, c.plan.info.targetGain, c.plan.loader.lose, c.plan.loader.gain]) {
        expect(k, lang).toContain("{kg}");
        expect(k, lang).toContain("{month}");
      }
      expect(c.plan.goal.maintain, lang).toContain("{kg}");
      expect(c.plan.goal.maintainRange, lang).toContain("{range}");
      expect(c.plan.satFat.perDay, lang).toContain("{g}");
      expect(c.plan.first.step, lang).toContain("{kcal}");
      expect(c.plan.chart.estimateAria, lang).toContain("{from}");
      expect(c.plan.chart.estimateAria, lang).toContain("{to}");
    }
  });

  it("passes the Russian gender gate on the referral ask, and the gate still catches a verb that is not the friend's", () => {
    expect(genderedRussian(onboardingContentFor("ru").referral)).toEqual([]);
    expect(genderedRussian(["Друг прислал ссылку, а ты не открыл её"]).length).toBeGreaterThan(0);
  });

  it("keeps the compiled first-meal words when the served block is missing, empty or partial", () => {
    const own = onboardingContentFor("de").firstMeal;
    for (const served of [undefined, null, {}, { ...own, ask: "" }, { ask: "x" }, "nope"]) {
      expect(usableFirstMeal(served, own)).toBe(own);
    }
    const served = { ...own, ask: "Admin's ask" };
    expect(usableFirstMeal(served, own)).toBe(served);
  });

  it("has the refusals' readers prefer a served revision over the compiled one", () => {
    const r = structuredClone(onboardingContentFor("en").refusals);
    r.invalid.age = "A"; r.ambiguousAge.confirm = "B {age}"; r.direction.switchToLose = "C"; r.switched.gain = "D";
    expect((checkNumber("birth_year", "abc", "en", { refusals: r }) as { line: string }).line).toBe("A");
    expect(AMBIGUOUS_AGE("en", r).confirm(30)).toBe("B 30");
    expect(checkDirection("gain", 80, 70, "en", r)!.switchLabel).toBe("C");
    expect(switchedLine("gain", "en", r)).toBe("D");
    // `switched.lose` is code on purpose — the pacing brake an admin edit must not weaken.
    expect(switchedLine("lose", "en", r)).toBe(chatCopyFor("en").switched.lose);
  });

  it("introduces no placeholder nothing fills", () => {
    // Per-key: `{year}`/`{age}` belong to the ambiguous-age exchange alone — one straying into
    // another key is a literal brace on screen, and a shared set could not see it.
    const common = new Set(["floor", "share", "n", "rest", "burn", "delta", "weight", "pct", "rate", "from", "to", "target", "month", "kcal", "kg", "range", "g"]);
    const own: Record<string, readonly string[]> = {
      "refusals.ambiguousAge.line": ["year"],
      "refusals.ambiguousAge.confirm": ["age"],
    };
    for (const lang of LANGS) {
      for (const [at, text] of Object.entries(flatten(onboardingContentFor(lang)))) {
        const known = new Set([...common, ...(own[at] ?? [])]);
        for (const m of text.matchAll(/\{(\w+)\}/g)) {
          expect(known.has(m[1]!), `${lang}.${at} uses {${m[1]}}`).toBe(true);
        }
      }
    }
  });

  it("says the same screens in the same order, so the funnel rows line up", () => {
    for (const lang of LANGS) {
      expect(onboardingContentFor(lang).screens.map((s) => s.id), lang).toEqual([...ONBOARDING_SCREENS]);
    }
  });

  it("is English for a language nobody has written, never undefined", () => {
    expect(onboardingContentFor("en")).toBe(ONBOARDING_CONTENT.en);
    expect(DEFAULT_ONBOARDING_CONTENT).toBe(ONBOARDING_CONTENT.en);
  });

  it("says nothing that is false where the line now stands (#50)", () => {
    // The web asks for a sign-in BEFORE the first question, so "No account needed to start" was
    // false there, and one content tree cannot say it on the phone only. The restrictions ask's
    // free-text sentence went with it — the web's chips screen has no text field.
    const welcomeClaim: Record<Lang, string> = {
      en: "No account needed to start",
      fr: "Pas besoin de compte pour commencer",
      de: "Zum Starten brauchst du kein Konto",
      it: "Per iniziare non serve un account",
      es: "No hace falta cuenta para empezar",
      vi: "Bắt đầu thì không cần tài khoản",
      id: "Mulai tanpa perlu akun",
      ru: "Чтобы начать, аккаунт не нужен",
      "pt-BR": "Não precisa de conta para começar",
      ja: "始めるのにアカウントは不要です",
      ko: "시작하는 데 계정이 필요 없어요",
      "zh-Hans": "无需账号即可开始",
      "zh-Hant": "不需要帳號即可開始",
      tr: "Başlamak için hesap gerekmez",
      pl: "Aby zacząć, nie potrzebujesz konta",
      nl: "Geen account nodig om te beginnen",
      uk: "Щоб почати, обліковий запис не потрібен",
      sv: "Du behöver inget konto för att börja",
      th: "ไม่ต้องมีบัญชีเพื่อเริ่มต้น",
      hi: "शुरू करने के लिए खाते की ज़रूरत नहीं",
      cs: "Ke startu nepotřebuješ účet",
      ro: "Nu ai nevoie de cont ca să începi",
      el: "Δεν χρειάζεσαι λογαριασμό για να ξεκινήσεις",
      hu: "A kezdéshez nem kell fiók",
      da: "Du behøver ikke en konto for at starte",
      fi: "Aloittamiseen ei tarvita tiliä",
      no: "Du trenger ikke konto for å begynne",
      sk: "Na začiatok nepotrebuješ účet",
      hr: "Za početak ti ne treba račun",
      sl: "Za začetek ne potrebuješ računa",
      ca: "No cal cap compte per començar",
      ms: "Tidak perlu akaun untuk bermula",
      "pt-PT": "Não precisas de conta para começar",
      bn: "শুরু করতে অ্যাকাউন্ট লাগে না",
      gu: "શરૂ કરવા માટે ખાતાની જરૂર નથી",
      kn: "ಪ್ರಾರಂಭಿಸಲು ಖಾತೆ ಬೇಕಿಲ್ಲ",
      ml: "തുടങ്ങാൻ അക്കൗണ്ട് വേണ്ട",
      mr: "सुरू करण्यासाठी खाते लागत नाही",
      or: "ଆରମ୍ଭ କରିବାକୁ ଖାତା ଦରକାର ନାହିଁ",
      pa: "ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਖਾਤੇ ਦੀ ਲੋੜ ਨਹੀਂ",
      ta: "தொடங்க கணக்கு தேவையில்லை",
      te: "ప్రారంభించడానికి ఖాతా అవసరం లేదు",
    };
    const freeText = /free text|texte libre|Freitext|testo libero|texto libre|Viết tự do|Teks bebas|Свободный текст/i;
    for (const lang of LANGS) {
      const c = onboardingContentFor(lang);
      expect(c.welcome.lines.join(" "), lang).not.toContain(welcomeClaim[lang]!);
      // No screen may ask for free text — the answer set is enumerable everywhere.
      for (const screen of c.screens) {
        for (const ask of Object.values(screen.asks)) {
          expect(ask.lines.join(" "), `${lang}.${screen.id}`).not.toMatch(freeText);
        }
      }
    }
  });
});

describe("usableContentFor", () => {
  it("falls back to THIS language's compiled-in copy, not to English", () => {
    // The whole point of the per-language fallback. A German whose host has never saved German
    // copy gets the German the binary ships with — falling back to English here would be the
    // "half the screens are English" failure #358 exists to prevent.
    expect(usableContentFor("de", null)).toBe(ONBOARDING_CONTENT.de!);
    expect(usableContentFor("de", { junk: true })).toBe(ONBOARDING_CONTENT.de!);
  });

  it("reads a stored revision for the language it was saved under", () => {
    const stored = structuredClone(ONBOARDING_CONTENT.de!);
    stored.version = 99;
    expect(usableContentFor("de", { de: stored }).version).toBe(99);
    // And the languages beside it are untouched by that save.
    expect(usableContentFor("fr", { de: stored })).toBe(ONBOARDING_CONTENT.fr!);
  });

  it("reads a LEGACY row — a bare OnboardingContent — as English and nothing else", () => {
    // Every host that pressed Save before this branch has one. It was English, because English was
    // all there was, and reading it as the German revision would serve English to Germans.
    const legacy = structuredClone(DEFAULT_ONBOARDING_CONTENT);
    legacy.version = 42;
    expect(usableContentFor("en", legacy).version).toBe(42);
    expect(usableContentFor("de", legacy)).toBe(ONBOARDING_CONTENT.de!);
  });
});

/** Every string in a content tree, keyed well enough to name in a failure. */
function flatten(node: unknown, at = "", out: Record<string, string> = {}): Record<string, string> {
  if (typeof node === "string") { out[at] = node; return out; }
  if (Array.isArray(node)) { node.forEach((v, i) => flatten(v, `${at}[${i}]`, out)); return out; }
  if (typeof node === "object" && node !== null) {
    for (const [k, v] of Object.entries(node)) flatten(v, at === "" ? k : `${at}.${k}`, out);
  }
  return out;
}
