import { useState, useEffect } from "react";
import { Meal, MEALS, MEAL_CATEGORIES, BabySafety } from "@/data/meals";
import { cn } from "@/lib/utils";
import { X, Search, Baby, ChefHat, Leaf } from "lucide-react";

export type PickerMode = "adult" | "baby";
export type PickerStep = "main" | "side";
export type DietFilter = "all" | "keto";

interface MealPickerProps {
  mode: PickerMode;
  step: PickerStep;
  prevDinner?: Meal | null;
  onSelect: (meal: Meal) => void;
  onClose: () => void;
  onSkipSide?: () => void;
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

export function MealPicker({ mode, step, prevDinner, onSelect, onClose, onSkipSide }: MealPickerProps) {
  const [search, setSearch] = useState("");
  const [dietFilter, setDietFilter] = useState<DietFilter>("all");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const isBaby = mode === "baby";
  const isSide = step === "side";

  const pool = MEALS.filter((m) => isSide ? m.isSide === true : m.isSide !== true);
  const baseMeals = isBaby ? pool.filter((m) => m.babySafety !== "unsafe") : pool;
  const dietFiltered = dietFilter === "keto" ? baseMeals.filter((m) => m.isKeto) : baseMeals;
  const filtered = dietFiltered.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const hasSearch = search.trim().length > 0;
  const noResults = hasSearch && filtered.length === 0;

  // "Con lo de anoche" group (only for main meals)
  const prevRelated: Meal[] = (!isSide && prevDinner)
    ? filtered.filter((m) => m.category === prevDinner.category)
    : [];
  const prevRelatedIds = new Set(prevRelated.map((m) => m.id));

  // Rest grouped by category
  const rest = filtered.filter((m) => !prevRelatedIds.has(m.id));
  const grouped = MEAL_CATEGORIES.reduce<Record<string, Meal[]>>((acc, cat) => {
    const meals = rest.filter((m) => m.category === cat);
    if (meals.length) acc[cat] = meals;
    return acc;
  }, {});

  const title = isSide
    ? "Elegir guarnición"
    : isBaby ? "Comida de Nico" : "Elegir comida principal";

  const handleSelectFreeText = () => {
    onSelect({
      id: `custom-${Date.now()}`,
      name: search.trim(),
      emoji: "🍽️",
      babySafety: "caution",
      category: "Otro",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-card rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden border border-border">

        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3">
          <div className="flex items-center gap-2">
            {isBaby
              ? <Baby size={18} className="text-baby-safe" />
              : isSide
              ? <span className="text-base">🥗</span>
              : <ChefHat size={18} className="text-primary" />
            }
            <h3 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'Fraunces, serif' }}>
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
            <input
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
              placeholder={isSide ? "Buscar guarnición..." : "Buscar comida..."}
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
              className="w-full text-xs text-muted-foreground border border-dashed border-border rounded-xl px-3 py-2.5 hover:bg-muted transition-all"
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
                onClick={handleSelectFreeText}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
              >
                Usar &ldquo;{search.trim()}&rdquo;
              </button>
            </div>
          )}

          {/* Also show free-text option when there are partial results */}
          {hasSearch && !noResults && (
            <button
              onClick={handleSelectFreeText}
              className="w-full text-left px-3 py-2.5 rounded-xl border border-dashed border-border hover:bg-muted transition-all flex items-center gap-3"
            >
              <span className="text-2xl">🍽️</span>
              <div>
                <p className="text-sm font-medium text-foreground">Usar &ldquo;{search.trim()}&rdquo;</p>
                <p className="text-xs text-muted-foreground">Agregar como comida libre</p>
              </div>
            </button>
          )}

          {/* Prev dinner related group (main only) */}
          {!noResults && prevRelated.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  {isBaby ? "🍼 Adaptado de lo de anoche" : "♻️ Con lo de anoche"}
                </span>
                <span className="text-xs text-muted-foreground">
                  (basado en: {prevDinner?.name})
                </span>
              </div>
              <div className="space-y-2">
                {prevRelated.map((meal) => (
                  <MealRow key={meal.id} meal={meal} onSelect={onSelect} onClose={onClose} isBaby={isBaby} />
                ))}
              </div>
            </div>
          )}

          {/* Main meals by category */}
          {!isSide && !noResults && Object.entries(grouped).map(([cat, meals]) => (
            <div key={cat}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{cat}</p>
              <div className="space-y-2">
                {meals.map((meal) => (
                  <MealRow key={meal.id} meal={meal} onSelect={onSelect} onClose={onClose} isBaby={isBaby} />
                ))}
              </div>
            </div>
          ))}

          {/* Sides list */}
          {isSide && !noResults && filtered.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Guarniciones</p>
              <div className="space-y-2">
                {filtered.map((meal) => (
                  <MealRow key={meal.id} meal={meal} onSelect={onSelect} onClose={onClose} isBaby={isBaby} />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function MealRow({ meal, onSelect, onClose, isBaby }: {
  meal: Meal;
  onSelect: (m: Meal) => void;
  onClose: () => void;
  isBaby: boolean;
}) {
  return (
    <button
      onClick={() => { onSelect(meal); onClose(); }}
      className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-dinner-bg transition-all"
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
