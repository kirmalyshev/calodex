import { describe, expect, it } from "bun:test";
import {
  DASH_PLACES, DEFAULT_ORDER, ONBOARDING_ORDER_VERSION, ONBOARDING_PLACES, ORDER_AFTER, REMOVABLE_PLACES,
  dashPlaces, orderFellBack, promptsFor, resumeAt, servedOrder, validateOnboardingOrder,
  type OnboardingPlace, type Profile,
} from "./index.ts";

function profile(over: Partial<Profile> = {}): Profile {
  return {
    user_id: "u1", lang: "en", goal: null, sex: null, birth_year: null, height_cm: null,
    weight_kg: null, weight_measured_at: null, target_weight_kg: null, activity: null, pace: null,
    units: null, struggles: null, counted_before: null, barriers: null, situations: null, streak_goal_days: null, fiber_goal_g: null, sugar_goal_g: null, sodium_goal_mg: null, milestone_celebrations: true, streak_on_home: true, addback_burned: true, addback_rollover: true, meal_focus_offer: true, country: null,
    restrictions: [], medical_limitations: null, food_allergies: null, product_limitations: null,
    onboarded_at: null, filled_fields: [],
    ...over,
  };
}

/** `place` moved to sit directly in front of `before`. */
function moved(place: OnboardingPlace, before: OnboardingPlace, from: readonly OnboardingPlace[] = DEFAULT_ORDER) {
  const rest = from.filter((p) => p !== place);
  rest.splice(rest.indexOf(before), 0, place);
  return rest;
}

describe("the default order", () => {
  it("is ONBOARDING_PLACES from the welcome to the sign-up, and is valid", () => {
    const end = ONBOARDING_PLACES.indexOf("signup");
    expect([...DEFAULT_ORDER]).toEqual(ONBOARDING_PLACES.slice(0, end + 1));
    expect(validateOnboardingOrder(DEFAULT_ORDER)).toEqual([]);
  });

  it("draws the same dash the constant does", () => {
    expect(dashPlaces(DEFAULT_ORDER)).toEqual([...DASH_PLACES]);
  });
});

// Every edge, written out by hand rather than read off ORDER_AFTER, so deleting one goes red here.
// [later, earlier, the reader that breaks without it]
const EDGES: [OnboardingPlace, OnboardingPlace, string][] = [
  ["weight", "age", "the under-16 stop refuses a minor before they give their weight"],
  ["activity", "sex", "echo.rest is the BMR"],
  ["activity", "age", "echo.rest is the BMR"],
  ["activity", "height", "echo.rest is the BMR"],
  ["activity", "weight", "echo.rest is the BMR"],
  ["target", "goal", "stepApplies: a maintainer skips it"],
  ["target", "height", "checkTargetWeight's BMI floor"],
  ["target", "weight", "checkDirection"],
  ["target", "activity", "echo.days is the TDEE"],
  ["pace", "goal", "stepApplies: a maintainer skips it"],
  ["pace", "target", "pacePreview needs a target"],
  ["baseline", "age", "hidden under 18"],
  ["baseline", "height", "the BMI"],
  ["baseline", "weight", "the BMI"],
  ["prelim", "goal", "explainTargets"],
  ["prelim", "sex", "explainTargets"],
  ["prelim", "age", "explainTargets"],
  ["prelim", "height", "explainTargets"],
  ["prelim", "weight", "explainTargets"],
  ["prelim", "activity", "explainTargets"],
  ["prelim", "target", "explainTargets"],
  ["prelim", "pace", "explainTargets"],
  ["barrier", "goal", "its options gain one named by the goal"],
  ["barrier", "counted", "stepApplies: 'never' skips it; its copy variant"],
  ["situation", "counted", "its copy variant"],
];

// The plan is the end of the questions: every place between the welcome and the plan comes first.
const BEFORE_SUMMARY = DEFAULT_ORDER.filter((p) => !["welcome", "summary", "signup"].includes(p));

describe("a hard edge", () => {
  for (const [later, earlier, why] of EDGES) {
    it(`refuses ${later} before ${earlier} (${why})`, () => {
      expect(ORDER_AFTER[later]).toContain(earlier);
      expect(validateOnboardingOrder(moved(later, earlier))).toContainEqual({ place: later, rule: "must-follow", after: earlier });
    });
  }
});

describe("the plan", () => {
  for (const q of BEFORE_SUMMARY) {
    it(`refuses the plan before ${q}`, () => {
      expect(validateOnboardingOrder(moved("summary", q))).toContainEqual({ place: "summary", rule: "must-follow", after: q });
    });
  }
});

describe("the rules", () => {
  it("are exactly the edges above, at ONBOARDING_ORDER_VERSION 1 — change either, bump the version", () => {
    // A client validates against its OWN copy of these rules; one on the old copy must stop being
    // enrolled in an ordered arm, which only a version bump does (`onboarding-order.ts`).
    const expected: Partial<Record<OnboardingPlace, OnboardingPlace[]>> = { summary: BEFORE_SUMMARY };
    for (const [later, earlier] of EDGES) (expected[later] ??= []).push(earlier);
    const sorted = (g: Partial<Record<string, readonly string[]>>) =>
      Object.fromEntries(Object.entries(g).map(([k, v]) => [k, [...v!].sort()]));
    expect(sorted(ORDER_AFTER)).toEqual(sorted(expected));
    expect(ONBOARDING_ORDER_VERSION).toBe(1);
  });
});

