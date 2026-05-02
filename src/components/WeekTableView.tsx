import { useState } from "react";
import { DayPlan, isDeliveryMeal, isEatingOutMeal } from "@/hooks/useMealPlan";
import { Meal } from "@/data/meals";
import { MealPicker, PickerMode, PickerStep } from "./MealPicker";
import { Baby, Plus, Trash2, Pencil, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Droppable, Draggable } from "@hello-pangea/dnd";

type SlotKey = "breakfast" | "lunch" | "babyLunch" | "snack" | "dinner" | "babyDinner";

interface WeekTableViewProps {
  plan: DayPlan[];
  todayIdx?: number;
  extraMeals?: Meal[];
  onCustomMeal?: (meal: Meal) => void;
  onSetDinner: (i: number, meal: Meal | null) => void;
  onSetDinnerSide: (i: number, meal: Meal | null) => void;
  onSetDinnerNote: (i: number, note: string) => void;
  onSetLunch: (i: number, meal: Meal | null) => void;
  onSetLunchSide: (i: number, meal: Meal | null) => void;
  onSetLunchNote: (i: number, note: string) => void;
  onSetBabyDinner: (i: number, meal: Meal | null) => void;
  onSetBabyDinnerSide: (i: number, meal: Meal | null) => void;
  onSetBabyDinnerNote: (i: number, note: string) => void;
  onSetBabyLunch: (i: number, meal: Meal | null) => void;
  onSetBabyLunchSide: (i: number, meal: Meal | null) => void;
  onSetBabyLunchNote: (i: number, note: string) => void;
  onSetBreakfast: (i: number, meal: Meal | null) => void;
  onSetBreakfastNote: (i: number, v: string) => void;
  onSetSnack: (i: number, meal: Meal | null) => void;
  onSetSnackNote: (i: number, v: string) => void;
}

const SHORT_DAYS: Record<string, string> = {
  Lunes: "Lun", Martes: "Mar", Miércoles: "Mié",
  Jueves: "Jue", Viernes: "Vie", Sábado: "Sáb", Domingo: "Dom",
};

const ROWS: {
  slot: SlotKey;
  label: string;
  isBaby: boolean;
  headerBg: string;
  headerText: string;
  cellBg: string;
  borderColor: string;
  icon?: string;
}[] = [
  { slot: "breakfast",  label: "Desayuno · Nico", isBaby: true,  headerBg: "bg-amber-50/60",  headerText: "text-baby-safe",  cellBg: "bg-amber-50/20",  borderColor: "border-baby-safe/20",  icon: "🥐" },
  { slot: "lunch",      label: "☀ Almuerzo",      isBaby: false, headerBg: "bg-lunch-bg",     headerText: "text-secondary",  cellBg: "bg-lunch-bg/40",  borderColor: "border-secondary/20" },
  { slot: "babyLunch",  label: "Nico · Almuerzo", isBaby: true,  headerBg: "bg-lunch-bg/60",  headerText: "text-baby-safe",  cellBg: "bg-lunch-bg/20",  borderColor: "border-baby-safe/20" },
  { slot: "snack",      label: "Merienda · Nico", isBaby: true,  headerBg: "bg-amber-50/60",  headerText: "text-baby-safe",  cellBg: "bg-amber-50/20", borderColor: "border-baby-safe/20",  icon: "🫖" },
  { slot: "dinner",     label: "🌙 Cena",         isBaby: false, headerBg: "bg-dinner-bg",    headerText: "text-primary",    cellBg: "bg-dinner-bg/40", borderColor: "border-primary/20"   },
  { slot: "babyDinner", label: "Nico · Cena",     isBaby: true,  headerBg: "bg-dinner-bg/60", headerText: "text-baby-safe",  cellBg: "bg-dinner-bg/20", borderColor: "border-baby-safe/20" },
];

function getSlotData(d: DayPlan, slot: SlotKey): { meal: Meal | null; side: Meal | null; note: string } {
  if (slot === "breakfast")  return { meal: d.breakfast,  side: null,             note: d.breakfastNote };
  if (slot === "snack")      return { meal: d.snack,      side: null,             note: d.snackNote };
  if (slot === "lunch")      return { meal: d.lunch,      side: d.lunchSide,      note: d.lunchNote };
  if (slot === "babyLunch")  return { meal: d.babyLunch,  side: d.babyLunchSide,  note: d.babyLunchNote };
  if (slot === "dinner")     return { meal: d.dinner,     side: d.dinnerSide,     note: d.dinnerNote };
  /* babyDinner */           return { meal: d.babyDinner, side: d.babyDinnerSide, note: d.babyDinnerNote };
}

interface CellProps {
  meal: Meal | null;
  side: Meal | null;
  note: string;
  isBaby: boolean;
  onPickMain: () => void;
  onPickSide: () => void;
  onRemove: () => void;
  onRemoveSide: () => void;
  onChangeNote: (v: string) => void;
}

