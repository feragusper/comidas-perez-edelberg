import { useState, useEffect, useCallback } from "react";
import { Meal } from "@/data/meals";
import { supabase } from "@/integrations/supabase/client";

interface CustomMealRow {
  id: string;
  meal_id: string;
  name: string;
  emoji: string;
  category: string;
  baby_safety: string;
  baby_note: string | null;
  is_keto: boolean;
  is_side: boolean;
}

function rowToMeal(row: CustomMealRow): Meal {
  return {
    id: row.meal_id,
    name: row.name,
    emoji: row.emoji,
    category: row.category,
    babySafety: row.baby_safety as Meal["babySafety"],
    babyNote: row.baby_note ?? undefined,
    isKeto: row.is_keto,
    isSide: row.is_side,
  };
}

export function useCustomMeals() {
  const [customMeals, setCustomMeals] = useState<Meal[]>([]);

  useEffect(() => {
    supabase
      .from("custom_meals")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.error("Error loading custom meals:", error); return; }
        if (data) setCustomMeals((data as CustomMealRow[]).map(rowToMeal));
      });
  }, []);

  const saveCustomMeal = useCallback(async (meal: Meal) => {
    // Only save meals that were created via free-text (custom-* prefix)
    if (!meal.id.startsWith("custom-")) return;

    // Avoid duplicates by name (case-insensitive)
    const alreadyExists = customMeals.some(
      (m) => m.name.toLowerCase() === meal.name.toLowerCase()
    );
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
    };

    const { data, error } = await supabase
      .from("custom_meals")
      .upsert(row, { onConflict: "meal_id" })
      .select()
      .single();

    if (error) { console.error("Error saving custom meal:", error); return; }
    if (data) {
      setCustomMeals((prev) => {
        const exists = prev.some((m) => m.id === meal.id);
        return exists ? prev : [...prev, rowToMeal(data as CustomMealRow)];
      });
    }
  }, [customMeals]);

  return { customMeals, saveCustomMeal };
}
