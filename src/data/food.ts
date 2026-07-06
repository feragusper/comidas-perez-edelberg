import { Meal } from "./meals";

/** Categoría sintética con la que los ingredientes viajan por la UI de comidas. */
export const INGREDIENT_CATEGORY = "Ingredientes";

/**
 * Comidas de sistema (delivery, sobras, etc.): no se componentizan,
 * no se compran, no se listan en el catálogo editable ni se sugieren.
 */
export const SENTINEL_MEAL_IDS = new Set([
  "delivery",
  "takeaway",
  "restaurante",
  "delivery-sobras",
  "takeaway-sobras",
  "delivery-leftovers",
  "takeaway-leftovers",
]);

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
