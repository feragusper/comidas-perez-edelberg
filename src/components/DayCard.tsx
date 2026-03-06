import { useState } from "react";
import { DayPlan } from "@/hooks/useMealPlan";
import { Meal, BabySafety, SUNDAY_DINNER } from "@/data/meals";
import { MealPicker } from "./MealPicker";
import { cn } from "@/lib/utils";
import { Plus, Baby, Trash2, Lock, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

interface DayCardProps {
  dayPlan: DayPlan;
  dayIndex: number;
  prevDinner: Meal | null; // previous day's dinner for grouping suggestions
  onSetDinner: (meal: Meal | null) => void;
  onSetDinnerNote: (note: string) => void;
  onSetLunch: (meal: Meal | null) => void;
  onSetLunchNote: (note: string) => void;
  onResetLunch: () => void;
  onSetBabyDinner: (meal: Meal | null) => void;
  onSetBabyDinnerNote: (note: string) => void;
  onSetBabyLunch: (meal: Meal | null) => void;
  onSetBabyLunchNote: (note: string) => void;
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

function NoteInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Agregar detalle..."}
      className="flex-1 min-w-0 text-xs bg-transparent border-0 border-b border-border focus:border-primary/50 focus:outline-none placeholder:text-muted-foreground/50 text-foreground py-0.5 transition-colors"
    />
  );
}

