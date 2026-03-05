import { useState } from "react";
import { DayPlan } from "@/hooks/useMealPlan";
import { Meal, BabySafety, SUNDAY_DINNER } from "@/data/meals";
import { MealPicker } from "./MealPicker";
import { cn } from "@/lib/utils";
import { Plus, Baby, Trash2, Lock, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

interface DayCardProps {
  dayPlan: DayPlan;
  dayIndex: number;
  onSetDinner: (meal: Meal | null) => void;
  onSetLunch: (meal: Meal | null) => void;
  onResetLunch: () => void;
  onSetBabyDinner: (meal: Meal | null) => void;
  onSetBabyLunch: (meal: Meal | null) => void;
}

const safetyBg: Record<BabySafety, string> = {
  safe: "bg-baby-safe-bg text-baby-safe",
  caution: "bg-baby-caution-bg text-baby-caution",
  unsafe: "bg-destructive/10 text-destructive",
};

const safetyIcon: Record<BabySafety, string> = {
  safe: "✓",
  caution: "⚠",
  unsafe: "✗",
};

type PickerTarget = "dinner" | "lunch" | "babyDinner" | "babyLunch" | null;

export function DayCard({ dayPlan, dayIndex, onSetDinner, onSetLunch, onResetLunch, onSetBabyDinner, onSetBabyLunch }: DayCardProps) {
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [expanded, setExpanded] = useState(true);
  const isSunday = dayPlan.day === "Domingo";
  const isMonday = dayIndex === 0;

  const handlePickerSelect = (meal: Meal) => {
    if (pickerTarget === "dinner") onSetDinner(meal);
    else if (pickerTarget === "lunch") onSetLunch(meal);
    else if (pickerTarget === "babyDinner") onSetBabyDinner(meal);
    else if (pickerTarget === "babyLunch") onSetBabyLunch(meal);
    setPickerTarget(null);
  };

  const lunchMeal = dayPlan.lunch;

  return (
    <>
      <div className={cn(
        "rounded-2xl border overflow-hidden shadow-card transition-all",
        isSunday ? "border-sunday-accent/40 bg-sunday-bg" : "border-border bg-card"
      )}>
        {/* Day header */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 cursor-pointer select-none",
            isSunday ? "bg-sunday-accent/10" : "bg-muted/40"
          )}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <span className={cn("text-base font-bold", isSunday ? "text-sunday-accent" : "text-foreground")}
              style={{ fontFamily: 'Fraunces, serif' }}>
              {dayPlan.day}
            </span>
          </div>
          {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>

        {expanded && (
          <div className="p-4 space-y-3">
            {/* LUNCH row */}
            {!isMonday && (
              <div className="rounded-xl bg-lunch-bg/70 p-3 border border-secondary/20 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary">☀ Almuerzo</span>
                  {!dayPlan.lunchOverridden && lunchMeal && (
                    <span className="text-xs text-muted-foreground italic">sugerido de anoche</span>
                  )}
                </div>

                {/* Adults lunch */}
                {lunchMeal ? (
                  <div className="flex items-start gap-2">
                    <span className="text-xl">{lunchMeal.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{lunchMeal.name}</p>
                      {lunchMeal.babySafety !== "unsafe" && (
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium inline-block mt-1", safetyBg[lunchMeal.babySafety])}>
                          {safetyIcon[lunchMeal.babySafety]} Apto bebé
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button
                        onClick={() => onSetLunch(null)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                      {dayPlan.lunchOverridden && (
                        <button
                          onClick={onResetLunch}
                          className="p-1 text-muted-foreground hover:text-secondary transition-colors"
                          title="Volver a sugerencia"
                        >
                          <RotateCcw size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setPickerTarget("lunch")}
                    className="w-full flex items-center gap-2 text-sm text-muted-foreground border-2 border-dashed border-secondary/30 rounded-xl p-3 hover:border-secondary/60 hover:text-secondary hover:bg-lunch-bg transition-all"
                  >
                    <Plus size={16} />
                    Elegir almuerzo
                  </button>
                )}
                {lunchMeal && (
                  <button
                    onClick={() => setPickerTarget("lunch")}
                    className="text-xs text-secondary/70 hover:text-secondary transition-colors underline underline-offset-2"
                  >
                    Cambiar
                  </button>
                )}

                {/* Baby lunch */}
                <div className="border-t border-secondary/15 pt-2 mt-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Baby size={12} className="text-baby-safe" />
                    <span className="text-xs font-semibold text-baby-safe">Nico</span>
                  </div>
                  {dayPlan.babyLunch ? (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{dayPlan.babyLunch.emoji}</span>
                      <p className="text-sm flex-1 text-foreground">{dayPlan.babyLunch.name}</p>
                      <button
                        onClick={() => onSetBabyLunch(null)}
                        className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                      <button
                        onClick={() => setPickerTarget("babyLunch")}
                        className="text-xs text-primary/70 hover:text-primary underline underline-offset-2 transition-colors"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPickerTarget("babyLunch")}
                      className="w-full flex items-center gap-2 text-xs text-muted-foreground border border-dashed border-baby-safe/30 rounded-xl px-3 py-2 hover:border-baby-safe/60 hover:text-baby-safe hover:bg-baby-safe-bg/40 transition-all"
                    >
                      <Plus size={13} />
                      Elegir comida de Nico
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* DINNER row */}
            <div className="rounded-xl bg-dinner-bg/70 p-3 border border-primary/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">🌙 Cena</span>
                {isSunday && !dayPlan.dinner && (
                  <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                    <Lock size={10} /> sugerido: pasta
                  </span>
                )}
              </div>

              {/* Adults dinner */}
              {dayPlan.dinner ? (
                <div className="flex items-start gap-2">
                  <span className="text-xl">{dayPlan.dinner.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{dayPlan.dinner.name}</p>
                    {dayPlan.dinner.babySafety !== "unsafe" && (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", safetyBg[dayPlan.dinner.babySafety])}>
                          {safetyIcon[dayPlan.dinner.babySafety]} Apto bebé
                        </span>
                        {dayPlan.dinner.babyNote && (
                          <span className="text-xs text-muted-foreground">{dayPlan.dinner.babyNote}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={() => onSetDinner(null)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    {isSunday && dayPlan.dinner.id !== SUNDAY_DINNER.id && (
                      <button
                        onClick={() => onSetDinner(SUNDAY_DINNER)}
                        className="p-1 text-muted-foreground hover:text-sunday-accent transition-colors"
                        title="Volver a pasta"
                      >
                        <RotateCcw size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setPickerTarget("dinner")}
                  className="w-full flex items-center gap-2 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl p-3 hover:border-primary/50 hover:text-primary hover:bg-dinner-bg transition-all"
                >
                  <Plus size={16} />
                  {isSunday ? "Elegir cena (sugerido: pasta)" : "Elegir cena"}
                </button>
              )}
              {dayPlan.dinner && (
                <button
                  onClick={() => setPickerTarget("dinner")}
                  className="text-xs text-primary/70 hover:text-primary transition-colors underline underline-offset-2"
                >
                  Cambiar
                </button>
              )}

              {/* Baby dinner */}
              <div className="border-t border-primary/15 pt-2 mt-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Baby size={12} className="text-baby-safe" />
                  <span className="text-xs font-semibold text-baby-safe">Nico</span>
                </div>
                {dayPlan.babyDinner ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{dayPlan.babyDinner.emoji}</span>
                    <p className="text-sm flex-1 text-foreground">{dayPlan.babyDinner.name}</p>
                    <button
                      onClick={() => onSetBabyDinner(null)}
                      className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => setPickerTarget("babyDinner")}
                      className="text-xs text-primary/70 hover:text-primary underline underline-offset-2 transition-colors"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setPickerTarget("babyDinner")}
                    className="w-full flex items-center gap-2 text-xs text-muted-foreground border border-dashed border-baby-safe/30 rounded-xl px-3 py-2 hover:border-baby-safe/60 hover:text-baby-safe hover:bg-baby-safe-bg/40 transition-all"
                  >
                    <Plus size={13} />
                    Elegir cena de Nico
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {pickerTarget && (
        <MealPicker
          onSelect={handlePickerSelect}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </>
  );
}
