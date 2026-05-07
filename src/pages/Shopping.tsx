import { useEffect, useMemo, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useMealPlan } from "@/hooks/useMealPlan";
import { currentWeekKey, todayDayIndex } from "@/lib/env";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Sparkles, Loader2, Check, ClipboardCopy, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ShoppingItem {
  name: string;
  quantity: string;
  category: string;
  emoji?: string;
}

type ItemState = "pending" | "have" | "buy";

const STORAGE_KEY = "shopping_list_v1";

interface StoredList {
  weekKey: string;
  items: ShoppingItem[];
  states: Record<string, ItemState>; // key = `${category}|${name}`
}

const itemKey = (it: ShoppingItem) => `${it.category}|${it.name}`;

export default function Shopping() {
  const weekKey = currentWeekKey();
  const { plan } = useMealPlan(weekKey);
  const todayIdx = todayDayIndex(weekKey);
  const fromIdx = todayIdx === -1 ? 0 : todayIdx;

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [states, setStates] = useState<Record<string, ItemState>>({});
  const [showResult, setShowResult] = useState(false);

  // Load saved
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredList;
      if (parsed.weekKey === weekKey) {
        setItems(parsed.items ?? []);
        setStates(parsed.states ?? {});
      }
    } catch {}
  }, [weekKey]);

  // Persist
  useEffect(() => {
    if (items.length === 0) return;
    const payload: StoredList = { weekKey, items, states };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [items, states, weekKey]);

  const upcomingMeals = useMemo(() => {
    const out: { day: string; slot: string; name: string; emoji?: string }[] = [];
    for (let i = fromIdx; i < plan.length; i++) {
      const d = plan[i];
      const slots: Array<[string, any]> = [
        ["Desayuno", d.breakfast],
        ["Almuerzo", d.lunch],
        ["Almuerzo guarnición", d.lunchSide],
        ["Almuerzo Nico", d.babyLunch],
        ["Merienda", d.snack],
        ["Cena", d.dinner],
        ["Cena guarnición", d.dinnerSide],
        ["Cena Nico", d.babyDinner],
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
    setShowResult(false);
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
      setStates({});
    } catch (e) {
      console.error(e);
      toast({ title: "Error generando lista", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const setState = (it: ShoppingItem, s: ItemState) => {
    setStates((prev) => {
      const k = itemKey(it);
      const next = { ...prev };
      if (next[k] === s) delete next[k];
      else next[k] = s;
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

  const toBuy = items.filter((it) => states[itemKey(it)] !== "have");
  const haveCount = items.filter((it) => states[itemKey(it)] === "have").length;
  const buyCount = items.filter((it) => states[itemKey(it)] === "buy").length;

  const copyList = () => {
    const text = toBuy
      .map((it) => `• ${it.emoji ?? ""} ${it.name} — ${it.quantity}`.trim())
      .join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Lista copiada al portapapeles" });
  };

  const reset = () => {
    setItems([]);
    setStates({});
    setShowResult(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="px-4 sm:px-8 py-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingCart className="text-primary" size={22} />
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>
            Lista de supermercado
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Generá la lista basada en las comidas planificadas a futuro y marcá lo que ya tenés.
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

        {items.length > 0 && !showResult && (
          <>
            <div className="mt-6 mb-3 flex items-center gap-3 text-xs">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{haveCount}</span>/{items.length} ya tengo
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{buyCount}</span> a comprar
              </span>
            </div>

            <div className="space-y-4">
              {grouped.map(([cat, list]) => (
                <div key={cat} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-3 py-2 bg-muted/40 text-xs font-semibold text-foreground">{cat}</div>
                  <ul className="divide-y divide-border">
                    {list.map((it) => {
                      const k = itemKey(it);
                      const st = states[k];
                      return (
                        <li
                          key={k}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                            st === "have" && "opacity-50 line-through",
                            st === "buy" && "bg-primary/5"
                          )}
                        >
                          <Checkbox
                            checked={st === "have"}
                            onCheckedChange={() => setState(it, "have")}
                            aria-label="Ya tengo"
                          />
                          <span className="text-lg shrink-0">{it.emoji ?? "🛒"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{it.name}</p>
                            <p className="text-xs text-muted-foreground">{it.quantity}</p>
                          </div>
                          <button
                            onClick={() => setState(it, "buy")}
                            className={cn(
                              "text-[10px] px-2 py-1 rounded-full border font-medium transition-colors shrink-0",
                              st === "buy"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                          >
                            comprar
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <Button onClick={() => setShowResult(true)} className="w-full mt-6">
              <Check size={16} className="mr-2" /> Ver lista final ({toBuy.length})
            </Button>
          </>
        )}

        {showResult && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>
                Lo que hay que comprar
              </h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyList}>
                  <ClipboardCopy size={14} className="mr-1.5" /> Copiar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowResult(false)}>
                  Volver
                </Button>
              </div>
            </div>

            {toBuy.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                ¡Ya tenés todo! 🎉
              </div>
            ) : (
              <div className="space-y-4">
                {Array.from(
                  toBuy.reduce((acc, it) => {
                    const arr = acc.get(it.category) ?? [];
                    arr.push(it);
                    acc.set(it.category, arr);
                    return acc;
                  }, new Map<string, ShoppingItem[]>())
                ).map(([cat, list]) => (
                  <div key={cat} className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-3 py-2 bg-muted/40 text-xs font-semibold text-foreground">{cat}</div>
                    <ul className="divide-y divide-border">
                      {list.map((it) => (
                        <li key={itemKey(it)} className="flex items-center gap-3 px-3 py-2 text-sm">
                          <span className="text-lg">{it.emoji ?? "🛒"}</span>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{it.name}</p>
                            <p className="text-xs text-muted-foreground">{it.quantity}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
