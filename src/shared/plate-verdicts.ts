// T1 arm B (ieat-app#3165): the welcome plate's verdict, worked against the user's own plan.
//
// The same arithmetic a logged meal gets (`verdictsFromTargets` → `visibleVerdicts`), with one
// difference: a plate shown to a stranger carries only the figures somebody sourced, so a
// dimension the plate has no figure for is LEFT OUT rather than judged from a zero. A sodium pill
// computed from "0 mg" would tell a kidney patient the toast is fine on evidence nobody has.

import { verdictsFromTargets, visibleVerdicts } from "./targets.ts";
import type { FoodTargets, MealVerdicts } from "./types.ts";

export interface PlateFigures {
  kcal: number;
  satfat_g?: number;
  sodium_mg?: number;
}

export function plateVerdicts(plate: PlateFigures, targets: FoodTargets, restrictions: readonly string[]): MealVerdicts {
  const all = visibleVerdicts(
    verdictsFromTargets({ kcal: plate.kcal, satfat_g: plate.satfat_g ?? 0, sodium_mg: plate.sodium_mg ?? 0 }, targets),
    restrictions,
  );
  if (plate.satfat_g === undefined) delete all.ldl;
  if (plate.sodium_mg === undefined) delete all.kidneys;
  return all;
}
