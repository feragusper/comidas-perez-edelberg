import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isStageEnv } from "@/lib/env";
import { DayPlan } from "@/hooks/useMealPlan";
import { Meal } from "@/data/meals";
import { ArrowLeft, BarChart3, PieChart, TrendingUp, Utensils, Baby } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MealCount {
  name: string;
  emoji: string;
  count: number;
  category: string;
}

type Section = "dinners" | "lunches" | "babyDinners" | "babyLunches";

function extractMeals(plans: DayPlan[][], getter: (d: DayPlan) => Meal | null): MealCount[] {
  const map = new Map<string, MealCount>();
  for (const week of plans) {
    for (const day of week) {
      const meal = getter(day);
      if (!meal) continue;
      const existing = map.get(meal.id);
      if (existing) {
        existing.count++;
      } else {
        map.set(meal.id, { name: meal.name, emoji: meal.emoji, count: 1, category: meal.category });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

function categoryBreakdown(meals: MealCount[]): { category: string; count: number; pct: number }[] {
  const total = meals.reduce((s, m) => s + m.count, 0);
  const map = new Map<string, number>();
  for (const m of meals) {
    map.set(m.category, (map.get(m.category) || 0) + m.count);
  }
  return Array.from(map.entries())
    .map(([category, count]) => ({ category, count, pct: total ? Math.round((count / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);
}

const SECTION_CONFIG: Record<Section, { label: string; icon: typeof Utensils; baby?: boolean }> = {
  dinners: { label: "Cenas", icon: Utensils },
  lunches: { label: "Almuerzos", icon: Utensils },
  babyDinners: { label: "Cenas bebé", icon: Baby, baby: true },
  babyLunches: { label: "Almuerzos bebé", icon: Baby, baby: true },
};

const GETTERS: Record<Section, (d: DayPlan) => Meal | null> = {
  dinners: (d) => d.dinner,
  lunches: (d) => d.lunch,
  babyDinners: (d) => d.babyDinner,
  babyLunches: (d) => d.babyLunch,
};

const BAR_COLORS: Record<Section, string> = {
  dinners: "bg-primary",
  lunches: "bg-primary/70",
  babyDinners: "bg-baby-safe",
  babyLunches: "bg-baby-safe/70",
};

export default function Reports() {
  const [allPlans, setAllPlans] = useState<DayPlan[][]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("dinners");

  useEffect(() => {
    const prefix = isStageEnv() ? "stage_" : "prod_";
    supabase
      .from("meal_plan")
      .select("plan, week_key")
      .like("week_key", `${prefix}%`)
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading reports:", error);
        } else if (data) {
          const plans = data
            .filter((row) => Array.isArray(row.plan) && (row.plan as unknown[]).length > 0)
            .map((row) => row.plan as unknown as DayPlan[]);
          setAllPlans(plans);
        }
        setLoading(false);
      });
  }, []);

  const meals = extractMeals(allPlans, GETTERS[activeSection]);
  const total = meals.reduce((s, m) => s + m.count, 0);
  const categories = categoryBreakdown(meals);
  const maxCount = meals.length > 0 ? meals[0].count : 1;
  const weeksCount = allPlans.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-4 sm:px-8 py-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <BarChart3 size={22} className="text-primary" />
          <h1 className="text-xl font-bold text-foreground">Reportes</h1>
          <span className="text-xs text-muted-foreground ml-auto">
            {weeksCount} semana{weeksCount !== 1 ? "s" : ""} de datos
          </span>
        </div>
      </div>

      <div className="px-4 sm:px-8 py-4 max-w-5xl mx-auto space-y-6 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Cargando datos…</div>
        ) : weeksCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-sm gap-2">
            <BarChart3 size={40} className="opacity-30" />
            <p>No hay datos todavía. Planificá algunas semanas primero.</p>
          </div>
        ) : (
          <>
            {/* Section tabs */}
            <div className="flex gap-1 bg-muted/60 rounded-xl p-1 flex-wrap">
              {(Object.keys(SECTION_CONFIG) as Section[]).map((key) => {
                const cfg = SECTION_CONFIG[key];
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      activeSection === key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon size={13} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SummaryCard icon={<Utensils size={16} />} label="Total comidas" value={total} />
              <SummaryCard icon={<PieChart size={16} />} label="Platos únicos" value={meals.length} />
              <SummaryCard icon={<TrendingUp size={16} />} label="Más popular" value={meals[0]?.emoji ?? "—"} subtitle={meals[0]?.name} />
              <SummaryCard icon={<BarChart3 size={16} />} label="Categorías" value={categories.length} />
            </div>

            {/* Category breakdown */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <PieChart size={14} className="text-primary" /> Por categoría
              </h2>
              {categories.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground font-medium">{cat.category}</span>
                    <span className="text-muted-foreground">{cat.count} ({cat.pct}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", BAR_COLORS[activeSection])} style={{ width: `${cat.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Meal ranking */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-2">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp size={14} className="text-primary" /> Ranking de platos
              </h2>
              {meals.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">Sin datos para esta sección.</p>
              )}
              {meals.map((meal, idx) => (
                <div key={meal.name} className="flex items-center gap-3 py-1.5">
                  <span className="text-xs text-muted-foreground w-5 text-right font-mono">{idx + 1}</span>
                  <span className="text-lg">{meal.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{meal.name}</span>
                      <span className="text-[10px] text-muted-foreground">{meal.category}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className={cn("h-full rounded-full transition-all", BAR_COLORS[activeSection])}
                        style={{ width: `${(meal.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-foreground">{meal.count}</span>
                  <span className="text-[10px] text-muted-foreground w-10 text-right">
                    {total ? Math.round((meal.count / total) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, subtitle }: { icon: React.ReactNode; label: string; value: string | number; subtitle?: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
        {icon} {label}
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      {subtitle && <div className="text-[10px] text-muted-foreground truncate">{subtitle}</div>}
    </div>
  );
}
