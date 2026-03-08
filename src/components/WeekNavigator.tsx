import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { addWeeks, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toWeekKey, weekKeyToDate, currentWeekKey } from "@/lib/env";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface WeekNavigatorProps {
  weekKey: string;
  onChange: (weekKey: string) => void;
}

export function WeekNavigator({ weekKey, onChange }: WeekNavigatorProps) {
  const [open, setOpen] = useState(false);
  const todayKey = currentWeekKey();
  const isCurrentWeek = weekKey === todayKey;

  const monday = weekKeyToDate(weekKey);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const label = isCurrentWeek
    ? "Semana actual"
    : `${format(monday, "d MMM", { locale: es })} – ${format(sunday, "d MMM", { locale: es })}`;

  const goBack = () => onChange(toWeekKey(addWeeks(monday, -1)));
  const goForward = () => onChange(toWeekKey(addWeeks(monday, 1)));
  const goToday = () => onChange(todayKey);

  const handleDaySelect = (date: Date | undefined) => {
    if (!date) return;
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    onChange(toWeekKey(weekStart));
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-1">
      {/* Prev week */}
      <button
        onClick={goBack}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        aria-label="Semana anterior"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Label / calendar trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all w-44",
              isCurrentWeek
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-foreground hover:bg-muted"
            )}
          >
            <CalendarDays size={14} className="shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-2 border-b border-border">
            <button
              onClick={() => { goToday(); setOpen(false); }}
              className="w-full text-xs text-center py-1.5 px-3 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
            >
              Ir a semana actual
            </button>
          </div>
          <Calendar
            mode="single"
            selected={monday}
            onSelect={handleDaySelect}
            locale={es}
            className="pointer-events-auto"
            modifiers={{
              weekSelected: (date) => {
                const ws = startOfWeek(date, { weekStartsOn: 1 });
                return toWeekKey(ws) === weekKey;
              },
            }}
            modifiersClassNames={{
              weekSelected: "bg-primary/20 rounded-none",
            }}
          />
        </PopoverContent>
      </Popover>

      {/* Next week */}
      <button
        onClick={goForward}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        aria-label="Semana siguiente"
      >
        <ChevronRight size={16} />
      </button>

      {/* "Hoy" shortcut when not on current week */}
      {!isCurrentWeek && (
        <button
          onClick={goToday}
          className="ml-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          Hoy
        </button>
      )}
    </div>
  );
}
