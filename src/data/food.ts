import { Meal } from "./meals";

/** Categoría sintética con la que los ingredientes viajan por la UI de comidas. */
export const INGREDIENT_CATEGORY = "Ingredientes";

/**
 * Ingrediente reutilizable del catálogo (tabla `ingredients`).
 * Estructuralmente es un Meal con kind "ingredient" para poder ocupar
 * cualquier slot del menú (una fruta como merienda, etc.) sin tocar
 * el formato de los snapshots de meal_plan.
 */
export type Ingredient = Meal & { kind: "ingredient" };

export function isIngredient(food: Meal | null | undefined): food is Ingredient {
  return food?.kind === "ingredient";
}

/** Slug estable para ingredient_id: minúsculas, sin acentos ni símbolos. */
export function ingredientSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
