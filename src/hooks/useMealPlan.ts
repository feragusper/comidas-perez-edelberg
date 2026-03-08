import { useState, useEffect, useRef, useCallback } from "react";
import { Meal, DAYS, SUNDAY_DINNER } from "@/data/meals";
import { supabase } from "@/integrations/supabase/client";
import { envWeekKey } from "@/lib/env";

export interface DayPlan {
  day: string;
  dinner: Meal | null;
  dinnerSide: Meal | null;
  dinnerNote: string;
  lunch: Meal | null;
  lunchSide: Meal | null;
  lunchNote: string;
  lunchOverridden: boolean;  // true = user manually picked a lunch
  lunchHidden: boolean;       // true = user dismissed the suggestion
  babyDinner: Meal | null;
  babyDinnerSide: Meal | null;
  babyDinnerNote: string;
  babyDinnerOverridden: boolean;
  babyDinnerHidden: boolean;
  babyLunch: Meal | null;
  babyLunchSide: Meal | null;
  babyLunchNote: string;
  babyLunchOverridden: boolean;
  babyLunchHidden: boolean;
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
    lunchHidden: false,
    babyDinner: null,
    babyDinnerSide: null,
    babyDinnerNote: "",
    babyDinnerOverridden: false,
    babyDinnerHidden: false,
    babyLunch: null,
    babyLunchSide: null,
    babyLunchNote: "",
    babyLunchOverridden: false,
    babyLunchHidden: false,
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
      .eq("week_key", envWeekKey(weekKey))
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        skipNextSave.current = true;
        if (error) {
          console.error("Error loading meal plan:", error);
          setPlan(buildInitialPlan());
        } else if (data?.plan && Array.isArray(data.plan) && (data.plan as unknown[]).length > 0) {
          // Migrate legacy data: if lunchOverridden is true but lunch matches prev dinner, reset it
          const raw = data.plan as unknown as DayPlan[];
          const migrated = raw.map((day) => ({
            ...day,
            // If overridden but meal is null, that's corrupt state — reset it
            lunchOverridden: (day.lunchOverridden ?? false) && day.lunch != null,
            lunchHidden: day.lunchHidden ?? false,
            babyDinnerOverridden: (day.babyDinnerOverridden ?? false) && day.babyDinner != null,
            babyDinnerHidden: day.babyDinnerHidden ?? false,
            babyLunchOverridden: (day.babyLunchOverridden ?? false) && day.babyLunch != null,
            babyLunchHidden: day.babyLunchHidden ?? false,
            // Strip computed fields that shouldn't be persisted — they'll be recomputed
            lunch: (day.lunchOverridden && day.lunch != null) ? day.lunch : null,
            lunchSide: (day.lunchOverridden && day.lunch != null) ? day.lunchSide : null,
            lunchNote: (day.lunchOverridden && day.lunch != null) ? day.lunchNote : "",
            babyDinner: (day.babyDinnerOverridden && day.babyDinner != null) ? day.babyDinner : null,
            babyDinnerSide: (day.babyDinnerOverridden && day.babyDinner != null) ? day.babyDinnerSide : null,
            babyDinnerNote: (day.babyDinnerOverridden && day.babyDinner != null) ? day.babyDinnerNote : "",
            babyLunch: (day.babyLunchOverridden && day.babyLunch != null) ? day.babyLunch : null,
            babyLunchSide: (day.babyLunchOverridden && day.babyLunch != null) ? day.babyLunchSide : null,
            babyLunchNote: (day.babyLunchOverridden && day.babyLunch != null) ? day.babyLunchNote : "",
          }));
          setPlan(migrated);
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
        // Strip computed fields before saving — only persist raw/manual state
        const rawPlan = newPlan.map((day) => ({
          ...day,
          lunch: day.lunchOverridden ? day.lunch : null,
          lunchSide: day.lunchOverridden ? day.lunchSide : null,
          lunchNote: day.lunchOverridden ? day.lunchNote : "",
          babyDinner: day.babyDinnerOverridden ? day.babyDinner : null,
          babyDinnerSide: day.babyDinnerOverridden ? day.babyDinnerSide : null,
          babyDinnerNote: day.babyDinnerOverridden ? day.babyDinnerNote : "",
          babyLunch: day.babyLunchOverridden ? day.babyLunch : null,
          babyLunchSide: day.babyLunchOverridden ? day.babyLunchSide : null,
          babyLunchNote: day.babyLunchOverridden ? day.babyLunchNote : "",
        }));
        const { error } = await supabase
          .from("meal_plan")
          .upsert(
            { week_key: weekKey, plan: rawPlan as unknown as never[] },
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
    const prevDinner = prevDay?.dinner ?? null;
    const isPrevBabySafe = prevDinner?.babySafety !== "unsafe";

    // Adults lunch ← previous day's adult dinner (unless manually overridden or hidden)
    let adultLunch: Pick<DayPlan, "lunch" | "lunchSide" | "lunchNote">;
    if (dayPlan.lunchOverridden) {
      adultLunch = { lunch: dayPlan.lunch, lunchSide: dayPlan.lunchSide, lunchNote: dayPlan.lunchNote };
    } else if (dayPlan.lunchHidden) {
      adultLunch = { lunch: null, lunchSide: null, lunchNote: "" };
    } else {
      adultLunch = {
        lunch: prevDinner ?? null,
        lunchSide: prevDinner ? (prevDay?.dinnerSide ?? null) : null,
        lunchNote: prevDinner ? (prevDay?.dinnerNote ?? "") : "",
      };
    }

    // Baby dinner ← previous day's adult dinner (if baby-safe, not overridden, not hidden)
    let babyDinnerSuggested: Pick<DayPlan, "babyDinner" | "babyDinnerSide" | "babyDinnerNote">;
    if (dayPlan.babyDinnerOverridden) {
      babyDinnerSuggested = { babyDinner: dayPlan.babyDinner, babyDinnerSide: dayPlan.babyDinnerSide, babyDinnerNote: dayPlan.babyDinnerNote };
    } else if (dayPlan.babyDinnerHidden) {
      babyDinnerSuggested = { babyDinner: null, babyDinnerSide: null, babyDinnerNote: "" };
    } else {
      babyDinnerSuggested = {
        babyDinner: (prevDinner && isPrevBabySafe) ? prevDinner : null,
        babyDinnerSide: (prevDinner && isPrevBabySafe) ? (prevDay?.dinnerSide ?? null) : null,
        babyDinnerNote: (prevDinner && isPrevBabySafe) ? (prevDay?.dinnerNote ?? "") : "",
      };
    }

    // Baby lunch ← previous day's adult dinner (if baby-safe, not overridden, not hidden)
    let babyLunchSuggested: Pick<DayPlan, "babyLunch" | "babyLunchSide" | "babyLunchNote">;
    if (dayPlan.babyLunchOverridden) {
      babyLunchSuggested = { babyLunch: dayPlan.babyLunch, babyLunchSide: dayPlan.babyLunchSide, babyLunchNote: dayPlan.babyLunchNote };
    } else if (dayPlan.babyLunchHidden) {
      babyLunchSuggested = { babyLunch: null, babyLunchSide: null, babyLunchNote: "" };
    } else {
      babyLunchSuggested = {
        babyLunch: (prevDinner && isPrevBabySafe) ? prevDinner : null,
        babyLunchSide: (prevDinner && isPrevBabySafe) ? (prevDay?.dinnerSide ?? null) : null,
        babyLunchNote: (prevDinner && isPrevBabySafe) ? (prevDay?.dinnerNote ?? "") : "",
      };
    }

    return { ...dayPlan, ...adultLunch, ...babyDinnerSuggested, ...babyLunchSuggested };
  });

