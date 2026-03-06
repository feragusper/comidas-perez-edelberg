import { useState, useEffect } from "react";
import { Meal, DAYS, SUNDAY_DINNER } from "@/data/meals";

export interface DayPlan {
  day: string;
  dinner: Meal | null;
  dinnerSide: Meal | null;
  dinnerNote: string;
  lunch: Meal | null;
  lunchSide: Meal | null;
  lunchNote: string;
  lunchOverridden: boolean;
  babyDinner: Meal | null;
  babyDinnerNote: string;
  babyLunch: Meal | null;
  babyLunchNote: string;
  notes: string;
}

export type WeekKey = "current" | "next";

const buildInitialPlan = (): DayPlan[] => {
  return DAYS.map((day) => ({
    day,
    dinner: day === "Domingo" ? SUNDAY_DINNER : null,
    dinnerSide: null,
    dinnerNote: "",
    lunch: null,
    lunchSide: null,
    lunchNote: "",
    lunchOverridden: false,
    babyDinner: null,
    babyDinnerNote: "",
    babyLunch: null,
    babyLunchNote: "",
    notes: "",
  }));
};

const storageKey = (week: WeekKey) => `meal-plan-v4-${week}`;

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

  const update = (dayIndex: number, patch: Partial<DayPlan>) => {
    setPlan((prev) => prev.map((d, i) => (i === dayIndex ? { ...d, ...patch } : d)));
  };

  const setDinner = (dayIndex: number, meal: Meal | null) => update(dayIndex, { dinner: meal });
  const setDinnerSide = (dayIndex: number, meal: Meal | null) => update(dayIndex, { dinnerSide: meal });
  const setDinnerNote = (dayIndex: number, note: string) => update(dayIndex, { dinnerNote: note });
  const setLunch = (dayIndex: number, meal: Meal | null) => update(dayIndex, { lunch: meal, lunchOverridden: true });
  const setLunchSide = (dayIndex: number, meal: Meal | null) => update(dayIndex, { lunchSide: meal });
  const setLunchNote = (dayIndex: number, note: string) => update(dayIndex, { lunchNote: note });
  const resetLunch = (dayIndex: number) => update(dayIndex, { lunch: null, lunchSide: null, lunchOverridden: false, lunchNote: "" });
  const setBabyDinner = (dayIndex: number, meal: Meal | null) => update(dayIndex, { babyDinner: meal });
  const setBabyDinnerNote = (dayIndex: number, note: string) => update(dayIndex, { babyDinnerNote: note });
  const setBabyLunch = (dayIndex: number, meal: Meal | null) => update(dayIndex, { babyLunch: meal });
  const setBabyLunchNote = (dayIndex: number, note: string) => update(dayIndex, { babyLunchNote: note });
  const setNotes = (dayIndex: number, notes: string) => update(dayIndex, { notes });
  const resetPlan = () => setPlan(buildInitialPlan());

  return {
    plan: planWithLunch,
    setDinner, setDinnerSide, setDinnerNote,
    setLunch, setLunchSide, setLunchNote, resetLunch,
    setBabyDinner, setBabyDinnerNote,
    setBabyLunch, setBabyLunchNote,
    setNotes,
    resetPlan,
  };
}
