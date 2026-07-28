import { describe, it, expect } from "vitest";
import type { DayPlan } from "@/hooks/useMealPlan";
import type { Meal } from "@/data/meals";
import { dayHasFood, matchedDays, type FoodExpander } from "@/lib/pantryPlan";

const meal = (id: string, name: string, ingredientIds: string[] = []): Meal =>
  ({ id, name, emoji: "🍽️", ingredientIds } as Meal);

const dayWithDinner = (day: string, dinner: Meal): DayPlan =>
  ({ day, dinner } as unknown as DayPlan);

// Comida planificada "Milanesa de pollo" que usa el ingrediente "pollo".
const milanesa = meal("milanesa-pollo", "Milanesa de pollo", ["pollo"]);
const plan: DayPlan[] = [dayWithDinner("Lunes", milanesa)];

// Expander como el de DonBacilio: comida -> nombres de sus ingredientes.
const expand: FoodExpander = (f) =>
  f.id === "milanesa-pollo" ? [f.name, "Pollo"] : [f.name];

describe("pantryPlan ingredient link", () => {
  it("matches a planned meal by its own name (sin expander)", () => {
    expect(dayHasFood(plan[0], "Milanesa de pollo")).toBe(true);
  });

  it("does NOT match a contained ingredient without an expander", () => {
    expect(dayHasFood(plan[0], "pollo")).toBe(false);
  });

  it("matches a bought ingredient against the meal that uses it (con expander)", () => {
    expect(dayHasFood(plan[0], "pollo", expand)).toBe(true);
    expect(matchedDays(plan, "pollo", expand)).toEqual([0]);
  });

  it("still returns no match for an unrelated ingredient", () => {
    expect(dayHasFood(plan[0], "banana", expand)).toBe(false);
    expect(matchedDays(plan, "banana", expand)).toEqual([]);
  });
});
