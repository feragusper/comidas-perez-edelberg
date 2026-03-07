import { useState, useEffect, useRef, useCallback } from "react";
import { Meal, DAYS, SUNDAY_DINNER } from "@/data/meals";
import { supabase } from "@/integrations/supabase/client";

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

export function useMealPlan(weekKey: WeekKey = "current") {
  const [plan, setPlan] = useState<DayPlan[]>(buildInitialPlan);
  const [loading, setLoading] = useState(true);
  // Ref to avoid re-saving what we just received from realtime
  const skipNextSave = useRef(false);

  // Load initial data from DB
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    supabase
      .from("meal_plan")
      .select("plan")
      .eq("week_key", weekKey)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Error loading meal plan:", error);
          setPlan(buildInitialPlan());
        } else if (data?.plan && Array.isArray(data.plan) && (data.plan as unknown[]).length > 0) {
          setPlan(data.plan as unknown as DayPlan[]);
        } else {
          setPlan(buildInitialPlan());
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [weekKey]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`meal_plan_${weekKey}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meal_plan",
          filter: `week_key=eq.${weekKey}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const newPlan = (payload.new as { plan: DayPlan[] }).plan;
            if (newPlan) {
              skipNextSave.current = true;
              setPlan(newPlan as DayPlan[]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [weekKey]);

  // Debounced save to DB
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savePlan = useCallback(
    (newPlan: DayPlan[]) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        if (skipNextSave.current) {
          skipNextSave.current = false;
          return;
        }
        const { error } = await supabase
          .from("meal_plan")
          .upsert(
            { week_key: weekKey, plan: newPlan as unknown as never[] },
            { onConflict: "week_key" }
          );
        if (error) console.error("Error saving meal plan:", error);
      }, 500);
    },
    [weekKey]
  );

  // Every time plan changes (from local updates), save it
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (loading) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    savePlan(plan);
  }, [plan, loading, savePlan]);

  // Reset isFirstRender when weekKey changes
  useEffect(() => {
    isFirstRender.current = true;
  }, [weekKey]);

  const planWithLunch: DayPlan[] = plan.map((dayPlan, idx) => {
    if (dayPlan.lunchOverridden) return dayPlan;
    const suggestedLunch = idx === 0 ? null : plan[idx - 1].dinner;
    return { ...dayPlan, lunch: suggestedLunch };
  });

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
    loading,
    setDinner, setDinnerSide, setDinnerNote,
    setLunch, setLunchSide, setLunchNote, resetLunch,
    setBabyDinner, setBabyDinnerSide, setBabyDinnerNote,
    setBabyLunch, setBabyLunchSide, setBabyLunchNote,
    setNotes,
    resetPlan,
  };
}
