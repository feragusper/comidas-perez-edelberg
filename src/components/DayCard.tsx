import { useState } from "react";
import { DayPlan, isDeliveryMeal } from "@/hooks/useMealPlan";
import { Meal } from "@/data/meals";
import { DinnerSuggestion } from "@/hooks/useDinnerSuggestions";
import { MealPicker, PickerStep } from "./MealPicker";
import { cn } from "@/lib/utils";
import { Plus, Trash2, ChevronDown, ChevronUp, RotateCcw, Check, X, Sparkles, RefreshCw, Loader2, GripVertical } from "lucide-react";
import { Droppable, Draggable } from "@hello-pangea/dnd";

interface DayCardProps {
  dayPlan: DayPlan;
  dayIndex: number;
  isToday?: boolean;
  isPast?: boolean;
  prevDinner: Meal | null;
  expanded: boolean;
  onToggleExpanded: () => void;
  dinnerSuggestion?: DinnerSuggestion | null;
  onAcceptSuggestion?: (suggestion: DinnerSuggestion) => void;
  onDismissSuggestion?: () => void;
  onRegenerateSuggestion?: () => void;
  loadingSuggestion?: boolean;
  extraMeals?: Meal[];
  onCustomMeal?: (meal: Meal) => void;
  onSetDinner: (meal: Meal | null) => void;
  onSetDinnerSide: (meal: Meal | null) => void;
  onSetDinnerNote: (note: string) => void;
  onSetLunch: (meal: Meal | null) => void;
  onSetLunchSide: (meal: Meal | null) => void;
  onSetLunchNote: (note: string) => void;
  onHideLunch: () => void;
  onResetLunch: () => void;
}

type PickerTarget = "dinner" | "lunch" | null;

function DraggableMealSlot({ droppableId, hasMeal, children }: { droppableId: string; hasMeal: boolean; children: React.ReactNode }) {
  return (
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn("rounded-xl transition-colors", snapshot.isDraggingOver && "ring-2 ring-primary/40 bg-primary/5")}
        >
          {hasMeal ? (
            <Draggable draggableId={droppableId} index={0}>
              {(dragProvided, dragSnapshot) => (
                <div
                  ref={dragProvided.innerRef}
                  {...dragProvided.draggableProps}
                  className={cn(dragSnapshot.isDragging && "shadow-lg rounded-xl bg-card p-2 border border-border")}
                >
                  <div className="flex items-start gap-1">
                    <div {...dragProvided.dragHandleProps} className="pt-1 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground shrink-0">
                      <GripVertical size={14} />
                    </div>
                    <div className="flex-1 min-w-0">{children}</div>
                  </div>
                </div>
              )}
            </Draggable>
          ) : (
            children
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}

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
  meal, side, note,
  onChangeNote, onRemove, onChangeMeal, onChangeSide, onRemoveSide, showSide,
}: {
  meal: Meal;
  side?: Meal | null;
  note: string;
  onChangeNote: (v: string) => void;
  onRemove: () => void;
  onChangeMeal: () => void;
  onChangeSide?: () => void;
  onRemoveSide?: () => void;
  showSide?: boolean;
}) {
  const isDelivery = isDeliveryMeal(meal);

  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-2">
        <span className="text-xl">{meal.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium", isDelivery ? "text-warning" : "text-foreground")}>{meal.name}</p>
          {isDelivery && (
            <p className="text-xs text-muted-foreground">Al día siguiente: sobras del delivery al almuerzo</p>
          )}
        </div>
        <button onClick={onRemove} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 size={13} />
        </button>
      </div>

      {/* Side dish — hide for delivery */}
      {showSide && !isDelivery && (
        <div className="pl-8">
          {side ? (
            <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-2.5 py-1.5">
              <span className="text-base">{side.emoji}</span>
              <p className="text-xs text-foreground flex-1">{side.name}</p>
              <button onClick={onChangeSide} className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors">
                Cambiar
              </button>
              <button onClick={onRemoveSide} className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors">
                <Trash2 size={11} />
              </button>
            </div>
          ) : (
            <button
              onClick={onChangeSide}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-secondary border border-dashed border-border rounded-lg px-2.5 py-1.5 hover:border-secondary/50 transition-all"
            >
              <Plus size={11} /> Agregar guarnición
            </button>
          )}
        </div>
      )}

      {/* Note + change */}
      <div className="flex items-center gap-2 pl-8">
        <NoteInput
          value={note}
          onChange={onChangeNote}
          placeholder={isDelivery ? "¿Qué vas a pedir?" : "Agregar detalle..."}
        />
        <button onClick={onChangeMeal} className="shrink-0 text-xs text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors">
          Cambiar
        </button>
      </div>
    </div>
  );
}

