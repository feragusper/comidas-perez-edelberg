import { startOfWeek, getISOWeek, getISOWeekYear, addWeeks, format } from "date-fns";

/**
 * Detect if we're running in the Lovable preview / staging environment.
 */
export function isStageEnv(): boolean {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.includes("id-preview--") ||
    host.includes("lovableproject.com")
  );
}

/**
 * Returns the ISO week key for a given date, e.g. "2025-W12"
 */
export function toWeekKey(date: Date): string {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const year = getISOWeekYear(weekStart);
  const week = getISOWeek(weekStart);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/**
 * Returns the Monday (start) of the week for a given ISO week key.
 */
export function weekKeyToDate(weekKey: string): Date {
  const [yearStr, weekStr] = weekKey.split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  // Jan 4 is always in week 1
  const jan4 = new Date(year, 0, 4);
  const startOfYear = startOfWeek(jan4, { weekStartsOn: 1 });
  return addWeeks(startOfYear, week - 1);
}

/**
 * Returns a human-readable label for a week key.
 * e.g. "23 mar – 29 mar" or "Semana actual"
 */
export function weekKeyLabel(weekKey: string, currentWeekKey: string): string {
  if (weekKey === currentWeekKey) return "Semana actual";
  const monday = weekKeyToDate(weekKey);
  const sunday = addWeeks(monday, 1);
  sunday.setDate(sunday.getDate() - 1);
  const fmt = (d: Date) => format(d, "d MMM", { locale: undefined });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

/**
 * Returns the DB week_key prefix for the current environment.
 * Stage keys: "stage_<isoWeekKey>"
 * Prod keys:  "prod_<isoWeekKey>"
 */
export function envWeekKey(weekKey: string): string {
  return `${isStageEnv() ? "stage" : "prod"}_${weekKey}`;
}

/**
 * Returns today's ISO week key.
 */
export function currentWeekKey(): string {
  return toWeekKey(new Date());
}

/** DAYS array order: Lunes=0 … Domingo=6, matching JS getDay() 1-0 */
const JS_DAY_TO_IDX: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };

/**
 * Returns the index (0=Lunes … 6=Domingo) of today within the DAYS array,
 * or -1 if it's a different week.
 */
export function todayDayIndex(weekKey: string): number {
  const now = new Date();
  if (toWeekKey(now) !== weekKey) return -1;
  return JS_DAY_TO_IDX[now.getDay()];
}
