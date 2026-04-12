import { useState } from "react";
import { useCustomMeals } from "@/hooks/useCustomMeals";
import { Meal } from "@/data/meals";
import { Link } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const FOOD_EMOJIS = [
  "🍽️", "🍗", "🥩", "🍖", "🥓", "🌭", "🍔", "🍟", "🍕", "🫓",
  "🥪", "🌮", "🌯", "🫔", "🥗", "🥘", "🫕", "🍲", "🍛", "🍜",
  "🍝", "🍣", "🍤", "🍱", "🥟", "🍚", "🍙", "🥚", "🧀", "🥦",
  "🥬", "🥕", "🌽", "🍠", "🥑", "🍅", "🫑", "🧅", "🧄", "🍄",
  "🐟", "🐠", "🦐", "🦑", "🥫", "🫘", "🥜", "🫒", "🍞", "🥖",
  "🥐", "🧇", "🥞", "🍳", "🫙", "🥣", "🧆", "🥙", "🫛",
];

export default function CustomMeals() {
  const { customMeals, updateCustomMealEmoji, deleteCustomMeal } = useCustomMeals();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleEmojiSelect = async (mealId: string, emoji: string) => {
    await updateCustomMealEmoji(mealId, emoji);
    setEditingId(null);
  };

  const handleDelete = async (mealId: string) => {
    await deleteCustomMeal(mealId);
    setConfirmDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-4 sm:px-8 py-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/" className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft size={18} className="text-muted-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>
            Mis comidas personalizadas
          </h1>
        </div>
      </div>

      <div className="px-4 sm:px-8 py-6 max-w-2xl mx-auto">
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
            {customMeals.map((meal) => (
              <div key={meal.id}>
                <div
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border border-border bg-card transition-all",
                    editingId === meal.id && "rounded-b-none border-b-0"
                  )}
                >
                  <button
                    onClick={() => setEditingId(editingId === meal.id ? null : meal.id)}
                    className="text-2xl hover:scale-110 transition-transform cursor-pointer"
                    title="Cambiar ícono"
                  >
                    {meal.emoji}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{meal.name}</p>
                    <p className="text-xs text-muted-foreground">{meal.category}{meal.isSide ? " · Guarnición" : ""}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingId(editingId === meal.id ? null : meal.id)}
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
                {editingId === meal.id && (
                  <div className="p-4 border border-border border-t-0 rounded-b-xl bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Elegí un ícono:</p>
                    <div className="grid grid-cols-10 sm:grid-cols-12 gap-1">
                      {FOOD_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiSelect(meal.id, emoji)}
                          className={cn(
                            "text-xl p-1.5 rounded-lg transition-all hover:bg-card",
                            meal.emoji === emoji && "bg-primary/15 ring-2 ring-primary/40"
                          )}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
