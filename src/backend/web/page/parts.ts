// The fragments more than one screen draws: the typed lines, the slim top bar.

import { currentBrand } from "@eait/shared";
import type { PageCopy } from "../copy.ts";
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
