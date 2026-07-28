import { useEffect, useMemo, useState } from "react";
import { Meal } from "@/data/meals";
import { Ingredient, isIngredient } from "@/data/food";
import { normalizePantryName } from "@/hooks/usePantry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Check, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoImportWizardProps {
  /** Nombres interpretados de la foto de la pizarra. */
  items: string[];
  meals: Meal[];
  ingredients: Ingredient[];
  /** Agregar una comida/ingrediente del catálogo (una comida se expande en ingredientes). */
  onAddFood: (food: Meal) => void;
  /** Agregar como texto suelto, sin vínculo con el catálogo. */
  onAddFree: (name: string) => void;
  onClose: () => void;
}

const words = (s: string) => s.split(" ").filter(Boolean);
/** true si todas las palabras de `a` están en `b` (a ⊆ b, por palabras completas). */
function wordsSubset(a: string, b: string): boolean {
  const B = new Set(words(b));
  const A = words(a);
  return A.length > 0 && A.every((w) => B.has(w));
}

/**
 * Busca la mejor coincidencia de un nombre en el catálogo (ingredientes primero).
 * El match es por palabras completas, no por substring, para no confundir
 * "leche" con "arroz con leche". Una comida sólo matchea si su nombre entero
 * cabe dentro de lo escrito (no al revés).
 */
function findMatch(name: string, meals: Meal[], ingredients: Ingredient[]): Meal | null {
  const t = normalizePantryName(name);
  if (!t) return null;
  const ingExact = ingredients.find((i) => normalizePantryName(i.name) === t);
  if (ingExact) return ingExact;
  const mealExact = meals.find((m) => normalizePantryName(m.name) === t);
  if (mealExact) return mealExact;
  const ingPart = ingredients.find((i) => {
    const n = normalizePantryName(i.name);
    return n !== "" && (wordsSubset(n, t) || wordsSubset(t, n));
  });
  if (ingPart) return ingPart;
  const mealPart = meals.find((m) => {
    const n = normalizePantryName(m.name);
    return n !== "" && wordsSubset(n, t);
  });
  return mealPart ?? null;
}

export function PhotoImportWizard({ items, meals, ingredients, onAddFood, onAddFree, onClose }: PhotoImportWizardProps) {
  const [index, setIndex] = useState(0);
  const [name, setName] = useState(items[0] ?? "");
  const [useCatalog, setUseCatalog] = useState(true);
  const [addedCount, setAddedCount] = useState(0);

  // Al cambiar de ítem, precargar su texto y volver a preferir el catálogo.
  useEffect(() => {
    setName(items[index] ?? "");
    setUseCatalog(true);
  }, [index, items]);

  const match = useMemo(() => findMatch(name, meals, ingredients), [name, meals, ingredients]);
  const catalogChosen = useCatalog && !!match;
  const isLast = index >= items.length - 1;

  const next = () => {
    if (isLast) onClose();
    else setIndex((i) => i + 1);
  };

  const add = () => {
    if (catalogChosen && match) onAddFood(match);
    else if (name.trim()) onAddFree(name.trim());
    else return next();
    setAddedCount((c) => c + 1);
    next();
  };

  if (items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-base font-semibold text-foreground">Revisar lo anotado</h2>
          <button onClick={onClose} className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Ítem <span className="font-semibold text-foreground">{index + 1}</span> de {items.length}
            {addedCount > 0 && <> · {addedCount} agregado{addedCount === 1 ? "" : "s"}</>}
          </p>

          <div>
            <label className="text-xs font-medium text-muted-foreground">¿Qué anotaron acá?</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del ítem" className="mt-1" autoFocus />
          </div>

          <div className="space-y-2">
            {match && (
              <button
                onClick={() => setUseCatalog(true)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  catalogChosen ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                )}
              >
                <span className="text-lg shrink-0">{match.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{match.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {isIngredient(match) ? "Ingrediente del catálogo" : "Comida del catálogo · se agregan sus ingredientes"}
                  </p>
                </div>
                {catalogChosen && <Check size={16} className="text-primary shrink-0" />}
              </button>
            )}

            <button
              onClick={() => setUseCatalog(false)}
              className={cn(
                "w-full flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors",
                !catalogChosen ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              )}
            >
              <span className="text-lg shrink-0">🛒</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{name.trim() || "—"}</p>
                <p className="text-[11px] text-muted-foreground">Suelto, tal cual (sin vincular al catálogo)</p>
              </div>
              {!catalogChosen && <Check size={16} className="text-primary shrink-0" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-t">
          <Button variant="ghost" onClick={next} className="flex-1">
            <SkipForward size={15} className="mr-1.5" /> Saltar
          </Button>
          <Button onClick={add} disabled={!name.trim()} className="flex-1">
            {isLast ? "Agregar y terminar" : "Agregar y siguiente"}
          </Button>
        </div>
      </div>
    </div>
  );
}