function MealDisplay({
  meal, note, onChangeNote, onRemove, onChangeMeal,
  babySafety, isBaby,
}: {
  meal: Meal;
  note: string;
  onChangeNote: (v: string) => void;
  onRemove: () => void;
  onChangeMeal: () => void;
  babySafety?: boolean;
  isBaby?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-2">
        <span className="text-xl">{meal.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{meal.name}</p>
          {babySafety && meal.babySafety !== "unsafe" && (
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium inline-block mt-0.5", safetyBg[meal.babySafety])}>
              {safetyIcon[meal.babySafety]} {isBaby ? "Apto" : "Apto bebé"}
            </span>
          )}
        </div>
        <button onClick={onRemove} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
      <div className="flex items-center gap-2 pl-8">
        <NoteInput value={note} onChange={onChangeNote} placeholder="Agregar detalle..." />
        <button onClick={onChangeMeal} className="shrink-0 text-xs text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors">
          Cambiar
        </button>
      </div>
    </div>
  );
}

export function DayCard({
  dayPlan, dayIndex, prevDinner,
  onSetDinner, onSetDinnerNote,
  onSetLunch, onSetLunchNote, onResetLunch,
  onSetBabyDinner, onSetBabyDinnerNote,
  onSetBabyLunch, onSetBabyLunchNote,
}: DayCardProps) {
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

  const pickerMode: "adult" | "baby" =
    pickerTarget === "babyDinner" || pickerTarget === "babyLunch" ? "baby" : "adult";

  const pickerPrevDinner =
    pickerTarget === "lunch" || pickerTarget === "babyLunch" ? prevDinner : null;

  return (
    <>
      <div className={cn(
        "rounded-2xl border overflow-hidden shadow-card transition-all",
        isSunday ? "border-sunday-accent/40 bg-sunday-bg" : "border-border bg-card"
      )}>
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 cursor-pointer select-none",
            isSunday ? "bg-sunday-accent/10" : "bg-muted/40"
          )}
          onClick={() => setExpanded(!expanded)}
        >
          <span className={cn("text-base font-bold", isSunday ? "text-sunday-accent" : "text-foreground")}
            style={{ fontFamily: 'Fraunces, serif' }}>
            {dayPlan.day}
          </span>
          {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>

        {expanded && (
          <div className="p-4 space-y-3">
            {/* ── LUNCH ── */}
            {(
              <div className="rounded-xl bg-lunch-bg/70 p-3 border border-secondary/20 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary">☀ Almuerzo</span>
                  {!dayPlan.lunchOverridden && dayPlan.lunch && (
                    <span className="text-xs text-muted-foreground italic">sugerido de anoche</span>
                  )}
                </div>

                {/* Adults */}
                <div>
                  {dayPlan.lunch ? (
                    <div className="space-y-1">
                      <MealDisplay
                        meal={dayPlan.lunch} note={dayPlan.lunchNote}
                        onChangeNote={onSetLunchNote} onRemove={() => onSetLunch(null)}
                        onChangeMeal={() => setPickerTarget("lunch")}
                        babySafety
                      />
                      {dayPlan.lunchOverridden && (
                        <button onClick={onResetLunch} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-secondary transition-colors pl-8">
                          <RotateCcw size={11} /> Restaurar sugerencia
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setPickerTarget("lunch")}
                      className="w-full flex items-center gap-2 text-sm text-muted-foreground border-2 border-dashed border-secondary/30 rounded-xl p-3 hover:border-secondary/60 hover:text-secondary hover:bg-lunch-bg transition-all"
                    >
                      <Plus size={15} /> Elegir almuerzo
                    </button>
                  )}
                </div>

                {/* Nico */}
                <div className="border-t border-secondary/15 pt-2">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Baby size={12} className="text-baby-safe" />
                    <span className="text-xs font-semibold text-baby-safe">Nico</span>
                  </div>
                  {dayPlan.babyLunch ? (
                    <MealDisplay
                      meal={dayPlan.babyLunch} note={dayPlan.babyLunchNote}
                      onChangeNote={onSetBabyLunchNote} onRemove={() => onSetBabyLunch(null)}
                      onChangeMeal={() => setPickerTarget("babyLunch")}
                      isBaby
                    />
                  ) : (
                    <button
                      onClick={() => setPickerTarget("babyLunch")}
                      className="w-full flex items-center gap-2 text-xs text-muted-foreground border border-dashed border-baby-safe/30 rounded-xl px-3 py-2 hover:border-baby-safe/60 hover:text-baby-safe hover:bg-baby-safe-bg/40 transition-all"
                    >
                      <Plus size={13} /> Elegir comida de Nico
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── DINNER ── */}
            <div className="rounded-xl bg-dinner-bg/70 p-3 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">🌙 Cena</span>
                {isSunday && (
                  <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                    <Lock size={10} /> sugerido: pasta
                  </span>
                )}
              </div>

              {/* Adults */}
              <div>
                {dayPlan.dinner ? (
                  <div className="space-y-1">
                    <MealDisplay
                      meal={dayPlan.dinner} note={dayPlan.dinnerNote}
                      onChangeNote={onSetDinnerNote} onRemove={() => onSetDinner(null)}
                      onChangeMeal={() => setPickerTarget("dinner")}
                      babySafety
                    />
                    {isSunday && dayPlan.dinner.id !== SUNDAY_DINNER.id && (
                      <button onClick={() => onSetDinner(SUNDAY_DINNER)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-sunday-accent transition-colors pl-8">
                        <RotateCcw size={11} /> Restaurar pasta
                      </button>
                    )}
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
              </div>

              {/* Nico */}
              <div className="border-t border-primary/15 pt-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Baby size={12} className="text-baby-safe" />
                  <span className="text-xs font-semibold text-baby-safe">Nico</span>
                </div>
                {dayPlan.babyDinner ? (
                  <MealDisplay
                    meal={dayPlan.babyDinner} note={dayPlan.babyDinnerNote}
                    onChangeNote={onSetBabyDinnerNote} onRemove={() => onSetBabyDinner(null)}
                    onChangeMeal={() => setPickerTarget("babyDinner")}
                    isBaby
                  />
                ) : (
                  <button
                    onClick={() => setPickerTarget("babyDinner")}
                    className="w-full flex items-center gap-2 text-xs text-muted-foreground border border-dashed border-baby-safe/30 rounded-xl px-3 py-2 hover:border-baby-safe/60 hover:text-baby-safe hover:bg-baby-safe-bg/40 transition-all"
                  >
                    <Plus size={13} /> Elegir cena de Nico
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {pickerTarget && (
        <MealPicker
          mode={pickerMode}
          prevDinner={pickerPrevDinner}
          onSelect={handlePickerSelect}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </>
  );
}
