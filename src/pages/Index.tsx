import { useEffect, useState } from "react";
import { useMealPlan } from "@/hooks/useMealPlan";
import { useDinnerSuggestions } from "@/hooks/useDinnerSuggestions";
import { useCustomMeals } from "@/hooks/useCustomMeals";
import { DayCard } from "@/components/DayCard";
import { WeekTableView } from "@/components/WeekTableView";
import { WeekNavigator } from "@/components/WeekNavigator";
import { Baby, LayoutList, Table2, FlaskConical, Sparkles, Loader2, BarChart3, UtensilsCrossed, Carrot } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import heroFood from "@/assets/hero-food.jpg";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";

import { cn } from "@/lib/utils";
import { isStageEnv, currentWeekKey, todayDayIndex } from "@/lib/env";


export default function Index() {
  const [activeWeek, setActiveWeek] = useState<string>(currentWeekKey());
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const isStage = isStageEnv();
  const todayIdx = todayDayIndex(activeWeek);
  const [expandedDays, setExpandedDays] = useState<boolean[]>(() => {
    const idx = todayDayIndex(activeWeek);
    return Array.from({ length: 7 }, (_, i) => idx === -1 || i >= idx);
  });

  // Update expanded state when week changes
  useEffect(() => {
    const idx = todayDayIndex(activeWeek);
    setExpandedDays(Array.from({ length: 7 }, (_, i) => idx === -1 || i >= idx));
  }, [activeWeek]);
  const {
    plan, loading,
    setDinner, setDinnerSide, setDinnerNote,
    setLunch, setLunchSide, setLunchNote, hideLunch, resetLunch,
    setBabyDinner, setBabyDinnerSide, setBabyDinnerNote, hideBabyDinner, resetBabyDinner,
    setBabyLunch, setBabyLunchSide, setBabyLunchNote, hideBabyLunch, resetBabyLunch,
    setBreakfast, setBreakfastNote, setSnack, setSnackNote,
    resetPlan, swapSlots,
  } = useMealPlan(activeWeek);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;
    // droppableId format: "dayIndex-slot"
    const [srcDayStr, srcSlot] = source.droppableId.split("-");
    const [dstDayStr, dstSlot] = destination.droppableId.split("-");
    const srcDay = parseInt(srcDayStr, 10);
    const dstDay = parseInt(dstDayStr, 10);
    swapSlots(srcDay, srcSlot as any, dstDay, dstSlot as any);
  };
  const [showReset, setShowReset] = useState(false);

  const { customMeals, saveCustomMeal } = useCustomMeals();

  const { enabled: suggestionsEnabled, toggle: toggleSuggestions, suggestions, dismiss: dismissSuggestion, regenerateDay, loadingAI, loadingDayIndex } =
    useDinnerSuggestions(plan);


  const adultDinners = plan.filter((d) => d.dinner !== null).length;
  const adultLunches = plan.filter((d) => d.lunch !== null).length;
  const babyDinners = plan.filter((d) => d.babyDinner !== null).length;
  const babyLunches = plan.filter((d) => d.babyLunch !== null).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <img src={heroFood} alt="Cocina familiar" className="w-full h-48 sm:h-64 object-cover" style={{ objectPosition: "center 60%" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 sm:px-8 sm:pb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Menú de la semana 🍽️</h1>
        </div>
      </div>

      {/* Week navigator + controls */}
      <div className="px-4 sm:px-8 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="mx-auto flex gap-1 pt-3 pb-2 flex-wrap items-center max-w-5xl">
          {/* Week navigator */}
          <WeekNavigator weekKey={activeWeek} onChange={setActiveWeek} />

          {/* Suggestions toggle */}
          <button
            onClick={toggleSuggestions}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border",
              suggestionsEnabled
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted/60 border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {loadingAI
              ? <Loader2 size={12} className="animate-spin" />
              : <Sparkles size={12} />
            }
            {loadingAI ? "Consultando IA…" : `Sugerencias IA ${suggestionsEnabled ? "on" : "off"}`}
          </button>

          {/* View toggle */}
          <div className="ml-auto flex items-center gap-1 bg-muted/60 rounded-xl p-1">
            <button
              onClick={() => setViewMode("cards")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all", viewMode === "cards" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <LayoutList size={13} /> Lista
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all", viewMode === "table" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <Table2 size={13} /> Tabla
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mx-auto flex items-center gap-3 text-xs pb-2.5 flex-wrap max-w-5xl">
          {/* Nosotros */}
          <span className="text-muted-foreground font-medium">Nosotros:</span>
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{adultDinners}</span>/7 cenas
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{adultLunches}</span>/7 almuerzos
          </span>
          <span className="text-muted-foreground mx-1">|</span>
          {/* Nico */}
          <Baby size={13} className="text-baby-safe" />
          <span className="text-muted-foreground font-medium">Nico:</span>
          <span className="text-muted-foreground">
            <span className="font-semibold text-baby-safe">{babyDinners}</span>/7 cenas
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            <span className="font-semibold text-baby-safe">{babyLunches}</span>/7 almuerzos
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/mis-comidas" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
              <UtensilsCrossed size={13} /> Mis comidas
            </Link>
            <Link to="/reportes" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
              <BarChart3 size={13} /> Reportes
            </Link>
            <button onClick={() => setShowReset(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
              <RotateCcw size={13} /> Reiniciar
            </button>
          </div>
        </div>
      </div>

      {/* Days / Table */}
      {loading ? (
        <div className="px-4 sm:px-8 py-4 max-w-5xl mx-auto space-y-3 pb-20">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16 ml-auto" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          {viewMode === "cards" ? (
            <div className="px-4 sm:px-8 py-4 max-w-5xl mx-auto space-y-3 pb-20">
              {plan.map((dayPlan, idx) => (
                <DayCard
                  key={dayPlan.day}
                  dayPlan={dayPlan}
                  dayIndex={idx}
                  isToday={todayIdx === idx}
                  isPast={todayIdx !== -1 && idx < todayIdx}
                  prevDinner={idx > 0 ? plan[idx - 1].dinner : null}
                  expanded={expandedDays[idx]}
                  onToggleExpanded={() => setExpandedDays(prev => prev.map((v, i) => i === idx ? !v : v))}
                  dinnerSuggestion={suggestionsEnabled ? suggestions[idx] : null}
                  onAcceptSuggestion={(s) => { setDinner(idx, s.meal); if (s.side) setDinnerSide(idx, s.side); }}
                  onDismissSuggestion={() => dismissSuggestion(idx)}
                  onRegenerateSuggestion={() => regenerateDay(idx)}
                  loadingSuggestion={loadingDayIndex === idx}
                  onSetDinner={(meal) => setDinner(idx, meal)}
                  onSetDinnerSide={(meal) => setDinnerSide(idx, meal)}
                  onSetDinnerNote={(note) => setDinnerNote(idx, note)}
                  
                  onSetLunch={(meal) => setLunch(idx, meal)}
                  onSetLunchSide={(meal) => setLunchSide(idx, meal)}
                  onSetLunchNote={(note) => setLunchNote(idx, note)}
                  onHideLunch={() => hideLunch(idx)}
                  onResetLunch={() => resetLunch(idx)}
                  onSetBabyDinner={(meal) => setBabyDinner(idx, meal)}
                  onSetBabyDinnerSide={(meal) => setBabyDinnerSide(idx, meal)}
                  onSetBabyDinnerNote={(note) => setBabyDinnerNote(idx, note)}
                  onHideBabyDinner={() => hideBabyDinner(idx)}
                  onResetBabyDinner={() => resetBabyDinner(idx)}
                  onSetBabyLunch={(meal) => setBabyLunch(idx, meal)}
                  onSetBabyLunchSide={(meal) => setBabyLunchSide(idx, meal)}
                  onSetBabyLunchNote={(note) => setBabyLunchNote(idx, note)}
                  onHideBabyLunch={() => hideBabyLunch(idx)}
                  onResetBabyLunch={() => resetBabyLunch(idx)}
                  onSetBreakfast={(meal) => setBreakfast(idx, meal)}
                  onSetBreakfastNote={(v) => setBreakfastNote(idx, v)}
                  onSetSnack={(meal) => setSnack(idx, meal)}
                  onSetSnackNote={(v) => setSnackNote(idx, v)}
                  extraMeals={customMeals}
                  onCustomMeal={saveCustomMeal}
                />
              ))}
            </div>
          ) : (
            <div className="px-4 sm:px-8 py-4 max-w-7xl mx-auto pb-20">
              <WeekTableView
                plan={plan}
                todayIdx={todayIdx}
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
                onSetBreakfast={setBreakfast}
                onSetBreakfastNote={setBreakfastNote}
                onSetSnack={setSnack}
                onSetSnackNote={setSnackNote}
                extraMeals={customMeals}
                onCustomMeal={saveCustomMeal}
              />
            </div>
          )}
        </DragDropContext>
      )}

      {/* Stage badge — fixed top-right corner */}
      {isStage && (
        <div className="fixed top-2 right-2 z-50 flex items-center gap-1 px-2 py-0.5 rounded-md bg-warning/30 border border-warning/60 text-warning text-[10px] font-semibold pointer-events-none select-none">
          <FlaskConical size={10} />
          STAGE
        </div>
      )}

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
