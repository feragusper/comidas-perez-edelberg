import { useEffect, useState } from "react";
import { Meal } from "@/data/meals";
import { Ingredient, INGREDIENT_CATEGORY, ingredientSlug } from "@/data/food";
import { MealPicker } from "@/components/MealPicker";
import { EmojiPicker } from "@/components/EmojiPicker";
import { TagPicker } from "@/components/TagPicker";
import { useKeyboardInset, useBodyScrollLock } from "@/hooks/useKeyboardInset";
import { cn } from "@/lib/utils";
import { X, ChefHat, Carrot, Plus, Leaf } from "lucide-react";

export type WizardKind = "meal" | "ingredient";

interface FoodWizardProps {
  kind: WizardKind;
  /** Permite alternar comida/ingrediente (solo en alta desde el buscador). */
  allowKindSwitch?: boolean;
  isEdit?: boolean;
  /** Prefill: nombre buscado, o la comida/ingrediente a editar. */
  initial?: Partial<Meal>;
  /** Catálogo de ingredientes para componer comidas. */
  ingredients?: Ingredient[];
  /** Alta de ingredientes anidada (crear uno mientras componés una comida). */
  onCustomIngredient?: (ing: Ingredient) => void;
  onSave: (food: Meal, kind: WizardKind) => void;
  onClose: () => void;
}

/**
 * Wizard único de alta/edición de comidas e ingredientes.
 * Comida: nombre + ícono + ingredientes componentes (+ guarnición).
 * Ingrediente: nombre + ícono + tags de taxonomía (+ keto).
 */
