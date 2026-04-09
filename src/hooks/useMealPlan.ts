import { useState, useEffect, useRef, useCallback } from "react";
import { Meal, DAYS, SUNDAY_DINNER, DELIVERY_DINNER, DELIVERY_LEFTOVERS } from "@/data/meals";
import { supabase } from "@/integrations/supabase/client";
import { envWeekKey } from "@/lib/env";

export interface DayPlan {
  day: string;
  dinner: Meal | null;
  dinnerSide: Meal | null;
  dinnerNote: string;
  isDelivery: boolean;        // true = delivery/cheat night
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

// weekKey is now an ISO week string like "2025-W12"
export type WeekKey = string;

function serializePlan(plan: DayPlan[]) {
  return plan.map((day) => ({
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
}

async function persistPlan(weekKey: WeekKey, plan: DayPlan[], options?: { keepalive?: boolean }) {
  const rawPlan = serializePlan(plan);

  if (options?.keepalive) {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/meal_plan?on_conflict=week_key`,
      {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({
          week_key: envWeekKey(weekKey),
          plan: rawPlan,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Error saving meal plan on unload: ${response.status}`);
    }

    return;
  }

  const { error } = await supabase
    .from("meal_plan")
    .upsert(
      { week_key: envWeekKey(weekKey), plan: rawPlan as unknown as never[] },
      { onConflict: "week_key" }
    );

  if (error) throw error;
}

const buildInitialPlan = (): DayPlan[] => {
  return DAYS.map((day) => ({
    day,
    dinner: day === "Domingo" ? SUNDAY_DINNER : null,
    dinnerSide: null,
    dinnerNote: "",
    isDelivery: false,
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

export function useMealPlan(weekKey: WeekKey) {
  const [plan, setPlan] = useState<DayPlan[]>(buildInitialPlan);
  const [loading, setLoading] = useState(true);
  // isUserEdit tracks whether the current plan change came from the user (vs. a load/realtime update)
  const isUserEdit = useRef(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<{ weekKey: WeekKey; plan: DayPlan[] } | null>(null);

  const flushPendingSave = useCallback(async (options?: { keepalive?: boolean }) => {
    const pending = pendingSave.current;
    if (!pending) return;

    pendingSave.current = null;
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
    }

    try {
      await persistPlan(pending.weekKey, pending.plan, options);
    } catch (error) {
      console.error("Error saving meal plan:", error);
      pendingSave.current = pending;
    }
  }, []);

  // Load initial data from DB — also resets plan immediately to avoid flicker
  useEffect(() => {
    let cancelled = false;
    if (pendingSave.current?.weekKey && pendingSave.current.weekKey !== weekKey) {
      void flushPendingSave();
    }
    isUserEdit.current = false;
    setLoading(true);
    setPlan(buildInitialPlan());
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
    }

    supabase
      .from("meal_plan")
      .select("plan")
      .eq("week_key", envWeekKey(weekKey))
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Error loading meal plan:", error);
        } else if (data?.plan && Array.isArray(data.plan) && (data.plan as unknown[]).length > 0) {
          const raw = data.plan as unknown as DayPlan[];
          const migrated = raw.map((day) => ({
            ...day,
            isDelivery: day.isDelivery ?? false,
            lunchOverridden: (day.lunchOverridden ?? false) && day.lunch != null,
            lunchHidden: day.lunchHidden ?? false,
            babyDinnerOverridden: (day.babyDinnerOverridden ?? false) && day.babyDinner != null,
            babyDinnerHidden: day.babyDinnerHidden ?? false,
            babyLunchOverridden: (day.babyLunchOverridden ?? false) && day.babyLunch != null,
            babyLunchHidden: day.babyLunchHidden ?? false,
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
          isUserEdit.current = false;
          setPlan(migrated);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [weekKey]);

  // Real-time subscription — when a remote change arrives, mark it as non-user so we don't re-save
  useEffect(() => {
    const channel = supabase
      .channel(`meal_plan_${envWeekKey(weekKey)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meal_plan",
          filter: `week_key=eq.${envWeekKey(weekKey)}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const newPlan = (payload.new as { plan: DayPlan[] }).plan;
            if (newPlan) {
              isUserEdit.current = false;
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

  // Save plan to DB whenever it changes due to a user action
  useEffect(() => {
    if (loading) return;
    if (!isUserEdit.current) return;
    isUserEdit.current = false;
    pendingSave.current = { weekKey, plan };

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      await flushPendingSave();
    }, 600);
  }, [plan, loading, weekKey, flushPendingSave]);

  useEffect(() => {
    const handlePageHide = () => {
      void flushPendingSave({ keepalive: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void flushPendingSave({ keepalive: true });
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [flushPendingSave]);

  const planWithLunch: DayPlan[] = plan.map((dayPlan, idx) => {
    const prevDay = idx === 0 ? null : plan[idx - 1];
    const prevDinner = prevDay?.dinner ?? null;
    const isPrevDelivery = prevDay?.isDelivery ?? false;
    const isPrevBabySafe = prevDinner?.babySafety !== "unsafe";

    // For delivery nights, treat dinner as the DELIVERY_DINNER sentinel
    const effectiveDinner = dayPlan.isDelivery ? DELIVERY_DINNER : dayPlan.dinner;
    const effectivePrevDinner = isPrevDelivery ? DELIVERY_LEFTOVERS : prevDinner;
    const effectivePrevSide = isPrevDelivery ? null : (prevDay?.dinnerSide ?? null);
    const effectivePrevNote = isPrevDelivery ? "" : (prevDay?.dinnerNote ?? "");

    let adultLunch: Pick<DayPlan, "lunch" | "lunchSide" | "lunchNote">;
    if (dayPlan.lunchOverridden) {
      adultLunch = { lunch: dayPlan.lunch, lunchSide: dayPlan.lunchSide, lunchNote: dayPlan.lunchNote };
    } else if (dayPlan.lunchHidden) {
      adultLunch = { lunch: null, lunchSide: null, lunchNote: "" };
    } else {
      adultLunch = {
        lunch: effectivePrevDinner ?? null,
        lunchSide: effectivePrevDinner ? effectivePrevSide : null,
        lunchNote: effectivePrevDinner ? effectivePrevNote : "",
      };
    }

    let babyDinnerSuggested: Pick<DayPlan, "babyDinner" | "babyDinnerSide" | "babyDinnerNote">;
    if (dayPlan.babyDinnerOverridden) {
      babyDinnerSuggested = { babyDinner: dayPlan.babyDinner, babyDinnerSide: dayPlan.babyDinnerSide, babyDinnerNote: dayPlan.babyDinnerNote };
    } else if (dayPlan.babyDinnerHidden) {
      babyDinnerSuggested = { babyDinner: null, babyDinnerSide: null, babyDinnerNote: "" };
    } else {
      // Don't suggest delivery leftovers for baby — skip if delivery
      const babyPrev = (prevDinner && !isPrevDelivery && isPrevBabySafe) ? prevDinner : null;
      babyDinnerSuggested = {
        babyDinner: babyPrev,
        babyDinnerSide: babyPrev ? (prevDay?.dinnerSide ?? null) : null,
        babyDinnerNote: babyPrev ? (prevDay?.dinnerNote ?? "") : "",
      };
    }

    let babyLunchSuggested: Pick<DayPlan, "babyLunch" | "babyLunchSide" | "babyLunchNote">;
    if (dayPlan.babyLunchOverridden) {
      babyLunchSuggested = { babyLunch: dayPlan.babyLunch, babyLunchSide: dayPlan.babyLunchSide, babyLunchNote: dayPlan.babyLunchNote };
    } else if (dayPlan.babyLunchHidden) {
      babyLunchSuggested = { babyLunch: null, babyLunchSide: null, babyLunchNote: "" };
    } else {
      const babyPrev = (prevDinner && !isPrevDelivery && isPrevBabySafe) ? prevDinner : null;
      babyLunchSuggested = {
        babyLunch: babyPrev,
        babyLunchSide: babyPrev ? (prevDay?.dinnerSide ?? null) : null,
        babyLunchNote: babyPrev ? (prevDay?.dinnerNote ?? "") : "",
      };
    }

    return { ...dayPlan, dinner: effectiveDinner, ...adultLunch, ...babyDinnerSuggested, ...babyLunchSuggested };
  });

  // Mark plan change as user-initiated so the save effect picks it up
  const update = (dayIndex: number, patch: Partial<DayPlan>) => {
    isUserEdit.current = true;
    setPlan((prev) => prev.map((d, i) => (i === dayIndex ? { ...d, ...patch } : d)));
  };

  const setDinner = (i: number, meal: Meal | null) => update(i, { dinner: meal });
  const setDinnerSide = (i: number, meal: Meal | null) => update(i, { dinnerSide: meal });
  const setDinnerNote = (i: number, note: string) => update(i, { dinnerNote: note });
  const toggleDelivery = (i: number) => {
    isUserEdit.current = true;
    setPlan((prev) => prev.map((d, idx) =>
      idx === i ? { ...d, isDelivery: !d.isDelivery, dinner: !d.isDelivery ? null : d.dinner, dinnerSide: !d.isDelivery ? null : d.dinnerSide } : d
    ));
  };
  const setLunch = (i: number, meal: Meal | null) => update(i, { lunch: meal, lunchOverridden: true, lunchHidden: false });
  const setLunchSide = (i: number, meal: Meal | null) => update(i, { lunchSide: meal });
  const setLunchNote = (i: number, note: string) => update(i, { lunchNote: note });
  const hideLunch = (i: number) => update(i, { lunchHidden: true });
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
  const resetPlan = () => { isUserEdit.current = true; setPlan(buildInitialPlan()); };

  return {
    plan: planWithLunch,
    loading,
    setDinner, setDinnerSide, setDinnerNote, toggleDelivery,
    setLunch, setLunchSide, setLunchNote, hideLunch, resetLunch,
    setBabyDinner, setBabyDinnerSide, setBabyDinnerNote, hideBabyDinner, resetBabyDinner,
    setBabyLunch, setBabyLunchSide, setBabyLunchNote, hideBabyLunch, resetBabyLunch,
    setNotes,
    resetPlan,
  };
}
