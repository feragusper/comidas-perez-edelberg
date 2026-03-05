import { useState, useEffect } from "react";
import { Meal, DAYS, SUNDAY_DINNER } from "@/data/meals";

export interface DayPlan {
  day: string;
  dinner: Meal | null;
  lunchFromPrev: Meal | null; // auto-populated from previous night
  babyDinner: Meal | null;
  babyLunch: Meal | null;
  notes: string;
}

export type WeekKey = "current" | "next";

const buildInitialPlan = (): DayPlan[] => {
  return DAYS.map((day) => ({
    day,
    dinner: day === "Domingo" ? SUNDAY_DINNER : null,
    lunchFromPrev: null,
    babyDinner: null,
    babyLunch: null,
    notes: "",
  }));
};

const storageKey = (week: WeekKey) => `meal-plan-${week}`;

export function useMealPlan(weekKey: WeekKey = "current") {
  const [plan, setPlan] = useState<DayPlan[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey(weekKey));
      if (stored) {
        const parsed = JSON.parse(stored) as DayPlan[];
        return parsed.map((d) =>
          d.day === "Domingo" ? { ...d, dinner: SUNDAY_DINNER } : d
        );
      }
    } catch { }
    return buildInitialPlan();
  });

  // Reload when weekKey changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey(weekKey));
      if (stored) {
        const parsed = JSON.parse(stored) as DayPlan[];
        setPlan(parsed.map((d) =>
          d.day === "Domingo" ? { ...d, dinner: SUNDAY_DINNER } : d
        ));
      } else {
        setPlan(buildInitialPlan());
      }
    } catch {
      setPlan(buildInitialPlan());
    }
  }, [weekKey]);

  // Keep lunch auto-populated
  const planWithLunch: DayPlan[] = plan.map((dayPlan, idx) => ({
    ...dayPlan,
    lunchFromPrev: idx === 0 ? null : plan[idx - 1].dinner,
  }));

  useEffect(() => {
    localStorage.setItem(storageKey(weekKey), JSON.stringify(plan));
  }, [plan, weekKey]);

  const setDinner = (dayIndex: number, meal: Meal | null) => {
    if (plan[dayIndex].day === "Domingo") return;
    setPlan((prev) =>
      prev.map((d, i) => (i === dayIndex ? { ...d, dinner: meal } : d))
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

  return { plan: planWithLunch, setDinner, setBabyDinner, setBabyLunch, setNotes, resetPlan };
}
