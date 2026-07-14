import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DayPlan } from "@/hooks/useMealPlan";
import { Usage, flattenDayFoods, pushUsage, splitWeekKey } from "@/lib/mealPlanUsage";

interface MealPlanUsage {
  /** id de comida → celdas del menú donde apareció (kind meal / legacy). */
  mealUsages: Map<string, Usage[]>;
  /** id de ingrediente → celdas donde se planificó suelto (kind: "ingredient"). */
  ingredientUsages: Map<string, Usage[]>;
  loading: boolean;
}

/**
 * Recorre todo el historial de menús (stage + prod comparten DB) y devuelve,
 * por id, dónde se usó cada comida y cada ingrediente suelto. Pensado para
 * mostrar labels de uso en catálogos y decidir qué es seguro borrar.
 */
export function useMealPlanUsage(): MealPlanUsage {
  const [mealUsages, setMealUsages] = useState<Map<string, Usage[]>>(new Map());
  const [ingredientUsages, setIngredientUsages] = useState<Map<string, Usage[]>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("meal_plan")
      .select("plan, week_key")
      .then(({ data, error }) => {
        if (!active) return;
        if (error) { console.error("Error loading history:", error); setLoading(false); return; }
        const meals = new Map<string, Usage[]>();
        const ingredients = new Map<string, Usage[]>();
        for (const row of data ?? []) {
          const week = row.plan as unknown as DayPlan[];
          if (!Array.isArray(week)) continue;
          const { env, weekKey } = splitWeekKey((row as { week_key: string }).week_key ?? "");
          for (const day of week) {
            for (const [slot, f] of flattenDayFoods(day)) {
              const usage: Usage = { env, weekKey, day: day.day, slot };
              if (f.kind === "ingredient") pushUsage(ingredients, f.id, usage);
              else pushUsage(meals, f.id, usage);
            }
          }
        }
        setMealUsages(meals);
        setIngredientUsages(ingredients);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return { mealUsages, ingredientUsages, loading };
}
