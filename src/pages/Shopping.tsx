import { useEffect, useMemo, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CollapsibleGroup } from "@/components/CollapsibleGroup";
import { DayPlan } from "@/hooks/useMealPlan";
import { useMeals } from "@/hooks/useMeals";
import { useIngredients } from "@/hooks/useIngredients";
import { usePantry, pantryHasName } from "@/hooks/usePantry";
import { supabase } from "@/integrations/supabase/client";
import { Meal, DELIVERY_DINNER } from "@/data/meals";
import { isIngredient, SENTINEL_MEAL_IDS as SENTINEL_IDS, ingredientSlug } from "@/data/food";
import { parseTag, categoryOf } from "@/data/foodTaxonomy";
import { currentWeekKey, todayDayIndex, isStageEnv, weekKeyLabel } from "@/lib/env";
import { ClipboardCopy, RotateCcw, CheckCheck, Warehouse } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ShoppingIngredient {
  id: string;
  name: string;
  emoji: string;
  category: string;
  sources: string[];
}

const STORAGE_KEY = "shopping_list_v2";

interface StoredHave {
  weekKey: string;
  have: Record<string, boolean>; // key = ingredient id
}

function slotFoods(d: DayPlan): [string, Meal | null][] {
  return [
    ["Desayuno", d.breakfast],
    ...(d.breakfastExtras ?? []).map((m) => ["Desayuno", m] as [string, Meal]),
    ["Almuerzo", d.lunch],
    ["Almuerzo", d.lunchSide],
    ...(d.lunchExtras ?? []).map((m) => ["Almuerzo", m] as [string, Meal]),
    ["Almuerzo Nico", d.babyLunch],
    ["Almuerzo Nico", d.babyLunchSide],
    ...(d.babyLunchExtras ?? []).map((m) => ["Almuerzo Nico", m] as [string, Meal]),
    ["Merienda", d.snack],
    ...(d.snackExtras ?? []).map((m) => ["Merienda", m] as [string, Meal]),
    ["Cena", d.dinner],
    ["Cena", d.dinnerSide],
    ...(d.dinnerExtras ?? []).map((m) => ["Cena", m] as [string, Meal]),
    ["Cena Nico", d.babyDinner],
    ["Cena Nico", d.babyDinnerSide],
    ...(d.babyDinnerExtras ?? []).map((m) => ["Cena Nico", m] as [string, Meal]),
  ];
}

const arr = (v: unknown): Meal[] => (Array.isArray(v) ? (v as Meal[]) : []);

/**
 * Normaliza un día crudo de `meal_plan` a los campos que usa la lista del súper.
 * Los almuerzos/cenas heredados (no overridden) se guardan null: sus ingredientes
 * ya vienen de la cena original, así que no hace falta contarlos aparte.
 */
function normalizeStoredDay(day: DayPlan & { isDelivery?: boolean }): DayPlan {
  const wasDelivery = day.isDelivery ?? false;
  const dinner = wasDelivery && !day.dinner ? DELIVERY_DINNER : (day.dinner ?? null);
  const lunchOn = !!day.lunchOverridden && day.lunch != null;
  const babyLunchOn = !!day.babyLunchOverridden && day.babyLunch != null;
  const babyDinnerOn = !!day.babyDinnerOverridden && day.babyDinner != null;
  return {
    ...day,
    dinner,
    dinnerSide: day.dinnerSide ?? null,
    dinnerExtras: arr(day.dinnerExtras),
    lunch: lunchOn ? day.lunch : null,
    lunchSide: lunchOn ? (day.lunchSide ?? null) : null,
    lunchExtras: lunchOn ? arr(day.lunchExtras) : [],
    babyLunch: babyLunchOn ? day.babyLunch : null,
    babyLunchSide: babyLunchOn ? (day.babyLunchSide ?? null) : null,
    babyLunchExtras: babyLunchOn ? arr(day.babyLunchExtras) : [],
    babyDinner: babyDinnerOn ? day.babyDinner : null,
    babyDinnerSide: babyDinnerOn ? (day.babyDinnerSide ?? null) : null,
    babyDinnerExtras: babyDinnerOn ? arr(day.babyDinnerExtras) : [],
    breakfast: typeof day.breakfast === "object" ? (day.breakfast ?? null) : null,
    breakfastExtras: arr(day.breakfastExtras),
    snack: typeof day.snack === "object" ? (day.snack ?? null) : null,
    snackExtras: arr(day.snackExtras),
  } as DayPlan;
}

