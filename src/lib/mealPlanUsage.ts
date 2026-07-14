import { Meal } from "@/data/meals";
import { DayPlan } from "@/hooks/useMealPlan";

/** Dónde apareció una comida/ingrediente en el historial de menús. */
export interface Usage {
  env: "stage" | "prod";
  weekKey: string; // sin prefijo, p.ej. "2026-W23"
  day: string;
  slot: string;
}

/**
 * Aplana un día del plan en pares [slot legible, food]. Incluye comidas
 * (sin `kind`) e ingredientes sueltos (`kind: "ingredient"`); descarta huecos.
 */
export function flattenDayFoods(day: DayPlan): [string, Meal][] {
  const pairs: [string, Meal | null][] = [
    ["Cena", day.dinner], ["Cena", day.dinnerSide], ...(day.dinnerExtras ?? []).map((m) => ["Cena", m] as [string, Meal]),
    ["Almuerzo", day.lunch], ["Almuerzo", day.lunchSide], ...(day.lunchExtras ?? []).map((m) => ["Almuerzo", m] as [string, Meal]),
    ["Cena Nico", day.babyDinner], ["Cena Nico", day.babyDinnerSide], ...(day.babyDinnerExtras ?? []).map((m) => ["Cena Nico", m] as [string, Meal]),
    ["Almuerzo Nico", day.babyLunch], ["Almuerzo Nico", day.babyLunchSide], ...(day.babyLunchExtras ?? []).map((m) => ["Almuerzo Nico", m] as [string, Meal]),
    ["Desayuno", day.breakfast], ...(day.breakfastExtras ?? []).map((m) => ["Desayuno", m] as [string, Meal]),
    ["Merienda", day.snack], ...(day.snackExtras ?? []).map((m) => ["Merienda", m] as [string, Meal]),
  ];
  return pairs.filter((p): p is [string, Meal] => {
    const f = p[1];
    return !!f && typeof f === "object" && !!f.id;
  });
}

/** Agrega un uso a un mapa id → Usage[], sin duplicar la misma celda. */
export function pushUsage(map: Map<string, Usage[]>, id: string, u: Usage): void {
  const arr = map.get(id) ?? [];
  if (!arr.some((x) => x.env === u.env && x.weekKey === u.weekKey && x.day === u.day && x.slot === u.slot)) {
    arr.push(u);
  }
  map.set(id, arr);
}

/** Divide una week_key cruda ("stage_2026-W23") en entorno + clave limpia. */
export function splitWeekKey(rawKey: string): { env: Usage["env"]; weekKey: string } {
  return {
    env: rawKey.startsWith("stage_") ? "stage" : "prod",
    weekKey: rawKey.replace(/^(stage|prod)_/, ""),
  };
}
