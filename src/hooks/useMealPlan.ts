import { useState, useEffect, useRef, useCallback } from "react";
import { Meal, DAYS, DELIVERY_DINNER, DELIVERY_LEFTOVERS, TAKEAWAY_LEFTOVERS } from "@/data/meals";
import { supabase } from "@/integrations/supabase/client";
import { envWeekKey } from "@/lib/env";

export interface DayPlan {
  day: string;
  dinner: Meal | null;
  dinnerSide: Meal | null;
  dinnerExtras: Meal[];
  dinnerNote: string;
  lunch: Meal | null;
  lunchSide: Meal | null;
  lunchExtras: Meal[];
  lunchNote: string;
  lunchOverridden: boolean;
  lunchHidden: boolean;
  babyDinner: Meal | null;
  babyDinnerSide: Meal | null;
  babyDinnerExtras: Meal[];
  babyDinnerNote: string;
  babyDinnerOverridden: boolean;
  babyDinnerHidden: boolean;
  babyLunch: Meal | null;
  babyLunchSide: Meal | null;
  babyLunchExtras: Meal[];
  babyLunchNote: string;
  babyLunchOverridden: boolean;
  babyLunchHidden: boolean;
  breakfast: Meal | null;
  breakfastExtras: Meal[];
  breakfastNote: string;
  snack: Meal | null;
  snackExtras: Meal[];
  snackNote: string;
  notes: string;
}

/** Max total foods per meal slot (main + side + extras counted together). */
export const MAX_MEAL_ITEMS = 5;

export type WeekKey = string;

/** Helper: is this meal the delivery sentinel? */
export function isDeliveryMeal(meal: Meal | null): boolean {
  return meal?.id === "delivery";
}

/** Helper: is this meal takeaway? */
export function isTakeawayMeal(meal: Meal | null): boolean {
  return meal?.id === "takeaway";
}

/** Helper: is this meal restaurant (eat out, no leftovers)? */
export function isRestaurantMeal(meal: Meal | null): boolean {
  return meal?.id === "restaurante";
}

/** Helper: any "eating out" meal — delivery, takeaway, or restaurant. */
export function isEatingOutMeal(meal: Meal | null): boolean {
  return isDeliveryMeal(meal) || isTakeawayMeal(meal) || isRestaurantMeal(meal);
}

/** Helper: meal that produces leftovers for next day's lunch. */
export function hasLeftovers(meal: Meal | null): boolean {
  return isDeliveryMeal(meal) || isTakeawayMeal(meal);
}

function serializePlan(plan: DayPlan[]) {
  return plan.map((day) => ({
    ...day,
    lunch: day.lunchOverridden ? day.lunch : null,
    lunchSide: day.lunchOverridden ? day.lunchSide : null,
    lunchExtras: day.lunchOverridden ? day.lunchExtras : [],
    lunchNote: day.lunchOverridden ? day.lunchNote : "",
    babyDinner: day.babyDinnerOverridden ? day.babyDinner : null,
    babyDinnerSide: day.babyDinnerOverridden ? day.babyDinnerSide : null,
    babyDinnerExtras: day.babyDinnerOverridden ? day.babyDinnerExtras : [],
    babyDinnerNote: day.babyDinnerOverridden ? day.babyDinnerNote : "",
    babyLunch: day.babyLunchOverridden ? day.babyLunch : null,
    babyLunchSide: day.babyLunchOverridden ? day.babyLunchSide : null,
    babyLunchExtras: day.babyLunchOverridden ? day.babyLunchExtras : [],
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
    dinner: null,
    dinnerSide: null,
    dinnerExtras: [],
    dinnerNote: "",
    lunch: null,
    lunchSide: null,
    lunchExtras: [],
    lunchNote: "",
    lunchOverridden: false,
    lunchHidden: false,
    babyDinner: null,
    babyDinnerSide: null,
    babyDinnerExtras: [],
    babyDinnerNote: "",
    babyDinnerOverridden: false,
    babyDinnerHidden: false,
    babyLunch: null,
    babyLunchSide: null,
    babyLunchExtras: [],
    babyLunchNote: "",
    babyLunchOverridden: false,
    babyLunchHidden: false,
    breakfast: null,
    breakfastExtras: [],
    breakfastNote: "",
    snack: null,
    snackExtras: [],
    snackNote: "",
    notes: "",
  }));
};

