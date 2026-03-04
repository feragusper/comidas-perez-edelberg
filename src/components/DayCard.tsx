import { useState } from "react";
import { DayPlan } from "@/hooks/useMealPlan";
import { Meal, BabySafety } from "@/data/meals";
import { MealPicker } from "./MealPicker";
import { cn } from "@/lib/utils";
import { Plus, Baby, Trash2, Lock, ChevronDown, ChevronUp } from "lucide-react";

interface DayCardProps {
  dayPlan: DayPlan;
  dayIndex: number;
  onSetDinner: (meal: Meal | null) => void;
  onToggleBabyDinner: () => void;
  onToggleBabyLunch: () => void;
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

export function DayCard({ dayPlan, dayIndex, onSetDinner, onToggleBabyDinner, onToggleBabyLunch }: DayCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const isSunday = dayPlan.day === "Domingo";
  const isMonday = dayIndex === 0;

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
            {isSunday && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-sunday-accent/20 text-sunday-accent font-medium flex items-center gap-1">
                <Lock size={10} /> Pasta fija
              </span>
            )}
          </div>
          {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>

        {expanded && (
          <div className="p-4 space-y-3">
            {/* LUNCH row */}
            <div className="rounded-xl bg-lunch-bg/70 p-3 border border-secondary/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary">☀ Almuerzo</span>
                <span className="text-xs text-muted-foreground">(sobra de anoche)</span>
              </div>
              {isMonday ? (
                <p className="text-sm text-muted-foreground italic">— Sin almuerzo planificado</p>
              ) : dayPlan.lunchFromPrev ? (
                <div className="flex items-start gap-2">
                  <span className="text-xl">{dayPlan.lunchFromPrev.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{dayPlan.lunchFromPrev.name}</p>
                    {dayPlan.lunchFromPrev.babySafety !== "unsafe" && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", safetyBg[dayPlan.lunchFromPrev.babySafety])}>
                          {safetyIcon[dayPlan.lunchFromPrev.babySafety]} Bebé
                        </span>
                        <button
                          onClick={onToggleBabyLunch}
                          className={cn(
                            "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all",
                            dayPlan.babyEatsLunch
                              ? "bg-baby-safe text-white border-baby-safe"
                              : "bg-transparent text-muted-foreground border-border hover:border-baby-safe/60"
                          )}
                        >
                          <Baby size={11} />
                          {dayPlan.babyEatsLunch ? "Come" : "¿Come bebé?"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">— Sin cena planificada ayer</p>
              )}
            </div>

            {/* DINNER row */}
            <div className="rounded-xl bg-dinner-bg/70 p-3 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">🌙 Cena</span>
                {isSunday && <Lock size={11} className="text-sunday-accent" />}
              </div>
              {dayPlan.dinner ? (
                <div className="flex items-start gap-2">
                  <span className="text-xl">{dayPlan.dinner.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{dayPlan.dinner.name}</p>
                    {dayPlan.dinner.babySafety !== "unsafe" && (
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", safetyBg[dayPlan.dinner.babySafety])}>
                          {safetyIcon[dayPlan.dinner.babySafety]} Bebé
                        </span>
                        {dayPlan.dinner.babyNote && (
                          <span className="text-xs text-muted-foreground">{dayPlan.dinner.babyNote}</span>
                        )}
                      </div>
                    )}
                    {dayPlan.dinner.babySafety !== "unsafe" && (
                      <button
                        onClick={onToggleBabyDinner}
                        className={cn(
                          "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all mt-1.5",
                          dayPlan.babyEatsDinner
                            ? "bg-baby-safe text-white border-baby-safe"
                            : "bg-transparent text-muted-foreground border-border hover:border-baby-safe/60"
                        )}
                      >
                        <Baby size={11} />
                        {dayPlan.babyEatsDinner ? "Come con nosotros" : "¿Come bebé?"}
                      </button>
                    )}
                  </div>
                  {!isSunday && (
                    <button
                      onClick={() => onSetDinner(null)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setPickerOpen(true)}
                  className="w-full flex items-center gap-2 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl p-3 hover:border-primary/50 hover:text-primary hover:bg-dinner-bg transition-all"
                >
                  <Plus size={16} />
                  Elegir cena
                </button>
              )}
              {!isSunday && dayPlan.dinner && (
                <button
                  onClick={() => setPickerOpen(true)}
                  className="mt-2 text-xs text-primary/70 hover:text-primary transition-colors underline underline-offset-2"
                >
                  Cambiar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {pickerOpen && (
        <MealPicker
          onSelect={(meal) => onSetDinner(meal)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}