export function DayCard({
  dayPlan, dayIndex, prevDinner,
  isToday = false, isPast = false,
  expanded, onToggleExpanded,
  dinnerSuggestion, onAcceptSuggestion, onDismissSuggestion, onRegenerateSuggestion, loadingSuggestion,
  extraMeals = [], onCustomMeal,
  onSetDinner, onSetDinnerSide, onSetDinnerNote,
  onSetLunch, onSetLunchSide, onSetLunchNote, onHideLunch, onResetLunch,
}: DayCardProps) {
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [pickerStep, setPickerStep] = useState<PickerStep>("main");
  const isSunday = dayPlan.day === "Domingo";
  const isDelivery = isDeliveryMeal(dayPlan.dinner);
  const isPasta = dayPlan.dinner?.id === "pasta-domingo" || dayPlan.dinner?.id === "pasta";

  const handlePickerSelect = (meal: Meal) => {
    if (pickerStep === "main") {
      if (pickerTarget === "dinner") onSetDinner(meal);
      else if (pickerTarget === "lunch") onSetLunch(meal);
      // Skip side step for delivery
      if (isDeliveryMeal(meal)) {
        setPickerTarget(null);
      } else {
        setPickerStep("side");
      }
    } else {
      if (pickerTarget === "dinner") onSetDinnerSide(meal);
      else if (pickerTarget === "lunch") onSetLunchSide(meal);
      setPickerTarget(null);
    }
  };

  const openMainPicker = (target: PickerTarget) => {
    setPickerTarget(target);
    setPickerStep("main");
  };

  const openSidePicker = (target: "dinner" | "lunch") => {
    setPickerTarget(target);
    setPickerStep("side");
  };

  const pickerPrevDinner =
    pickerTarget === "lunch" ? prevDinner : null;

  return (
    <>
      <div className={cn(
        "rounded-2xl border overflow-hidden shadow-card transition-all",
        isPast && "opacity-50",
        isDelivery ? "border-warning/40 bg-warning/5"
          : isToday ? "border-primary/50 bg-card ring-2 ring-primary/20"
          : "border-border bg-card"
      )}>
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 cursor-pointer select-none",
            isDelivery ? "bg-warning/10"
              : isToday ? "bg-primary/8"
              : "bg-muted/40"
          )}
          onClick={() => onToggleExpanded()}
        >
          <div className="flex items-center gap-2">
            <span className={cn("text-base font-bold", isDelivery ? "text-warning" : isToday ? "text-primary" : "text-foreground")}
              style={{ fontFamily: 'Fraunces, serif' }}>
              {dayPlan.day}
            </span>
            {isDelivery && <span className="text-base leading-none">🛵</span>}
            {isPasta && !isDelivery && <span className="text-base leading-none" title="Noche de pasta">🍝</span>}
            {isToday && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                Hoy
              </span>
            )}
          </div>
          {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>

        {expanded && (
          <div className="p-4 space-y-3">
            {/* ── LUNCH ── */}
            <div className="rounded-xl bg-lunch-bg/70 p-3 border border-secondary/20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary">☀ Almuerzo</span>
                {!dayPlan.lunchOverridden && dayPlan.lunch && (
                  <span className="text-xs text-muted-foreground italic">sugerido de anoche</span>
                )}
              </div>

              <DraggableMealSlot droppableId={`${dayIndex}-lunch`} hasMeal={!!dayPlan.lunch}>
                {dayPlan.lunch ? (
                  <div className="space-y-1">
                    <MealDisplay
                      meal={dayPlan.lunch} side={dayPlan.lunchSide} note={dayPlan.lunchNote}
                      onChangeNote={onSetLunchNote}
                      onRemove={() => dayPlan.lunchOverridden ? onResetLunch() : onHideLunch()}
                      onChangeMeal={() => openMainPicker("lunch")}
                      onChangeSide={() => openSidePicker("lunch")}
                      onRemoveSide={() => onSetLunchSide(null)}
                      showSide
                    />
                    {dayPlan.lunchOverridden && (
                      <button onClick={onResetLunch} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-secondary transition-colors pl-8">
                        <RotateCcw size={11} /> Restaurar sugerencia
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => openMainPicker("lunch")}
                    className="w-full flex items-center gap-2 text-sm text-muted-foreground border-2 border-dashed border-secondary/30 rounded-xl p-3 hover:border-secondary/60 hover:text-secondary hover:bg-lunch-bg transition-all"
                  >
                    <Plus size={15} /> Elegir almuerzo
                  </button>
                )}
              </DraggableMealSlot>
            </div>

            {/* ── DINNER ── */}
            <div className={cn(
              "rounded-xl p-3 border space-y-3",
              isDelivery ? "bg-warning/5 border-warning/30" : "bg-dinner-bg/70 border-primary/20"
            )}>
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-semibold uppercase tracking-wider", isDelivery ? "text-warning" : "text-primary")}>
                  {isDelivery ? "🛵 Delivery" : "🌙 Cena"}
                </span>
              </div>

              <DraggableMealSlot droppableId={`${dayIndex}-dinner`} hasMeal={!!dayPlan.dinner}>
                {dayPlan.dinner ? (
                  <div className="space-y-1">
                    <MealDisplay
                      meal={dayPlan.dinner} side={dayPlan.dinnerSide} note={dayPlan.dinnerNote}
                      onChangeNote={onSetDinnerNote}
                      onRemove={() => { onSetDinner(null); onSetDinnerSide(null); }}
                      onChangeMeal={() => openMainPicker("dinner")}
                      onChangeSide={() => openSidePicker("dinner")}
                      onRemoveSide={() => onSetDinnerSide(null)}
                      showSide
                    />
                  </div>
                ) : dinnerSuggestion ? (
                  /* ── Suggested dinner + side chip ── */
                  <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={12} className="text-primary/60" />
                      <span className="text-xs text-primary/70 font-medium italic">
                        {dinnerSuggestion.isAI ? "✨ Sugerencia IA keto" : "Sugerencia"}
                      </span>
                      <button
                        onClick={() => onRegenerateSuggestion?.()}
                        disabled={loadingSuggestion}
                        className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
                        title="Otra sugerencia"
                      >
                        {loadingSuggestion
                          ? <Loader2 size={11} className="animate-spin" />
                          : <RefreshCw size={11} />
                        }
                        Otra
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{dinnerSuggestion.meal.emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{dinnerSuggestion.meal.name}</p>
                        {dinnerSuggestion.side && (
                          <p className="text-xs text-muted-foreground">+ {dinnerSuggestion.side.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onAcceptSuggestion?.(dinnerSuggestion)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                      >
                        <Check size={11} /> Usar
                      </button>
                      <button
                        onClick={() => onDismissSuggestion?.()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors"
                      >
                        <X size={11} /> Descartar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => openMainPicker("dinner")}
                    className={cn(
                      "w-full flex items-center gap-2 text-sm border-2 border-dashed rounded-xl p-3 transition-all",
                      isSunday
                        ? "text-warning border-warning/40 hover:border-warning/70 hover:text-warning hover:bg-warning/5"
                        : "text-primary border-primary/30 hover:border-primary/60 hover:text-primary hover:bg-dinner-bg"
                    )}
                  >
                    <Plus size={15} /> Elegir cena
                  </button>
                )}
              </DraggableMealSlot>
            </div>
          </div>
        )}
      </div>

      {/* Meal Picker Modal */}
      {pickerTarget && (
        <MealPicker
          step={pickerStep}
          prevDinner={pickerPrevDinner}
          extraMeals={extraMeals}
          onCustomMeal={onCustomMeal}
          onSelect={handlePickerSelect}
          onClose={() => setPickerTarget(null)}
          onSkipSide={() => setPickerTarget(null)}
        />
      )}
    </>
  );
}
