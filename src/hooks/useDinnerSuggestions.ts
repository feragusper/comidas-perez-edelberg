import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Meal, MEALS, SUNDAY_DINNER } from "@/data/meals";
import { DayPlan } from "@/hooks/useMealPlan";
import { supabase } from "@/integrations/supabase/client";

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
  isAI?: boolean;
}

function buildLocalSuggestions(plan: DayPlan[]): (DinnerSuggestion | null)[] {
  const usedDinnerIds = new Set(
    plan.filter((d) => d.dinner !== null && d.day !== "Domingo").map((d) => d.dinner!.id)
  );
  const usedSideIds = new Set(
    plan.filter((d) => d.dinnerSide !== null).map((d) => d.dinnerSide!.id)
  );
  const ketoMeals = MAIN_MEALS.filter((m) => m.isKeto);
  const ketoSides = SIDE_MEALS.filter((m) => m.isKeto);
  const seed = [...usedDinnerIds].sort().join(",") || "empty";
  const mealPool = seededShuffle(ketoMeals.filter((m) => !usedDinnerIds.has(m.id)), seed);
  const sidePool = seededShuffle(ketoSides.filter((s) => !usedSideIds.has(s.id)), seed + "_side");
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
  regenerateDay: (dayIndex: number) => void;
  loadingAI: boolean;
  loadingDayIndex: number | null;
}

export function useDinnerSuggestions(plan: DayPlan[]): UseDinnerSuggestionsResult {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? true : stored === "true";
    } catch { return true; }
  });

  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [aiSuggestions, setAiSuggestions] = useState<(DinnerSuggestion | null)[] | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingDayIndex, setLoadingDayIndex] = useState<number | null>(null);
  const lastSignatureRef = useRef<string>("");

  const dinnerSignature = plan.map((d) => d.dinner?.id ?? "null").join(",");

  // Reset dismissed & AI suggestions when plan changes
  useEffect(() => {
    setDismissed(new Set());
    setAiSuggestions(null);
    lastSignatureRef.current = "";
  }, [dinnerSignature]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAllAISuggestions = useCallback(async () => {
    if (!enabled) return;
    if (lastSignatureRef.current === dinnerSignature && aiSuggestions !== null) return;
    lastSignatureRef.current = dinnerSignature;

    setLoadingAI(true);
    try {
      const currentMeals = plan.filter((d) => d.dinner !== null).map((d) => d.dinner!.name);
      const mealCatalog = MAIN_MEALS.map((m) => ({ id: m.id, name: m.name, category: m.category, isKeto: m.isKeto ?? false }));
      const sideCatalog = SIDE_MEALS.map((m) => ({ id: m.id, name: m.name, isKeto: m.isKeto ?? false }));

      const { data, error } = await supabase.functions.invoke("suggest-meals", {
        body: { currentMeals, mealCatalog, sideCatalog },
      });

      if (error || !data?.suggestions) throw new Error(error?.message ?? "No suggestions");

      const mapped: (DinnerSuggestion | null)[] = plan.map((dayPlan, idx) => {
        if (dayPlan.dinner !== null) return null;
        if (dayPlan.isDelivery) return null;
        if (dayPlan.day === "Domingo") return null;
        const raw = data.suggestions[idx];
        if (!raw) return null;
        const meal = MEALS.find((m) => m.id === raw.mealId) ?? null;
        const side = MEALS.find((m) => m.id === raw.sideId) ?? null;
        if (!meal) return null;
        return { meal, side, isAI: true };
      });

      setAiSuggestions(mapped);
    } catch (err) {
      console.error("AI suggestions failed, falling back to local:", err);
      setAiSuggestions(null);
    } finally {
      setLoadingAI(false);
    }
  }, [enabled, plan, dinnerSignature, aiSuggestions]);

  // Fetch AI suggestions when enabled and plan changes
  useEffect(() => {
    if (enabled) {
      fetchAllAISuggestions();
    }
  }, [enabled, dinnerSignature]); // eslint-disable-line react-hooks/exhaustive-deps

  // Regenerate a single day's suggestion
  const regenerateDay = useCallback(async (dayIndex: number) => {
    if (!enabled) return;
    setLoadingDayIndex(dayIndex);
    try {
      const currentMeals = plan.filter((d) => d.dinner !== null).map((d) => d.dinner!.name);
      const mealCatalog = MAIN_MEALS.map((m) => ({ id: m.id, name: m.name, category: m.category, isKeto: m.isKeto ?? false }));
      const sideCatalog = SIDE_MEALS.map((m) => ({ id: m.id, name: m.name, isKeto: m.isKeto ?? false }));

      // Build existing suggestions to avoid duplicates
      const existingSuggestions = (aiSuggestions ?? [])
        .map((s, i) => s && i !== dayIndex ? { dayIndex: i, mealId: s.meal.id, sideId: s.side?.id ?? "" } : null)
        .filter(Boolean);

      const { data, error } = await supabase.functions.invoke("suggest-meals", {
        body: { currentMeals, mealCatalog, sideCatalog, targetDayIndex: dayIndex, existingSuggestions },
      });

      if (error || !data?.suggestion) throw new Error(error?.message ?? "No suggestion");

      const raw = data.suggestion;
      const meal = MEALS.find((m) => m.id === raw.mealId) ?? null;
      const side = MEALS.find((m) => m.id === raw.sideId) ?? null;
      if (!meal) return;

      setAiSuggestions((prev) => {
        const next = prev ? [...prev] : plan.map(() => null);
        next[dayIndex] = { meal, side, isAI: true };
        return next;
      });
      // Remove from dismissed if it was dismissed
      setDismissed((prev) => {
        const next = new Set(prev);
        next.delete(dayIndex);
        return next;
      });
    } catch (err) {
      console.error("AI single-day regen failed:", err);
    } finally {
      setLoadingDayIndex(null);
    }
  }, [enabled, plan, aiSuggestions]);

  const localSuggestions = useMemo(() => buildLocalSuggestions(plan), [plan]);
  const baseSuggestions = aiSuggestions ?? localSuggestions;

  const suggestions = useMemo(
    () => baseSuggestions.map((s, i) => (dismissed.has(i) ? null : s)),
    [baseSuggestions, dismissed]
  );

  const toggle = () => {
    setEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      if (next) {
        setAiSuggestions(null);
        lastSignatureRef.current = "";
      }
      return next;
    });
  };

  const dismiss = (dayIndex: number) => {
    setDismissed((prev) => new Set([...prev, dayIndex]));
  };

  return { enabled, toggle, suggestions, dismiss, regenerateDay, loadingAI, loadingDayIndex };
}
