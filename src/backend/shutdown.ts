/**
 * Leave the proxy's rotation before closing the listener (ieat-app#3108): `/health` goes 503,
 * the proxy's health check gets `settleMs` to see it and route elsewhere, and only then does the
 * listener stop. In-flight requests still finish inside `stop`.
 */
export async function leaveRotation(o: {
  markDraining: () => void;
  settleMs: number;
  stop: () => Promise<void>;
  sleep?: (ms: number) => Promise<void>;
}): Promise<void> {
  o.markDraining();
  await (o.sleep ?? Bun.sleep)(o.settleMs);
  await o.stop();
}
