import { describe, expect, it } from "bun:test";
import { plateVerdicts } from "./plate-verdicts.ts";

// The store persona's plan (landing PERSONA_PROFILE, restrictions [ldl]).
const PLAN = { kcal: 1434, protein_g: 109, carbs_g: 142, fat_g: 48, satfat_g: 13 };

describe("plateVerdicts (ieat-app#3165, T1 arm B)", () => {
  it("judges the welcome plate against the user's plan, as a logged meal is judged", () => {
    expect(plateVerdicts({ kcal: 365, satfat_g: 5 }, PLAN, ["ldl"])).toEqual({ weight: "good", ldl: "warn" });
  });

  it("never judges a figure the plate does not carry — no invented sodium pill", () => {
    const withSodiumCap = { ...PLAN, sodium_mg: 2000 };
    expect(plateVerdicts({ kcal: 365, satfat_g: 5 }, withSodiumCap, ["ldl", "kidneys"])).toEqual({ weight: "good", ldl: "warn" });
    expect(plateVerdicts({ kcal: 365 }, PLAN, ["ldl"])).toEqual({ weight: "good" });
  });

  it("shows no dimension the user did not declare", () => {
    expect(plateVerdicts({ kcal: 365, satfat_g: 5 }, PLAN, [])).toEqual({ weight: "good" });
  });
});
