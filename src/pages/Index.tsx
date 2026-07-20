import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMealPlan } from "@/hooks/useMealPlan";
import { useDinnerSuggestions } from "@/hooks/useDinnerSuggestions";
import { useMeals } from "@/hooks/useMeals";
import { useIngredients } from "@/hooks/useIngredients";
import { DayCard } from "@/components/DayCard";
import { WeekTableView } from "@/components/WeekTableView";
import { WeekNavigator } from "@/components/WeekNavigator";
import { Baby, LayoutList, Table2, FlaskConical, Sparkles, Loader2, Wand2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";

import { TopNav } from "@/components/TopNav";

import { useWeekAutocomplete } from "@/hooks/useWeekAutocomplete";
import { usePantry, normalizePantryName } from "@/hooks/usePantry";
import { syncPantryWithPlan } from "@/lib/pantryPlan";
import { cn } from "@/lib/utils";
import { isStageEnv, currentWeekKey, todayDayIndex } from "@/lib/env";


export default function Index() {
  // Permite deep-links a una semana puntual (p.ej. desde /normalizar): /?week=2026-W23
  const [searchParams] = useSearchParams();
  const weekParam = searchParams.get("week");
  const [activeWeek, setActiveWeek] = useState<string>(() =>
    weekParam && /^\d{4}-W\d{2}$/.test(weekParam) ? weekParam : currentWeekKey()
  );
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
    plan, loading, loadError,
    setDinner, setDinnerSide, setDinnerNote,
    setLunch, setLunchSide, setLunchNote, hideLunch, resetLunch,
    setBabyDinner, setBabyDinnerSide, setBabyDinnerNote, hideBabyDinner, resetBabyDinner,
    setBabyLunch, setBabyLunchSide, setBabyLunchNote, hideBabyLunch, resetBabyLunch,
    setBreakfast, setBreakfastNote, setSnack, setSnackNote,
    addExtra, setExtraAt, removeExtraAt,
    removeMainOnly,
    swapSlots,
    autocompleteWeek,
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
  

  const { meals: mealsCatalog, saveMeal } = useMeals();
  const { ingredients, addIngredient } = useIngredients();

  // Despensa (Don Bacilio): badges en los slots + consumo automático al pasar el día.
  const { allItems: pantryAll, loading: pantryLoading, markUsed: pantryMarkUsed, clearUsed: pantryClearUsed } = usePantry();
  const pantryNames = new Set(pantryAll.map((p) => normalizePantryName(p.name)));
  useEffect(() => {
    // Nunca reconciliar contra un plan que no cargó: parecería vacío y
    // devolvería a la despensa ítems que sí están usados.
    if (loading || loadError || pantryLoading) return;
    syncPantryWithPlan({ allItems: pantryAll, plan, weekKey: activeWeek, markUsed: pantryMarkUsed, clearUsed: pantryClearUsed });
  });

  const { enabled: suggestionsEnabled, toggle: toggleSuggestions, suggestions, dismiss: dismissSuggestion, regenerateDay, loadingAI, loadingDayIndex } =
    useDinnerSuggestions(plan, mealsCatalog);

  const { run: runAutocomplete, loading: loadingAutocomplete } =
    useWeekAutocomplete(plan, activeWeek, autocompleteWeek, mealsCatalog);


  const adultDinners = plan.filter((d) => d.dinner !== null).length;
  const adultLunches = plan.filter((d) => d.lunch !== null).length;
  const babyDinners = plan.filter((d) => d.babyDinner !== null).length;
  const babyLunches = plan.filter((d) => d.babyLunch !== null).length;

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      {/* Compact header: se funde con la barra de acciones de abajo */}
      <header className="bg-card/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-5 pb-1 text-center sm:text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Menú de la semana
          </h1>
        </div>
      </header>


      {/* Week navigator + controls */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-12 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 flex gap-1 pt-3 pb-2 flex-wrap items-center">
          {/* Week navigator */}
          <WeekNavigator weekKey={activeWeek} onChange={setActiveWeek} />

          {/* Suggestions toggle */}
          <Button
            variant={suggestionsEnabled ? "secondary" : "outline"}
            size="sm"
            onClick={toggleSuggestions}
            className="gap-1.5"
          >
            {loadingAI
              ? <Loader2 size={14} className="animate-spin" />
              : <Sparkles size={14} />
            }
            {loadingAI ? "Consultando IA…" : `Sugerencias IA ${suggestionsEnabled ? "on" : "off"}`}
          </Button>

          {/* Autocomplete whole week */}
          <Button
            size="sm"
            onClick={runAutocomplete}
            disabled={loadingAutocomplete}
            className="gap-1.5"
            title="Completa cena, desayuno y merienda de toda la semana según vuestro historial + ideas nuevas de IA"
          >
            {loadingAutocomplete
              ? <Loader2 size={14} className="animate-spin" />
              : <Wand2 size={14} />
            }
            {loadingAutocomplete ? "Autocompletando…" : "Autocompletar semana"}
          </Button>

          {/* View toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "cards" | "table")} className="ml-auto">
            <TabsList>
              <TabsTrigger value="cards" className="gap-1.5"><LayoutList size={14} /> Lista</TabsTrigger>
              <TabsTrigger value="table" className="gap-1.5"><Table2 size={14} /> Tabla</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats bar */}
        <div className="max-w-5xl mx-auto px-4 sm:px-8 flex items-center gap-3 text-xs pt-4 pb-2.5 flex-wrap">
          {/* Adultos */}
          <span className="text-muted-foreground font-medium">Adultos:</span>
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{adultLunches}</span>/7 almuerzos
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{adultDinners}</span>/7 cenas
          </span>
          <span className="text-muted-foreground mx-1">|</span>
          {/* Nico */}
          <Baby size={13} className="text-baby-safe" />
          <span className="text-muted-foreground font-medium">Nico:</span>
          <span className="text-muted-foreground">
            <span className="font-semibold text-baby-safe">{babyLunches}</span>/7 almuerzos
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            <span className="font-semibold text-baby-safe">{babyDinners}</span>/7 cenas
          </span>
        </div>
      </div>

      {/* Days / Table */}
      {loading ? (
        <div className="px-4 sm:px-8 py-4 max-w-5xl mx-auto space-y-3 pb-20">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16 ml-auto" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
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
                  onAddExtra={(slot, meal) => addExtra(idx, slot, meal)}
                  onSetExtra={(slot, exIdx, meal) => setExtraAt(idx, slot, exIdx, meal)}
                  onRemoveExtra={(slot, exIdx) => removeExtraAt(idx, slot, exIdx)}
                  onRemoveMain={(slot) => removeMainOnly(idx, slot)}
                  extraMeals={mealsCatalog}
                  ingredients={ingredients}
                  pantryNames={pantryNames}
                  onCustomMeal={saveMeal}
                  onCustomIngredient={(ing) => void addIngredient(ing)}
                />
              ))}
            </div>
          ) : (
            <div className="px-4 sm:px-8 py-4 max-w-5xl mx-auto pb-20">
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
                onAddExtra={addExtra}
                onSetExtra={setExtraAt}
                onRemoveExtra={removeExtraAt}
                onRemoveMain={removeMainOnly}
                extraMeals={mealsCatalog}
                ingredients={ingredients}
                pantryNames={pantryNames}
                onCustomMeal={saveMeal}
                onCustomIngredient={(ing) => void addIngredient(ing)}
              />
            </div>
          )}
        </DragDropContext>
      )}

      {/* Stage badge — fixed bottom-right corner (no choca con la barra superior) */}
      {isStage && (
        <div className="fixed bottom-3 right-3 z-50 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-warning text-white text-[10px] font-semibold pointer-events-none select-none shadow-sm">
          <FlaskConical size={10} />
          STAGE
        </div>
      )}

    </div>
  );
}
