import type { DayPlan } from "@/hooks/useMealPlan";
import { normalizePantryName, type PantryItem, type PantryUsedOn } from "@/hooks/usePantry";
import { currentWeekKey, todayDayIndex } from "@/lib/env";

/**
 * Expande un alimento del plan a los nombres que "cuenta" para matchear con la
 * despensa. Por defecto sólo su propio nombre; DonBacilio pasa una versión que
 * además incluye los ingredientes de la comida (por `ingredient_ids`), así un
 * ingrediente comprado (ej: "pollo") queda ligado a la comida planificada que lo
 * usa (ej: "Milanesa de pollo") aunque el slot no se llame igual.
 */
export type FoodExpander = (food: { id: string; name: string }) => string[];

const defaultExpander: FoodExpander = (f) => [f.name];

/** Todos los alimentos (principal, guarnición y extras) de un día del plan. */
function dayFoods(d: DayPlan): { id: string; name: string }[] {
  return [
    d.dinner, d.dinnerSide, ...(d.dinnerExtras ?? []),
    d.lunch, d.lunchSide, ...(d.lunchExtras ?? []),
    d.babyDinner, d.babyDinnerSide, ...(d.babyDinnerExtras ?? []),
    d.babyLunch, d.babyLunchSide, ...(d.babyLunchExtras ?? []),
    d.breakfast, ...(d.breakfastExtras ?? []),
    d.snack, ...(d.snackExtras ?? []),
  ].filter((f): f is NonNullable<typeof f> => f != null);
}

/** ¿Algún slot de este día tiene un alimento con este nombre (o que lo contenga)? */
export function dayHasFood(d: DayPlan, name: string, expand: FoodExpander = defaultExpander): boolean {
  const n = normalizePantryName(name);
  return dayFoods(d).some((f) => expand(f).some((nm) => normalizePantryName(nm) === n));
}

/** Índices de días (0=Lunes…6=Domingo) donde el plan usa este nombre. */
export function matchedDays(plan: DayPlan[], name: string, expand: FoodExpander = defaultExpander): number[] {
  return plan.map((d, i) => (dayHasFood(d, name, expand) ? i : -1)).filter((i) => i >= 0);
}

/** ¿Ese día de esa semana ya pasó? (las claves ISO ordenan lexicográficamente) */
export function dayPassed(weekKey: string, day: number): boolean {
  const cw = currentWeekKey();
  if (weekKey < cw) return true;
  if (weekKey > cw) return false;
  return day < todayDayIndex(weekKey);
}

/**
 * Reconcilia la despensa contra el plan de una semana:
 * - Ítem marcado "última unidad" (depleteOnUse) cuyo día planificado ya pasó →
 *   se marca como usado (sale de la despensa). Los que tienen stock de sobra
 *   (depleteOnUse false/undefined) nunca salen solos.
 * - Ítem usado por un slot de esta semana que ya no tiene esa comida → vuelve a la despensa.
 * Idempotente; se puede correr en cada render/carga.
 */
export function syncPantryWithPlan(opts: {
  allItems: PantryItem[];
  plan: DayPlan[];
  weekKey: string;
  markUsed: (name: string, usedOn: PantryUsedOn) => void;
  clearUsed: (name: string) => void;
  expand?: FoodExpander;
}): void {
  const { allItems, plan, weekKey, markUsed, clearUsed, expand = defaultExpander } = opts;
  for (const it of allItems) {
    if (!it.usedOn) {
      if (!it.depleteOnUse) continue;
      const passed = matchedDays(plan, it.name, expand).filter((d) => dayPassed(weekKey, d));
      if (passed.length > 0) markUsed(it.name, { week: weekKey, day: passed[0] });
    } else if (it.usedOn.week === weekKey) {
      const day = plan[it.usedOn.day];
      if (!day || !dayHasFood(day, it.name, expand)) clearUsed(it.name);
    }
  }
}
