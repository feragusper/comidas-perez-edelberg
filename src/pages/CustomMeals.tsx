import { useMemo, useState } from "react";
import { useMeals } from "@/hooks/useMeals";
import { useIngredients } from "@/hooks/useIngredients";
import { useMealPlan } from "@/hooks/useMealPlan";
import { currentWeekKey } from "@/lib/env";
import { Meal } from "@/data/meals";
import { Ingredient, SENTINEL_MEAL_IDS } from "@/data/food";
import { FoodWizard, WizardKind } from "@/components/FoodWizard";
import { CollapsibleGroup } from "@/components/CollapsibleGroup";
import { Pencil, Trash2, X, Check, Tag, RotateCcw, Plus, ChefHat, Carrot, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

import { EmojiPicker } from "@/components/EmojiPicker";

import { parseTag, categoryOf } from "@/data/foodTaxonomy";

interface WizardState {
  kind: WizardKind;
  isEdit: boolean;
  initial?: Partial<Meal>;
}

const SENTINEL_IDS = SENTINEL_MEAL_IDS;

export default function CustomMeals() {
  const { meals, saveMeal, updateMeal, deleteMeal } = useMeals();
  const { ingredients, addIngredient, updateIngredient, deleteIngredient } = useIngredients();
  const { resetPlan } = useMealPlan(currentWeekKey());

  const [editingEmojiId, setEditingEmojiId] = useState<string | null>(null);
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteIngredientId, setConfirmDeleteIngredientId] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [wizard, setWizard] = useState<WizardState | null>(null);
  const [mealSearch, setMealSearch] = useState("");
  const [ingredientSearch, setIngredientSearch] = useState("");

  const allMeals = useMemo(
    () => meals
      .filter((m) => !SENTINEL_IDS.has(m.id))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [meals]
  );
  const filteredMeals = useMemo(() => {
    const q = mealSearch.trim().toLowerCase();
    if (!q) return allMeals;
    return allMeals.filter((m) => m.name.toLowerCase().includes(q));
  }, [allMeals, mealSearch]);

  const ingredientById = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);

  const filteredIngredients = useMemo(() => {
    const q = ingredientSearch.trim().toLowerCase();
    if (!q) return ingredients;
    return ingredients.filter((i) => i.name.toLowerCase().includes(q));
  }, [ingredients, ingredientSearch]);

  const handleEmojiSelect = async (mealId: string, emoji: string) => {
    await updateMeal(mealId, { emoji });
    setEditingEmojiId(null);
  };

  const handleDelete = async (mealId: string) => {
    await deleteMeal(mealId);
    setConfirmDeleteId(null);
  };

  const handleWizardSave = async (food: Meal, kind: WizardKind) => {
    if (kind === "ingredient") {
      const ing = food as Ingredient;
      if (wizard?.isEdit) {
        await updateIngredient(ing.id, { name: ing.name, emoji: ing.emoji, tags: ing.tags, isKeto: ing.isKeto });
        toast({ title: `${ing.emoji} ${ing.name}`, description: "Ingrediente actualizado." });
      } else {
        await addIngredient(ing);
        toast({ title: `${ing.emoji} ${ing.name}`, description: "Ingrediente creado." });
      }
    } else {
      if (wizard?.isEdit) {
        await updateMeal(food.id, {
          name: food.name,
          emoji: food.emoji,
          ingredientIds: food.ingredientIds ?? [],
          isSide: food.isSide ?? false,
        });
        toast({ title: `${food.emoji} ${food.name}`, description: "Comida actualizada." });
      } else {
        await saveMeal(food);
        toast({ title: `${food.emoji} ${food.name}`, description: "Comida creada." });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="px-4 sm:px-8 py-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground">
            Mis comidas
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReset(true)}
            className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <RotateCcw size={14} className="mr-1.5" /> Reiniciar semana
          </Button>
        </div>

        {/* Altas */}
        <div className="flex gap-2 mb-6">
          <Button variant="outline" className="flex-1" onClick={() => setWizard({ kind: "meal", isEdit: false })}>
            <ChefHat size={15} className="mr-1.5" /> Nueva comida
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setWizard({ kind: "ingredient", isEdit: false })}>
            <Carrot size={15} className="mr-1.5" /> Nuevo ingrediente
          </Button>
        </div>

        <CollapsibleGroup
          id="catalog:comidas"
          chevronSize={16}
          count={allMeals.length}
          headerClassName="text-lg font-bold text-foreground mb-3"
          title={
            <span className="inline-flex items-center gap-2">
              <ChefHat size={18} className="text-primary" /> Comidas
            </span>
          }
        >
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
            placeholder="Buscar comida..."
            value={mealSearch}
            onChange={(e) => setMealSearch(e.target.value)}
          />
        </div>

        {filteredMeals.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-muted-foreground">
              {allMeals.length === 0 ? "No hay comidas en el catálogo todavía." : "Nada que coincida con la búsqueda."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMeals.map((meal) => {
              const mealIngredients = (meal.ingredientIds ?? []).map((id) => ingredientById.get(id)).filter((i): i is Ingredient => i != null);
              const emojiOpen = editingEmojiId === meal.id;
              return (
                <div key={meal.id}>
                  <div
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border border-border bg-card transition-all",
                      emojiOpen && "rounded-b-none border-b-0"
                    )}
                  >
                    <button
                      onClick={() => setEditingEmojiId(emojiOpen ? null : meal.id)}
                      className="text-2xl hover:scale-110 transition-transform cursor-pointer mt-0.5"
                      title="Cambiar ícono"
                    >
                      {meal.emoji}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{meal.name}</p>
                      <p className="text-xs text-muted-foreground mb-1.5">
                        {meal.category}{meal.isSide ? " · Guarnición" : ""}
                      </p>
                      {mealIngredients.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {mealIngredients.map((ing) => (
                            <span
                              key={ing.id}
                              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-foreground"
                            >
                              <span>{ing.emoji}</span>
                              <span>{ing.name}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] italic text-warning mb-1">Sin ingredientes (sin normalizar)</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setWizard({ kind: "meal", isEdit: true, initial: meal })}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                        title="Editar comida (nombre, ícono, ingredientes)"
                      >
                        <Pencil size={14} />
                      </button>
                      {confirmDeleteId === meal.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(meal.id)}
                            className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            title="Confirmar"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                            title="Cancelar"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(meal.id)}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline emoji picker */}
                  {emojiOpen && (
                    <div className="p-4 border border-border border-t-0 rounded-b-xl bg-muted/30">
                      <EmojiPicker
                        value={meal.emoji}
                        onSelect={(emoji) => handleEmojiSelect(meal.id, emoji)}
                        gridClassName="grid grid-cols-10 sm:grid-cols-12 gap-1"
                        buttonClassName="text-xl p-1.5 rounded-lg transition-all hover:bg-card"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        </CollapsibleGroup>

        {/* ── Ingredientes ── */}
        <div className="mt-10">
          <CollapsibleGroup
            id="catalog:ingredientes"
            chevronSize={16}
            count={ingredients.length}
            headerClassName="text-lg font-bold text-foreground mb-3"
            title={
              <span className="inline-flex items-center gap-2">
                <Carrot size={18} className="text-secondary" /> Ingredientes
              </span>
            }
          >
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
              placeholder="Buscar ingrediente..."
              value={ingredientSearch}
              onChange={(e) => setIngredientSearch(e.target.value)}
            />
          </div>

          {filteredIngredients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-xl">
              {ingredients.length === 0 ? "Todavía no hay ingredientes." : "Nada que coincida con la búsqueda."}
            </p>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <ul className="divide-y divide-border">
                {filteredIngredients.map((ing) => (
                  <li key={ing.id} className="flex items-center gap-3 px-3 py-2">
                    <span className="text-lg shrink-0">{ing.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{ing.name}</p>
                      {(ing.tags ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {(ing.tags ?? []).map((tag) => {
                            const parsed = parseTag(tag);
                            if (!parsed) return null;
                            const cat = categoryOf(parsed.category);
                            return (
                              <span
                                key={tag}
                                className={cn(
                                  "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full",
                                  cat?.bg ?? "bg-muted",
                                  cat?.color ?? "text-foreground"
                                )}
                              >
                                <span>{cat?.emoji}</span>
                                <span>{parsed.sub}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setWizard({ kind: "ingredient", isEdit: true, initial: ing })}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                      title="Editar ingrediente"
                    >
                      <Pencil size={14} />
                    </button>
                    {confirmDeleteIngredientId === ing.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={async () => { await deleteIngredient(ing.id); setConfirmDeleteIngredientId(null); }}
                          className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                          title="Confirmar"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteIngredientId(null)}
                          className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                          title="Cancelar"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteIngredientId(ing.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground mt-2">
            Ojo: borrar un ingrediente no lo quita de las comidas que lo usan.
          </p>
          </CollapsibleGroup>
        </div>
      </div>

      {/* Wizard de alta/edición */}
      {wizard && (
        <FoodWizard
          kind={wizard.kind}
          isEdit={wizard.isEdit}
          initial={wizard.initial}
          ingredients={ingredients}
          onCustomIngredient={(ing) => void addIngredient(ing)}
          onSave={handleWizardSave}
          onClose={() => setWizard(null)}
        />
      )}

      <Dialog open={showReset} onOpenChange={setShowReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Reiniciar la semana?</DialogTitle>
            <DialogDescription>
              Se borrará toda la planificación de la semana actual y los almuerzos volverán a ser sugeridos automáticamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReset(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => { resetPlan(); setShowReset(false); }}
            >
              Reiniciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
