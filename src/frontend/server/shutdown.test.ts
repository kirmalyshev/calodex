// SIGTERM is a graceful stop (ieat-app#3108): the deploy recreates the web container, and without a
// handler bun dies on the signal with every in-flight page cut. With one, `server.stop()` lets them
// finish and the process exits 0 instead of by signal.

import { expect, test } from "bun:test";
import { join } from "node:path";

test("the web server exits 0 on SIGTERM, after stopping, not killed by the signal", async () => {
  const port = 20000 + Math.floor(Math.random() * 20000);
  const p = Bun.spawn(["bun", join(import.meta.dir, "index.ts")], {
    env: { ...process.env, EAIT__FRONTEND__PORT: String(port) },
    stdout: "pipe",
    stderr: "pipe",
  });
  for (let i = 0; i < 100; i++) {
    if (await fetch(`http://127.0.0.1:${port}/health`).then(() => true, () => false)) break;
    await Bun.sleep(50);
  }
  p.kill("SIGTERM");
  expect(await p.exited).toBe(0);
  expect(p.signalCode).toBeNull();
});
