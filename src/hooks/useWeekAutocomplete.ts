import { useState, useCallback } from "react";
import { MEALS, MEAL_CATEGORIES, BREAKFASTS, SNACKS, Meal } from "@/data/meals";
import { DayPlan } from "@/hooks/useMealPlan";
import { supabase } from "@/integrations/supabase/client";
import { isStageEnv, envWeekKey } from "@/lib/env";
import { toast } from "@/hooks/use-toast";

const MAIN_MEALS = MEALS.filter((m) => !m.isSide && MEAL_CATEGORIES.includes(m.category));
const SIDE_MEALS = MEALS.filter((m) => m.isSide === true);

export interface AutocompleteEntry {
  dinner: Meal | null;
  dinnerSide: Meal | null;
  breakfast: Meal | null;
  snack: Meal | null;
}

export function useWeekAutocomplete(
  plan: DayPlan[],
  weekKey: string,
  apply: (entries: (AutocompleteEntry | null)[]) => void,
  customMeals: Meal[] = [],
) {
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(
    (id: string | undefined | null): Meal | null => {
      if (!id) return null;
      return MEALS.find((m) => m.id === id) ?? customMeals.find((m) => m.id === id) ?? null;
    },
    [customMeals],
  );

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const currentDinners = plan.filter((d) => d.dinner !== null).map((d) => d.dinner!.name);
      const mealCatalog = MAIN_MEALS.map((m) => ({ id: m.id, name: m.name, category: m.category }));
      const sideCatalog = SIDE_MEALS.map((m) => ({ id: m.id, name: m.name }));
      const breakfastCatalog = BREAKFASTS.map((m) => ({ id: m.id, name: m.name }));
      const snackCatalog = SNACKS.map((m) => ({ id: m.id, name: m.name }));

      const { data, error } = await supabase.functions.invoke("autocomplete-week", {
        body: {
          envPrefix: isStageEnv() ? "stage" : "prod",
          currentWeekKey: envWeekKey(weekKey),
          currentDinners,
          mealCatalog,
          sideCatalog,
          breakfastCatalog,
          snackCatalog,
        },
      });

      if (error) throw new Error(error.message ?? "Request failed");
      if (data?.error === "RATE_LIMITED") {
        toast({ title: "Demasiadas peticiones", description: "Esperá un momento y probá de nuevo.", variant: "destructive" });
        return;
      }
      if (data?.error === "PAYMENT_REQUIRED") {
        toast({ title: "Sin créditos de IA", description: "Se agotaron los créditos de IA del espacio.", variant: "destructive" });
        return;
      }
      if (!Array.isArray(data?.week)) throw new Error("Respuesta inválida");

      const entries: (AutocompleteEntry | null)[] = (data.week as any[]).slice(0, 7).map((raw) => {
        if (!raw) return null;
        return {
          dinner: lookup(raw.dinnerId, MAIN_MEALS),
          dinnerSide: lookup(raw.sideId, SIDE_MEALS),
          breakfast: lookup(raw.breakfastId, BREAKFASTS),
          snack: lookup(raw.snackId, SNACKS),
        };
      });

      apply(entries);
      toast({ title: "¡Semana autocompletada!", description: "Completé los huecos según vuestro historial e ideas nuevas." });
    } catch (err) {
      console.error("Autocomplete week failed:", err);
      toast({ title: "No se pudo autocompletar", description: "Probá de nuevo en un momento.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [plan, weekKey, apply, lookup]);

  return { run, loading };
}
