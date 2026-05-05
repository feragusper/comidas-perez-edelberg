import { useMemo, useState, useEffect } from "react";
import { TopNav } from "@/components/TopNav";
import { Textarea } from "@/components/ui/textarea";
import { useMealPlan } from "@/hooks/useMealPlan";
import { useCustomMeals } from "@/hooks/useCustomMeals";
import { currentWeekKey } from "@/lib/env";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, Plus, Carrot } from "lucide-react";
import { Meal } from "@/data/meals";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Suggestion {
  name: string;
  emoji: string;
  description: string;
  isKeto?: boolean;
}

type SlotKey = "lunch" | "dinner" | "babyLunch" | "babyDinner" | "breakfast" | "snack";

const SLOT_LABEL: Record<SlotKey, string> = {
  breakfast: "Desayuno (Nico)",
  lunch: "Almuerzo (Nosotros)",
  babyLunch: "Almuerzo (Nico)",
  snack: "Merienda (Nico)",
  dinner: "Cena (Nosotros)",
  babyDinner: "Cena (Nico)",
};

const STORAGE_KEY = "ingredientes_notepad";

export default function Ingredients() {
  const [text, setText] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? "");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [pendingAssign, setPendingAssign] = useState<{ suggestion: Suggestion; dayIndex: number; slot: SlotKey; existing: Meal } | null>(null);

  const weekKey = currentWeekKey();
  const { plan, setDinner, setLunch, setBabyDinner, setBabyLunch, setBreakfast, setSnack } = useMealPlan(weekKey);
  const { saveCustomMeal } = useCustomMeals();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, text);
  }, [text]);

  const ingredients = useMemo(
    () => text.split("\n").map((s) => s.trim()).filter(Boolean),
    [text]
  );

  const handleGenerate = async () => {
    if (ingredients.length === 0) {
      toast({ title: "Agregá al menos un ingrediente", variant: "destructive" });
      return;
    }
    setLoading(true);
    setSuggestions([]);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-from-ingredients", {
        body: { ingredients },
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
      setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
    } catch (e) {
      console.error(e);
      toast({ title: "Error generando sugerencias", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const buildMeal = (s: Suggestion): Meal => {
    const id = `custom-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}`;
    return {
      id,
      name: s.name,
      emoji: s.emoji || "🍽️",
      babySafety: "caution",
      category: "Otro",
      isKeto: !!s.isKeto,
      tags: [],
    };
  };

  const applyAssign = (suggestion: Suggestion, dayIndex: number, slot: SlotKey, meal: Meal) => {
    const setters: Record<SlotKey, (i: number, m: Meal | null) => void> = {
      dinner: setDinner,
      lunch: setLunch,
      babyDinner: setBabyDinner,
      babyLunch: setBabyLunch,
      breakfast: setBreakfast,
      snack: setSnack,
    };
    setters[slot](dayIndex, meal);
    void saveCustomMeal(meal);
    toast({ title: `Agregado a ${SLOT_LABEL[slot]} - ${plan[dayIndex].day}` });
  };

  const getCurrentMealAt = (dayIndex: number, slot: SlotKey): Meal | null => {
    const d = plan[dayIndex];
    return (d as any)[slot] ?? null;
  };

  const handleSelect = (suggestion: Suggestion, value: string) => {
    const [dayStr, slot] = value.split("|") as [string, SlotKey];
    const dayIndex = parseInt(dayStr, 10);
    const existing = getCurrentMealAt(dayIndex, slot);
    if (existing) {
      setPendingAssign({ suggestion, dayIndex, slot, existing });
    } else {
      applyAssign(suggestion, dayIndex, slot, buildMeal(suggestion));
    }
  };

  const confirmReplace = () => {
    if (!pendingAssign) return;
    const meal = buildMeal(pendingAssign.suggestion);
    applyAssign(pendingAssign.suggestion, pendingAssign.dayIndex, pendingAssign.slot, meal);
    setPendingAssign(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="px-4 sm:px-8 py-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <Carrot className="text-primary" size={22} />
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>
            Ingredientes
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Agregar ingredientes para generar sugerencias
        </p>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"pollo\nzanahoria\narroz\n..."}
          className="min-h-[180px] font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Uno por línea · {ingredients.length} ingrediente{ingredients.length === 1 ? "" : "s"}
        </p>

        <Button
          onClick={handleGenerate}
          disabled={loading || ingredients.length === 0}
          className="w-full mt-4"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin mr-2" /> Generando…</>
          ) : (
            <><Sparkles size={16} className="mr-2" /> Generar sugerencias</>
          )}
        </Button>

        {suggestions.length > 0 && (
          <div className="mt-6 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Sugerencias</h2>
            {suggestions.map((s, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="text-3xl shrink-0">{s.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{s.name}</p>
                    {s.isKeto && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                        keto
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                </div>
                <Select onValueChange={(v) => handleSelect(s, v)}>
                  <SelectTrigger className="w-[170px] shrink-0">
                    <span className="flex items-center gap-1.5 text-xs">
                      <Plus size={13} /> Agregar
                    </span>
                  </SelectTrigger>
                  <SelectContent className="max-h-[420px]">
                    {plan.map((day, di) => (
                      <SelectGroup key={di}>
                        <SelectLabel className="pl-2 text-xs">{day.day}</SelectLabel>
                        {(["breakfast", "lunch", "babyLunch", "snack", "dinner", "babyDinner"] as SlotKey[]).map((slot) => {
                          const existing = getCurrentMealAt(di, slot);
                          return (
                            <SelectItem key={slot} value={`${di}|${slot}`} className="text-xs">
                              <span className="flex items-center gap-1.5">
                                <span className="text-muted-foreground">{SLOT_LABEL[slot]}:</span>
                                <span className={cn(existing ? "text-foreground" : "text-muted-foreground italic")}>
                                  {existing ? `${existing.emoji} ${existing.name}` : "vacío"}
                                </span>
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!pendingAssign} onOpenChange={(o) => !o && setPendingAssign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Querés reemplazar esta comida?</DialogTitle>
            <DialogDescription>
              {pendingAssign && (
                <>
                  En <strong>{plan[pendingAssign.dayIndex]?.day}</strong> – {SLOT_LABEL[pendingAssign.slot]} ya hay{" "}
                  <strong>{pendingAssign.existing.emoji} {pendingAssign.existing.name}</strong>. Será reemplazado por{" "}
                  <strong>{pendingAssign.suggestion.emoji} {pendingAssign.suggestion.name}</strong>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingAssign(null)}>Cancelar</Button>
            <Button onClick={confirmReplace}>Reemplazar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
