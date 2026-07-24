import { useState } from "react";
import { DayPlan, MealSlot, isDeliveryMeal, isTakeawayMeal, isRestaurantMeal, isEatingOutMeal } from "@/hooks/useMealPlan";
import { Meal, BabySafety } from "@/data/meals";
import { Ingredient } from "@/data/food";
import { normalizePantryName } from "@/hooks/usePantry";
import { MealPicker, PickerMode, PickerStep } from "./MealPicker";
import { cn } from "@/lib/utils";
import { Baby, Trash2, Lock, ChevronDown, ChevronUp, RotateCcw, GripVertical } from "lucide-react";
import { AddMealButton } from "./AddMealButton";
import { PantryBadge, type PantryStatus } from "./PantryBadge";
import { Droppable, Draggable } from "@hello-pangea/dnd";

interface DayCardProps {
  dayPlan: DayPlan;
  dayIndex: number;
  isToday?: boolean;
  isPast?: boolean;
  prevDinner: Meal | null;
  expanded: boolean;
  onToggleExpanded: () => void;
  extraMeals?: Meal[];
  ingredients?: Ingredient[];
  /** Estado en la despensa (Don Bacilio) por nombre normalizado, para marcar alimentos. */
  pantryStatus?: Map<string, PantryStatus>;
  onCustomMeal?: (meal: Meal) => void;
  onCustomIngredient?: (ing: Ingredient) => void;
  onSetDinner: (meal: Meal | null) => void;
  onSetDinnerSide: (meal: Meal | null) => void;
  onSetDinnerNote: (note: string) => void;
  onSetLunch: (meal: Meal | null) => void;
  onSetLunchSide: (meal: Meal | null) => void;
  onSetLunchNote: (note: string) => void;
  onHideLunch: () => void;
  onResetLunch: () => void;
  onSetBabyDinner: (meal: Meal | null) => void;
  onSetBabyDinnerSide: (meal: Meal | null) => void;
  onSetBabyDinnerNote: (note: string) => void;
  onHideBabyDinner: () => void;
  onResetBabyDinner: () => void;
  onSetBabyLunch: (meal: Meal | null) => void;
  onSetBabyLunchSide: (meal: Meal | null) => void;
  onSetBabyLunchNote: (note: string) => void;
  onHideBabyLunch: () => void;
  onResetBabyLunch: () => void;
  onSetBreakfast: (meal: Meal | null) => void;
  onSetBreakfastNote: (note: string) => void;
  onSetSnack: (meal: Meal | null) => void;
  onSetSnackNote: (note: string) => void;
  onAddExtra: (slot: MealSlot, meal: Meal) => void;
  onSetExtra: (slot: MealSlot, idx: number, meal: Meal) => void;
  onRemoveExtra: (slot: MealSlot, idx: number) => void;
  onRemoveMain: (slot: MealSlot) => void;
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

type PickerTarget = "dinner" | "lunch" | "babyDinner" | "babyLunch" | "breakfast" | "snack" | null;

function DraggableMealSlot({ droppableId, hasMeal, children }: { droppableId: string; hasMeal: boolean; children: React.ReactNode }) {
  return (
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn("rounded-lg transition-colors", snapshot.isDraggingOver && "ring-2 ring-primary/40 bg-primary/5")}
        >
          {hasMeal ? (
            <Draggable draggableId={droppableId} index={0}>
              {(dragProvided, dragSnapshot) => (
                <div
                  ref={dragProvided.innerRef}
                  {...dragProvided.draggableProps}
                  className={cn("rounded-lg border border-border/60 bg-card/50 p-1.5", dragSnapshot.isDragging && "shadow-lg bg-card border-border")}
                >
                  <div className="flex items-start gap-1">
                    <div {...dragProvided.dragHandleProps} className="pt-1 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground shrink-0" title="Mover">
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

function SimpleMealSlot({
  label, accent, bgClass, borderClass,
  meal, note, onPickMain, onChangeNote, onRemove, droppableId, dayIndex,
  extras, inPantry,
}: {
  label: string; accent: string; bgClass: string; borderClass: string;
  meal: Meal | null; note: string;
  onPickMain: () => void;
  onChangeNote: (v: string) => void;
  onRemove: () => void;
  droppableId: string;
  dayIndex: number;
  extras?: React.ReactNode;
  inPantry?: (m: Meal) => PantryStatus | undefined;
}) {
  return (
    <div className={cn("rounded-lg px-3 py-2 border space-y-1.5", bgClass, borderClass)}>
      <div className="flex items-center gap-2">
        <span className={cn("text-xs font-semibold uppercase tracking-wider", accent)}>{label}</span>
      </div>
      <DraggableMealSlot droppableId={droppableId} hasMeal={!!meal}>
        {meal ? (
          <div className="space-y-1">
            <div
              onClick={onPickMain}
              title="Tocar para cambiar"
              className="flex items-center gap-2 bg-muted/60 rounded-xl px-2.5 py-1.5 cursor-pointer hover:bg-muted transition-colors"
            >
              <span className="text-base shrink-0">{meal.emoji}</span>
              <p className="text-xs text-foreground flex-1 break-words">{meal.name}</p>
              <PantryBadge status={inPantry?.(meal)} />
              <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                <Trash2 size={11} />
              </button>
            </div>
            {extras}
          </div>
        ) : (
          <AddMealButton onClick={onPickMain} />
        )}
      </DraggableMealSlot>
    </div>
  );
}

function MealDisplay({
  meal, side, note,
  onChangeNote, onRemove, onChangeMeal, onChangeSide, onRemoveSide,
  babySafety, isBaby, showSide, inPantry,
}: {
  meal: Meal;
  side?: Meal | null;
  note: string;
  onChangeNote: (v: string) => void;
  onRemove: () => void;
  onChangeMeal: () => void;
  onChangeSide?: () => void;
  onRemoveSide?: () => void;
  babySafety?: boolean;
  isBaby?: boolean;
  showSide?: boolean;
  inPantry?: (m: Meal) => PantryStatus | undefined;
}) {
  const isDelivery = isDeliveryMeal(meal);
  const isTakeaway = isTakeawayMeal(meal);
  const isRestaurant = isRestaurantMeal(meal);
  const isEatingOut = isEatingOutMeal(meal);

  return (
    <div className="space-y-1">
      {/* Main item — same visual level as the rest */}
      <div
        onClick={onChangeMeal}
        title="Tocar para cambiar"
        className="flex items-center gap-2 bg-muted/60 rounded-xl px-2.5 py-1.5 cursor-pointer hover:bg-muted transition-colors"
      >
        <span className="text-base shrink-0">{meal.emoji}</span>
        <p className={cn("text-xs flex-1 break-words", isEatingOut ? "text-warning" : "text-foreground")}>{meal.name}</p>
        <PantryBadge status={inPantry?.(meal)} />
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0">
          <Trash2 size={11} />
        </button>
      </div>

      {/* Eating-out notes */}
      {isDelivery && (
        <p className="text-xs text-muted-foreground pl-1">Al día siguiente: sobras del delivery al almuerzo</p>
      )}
      {isTakeaway && (
        <p className="text-xs text-muted-foreground pl-1">Al día siguiente: sobras del takeaway al almuerzo</p>
      )}
      {isRestaurant && (
        <p className="text-xs text-muted-foreground pl-1">Comemos afuera — sin sobras</p>
      )}

      {/* Side dish — same visual level, shown only when set */}
      {showSide && !isEatingOut && side && (
        <div
          onClick={onChangeSide}
          title="Tocar para cambiar"
          className="flex items-center gap-2 bg-muted/60 rounded-xl px-2.5 py-1.5 cursor-pointer hover:bg-muted transition-colors"
        >
          <span className="text-base shrink-0">{side.emoji}</span>
          <p className="text-xs text-foreground flex-1 break-words">{side.name}</p>
          <PantryBadge status={inPantry?.(side)} />
          <button onClick={(e) => { e.stopPropagation(); onRemoveSide?.(); }} className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors shrink-0">
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

/** Renders extra food items for a meal slot + an "add" button. */
function ExtraItems({
  extras, onEdit, onRemove, onAdd, inPantry,
}: {
  extras: Meal[];
  onEdit: (idx: number) => void;
  onRemove: (idx: number) => void;
  onAdd: () => void;
  inPantry?: (m: Meal) => PantryStatus | undefined;
}) {
  return (
    <div className="space-y-1">
      {extras.map((m, idx) => (
        <div
          key={idx}
          onClick={() => onEdit(idx)}
          title="Tocar para cambiar"
          className="flex items-center gap-2 bg-muted/60 rounded-xl px-2.5 py-1.5 cursor-pointer hover:bg-muted transition-colors"
        >
          <span className="text-base shrink-0">{m.emoji}</span>
          <p className="text-xs text-foreground flex-1 break-words">{m.name}</p>
          <PantryBadge status={inPantry?.(m)} />
          <button onClick={(e) => { e.stopPropagation(); onRemove(idx); }} className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors shrink-0">
            <Trash2 size={11} />
          </button>
        </div>
      ))}
      <AddMealButton onClick={onAdd} />
    </div>
  );
}

export function DayCard({
  dayPlan, dayIndex, prevDinner,
  isToday = false, isPast = false,
  expanded, onToggleExpanded,
  extraMeals = [], ingredients = [], pantryStatus, onCustomMeal, onCustomIngredient,
  onSetDinner, onSetDinnerSide, onSetDinnerNote,
  onSetLunch, onSetLunchSide, onSetLunchNote, onHideLunch, onResetLunch,
  onSetBabyDinner, onSetBabyDinnerSide, onSetBabyDinnerNote, onHideBabyDinner, onResetBabyDinner,
  onSetBabyLunch, onSetBabyLunchSide, onSetBabyLunchNote, onHideBabyLunch, onResetBabyLunch,
  onSetBreakfast, onSetBreakfastNote, onSetSnack, onSetSnackNote,
  onAddExtra, onSetExtra, onRemoveExtra,
  onRemoveMain,
}: DayCardProps) {
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [pickerStep, setPickerStep] = useState<PickerStep>("main");
  // Estado en la despensa (Don Bacilio) de un alimento, para la marquita 🏠.
  const inPantry = pantryStatus ? (m: Meal) => pantryStatus.get(normalizePantryName(m.name)) : undefined;
  // When set, the picker is choosing an "extra" food for the target slot.
  // idx === null means adding a new extra; a number means editing that extra.
  const [extraEdit, setExtraEdit] = useState<{ idx: number | null } | null>(null);
  const isSunday = dayPlan.day === "Domingo";
  const isDelivery = isDeliveryMeal(dayPlan.dinner);
  const isTakeaway = isTakeawayMeal(dayPlan.dinner);
  const isRestaurant = isRestaurantMeal(dayPlan.dinner);
  const isEatingOut = isEatingOutMeal(dayPlan.dinner);
  const dinnerEmoji = dayPlan.dinner?.emoji ?? "";
  const dinnerLabel = isDelivery ? "Delivery" : isTakeaway ? "Takeaway" : isRestaurant ? "Restaurante" : "Cena";
  const isPasta = dayPlan.dinner?.id === "pasta-domingo" || dayPlan.dinner?.id === "pasta";

  const closePicker = () => { setPickerTarget(null); setExtraEdit(null); };

  const handlePickerSelect = (meal: Meal) => {
    // Extra-food flow: add or replace an extra, then close.
    if (extraEdit && pickerTarget) {
      if (extraEdit.idx === null) onAddExtra(pickerTarget as MealSlot, meal);
      else onSetExtra(pickerTarget as MealSlot, extraEdit.idx, meal);
      closePicker();
      return;
    }
    if (pickerStep === "main") {
      if (pickerTarget === "dinner") onSetDinner(meal);
      else if (pickerTarget === "lunch") onSetLunch(meal);
      else if (pickerTarget === "babyDinner") onSetBabyDinner(meal);
      else if (pickerTarget === "babyLunch") onSetBabyLunch(meal);
      else if (pickerTarget === "breakfast") { onSetBreakfast(meal); setPickerTarget(null); return; }
      else if (pickerTarget === "snack") { onSetSnack(meal); setPickerTarget(null); return; }
      // Skip side step for eating-out meals
      if (isEatingOutMeal(meal)) {
        setPickerTarget(null);
      } else {
        setPickerStep("side");
      }
    } else {
      if (pickerTarget === "dinner") onSetDinnerSide(meal);
      else if (pickerTarget === "lunch") onSetLunchSide(meal);
      else if (pickerTarget === "babyDinner") onSetBabyDinnerSide(meal);
      else if (pickerTarget === "babyLunch") onSetBabyLunchSide(meal);
      setPickerTarget(null);
    }
  };

  const openMainPicker = (target: PickerTarget) => {
    setExtraEdit(null);
    setPickerTarget(target);
    setPickerStep("main");
  };

  const openSidePicker = (target: "dinner" | "lunch" | "babyDinner" | "babyLunch") => {
    setExtraEdit(null);
    setPickerTarget(target);
    setPickerStep("side");
  };

  const openExtraPicker = (target: MealSlot, idx: number | null) => {
    setExtraEdit({ idx });
    setPickerTarget(target);
    setPickerStep("main");
  };

  const pickerMode: PickerMode =
    pickerTarget === "babyDinner" || pickerTarget === "babyLunch" ? "baby" : "adult";

  const pickerPrevDinner =
    pickerTarget === "lunch" || pickerTarget === "babyLunch" ? prevDinner : null;

  return (
    <>
      <div className={cn(
        "rounded-xl border overflow-hidden shadow-sm transition-all",
        isPast && "opacity-50",
        isEatingOut ? "border-warning/40 bg-warning/5"
          : isToday ? "border-gold/30 bg-card ring-4 ring-gold/10"
          : "border-border bg-card hover:border-stone-300"
      )}>
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 cursor-pointer select-none",
            isEatingOut ? "bg-warning/10"
              : isToday ? "bg-gold/5"
              : "bg-card hover:bg-muted/40"
          )}
          onClick={() => onToggleExpanded()}
        >
          <div className="flex items-center gap-2">
            <span className={cn("text-lg font-semibold tracking-tight", isEatingOut ? "text-warning" : isToday ? "text-foreground" : "text-foreground")}>
              {dayPlan.day}
            </span>
            {isEatingOut && <span className="text-base leading-none">{dinnerEmoji}</span>}
            {isPasta && !isEatingOut && <span className="text-base leading-none" title="Noche de pasta">🍝</span>}
            {isToday && (
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-gold text-white">
                Hoy
              </span>
            )}
          </div>
          {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>

        {expanded && (
          <div className="p-4 space-y-3">
            {/* ── BREAKFAST ── */}
            <SimpleMealSlot
              label="Desayuno · Nico"
              accent="text-foreground"
              bgClass="bg-muted/40"
              borderClass="border-border"
              meal={dayPlan.breakfast}
              note={dayPlan.breakfastNote}
              onPickMain={() => openMainPicker("breakfast")}
              onChangeNote={onSetBreakfastNote}
              onRemove={() => onRemoveMain("breakfast")}
              droppableId={`${dayIndex}-breakfast`}
              inPantry={inPantry}
              dayIndex={dayIndex}
              extras={
                <ExtraItems
                  extras={dayPlan.breakfastExtras ?? []}
                  onEdit={(idx) => openExtraPicker("breakfast", idx)}
                  onRemove={(idx) => onRemoveExtra("breakfast", idx)}
                  onAdd={() => openExtraPicker("breakfast", null)}
                  inPantry={inPantry}
                />
              }
            />

            {/* ── LUNCH ── */}
            <div className="rounded-lg bg-muted/40 p-3 border border-border space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Almuerzo</span>
                {!dayPlan.lunchOverridden && dayPlan.lunch && (
                  <span className="text-xs text-muted-foreground italic">sugerido de anoche</span>
                )}
              </div>

              {/* Adults lunch */}
              <DraggableMealSlot droppableId={`${dayIndex}-lunch`} hasMeal={!!dayPlan.lunch}>
                {dayPlan.lunch ? (
                  <div className="space-y-1">
                    <MealDisplay
                      meal={dayPlan.lunch} side={dayPlan.lunchSide} note={dayPlan.lunchNote}
                      onChangeNote={onSetLunchNote}
                      onRemove={() => onRemoveMain("lunch")}
                      onChangeMeal={() => openMainPicker("lunch")}
                      onChangeSide={() => openSidePicker("lunch")}
                      onRemoveSide={() => onSetLunchSide(null)}
                      babySafety showSide inPantry={inPantry}
                    />
                    {!isEatingOutMeal(dayPlan.lunch) && (
                      <ExtraItems
                        extras={dayPlan.lunchExtras ?? []}
                        onEdit={(idx) => openExtraPicker("lunch", idx)}
                        onRemove={(idx) => onRemoveExtra("lunch", idx)}
                        onAdd={() => openExtraPicker("lunch", null)}
                  inPantry={inPantry}
                      />
                    )}
                    {dayPlan.lunchOverridden && (
                      <button onClick={onResetLunch} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pl-1">
                        <RotateCcw size={11} /> Restaurar sugerencia
                      </button>
                    )}
                  </div>
                ) : (
                  <AddMealButton onClick={() => openMainPicker("lunch")} />
                )}
              </DraggableMealSlot>

              {/* Nico lunch */}
              <div className="border-t border-border pt-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Baby size={12} className="text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">Nico</span>
                  {!dayPlan.babyLunchOverridden && dayPlan.babyLunch && (
                    <span className="text-xs text-muted-foreground italic">sugerido de anoche</span>
                  )}
                </div>
                <DraggableMealSlot droppableId={`${dayIndex}-babyLunch`} hasMeal={!!dayPlan.babyLunch}>
                  {dayPlan.babyLunch ? (
                    <div className="space-y-1">
                      <MealDisplay
                        meal={dayPlan.babyLunch} side={dayPlan.babyLunchSide} note={dayPlan.babyLunchNote}
                        onChangeNote={onSetBabyLunchNote}
                        onRemove={() => onRemoveMain("babyLunch")}
                        onChangeMeal={() => openMainPicker("babyLunch")}
                        onChangeSide={() => openSidePicker("babyLunch")}
                        onRemoveSide={() => onSetBabyLunchSide(null)}
                        isBaby showSide inPantry={inPantry}
                      />
                      <ExtraItems
                        extras={dayPlan.babyLunchExtras ?? []}
                        onEdit={(idx) => openExtraPicker("babyLunch", idx)}
                        onRemove={(idx) => onRemoveExtra("babyLunch", idx)}
                        onAdd={() => openExtraPicker("babyLunch", null)}
                  inPantry={inPantry}
                      />
                      {dayPlan.babyLunchOverridden && (
                        <button onClick={onResetBabyLunch} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pl-1">
                          <RotateCcw size={11} /> Restaurar sugerencia
                        </button>
                      )}
                    </div>
                  ) : (
                    <AddMealButton onClick={() => openMainPicker("babyLunch")} />
                  )}
                </DraggableMealSlot>
              </div>
            </div>

            {/* ── SNACK ── */}
            <SimpleMealSlot
              label="Merienda · Nico"
              accent="text-foreground"
              bgClass="bg-muted/40"
              borderClass="border-border"
              meal={dayPlan.snack}
              note={dayPlan.snackNote}
              onPickMain={() => openMainPicker("snack")}
              onChangeNote={onSetSnackNote}
              onRemove={() => onRemoveMain("snack")}
              droppableId={`${dayIndex}-snack`}
              inPantry={inPantry}
              dayIndex={dayIndex}
              extras={
                <ExtraItems
                  extras={dayPlan.snackExtras ?? []}
                  onEdit={(idx) => openExtraPicker("snack", idx)}
                  onRemove={(idx) => onRemoveExtra("snack", idx)}
                  onAdd={() => openExtraPicker("snack", null)}
                  inPantry={inPantry}
                />
              }
            />

            {/* ── DINNER ── */}
            <div className="rounded-lg bg-muted/40 p-3 border border-border space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  {isEatingOut ? `${dinnerEmoji} ${dinnerLabel}` : "Cena"}
                </span>
              </div>

              {/* Adults dinner */}
              <DraggableMealSlot droppableId={`${dayIndex}-dinner`} hasMeal={!!dayPlan.dinner}>
                {dayPlan.dinner ? (
                  <div className="space-y-1">
                    <MealDisplay
                      meal={dayPlan.dinner} side={dayPlan.dinnerSide} note={dayPlan.dinnerNote}
                      onChangeNote={onSetDinnerNote}
                      onRemove={() => onRemoveMain("dinner")}
                      onChangeMeal={() => openMainPicker("dinner")}
                      onChangeSide={() => openSidePicker("dinner")}
                      onRemoveSide={() => onSetDinnerSide(null)}
                      babySafety showSide inPantry={inPantry}
                    />
                    {!isEatingOutMeal(dayPlan.dinner) && (
                      <ExtraItems
                        extras={dayPlan.dinnerExtras ?? []}
                        onEdit={(idx) => openExtraPicker("dinner", idx)}
                        onRemove={(idx) => onRemoveExtra("dinner", idx)}
                        onAdd={() => openExtraPicker("dinner", null)}
                  inPantry={inPantry}
                      />
                    )}
                  </div>
                ) : (
                  <AddMealButton onClick={() => openMainPicker("dinner")} />
                )}
              </DraggableMealSlot>

              {/* Nico dinner */}
              <div className="border-t border-border pt-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Baby size={12} className="text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">Nico</span>
                  {!dayPlan.babyDinnerOverridden && dayPlan.babyDinner && (
                    <span className="text-xs text-muted-foreground italic">sugerido de anoche</span>
                  )}
                </div>
                <DraggableMealSlot droppableId={`${dayIndex}-babyDinner`} hasMeal={!!dayPlan.babyDinner}>
                  {dayPlan.babyDinner ? (
                    <div className="space-y-1">
                      <MealDisplay
                        meal={dayPlan.babyDinner} side={dayPlan.babyDinnerSide} note={dayPlan.babyDinnerNote}
                        onChangeNote={onSetBabyDinnerNote}
                        onRemove={() => onRemoveMain("babyDinner")}
                        onChangeMeal={() => openMainPicker("babyDinner")}
                        onChangeSide={() => openSidePicker("babyDinner")}
                        onRemoveSide={() => onSetBabyDinnerSide(null)}
                        isBaby showSide inPantry={inPantry}
                      />
                      <ExtraItems
                        extras={dayPlan.babyDinnerExtras ?? []}
                        onEdit={(idx) => openExtraPicker("babyDinner", idx)}
                        onRemove={(idx) => onRemoveExtra("babyDinner", idx)}
                        onAdd={() => openExtraPicker("babyDinner", null)}
                  inPantry={inPantry}
                      />
                      {dayPlan.babyDinnerOverridden && (
                        <button onClick={onResetBabyDinner} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pl-1">
                          <RotateCcw size={11} /> Restaurar sugerencia
                        </button>
                      )}
                    </div>
                  ) : (
                    <AddMealButton onClick={() => openMainPicker("babyDinner")} />
                  )}
                </DraggableMealSlot>
              </div>
            </div>
          </div>
        )}
      </div>

      {pickerTarget && (
        <MealPicker
          mode={pickerMode}
          step={pickerStep}
          prevDinner={pickerPrevDinner}
          extraMeals={extraMeals}
          ingredients={ingredients}
          highlightPantry
          suggestable={!extraEdit}
          onCustomMeal={onCustomMeal}
          onCustomIngredient={onCustomIngredient}
          onSelect={handlePickerSelect}
          onClose={closePicker}
          onSkipSide={closePicker}
          categories={
            pickerTarget === "breakfast" ? ["Desayunos"]
            : pickerTarget === "snack" ? ["Meriendas"]
            : undefined
          }
          title={
            extraEdit ? "Agregar algo más"
            : pickerTarget === "breakfast" ? "Elegir desayuno"
            : pickerTarget === "snack" ? "Elegir merienda"
            : undefined
          }
        />
      )}
    </>
  );
}
