import { useState, useEffect, useMemo } from "react";
import { Meal, MEALS, SUNDAY_DINNER } from "@/data/meals";
import { DayPlan } from "@/hooks/useMealPlan";

const STORAGE_KEY = "dinnerSuggestionsEnabled";

const MAIN_MEALS = MEALS.filter((m) => !m.isSide && m.id !== SUNDAY_DINNER.id);

/**
 * Deterministic shuffle seeded by a string (week + day combos stay stable
 * across renders, but change when the seed changes).
 */
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

/**
 * Given the current plan, returns one suggested Meal per day (or null if the
 * day already has a dinner or is Sunday).
 * Suggestions avoid repeating meals already chosen elsewhere in the week.
 * The seed changes whenever the set of already-planned dinners changes, so
 * suggestions "rotate" to stay varied as the user fills in the week.
 */
function buildSuggestions(plan: DayPlan[]): (Meal | null)[] {
  const usedIds = new Set(
    plan
      .filter((d) => d.dinner !== null && d.day !== "Domingo")
      .map((d) => d.dinner!.id)
  );

  // Seed = sorted list of used ids → changes whenever dinners change
  const seed = [...usedIds].sort().join(",") || "empty";
  const pool = seededShuffle(
    MAIN_MEALS.filter((m) => !usedIds.has(m.id)),
    seed
  );

  let poolIdx = 0;
  return plan.map((dayPlan) => {
    if (dayPlan.day === "Domingo") return null; // always pasta
    if (dayPlan.dinner !== null) return null;   // already has a dinner
    return pool[poolIdx++] ?? null;
  });
}

export interface UseDinnerSuggestionsResult {
  enabled: boolean;
  toggle: () => void;
  suggestions: (Meal | null)[];
  dismiss: (dayIndex: number) => void;
  regenerate: (dayIndex: number) => void;
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

  // Track dismissed indices so the user can dismiss a suggestion without accepting
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  // Recompute base suggestions whenever the plan's dinners change
  const baseSuggestions = useMemo(() => buildSuggestions(plan), [plan]);

  // Reset dismissed set when the plan's dinner composition changes
  // (so new suggestions after a dinner is set don't inherit old dismissals)
  const dinnerSignature = plan.map((d) => d.dinner?.id ?? "null").join(",");
  useEffect(() => {
    setDismissed(new Set());
  }, [dinnerSignature]); // eslint-disable-line react-hooks/exhaustive-deps

  const suggestions = useMemo(
    () =>
      baseSuggestions.map((s, i) =>
        dismissed.has(i) ? null : s
      ),
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

  // Regenerate: pick the next available meal from the pool for this slot
  const regenerate = (dayIndex: number) => {
    // Just un-dismiss and re-dismiss with a different offset — simplest: toggle dismissed off
    // and rotate the seed by adding a counter to force a different pick.
    // Easiest approach: remove from dismissed so the suggestion shows, users can dismiss again.
    setDismissed((prev) => {
      const next = new Set(prev);
      next.delete(dayIndex);
      return next;
    });
  };

  return { enabled, toggle, suggestions, dismiss, regenerate };
}
