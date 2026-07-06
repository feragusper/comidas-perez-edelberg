import { useEffect, useMemo, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { MealPicker } from "@/components/MealPicker";
import { useMeals } from "@/hooks/useMeals";
import { useIngredients } from "@/hooks/useIngredients";
import { Meal } from "@/data/meals";
import { SENTINEL_MEAL_IDS as SENTINEL_IDS, ingredientSlug } from "@/data/food";
import { supabase } from "@/integrations/supabase/client";
import { DayPlan } from "@/hooks/useMealPlan";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ListChecks, Sparkles, Loader2, Plus, X, Check, Search, History, Trash2, Carrot } from "lucide-react";
import { toast } from "@/hooks/use-toast";

/**
 * Sección temporal para asignar ingredientes a las comidas que quedaron
 * sin componentizar (customs viejas + huérfanas del historial).
 * Cuando todo esté normalizado, esta página se elimina.
 */
export default function Normalize() {
  const { meals, restoreMeal, updateMeal, deleteMeal, deleteMeals } = useMeals();
  const { ingredients, addIngredient } = useIngredients();

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [orphans, setOrphans] = useState<Meal[]>([]);
  const [usedIds, setUsedIds] = useState<Set<string> | null>(null);
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [purging, setPurging] = useState(false);

  const normalizable = useMemo(
    () => meals.filter((m) => !SENTINEL_IDS.has(m.id)),
    [meals]
  );
  const pending = useMemo(
    () => normalizable.filter((m) => (m.ingredientIds ?? []).length === 0),
    [normalizable]
  );
  const done = normalizable.length - pending.length;
  const progressPct = normalizable.length ? Math.round((done / normalizable.length) * 100) : 0;

  const filteredPending = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pending;
    return pending.filter((m) => m.name.toLowerCase().includes(q));
  }, [pending, search]);

  const ingredientById = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);

  // Recorre TODO el historial (stage + prod comparten DB):
  // - huérfanas: ids usados que ya no existen en el catálogo
  // - usedIds: todos los ids de comidas usados alguna vez (para la purga)
  useEffect(() => {
    const catalogIds = new Set(meals.map((m) => m.id));
    if (catalogIds.size === 0) return;
    const ingredientIds = new Set(ingredients.map((i) => i.id));

    supabase
      .from("meal_plan")
      .select("plan")
      .then(({ data, error }) => {
        if (error) { console.error("Error loading history:", error); return; }
        const found = new Map<string, Meal>();
        const used = new Set<string>();
        for (const row of data ?? []) {
          const week = row.plan as unknown as DayPlan[];
          if (!Array.isArray(week)) continue;
          for (const day of week) {
            const foods: (Meal | null)[] = [
              day.dinner, day.dinnerSide, ...(day.dinnerExtras ?? []),
              day.lunch, day.lunchSide, ...(day.lunchExtras ?? []),
              day.babyDinner, day.babyDinnerSide, ...(day.babyDinnerExtras ?? []),
              day.babyLunch, day.babyLunchSide, ...(day.babyLunchExtras ?? []),
              day.breakfast, ...(day.breakfastExtras ?? []),
              day.snack, ...(day.snackExtras ?? []),
            ];
            for (const f of foods) {
              if (!f || typeof f !== "object" || !f.id) continue;
              if (f.kind === "ingredient") continue;
              used.add(f.id);
              if (SENTINEL_IDS.has(f.id) || catalogIds.has(f.id) || found.has(f.id)) continue;
              // Comida convertida a ingrediente: se resuelve por nombre, no es huérfana
              if (ingredientIds.has(ingredientSlug(f.name))) continue;
              found.set(f.id, f);
            }
          }
        }
        setOrphans(Array.from(found.values()));
        setUsedIds(used);
      });
  }, [meals, ingredients]);

  /** "Esta comida es en realidad un ingrediente": lo crea y borra la comida. */
  const convertToIngredient = async (meal: Meal, isOrphan = false) => {
    const created = await addIngredient({
      name: meal.name,
      emoji: meal.emoji,
      tags: meal.tags ?? [],
      babySafety: meal.babySafety,
      babyNote: meal.babyNote,
      isKeto: meal.isKeto,
    });
    if (!created) {
      toast({ title: "No se pudo crear el ingrediente", variant: "destructive" });
      return;
    }
    if (isOrphan) {
      setOrphans((prev) => prev.filter((o) => o.id !== meal.id));
    } else {
      await deleteMeal(meal.id);
    }
    toast({ title: `${created.emoji} ${created.name}`, description: "Ahora es un ingrediente." });
  };

  /** Predefinidas del catálogo original que nunca aparecieron en ningún menú. */
  const unusedSeeds = useMemo(() => {
    if (!usedIds) return [];
    return meals.filter(
      (m) => !m.id.startsWith("custom-") && !SENTINEL_IDS.has(m.id) && !usedIds.has(m.id)
    );
  }, [meals, usedIds]);

  const purgeSeeds = async () => {
    setPurging(true);
    try {
      await deleteMeals(unusedSeeds.map((m) => m.id));
      toast({ title: "Catálogo depurado", description: `${unusedSeeds.length} comidas predefinidas eliminadas.` });
      setConfirmPurge(false);
    } finally {
      setPurging(false);
    }
  };

  const startEditing = (meal: Meal) => {
    setEditingId(meal.id);
    setDraft(meal.ingredientIds ?? []);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraft([]);
  };

  const saveDraft = async (meal: Meal) => {
    if (draft.length === 0) {
      toast({ title: "Agregá al menos un ingrediente", variant: "destructive" });
      return;
    }
    await updateMeal(meal.id, { ingredientIds: draft });
    toast({ title: `${meal.emoji} ${meal.name}`, description: "Ingredientes guardados." });
    cancelEditing();
  };

  const suggestWithAI = async (meal: Meal) => {
    setAiLoading(meal.id);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-ingredients-for-meal", {
        body: {
          mealName: meal.name,
          catalog: ingredients.map((i) => ({ id: i.id, name: i.name })),
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast({
          title: data.error === "RATE_LIMITED" ? "Demasiadas peticiones" : "Error de IA",
          description: "Probá de nuevo en un rato.",
          variant: "destructive",
        });
        return;
      }

      const existingIds: string[] = Array.isArray(data?.ingredientIds) ? data.ingredientIds : [];
      const newOnes: { name: string; emoji?: string; tag?: string }[] = Array.isArray(data?.newIngredients) ? data.newIngredients : [];

      const validIds = existingIds.filter((id) => ingredientById.has(id));
      const createdIds: string[] = [];
      for (const n of newOnes) {
        if (!n?.name) continue;
        const created = await addIngredient({ name: n.name, emoji: n.emoji, tags: n.tag ? [n.tag] : [] });
        if (created) createdIds.push(created.id);
      }

      const suggestion = Array.from(new Set([...validIds, ...createdIds]));
      if (suggestion.length === 0) {
        toast({ title: "La IA no encontró ingredientes", variant: "destructive" });
        return;
      }
      setEditingId(meal.id);
      setDraft(suggestion);
    } catch (e) {
      console.error(e);
      toast({ title: "Error consultando la IA", description: "¿Está desplegada la función suggest-ingredients-for-meal?", variant: "destructive" });
    } finally {
      setAiLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="px-4 sm:px-8 py-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <ListChecks className="text-primary" size={22} />
          <h1 className="text-2xl font-bold text-foreground">Normalizar comidas</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Asigná ingredientes a las comidas que todavía no los tienen. Sección temporal: cuando llegues al 100% desaparece.
        </p>

        {/* Progreso */}
        <div className="rounded-xl border border-border bg-card p-4 mb-5 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-foreground font-medium">
              {done}/{normalizable.length} comidas con ingredientes
            </span>
            <span className="text-muted-foreground">{progressPct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Purga de predefinidas sin uso */}
        {unusedSeeds.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 mb-5 flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm font-medium text-foreground">
                {unusedSeeds.length} comidas predefinidas sin uso
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vinieron con la app y nunca aparecieron en ningún menú. Borrarlas limpia el picker y el catálogo; las que sí usaste se conservan.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmPurge(true)}
              className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 size={14} className="mr-1.5" /> Eliminar todas
            </Button>
          </div>
        )}

        {/* Huérfanas del historial */}
        {orphans.length > 0 && (
          <div className="rounded-xl border border-warning/40 bg-warning/5 overflow-hidden mb-5">
            <div className="px-3 py-2 bg-warning/10 flex items-center gap-2">
              <History size={14} className="text-warning" />
              <span className="text-xs font-semibold text-foreground">
                Comidas del historial que ya no están en el catálogo
              </span>
            </div>
            <ul className="divide-y divide-border">
              {orphans.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="text-lg shrink-0">{m.emoji}</span>
                  <span className="flex-1 min-w-0 font-medium text-foreground truncate">{m.name}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => convertToIngredient(m, true)}
                    title="No es una comida: convertir en ingrediente"
                  >
                    <Carrot size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await restoreMeal(m);
                      setOrphans((prev) => prev.filter((o) => o.id !== m.id));
                      toast({ title: `${m.emoji} ${m.name}`, description: "Recuperada al catálogo, ahora asignale ingredientes." });
                    }}
                  >
                    <Plus size={13} className="mr-1" /> Recuperar
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Buscador */}
        {pending.length > 5 && (
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
              placeholder={`Buscar entre ${pending.length} pendientes...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* Pendientes */}
        {pending.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-foreground font-medium">¡Todo normalizado!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ya podés pedirle a Claude que elimine esta sección.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPending.map((meal) => {
              const isEditing = editingId === meal.id;
              return (
                <div key={meal.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl shrink-0">{meal.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{meal.name}</p>
                      <p className="text-xs text-muted-foreground">{meal.category}</p>
                    </div>
                    {!isEditing && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => convertToIngredient(meal)}
                          title="No es una comida: convertir en ingrediente"
                        >
                          <Carrot size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={aiLoading === meal.id}
                          onClick={() => suggestWithAI(meal)}
                          title="Sugerir ingredientes con IA"
                        >
                          {aiLoading === meal.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Sparkles size={14} />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => startEditing(meal)}>
                          <Plus size={13} className="mr-1" /> Ingredientes
                        </Button>
                      </>
                    )}
                  </div>

                  {isEditing && (
                    <div className="mt-3 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {draft.length === 0 && (
                          <p className="text-xs italic text-muted-foreground">Sin ingredientes todavía.</p>
                        )}
                        {draft.map((id) => {
                          const ing = ingredientById.get(id);
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1.5 bg-muted/60 rounded-full pl-3 pr-1.5 py-1.5 text-sm text-foreground"
                            >
                              <span>{ing?.emoji ?? "🥕"}</span>
                              <span>{ing?.name ?? id}</span>
                              <button
                                onClick={() => setDraft((prev) => prev.filter((d) => d !== id))}
                                className="ml-0.5 p-0.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                aria-label={`Quitar ${ing?.name ?? id}`}
                              >
                                <X size={13} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
                          <Plus size={13} className="mr-1" /> Agregar ingrediente
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={aiLoading === meal.id}
                          onClick={() => suggestWithAI(meal)}
                        >
                          {aiLoading === meal.id
                            ? <Loader2 size={14} className="animate-spin mr-1" />
                            : <Sparkles size={14} className="mr-1" />}
                          Sugerir con IA
                        </Button>
                        <div className="ml-auto flex gap-2">
                          <Button size="sm" variant="ghost" onClick={cancelEditing}>Cancelar</Button>
                          <Button size="sm" onClick={() => saveDraft(meal)}>
                            <Check size={13} className="mr-1" /> Guardar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={confirmPurge} onOpenChange={setConfirmPurge}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar {unusedSeeds.length} comidas predefinidas?</DialogTitle>
            <DialogDescription>
              Se borran del catálogo las comidas que vinieron con la app y nunca usaste en ningún menú
              (ni en stage ni en prod). Los ingredientes no se tocan. Esta acción no afecta tu historial.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPurge(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={purgeSeeds} disabled={purging}>
              {purging ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Trash2 size={14} className="mr-1.5" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pickerOpen && editingId && (
        <MealPicker
          mode="adult"
          step="main"
          ingredients={ingredients}
          ingredientsOnly
          onCustomIngredient={(ing) => void addIngredient(ing)}
          onSelect={(food) => {
            setDraft((prev) => (prev.includes(food.id) ? prev : [...prev, food.id]));
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
