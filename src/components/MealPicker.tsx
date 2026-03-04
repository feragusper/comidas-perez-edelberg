import { useState } from "react";
import { Meal, MEALS, MEAL_CATEGORIES, BabySafety } from "@/data/meals";
import { cn } from "@/lib/utils";
import { X, Search, Baby } from "lucide-react";

interface MealPickerProps {
  onSelect: (meal: Meal) => void;
  onClose: () => void;
}

const safetyColors: Record<BabySafety, string> = {
  safe: "text-baby-safe bg-baby-safe-bg border-baby-safe/30",
  caution: "text-baby-caution bg-baby-caution-bg border-baby-caution/30",
  unsafe: "text-destructive bg-destructive/10 border-destructive/30",
};

const safetyLabel: Record<BabySafety, string> = {
  safe: "✓ Apto bebé",
  caution: "⚠ Con cuidado",
  unsafe: "✗ No apto",
};

export function MealPicker({ onSelect, onClose }: MealPickerProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = MEALS.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !activeCategory || m.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const grouped = MEAL_CATEGORIES.reduce<Record<string, Meal[]>>((acc, cat) => {
    const meals = filtered.filter((m) => m.category === cat);
    if (meals.length) acc[cat] = meals;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-card rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3">
          <h3 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'Fraunces, serif' }}>
            Elegir comida
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
              placeholder="Buscar comida..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="px-5 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              !activeCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            Todas
          </button>
          {MEAL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Meals list */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          {Object.entries(grouped).map(([cat, meals]) => (
            <div key={cat}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{cat}</p>
              <div className="space-y-2">
                {meals.map((meal) => (
                  <button
                    key={meal.id}
                    onClick={() => { onSelect(meal); onClose(); }}
                    className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-dinner-bg transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{meal.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">{meal.name}</p>
                        {meal.babyNote && (
                          <div className="flex items-center gap-1 mt-1">
                            <Baby size={11} className="text-baby-safe shrink-0" />
                            <p className="text-xs text-muted-foreground truncate">{meal.babyNote}</p>
                          </div>
                        )}
                      </div>
                      <span className={cn("shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium", safetyColors[meal.babySafety])}>
                        {safetyLabel[meal.babySafety]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-4xl mb-2">🔍</p>
              <p className="text-sm">No encontramos comidas con esa búsqueda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
