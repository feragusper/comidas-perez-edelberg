import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isStageEnv } from "@/lib/env";
import { DayPlan } from "@/hooks/useMealPlan";
import { Meal } from "@/data/meals";
import { BarChart3, PieChart, TrendingUp, Utensils, Baby, Coffee, Cookie, Layers, Users, Leaf, ChevronDown, ChevronRight, Tag, Carrot, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";

import { TopNav } from "@/components/TopNav";
import { CollapsibleGroup } from "@/components/CollapsibleGroup";
import { cn } from "@/lib/utils";
import { TAXONOMY, parseTag, categoryOf } from "@/data/foodTaxonomy";
import { MEALS } from "@/data/meals";
import { useMeals } from "@/hooks/useMeals";
import { useIngredients } from "@/hooks/useIngredients";
import { Ingredient, SENTINEL_MEAL_IDS as SENTINEL_IDS, ingredientSlug } from "@/data/food";

interface IngredientCount {
  id: string;
  name: string;
  emoji: string;
  count: number;
  tags: string[];
}

/**
 * Expande las comidas contadas a sus ingredientes componentes.
 * Snapshots con kind "ingredient" cuentan directo; comidas se resuelven
 * contra el catálogo vivo. Devuelve también cuántas ocurrencias quedaron
 * sin expandir (comidas sin normalizar).
 */
function buildIngredientBreakdown(
  meals: MealCount[],
  catalogById: Map<string, Meal>,
  ingredientById: Map<string, Ingredient>,
): { ranking: IngredientCount[]; unnormalizedCount: number } {
  const counts = new Map<string, IngredientCount>();
  let unnormalized = 0;

  const add = (id: string, count: number) => {
    const existing = counts.get(id);
    if (existing) { existing.count += count; return; }
    const ing = ingredientById.get(id);
    counts.set(id, {
      id,
      name: ing?.name ?? id,
      emoji: ing?.emoji ?? "🛒",
      count,
      tags: ing?.tags ?? [],
    });
  };

  for (const m of meals) {
    if (SENTINEL_IDS.has(m.id)) continue;
    if (m.kind === "ingredient") { add(m.id, m.count); continue; }
    const catalogMeal = catalogById.get(m.id);
    if (catalogMeal) {
      const ids = catalogMeal.ingredientIds ?? [];
      if (ids.length === 0) { unnormalized += m.count; continue; }
      for (const iid of ids) add(iid, m.count);
      continue;
    }
    // Comida borrada del catálogo: si fue convertida a ingrediente, se resuelve por nombre
    const bySlug = ingredientById.get(ingredientSlug(m.name));
    if (bySlug) { add(bySlug.id, m.count); continue; }
    unnormalized += m.count;
  }

  return {
    ranking: Array.from(counts.values()).sort((a, b) => b.count - a.count),
    unnormalizedCount: unnormalized,
  };
}

interface MealCount {
  id: string;
  name: string;
  emoji: string;
  count: number;
  category: string;
  isKeto: boolean;
  tags: string[];
  kind?: "meal" | "ingredient";
}

type Persona = "all" | "us" | "nico";
type Section =
  | "all"
  | "dinners" | "lunches"
  | "breakfasts" | "snacks"
  | "babyDinners" | "babyLunches";

type MealGetter = (d: DayPlan) => (Meal | null)[];

function extractMeals(
  plans: DayPlan[][],
  getter: MealGetter,
  tagResolver: (id: string) => string[]
): MealCount[] {
  const map = new Map<string, MealCount>();
  for (const week of plans) {
    for (const day of week) {
      for (const meal of getter(day)) {
        if (!meal) continue;
        const existing = map.get(meal.id);
        if (existing) {
          existing.count++;
        } else {
          const resolvedTags = tagResolver(meal.id);
          map.set(meal.id, {
            id: meal.id,
            name: meal.name,
            emoji: meal.emoji,
            count: 1,
            category: meal.category,
            isKeto: !!meal.isKeto,
            tags: resolvedTags.length > 0 ? resolvedTags : (meal.tags ?? []),
            kind: meal.kind,
          });
        }
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

interface SubCount { sub: string; count: number; pct: number }
interface CatCount { category: string; count: number; pct: number; subs: SubCount[] }

function buildTaxonomyBreakdown(meals: MealCount[]): CatCount[] {
  const catMap = new Map<string, { count: number; subs: Map<string, number> }>();
  for (const m of meals) {
    const tags = m.tags ?? [];
    if (tags.length === 0) continue;
    for (const tag of tags) {
      const parsed = parseTag(tag);
      if (!parsed) continue;
      let entry = catMap.get(parsed.category);
      if (!entry) { entry = { count: 0, subs: new Map() }; catMap.set(parsed.category, entry); }
      entry.count += m.count;
      entry.subs.set(parsed.sub, (entry.subs.get(parsed.sub) || 0) + m.count);
    }
  }
  const total = Array.from(catMap.values()).reduce((s, e) => s + e.count, 0);
  const result: CatCount[] = [];
  for (const cat of TAXONOMY) {
    const entry = catMap.get(cat.id);
    if (!entry) continue;
    const subs: SubCount[] = Array.from(entry.subs.entries())
      .map(([sub, count]) => ({ sub, count, pct: entry.count ? Math.round((count / entry.count) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
    result.push({
      category: cat.id,
      count: entry.count,
      pct: total ? Math.round((entry.count / total) * 100) : 0,
      subs,
    });
  }
  return result.sort((a, b) => b.count - a.count);
}

const US_GETTERS = {
  all: (d: DayPlan) => [d.dinner, d.dinnerSide, ...(d.dinnerExtras ?? []), d.lunch, d.lunchSide, ...(d.lunchExtras ?? [])],
  dinners: (d: DayPlan) => [d.dinner, d.dinnerSide, ...(d.dinnerExtras ?? [])],
  lunches: (d: DayPlan) => [d.lunch, d.lunchSide, ...(d.lunchExtras ?? [])],
} as const;

const NICO_GETTERS = {
  all: (d: DayPlan) => [
    d.breakfast, ...(d.breakfastExtras ?? []),
    d.snack, ...(d.snackExtras ?? []),
    d.babyDinner, d.babyDinnerSide, ...(d.babyDinnerExtras ?? []),
    d.babyLunch, d.babyLunchSide, ...(d.babyLunchExtras ?? []),
  ],
  breakfasts: (d: DayPlan) => [d.breakfast, ...(d.breakfastExtras ?? [])],
  snacks: (d: DayPlan) => [d.snack, ...(d.snackExtras ?? [])],
  babyDinners: (d: DayPlan) => [d.babyDinner, d.babyDinnerSide, ...(d.babyDinnerExtras ?? [])],
  babyLunches: (d: DayPlan) => [d.babyLunch, d.babyLunchSide, ...(d.babyLunchExtras ?? [])],
} as const;


const ALL_GETTERS = {
  all: (d: DayPlan) => [...US_GETTERS.all(d), ...NICO_GETTERS.all(d)],
  dinners: US_GETTERS.dinners,
  lunches: US_GETTERS.lunches,
  breakfasts: NICO_GETTERS.breakfasts,
  snacks: NICO_GETTERS.snacks,
  babyDinners: NICO_GETTERS.babyDinners,
  babyLunches: NICO_GETTERS.babyLunches,
} as const;

const SECTION_LABELS: Record<Section, { label: string; icon: typeof Utensils }> = {
  all: { label: "Todas", icon: Layers },
  dinners: { label: "Cenas", icon: Utensils },
  lunches: { label: "Almuerzos", icon: Utensils },
  breakfasts: { label: "Desayunos", icon: Coffee },
  snacks: { label: "Meriendas", icon: Cookie },
  babyDinners: { label: "Cenas", icon: Baby },
  babyLunches: { label: "Almuerzos", icon: Baby },
};

const PERSONA_SECTIONS: Record<Persona, Section[]> = {
  all: ["all", "dinners", "lunches", "breakfasts", "snacks", "babyDinners", "babyLunches"],
  us: ["all", "dinners", "lunches"],
  nico: ["all", "breakfasts", "snacks", "babyDinners", "babyLunches"],
};

const PERSONA_CONFIG: Record<Persona, { label: string; icon: typeof Utensils; bar: string }> = {
  all: { label: "Todos", icon: Users, bar: "bg-primary" },
  us: { label: "Nosotros", icon: Utensils, bar: "bg-primary" },
  nico: { label: "Nico", icon: Baby, bar: "bg-baby-safe" },
};

function getterFor(persona: Persona, section: Section): MealGetter {
  const map = persona === "us" ? US_GETTERS : persona === "nico" ? NICO_GETTERS : ALL_GETTERS;
  // Section may not exist for persona; fallback to "all"
  return (map as Record<string, MealGetter>)[section] ?? map.all;
}

export default function Reports() {
  const [allPlans, setAllPlans] = useState<DayPlan[][]>([]);
  const [loading, setLoading] = useState(true);
  const [persona, setPersona] = useState<Persona>("all");
  const [section, setSection] = useState<Section>("all");

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

  // If active section isn't valid for persona, reset to "all"
  const availableSections = PERSONA_SECTIONS[persona];
  const activeSection: Section = availableSections.includes(section) ? section : "all";

  const { meals: catalog } = useMeals();
  const tagResolver = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const m of MEALS) map.set(m.id, m.tags ?? []);
    for (const m of catalog) map.set(m.id, m.tags ?? []);
    return (id: string) => map.get(id) ?? [];
  }, [catalog]);

  const meals = useMemo(
    () => extractMeals(allPlans, getterFor(persona, activeSection), tagResolver),
    [allPlans, persona, activeSection, tagResolver]
  );

  const { ingredients } = useIngredients();
  const catalogById = useMemo(() => new Map(catalog.map((m) => [m.id, m])), [catalog]);
  const ingredientById = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);
  const { ranking: ingredientRanking, unnormalizedCount } = useMemo(
    () => buildIngredientBreakdown(meals, catalogById, ingredientById),
    [meals, catalogById, ingredientById]
  );
  const ingredientTotal = ingredientRanking.reduce((s, i) => s + i.count, 0);
  const maxIngredientCount = ingredientRanking.length > 0 ? ingredientRanking[0].count : 1;
  const isUnnormalizedMeal = (m: MealCount) => {
    if (m.kind === "ingredient" || SENTINEL_IDS.has(m.id)) return false;
    const catalogMeal = catalogById.get(m.id);
    if (catalogMeal) return (catalogMeal.ingredientIds ?? []).length === 0;
    return !ingredientById.has(ingredientSlug(m.name));
  };
  const total = meals.reduce((s, m) => s + m.count, 0);
  const ketoCount = meals.reduce((s, m) => s + (m.isKeto ? m.count : 0), 0);
  const ketoPct = total ? Math.round((ketoCount / total) * 100) : 0;
  const categories = categoryBreakdown(meals);
  const taxonomyBreakdown = useMemo(() => buildTaxonomyBreakdown(meals), [meals]);
  const taxonomyTotal = taxonomyBreakdown.reduce((s, c) => s + c.count, 0);
  const maxCount = meals.length > 0 ? meals[0].count : 1;
  const weeksCount = allPlans.length;
  const barColor = PERSONA_CONFIG[persona].bar;
  const showKeto = persona === "us";

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="px-4 sm:px-8 py-4 border-b border-border bg-card/80">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
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
            {/* Persona toggle */}
            <div className="flex gap-1 bg-muted/60 rounded-xl p-1 w-fit">
              {(Object.keys(PERSONA_CONFIG) as Persona[]).map((key) => {
                const cfg = PERSONA_CONFIG[key];
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setPersona(key)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      persona === key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon size={14} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Section tabs (scoped to persona) */}
            <div className="flex gap-1 bg-muted/60 rounded-xl p-1 flex-wrap">
              {availableSections.map((key) => {
                const cfg = SECTION_LABELS[key];
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setSection(key)}
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
              {showKeto ? (
                <SummaryCard
                  icon={<Leaf size={16} />}
                  label="% Keto"
                  value={`${ketoPct}%`}
                  subtitle={`${ketoCount} de ${total} comidas`}
                />
              ) : (
                <SummaryCard
                  icon={<TrendingUp size={16} />}
                  label="Más popular"
                  value={meals[0]?.emoji ?? "—"}
                  subtitle={meals[0]?.name}
                />
              )}
              <SummaryCard icon={<BarChart3 size={16} />} label="Categorías" value={categories.length} />
            </div>

            {/* Keto detailed bar (only for "us") */}
            {showKeto && total > 0 && (
              <div className="bg-card rounded-xl border border-border p-4 space-y-2">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Leaf size={14} className="text-secondary" /> Adherencia keto
                </h2>
                <div className="flex justify-between text-xs">
                  <span className="text-foreground font-medium">Keto</span>
                  <span className="text-muted-foreground">{ketoCount} ({ketoPct}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${ketoPct}%` }} />
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span className="text-foreground font-medium">No keto</span>
                  <span className="text-muted-foreground">{total - ketoCount} ({100 - ketoPct}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-muted-foreground/40 transition-all" style={{ width: `${100 - ketoPct}%` }} />
                </div>
              </div>
            )}

            {/* Tipo de comida (taxonomía) */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Tag size={14} className="text-primary" /> Por tipo de comida
                <span className="text-[10px] font-normal text-muted-foreground ml-1">
                  (los platos pueden tener varios tipos)
                </span>
              </h2>
              {taxonomyBreakdown.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  Asigná categorías a tus comidas para ver este reporte.
                </p>
              ) : (
                taxonomyBreakdown.map((cat) => (
                  <TaxonomyRow key={cat.category} cat={cat} taxonomyTotal={taxonomyTotal} />
                ))
              )}
            </div>

            {/* Category breakdown (legacy meal categories) */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <PieChart size={14} className="text-primary" /> Por grupo de plato
              </h2>
              {categories.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground font-medium">{cat.category}</span>
                    <span className="text-muted-foreground">{cat.count} ({cat.pct}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${cat.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Ingredient ranking */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-2">
              <CollapsibleGroup
                id="reports:ingredientes"
                count={ingredientRanking.length}
                headerClassName="text-sm font-semibold text-foreground"
                title={
                  <span className="inline-flex items-center gap-2">
                    <Carrot size={14} className="text-primary" /> Ranking de ingredientes
                  </span>
                }
              >
              {unnormalizedCount > 0 && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <TriangleAlert size={11} className="text-warning" />
                  {unnormalizedCount} comida{unnormalizedCount === 1 ? "" : "s"} sin ingredientes cargados no se cuentan acá.{" "}
                  <Link to="/normalizar" className="text-primary underline underline-offset-2">Normalizar →</Link>
                </p>
              )}
              {ingredientRanking.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Todavía no hay comidas con ingredientes cargados.
                </p>
              )}
              {ingredientRanking.map((ing, idx) => (
                <div key={ing.id} className="flex items-center gap-3 py-1.5">
                  <span className="text-xs text-muted-foreground w-5 text-right font-mono">{idx + 1}</span>
                  <span className="text-lg">{ing.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">{ing.name}</span>
                      {ing.tags[0] && (
                        <span className="text-[10px] text-muted-foreground">{parseTag(ing.tags[0])?.sub}</span>
                      )}
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className={cn("h-full rounded-full transition-all", barColor)}
                        style={{ width: `${(ing.count / maxIngredientCount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-foreground">{ing.count}</span>
                  <span className="text-[10px] text-muted-foreground w-10 text-right">
                    {ingredientTotal ? Math.round((ing.count / ingredientTotal) * 100) : 0}%
                  </span>
                </div>
              ))}
              </CollapsibleGroup>
            </div>

            {/* Meal ranking */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-2">
              <CollapsibleGroup
                id="reports:platos"
                count={meals.length}
                headerClassName="text-sm font-semibold text-foreground"
                title={
                  <span className="inline-flex items-center gap-2">
                    <TrendingUp size={14} className="text-primary" /> Ranking de platos
                  </span>
                }
              >
              {meals.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">Sin datos para esta sección.</p>
              )}
              {meals.map((meal, idx) => (
                <div key={meal.id} className="flex items-center gap-3 py-1.5">
                  <span className="text-xs text-muted-foreground w-5 text-right font-mono">{idx + 1}</span>
                  <span className="text-lg">{meal.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">{meal.name}</span>
                      <span className="text-[10px] text-muted-foreground">{meal.category}</span>
                      {meal.isKeto && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/15 text-secondary font-medium">
                          <Leaf size={9} /> keto
                        </span>
                      )}
                      {isUnnormalizedMeal(meal) && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-warning/15 text-warning font-medium" title="Sin ingredientes cargados">
                          <TriangleAlert size={9} /> sin normalizar
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className={cn("h-full rounded-full transition-all", barColor)}
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
              </CollapsibleGroup>
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

function TaxonomyRow({ cat, taxonomyTotal }: { cat: CatCount; taxonomyTotal: number }) {
  const [open, setOpen] = useState(false);
  const meta = categoryOf(cat.category);
  return (
    <div className="space-y-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
      >
        {open ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
        <span className="text-base">{meta?.emoji ?? "🏷️"}</span>
        <span className={cn("text-xs font-medium flex-1", meta?.color ?? "text-foreground")}>{meta?.label ?? cat.category}</span>
        <span className="text-xs text-muted-foreground">{cat.count} ({cat.pct}%)</span>
      </button>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", meta?.bar ?? "bg-primary")}
          style={{ width: `${taxonomyTotal ? (cat.count / taxonomyTotal) * 100 : 0}%` }}
        />
      </div>
      {open && (
        <div className="pl-6 space-y-1.5 pt-1.5">
          {cat.subs.map((s) => (
            <div key={s.sub} className="space-y-0.5">
              <div className="flex justify-between text-[11px]">
                <span className={cn("font-medium", meta?.color ?? "text-foreground")}>{s.sub}</span>
                <span className="text-muted-foreground">{s.count} ({s.pct}%)</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all opacity-80", meta?.bar ?? "bg-primary")}
                  style={{ width: `${s.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