describe("what may move", () => {
  it("sex, age and height among themselves", () => {
    expect(validateOnboardingOrder(moved("height", "sex"))).toEqual([]);
    expect(validateOnboardingOrder(moved("age", "sex"))).toEqual([]);
  });

  it("diet, medical and the counted questions anywhere after the goal", () => {
    let order = moved("medical", "sex");
    order = moved("diet", "medical", order);
    order = moved("counted", "diet", order);
    order = moved("barrier", "diet", order);
    order = moved("situation", "diet", order);
    expect(validateOnboardingOrder(order)).toEqual([]);
  });

  it("the beats, out entirely", () => {
    for (const beat of REMOVABLE_PLACES) {
      expect(validateOnboardingOrder(DEFAULT_ORDER.filter((p) => p !== beat))).toEqual([]);
    }
  });
});

describe("what is refused", () => {
  it("a place that is not in the span", () => {
    expect(validateOnboardingOrder([...DEFAULT_ORDER, "country"])).toContainEqual({ place: "country", rule: "unknown" });
    expect(validateOnboardingOrder([...DEFAULT_ORDER, "nope"])).toContainEqual({ place: "nope", rule: "unknown" });
  });

  it("a place twice", () => {
    expect(validateOnboardingOrder([...DEFAULT_ORDER.slice(0, -1), "diet", "signup"])).toContainEqual({ place: "diet", rule: "duplicate" });
  });

  it("a question left out — only the two beats may go", () => {
    expect(validateOnboardingOrder(DEFAULT_ORDER.filter((p) => p !== "diet"))).toContainEqual({ place: "diet", rule: "missing" });
    expect(validateOnboardingOrder(DEFAULT_ORDER.filter((p) => p !== "summary"))).toContainEqual({ place: "summary", rule: "missing" });
  });

  it("the welcome anywhere but first", () => {
    expect(validateOnboardingOrder(moved("goal", "welcome"))).toContainEqual({ place: "welcome", rule: "fixed" });
  });

  it("the sign-up anywhere but straight after the plan (phase 2 moves it)", () => {
    expect(validateOnboardingOrder(moved("signup", "summary"))).toContainEqual({ place: "signup", rule: "fixed" });
  });

  it("a question after the plan", () => {
    expect(validateOnboardingOrder(moved("diet", "signup"))).toContainEqual({ place: "summary", rule: "must-follow", after: "diet" });
  });
});

describe("a served order", () => {
  it("is used when it is valid", () => {
    const order = moved("height", "sex");
    expect(servedOrder(order)).toEqual(order);
  });

  it("falls back to the default when absent or invalid — refused at save, never at runtime", () => {
    expect(servedOrder(undefined)).toBe(DEFAULT_ORDER);
    expect(servedOrder(moved("pace", "target"))).toBe(DEFAULT_ORDER);
  });

  it("says when it fell back, so the funnel can tell that client from its arm", () => {
    expect(orderFellBack(undefined)).toBe(false);
    expect(orderFellBack(DEFAULT_ORDER)).toBe(false);
    expect(orderFellBack(moved("pace", "target"))).toBe(true);
    expect(orderFellBack([...DEFAULT_ORDER, "a-place-from-a-newer-server"])).toBe(true);
  });
});

describe("the walk in an arm's order", () => {
  const order = moved("diet", "sex").filter((p) => p !== "prelim");
  const ids = (p: Profile) => promptsFor(p, ["country"], { health: false }, order).map((x) => x.id);

  it("follows the order, drops a removed beat and keeps the tail after it", () => {
    expect(ids(profile())).toEqual([
      "welcome", "goal", "diet", "sex", "birth_year", "height_cm", "weight_kg", "activity", "baseline",
      "target_weight_kg", "pace", "counted_before", "barriers", "situations",
      "medical", "summary", "signup", "streak_goal_days",
    ]);
  });

  it("resumes at the first unanswered field in THAT order", () => {
    const p = profile({ goal: "lose", sex: "female" });
    const at = (order?: readonly OnboardingPlace[]) => {
      const prompts = promptsFor(p, ["country"], { health: false }, order);
      return prompts[resumeAt(prompts, p)]!.id;
    };
    expect(at(moved("height", "sex"))).toBe("height_cm");
    expect(at()).toBe("birth_year");
  });

  it("walks the default when handed an order it cannot validate — never a broken walk", () => {
    const broken = DEFAULT_ORDER.filter((p) => p !== "diet");
    expect(promptsFor(profile(), ["country"], { health: false }, broken))
      .toEqual(promptsFor(profile(), ["country"], { health: false }));
  });

  it("draws a dash without the removed beat", () => {
    expect(dashPlaces(order)).not.toContain("prelim");
    expect(dashPlaces(order)[0]).toBe("goal");
    expect(dashPlaces(order).at(-1)).toBe("summary");
  });
});
