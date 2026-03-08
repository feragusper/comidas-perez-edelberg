import { DayPlan } from "@/hooks/useMealPlan";
import { Meal } from "@/data/meals";
import { Baby } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeekTableViewProps {
  plan: DayPlan[];
}

function MealCell({ meal, side, note, isBaby }: {
  meal: Meal | null;
  side?: Meal | null;
  note?: string;
  isBaby?: boolean;
}) {
  if (!meal) return <span className="text-muted-foreground/40 text-xs italic">—</span>;

  return (
    <div className="space-y-0.5 text-left">
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-sm">{meal.emoji}</span>
        <span className={cn("text-xs font-medium leading-tight", isBaby ? "text-baby-safe" : "text-foreground")}>
          {meal.name}
        </span>
      </div>
      {side && (
        <div className="flex items-center gap-1 pl-0.5">
          <span className="text-xs text-muted-foreground">+</span>
          <span className="text-xs text-muted-foreground">{side.emoji} {side.name}</span>
        </div>
      )}
      {note && (
        <p className="text-xs text-muted-foreground/70 italic leading-tight pl-0.5">{note}</p>
      )}
    </div>
  );
}

const SHORT_DAYS: Record<string, string> = {
  Lunes: "Lun",
  Martes: "Mar",
  Miércoles: "Mié",
  Jueves: "Jue",
  Viernes: "Vie",
  Sábado: "Sáb",
  Domingo: "Dom",
};

export function WeekTableView({ plan }: WeekTableViewProps) {
  const rows: {
    label: string;
    icon?: React.ReactNode;
    bg: string;
    headerBg: string;
    headerText: string;
    getValue: (d: DayPlan) => { meal: Meal | null; side?: Meal | null; note?: string; isBaby?: boolean };
  }[] = [
    {
      label: "☀ Almuerzo",
      bg: "bg-lunch-bg/50",
      headerBg: "bg-lunch-bg",
      headerText: "text-secondary",
      getValue: (d) => ({ meal: d.lunch, side: d.lunchSide, note: d.lunchNote }),
    },
    {
      label: "Nico · Almuerzo",
      icon: <Baby size={11} className="text-baby-safe" />,
      bg: "bg-lunch-bg/30",
      headerBg: "bg-lunch-bg/60",
      headerText: "text-baby-safe",
      getValue: (d) => ({ meal: d.babyLunch, side: d.babyLunchSide, note: d.babyLunchNote, isBaby: true }),
    },
    {
      label: "🌙 Cena",
      bg: "bg-dinner-bg/50",
      headerBg: "bg-dinner-bg",
      headerText: "text-primary",
      getValue: (d) => ({ meal: d.dinner, side: d.dinnerSide, note: d.dinnerNote }),
    },
    {
      label: "Nico · Cena",
      icon: <Baby size={11} className="text-baby-safe" />,
      bg: "bg-dinner-bg/30",
      headerBg: "bg-dinner-bg/60",
      headerText: "text-baby-safe",
      getValue: (d) => ({ meal: d.babyDinner, side: d.babyDinnerSide, note: d.babyDinnerNote, isBaby: true }),
    },
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-border shadow-card">
      <table className="w-full border-collapse min-w-[700px]">
        <thead>
          <tr>
            {/* Row label column header */}
            <th className="w-[110px] min-w-[90px] bg-muted/60 border-b border-r border-border" />
            {plan.map((d) => (
              <th
                key={d.day}
                className={cn(
                  "border-b border-r last:border-r-0 border-border px-2 py-2 text-center",
                  d.day === "Domingo" ? "bg-sunday-accent/10" : "bg-muted/40"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-bold uppercase tracking-wider",
                    d.day === "Domingo" ? "text-sunday-accent" : "text-foreground"
                  )}
                  style={{ fontFamily: "Fraunces, serif" }}
                >
                  {SHORT_DAYS[d.day] ?? d.day}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {/* Row label */}
              <td className={cn("px-3 py-2 border-r border-b last:border-b-0 border-border", row.headerBg)}>
                <div className="flex items-center gap-1">
                  {row.icon}
                  <span className={cn("text-xs font-semibold whitespace-nowrap", row.headerText)}>
                    {row.label}
                  </span>
                </div>
              </td>
              {plan.map((dayPlan) => {
                const { meal, side, note, isBaby } = row.getValue(dayPlan);
                return (
                  <td
                    key={dayPlan.day}
                    className={cn(
                      "px-2.5 py-2 border-r border-b last:border-r-0 last:border-b-0 border-border align-top min-w-[90px]",
                      row.bg,
                      dayPlan.day === "Domingo" && "border-l border-sunday-accent/20"
                    )}
                  >
                    <MealCell meal={meal} side={side} note={note} isBaby={isBaby} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
