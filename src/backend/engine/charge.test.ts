// ieat-app#2679: a queued photo job's charge is ONE row per job, never one per attempt — a retried
// attempt runs on the charge its dead predecessor stamped rather than charging again, and the cap's
// count-and-insert is a single guarded write, not a read the engine did first.

import { beforeEach, describe, expect, it } from "bun:test";
import { grantEveryAccount } from "../dev/grant.ts";
import { localDate } from "@eait/shared";
import { configDefaults, type Config } from "../config.ts";
import { demoPorts } from "../llm/demo.ts";
import type { LlmPorts } from "../llm/port.ts";
import { memoryStore } from "../store.memory.ts";
import type { Store } from "../store.ts";
import { fakePush } from "../push/fake.ts";
import { logMail } from "../mail/log.ts";
import { patchProfile, queuePhoto, type EngineDeps } from "./index.ts";
import { logPhotoTurn } from "./meals.ts";

const CONFIG: Config = {
  ...configDefaults(),
  port: 0, databaseUrl: "memory://test",
  llmProvider: "demo", llmModel: "demo", llmApiKey: "unused",
};
const ZONE = CONFIG.timezone;

let store: Store;
const makeDeps = (llm: LlmPorts = demoPorts(), over: Partial<Config> = {}): EngineDeps =>
  ({ store, config: { ...CONFIG, ...over }, llm, push: fakePush(), mail: logMail() });

async function onboard(): Promise<string> {
  const { userId } = await store.upsertDeviceUser(crypto.randomUUID() + crypto.randomUUID(), "en");
  // A real account, the S8 kind: a device session alone is anonymous, and anonymous
  // is refused analysis. The tests below are about everything AFTER sign-up.
  await store.addIdentity(userId, "google", "g-" + userId.slice(0, 8));
  const out = await patchProfile(makeDeps(), userId, {
    goal: "lose", sex: "female", birth_year: 1990, height_cm: 165, weight_kg: 70,
    target_weight_kg: 65, activity: "some", pace: "steady", country: "de",
    restrictions: [], complete_onboarding: true,
  });
  if (!out || !out.ok) throw new Error("onboarding failed");
  return userId;
}

/** A live entitlement, as the RevenueCat webhook would have written it. Each call is a newer event. */
let eventSeq = 0;
async function entitle(userId: string): Promise<void> {
  await store.putEntitlement(userId, {
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    productId: "com.eait.fit.ios.yearly",
    eventAt: new Date(Date.now() + ++eventSeq * 1000).toISOString(),
  });
}

const jpeg = () => { const b = new Uint8Array(10).fill(1); b[0] = 0xff; b[1] = 0xd8; return b; };
const REGISTRY = [{ kind: "photo", version: 1 }];
const LEASE_MS = 30_000;
const lost = () => new Error("job lease lost");

beforeEach(() => { store = grantEveryAccount(memoryStore(), 1_000_000); });

describe("a queued photo job's charge (#2679)", () => {
  /**
   * Attempt one of `clientId`, run under `owner` like the worker runs it — the handler's own call,
   * `job` carrying what the job record already knows: the lease owner and the charge a dead
   * attempt stamped.
   */
  const attempt = async (
    deps: EngineDeps, userId: string, clientId: string, owner: string, analysisId: string | null,
  ) => logPhotoTurn(deps, userId, {
    images: [async () => jpeg()], clientId,
    job: { clientId, owner, lost, analysisId },
  });

  it("a retried attempt runs on the dead attempt's charge — one row, one meal", async () => {
    const userId = await onboard();
    await entitle(userId);
    // A cap of one makes the point twice over: the retry meets its own charge in the count, so an
    // idempotent charge is the only way the meal can land at all.
    const deps = makeDeps(demoPorts(), { paidDailyPhotoCap: 1 });
    const clientId = crypto.randomUUID();
    await queuePhoto(deps, userId, { images: [async () => jpeg()], clientId });
    const first = await store.claimJob("w1", REGISTRY, LEASE_MS);
    expect(first).toMatchObject({ clientId, attempts: 1 });

    // Attempt 1 charges, its analyzer errors (a charge on ambiguity — the call may have cost real
    // money), and its worker dies before settling: the lease goes back and another worker claims.
    const failed = { ...demoPorts(), analyzePhoto: async () => { throw new Error("worker died mid-call"); } };
    const r1 = await attempt(makeDeps(failed, { paidDailyPhotoCap: 1 }), userId, clientId, "w1", first!.analysisId);
    expect(r1.kind).toBe("analysis-failed");
    const stamped = (await store.getJob(userId, clientId))!.analysisId;
    expect(stamped).not.toBeNull();
    expect(await store.countUserPhotos(userId, localDate(ZONE))).toBe(1);

    await store.releaseJobs("w1");
    const second = await store.claimJob("w2", REGISTRY, LEASE_MS);
    expect(second).toMatchObject({ clientId, attempts: 2, leaseOwner: "w2" });

    // Attempt 2 re-runs the whole turn. The charge it must find is the one the job already carries —
    // not a second row, and not a cap refusal against the allowance its own spend just filled.
    const r2 = await attempt(deps, userId, clientId, "w2", second!.analysisId);
    expect(r2.kind).toBe("logged");
    expect(await store.countUserPhotos(userId, localDate(ZONE))).toBe(1);
    expect((await store.getJob(userId, clientId))!.analysisId).toBe(stamped);
  });

  it("a lease that is gone charges nothing — 'lost', before any row exists", async () => {
    const userId = await onboard();
    const deps = makeDeps();
    const clientId = crypto.randomUUID();
    await queuePhoto(deps, userId, { images: [async () => jpeg()], clientId });
    const job = await store.claimJob("w1", REGISTRY, LEASE_MS);
    // Another owner reclaimed it: the old attempt's charge must not land under a lease it lost.
    await store.releaseJobs("w1");
    await store.claimJob("w2", REGISTRY, LEASE_MS);
    await expect(attempt(deps, userId, clientId, "w1", job!.analysisId)).rejects.toThrow("job lease lost");
    expect(await store.countUserPhotos(userId, localDate(ZONE))).toBe(0);
  });
});
