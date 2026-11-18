// SIGTERM's order (ieat-app#3108): out of the proxy's rotation FIRST, and only once the proxy has
// had time to notice, stop accepting. Closing the listener in the same tick `/health` goes 503
// leaves Caddy sending requests here for up to two health intervals, and a POST on a pooled
// connection to a closed listener is a 502 Caddy will not retry.

import { expect, test } from "bun:test";
import { join } from "node:path";
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

test("the real server, on SIGTERM: /health 503 while other routes still answer, then it exits", async () => {
  const port = 30000 + Math.floor(Math.random() * 20000);
  const p = Bun.spawn(["bun", join(import.meta.dir, "index.ts"), "--demo"], {
    env: { ...process.env, EAIT__BACKEND__PORT: String(port), EAIT__BACKEND__SHUTDOWN_SETTLE_MS: "1500" },
    stdout: "pipe",
    stderr: "pipe",
  });
  const base = `http://127.0.0.1:${port}`;
  const status = (path: string) => fetch(base + path).then((r) => r.status, () => 0);
  for (let i = 0; i < 200 && (await status("/health")) !== 200; i++) await Bun.sleep(50);
  expect(await status("/health")).toBe(200);
  p.kill("SIGTERM");
  await Bun.sleep(300);
  expect(await status("/health")).toBe(503);
  expect(await status("/v1/profile")).toBe(401); // the listener is still open: the backend answered
  expect(await p.exited).toBe(0);
}, 20_000);
