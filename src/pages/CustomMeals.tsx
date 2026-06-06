import { useState } from "react";
import { useCustomMeals } from "@/hooks/useCustomMeals";
import { useMealPlan } from "@/hooks/useMealPlan";
import { currentWeekKey } from "@/lib/env";
import { Pencil, Trash2, X, Check, Tag, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import { EmojiPicker } from "@/components/EmojiPicker";
import { TagPicker } from "@/components/TagPicker";
import { parseTag, categoryOf } from "@/data/foodTaxonomy";

export default function CustomMeals() {
  const { customMeals, updateCustomMealEmoji, updateCustomMealTags, deleteCustomMeal } = useCustomMeals();
  const { resetPlan } = useMealPlan(currentWeekKey());
  const [editingEmojiId, setEditingEmojiId] = useState<string | null>(null);
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);

  const handleEmojiSelect = async (mealId: string, emoji: string) => {
    await updateCustomMealEmoji(mealId, emoji);
    setEditingEmojiId(null);
  };

  const handleDelete = async (mealId: string) => {
    await deleteCustomMeal(mealId);
    setConfirmDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="px-4 sm:px-8 py-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Playfair Display, serif" }}>
            Mis comidas personalizadas
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
        {customMeals.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-muted-foreground">No tenés comidas personalizadas todavía.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Podés crearlas desde el buscador de comidas escribiendo un nombre nuevo.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {customMeals.map((meal) => {
              const tags = meal.tags ?? [];
              const emojiOpen = editingEmojiId === meal.id;
              const tagsOpen = editingTagsId === meal.id;
              return (
                <div key={meal.id}>
                  <div
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border border-border bg-card transition-all",
                      (emojiOpen || tagsOpen) && "rounded-b-none border-b-0"
                    )}
                  >
                    <button
                      onClick={() => { setEditingEmojiId(emojiOpen ? null : meal.id); setEditingTagsId(null); }}
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
                      {tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag) => {
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
                      ) : (
                        <p className="text-[11px] italic text-muted-foreground">Sin categorías asignadas</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingTagsId(tagsOpen ? null : meal.id); setEditingEmojiId(null); }}
                        className={cn(
                          "p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors",
                          tagsOpen && "bg-primary/10 text-primary"
                        )}
                        title="Editar categorías"
                      >
                        <Tag size={14} />
                      </button>
                      <button
                        onClick={() => { setEditingEmojiId(emojiOpen ? null : meal.id); setEditingTagsId(null); }}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                        title="Cambiar ícono"
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

                  {/* Inline tags picker */}
                  {tagsOpen && (
                    <div className="p-4 border border-border border-t-0 rounded-b-xl bg-muted/30 space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        Asigná categorías y subcategorías (podés elegir varias):
                      </p>
                      <TagPicker
                        value={tags}
                        onChange={(newTags) => updateCustomMealTags(meal.id, newTags)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

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
