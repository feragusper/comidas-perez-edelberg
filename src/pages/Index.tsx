import { useMealPlan, WeekKey } from "@/hooks/useMealPlan";
import { DayCard } from "@/components/DayCard";
import { WeekTableView } from "@/components/WeekTableView";
import { Baby, RotateCcw, CalendarDays, ChevronRight, LayoutList, Table2 } from "lucide-react";
import heroFood from "@/assets/hero-food.jpg";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Index() {
  const [activeWeek, setActiveWeek] = useState<WeekKey>("current");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const {
    plan,
    setDinner, setDinnerSide, setDinnerNote,
    setLunch, setLunchSide, setLunchNote, resetLunch,
    setBabyDinner, setBabyDinnerSide, setBabyDinnerNote, resetBabyDinner,
    setBabyLunch, setBabyLunchSide, setBabyLunchNote, resetBabyLunch,
    resetPlan,
  } = useMealPlan(activeWeek);
  const [showReset, setShowReset] = useState(false);

  const babyMeals = plan.filter((d) => d.babyDinner || d.babyLunch);
  const plannedDays = plan.filter((d) => d.dinner !== null).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <img src={heroFood} alt="Cocina familiar" className="w-full h-48 sm:h-64 object-cover" style={{ objectPosition: "center 60%" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 sm:px-8 sm:pb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Menú de la semana 🍽️</h1>
          <p className="text-muted-foreground text-sm mt-1">Cenas para los dos · Almuerzos de sobras · Adaptado para bebé</p>
        </div>
      </div>

      {/* Week switcher + stats */}
      <div className="px-4 sm:px-8 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className={cn("mx-auto flex gap-1 pt-3 pb-2", viewMode === "table" ? "max-w-full" : "max-w-2xl")}>
          {(["current", "next"] as WeekKey[]).map((week) => (
            <button
              key={week}
              onClick={() => setActiveWeek(week)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                activeWeek === week ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <CalendarDays size={14} />
              {week === "current" ? "Semana actual" : "Próxima semana"}
              {week === "next" && activeWeek !== "next" && <ChevronRight size={13} className="opacity-50" />}
            </button>
          ))}
          {/* View toggle */}
          <div className="ml-auto flex items-center gap-1 bg-muted/60 rounded-xl p-1">
            <button
              onClick={() => setViewMode("cards")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all", viewMode === "cards" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <LayoutList size={13} /> Tarjetas
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all", viewMode === "table" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <Table2 size={13} /> Resumen
            </button>
          </div>
        </div>
        <div className={cn("mx-auto flex items-center gap-4 text-sm pb-2.5", viewMode === "table" ? "max-w-full" : "max-w-2xl")}>
          <span className="text-muted-foreground">
            <span className="font-semibold text-primary">{plannedDays}</span>/7 cenas
          </span>
          <span className="text-muted-foreground">·</span>
          <div className="flex items-center gap-1 text-baby-safe">
            <Baby size={14} />
            <span className="font-semibold">{babyMeals.length}</span>
            <span className="text-muted-foreground">días con comida de Nico</span>
          </div>
          <div className="ml-auto">
            <button onClick={() => setShowReset(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
              <RotateCcw size={13} /> Reiniciar
            </button>
          </div>
        </div>
      </div>

      {/* Baby banner */}
      <div className="px-4 sm:px-8 pt-4 max-w-2xl mx-auto">
        <div className="rounded-xl bg-baby-safe-bg border border-baby-safe/25 p-3 flex items-start gap-3">
          <Baby size={18} className="text-baby-safe mt-0.5 shrink-0" />
          <p className="text-xs text-foreground/80">
            <span className="font-semibold text-baby-safe">Guía para Nico (1 año):</span>
            {" "}Sin sal · Sin miel · Sin nueces enteras · Texturas blandas · Leche entera con moderación.
          </p>
        </div>
      </div>

      {/* Days / Table */}
      {viewMode === "cards" ? (
        <div className="px-4 sm:px-8 py-4 max-w-2xl mx-auto space-y-3 pb-20">
          {plan.map((dayPlan, idx) => (
            <DayCard
              key={dayPlan.day}
              dayPlan={dayPlan}
              dayIndex={idx}
              prevDinner={idx > 0 ? plan[idx - 1].dinner : null}
              onSetDinner={(meal) => setDinner(idx, meal)}
              onSetDinnerSide={(meal) => setDinnerSide(idx, meal)}
              onSetDinnerNote={(note) => setDinnerNote(idx, note)}
              onSetLunch={(meal) => setLunch(idx, meal)}
              onSetLunchSide={(meal) => setLunchSide(idx, meal)}
              onSetLunchNote={(note) => setLunchNote(idx, note)}
              onResetLunch={() => resetLunch(idx)}
              onSetBabyDinner={(meal) => setBabyDinner(idx, meal)}
              onSetBabyDinnerSide={(meal) => setBabyDinnerSide(idx, meal)}
              onSetBabyDinnerNote={(note) => setBabyDinnerNote(idx, note)}
              onResetBabyDinner={() => resetBabyDinner(idx)}
              onSetBabyLunch={(meal) => setBabyLunch(idx, meal)}
              onSetBabyLunchSide={(meal) => setBabyLunchSide(idx, meal)}
              onSetBabyLunchNote={(note) => setBabyLunchNote(idx, note)}
              onResetBabyLunch={() => resetBabyLunch(idx)}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 sm:px-6 py-4 pb-20">
          <WeekTableView
            plan={plan}
            onSetDinner={setDinner}
            onSetDinnerSide={setDinnerSide}
            onSetDinnerNote={setDinnerNote}
            onSetLunch={setLunch}
            onSetLunchSide={setLunchSide}
            onSetLunchNote={setLunchNote}
            onSetBabyDinner={setBabyDinner}
            onSetBabyDinnerSide={setBabyDinnerSide}
            onSetBabyDinnerNote={setBabyDinnerNote}
            onSetBabyLunch={setBabyLunch}
            onSetBabyLunchSide={setBabyLunchSide}
            onSetBabyLunchNote={setBabyLunchNote}
          />
        </div>
      )}

      {/* Reset dialog */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setShowReset(false)} />
          <div className="relative z-10 bg-card rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: 'Fraunces, serif' }}>¿Reiniciar la semana?</h3>
            <p className="text-sm text-muted-foreground mb-5">Se borrará toda la planificación y los almuerzos volverán a ser sugeridos automáticamente.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowReset(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={() => { resetPlan(); setShowReset(false); }} className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity">Reiniciar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
