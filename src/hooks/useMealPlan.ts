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
  babyDinnerSide: Meal | null;
  babyDinnerNote: string;
  babyLunch: Meal | null;
  babyLunchSide: Meal | null;
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
    babyDinnerSide: null,
    babyDinnerNote: "",
    babyLunch: null,
    babyLunchSide: null,
    babyLunchNote: "",
    notes: "",
  }));
};

const storageKey = (week: WeekKey) => `meal-plan-v5-${week}`;

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

  const setDinner = (i: number, meal: Meal | null) => update(i, { dinner: meal });
  const setDinnerSide = (i: number, meal: Meal | null) => update(i, { dinnerSide: meal });
  const setDinnerNote = (i: number, note: string) => update(i, { dinnerNote: note });
  const setLunch = (i: number, meal: Meal | null) => update(i, { lunch: meal, lunchOverridden: true });
  const setLunchSide = (i: number, meal: Meal | null) => update(i, { lunchSide: meal });
  const setLunchNote = (i: number, note: string) => update(i, { lunchNote: note });
  const resetLunch = (i: number) => update(i, { lunch: null, lunchSide: null, lunchOverridden: false, lunchNote: "" });
  const setBabyDinner = (i: number, meal: Meal | null) => update(i, { babyDinner: meal });
  const setBabyDinnerSide = (i: number, meal: Meal | null) => update(i, { babyDinnerSide: meal });
  const setBabyDinnerNote = (i: number, note: string) => update(i, { babyDinnerNote: note });
  const setBabyLunch = (i: number, meal: Meal | null) => update(i, { babyLunch: meal });
  const setBabyLunchSide = (i: number, meal: Meal | null) => update(i, { babyLunchSide: meal });
  const setBabyLunchNote = (i: number, note: string) => update(i, { babyLunchNote: note });
  const setNotes = (i: number, notes: string) => update(i, { notes });
  const resetPlan = () => setPlan(buildInitialPlan());

  return {
    plan: planWithLunch,
    setDinner, setDinnerSide, setDinnerNote,
    setLunch, setLunchSide, setLunchNote, resetLunch,
    setBabyDinner, setBabyDinnerSide, setBabyDinnerNote,
    setBabyLunch, setBabyLunchSide, setBabyLunchNote,
    setNotes,
    resetPlan,
  };
}
