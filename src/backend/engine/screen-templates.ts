// Onboarding screen templates (ieat-app#3167): the admin's verbs and the serving half.
//
// The admin page and the eait-admin MCP both reach these through `/admin/api/*`, so there is one
// set of rules for Kirill and the coordinator. Serving never throws: a template that cannot be
// read is a slot the client skips, and onboarding walks the compiled flow.

import {
  isTimezone, localTime, pickArmScreen, resolveScreen, TEMPLATE_KEY, validateArmScreens, validateScreenTemplate,
  type ArmScreens, type Lang, type ScreenTemplateDraft, type ServedScreen, type TemplateSlot,
} from "@eait/shared";
import { imageMime } from "../llm/port.ts";
import type { OnboardingVariant } from "../store.ts";
import type { EngineDeps } from "./deps.ts";

type Result<T = object> = ({ ok: true } & T) | { ok: false; errors: string[] };

/** The public URL an asset is fetched from. */
export const templateAssetUrl = (sha256: string) => `/v1/onboarding/assets/${sha256}`;

/** Append the next revision of `key`, after every check `validateScreenTemplate` makes. */
export async function saveScreenTemplate(
  deps: EngineDeps, adminId: string, key: string, draft: ScreenTemplateDraft,
): Promise<Result<{ version: number }>> {
  if (!TEMPLATE_KEY.test(key)) return { ok: false, errors: ["key must be lowercase letters, digits and hyphens"] };
  const shas = Array.isArray(draft?.blocks)
    ? draft.blocks.flatMap((b) => (b?.type === "image" && typeof b.asset === "string" ? [b.asset] : []))
    : [];
  const errors = validateScreenTemplate(draft, await deps.store.knownTemplateAssets(shas));
  if (errors.length > 0) return { ok: false, errors };
  const { renderer, blocks, strings, note } = draft;
  const saved = await deps.store.putScreenTemplate(key, { renderer, blocks, strings, ...(note ? { note } : {}) }, adminId);
  return saved ? { ok: true, version: saved.version } : { ok: false, errors: ["another save took this version — save again"] };
}

/** Store an uploaded image, sniffed by its bytes and capped like a meal photo. */
export async function uploadTemplateAsset(deps: EngineDeps, bytes: Uint8Array): Promise<Result<{ sha256: string }>> {
  const mime = imageMime(bytes);
  if (!mime) return { ok: false, errors: ["only JPEG, PNG or WebP"] };
  if (bytes.byteLength > deps.config.maxUploadBytes) return { ok: false, errors: [`over ${deps.config.maxUploadBytes} bytes`] };
  const sha256 = new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
  await deps.store.putTemplateAsset(sha256, mime, bytes);
  return { ok: true, sha256 };
}

/** Every template revision an arm names that does not exist, as an error line. */
async function missingTemplates(deps: EngineDeps, screens: ArmScreens): Promise<string[]> {
  const errors: string[] = [];
  for (const [slot, entries] of Object.entries(screens)) {
    for (const [i, e] of (entries ?? []).entries()) {
      if (!(await deps.store.screenTemplate(e.template, e.version))) {
        errors.push(`screens.${slot}[${i}]: ${e.template}@${e.version} does not exist`);
      }
    }
  }
  return errors;
}

/** Set (or, with `{}`, clear) one draft arm's screens. Never on control: control is the compiled flow. */
export async function saveOnboardingVariantScreens(
  deps: EngineDeps, id: string, index: number, screens: ArmScreens,
): Promise<Result> {
  const experiment = (await deps.store.listOnboardingExperiments()).find((e) => e.id === id);
  if (!experiment) return { ok: false, errors: ["experiment not found"] };
  if (!Number.isInteger(index) || index < 0 || index >= experiment.variants.length) return { ok: false, errors: ["no such variant"] };
  if (experiment.variants[index]!.control) return { ok: false, errors: ["the control arm walks the compiled flow — it takes no screens"] };
  if (experiment.status !== "draft") return { ok: false, errors: ["only a draft's arms take screens — a running arm is frozen"] };
  const errors = validateArmScreens(screens);
  if (errors.length > 0) return { ok: false, errors };
  const missing = await missingTemplates(deps, screens);
  if (missing.length > 0) return { ok: false, errors: missing };
  const empty = Object.keys(screens).length === 0;
  experiment.variants = experiment.variants.map((v, i) => {
    if (i !== index) return v;
    const { screens: _old, ...rest } = v;
    return empty ? rest : { ...rest, screens };
  });
  const wrote = await deps.store.putOnboardingExperiment(experiment, experiment.revision);
  return wrote ? { ok: true } : { ok: false, errors: ["the experiment changed under you — reload the page"] };
}

/** The errors that keep an experiment's screens from starting: a template deleted or never saved. */
export async function screensStartErrors(deps: EngineDeps, variants: readonly OnboardingVariant[]): Promise<string[]> {
  const errors: string[] = [];
  for (const [i, v] of variants.entries()) {
    if (!v.screens) continue;
    for (const e of [...validateArmScreens(v.screens), ...(await missingTemplates(deps, v.screens))]) errors.push(`arm ${i}: ${e}`);
  }
  return errors;
}

/** The highest renderer any arm's templates need; 0 when no arm has screens. */
export async function rendererNeeded(deps: EngineDeps, variants: readonly OnboardingVariant[]): Promise<number> {
  let need = 0;
  for (const v of variants) {
    for (const entries of Object.values(v.screens ?? {})) {
      for (const e of entries ?? []) {
        const t = await deps.store.screenTemplate(e.template, e.version);
        // A template that vanished cannot be drawn by anyone: nobody enrols.
        need = Math.max(need, t ? t.renderer : Number.POSITIVE_INFINITY);
      }
    }
  }
  return need;
}

/** What `GET /v1/onboarding` sends beside the words: one screen per slot whose window holds now. */
export interface ServedScreens {
  slots: Partial<Record<TemplateSlot, ServedScreen>>;
}

/**
 * The arm's screens for this client, resolved in its language at the USER's local hour (Q1). A slot
 * none of whose entries holds now is absent, so the client walks the compiled beat there. Never throws.
 */
export async function servedScreens(
  deps: EngineDeps, variant: OnboardingVariant, lang: Lang, tz: string | null | undefined, at: Date,
): Promise<ServedScreens | undefined> {
  if (!variant.screens) return undefined;
  try {
    const hour = typeof tz === "string" && isTimezone(tz) ? Number(localTime(tz, at).slice(0, 2)) : null;
    const slots: ServedScreens["slots"] = {};
    for (const [slot, entries] of Object.entries(variant.screens) as [TemplateSlot, NonNullable<ArmScreens[TemplateSlot]>][]) {
      const pick = pickArmScreen(entries, hour);
      if (!pick) continue;
      const t = await deps.store.screenTemplate(pick.template, pick.version);
      if (t) slots[slot] = resolveScreen(t, lang, templateAssetUrl);
    }
    return { slots };
  } catch (err) {
    console.error("[eait] screen template read failed", err);
    return undefined;
  }
}
