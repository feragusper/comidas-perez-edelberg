import { useEffect, useMemo, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useMealPlan } from "@/hooks/useMealPlan";
import { usePantry, pantryHasName } from "@/hooks/usePantry";
import { currentWeekKey, todayDayIndex } from "@/lib/env";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Sparkles, Loader2, ClipboardCopy, RotateCcw, CheckCheck, Warehouse } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ShoppingItem {
  name: string;
  quantity: string;
  category: string;
  emoji?: string;
  sources?: string[];
}

const STORAGE_KEY = "shopping_list_v1";

interface StoredList {
  weekKey: string;
  items: ShoppingItem[];
  have: Record<string, boolean>; // key = `${category}|${name}`
}

const itemKey = (it: ShoppingItem) => `${it.category}|${it.name}`;

export default function Shopping() {
  const weekKey = currentWeekKey();
  const { plan } = useMealPlan(weekKey);
  const { items: pantryItems } = usePantry();
  const todayIdx = todayDayIndex(weekKey);
  const fromIdx = todayIdx === -1 ? 0 : todayIdx;

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [have, setHave] = useState<Record<string, boolean>>({});

  // Load saved
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredList;
      if (parsed.weekKey === weekKey) {
        setItems(parsed.items ?? []);
        setHave(parsed.have ?? {});
      }
    } catch {}
  }, [weekKey]);

  // Persist
  useEffect(() => {
    if (items.length === 0) return;
    const payload: StoredList = { weekKey, items, have };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [items, have, weekKey]);

  const upcomingMeals = useMemo(() => {
    const out: { day: string; slot: string; name: string; emoji?: string }[] = [];
    for (let i = fromIdx; i < plan.length; i++) {
      const d = plan[i];
      const slots: Array<[string, any]> = [
        ["Desayuno", d.breakfast],
        ...((d.breakfastExtras ?? []).map((m) => ["Desayuno", m] as [string, any])),
        ["Almuerzo", d.lunch],
        ["Almuerzo guarnición", d.lunchSide],
        ...((d.lunchExtras ?? []).map((m) => ["Almuerzo", m] as [string, any])),
        ["Almuerzo Nico", d.babyLunch],
        ...((d.babyLunchExtras ?? []).map((m) => ["Almuerzo Nico", m] as [string, any])),
        ["Merienda", d.snack],
        ...((d.snackExtras ?? []).map((m) => ["Merienda", m] as [string, any])),
        ["Cena", d.dinner],
        ["Cena guarnición", d.dinnerSide],
        ...((d.dinnerExtras ?? []).map((m) => ["Cena", m] as [string, any])),
        ["Cena Nico", d.babyDinner],
        ...((d.babyDinnerExtras ?? []).map((m) => ["Cena Nico", m] as [string, any])),
      ];
      for (const [slot, meal] of slots) {
        if (meal && meal.id !== "delivery" && meal.id !== "takeaway" && meal.id !== "restaurante" && meal.id !== "delivery-leftovers" && meal.id !== "takeaway-leftovers") {
          out.push({ day: d.day, slot, name: meal.name, emoji: meal.emoji });
        }
      }
    }
    return out;
  }, [plan, fromIdx]);

  const handleGenerate = async () => {
    if (upcomingMeals.length === 0) {
      toast({ title: "No hay comidas planificadas a futuro", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-shopping-list", {
        body: { meals: upcomingMeals },
      });
      if (error) throw error;
      if (data?.error) {
        toast({
          title: data.error === "RATE_LIMITED" ? "Demasiadas peticiones" : "Sin créditos disponibles",
          description: "Probá de nuevo en un rato.",
          variant: "destructive",
        });
        return;
      }
      const newItems: ShoppingItem[] = Array.isArray(data?.items) ? data.items : [];
      setItems(newItems);
      // Pre-mark as "ya tengo" whatever is already in Don Bacilio (la despensa)
      const preHave: Record<string, boolean> = {};
      for (const it of newItems) {
        if (pantryHasName(pantryItems, it.name)) preHave[itemKey(it)] = true;
      }
      setHave(preHave);
    } catch (e) {
      console.error(e);
      toast({ title: "Error generando lista", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleHave = (it: ShoppingItem) => {
    const k = itemKey(it);
    setHave((prev) => {
      const next = { ...prev };
      if (next[k]) delete next[k];
      else next[k] = true;
      return next;
    });
  };

  const markAllHave = (list: ShoppingItem[], value: boolean) => {
    setHave((prev) => {
      const next = { ...prev };
      for (const it of list) {
        const k = itemKey(it);
        if (value) next[k] = true;
        else delete next[k];
      }
      return next;
    });
  };

  const grouped = useMemo(() => {
    const map = new Map<string, ShoppingItem[]>();
    for (const it of items) {
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    }
    return Array.from(map.entries());
  }, [items]);

  const toBuy = items.filter((it) => !have[itemKey(it)]);
  const haveCount = items.filter((it) => have[itemKey(it)]).length;

  const copyList = () => {
    const text = toBuy
      .map((it) => `• ${it.emoji ?? ""} ${it.name} — ${it.quantity}`.trim())
      .join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Lista copiada al portapapeles" });
  };

  const reset = () => {
    setItems([]);
    setHave({});
    localStorage.removeItem(STORAGE_KEY);
  };

  const allDone = items.length > 0 && toBuy.length === 0;

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
          Generá la lista basada en las comidas planificadas a futuro y tachá lo que ya tenés.
        </p>

        <div className="rounded-xl border border-border bg-card p-4 mb-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{upcomingMeals.length}</span> comida{upcomingMeals.length === 1 ? "" : "s"} desde hoy hasta el final de la semana.
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleGenerate} disabled={loading || upcomingMeals.length === 0} className="flex-1">
            {loading ? (
              <><Loader2 size={16} className="animate-spin mr-2" /> Generando…</>
            ) : items.length > 0 ? (
              <><Sparkles size={16} className="mr-2" /> Regenerar lista</>
            ) : (
              <><Sparkles size={16} className="mr-2" /> Generar lista</>
            )}
          </Button>
          {items.length > 0 && (
            <Button variant="outline" onClick={reset} title="Reiniciar">
              <RotateCcw size={16} />
            </Button>
          )}
        </div>

        {items.length > 0 && (
          <>
            <div className="mt-6 mb-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{haveCount}</span>/{items.length} ya tengo
                {allDone && " · ¡Listo!"}
              </span>
              <Button size="sm" variant="ghost" onClick={copyList} disabled={toBuy.length === 0}>
                <ClipboardCopy size={14} className="mr-1.5" /> Copiar faltantes
              </Button>
            </div>

            <div className="space-y-4">
              {grouped.map(([cat, list]) => {
                const catAllHave = list.every((it) => have[itemKey(it)]);
                return (
                  <div key={cat} className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-3 py-2 bg-muted/40 flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">{cat}</span>
                      <button
                        onClick={() => markAllHave(list, !catAllHave)}
                        className="text-[10px] px-2 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
                      >
                        {catAllHave ? "Desmarcar todo" : "Ya tengo todo"}
                      </button>
                    </div>
                    <ul className="divide-y divide-border">
                      {list.map((it) => {
                        const k = itemKey(it);
                        const got = have[k];
                        const inPantry = pantryHasName(pantryItems, it.name);
                        return (
                          <li
                            key={k}
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
                            <span className="text-lg shrink-0">{it.emoji ?? "🛒"}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {it.name}
                                {inPantry && (
                                  <span className="ml-2 inline-flex items-center gap-1 align-middle text-[10px] font-medium text-primary bg-primary/10 rounded-full px-1.5 py-0.5 no-underline">
                                    <Warehouse size={10} /> Don Bacilio
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">{it.quantity}</p>

                              {it.sources && it.sources.length > 0 && (
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

            {allDone && (
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
