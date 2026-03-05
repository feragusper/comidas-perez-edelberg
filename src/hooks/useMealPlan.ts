import { useState, useEffect } from "react";
import { Meal, DAYS, SUNDAY_DINNER } from "@/data/meals";

export interface DayPlan {
  day: string;
  dinner: Meal | null;
  lunch: Meal | null; // editable, pre-filled from prev dinner
  lunchOverridden: boolean; // true if user manually changed it
  babyDinner: Meal | null;
  babyLunch: Meal | null;
  notes: string;
}

export type WeekKey = "current" | "next";

const buildInitialPlan = (): DayPlan[] => {
  return DAYS.map((day) => ({
    day,
    dinner: day === "Domingo" ? SUNDAY_DINNER : null,
    lunch: null,
    lunchOverridden: false,
    babyDinner: null,
    babyLunch: null,
    notes: "",
  }));
};

const storageKey = (week: WeekKey) => `meal-plan-v2-${week}`;

export function useMealPlan(weekKey: WeekKey = "current") {
  const [plan, setPlan] = useState<DayPlan[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey(weekKey));
      if (stored) return JSON.parse(stored) as DayPlan[];
    } catch { }
    return buildInitialPlan();
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey(weekKey));
      if (stored) setPlan(JSON.parse(stored) as DayPlan[]);
      else setPlan(buildInitialPlan());
    } catch {
      setPlan(buildInitialPlan());
    }
  }, [weekKey]);

  // Auto-populate lunch from previous dinner unless overridden
  const planWithLunch: DayPlan[] = plan.map((dayPlan, idx) => {
    if (dayPlan.lunchOverridden) return dayPlan;
    const suggestedLunch = idx === 0 ? null : plan[idx - 1].dinner;
    return { ...dayPlan, lunch: suggestedLunch };
  });

  useEffect(() => {
    localStorage.setItem(storageKey(weekKey), JSON.stringify(plan));
  }, [plan, weekKey]);

  const setDinner = (dayIndex: number, meal: Meal | null) => {
    setPlan((prev) =>
      prev.map((d, i) => (i === dayIndex ? { ...d, dinner: meal } : d))
    );
  };

  const setLunch = (dayIndex: number, meal: Meal | null) => {
    setPlan((prev) =>
      prev.map((d, i) =>
        i === dayIndex ? { ...d, lunch: meal, lunchOverridden: true } : d
      )
    );
  };

  const resetLunch = (dayIndex: number) => {
    setPlan((prev) =>
      prev.map((d, i) =>
        i === dayIndex ? { ...d, lunch: null, lunchOverridden: false } : d
      )
    );
  };

  const setBabyDinner = (dayIndex: number, meal: Meal | null) => {
    setPlan((prev) =>
      prev.map((d, i) => (i === dayIndex ? { ...d, babyDinner: meal } : d))
    );
  };

  const setBabyLunch = (dayIndex: number, meal: Meal | null) => {
    setPlan((prev) =>
      prev.map((d, i) => (i === dayIndex ? { ...d, babyLunch: meal } : d))
    );
  };

  const setNotes = (dayIndex: number, notes: string) => {
    setPlan((prev) =>
      prev.map((d, i) => (i === dayIndex ? { ...d, notes } : d))
    );
  };

  const resetPlan = () => {
    setPlan(buildInitialPlan());
  };

  return { plan: planWithLunch, setDinner, setLunch, resetLunch, setBabyDinner, setBabyLunch, setNotes, resetPlan };
}
