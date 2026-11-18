// SIGTERM's order (ieat-app#3108): out of the proxy's rotation FIRST, and only once the proxy has
// had time to notice, stop accepting. Closing the listener in the same tick `/health` goes 503
// leaves Caddy sending requests here for up to two health intervals, and a POST on a pooled
// connection to a closed listener is a 502 Caddy will not retry.

import { expect, test } from "bun:test";
import { leaveRotation } from "./shutdown.ts";

test("unhealthy first, then the settle wait, then the listener stops", async () => {
  const order: string[] = [];
  await leaveRotation({
    markDraining: () => order.push("draining"),
    settleMs: 5000,
    sleep: async (ms) => void order.push(`sleep ${ms}`),
    stop: async () => void order.push("stop"),
  });
  expect(order).toEqual(["draining", "sleep 5000", "stop"]);
});
