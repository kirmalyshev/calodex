// How a sign-in code reaches an inbox — and how an alert reaches the operator — as a port.
//
// Same reason `push/port.ts` and `llm/port.ts` exist: the engine asks for the mail and must not
// know which provider carries it — a test, a dev run and `--demo` get the `log` implementation and
// read the code off the server log, never off a network.
//
// Two methods because there are two kinds of mail, and never a generic send(subject, body):
// that shape invites a third caller before there is copy for one; the day another mail exists
// this grows a third method or a union type.

import type { Lang } from "@eait/shared";

export interface MailPort {
  /**
   * Deliver `code` to `to`, worded in `lang`.
   *
   * Throws on a provider failure rather than swallowing it: the caller's code stays live in the
   * store either way, and a mail that did not go out is the failure a silent 204 would hide.
   */
  sendSignInCode(to: string, code: string, lang: Lang): Promise<void>;
  /**
   * Deliver an OPERATOR alert — the same path deploy/disk-alert.sh uses: the address ACME expiry
   * notices already reach (ieat-app#3435). Plain text, English, no copy table: it is for the
   * person who runs the instance, not a user. May throw; the caller treats a failed alert as a
   * log line, never as a failure of the turn that raised it.
   */
  sendAlert(to: string, subject: string, text: string): Promise<void>;
}
