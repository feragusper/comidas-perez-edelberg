import { useState, useCallback, useMemo } from "react";
import { Meal } from "@/data/meals";
import { SENTINEL_MEAL_IDS } from "@/data/food";
import { DayPlan } from "@/hooks/useMealPlan";
import { supabase } from "@/integrations/supabase/client";
import { isStageEnv, envWeekKey } from "@/lib/env";
import { toast } from "@/hooks/use-toast";

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
  catalog: Meal[] = [],
) {
  const [loading, setLoading] = useState(false);

  const pools = useMemo(() => {
    const usable = catalog.filter((m) => !SENTINEL_MEAL_IDS.has(m.id));
    return {
      mains: usable.filter((m) => !m.isSide && m.category !== "Desayunos" && m.category !== "Meriendas"),
      sides: usable.filter((m) => m.isSide === true),
      breakfasts: usable.filter((m) => m.category === "Desayunos"),
      snacks: usable.filter((m) => m.category === "Meriendas"),
    };
  }, [catalog]);

  const lookup = useCallback(
    (id: string | undefined | null): Meal | null => {
      if (!id) return null;
      return catalog.find((m) => m.id === id) ?? null;
    },
    [catalog],
  );

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const currentDinners = plan.filter((d) => d.dinner !== null).map((d) => d.dinner!.name);
      const mealCatalog = pools.mains.map((m) => ({ id: m.id, name: m.name, category: m.category }));
      const sideCatalog = pools.sides.map((m) => ({ id: m.id, name: m.name }));
      const breakfastCatalog = pools.breakfasts.map((m) => ({ id: m.id, name: m.name }));
      const snackCatalog = pools.snacks.map((m) => ({ id: m.id, name: m.name }));

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
          dinner: lookup(raw.dinnerId),
          dinnerSide: lookup(raw.sideId),
          breakfast: lookup(raw.breakfastId),
          snack: lookup(raw.snackId),
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
  }, [plan, weekKey, apply, lookup, pools]);

  return { run, loading };
}
