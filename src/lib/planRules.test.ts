import { describe, it, expect } from "vitest";
import { applyPlanRules, normalizePlanRules, DEFAULT_PLAN_RULES, type PlanRules } from "./planRules";
import type { DayPlan } from "@/hooks/useMealPlan";
import type { Meal } from "@/data/meals";

const meal = (id: string, extra: Partial<Meal> = {}): Meal =>
  ({ id, name: id, emoji: "🍽️", category: "Otro", babySafety: "safe", ...extra }) as Meal;

const day = (patch: Partial<DayPlan> = {}): DayPlan =>
  ({
    day: "X",
    dinner: null, dinnerSide: null, dinnerExtras: [], dinnerNote: "",
    lunch: null, lunchSide: null, lunchExtras: [], lunchNote: "", lunchOverridden: false, lunchHidden: false,
    babyDinner: null, babyDinnerSide: null, babyDinnerExtras: [], babyDinnerNote: "", babyDinnerOverridden: false, babyDinnerHidden: false,
    babyLunch: null, babyLunchSide: null, babyLunchExtras: [], babyLunchNote: "", babyLunchOverridden: false, babyLunchHidden: false,
    breakfast: null, breakfastExtras: [], breakfastNote: "",
    snack: null, snackExtras: [], snackNote: "",
    notes: "",
    ...patch,
  }) as DayPlan;

describe("applyPlanRules", () => {
  const pollo = meal("pollo");
  const pasta = meal("pasta");
  const plan = [day({ dinner: pollo }), day({ dinner: pasta })];

  it("defaults: lunch and Nico lunch from previous dinner, Nico dinner from same-day dinner", () => {
    const out = applyPlanRules(plan, null, DEFAULT_PLAN_RULES);
    expect(out[0].lunch).toBeNull();
    expect(out[0].babyDinner?.id).toBe("pollo");
    expect(out[1].lunch?.id).toBe("pollo");
    expect(out[1].babyLunch?.id).toBe("pollo");
    expect(out[1].babyDinner?.id).toBe("pasta");
  });

  it("legacy rule: Nico dinner from previous dinner", () => {
    const rules: PlanRules = { ...DEFAULT_PLAN_RULES, babyDinner: "prevDinner" };
    const out = applyPlanRules(plan, null, rules);
    expect(out[0].babyDinner).toBeNull();
    expect(out[1].babyDinner?.id).toBe("pollo");
  });

  it("rules turned off suggest nothing", () => {
    const rules: PlanRules = { lunch: "none", babyLunch: "none", babyDinner: "none" };
    const out = applyPlanRules(plan, null, rules);
    expect(out[1].lunch).toBeNull();
    expect(out[1].babyLunch).toBeNull();
    expect(out[1].babyDinner).toBeNull();
  });

  it("overridden slots win over rules", () => {
    const papilla = meal("papilla");
    const p = [day({ dinner: pollo, babyDinner: papilla, babyDinnerOverridden: true })];
    expect(applyPlanRules(p, null, DEFAULT_PLAN_RULES)[0].babyDinner?.id).toBe("papilla");
  });

  it("Nico never gets unsafe or eating-out dinners", () => {
    const picante = meal("picante", { babySafety: "unsafe" });
    const p = [day({ dinner: picante }), day({ dinner: meal("delivery") })];
    const out = applyPlanRules(p, null, DEFAULT_PLAN_RULES);
    expect(out[0].babyDinner).toBeNull();
    expect(out[1].babyDinner).toBeNull();
    expect(out[1].lunch?.id).toBe("picante");
  });

  it("Monday lunch inherits previous week's Sunday dinner", () => {
    const sunday = { dinner: pasta, dinnerSide: null, dinnerExtras: [], dinnerNote: "" };
    const out = applyPlanRules([day({ dinner: pollo })], sunday, DEFAULT_PLAN_RULES);
    expect(out[0].lunch?.id).toBe("pasta");
  });
});

describe("normalizePlanRules", () => {
  it("falls back to defaults for missing or unknown values", () => {
    expect(normalizePlanRules(undefined)).toEqual(DEFAULT_PLAN_RULES);
    expect(normalizePlanRules({ babyDinner: "bogus", lunch: "none" })).toEqual({ ...DEFAULT_PLAN_RULES, lunch: "none" });
  });
});
