// The operator alert a credit-class provider answer fires (ieat-app#3435).
//
// #3430 found it the wrong way: a paying user's photos all failed, and on 17 Nov fourteen calls
// answered http_402 or aborted while nobody heard anything — the failure was only visible in a
// funnel a week later. A 401/402 is the OPERATOR's account: the key refused, or the balance empty.
// It is not load (429/503 keeps its generic failure), it is not a model that fell over, and no
// retry the user makes fixes it — so the row keeps the provider's own words (`error_body`) and the
// alert goes out on the metric itself, the moment the call is known, through the mail path the
// stack already has (`deploy/disk-alert.sh` alerts the same way).
//
// The console line is unthrottled — every credit-class call lands on the log. The MAIL is
// throttled: a dead provider fails every turn until it is fixed, and one alert per interval says
// "still down" without mailing the operator once per user's photo.

import { CREDIT_CLASS, type LlmCallMetric } from "../llm/port.ts";
import type { EngineDeps } from "./deps.ts";

/** One mail per window — a burst of failed turns is one incident, not one mail per turn. */
const ALERT_EVERY_MS = 30 * 60_000;
let lastAlertAt = 0;

/** The wire statuses that mean the account/key, read off the metric's `http_<n>` shape. */
const isCreditClass = (status: string): boolean =>
  status.startsWith("http_") && CREDIT_CLASS.has(Number(status.slice(5)));

/**
 * Called on every provider-call metric, where the row is written (caps.ts `onCall`). Alerts when
 * the call ended credit-class. Never throws: alerting must not break the turn it rode in on.
 */
export function alertProviderCredit(deps: EngineDeps, metric: LlmCallMetric): void {
  if (!isCreditClass(metric.status)) return;
  const body = metric.errorBody ?? "(the provider sent no body)";
  console.error(`[eait] ALERT provider ${metric.status} on ${metric.call} (${metric.modelRequested}): ${body}`);
  const now = Date.now();
  if (now - lastAlertAt < ALERT_EVERY_MS) return;
  lastAlertAt = now;
  const to = deps.config.alertEmail.trim();
  if (to === "") return;
  const subject = `eait: provider answered ${metric.status}`;
  const text = [
    `A ${metric.call} call to ${metric.modelRequested} answered ${metric.status}.`,
    `The provider's body: ${body}`,
    `Check the provider's balance and key — every analysis fails this way until it is fixed.`,
  ].join("\n");
  void deps.mail.sendAlert(to, subject, text)
    .catch((e: unknown) => console.error(`[eait] alert mail failed: ${(e as Error)?.message ?? e}`));
}
