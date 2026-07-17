import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { usePantry, normalizePantryName, type PantryItem } from "@/hooks/usePantry";
import { useMeals } from "@/hooks/useMeals";
import { useIngredients } from "@/hooks/useIngredients";
import { isIngredient } from "@/data/food";
import { parseTag } from "@/data/foodTaxonomy";
import { supabase } from "@/integrations/supabase/client";
import { MealPicker } from "@/components/MealPicker";
import { Plus, X, Sparkles, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Suggestion {
  name: string;
  emoji: string;
  description: string;
  isKeto?: boolean;
}

/** Subtítulos dentro de "Ingredientes", en el orden en que se muestran. */
const INGREDIENT_SUBGROUPS = ["Carnes", "Verdura", "Fruta", "Otros"] as const;
type PantryGroup = (typeof INGREDIENT_SUBGROUPS)[number] | "Comidas";

export default function DonBacilio() {
  const { items, addItem, removeItem } = usePantry();
  const { meals } = useMeals();
  const { ingredients, addIngredient } = useIngredients();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  /**
   * Clasifica un ítem de la despensa matcheando su nombre contra los catálogos:
   * ingrediente → subtítulo según sus tags; comida del catálogo → "Comidas".
   */
  const groupOf = (item: PantryItem): PantryGroup => {
    const n = normalizePantryName(item.name);
    const ing = ingredients.find((i) => normalizePantryName(i.name) === n);
    if (!ing) {
      return meals.some((m) => normalizePantryName(m.name) === n) ? "Comidas" : "Otros";
    }
    const cats = new Set((ing.tags ?? []).map((t) => parseTag(t)?.category));
    if (cats.has("Proteína")) return "Carnes";
    if (cats.has("Verdura")) return "Verdura";
    if (cats.has("Fruta")) return "Fruta";
    return "Otros";
  };

  const grouped = new Map<PantryGroup, PantryItem[]>();
  for (const it of items) {
    const g = groupOf(it);
    grouped.set(g, [...(grouped.get(g) ?? []), it]);
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, "es"));
  }
  const hasIngredients = INGREDIENT_SUBGROUPS.some((g) => (grouped.get(g)?.length ?? 0) > 0);

  const renderRow = (it: PantryItem) => (
    <div key={it.name} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/50">
      <span className="shrink-0">{it.emoji}</span>
      <span className="text-sm text-foreground min-w-0 truncate">{it.name}</span>
      <button
        onClick={() => removeItem(it.name)}
        className="ml-auto shrink-0 p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        aria-label={`Quitar ${it.name}`}
      >
        <X size={14} />
      </button>
    </div>
  );

  const handleGenerate = async () => {
    if (items.length === 0) {
      toast({ title: "Agregá algo a la despensa primero", variant: "destructive" });
      return;
    }
    setLoading(true);
    setSuggestions([]);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-from-ingredients", {
        body: { ingredients: items.map((i) => i.name) },
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

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="px-4 sm:px-8 py-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Don Bacilio
        </h1>
        <p className="text-sm text-muted-foreground mb-5">
          Lo que ya tenemos en casa. Se usa para las sugerencias y para marcar lo que ya tenés en la lista del súper.
        </p>

        <Button variant="outline" className="w-full" onClick={() => setPickerOpen(true)}>
          <Plus size={16} className="mr-1" /> Agregar alimento
        </Button>

        {pickerOpen && (
          <MealPicker
            mode="adult"
            step="main"
            extraMeals={meals}
            ingredients={ingredients}
            onCustomIngredient={(ing) => void addIngredient(ing)}
            onSelect={(food) => {
              // Ingrediente suelto: directo a la despensa.
              if (isIngredient(food)) {
                addItem({ name: food.name, emoji: food.emoji });
                return;
              }
              // Comida: se despliega en sus ingredientes componentes.
              const components = (food.ingredientIds ?? [])
                .map((id) => ingredients.find((i) => i.id === id))
                .filter((i): i is NonNullable<typeof i> => i != null);
              if (components.length === 0) {
                addItem({ name: food.name, emoji: food.emoji });
                return;
              }
              components.forEach((ing) => addItem({ name: ing.name, emoji: ing.emoji }));
              toast({ title: `${food.emoji} ${food.name}`, description: `Agregué sus ${components.length} ingredientes a la despensa.` });
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}

        <div className="mt-5">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-xl">
              Todavía no cargaste nada. Agregá lo que tenés en la despensa o el freezer.
            </p>
          ) : (
            <div className="space-y-6">
              {hasIngredients && (
                <section>
                  <h2 className="text-base font-semibold text-foreground mb-2">Ingredientes</h2>
                  <div className="space-y-4">
                    {INGREDIENT_SUBGROUPS.map((sub) => {
                      const list = grouped.get(sub);
                      if (!list || list.length === 0) return null;
                      return (
                        <div key={sub}>
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">{sub}</h3>
                          <div className="space-y-1">{list.map(renderRow)}</div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
              {(grouped.get("Comidas")?.length ?? 0) > 0 && (
                <section>
                  <h2 className="text-base font-semibold text-foreground mb-2">Comidas</h2>
                  <div className="space-y-1">{grouped.get("Comidas")!.map(renderRow)}</div>
                </section>
              )}
            </div>
          )}
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || items.length === 0}
          className="w-full mt-6"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin mr-2" /> Generando…</>
          ) : (
            <><Sparkles size={16} className="mr-2" /> Sugerir comidas con lo que tenemos</>
          )}
        </Button>

        {suggestions.length > 0 && (
          <div className="mt-6 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Ideas con la despensa</h2>
            {suggestions.map((s, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                <span className="text-2xl shrink-0">{s.emoji}</span>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
