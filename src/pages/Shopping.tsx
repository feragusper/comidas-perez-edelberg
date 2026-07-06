import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useMealPlan, DayPlan } from "@/hooks/useMealPlan";
import { useMeals } from "@/hooks/useMeals";
import { useIngredients } from "@/hooks/useIngredients";
import { usePantry, pantryHasName } from "@/hooks/usePantry";
import { Meal } from "@/data/meals";
import { isIngredient } from "@/data/food";
import { parseTag, categoryOf } from "@/data/foodTaxonomy";
import { currentWeekKey, todayDayIndex } from "@/lib/env";
import { ShoppingCart, ClipboardCopy, RotateCcw, CheckCheck, Warehouse, TriangleAlert } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/** Ids que nunca generan compras. */
const SENTINEL_IDS = new Set(["delivery", "takeaway", "restaurante", "delivery-sobras", "takeaway-sobras", "delivery-leftovers", "takeaway-leftovers"]);

interface ShoppingIngredient {
  id: string;
  name: string;
  emoji: string;
  category: string;
  sources: string[];
}

interface UnresolvedMeal {
  id: string;
  name: string;
  emoji: string;
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

export default function Shopping() {
  const weekKey = currentWeekKey();
  const { plan } = useMealPlan(weekKey);
  const { meals: catalog } = useMeals();
  const { ingredients } = useIngredients();
  const { items: pantryItems } = usePantry();
  const todayIdx = todayDayIndex(weekKey);
  const fromIdx = todayIdx === -1 ? 0 : todayIdx;

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
  const { list, unresolved, mealCount } = useMemo(() => {
    const acc = new Map<string, ShoppingIngredient>();
    const pending = new Map<string, UnresolvedMeal>();
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

    for (let i = fromIdx; i < plan.length; i++) {
      const d = plan[i];
      for (const [slot, food] of slotFoods(d)) {
        if (!food || SENTINEL_IDS.has(food.id)) continue;
        count++;
        const source = `${d.day} · ${slot}`;

        // Ingrediente suelto en el slot
        if (isIngredient(food)) {
          addIngredientEntry(food.id, food.name, food.emoji, source);
          continue;
        }

        // Comida: expandir por catálogo (el snapshot puede ser viejo)
        const catalogMeal = catalogById.get(food.id);
        const ids = catalogMeal?.ingredientIds ?? [];
        if (ids.length > 0) {
          for (const iid of ids) addIngredientEntry(iid, iid, "🛒", `${d.day} · ${food.name}`);
        } else {
          const existing = pending.get(food.id);
          if (existing) {
            if (!existing.sources.includes(source)) existing.sources.push(source);
          } else {
            pending.set(food.id, { id: food.id, name: food.name, emoji: food.emoji, sources: [source] });
          }
        }
      }
    }

    return {
      list: Array.from(acc.values()),
      unresolved: Array.from(pending.values()),
      mealCount: count,
    };
  }, [plan, fromIdx, catalogById, ingredientById]);

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
        <div className="flex items-center gap-2 mb-1">
          <ShoppingCart className="text-primary" size={22} />
          <h1 className="text-2xl font-bold text-foreground">
            Lista de supermercado
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Ingredientes de las comidas planificadas desde hoy hasta el domingo. Tachá lo que ya tenés.
        </p>

        <div className="rounded-xl border border-border bg-card p-4 mb-4 flex items-center justify-between gap-3 flex-wrap">
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

        {list.length === 0 && unresolved.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10 border border-dashed border-border rounded-xl">
            No hay comidas planificadas a futuro esta semana.
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
                  <div key={cat} className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-3 py-2 bg-muted/40 flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        {meta?.emoji ?? "🛒"} {meta?.label ?? cat}
                      </span>
                      <button
                        onClick={() => markAllHave(items, !catAllHave)}
                        className="text-[10px] px-2 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
                      >
                        {catAllHave ? "Desmarcar todo" : "Ya tengo todo"}
                      </button>
                    </div>
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
                  </div>
                );
              })}
            </div>

            {/* Comidas sin componentizar */}
            {unresolved.length > 0 && (
              <div className="mt-6 rounded-xl border border-warning/40 bg-warning/5 overflow-hidden">
                <div className="px-3 py-2 bg-warning/10 flex items-center gap-2">
                  <TriangleAlert size={14} className="text-warning" />
                  <span className="text-xs font-semibold text-foreground">Sin ingredientes cargados</span>
                  <Link to="/normalizar" className="ml-auto text-[11px] font-medium text-primary underline underline-offset-2">
                    Normalizar →
                  </Link>
                </div>
                <ul className="divide-y divide-border">
                  {unresolved.map((m) => (
                    <li key={m.id} className="flex items-start gap-3 px-3 py-2 text-sm">
                      <span className="text-lg shrink-0">{m.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground/80 mt-0.5 italic">{m.sources.join(" · ")}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {allDone && unresolved.length === 0 && (
              <div className="mt-6 rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
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
