import { useState, useEffect } from "react";
import { Meal, MEAL_CATEGORIES, BabySafety } from "@/data/meals";
import { Ingredient } from "@/data/food";
import { FoodWizard } from "@/components/FoodWizard";
import { CollapsibleGroup } from "@/components/CollapsibleGroup";
import { useKeyboardInset, useBodyScrollLock } from "@/hooks/useKeyboardInset";
import { useMealPlanUsage } from "@/hooks/useMealPlanUsage";
import { usePantry, normalizePantryName } from "@/hooks/usePantry";
import { usageCount } from "@/lib/mealPlanUsage";
import { cn } from "@/lib/utils";
import { X, Search, Baby, ChefHat, Leaf } from "lucide-react";
import { Input } from "@/components/ui/input";

export type PickerMode = "adult" | "baby";
export type PickerStep = "main" | "side";
export type DietFilter = "all" | "keto";

interface MealPickerProps {
  mode: PickerMode;
  step: PickerStep;
  prevDinner?: Meal | null;
  extraMeals?: Meal[];
  /** Catálogo de ingredientes; si viene, se muestran como grupo aparte. */
  ingredients?: Ingredient[];
  onSelect: (meal: Meal) => void;
  onCustomMeal?: (meal: Meal) => void;
  onCustomIngredient?: (ing: Ingredient) => void;
  onClose: () => void;
  onSkipSide?: () => void;
  /** Override which categories are shown/grouped (e.g. ["Desayunos"] for breakfast). */
  categories?: string[];
  /** Solo ingredientes: oculta comidas y fuerza creación como ingrediente. */
  ingredientsOnly?: boolean;
  /** Muestra arriba, destacado, lo que ya está en la despensa (Don Bacilio). */
  highlightPantry?: boolean;
  /** Título del modal (p.ej. "Elegir desayuno" para el slot de desayuno). */
  title?: string;
}

const safetyColors: Record<BabySafety, string> = {
  safe: "text-baby-safe bg-baby-safe-bg border-baby-safe/30",
  caution: "text-baby-caution bg-baby-caution-bg border-baby-caution/30",
  unsafe: "text-destructive bg-destructive/10 border-destructive/30",
};

const safetyLabel: Record<BabySafety, string> = {
  safe: "✓ Apto",
  caution: "⚠ Cuidado",
  unsafe: "✗ No apto",
};