function EditableCell({ meal, side, note, isBaby, onPickMain, onPickSide, onRemove, onRemoveSide, onChangeNote }: CellProps) {
  const textColor = isBaby ? "text-baby-safe" : "text-foreground";

  if (!meal) {
    return (
      <button
        onClick={onPickMain}
        className="w-full h-full min-h-[52px] flex items-center justify-center border border-dashed border-border/60 rounded-lg hover:border-primary/40 hover:bg-primary/5 transition-all group"
      >
        <Plus size={13} className="text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
      </button>
    );
  }

  return (
    <div className="space-y-1 group relative">
      {/* Main meal */}
      <div className="flex items-start gap-1">
        <span className="text-sm shrink-0">{meal.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className={cn("text-xs font-medium leading-tight", textColor)}>{meal.name}</p>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onPickMain} className="p-0.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
            <Pencil size={10} />
          </button>
          <button onClick={onRemove} className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 size={10} />
          </button>
        </div>
      </div>

      {/* Side */}
      {side ? (
        <div className="flex items-center gap-1 pl-5">
          <span className="text-xs text-muted-foreground">{side.emoji}</span>
          <span className="text-xs text-muted-foreground flex-1 leading-tight">{side.name}</span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onPickSide} className="p-0.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
              <Pencil size={9} />
            </button>
            <button onClick={onRemoveSide} className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 size={9} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onPickSide}
          className="ml-5 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 text-xs text-muted-foreground/60 hover:text-secondary transition-all"
        >
          <Plus size={9} /> guarnición
        </button>
      )}

      {/* Note */}
      <input
        type="text"
        value={note}
        onChange={(e) => onChangeNote(e.target.value)}
        placeholder="nota..."
        className="w-full pl-5 text-xs bg-transparent border-0 border-b border-transparent focus:border-border focus:outline-none placeholder:text-muted-foreground/30 text-muted-foreground/70 py-0 transition-colors"
      />
    </div>
  );
}