  const update = (dayIndex: number, patch: Partial<DayPlan>) => {
    setPlan((prev) => prev.map((d, i) => (i === dayIndex ? { ...d, ...patch } : d)));
  };

  const setDinner = (i: number, meal: Meal | null) => update(i, { dinner: meal });
  const setDinnerSide = (i: number, meal: Meal | null) => update(i, { dinnerSide: meal });
  const setDinnerNote = (i: number, note: string) => update(i, { dinnerNote: note });
  // Manual lunch pick
  const setLunch = (i: number, meal: Meal | null) => update(i, { lunch: meal, lunchOverridden: true, lunchHidden: false });
  const setLunchSide = (i: number, meal: Meal | null) => update(i, { lunchSide: meal });
  const setLunchNote = (i: number, note: string) => update(i, { lunchNote: note });
  // Hide suggestion (trash on a suggested meal) — no override, just hidden
  const hideLunch = (i: number) => update(i, { lunchHidden: true });
  // Restore suggestion
  const resetLunch = (i: number) => update(i, { lunch: null, lunchSide: null, lunchOverridden: false, lunchHidden: false, lunchNote: "" });
  const setBabyDinner = (i: number, meal: Meal | null) => update(i, { babyDinner: meal, babyDinnerOverridden: true, babyDinnerHidden: false });
  const setBabyDinnerSide = (i: number, meal: Meal | null) => update(i, { babyDinnerSide: meal });
  const setBabyDinnerNote = (i: number, note: string) => update(i, { babyDinnerNote: note });
  const hideBabyDinner = (i: number) => update(i, { babyDinnerHidden: true });
  const resetBabyDinner = (i: number) => update(i, { babyDinner: null, babyDinnerSide: null, babyDinnerNote: "", babyDinnerOverridden: false, babyDinnerHidden: false });
  const setBabyLunch = (i: number, meal: Meal | null) => update(i, { babyLunch: meal, babyLunchOverridden: true, babyLunchHidden: false });
  const setBabyLunchSide = (i: number, meal: Meal | null) => update(i, { babyLunchSide: meal });
  const setBabyLunchNote = (i: number, note: string) => update(i, { babyLunchNote: note });
  const hideBabyLunch = (i: number) => update(i, { babyLunchHidden: true });
  const resetBabyLunch = (i: number) => update(i, { babyLunch: null, babyLunchSide: null, babyLunchNote: "", babyLunchOverridden: false, babyLunchHidden: false });
  const setNotes = (i: number, notes: string) => update(i, { notes });
  const resetPlan = () => setPlan(buildInitialPlan());

  return {
    plan: planWithLunch,
    loading,
    setDinner, setDinnerSide, setDinnerNote,
    setLunch, setLunchSide, setLunchNote, hideLunch, resetLunch,
    setBabyDinner, setBabyDinnerSide, setBabyDinnerNote, hideBabyDinner, resetBabyDinner,
    setBabyLunch, setBabyLunchSide, setBabyLunchNote, hideBabyLunch, resetBabyLunch,
    setNotes,
    resetPlan,
  };
}
