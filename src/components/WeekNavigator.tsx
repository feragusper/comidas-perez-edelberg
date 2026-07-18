import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { addWeeks, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { toWeekKey, weekKeyToDate, currentWeekKey } from "@/lib/env";
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
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={goBack} aria-label="Semana anterior">
        <ChevronLeft size={16} />
      </Button>

      {/* Label / calendar trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-44 gap-1.5 font-medium">
            <CalendarDays size={14} className="shrink-0" />
            <span className="truncate">{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-2 border-b border-border">
            <Button size="sm" variant="secondary" className="w-full" onClick={() => { goToday(); setOpen(false); }}>
              Ir a semana actual
            </Button>
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
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={goForward} aria-label="Semana siguiente">
        <ChevronRight size={16} />
      </Button>

      {/* "Hoy" shortcut when not on current week */}
      {!isCurrentWeek && (
        <Button variant="secondary" size="sm" className="ml-1" onClick={goToday}>
          Hoy
        </Button>
      )}
    </div>
  );
}
