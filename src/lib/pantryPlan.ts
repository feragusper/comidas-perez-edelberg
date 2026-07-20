import type { DayPlan } from "@/hooks/useMealPlan";
import { normalizePantryName, type PantryItem, type PantryUsedOn } from "@/hooks/usePantry";
import { currentWeekKey, todayDayIndex } from "@/lib/env";

/** Todos los alimentos (principal, guarnición y extras) de un día del plan. */
function dayFoods(d: DayPlan): { name: string }[] {
  return [
    d.dinner, d.dinnerSide, ...(d.dinnerExtras ?? []),
    d.lunch, d.lunchSide, ...(d.lunchExtras ?? []),
    d.babyDinner, d.babyDinnerSide, ...(d.babyDinnerExtras ?? []),
    d.babyLunch, d.babyLunchSide, ...(d.babyLunchExtras ?? []),
    d.breakfast, ...(d.breakfastExtras ?? []),
    d.snack, ...(d.snackExtras ?? []),
  ].filter((f): f is NonNullable<typeof f> => f != null);
}

/** ¿Algún slot de este día tiene un alimento con este nombre? */
export function dayHasFood(d: DayPlan, name: string): boolean {
  const n = normalizePantryName(name);
  return dayFoods(d).some((f) => normalizePantryName(f.name) === n);
}

/** Índices de días (0=Lunes…6=Domingo) donde el plan usa este nombre. */
export function matchedDays(plan: DayPlan[], name: string): number[] {
  return plan.map((d, i) => (dayHasFood(d, name) ? i : -1)).filter((i) => i >= 0);
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
}): void {
  const { allItems, plan, weekKey, markUsed, clearUsed } = opts;
  for (const it of allItems) {
    if (!it.usedOn) {
      if (!it.depleteOnUse) continue;
      const passed = matchedDays(plan, it.name).filter((d) => dayPassed(weekKey, d));
      if (passed.length > 0) markUsed(it.name, { week: weekKey, day: passed[0] });
    } else if (it.usedOn.week === weekKey) {
      const day = plan[it.usedOn.day];
      if (!day || !dayHasFood(day, it.name)) clearUsed(it.name);
    }
  }
}
