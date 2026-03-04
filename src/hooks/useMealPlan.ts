import { useState, useEffect } from "react";
import { Meal, DAYS, SUNDAY_DINNER } from "@/data/meals";

export interface DayPlan {
  day: string;
  dinner: Meal | null;
  lunchFromPrev: Meal | null; // auto-populated from previous night
  babyEatsDinner: boolean;
  babyEatsLunch: boolean;
  notes: string;
}

const buildInitialPlan = (): DayPlan[] => {
  return DAYS.map((day) => ({
    day,
    dinner: day === "Domingo" ? SUNDAY_DINNER : null,
    lunchFromPrev: null,
    babyEatsDinner: false,
    babyEatsLunch: false,
    notes: "",
  }));
};

const STORAGE_KEY = "meal-plan-week";

export function useMealPlan() {
  const [plan, setPlan] = useState<DayPlan[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DayPlan[];
        // ensure sunday is always pasta
        return parsed.map((d) =>
          d.day === "Domingo" ? { ...d, dinner: SUNDAY_DINNER } : d
        );
      }
    } catch { }
    return buildInitialPlan();
  });

  // Keep lunch auto-populated
  const planWithLunch: DayPlan[] = plan.map((dayPlan, idx) => ({
    ...dayPlan,
    lunchFromPrev: idx === 0 ? null : plan[idx - 1].dinner,
  }));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  }, [plan]);

  const setDinner = (dayIndex: number, meal: Meal | null) => {
    if (plan[dayIndex].day === "Domingo") return; // locked
    setPlan((prev) =>
      prev.map((d, i) => (i === dayIndex ? { ...d, dinner: meal } : d))
    );
  };

  const toggleBabyDinner = (dayIndex: number) => {
    setPlan((prev) =>
      prev.map((d, i) =>
        i === dayIndex ? { ...d, babyEatsDinner: !d.babyEatsDinner } : d
      )
    );
  };

  const toggleBabyLunch = (dayIndex: number) => {
    setPlan((prev) =>
      prev.map((d, i) =>
        i === dayIndex ? { ...d, babyEatsLunch: !d.babyEatsLunch } : d
      )
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

  return { plan: planWithLunch, setDinner, toggleBabyDinner, toggleBabyLunch, setNotes, resetPlan };
}
