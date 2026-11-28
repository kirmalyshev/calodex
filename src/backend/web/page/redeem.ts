import { fill, payCopyFor, redeemCopyFor } from "@eait/shared";
import type { Lang } from "@eait/shared";
import { escape, shell } from "./shell.ts";

/**
 * The code field behind the offer's `Redeem code` link (S4, kirmalyshev-org/calodex_app#3695): a label, the
 * field, Redeem, and the sentence for what came back. No script. A discount that took ends the page
 * on `Continue` back to the plans with the code carried; a free code never draws here — it sends the
 * account on. Every word is `PAY_COPY`'s or `REDEEM_COPY`'s.
 */
export interface RedeemView {
  /** What was typed, put back in the field after a refusal. */
  value: string;
  /** The sentence for a refusal, or for a discount that took (`ok`). */
  notice: { ok: boolean; text: string } | null;
  /** Where Continue goes after a discount took — the plans, carrying the code. */
  continueHref: string | null;
  /** The form's action. */
  action: string;
  /** Where × goes: back to the plans. */
  closeHref: string;
  lang: Lang;
}

export function redeem(v: RedeemView): string {
  const pay = payCopyFor(v.lang);
  const copy = redeemCopyFor(v.lang);
  const close = `<a class="x" href="${escape(v.closeHref)}" aria-label="${escape(pay.closeLabel)}">×</a>`;
  const notice = v.notice === null ? "" : `<p class="note" role="${v.notice.ok ? "status" : "alert"}">${escape(v.notice.text)}</p>`;
  const body = v.continueHref !== null
    ? `${notice}\n<a class="button primary" href="${escape(v.continueHref)}">${escape(pay.continueCta)}</a>`
    : `<label class="note" for="code">${escape(copy.redeemField)}</label>
<input id="code" name="code" type="text" value="${escape(v.value)}" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="40" required>
${notice}
<button class="button primary" type="submit">${escape(copy.redeemSubmit)}</button>`;
  return shell(pay.redeemLink, `
<form class="offer" action="${escape(v.action)}" method="post">
${close}
<h1>${escape(fill(pay.redeemLink, {}))}</h1>
${body}
</form>
`, v.lang);
}
