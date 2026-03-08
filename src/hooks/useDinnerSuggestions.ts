import { useState, useEffect, useMemo } from "react";
import { Meal, MEALS, SUNDAY_DINNER } from "@/data/meals";
import { DayPlan } from "@/hooks/useMealPlan";

const STORAGE_KEY = "dinnerSuggestionsEnabled";

const MAIN_MEALS = MEALS.filter((m) => !m.isSide && m.id !== SUNDAY_DINNER.id);
const SIDE_MEALS = MEALS.filter((m) => m.isSide === true);

function seededShuffle<T>(arr: T[], seed: string): T[] {
  const copy = [...arr];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  for (let i = copy.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1664525) + 1013904223) | 0;
    const j = Math.abs(h) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface DinnerSuggestion {
  meal: Meal;
  side: Meal | null;
}

function buildSuggestions(plan: DayPlan[]): (DinnerSuggestion | null)[] {
  const usedDinnerIds = new Set(
    plan.filter((d) => d.dinner !== null && d.day !== "Domingo").map((d) => d.dinner!.id)
  );
  const usedSideIds = new Set(
    plan.filter((d) => d.dinnerSide !== null).map((d) => d.dinnerSide!.id)
  );

  const seed = [...usedDinnerIds].sort().join(",") || "empty";
  const mealPool = seededShuffle(MAIN_MEALS.filter((m) => !usedDinnerIds.has(m.id)), seed);
  const sidePool = seededShuffle(SIDE_MEALS.filter((s) => !usedSideIds.has(s.id)), seed + "_side");

  let mealIdx = 0;
  let sideIdx = 0;
  return plan.map((dayPlan) => {
    if (dayPlan.day === "Domingo") return null;
    if (dayPlan.dinner !== null) return null;
    const meal = mealPool[mealIdx++] ?? null;
    if (!meal) return null;
    const side = sidePool[sideIdx++] ?? null;
    return { meal, side };
  });
}

export interface UseDinnerSuggestionsResult {
  enabled: boolean;
  toggle: () => void;
  suggestions: (DinnerSuggestion | null)[];
  dismiss: (dayIndex: number) => void;
}

export function useDinnerSuggestions(plan: DayPlan[]): UseDinnerSuggestionsResult {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const baseSuggestions = useMemo(() => buildSuggestions(plan), [plan]);

  const dinnerSignature = plan.map((d) => d.dinner?.id ?? "null").join(",");
  useEffect(() => {
    setDismissed(new Set());
  }, [dinnerSignature]); // eslint-disable-line react-hooks/exhaustive-deps

  const suggestions = useMemo(
    () => baseSuggestions.map((s, i) => (dismissed.has(i) ? null : s)),
    [baseSuggestions, dismissed]
  );

  const toggle = () => {
    setEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  };

  const dismiss = (dayIndex: number) => {
    setDismissed((prev) => new Set([...prev, dayIndex]));
  };

  return { enabled, toggle, suggestions, dismiss };
}
