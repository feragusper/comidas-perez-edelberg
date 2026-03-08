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
  babyDinnerOverridden: boolean;
  babyLunch: Meal | null;
  babyLunchSide: Meal | null;
  babyLunchNote: string;
  babyLunchOverridden: boolean;
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
    babyDinnerOverridden: false,
    babyLunch: null,
    babyLunchSide: null,
    babyLunchNote: "",
    babyLunchOverridden: false,
    notes: "",
  }));
};

export function useMealPlan(weekKey: WeekKey = "current") {
  const [plan, setPlan] = useState<DayPlan[]>(buildInitialPlan);
  const [loading, setLoading] = useState(true);
  // Ref to avoid re-saving what we just received from realtime or from loading
  const skipNextSave = useRef(false);
  // Track the weekKey for which data was last loaded to prevent stale saves
  const loadedWeekKey = useRef<WeekKey | null>(null);
  // Debounced save timer — declared early so the load effect can cancel it
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load initial data from DB — also resets plan immediately to avoid flicker
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // Reset plan immediately so stale data from the previous week isn't shown
    setPlan(buildInitialPlan());
    // Cancel any pending debounced save from the previous week
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
    }
    skipNextSave.current = true;

    supabase
      .from("meal_plan")
      .select("plan")
      .eq("week_key", weekKey)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        skipNextSave.current = true;
        if (error) {
          console.error("Error loading meal plan:", error);
          setPlan(buildInitialPlan());
        } else if (data?.plan && Array.isArray(data.plan) && (data.plan as unknown[]).length > 0) {
          setPlan(data.plan as unknown as DayPlan[]);
        } else {
          setPlan(buildInitialPlan());
        }
        loadedWeekKey.current = weekKey;
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

  const savePlan = useCallback(
    (newPlan: DayPlan[]) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        if (skipNextSave.current) {
          skipNextSave.current = false;
          return;
        }
        // Safety guard: never save if the loaded weekKey doesn't match current
        if (loadedWeekKey.current !== weekKey) return;
        const { error } = await supabase
          .from("meal_plan")
          .upsert(
            { week_key: weekKey, plan: newPlan as unknown as never[] },
            { onConflict: "week_key" }
          );
        if (error) console.error("Error saving meal plan:", error);
      }, 600);
    },
    [weekKey]
  );

  // Only save when plan changes due to local user edits (not loading/realtime)
  useEffect(() => {
    if (loading) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    savePlan(plan);
  }, [plan, loading, savePlan]);

  const planWithLunch: DayPlan[] = plan.map((dayPlan, idx) => {
    const prevDay = idx === 0 ? null : plan[idx - 1];

    // Adults lunch ← previous day's adult dinner
    const adultLunch = dayPlan.lunchOverridden ? {
      lunch: dayPlan.lunch,
      lunchSide: dayPlan.lunchSide,
      lunchNote: dayPlan.lunchNote,
    } : {
      lunch: prevDay?.dinner ?? null,
      lunchSide: prevDay?.dinnerSide ?? null,
      lunchNote: prevDay?.dinnerNote ?? "",
    };

    // Baby dinner ← current day's adult dinner (if baby-safe and not overridden)
    const isBabySafeDinner = dayPlan.dinner?.babySafety !== "unsafe";
    const babyDinnerSuggested = !dayPlan.babyDinnerOverridden ? {
      babyDinner: (dayPlan.dinner && isBabySafeDinner) ? dayPlan.dinner : null,
      babyDinnerSide: (dayPlan.dinner && isBabySafeDinner) ? dayPlan.dinnerSide : null,
      babyDinnerNote: (dayPlan.dinner && isBabySafeDinner) ? dayPlan.dinnerNote : "",
    } : {
      babyDinner: dayPlan.babyDinner,
      babyDinnerSide: dayPlan.babyDinnerSide,
      babyDinnerNote: dayPlan.babyDinnerNote,
    };

    // Baby lunch ← previous day's baby dinner (if not overridden)
    const prevBabyDinnerComputed = prevDay && !prevDay.babyDinnerOverridden
      ? { meal: prevDay.dinner?.babySafety !== "unsafe" ? prevDay.dinner : null, side: prevDay.dinner?.babySafety !== "unsafe" ? prevDay.dinnerSide : null, note: prevDay.dinner?.babySafety !== "unsafe" ? prevDay.dinnerNote : "" }
      : { meal: prevDay?.babyDinner ?? null, side: prevDay?.babyDinnerSide ?? null, note: prevDay?.babyDinnerNote ?? "" };

    const babyLunchSuggested = !dayPlan.babyLunchOverridden ? {
      babyLunch: prevBabyDinnerComputed.meal,
      babyLunchSide: prevBabyDinnerComputed.side,
      babyLunchNote: prevBabyDinnerComputed.note,
    } : {
      babyLunch: dayPlan.babyLunch,
      babyLunchSide: dayPlan.babyLunchSide,
      babyLunchNote: dayPlan.babyLunchNote,
    };

    return {
      ...dayPlan,
      ...adultLunch,
      ...babyDinnerSuggested,
      ...babyLunchSuggested,
    };
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
  const setBabyDinner = (i: number, meal: Meal | null) => update(i, { babyDinner: meal, babyDinnerOverridden: true });
  const setBabyDinnerSide = (i: number, meal: Meal | null) => update(i, { babyDinnerSide: meal });
  const setBabyDinnerNote = (i: number, note: string) => update(i, { babyDinnerNote: note });
  const resetBabyDinner = (i: number) => update(i, { babyDinner: null, babyDinnerSide: null, babyDinnerNote: "", babyDinnerOverridden: false });
  const setBabyLunch = (i: number, meal: Meal | null) => update(i, { babyLunch: meal, babyLunchOverridden: true });
  const setBabyLunchSide = (i: number, meal: Meal | null) => update(i, { babyLunchSide: meal });
  const setBabyLunchNote = (i: number, note: string) => update(i, { babyLunchNote: note });
  const resetBabyLunch = (i: number) => update(i, { babyLunch: null, babyLunchSide: null, babyLunchNote: "", babyLunchOverridden: false });
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
