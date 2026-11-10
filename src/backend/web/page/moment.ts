// The two beat cards inside the W2 walk — `baseline` (the BMI the typed height and weight
// compute) after the weight, and `prelim` (the mid-journey plan: burn vs. the number the
// answers produce) after the pace. They collect nothing, so they are GET pages the redirect
// names (`?show=`), not POST handlers of their own: Continue is a link back into the walk.

import {
  bmi, BMI_AXIS, BMI_SEGMENTS, bmiRange, bmiRangeLabel, chatCopyFor, explainTargets, fill, kcalNumbers, numbers,
} from "@eait/shared";
import type { Lang, OnboardingContent, Profile } from "@eait/shared";
import { pageCopyFor } from "../copy.ts";
import { ctaLink, dash, say, wtop } from "./board.ts";
import { escape, shell } from "./shell.ts";

/**
 * `baseline` — the BMI the typed height and weight compute on the WHO band bar, the band's own
 * range label under it, and the one-line "what this is" the copy carries. Computed here from the
 * profile and never stored; a profile missing either number draws the title only.
 */
function baselineCards(profile: Profile, content: OnboardingContent, lang: Lang): string {
  const b = content.beats.baseline;
  // The band boundaries stay code: they are numbers-as-labels off the WHO edges, not copy.
  const bands = chatCopyFor(lang).baseline.bands;
  const value = bmi(profile.weight_kg, profile.height_cm);
  const band = value === null ? null
    : value < 18.5 ? "under" : value < 25 ? "healthy" : value < 30 ? "over" : "obese";
  const range = value === null ? null : bmiRange(value);
  const on = range === null ? -1 : BMI_SEGMENTS.findIndex((seg) => seg.id === range);
  const at = value === null ? 0 : BMI_AXIS.at(value);
  // The figure counts up while the marker slides (1.2 s, both): the whole part through `.count`,
  // the tenth after it in this language's separator.
  const shown = value === null ? "" : numbers(lang)(value);
  const whole = value === null ? 0 : Math.trunc(value);
  const tail = shown.replace(/^\d+/, "");
  const meter = value === null ? "" :
    `<div class="card bmi-c"><div class="bmi-h"><span>${escape(b.bmi)}</span>` +
    `<b aria-label="${escape(shown)}"><span class="count" style="--to:${whole};--d:.5s;animation-duration:1.2s"></span>${escape(tail)}</b></div>` +
    `<div class="bmi-b">${BMI_SEGMENTS.map((seg, i) => `<i${i === on ? ' class="cur"' : ""}></i>`).join("")}` +
    `<span class="bmi-k" style="left:${at}%"></span></div>` +
    `<div class="bmi-l">${BMI_SEGMENTS.map((seg, i) => `<span${i === on ? ' class="cur"' : ""}>${escape(bmiRangeLabel(seg.id, lang))}</span>`).join("")}</div>` +
    `<div class="bmi-w">${escape(bands[band!])}</div></div>`;
  return `<div class="bstack">${meter}` +
    `<p class="muted-sub">${escape(b.what)}</p></div>`;
}

/**
 * `prelim` — the mid-journey plan as ONE card (board 10b), its two rows: "You burn" (the maintenance number the answers
 * produce — `basis.tdee`, rest plus the days' own activity) against "You eat" (the plan's kcal),
 * with the signed gap named as the pace. `explainTargets` is the one path a kcal target may come
 * from, so the card reads it like every other plan surface. A flat-band profile has no burn to
 * split, and draws the plan's row only.
 */
export function prelimCards(profile: Profile, content: OnboardingContent, lang: Lang): string {
  const p = content.beats.prelim;
  const { targets, basis } = explainTargets(profile, new Date());
  const kn = kcalNumbers(lang);
  const signed = (x: number): string =>
    (Math.round(x) < 0 ? "−" : Math.round(x) > 0 ? "+" : "") + kn(Math.abs(Math.round(x)));
  const row = (label: string, figure: string, eat: boolean) =>
    `<div class="plr${eat ? " eat" : ""}" role="group" aria-label="${escape(`${label} ${figure} ${p.perDay}`)}">` +
    `<span>${escape(label)}</span><b class="num">${escape(figure)}</b></div>`;
  const delta = basis.tdee === null ? 0 : Math.round(targets.kcal - basis.tdee);
  // DIRECTION (How we got there): a deficit pace is care blue, a surplus the accent, zero muted.
  const tone = delta < 0 ? "care" : delta > 0 ? "up" : "flat";
  const burn = basis.tdee === null ? "" : row(p.burn, `≈${kn(basis.tdee)}`, false) +
    `<p class="plg ${tone}">${escape(fill(p.gap, { delta: signed(delta) }))}</p>`;
  return `<div class="bstack"><div class="card plc">${burn}${row(p.eat, kn(targets.kcal), true)}` +
    `<p class="plu" aria-hidden="true">${escape(p.perDay)}</p></div></div>`;
}

/** An interstitial — the two beats between the questions. GET, not POST: they collect nothing,
 *  so the Continue is a link back into the walk. */
export function interstitial(
  place: "baseline" | "prelim",
  profile: Profile,
  content: OnboardingContent,
  lang: Lang,
  continueHref: string,
  back: string,
): string {
  const beats = content.beats;
  const inner = place === "baseline" ? baselineCards(profile, content, lang) : prelimCards(profile, content, lang);
  const title = place === "baseline" ? beats.baseline.title
    : profile.goal === "maintain"
      ? fill(beats.prelim.keepTitle, { burn: kcalNumbers(lang)(explainTargets(profile, new Date()).basis.tdee ?? 0) })
      : beats.prelim.title;
  const body = `${wtop()}
<div class="wmain one q mom"><div class="wcol">
${dash(place, lang, { href: back, label: pageCopyFor(lang).back })}
<div class="igroup">
${say([title])}
${inner}
${ctaLink(continueHref, content.ui.continueLabel)}
</div>
</div></div>`;
  return shell("eait", body, lang, "ob");
}
