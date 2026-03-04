import { useMealPlan, WeekKey } from "@/hooks/useMealPlan";
import { DayCard } from "@/components/DayCard";
import { Baby, RotateCcw, CalendarDays, ChevronRight } from "lucide-react";
import heroFood from "@/assets/hero-food.jpg";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Index() {
  const [activeWeek, setActiveWeek] = useState<WeekKey>("current");
  const { plan, setDinner, toggleBabyDinner, toggleBabyLunch, resetPlan } = useMealPlan(activeWeek);
  const [showReset, setShowReset] = useState(false);

  const babyMeals = plan.filter((d) => d.babyEatsDinner || d.babyEatsLunch);
  const plannedDays = plan.filter((d) => d.dinner !== null).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <img
          src={heroFood}
          alt="Cocina familiar"
          className="w-full h-48 sm:h-64 object-cover"
          style={{ objectPosition: "center 60%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 sm:px-8 sm:pb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Menú de la semana 🍽️
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Cenas para los dos · Almuerzos de sobras · Adaptado para bebé
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-4 sm:px-8 py-3 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            <span className="font-semibold text-primary">{plannedDays}</span>/7 cenas planificadas
          </span>
          <span className="text-muted-foreground">·</span>
          <div className="flex items-center gap-1 text-baby-safe">
            <Baby size={14} />
            <span className="font-semibold">{babyMeals.length}</span>
            <span className="text-muted-foreground">comidas del bebé</span>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => setShowReset(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <RotateCcw size={13} />
              Reiniciar
            </button>
          </div>
        </div>
      </div>

      {/* Baby info banner */}
      <div className="px-4 sm:px-8 pt-4 max-w-2xl mx-auto">
        <div className="rounded-xl bg-baby-safe-bg border border-baby-safe/25 p-3 flex items-start gap-3">
          <Baby size={18} className="text-baby-safe mt-0.5 shrink-0" />
          <div className="text-xs text-foreground/80">
            <span className="font-semibold text-baby-safe">Guía para el bebé (1 año):</span>
            {" "}Sin sal agregada · Sin miel · Sin leche entera en grandes cantidades · Sin nueces enteras · Texturas blandas.
            {" "}<span className="font-medium">Los almuerzos son siempre las sobras de la cena anterior.</span>
          </div>
        </div>
      </div>

      {/* Days grid */}
      <div className="px-4 sm:px-8 py-4 max-w-2xl mx-auto space-y-3 pb-20">
        {plan.map((dayPlan, idx) => (
          <DayCard
            key={dayPlan.day}
            dayPlan={dayPlan}
            dayIndex={idx}
            onSetDinner={(meal) => setDinner(idx, meal)}
            onToggleBabyDinner={() => toggleBabyDinner(idx)}
            onToggleBabyLunch={() => toggleBabyLunch(idx)}
          />
        ))}
      </div>

      {/* Reset confirmation */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setShowReset(false)} />
          <div className="relative z-10 bg-card rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: 'Fraunces, serif' }}>
              ¿Reiniciar la semana?
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              Se borrará toda la planificación excepto la pasta del domingo.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReset(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { resetPlan(); setShowReset(false); }}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