export function FoodWizard({
  kind: initialKind,
  allowKindSwitch = false,
  isEdit = false,
  initial,
  ingredients = [],
  onCustomIngredient,
  onSave,
  onClose,
}: FoodWizardProps) {
  const [kind, setKind] = useState<WizardKind>(initialKind);
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? (initialKind === "ingredient" ? "🥕" : "🍽️"));
  const [ingredientIds, setIngredientIds] = useState<string[]>(initial?.ingredientIds ?? []);
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [isSide, setIsSide] = useState(initial?.isSide ?? false);
  const [isKeto, setIsKeto] = useState(initial?.isKeto ?? false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const kbInset = useKeyboardInset();
  useBodyScrollLock();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !pickerOpen) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, pickerOpen]);

  const isIngredientKind = kind === "ingredient";
  const canSave = name.trim().length > 0;

  const title = isEdit
    ? isIngredientKind ? "Editar ingrediente" : "Editar comida"
    : isIngredientKind ? "Nuevo ingrediente" : "Nueva comida";

  const handleSave = () => {
    if (!canSave) return;
    const trimmed = name.trim();
    if (isIngredientKind) {
      const ing: Ingredient = {
        id: isEdit && initial?.id ? initial.id : ingredientSlug(trimmed),
        name: trimmed,
        emoji,
        category: INGREDIENT_CATEGORY,
        babySafety: initial?.babySafety ?? "caution",
        babyNote: initial?.babyNote,
        isKeto,
        tags,
        kind: "ingredient",
      };
      onSave(ing, "ingredient");
    } else {
      const meal: Meal = {
        id: isEdit && initial?.id ? initial.id : `custom-${Date.now()}`,
        name: trimmed,
        emoji,
        category: initial?.category ?? "Otro",
        babySafety: initial?.babySafety ?? "caution",
        babyNote: initial?.babyNote,
        isKeto: initial?.isKeto ?? false,
        isSide,
        tags: initial?.tags ?? [],
        ingredientIds,
        kind: "meal",
      };
      onSave(meal, "meal");
    }
    onClose();
  };

  const ingredientById = new Map(ingredients.map((i) => [i.id, i]));

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        style={kbInset > 0 ? { paddingBottom: kbInset } : undefined}
      >
        <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 bg-card rounded-t-3xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[min(85dvh,100%)] flex flex-col overflow-hidden border border-border">

          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-3">
            <div className="flex items-center gap-2">
              {isIngredientKind
                ? <Carrot size={18} className="text-secondary" />
                : <ChefHat size={18} className="text-primary" />}
              <h3 className="text-xl font-semibold text-foreground">{title}</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>

          {/* Kind toggle */}
          {allowKindSwitch && !isEdit && (
            <div className="px-5 pb-3 flex gap-2">
              <button
                onClick={() => setKind("meal")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                  !isIngredientKind
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70"
                )}
              >
                <ChefHat size={12} /> Comida
              </button>
              <button
                onClick={() => setKind("ingredient")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                  isIngredientKind
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70"
                )}
              >
                <Carrot size={12} /> Ingrediente
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-4">
            {/* Preview + nombre */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/60 border border-border">
              <span className="text-3xl">{emoji}</span>
              <input
                className="flex-1 bg-transparent text-sm font-medium text-foreground focus:outline-none placeholder:text-muted-foreground"
                placeholder={isIngredientKind ? "Nombre del ingrediente" : "Nombre de la comida"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus={!isEdit}
              />
            </div>

            {/* Ícono */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Ícono</p>
              <EmojiPicker value={emoji} onSelect={setEmoji} />
            </div>

            {isIngredientKind ? (
              <>
                {/* Tags de taxonomía */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Categorías <span className="font-normal normal-case text-muted-foreground/70">(carbo, verdura, etc. — para reportes)</span>
                  </p>
                  <TagPicker value={tags} onChange={setTags} compact />
                </div>

                {/* Keto */}
                <button
                  onClick={() => setIsKeto((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                    isKeto
                      ? "bg-secondary text-secondary-foreground border-secondary"
                      : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70"
                  )}
                >
                  <Leaf size={12} /> Apto keto
                </button>
              </>
            ) : (
              <>
                {/* Ingredientes componentes */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Ingredientes</p>
                  <div className="flex flex-wrap gap-2">
                    {ingredientIds.map((id) => {
                      const ing = ingredientById.get(id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1.5 bg-muted/60 rounded-full pl-3 pr-1.5 py-1.5 text-sm text-foreground"
                        >
                          <span>{ing?.emoji ?? "🥕"}</span>
                          <span>{ing?.name ?? id}</span>
                          <button
                            onClick={() => setIngredientIds((prev) => prev.filter((d) => d !== id))}
                            className="ml-0.5 p-0.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            aria-label={`Quitar ${ing?.name ?? id}`}
                          >
                            <X size={13} />
                          </button>
                        </span>
                      );
                    })}
                    <button
                      onClick={() => setPickerOpen(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-border text-sm text-muted-foreground hover:bg-muted transition-all"
                    >
                      <Plus size={13} /> Agregar
                    </button>
                  </div>
                  {ingredientIds.length === 0 && (
                    <p className="text-[11px] italic text-muted-foreground mt-1.5">
                      Sin ingredientes la comida no aparece en reportes ni súper.
                    </p>
                  )}
                </div>

                {/* Guarnición */}
                <button
                  onClick={() => setIsSide((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                    isSide
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70"
                  )}
                >
                  🥗 Es guarnición
                </button>
              </>
            )}
          </div>

          {/* Confirm */}
          <div className="p-5 pt-2 border-t border-border">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEdit ? "Guardar cambios" : `Confirmar ${emoji} ${name.trim() || "…"}`}
            </button>
          </div>
        </div>
      </div>

      {/* Selector de ingredientes (anidado) */}
      {pickerOpen && (
        <MealPicker
          mode="adult"
          step="main"
          ingredients={ingredients}
          ingredientsOnly
          onCustomIngredient={onCustomIngredient}
          onSelect={(food) => {
            setIngredientIds((prev) => (prev.includes(food.id) ? prev : [...prev, food.id]));
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}
