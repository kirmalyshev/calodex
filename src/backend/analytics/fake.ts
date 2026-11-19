// The analytics sink the tests assert against: it records instead of sending. Not wired into any binary.
import type { AnalyticsPort } from "./posthog.ts";

export interface Captured { userId: string; event: string; props: Record<string, unknown> }

export function fakeAnalytics(): AnalyticsPort & { readonly captured: Captured[] } {
  const captured: Captured[] = [];
  return { captured, capture: (userId, event, props) => { captured.push({ userId, event, props }); } };
}
