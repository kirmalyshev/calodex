// The fragments more than one screen draws: the typed lines, the slim top bar.

import { currentBrand } from "@eait/shared";
import type { PageCopy } from "../copy.ts";
import type { ConsentChoice } from "../../engine/appsflyer-web.ts";
import { escape } from "./shell.ts";

export const bubbles = (lines: readonly string[]): string =>
  lines.map((line) => `<p class="bubble typed">${escape(line)}</p>`).join("");

/** A question's lines, the last — the question itself — as the page's one h1 (#53). */
export const askBubbles = (lines: readonly string[]): string =>
  lines.map((line, i) => i === lines.length - 1
    ? `<h1 class="bubble typed">${escape(line)}</h1>`
    : `<p class="bubble typed">${escape(line)}</p>`).join("");

/** The design's slim top bar: the wordmark, and the reassurance that the phone can take over. */
export const topBar = (PAGE_COPY: PageCopy): string =>
  `<div class="wbar"><strong>${escape(currentBrand().name)}</strong><small>${escape(PAGE_COPY.topBarNote)}</small></div>`;

/**
 * The consent banner (ieat-app#3621, board ob-welcome-consent): one line, the verb
 * linking the privacy policy's cookie section, and Decline then Accept as two equal POST forms.
 * No script: each button posts `choice` and `back` (this page's own path and query, so an ad's
 * click params on it survive the round trip) to `/start/consent`. With no policy configured the
 * line is drawn with no link rather than a link to nowhere.
 */
export function consentBanner(copy: PageCopy, opts: { privacyHref: string | null; back: string }): string {
  const verb = escape(copy.cookieLink);
  const linked = opts.privacyHref === null ? verb : `<a href="${escape(`${opts.privacyHref}#cookies`)}">${verb}</a>`;
  const line = copy.cookieNotice.split("{link}").map(escape).join(linked);
  const button = (choice: ConsentChoice, label: string) =>
    `<form method="post" action="/start/consent"><input type="hidden" name="choice" value="${choice}">` +
    `<input type="hidden" name="back" value="${escape(opts.back)}"><button type="submit">${escape(label)}</button></form>`;
  // The region is named by its own sentence, so its name is in the page's language too.
  const name = escape(copy.cookieNotice.replace("{link}", copy.cookieLink));
  return `<div class="ck" role="region" aria-label="${name}"><p>${line}</p>` +
    `<div class="ck-b">${button("decline", copy.cookieDecline)}${button("accept", copy.cookieAccept)}</div></div>`;
}
