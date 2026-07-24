import { supabase } from "@/integrations/supabase/client";
import { Meal } from "@/data/meals";

/** Una sugerencia lista para meterse en un slot del menú desde el picker. */
export interface PickerSuggestion {
  meal: Meal;
  /** Frase corta (solo en ideas de despensa). */
  description?: string;
  /** true = comida nueva (no está en el catálogo); al elegirla se guarda. */
  isNew: boolean;
  source: "free" | "pantry";
}

/**
 * Sugerencia del catálogo, sin ligar a la despensa. Reutiliza la edge function
 * `suggest-meals` en modo un-día y devuelve una comida existente del catálogo.
 */
export async function suggestFromCatalog(catalog: Meal[], isBaby: boolean): Promise<PickerSuggestion | null> {
  const mains = catalog.filter((m) => m.isSide !== true && (!isBaby || m.babySafety !== "unsafe"));
  const sides = catalog.filter((m) => m.isSide === true);
  const mealCatalog = mains.map((m) => ({ id: m.id, name: m.name, category: m.category, isKeto: m.isKeto ?? false }));
  const sideCatalog = sides.map((m) => ({ id: m.id, name: m.name, isKeto: m.isKeto ?? false }));

  const { data, error } = await supabase.functions.invoke("suggest-meals", {
    body: { currentMeals: [], mealCatalog, sideCatalog, targetDayIndex: 0 },
  });
  if (error) throw new Error(error.message ?? "Request failed");
  if (data?.error) throw new Error(data.error);

  const raw = data?.suggestion as { mealId?: string } | undefined;
  const meal = raw?.mealId ? mains.find((m) => m.id === raw.mealId) : undefined;
  return meal ? { meal, isNew: false, source: "free" } : null;
}

interface RawPantryIdea {
  name: string;
  emoji?: string;
  description?: string;
  isKeto?: boolean;
}

/**
 * Ideas usando lo que hay en Don Bacilio (edge function `suggest-from-ingredients`).
 * Devuelve comidas nuevas: al elegir una se guarda en el catálogo.
 */
export async function suggestFromPantry(pantryNames: string[]): Promise<PickerSuggestion[]> {
  const { data, error } = await supabase.functions.invoke("suggest-from-ingredients", {
    body: { ingredients: pantryNames },
  });
  if (error) throw new Error(error.message ?? "Request failed");
  if (data?.error) throw new Error(data.error);

  const list: RawPantryIdea[] = Array.isArray(data?.suggestions) ? data.suggestions : [];
  return list.slice(0, 6).map((s) => ({
    meal: {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: s.name,
      emoji: s.emoji || "🍽️",
      category: "Otro",
      babySafety: "caution",
      isKeto: !!s.isKeto,
      isSide: false,
      kind: "meal",
      tags: [],
      ingredientIds: [],
    },
    description: s.description,
    isNew: true,
    source: "pantry",
  }));
}