interface WeekDays {
  weekKey: string;
  isCurrent: boolean;
  days: DayPlan[];
}

export default function Shopping() {
  const weekKey = currentWeekKey();
  const { meals: catalog } = useMeals();
  const { ingredients } = useIngredients();
  const { items: pantryItems } = usePantry();
  const todayIdx = todayDayIndex(weekKey);
  const fromIdx = todayIdx === -1 ? 0 : todayIdx;

  // Todas las semanas planificadas desde la actual en adelante (no solo esta).
  const [weeks, setWeeks] = useState<WeekDays[]>([]);
  useEffect(() => {
    let cancelled = false;
    const prefix = isStageEnv() ? "stage_" : "prod_";
    supabase
      .from("meal_plan")
      .select("plan, week_key")
      .like("week_key", `${prefix}%`)
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const out: WeekDays[] = [];
        for (const row of data) {
          const iso = (row.week_key as string).slice(prefix.length);
          // Solo esta semana y las futuras (comparación lexicográfica de ISO week keys).
          if (iso < weekKey) continue;
          const raw = row.plan as unknown as (DayPlan & { isDelivery?: boolean })[];
          if (!Array.isArray(raw) || raw.length === 0) continue;
          out.push({ weekKey: iso, isCurrent: iso === weekKey, days: raw.map(normalizeStoredDay) });
        }
        out.sort((a, b) => a.weekKey.localeCompare(b.weekKey));
        setWeeks(out);
      });
    return () => { cancelled = true; };
  }, [weekKey]);

  const [have, setHave] = useState<Record<string, boolean>>({});

  // Load saved "ya tengo" marks
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredHave;
      if (parsed.weekKey === weekKey) setHave(parsed.have ?? {});
    } catch { /* estado corrupto: se arranca de cero */ }
  }, [weekKey]);

  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ weekKey, have } satisfies StoredHave));
  }, [have, weekKey]);

  const catalogById = useMemo(() => new Map(catalog.map((m) => [m.id, m])), [catalog]);
  const ingredientById = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);

  /** Lista determinística: unión de ingredientes de las comidas planificadas desde hoy. */
  const { list, mealCount } = useMemo(() => {
    const acc = new Map<string, ShoppingIngredient>();
    let count = 0;

    const addIngredientEntry = (id: string, fallbackName: string, fallbackEmoji: string, source: string) => {
      const ing = ingredientById.get(id);
      const existing = acc.get(id);
      if (existing) {
        if (!existing.sources.includes(source)) existing.sources.push(source);
        return;
      }
      const tag = ing?.tags?.[0] ?? null;
      const cat = tag ? parseTag(tag)?.category ?? "Otros" : "Otros";
      acc.set(id, {
        id,
        name: ing?.name ?? fallbackName,
        emoji: ing?.emoji ?? fallbackEmoji,
        category: cat,
        sources: [source],
      });
    };

    for (const wk of weeks) {
      // La semana actual arranca hoy; las futuras, día 0.
      const start = wk.isCurrent ? fromIdx : 0;
      const wkTag = wk.isCurrent ? "" : ` (${weekKeyLabel(wk.weekKey, weekKey)})`;
      for (let i = start; i < wk.days.length; i++) {
        const d = wk.days[i];
        for (const [slot, food] of slotFoods(d)) {
          if (!food || SENTINEL_IDS.has(food.id)) continue;
          count++;
          const source = `${d.day}${wkTag} · ${slot}`;

          // Ingrediente suelto en el slot
          if (isIngredient(food)) {
            addIngredientEntry(food.id, food.name, food.emoji, source);
            continue;
          }

          // Comida: expandir por catálogo (el snapshot puede ser viejo)
          const catalogMeal = catalogById.get(food.id);
          const ids = catalogMeal?.ingredientIds ?? [];
          // Comida borrada que fue convertida a ingrediente: resolver por nombre
          const convertedIngredient = !catalogMeal ? ingredientById.get(ingredientSlug(food.name)) : undefined;
          if (ids.length > 0) {
            for (const iid of ids) addIngredientEntry(iid, iid, "🛒", `${d.day}${wkTag} · ${food.name}`);
          } else if (convertedIngredient) {
            addIngredientEntry(convertedIngredient.id, food.name, food.emoji, source);
          }
        }
      }
    }

    return {
      list: Array.from(acc.values()),
      mealCount: count,
    };
  }, [weeks, fromIdx, weekKey, catalogById, ingredientById]);

  const grouped = useMemo(() => {
    const map = new Map<string, ShoppingIngredient[]>();
    for (const it of list) {
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.name.localeCompare(b.name));
    return Array.from(map.entries());
  }, [list]);

  const isHave = (it: ShoppingIngredient) => have[it.id] ?? pantryHasName(pantryItems, it.name);

  const toggleHave = (it: ShoppingIngredient) => {
    setHave((prev) => ({ ...prev, [it.id]: !isHave(it) }));
  };

  const markAllHave = (items: ShoppingIngredient[], value: boolean) => {
    setHave((prev) => {
      const next = { ...prev };
      for (const it of items) next[it.id] = value;
      return next;
    });
  };

  const toBuy = list.filter((it) => !isHave(it));
  const haveCount = list.length - toBuy.length;
  const allDone = list.length > 0 && toBuy.length === 0;

  const copyList = () => {
    const text = toBuy
      .map((it) => `• ${it.emoji} ${it.name}`.trim())
      .join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Lista copiada al portapapeles" });
  };

  const reset = () => {
    setHave({});
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="px-4 sm:px-8 py-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">
          Lista de supermercado
        </h1>
        <p className="text-sm text-muted-foreground mb-5">
          Ingredientes de todas las comidas planificadas desde hoy en adelante. Tachá lo que ya tenés.
        </p>

        <div className="rounded-xl border bg-card shadow-sm p-4 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{mealCount}</span> comida{mealCount === 1 ? "" : "s"} planificada{mealCount === 1 ? "" : "s"} ·{" "}
            <span className="font-semibold text-foreground">{list.length}</span> ingrediente{list.length === 1 ? "" : "s"} distintos
          </p>
          {Object.keys(have).length > 0 && (
            <Button size="sm" variant="ghost" onClick={reset} title="Desmarcar todo">
              <RotateCcw size={14} className="mr-1.5" /> Reiniciar marcas
            </Button>
          )}
        </div>

        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10 border border-dashed border-border rounded-lg">
            No hay comidas planificadas a futuro.
          </p>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{haveCount}</span>/{list.length} ya tengo
                {allDone && " · ¡Listo!"}
              </span>
              <Button size="sm" variant="ghost" onClick={copyList} disabled={toBuy.length === 0}>
                <ClipboardCopy size={14} className="mr-1.5" /> Copiar faltantes
              </Button>
            </div>

            <div className="space-y-4">
              {grouped.map(([cat, items]) => {
                const meta = categoryOf(cat);
                const catAllHave = items.every(isHave);
                return (
                  <div key={cat} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    <CollapsibleGroup
                      id={`shopping:${cat}`}
                      count={items.length}
                      rowClassName="px-3 py-2 bg-muted/40"
                      headerClassName="text-xs font-semibold text-foreground"
                      title={`${meta?.emoji ?? "🛒"} ${meta?.label ?? cat}`}
                      headerRight={
                        <button
                          onClick={() => markAllHave(items, !catAllHave)}
                          className="text-[10px] px-2 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium shrink-0"
                        >
                          {catAllHave ? "Desmarcar todo" : "Ya tengo todo"}
                        </button>
                      }
                    >
                    <ul className="divide-y divide-border">
                      {items.map((it) => {
                        const got = isHave(it);
                        const inPantry = pantryHasName(pantryItems, it.name);
                        return (
                          <li
                            key={it.id}
                            className={cn(
                              "flex items-start gap-3 px-3 py-2 text-sm transition-colors",
                              got && "opacity-50 line-through"
                            )}
                          >
                            <Checkbox
                              checked={got}
                              onCheckedChange={() => toggleHave(it)}
                              aria-label="Ya tengo"
                              className="mt-0.5"
                            />
                            <span className="text-lg shrink-0">{it.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {it.name}
                                {inPantry && (
                                  <span className="ml-2 inline-flex items-center gap-1 align-middle text-[10px] font-medium text-primary bg-primary/10 rounded-full px-1.5 py-0.5 no-underline">
                                    <Warehouse size={10} /> Don Bacilio
                                  </span>
                                )}
                              </p>
                              {it.sources.length > 0 && (
                                <p className="text-[11px] text-muted-foreground/80 mt-0.5 italic">
                                  {it.sources.join(" · ")}
                                </p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    </CollapsibleGroup>
                  </div>
                );
              })}
            </div>

            {allDone && (
              <div className="mt-6 rounded-xl border bg-card shadow-sm p-6 text-center text-sm text-muted-foreground">
                <CheckCheck size={20} className="mx-auto mb-2 text-primary" />
                ¡Ya tenés todo! No hace falta ir al super 🎉
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