export function MealPicker({ mode, step, prevDinner, extraMeals = [], ingredients = [], onSelect, onCustomMeal, onCustomIngredient, onClose, onSkipSide, categories, ingredientsOnly = false, highlightPantry = false, title: titleOverride }: MealPickerProps) {
  const [search, setSearch] = useState("");
  const [dietFilter, setDietFilter] = useState<DietFilter>("all");
  // Nombre buscado que se está dando de alta en el wizard (null = wizard cerrado)
  const [wizardName, setWizardName] = useState<string | null>(null);
  // Comida elegida que está en la despensa y espera respuesta a "¿es la última?"
  const [confirmFood, setConfirmFood] = useState<Meal | null>(null);
  const kbInset = useKeyboardInset();
  useBodyScrollLock();
  const { mealUsages } = useMealPlanUsage();
  const { items: pantryItems, setDepleteOnUse } = usePantry();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (confirmFood) setConfirmFood(null);
      else if (wizardName === null) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, wizardName, confirmFood]);

  /**
   * Selección final de un alimento. Si está en la despensa y todavía no sabemos
   * si es lo último que queda, primero se pregunta (ver overlay de confirmación).
   */
  const handlePick = (food: Meal) => {
    if (highlightPantry) {
      const match = pantryItems.find((p) => normalizePantryName(p.name) === normalizePantryName(food.name));
      if (match && match.depleteOnUse === undefined) {
        setConfirmFood(food);
        return;
      }
    }
    onSelect(food);
    onClose();
  };

  const answerConfirm = (isLast: boolean) => {
    if (!confirmFood) return;
    setDepleteOnUse(confirmFood.name, isLast);
    const food = confirmFood;
    setConfirmFood(null);
    onSelect(food);
    onClose();
  };

  const isBaby = mode === "baby";
  const isSide = step === "side";

  // Catálogo completo (viene de useMeals: DB con fallback estático)
  const allMeals = extraMeals;

  // Custom meals (saved by the user) always appear in both steps,
  // regardless of whether they were saved as main or side.
  const pool = (ingredientsOnly ? [] : allMeals).filter((m) => {
    const stepOk = m.id.startsWith("custom-") ? true : (isSide ? m.isSide === true : m.isSide !== true);
    const catOk = categories ? (m.id.startsWith("custom-") || categories.includes(m.category)) : true;
    return stepOk && catOk;
  });
  const baseMeals = isBaby ? pool.filter((m) => m.babySafety !== "unsafe") : pool;
  const dietFiltered = dietFilter === "keto" ? baseMeals.filter((m) => m.isKeto) : baseMeals;
  const filtered = dietFiltered
    .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    // Más usadas arriba; a igualdad de uso, alfabético.
    .sort((a, b) => {
      const diff = usageCount(mealUsages.get(b.id)) - usageCount(mealUsages.get(a.id));
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });

  // Ingredients group: available in both steps (una fruta puede ser comida o guarnición)
  const filteredIngredients = ingredients.filter((i) => {
    if (isBaby && i.babySafety === "unsafe") return false;
    if (dietFilter === "keto" && !i.isKeto) return false;
    return i.name.toLowerCase().includes(search.toLowerCase());
  });

  const hasSearch = search.trim().length > 0;
  const noResults = hasSearch && filtered.length === 0 && filteredIngredients.length === 0;

  // "En Don Bacilio" group: catalog items whose name matches the pantry.
  // Shown prominently on top; excluded from the groups below.
  const pantryNames = new Set(pantryItems.map((p) => normalizePantryName(p.name)));
  const inPantry = (name: string) => pantryNames.has(normalizePantryName(name));
  // Se separan comidas de ingredientes: dentro del grupo van comidas primero.
  const pantryMeals: Meal[] = highlightPantry ? filtered.filter((m) => inPantry(m.name)) : [];
  const pantryIngredients: Meal[] = highlightPantry ? filteredIngredients.filter((i) => inPantry(i.name)) : [];
  const pantryPool: Meal[] = [...pantryMeals, ...pantryIngredients];
  const pantryIds = new Set(pantryPool.map((f) => f.id));

  // "Con lo de anoche" group (only for main meals)
  const prevRelated: Meal[] = (!isSide && prevDinner)
    ? filtered.filter((m) => m.category === prevDinner.category && !pantryIds.has(m.id))
    : [];
  const prevRelatedIds = new Set(prevRelated.map((m) => m.id));

  // Custom meals group (in main step)
  const customPool = !isSide
    ? filtered.filter((m) => m.id.startsWith("custom-") && !prevRelatedIds.has(m.id) && !pantryIds.has(m.id))
    : [];
  const customIds = new Set(customPool.map((m) => m.id));

  // Rest grouped by category
  const rest = filtered.filter((m) => !prevRelatedIds.has(m.id) && !customIds.has(m.id) && !pantryIds.has(m.id));
  const restIngredients = filteredIngredients.filter((i) => !pantryIds.has(i.id));
  const grouped = (categories ?? MEAL_CATEGORIES).reduce<Record<string, Meal[]>>((acc, cat) => {
    const meals = rest.filter((m) => m.category === cat);
    if (meals.length) acc[cat] = meals;
    return acc;
  }, {});

  const title = titleOverride
    ?? (ingredientsOnly
    ? "Elegir ingrediente"
    : isSide
    ? "Elegir guarnición"
    : isBaby ? "Comida de Nico" : "Elegir comida principal");

  const openWizard = () => setWizardName(search.trim());

  if (wizardName !== null) {
    return (
      <FoodWizard
        kind={ingredientsOnly ? "ingredient" : "meal"}
        allowKindSwitch={!ingredientsOnly && !!onCustomIngredient}
        initial={{ name: wizardName, isSide: ingredientsOnly ? false : isSide }}
        ingredients={ingredients}
        onCustomIngredient={onCustomIngredient}
        onSave={(food, kind) => {
          onSelect(food);
          if (kind === "ingredient") onCustomIngredient?.(food as Ingredient);
          else onCustomMeal?.(food);
          onClose();
        }}
        onClose={() => setWizardName(null)}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={kbInset > 0 ? { paddingBottom: kbInset } : undefined}
    >
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-card rounded-t-3xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[min(85dvh,100%)] flex flex-col overflow-hidden border border-border">

        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3">
          <div className="flex items-center gap-2">
            {isBaby
              ? <Baby size={18} className="text-baby-safe" />
              : isSide
              ? <span className="text-base">🥗</span>
              : <ChefHat size={18} className="text-primary" />
            }
            <h3 className="text-xl font-semibold text-foreground">
              {title}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Diet filter (only for main/adult) */}
        {!isBaby && !isSide && (
          <div className="px-5 pb-3 flex gap-2">
            <button
              onClick={() => setDietFilter("all")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                dietFilter === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70"
              )}
            >
              Todos
            </button>
            <button
              onClick={() => setDietFilter("keto")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                dietFilter === "keto"
                  ? "bg-secondary text-secondary-foreground border-secondary"
                  : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70"
              )}
            >
              <Leaf size={12} />
              Keto
            </button>
          </div>
        )}

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={ingredientsOnly ? "Buscar ingrediente..." : isSide ? "Buscar guarnición..." : "Buscar comida o ingrediente..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Meals list */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">

          {/* Skip side button */}
          {isSide && onSkipSide && (
            <button
              onClick={onSkipSide}
              className="w-full text-xs text-muted-foreground border border-dashed border-border rounded-lg px-3 py-2.5 hover:bg-muted transition-all"
            >
              Sin guarnición
            </button>
          )}

          {/* No results → free text option */}
          {noResults && (
            <div className="text-center py-6">
              <p className="text-3xl mb-2">🍽️</p>
              <p className="text-sm text-muted-foreground mb-3">
                No encontramos esa comida
              </p>
              <button
                onClick={openWizard}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
              >
                Usar &ldquo;{search.trim()}&rdquo;
              </button>
            </div>
          )}

          {/* Also show free-text option when there are partial results */}
          {hasSearch && !noResults && (
            <button
              onClick={openWizard}
              className="w-full text-left px-3 py-2.5 rounded-lg border border-dashed border-border hover:bg-muted transition-all flex items-center gap-3"
            >
              <span className="text-2xl">🍽️</span>
              <div>
                <p className="text-sm font-medium text-foreground">Usar &ldquo;{search.trim()}&rdquo;</p>
                <p className="text-xs text-muted-foreground">Guardar y agregar como comida o ingrediente nuevo</p>
              </div>
            </button>
          )}

          {/* Pantry group: what's already at home (Don Bacilio) */}
          {!noResults && pantryPool.length > 0 && (
            <div className="rounded-xl border-2 border-baby-safe/30 bg-baby-safe-bg p-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-baby-safe mb-2">
                🏠 Ya en casa (Don Bacilio)
              </h4>
              {pantryMeals.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    🍽️ Comidas ({pantryMeals.length})
                  </p>
                  <div className="space-y-2">
                    {pantryMeals.map((food) => (
                      <MealRow key={food.id} meal={food} onPick={handlePick} isBaby={isBaby} />
                    ))}
                  </div>
                </div>
              )}
              {pantryIngredients.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    🥕 Ingredientes ({pantryIngredients.length})
                  </p>
                  <div className="space-y-2">
                    {pantryIngredients.map((food) => (
                      <MealRow key={food.id} meal={food} onPick={handlePick} isBaby={isBaby} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prev dinner related group (main only) */}
          {!noResults && prevRelated.length > 0 && (
            <CollapsibleGroup
              id="picker:anoche"
              forceOpen={hasSearch}
              count={prevRelated.length}
              headerClassName="text-xs font-semibold uppercase tracking-wider text-secondary mb-2"
              title={
                <>
                  {isBaby ? "🍼 Adaptado de lo de anoche" : "♻️ Con lo de anoche"}
                  <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground">
                    (basado en: {prevDinner?.name})
                  </span>
                </>
              }
            >
              <div className="space-y-2">
                {prevRelated.map((meal) => (
                  <MealRow key={meal.id} meal={meal} onPick={handlePick} isBaby={isBaby} />
                ))}
              </div>
            </CollapsibleGroup>
          )}

          {/* Custom meals group */}
          {!isSide && !noResults && customPool.length > 0 && (
            <CollapsibleGroup
              id="picker:mis-comidas"
              forceOpen={hasSearch}
              count={customPool.length}
              title="⭐ Mis comidas"
              headerClassName="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"
            >
              <div className="space-y-2">
                {customPool.map((meal) => (
                  <MealRow key={meal.id} meal={meal} onPick={handlePick} isBaby={isBaby} />
                ))}
              </div>
            </CollapsibleGroup>
          )}

          {/* Main meals by category */}
          {!isSide && !noResults && Object.entries(grouped).map(([cat, meals]) => (
            <CollapsibleGroup
              key={cat}
              id={`picker:cat-${cat}`}
              forceOpen={hasSearch}
              count={meals.length}
              title={cat}
              headerClassName="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"
            >
              <div className="space-y-2">
                {meals.map((meal) => (
                  <MealRow key={meal.id} meal={meal} onPick={handlePick} isBaby={isBaby} />
                ))}
              </div>
            </CollapsibleGroup>
          ))}

          {/* Sides list */}
          {isSide && !noResults && rest.length > 0 && (
            <CollapsibleGroup
              id="picker:guarniciones"
              forceOpen={hasSearch}
              count={rest.length}
              title="Guarniciones"
              headerClassName="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"
            >
              <div className="space-y-2">
                {rest.map((meal) => (
                  <MealRow key={meal.id} meal={meal} onPick={handlePick} isBaby={isBaby} />
                ))}
              </div>
            </CollapsibleGroup>
          )}

          {/* Ingredients group (both steps) */}
          {!noResults && restIngredients.length > 0 && (
            <CollapsibleGroup
              id="picker:ingredientes"
              forceOpen={hasSearch}
              count={restIngredients.length}
              title="🥕 Ingredientes"
              headerClassName="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"
            >
              <div className="space-y-2">
                {restIngredients.map((ing) => (
                  <MealRow key={ing.id} meal={ing} onPick={handlePick} isBaby={isBaby} />
                ))}
              </div>
            </CollapsibleGroup>
          )}

        </div>

        {/* Confirmación: la comida elegida está en Don Bacilio, ¿es lo último que queda? */}
        {confirmFood && (
          <div className="absolute inset-0 z-20 bg-card/95 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="text-center space-y-4 max-w-sm">
              <p className="text-4xl">{confirmFood.emoji}</p>
              <p className="text-base font-medium text-foreground">
                {confirmFood.name} está en Don Bacilio
              </p>
              <p className="text-sm text-muted-foreground">
                ¿Es lo último que queda? Si es lo último, cuando pase el día se saca solo de Don Bacilio.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => answerConfirm(true)}
                  className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
                >
                  ⚠ Sí, es lo último
                </button>
                <button
                  onClick={() => answerConfirm(false)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-all"
                >
                  Hay más en casa
                </button>
                <button
                  onClick={() => setConfirmFood(null)}
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors mt-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MealRow({ meal, onPick, isBaby }: {
  meal: Meal;
  onPick: (m: Meal) => void;
  isBaby: boolean;
}) {
  return (
    <button
      onClick={() => onPick(meal)}
      className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent transition-all"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{meal.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-medium text-foreground text-sm">{meal.name}</p>
            {meal.isKeto && (
              <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-secondary/15 text-secondary font-medium">
                <Leaf size={10} /> keto
              </span>
            )}
          </div>
          {isBaby && meal.babyNote && (
            <div className="flex items-center gap-1 mt-1">
              <Baby size={11} className="text-baby-safe shrink-0" />
              <p className="text-xs text-muted-foreground">{meal.babyNote}</p>
            </div>
          )}
        </div>
        {isBaby && (
          <span className={cn("shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium", safetyColors[meal.babySafety])}>
            {safetyLabel[meal.babySafety]}
          </span>
        )}
      </div>
    </button>
  );
}
