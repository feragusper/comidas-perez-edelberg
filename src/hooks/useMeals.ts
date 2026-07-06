import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { Meal, MEALS } from "@/data/meals";

interface MealRow {
  meal_id: string;
  name: string;
  emoji: string;
  category: string;
  baby_safety: string;
  baby_note: string | null;
  is_keto: boolean;
  is_side: boolean;
  tags: string[] | null;
  ingredient_ids: string[] | null;
}

function rowToMeal(row: MealRow): Meal {
  return {
    id: row.meal_id,
    name: row.name,
    emoji: row.emoji,
    category: row.category,
    babySafety: row.baby_safety as Meal["babySafety"],
    babyNote: row.baby_note ?? undefined,
    isKeto: row.is_keto,
    isSide: row.is_side,
    tags: row.tags ?? [],
    ingredientIds: row.ingredient_ids ?? [],
    kind: "meal",
  };
}

/**
 * Catálogo completo de comidas desde la tabla `meals` (estáticas + custom).
 * Si la tabla no está disponible o viene vacía, cae al catálogo estático
 * de meals.ts para que la app siga funcionando.
 */
export function useMeals() {
  const [meals, setMeals] = useState<Meal[]>(MEALS);
  const [fromDb, setFromDb] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) { console.error("Error loading meals catalog:", error); return; }
    if (data && data.length > 0) {
      setMeals((data as MealRow[]).map(rowToMeal));
      setFromDb(true);
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel("meals_catalog")
      .on("postgres_changes", { event: "*", schema: "public", table: "meals" }, () => void load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  /** Guarda una comida creada por el usuario (id "custom-…"). */
  const saveMeal = useCallback(async (meal: Meal) => {
    if (!meal.id.startsWith("custom-")) return;
    const alreadyExists = meals.some((m) => m.name.toLowerCase() === meal.name.toLowerCase());
    if (alreadyExists) return;

    const row = {
      meal_id: meal.id,
      name: meal.name,
      emoji: meal.emoji,
      category: meal.category,
      baby_safety: meal.babySafety,
      baby_note: meal.babyNote ?? null,
      is_keto: meal.isKeto ?? false,
      is_side: meal.isSide ?? false,
      tags: meal.tags ?? [],
      ingredient_ids: meal.ingredientIds ?? [],
    };
    const { data, error } = await supabase
      .from("meals")
      .upsert(row, { onConflict: "meal_id" })
      .select()
      .single();
    if (error) { console.error("Error saving meal:", error); return; }
    if (data) {
      const saved = rowToMeal(data as MealRow);
      setMeals((prev) => prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]);
    }
  }, [meals]);

  /**
   * Re-materializa en el catálogo una comida huérfana encontrada solo en el
   * historial de meal_plan (conserva su id original para que los reportes
   * la sigan resolviendo).
   */
  const restoreMeal = useCallback(async (meal: Meal) => {
    const row = {
      meal_id: meal.id,
      name: meal.name,
      emoji: meal.emoji,
      category: meal.category || "Otro",
      baby_safety: meal.babySafety ?? "caution",
      baby_note: meal.babyNote ?? null,
      is_keto: meal.isKeto ?? false,
      is_side: meal.isSide ?? false,
      tags: meal.tags ?? [],
      ingredient_ids: meal.ingredientIds ?? [],
    };
    const { data, error } = await supabase
      .from("meals")
      .upsert(row, { onConflict: "meal_id", ignoreDuplicates: true })
      .select()
      .maybeSingle();
    if (error) { console.error("Error restoring meal:", error); return; }
    const restored = data ? rowToMeal(data as MealRow) : rowToMeal(row as MealRow);
    setMeals((prev) => prev.some((m) => m.id === restored.id) ? prev : [...prev, restored]);
  }, []);

  const updateMeal = useCallback(async (mealId: string, patch: Partial<Pick<Meal, "name" | "emoji" | "tags" | "ingredientIds" | "category" | "babySafety" | "babyNote" | "isKeto" | "isSide">>) => {
    const row: TablesUpdate<"meals"> = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.emoji !== undefined) row.emoji = patch.emoji;
    if (patch.tags !== undefined) row.tags = patch.tags;
    if (patch.ingredientIds !== undefined) row.ingredient_ids = patch.ingredientIds;
    if (patch.category !== undefined) row.category = patch.category;
    if (patch.babySafety !== undefined) row.baby_safety = patch.babySafety;
    if (patch.babyNote !== undefined) row.baby_note = patch.babyNote ?? null;
    if (patch.isKeto !== undefined) row.is_keto = patch.isKeto;
    if (patch.isSide !== undefined) row.is_side = patch.isSide;

    const { error } = await supabase.from("meals").update(row).eq("meal_id", mealId);
    if (error) { console.error("Error updating meal:", error); return; }
    setMeals((prev) => prev.map((m) => (m.id === mealId ? { ...m, ...patch } : m)));
  }, []);

  const deleteMeal = useCallback(async (mealId: string) => {
    const { error } = await supabase.from("meals").delete().eq("meal_id", mealId);
    if (error) { console.error("Error deleting meal:", error); return; }
    setMeals((prev) => prev.filter((m) => m.id !== mealId));
  }, []);

  /** Borrado masivo (purga de predefinidas sin uso). */
  const deleteMeals = useCallback(async (mealIds: string[]) => {
    if (mealIds.length === 0) return;
    const { error } = await supabase.from("meals").delete().in("meal_id", mealIds);
    if (error) { console.error("Error deleting meals:", error); return; }
    const gone = new Set(mealIds);
    setMeals((prev) => prev.filter((m) => !gone.has(m.id)));
  }, []);

  return { meals, fromDb, loading, saveMeal, restoreMeal, updateMeal, deleteMeal, deleteMeals };
}
