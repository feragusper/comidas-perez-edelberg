import type { Meal } from "@/data/meals";
import { DELIVERY_LEFTOVERS, TAKEAWAY_LEFTOVERS } from "@/data/meals";
import type { DayPlan } from "@/hooks/useMealPlan";

/**
 * Reglas configurables que completan automáticamente slots del plan.
 * Un slot sugerido por una regla se puede cambiar a mano (queda "overridden").
 */

/** De dónde sale una sugerencia: la cena del día anterior, la cena del mismo día, o nada. */
export type RuleSource = "prevDinner" | "sameDinner" | "none";

export interface PlanRules {
  /** Nuestro almuerzo. */
  lunch: Extract<RuleSource, "prevDinner" | "none">;
  /** Almuerzo de Nico. */
  babyLunch: Extract<RuleSource, "prevDinner" | "none">;
  /** Cena de Nico. */
  babyDinner: RuleSource;
}

export const DEFAULT_PLAN_RULES: PlanRules = {
  lunch: "prevDinner",
  babyLunch: "prevDinner",
  babyDinner: "sameDinner",
};

/** Mezcla lo guardado con los defaults, descartando valores desconocidos. */
export function normalizePlanRules(raw: unknown): PlanRules {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(v as T) ? (v as T) : fallback;
  return {
    lunch: pick(r.lunch, ["prevDinner", "none"] as const, DEFAULT_PLAN_RULES.lunch),
    babyLunch: pick(r.babyLunch, ["prevDinner", "none"] as const, DEFAULT_PLAN_RULES.babyLunch),
    babyDinner: pick(r.babyDinner, ["prevDinner", "sameDinner", "none"] as const, DEFAULT_PLAN_RULES.babyDinner),
  };
}

/** Texto corto para la etiqueta "sugerido ..." de un slot heredado. */
export function suggestedLabel(source: RuleSource): string {
  if (source === "sameDinner") return "igual a nuestra cena";
  return "sugerido de anoche";
}

type DinnerFields = Pick<DayPlan, "dinner" | "dinnerSide" | "dinnerExtras" | "dinnerNote">;

interface Food {
  meal: Meal | null;
  side: Meal | null;
  extras: Meal[];
  note: string;
}

const EMPTY: Food = { meal: null, side: null, extras: [], note: "" };

const isId = (meal: Meal | null, id: string) => meal?.id === id;

/** Lo que una cena deja para nuestro almuerzo (sobras de delivery/takeaway, nada si fue restaurante). */
function adultCarry(d: DinnerFields | null): Food {
  const dinner = d?.dinner ?? null;
  if (!dinner) return EMPTY;
  if (isId(dinner, "delivery")) return { ...EMPTY, meal: DELIVERY_LEFTOVERS };
  if (isId(dinner, "takeaway")) return { ...EMPTY, meal: TAKEAWAY_LEFTOVERS };
  if (isId(dinner, "restaurante")) return EMPTY;
  return { meal: dinner, side: d?.dinnerSide ?? null, extras: d?.dinnerExtras ?? [], note: d?.dinnerNote ?? "" };
}

/** Lo que una cena le pasa a Nico: solo comida casera apta para él. */
function babyCarry(d: DinnerFields | null): Food {
  const dinner = d?.dinner ?? null;
  if (!dinner) return EMPTY;
  if (isId(dinner, "delivery") || isId(dinner, "takeaway") || isId(dinner, "restaurante")) return EMPTY;
  if (dinner.babySafety === "unsafe") return EMPTY;
  return { meal: dinner, side: d?.dinnerSide ?? null, extras: d?.dinnerExtras ?? [], note: d?.dinnerNote ?? "" };
}

/**
 * Calcula los slots sugeridos (almuerzo, almuerzo y cena de Nico) según las reglas.
 * Los slots overridden u ocultos se respetan tal cual.
 * `prevSunday` es la cena del domingo anterior, para que el lunes herede cross-semana.
 */
export function applyPlanRules(plan: DayPlan[], prevSunday: DinnerFields | null, rules: PlanRules): DayPlan[] {
  return plan.map((day, idx) => {
    const prevDay: DinnerFields | null = idx === 0 ? prevSunday : plan[idx - 1];

    const source = (src: RuleSource, carry: (d: DinnerFields | null) => Food): Food =>
      src === "prevDinner" ? carry(prevDay) : src === "sameDinner" ? carry(day) : EMPTY;

    let lunch: Food;
    if (day.lunchOverridden) lunch = { meal: day.lunch, side: day.lunchSide, extras: day.lunchExtras, note: day.lunchNote };
    else if (day.lunchHidden) lunch = EMPTY;
    else lunch = source(rules.lunch, adultCarry);

    let babyLunch: Food;
    if (day.babyLunchOverridden) babyLunch = { meal: day.babyLunch, side: day.babyLunchSide, extras: day.babyLunchExtras, note: day.babyLunchNote };
    else if (day.babyLunchHidden) babyLunch = EMPTY;
    else babyLunch = source(rules.babyLunch, babyCarry);

    let babyDinner: Food;
    if (day.babyDinnerOverridden) babyDinner = { meal: day.babyDinner, side: day.babyDinnerSide, extras: day.babyDinnerExtras, note: day.babyDinnerNote };
    else if (day.babyDinnerHidden) babyDinner = EMPTY;
    else babyDinner = source(rules.babyDinner, babyCarry);

    return {
      ...day,
      lunch: lunch.meal,
      lunchSide: lunch.side,
      lunchExtras: lunch.extras,
      lunchNote: lunch.note,
      babyLunch: babyLunch.meal,
      babyLunchSide: babyLunch.side,
      babyLunchExtras: babyLunch.extras,
      babyLunchNote: babyLunch.note,
      babyDinner: babyDinner.meal,
      babyDinnerSide: babyDinner.side,
      babyDinnerExtras: babyDinner.extras,
      babyDinnerNote: babyDinner.note,
    };
  });
}
