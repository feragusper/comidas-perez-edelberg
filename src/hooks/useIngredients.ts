import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { BabySafety } from "@/data/meals";
import { Ingredient, INGREDIENT_CATEGORY, ingredientSlug } from "@/data/food";

interface IngredientRow {
  ingredient_id: string;
  name: string;
  emoji: string;
  tags: string[] | null;
  baby_safety: string;
  baby_note: string | null;
  is_keto: boolean;
}

function rowToIngredient(row: IngredientRow): Ingredient {
  return {
    id: row.ingredient_id,
    name: row.name,
    emoji: row.emoji,
    category: INGREDIENT_CATEGORY,
    babySafety: row.baby_safety as BabySafety,
    babyNote: row.baby_note ?? undefined,
    isKeto: row.is_keto,
    tags: row.tags ?? [],
    kind: "ingredient",
  };
}

export function useIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("name", { ascending: true });
    if (error) { console.error("Error loading ingredients:", error); return; }
    if (data) setIngredients((data as IngredientRow[]).map(rowToIngredient));
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  // Realtime: cualquier cambio recarga el catálogo
  useEffect(() => {
    const channel = supabase
      .channel("ingredients_catalog")
      .on("postgres_changes", { event: "*", schema: "public", table: "ingredients" }, () => void load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const addIngredient = useCallback(async (ing: { name: string; emoji?: string; tags?: string[]; babySafety?: BabySafety; babyNote?: string; isKeto?: boolean }): Promise<Ingredient | null> => {
    const slug = ingredientSlug(ing.name);
    if (!slug) return null;
    const existing = ingredients.find((i) => i.id === slug);
    if (existing) return existing;

    const row = {
      ingredient_id: slug,
      name: ing.name.trim(),
      emoji: ing.emoji || "🥕",
      tags: ing.tags ?? [],
      baby_safety: ing.babySafety ?? "caution",
      baby_note: ing.babyNote ?? null,
      is_keto: ing.isKeto ?? false,
    };
    const { data, error } = await supabase
      .from("ingredients")
      .upsert(row, { onConflict: "ingredient_id", ignoreDuplicates: true })
      .select()
      .maybeSingle();
    if (error) { console.error("Error saving ingredient:", error); return null; }

    const created = data ? rowToIngredient(data as IngredientRow) : rowToIngredient(row as IngredientRow);
    setIngredients((prev) => prev.some((i) => i.id === created.id) ? prev : [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  }, [ingredients]);

  const updateIngredient = useCallback(async (id: string, patch: Partial<Pick<Ingredient, "name" | "emoji" | "tags" | "babySafety" | "babyNote" | "isKeto">>) => {
    const row: TablesUpdate<"ingredients"> = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.emoji !== undefined) row.emoji = patch.emoji;
    if (patch.tags !== undefined) row.tags = patch.tags;
    if (patch.babySafety !== undefined) row.baby_safety = patch.babySafety;
    if (patch.babyNote !== undefined) row.baby_note = patch.babyNote ?? null;
    if (patch.isKeto !== undefined) row.is_keto = patch.isKeto;

    const { error } = await supabase.from("ingredients").update(row).eq("ingredient_id", id);
    if (error) { console.error("Error updating ingredient:", error); return; }
    setIngredients((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const deleteIngredient = useCallback(async (id: string) => {
    const { error } = await supabase.from("ingredients").delete().eq("ingredient_id", id);
    if (error) { console.error("Error deleting ingredient:", error); return; }
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { ingredients, loading, addIngredient, updateIngredient, deleteIngredient };
}