export function WeekTableView({
  plan,
  todayIdx = -1,
  extraMeals = [],
  onCustomMeal,
  onSetDinner, onSetDinnerSide, onSetDinnerNote,
  onSetLunch, onSetLunchSide, onSetLunchNote,
  onSetBabyDinner, onSetBabyDinnerSide, onSetBabyDinnerNote,
  onSetBabyLunch, onSetBabyLunchSide, onSetBabyLunchNote,
  onSetBreakfast, onSetBreakfastNote, onSetSnack, onSetSnackNote,
}: WeekTableViewProps) {
  const [pickerDay, setPickerDay] = useState<number | null>(null);
  const [pickerSlot, setPickerSlot] = useState<SlotKey | null>(null);
  const [pickerStep, setPickerStep] = useState<PickerStep>("main");

  const openMain = (dayIdx: number, slot: SlotKey) => {
    setPickerDay(dayIdx); setPickerSlot(slot); setPickerStep("main");
  };
  const openSide = (dayIdx: number, slot: SlotKey) => {
    setPickerDay(dayIdx); setPickerSlot(slot); setPickerStep("side");
  };
  const closePicker = () => { setPickerDay(null); setPickerSlot(null); };

  const getMainSetter = (slot: SlotKey, i: number) => (meal: Meal | null) => {
    if (slot === "breakfast")  onSetBreakfast(i, meal);
    if (slot === "snack")      onSetSnack(i, meal);
    if (slot === "lunch")      onSetLunch(i, meal);
    if (slot === "babyLunch")  onSetBabyLunch(i, meal);
    if (slot === "dinner")     onSetDinner(i, meal);
    if (slot === "babyDinner") onSetBabyDinner(i, meal);
  };
  const getSideSetter = (slot: SlotKey, i: number) => (meal: Meal | null) => {
    if (slot === "lunch")      onSetLunchSide(i, meal);
    if (slot === "babyLunch")  onSetBabyLunchSide(i, meal);
    if (slot === "dinner")     onSetDinnerSide(i, meal);
    if (slot === "babyDinner") onSetBabyDinnerSide(i, meal);
  };
  const getNoteSetter = (slot: SlotKey, i: number) => (note: string) => {
    if (slot === "breakfast")  onSetBreakfastNote(i, note);
    if (slot === "snack")      onSetSnackNote(i, note);
    if (slot === "lunch")      onSetLunchNote(i, note);
    if (slot === "babyLunch")  onSetBabyLunchNote(i, note);
    if (slot === "dinner")     onSetDinnerNote(i, note);
    if (slot === "babyDinner") onSetBabyDinnerNote(i, note);
  };

  const slotHasSide = (slot: SlotKey | null) => slot !== "breakfast" && slot !== "snack";

  const handlePickerSelect = (meal: Meal) => {
    if (pickerDay === null || !pickerSlot) return;
    if (pickerStep === "main") {
      getMainSetter(pickerSlot, pickerDay)(meal);
      if (slotHasSide(pickerSlot)) setPickerStep("side");
      else closePicker();
    } else {
      getSideSetter(pickerSlot, pickerDay)(meal);
      closePicker();
    }
  };

  const pickerMode: PickerMode = (pickerSlot === "babyDinner" || pickerSlot === "babyLunch") ? "baby" : "adult";
  const pickerPrevDinner = (pickerSlot === "lunch" || pickerSlot === "babyLunch") && pickerDay !== null && pickerDay > 0
    ? plan[pickerDay - 1].dinner
    : null;

  return (
    <>
      <div className="rounded-2xl border border-border shadow-card">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              <th className="w-[130px] min-w-[130px] bg-muted/60 border-b border-r border-border" />
              {plan.map((d, idx) => {
                const isToday = todayIdx === idx;
                const isPast = todayIdx !== -1 && idx < todayIdx;
                const isDel = isDeliveryMeal(d.dinner);
                const isPasta = d.dinner?.id === "pasta-domingo" || d.dinner?.id === "pasta";
                return (
                  <th
                    key={d.day}
                    className={cn(
                      "border-b border-r last:border-r-0 border-border px-2 py-2 text-center transition-all",
                      isDel ? "bg-warning/10" : isToday ? "bg-primary/10" : isPast ? "bg-muted/20" : "bg-muted/40",
                      isPast && "opacity-50"
                    )}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1 justify-center">
                        <span
                          className={cn("text-xs font-bold uppercase tracking-wider",
                            isDel ? "text-warning" : isToday ? "text-primary" : "text-foreground"
                          )}
                          style={{ fontFamily: "Fraunces, serif" }}
                        >
                          {SHORT_DAYS[d.day] ?? d.day}
                        </span>
                        {isPasta && !isDel && <span className="text-[11px] leading-none" title="Noche de pasta">🍝</span>}
                        {isDel && <span className="text-[11px] leading-none" title="Noche de delivery">🛵</span>}
                      </div>
                      {isToday && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider px-1 py-0 rounded-full bg-primary text-primary-foreground leading-4">
                          Hoy
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.slot}>
                <td className={cn("px-3 py-2 border-r border-b border-border", row.headerBg)}>
                  <div className="flex items-center gap-1">
                    {row.isBaby && <Baby size={11} className="text-baby-safe shrink-0" />}
                    {row.icon && <span className="text-sm">{row.icon}</span>}
                    <span className={cn("text-xs font-semibold whitespace-nowrap", row.headerText)}>{row.label}</span>
                  </div>
                </td>
                {plan.map((dayPlan, idx) => {
                  const isToday = todayIdx === idx;
                  const isPast = todayIdx !== -1 && idx < todayIdx;
                  const { meal, side, note } = getSlotData(dayPlan, row.slot);
                  return (
                    <td
                      key={dayPlan.day}
                      className={cn(
                        "px-2 py-2 border-r border-b last:border-r-0 border-border align-top min-w-[100px] transition-all",
                        row.cellBg,
                        isToday && "ring-inset ring-1 ring-primary/30",
                        isPast && "opacity-40"
                      )}
                    >
                      <Droppable droppableId={`${idx}-${row.slot}`}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn("min-h-[52px] rounded-lg transition-colors", snapshot.isDraggingOver && "bg-primary/10 ring-2 ring-primary/30")}
                          >
                            {meal ? (
                              <Draggable draggableId={`${idx}-${row.slot}`} index={0}>
                                {(dragProvided, dragSnapshot) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    className={cn("transition-shadow", dragSnapshot.isDragging && "shadow-lg rounded-lg bg-card p-1")}
                                  >
                                    <div className="flex items-start gap-0.5">
                                      <div {...dragProvided.dragHandleProps} className="pt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground shrink-0">
                                        <GripVertical size={10} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <EditableCell
                                          meal={meal} side={side} note={note} isBaby={row.isBaby}
                                          onPickMain={() => openMain(idx, row.slot)}
                                          onPickSide={() => openSide(idx, row.slot)}
                                          onRemove={() => { getMainSetter(row.slot, idx)(null); getSideSetter(row.slot, idx)(null); }}
                                          onRemoveSide={() => getSideSetter(row.slot, idx)(null)}
                                          onChangeNote={getNoteSetter(row.slot, idx)}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ) : (
                              <EditableCell
                                meal={null} side={null} note="" isBaby={row.isBaby}
                                onPickMain={() => openMain(idx, row.slot)}
                                onPickSide={() => openSide(idx, row.slot)}
                                onRemove={() => {}}
                                onRemoveSide={() => {}}
                                onChangeNote={() => {}}
                              />
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pickerDay !== null && pickerSlot && (
        <MealPicker
          mode={pickerMode}
          step={pickerStep}
          prevDinner={pickerPrevDinner}
          extraMeals={extraMeals}
          onCustomMeal={onCustomMeal}
          onSelect={handlePickerSelect}
          onClose={closePicker}
          onSkipSide={closePicker}
        />
      )}
    </>
  );
}