export function useMealPlan(weekKey: WeekKey) {
  const [plan, setPlan] = useState<DayPlan[]>(buildInitialPlan);
  const [loading, setLoading] = useState(true);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<{ weekKey: WeekKey; plan: DayPlan[] } | null>(null);
  const weekKeyRef = useRef(weekKey);
  weekKeyRef.current = weekKey;

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

  const scheduleSave = useCallback((updatedPlan: DayPlan[]) => {
    const wk = weekKeyRef.current;
    pendingSave.current = { weekKey: wk, plan: updatedPlan };
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      await flushPendingSave();
    }, 600);
  }, [flushPendingSave]);

  // Load initial data
  useEffect(() => {
    let cancelled = false;
    if (pendingSave.current?.weekKey && pendingSave.current.weekKey !== weekKey) {
      void flushPendingSave();
    }
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
          const raw = data.plan as unknown as (DayPlan & { isDelivery?: boolean })[];
          const migrated = raw.map((day) => {
            // Migration: convert old isDelivery flag to delivery meal
            const wasDelivery = day.isDelivery ?? false;
            const dinner = wasDelivery && !day.dinner ? DELIVERY_DINNER : day.dinner;
            const arr = (v: unknown): Meal[] => (Array.isArray(v) ? (v as Meal[]) : []);
            const lunchOn = (day.lunchOverridden && day.lunch != null);
            const babyDinnerOn = (day.babyDinnerOverridden && day.babyDinner != null);
            const babyLunchOn = (day.babyLunchOverridden && day.babyLunch != null);
            return {
              ...day,
              dinner,
              // Remove legacy field
              isDelivery: undefined,
              lunchOverridden: (day.lunchOverridden ?? false) && day.lunch != null,
              lunchHidden: day.lunchHidden ?? false,
              babyDinnerOverridden: (day.babyDinnerOverridden ?? false) && day.babyDinner != null,
              babyDinnerHidden: day.babyDinnerHidden ?? false,
              babyLunchOverridden: (day.babyLunchOverridden ?? false) && day.babyLunch != null,
              babyLunchHidden: day.babyLunchHidden ?? false,
              dinnerExtras: arr(day.dinnerExtras),
              lunch: lunchOn ? day.lunch : null,
              lunchSide: lunchOn ? day.lunchSide : null,
              lunchExtras: lunchOn ? arr(day.lunchExtras) : [],
              lunchNote: lunchOn ? day.lunchNote : "",
              babyDinner: babyDinnerOn ? day.babyDinner : null,
              babyDinnerSide: babyDinnerOn ? day.babyDinnerSide : null,
              babyDinnerExtras: babyDinnerOn ? arr(day.babyDinnerExtras) : [],
              babyDinnerNote: babyDinnerOn ? day.babyDinnerNote : "",
              babyLunch: babyLunchOn ? day.babyLunch : null,
              babyLunchSide: babyLunchOn ? day.babyLunchSide : null,
              babyLunchExtras: babyLunchOn ? arr(day.babyLunchExtras) : [],
              babyLunchNote: babyLunchOn ? day.babyLunchNote : "",
              // Migration: old string -> Meal|null. If non-empty string, drop (can't reconstruct meal).
              breakfast: typeof day.breakfast === "object" ? (day.breakfast ?? null) : null,
              breakfastExtras: arr(day.breakfastExtras),
              breakfastNote: typeof day.breakfastNote === "string" ? day.breakfastNote : "",
              snack: typeof day.snack === "object" ? (day.snack ?? null) : null,
              snackExtras: arr(day.snackExtras),
              snackNote: typeof day.snackNote === "string" ? day.snackNote : "",
            } as DayPlan;
          });
          setPlan(migrated);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [weekKey]);

  // Real-time subscription
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
    const isPrevDelivery = isDeliveryMeal(prevDinner);
    const isPrevTakeaway = isTakeawayMeal(prevDinner);
    const isPrevRestaurant = isRestaurantMeal(prevDinner);
    const prevHasLeftovers = isPrevDelivery || isPrevTakeaway;
    const isPrevBabySafe = prevDinner?.babySafety !== "unsafe";

    let effectivePrevDinner: Meal | null;
    let effectivePrevSide: Meal | null;
    let effectivePrevExtras: Meal[];
    let effectivePrevNote: string;
    if (isPrevDelivery) {
      effectivePrevDinner = DELIVERY_LEFTOVERS;
      effectivePrevSide = null;
      effectivePrevExtras = [];
      effectivePrevNote = "";
    } else if (isPrevTakeaway) {
      effectivePrevDinner = TAKEAWAY_LEFTOVERS;
      effectivePrevSide = null;
      effectivePrevExtras = [];
      effectivePrevNote = "";
    } else if (isPrevRestaurant) {
      // Restaurant doesn't produce leftovers — no inheritance
      effectivePrevDinner = null;
      effectivePrevSide = null;
      effectivePrevExtras = [];
      effectivePrevNote = "";
    } else {
      effectivePrevDinner = prevDinner;
      effectivePrevSide = prevDay?.dinnerSide ?? null;
      effectivePrevExtras = prevDay?.dinnerExtras ?? [];
      effectivePrevNote = prevDay?.dinnerNote ?? "";
    }

    let adultLunch: Pick<DayPlan, "lunch" | "lunchSide" | "lunchExtras" | "lunchNote">;
    if (dayPlan.lunchOverridden) {
      adultLunch = { lunch: dayPlan.lunch, lunchSide: dayPlan.lunchSide, lunchExtras: dayPlan.lunchExtras, lunchNote: dayPlan.lunchNote };
    } else if (dayPlan.lunchHidden) {
      adultLunch = { lunch: null, lunchSide: null, lunchExtras: [], lunchNote: "" };
    } else {
      adultLunch = {
        lunch: effectivePrevDinner ?? null,
        lunchSide: effectivePrevDinner ? effectivePrevSide : null,
        lunchExtras: effectivePrevDinner ? effectivePrevExtras : [],
        lunchNote: effectivePrevDinner ? effectivePrevNote : "",
      };
    }

    let babyDinnerSuggested: Pick<DayPlan, "babyDinner" | "babyDinnerSide" | "babyDinnerExtras" | "babyDinnerNote">;
    if (dayPlan.babyDinnerOverridden) {
      babyDinnerSuggested = { babyDinner: dayPlan.babyDinner, babyDinnerSide: dayPlan.babyDinnerSide, babyDinnerExtras: dayPlan.babyDinnerExtras, babyDinnerNote: dayPlan.babyDinnerNote };
    } else if (dayPlan.babyDinnerHidden) {
      babyDinnerSuggested = { babyDinner: null, babyDinnerSide: null, babyDinnerExtras: [], babyDinnerNote: "" };
    } else {
      const babyPrev = (prevDinner && !prevHasLeftovers && !isPrevRestaurant && isPrevBabySafe) ? prevDinner : null;
      babyDinnerSuggested = {
        babyDinner: babyPrev,
        babyDinnerSide: babyPrev ? (prevDay?.dinnerSide ?? null) : null,
        babyDinnerExtras: babyPrev ? (prevDay?.dinnerExtras ?? []) : [],
        babyDinnerNote: babyPrev ? (prevDay?.dinnerNote ?? "") : "",
      };
    }

    let babyLunchSuggested: Pick<DayPlan, "babyLunch" | "babyLunchSide" | "babyLunchExtras" | "babyLunchNote">;
    if (dayPlan.babyLunchOverridden) {
      babyLunchSuggested = { babyLunch: dayPlan.babyLunch, babyLunchSide: dayPlan.babyLunchSide, babyLunchExtras: dayPlan.babyLunchExtras, babyLunchNote: dayPlan.babyLunchNote };
    } else if (dayPlan.babyLunchHidden) {
      babyLunchSuggested = { babyLunch: null, babyLunchSide: null, babyLunchExtras: [], babyLunchNote: "" };
    } else {
      const babyPrev = (prevDinner && !prevHasLeftovers && !isPrevRestaurant && isPrevBabySafe) ? prevDinner : null;
      babyLunchSuggested = {
        babyLunch: babyPrev,
        babyLunchSide: babyPrev ? (prevDay?.dinnerSide ?? null) : null,
        babyLunchExtras: babyPrev ? (prevDay?.dinnerExtras ?? []) : [],
        babyLunchNote: babyPrev ? (prevDay?.dinnerNote ?? "") : "",
      };
    }

    return { ...dayPlan, ...adultLunch, ...babyDinnerSuggested, ...babyLunchSuggested };
  });

  // Keep latest computed plan (with inherited values) accessible to setters
  const planWithLunchRef = useRef(planWithLunch);
  planWithLunchRef.current = planWithLunch;

  const update = (dayIndex: number, patch: Partial<DayPlan>) => {
    setPlan((prev) => {
      const next = prev.map((d, i) => (i === dayIndex ? { ...d, ...patch } : d));
      scheduleSave(next);
      return next;
    });
  };

  /**
   * Materialize an inherited (non-overridden) lunch/dinner slot before editing
   * its side or note, so the change actually persists instead of being discarded
   * by the recompute step.
   */
  const materialize = (
    i: number,
    overriddenKey: keyof DayPlan,
    mealKey: keyof DayPlan,
    sideKey: keyof DayPlan,
    noteKey: keyof DayPlan,
    extrasKey: keyof DayPlan,
    patch: Partial<DayPlan>
  ): Partial<DayPlan> => {
    const raw = plan[i];
    if (raw[overriddenKey]) return patch;
    const effective = planWithLunchRef.current[i];
    return {
      [overriddenKey]: true,
      [mealKey]: effective[mealKey],
      [sideKey]: effective[sideKey],
      [noteKey]: effective[noteKey],
      [extrasKey]: effective[extrasKey],
      ...patch,
    } as Partial<DayPlan>;
  };

  const setDinner = (i: number, meal: Meal | null) => {
    // When setting eating-out meal or clearing, drop side + extras
    if (!meal || isEatingOutMeal(meal)) {
      update(i, { dinner: meal, dinnerSide: null, dinnerExtras: [] });
    } else {
      update(i, { dinner: meal });
    }
  };
  const setDinnerSide = (i: number, meal: Meal | null) => update(i, { dinnerSide: meal });
  const setDinnerNote = (i: number, note: string) => update(i, { dinnerNote: note });
  const setLunch = (i: number, meal: Meal | null) => update(i, { lunch: meal, ...(meal ? {} : { lunchExtras: [] }), lunchOverridden: true, lunchHidden: false });
  const setLunchSide = (i: number, meal: Meal | null) =>
    update(i, materialize(i, "lunchOverridden", "lunch", "lunchSide", "lunchNote", "lunchExtras", { lunchSide: meal }));
  const setLunchNote = (i: number, note: string) =>
    update(i, materialize(i, "lunchOverridden", "lunch", "lunchSide", "lunchNote", "lunchExtras", { lunchNote: note }));
  const hideLunch = (i: number) => update(i, { lunchHidden: true });
  const resetLunch = (i: number) => update(i, { lunch: null, lunchSide: null, lunchExtras: [], lunchOverridden: false, lunchHidden: false, lunchNote: "" });
  const setBabyDinner = (i: number, meal: Meal | null) => update(i, { babyDinner: meal, ...(meal ? {} : { babyDinnerExtras: [] }), babyDinnerOverridden: true, babyDinnerHidden: false });
  const setBabyDinnerSide = (i: number, meal: Meal | null) =>
    update(i, materialize(i, "babyDinnerOverridden", "babyDinner", "babyDinnerSide", "babyDinnerNote", "babyDinnerExtras", { babyDinnerSide: meal }));
  const setBabyDinnerNote = (i: number, note: string) =>
    update(i, materialize(i, "babyDinnerOverridden", "babyDinner", "babyDinnerSide", "babyDinnerNote", "babyDinnerExtras", { babyDinnerNote: note }));
  const hideBabyDinner = (i: number) => update(i, { babyDinnerHidden: true });
  const resetBabyDinner = (i: number) => update(i, { babyDinner: null, babyDinnerSide: null, babyDinnerExtras: [], babyDinnerNote: "", babyDinnerOverridden: false, babyDinnerHidden: false });
  const setBabyLunch = (i: number, meal: Meal | null) => update(i, { babyLunch: meal, ...(meal ? {} : { babyLunchExtras: [] }), babyLunchOverridden: true, babyLunchHidden: false });
  const setBabyLunchSide = (i: number, meal: Meal | null) =>
    update(i, materialize(i, "babyLunchOverridden", "babyLunch", "babyLunchSide", "babyLunchNote", "babyLunchExtras", { babyLunchSide: meal }));
  const setBabyLunchNote = (i: number, note: string) =>
    update(i, materialize(i, "babyLunchOverridden", "babyLunch", "babyLunchSide", "babyLunchNote", "babyLunchExtras", { babyLunchNote: note }));
  const hideBabyLunch = (i: number) => update(i, { babyLunchHidden: true });
  const resetBabyLunch = (i: number) => update(i, { babyLunch: null, babyLunchSide: null, babyLunchExtras: [], babyLunchNote: "", babyLunchOverridden: false, babyLunchHidden: false });
  const setNotes = (i: number, notes: string) => update(i, { notes });
  const setBreakfast = (i: number, meal: Meal | null) => update(i, { breakfast: meal, ...(meal ? {} : { breakfastExtras: [] }) });
  const setBreakfastNote = (i: number, note: string) => update(i, { breakfastNote: note });
  const setSnack = (i: number, meal: Meal | null) => update(i, { snack: meal, ...(meal ? {} : { snackExtras: [] }) });
  const setSnackNote = (i: number, note: string) => update(i, { snackNote: note });

  type MealSlot = "dinner" | "lunch" | "babyDinner" | "babyLunch" | "breakfast" | "snack";

  const slotFields = (slot: MealSlot) => {
    if (slot === "dinner") return { meal: "dinner", side: "dinnerSide", extras: "dinnerExtras", note: "dinnerNote", overridden: null, hidden: null } as const;
    if (slot === "lunch") return { meal: "lunch", side: "lunchSide", extras: "lunchExtras", note: "lunchNote", overridden: "lunchOverridden", hidden: "lunchHidden" } as const;
    if (slot === "babyDinner") return { meal: "babyDinner", side: "babyDinnerSide", extras: "babyDinnerExtras", note: "babyDinnerNote", overridden: "babyDinnerOverridden", hidden: "babyDinnerHidden" } as const;
    if (slot === "babyLunch") return { meal: "babyLunch", side: "babyLunchSide", extras: "babyLunchExtras", note: "babyLunchNote", overridden: "babyLunchOverridden", hidden: "babyLunchHidden" } as const;
    if (slot === "breakfast") return { meal: "breakfast", side: null, extras: "breakfastExtras", note: "breakfastNote", overridden: null, hidden: null } as const;
    return { meal: "snack", side: null, extras: "snackExtras", note: "snackNote", overridden: null, hidden: null } as const;
  };

  const extrasKeyFor = (slot: MealSlot) => slotFields(slot).extras as keyof DayPlan;

  /** Update the extras array for a slot, materializing inherited lunch/baby slots. */
  const updateExtras = (i: number, slot: MealSlot, newExtras: Meal[]) => {
    const f = slotFields(slot);
    const ek = f.extras as keyof DayPlan;
    if (f.overridden && f.side) {
      update(i, materialize(i, f.overridden, f.meal, f.side, f.note, ek, { [ek]: newExtras } as Partial<DayPlan>));
    } else {
      update(i, { [ek]: newExtras } as Partial<DayPlan>);
    }
  };

  const currentExtras = (i: number, slot: MealSlot): Meal[] => {
    const v = planWithLunchRef.current[i][extrasKeyFor(slot)];
    return Array.isArray(v) ? (v as Meal[]) : [];
  };

  const addExtra = (i: number, slot: MealSlot, meal: Meal) => {
    const cur = currentExtras(i, slot);
    const f = slotFields(slot);
    const base = 1 + (f.side ? 1 : 0); // main (+ side slot)
    if (base + cur.length >= MAX_MEAL_ITEMS) return;
    updateExtras(i, slot, [...cur, meal]);
  };
  const setExtraAt = (i: number, slot: MealSlot, idx: number, meal: Meal) => {
    const cur = [...currentExtras(i, slot)];
    if (idx < 0 || idx >= cur.length) return;
    cur[idx] = meal;
    updateExtras(i, slot, cur);
  };
  const removeExtraAt = (i: number, slot: MealSlot, idx: number) => {
    const cur = [...currentExtras(i, slot)];
    if (idx < 0 || idx >= cur.length) return;
    cur.splice(idx, 1);
    updateExtras(i, slot, cur);
  };

  const swapSlots = (srcDay: number, srcSlot: MealSlot, dstDay: number, dstSlot: MealSlot) => {
    setPlan((prev) => {
      const next = prev.map((d) => ({ ...d }));
      const sf = slotFields(srcSlot);
      const df = slotFields(dstSlot);

      const srcMeal = next[srcDay][sf.meal];
      const srcSide = sf.side ? next[srcDay][sf.side] : null;
      const srcExtras = next[srcDay][sf.extras];
      const srcNote = next[srcDay][sf.note];
      const dstMeal = next[dstDay][df.meal];
      const dstSide = df.side ? next[dstDay][df.side] : null;
      const dstExtras = next[dstDay][df.extras];
      const dstNote = next[dstDay][df.note];

      (next[dstDay] as any)[df.meal] = srcMeal;
      if (df.side) (next[dstDay] as any)[df.side] = srcSide;
      (next[dstDay] as any)[df.extras] = srcExtras;
      (next[dstDay] as any)[df.note] = srcNote;
      if (df.overridden) (next[dstDay] as any)[df.overridden] = srcMeal != null;
      if (df.hidden) (next[dstDay] as any)[df.hidden] = false;

      (next[srcDay] as any)[sf.meal] = dstMeal;
      if (sf.side) (next[srcDay] as any)[sf.side] = dstSide;
      (next[srcDay] as any)[sf.extras] = dstExtras;
      (next[srcDay] as any)[sf.note] = dstNote;
      if (sf.overridden) (next[srcDay] as any)[sf.overridden] = dstMeal != null;
      if (sf.hidden) (next[srcDay] as any)[sf.hidden] = false;


      scheduleSave(next);
      return next;
    });
  };

  const resetPlan = () => {
    const initial = buildInitialPlan();
    setPlan(initial);
    scheduleSave(initial);
  };

  /**
   * Fill the whole week at once from an autocomplete result.
   * Only fills EMPTY slots (keeps anything the user already chose).
   * Lunch / baby slots are left to inherit automatically from dinner.
   */
  interface AutocompleteEntry {
    dinner: Meal | null;
    dinnerSide: Meal | null;
    breakfast: Meal | null;
    snack: Meal | null;
  }
  const autocompleteWeek = (entries: (AutocompleteEntry | null)[]) => {
    setPlan((prev) => {
      const next = prev.map((d, i) => {
        const e = entries[i];
        if (!e) return d;
        const patch: Partial<DayPlan> = {};
        if (d.dinner == null && e.dinner) {
          patch.dinner = e.dinner;
          patch.dinnerSide = isEatingOutMeal(e.dinner) ? null : e.dinnerSide;
        }
        if (d.breakfast == null && e.breakfast) patch.breakfast = e.breakfast;
        if (d.snack == null && e.snack) patch.snack = e.snack;
        return { ...d, ...patch };
      });
      scheduleSave(next);
      return next;
    });
  };

  return {
    plan: planWithLunch,
    loading,
    setDinner, setDinnerSide, setDinnerNote,
    setLunch, setLunchSide, setLunchNote, hideLunch, resetLunch,
    setBabyDinner, setBabyDinnerSide, setBabyDinnerNote, hideBabyDinner, resetBabyDinner,
    setBabyLunch, setBabyLunchSide, setBabyLunchNote, hideBabyLunch, resetBabyLunch,
    setBreakfast, setBreakfastNote, setSnack, setSnackNote,
    setNotes,
    addExtra, setExtraAt, removeExtraAt,
    swapSlots,
    resetPlan,
    autocompleteWeek,
  };
}
