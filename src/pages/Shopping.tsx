import { useEffect, useMemo, useRef, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CollapsibleGroup } from "@/components/CollapsibleGroup";
import { DayPlan } from "@/hooks/useMealPlan";
import { useMeals } from "@/hooks/useMeals";
import { useIngredients } from "@/hooks/useIngredients";
import { usePantry, pantryHasName, normalizePantryName } from "@/hooks/usePantry";
import { supabase } from "@/integrations/supabase/client";
import { Meal, DELIVERY_DINNER } from "@/data/meals";
import { isIngredient, SENTINEL_MEAL_IDS as SENTINEL_IDS, ingredientSlug } from "@/data/food";
import { parseTag, categoryOf } from "@/data/foodTaxonomy";
import { currentWeekKey, todayDayIndex, isStageEnv, weekKeyLabel } from "@/lib/env";
import { MealPicker } from "@/components/MealPicker";
import { PhotoImportWizard } from "@/components/PhotoImportWizard";
import { ClipboardCopy, RotateCcw, CheckCheck, Warehouse, Plus, X, Camera, Loader2, PackagePlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ShoppingIngredient {
  id: string;
  name: string;
  emoji: string;
  category: string;
  sources: string[];
}

const STORAGE_KEY = "shopping_list_v2";
const MANUAL_KEY = "shopping_manual_v1";
const MANUAL_SOURCE = "Agregado a mano";

interface StoredHave {
  weekKey: string;
  have: Record<string, boolean>; // key = ingredient id
}

/** Ingrediente sumado a mano a la lista (no viene de una comida planificada). */
interface ManualItem {
  id: string;
  name: string;
  emoji: string;
}

interface StoredManual {
  weekKey: string;
  items: ManualItem[];
}

function slotFoods(d: DayPlan): [string, Meal | null][] {
  return [
    ["Desayuno", d.breakfast],
    ...(d.breakfastExtras ?? []).map((m) => ["Desayuno", m] as [string, Meal]),
    ["Almuerzo", d.lunch],
    ["Almuerzo", d.lunchSide],
    ...(d.lunchExtras ?? []).map((m) => ["Almuerzo", m] as [string, Meal]),
    ["Almuerzo Nico", d.babyLunch],
    ["Almuerzo Nico", d.babyLunchSide],
    ...(d.babyLunchExtras ?? []).map((m) => ["Almuerzo Nico", m] as [string, Meal]),
    ["Merienda", d.snack],
    ...(d.snackExtras ?? []).map((m) => ["Merienda", m] as [string, Meal]),
    ["Cena", d.dinner],
    ["Cena", d.dinnerSide],
    ...(d.dinnerExtras ?? []).map((m) => ["Cena", m] as [string, Meal]),
    ["Cena Nico", d.babyDinner],
    ["Cena Nico", d.babyDinnerSide],
    ...(d.babyDinnerExtras ?? []).map((m) => ["Cena Nico", m] as [string, Meal]),
  ];
}

const arr = (v: unknown): Meal[] => (Array.isArray(v) ? (v as Meal[]) : []);

/**
 * Normaliza un día crudo de `meal_plan` a los campos que usa la lista del súper.
 * Los almuerzos/cenas heredados (no overridden) se guardan null: sus ingredientes
 * ya vienen de la cena original, así que no hace falta contarlos aparte.
 */
function normalizeStoredDay(day: DayPlan & { isDelivery?: boolean }): DayPlan {
  const wasDelivery = day.isDelivery ?? false;
  const dinner = wasDelivery && !day.dinner ? DELIVERY_DINNER : (day.dinner ?? null);
  const lunchOn = !!day.lunchOverridden && day.lunch != null;
  const babyLunchOn = !!day.babyLunchOverridden && day.babyLunch != null;
  const babyDinnerOn = !!day.babyDinnerOverridden && day.babyDinner != null;
  return {
    ...day,
    dinner,
    dinnerSide: day.dinnerSide ?? null,
    dinnerExtras: arr(day.dinnerExtras),
    lunch: lunchOn ? day.lunch : null,
    lunchSide: lunchOn ? (day.lunchSide ?? null) : null,
    lunchExtras: lunchOn ? arr(day.lunchExtras) : [],
    babyLunch: babyLunchOn ? day.babyLunch : null,
    babyLunchSide: babyLunchOn ? (day.babyLunchSide ?? null) : null,
    babyLunchExtras: babyLunchOn ? arr(day.babyLunchExtras) : [],
    babyDinner: babyDinnerOn ? day.babyDinner : null,
    babyDinnerSide: babyDinnerOn ? (day.babyDinnerSide ?? null) : null,
    babyDinnerExtras: babyDinnerOn ? arr(day.babyDinnerExtras) : [],
    breakfast: typeof day.breakfast === "object" ? (day.breakfast ?? null) : null,
    breakfastExtras: arr(day.breakfastExtras),
    snack: typeof day.snack === "object" ? (day.snack ?? null) : null,
    snackExtras: arr(day.snackExtras),
  } as DayPlan;
}

interface WeekDays {
  weekKey: string;
  isCurrent: boolean;
  days: DayPlan[];
}

/** Redimensiona y comprime una imagen a un data URL JPEG chico para mandar al modelo. */
function fileToCompressedDataUrl(file: File, maxSide = 1600, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Imagen inválida"));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas no disponible"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function Shopping() {
  const weekKey = currentWeekKey();
  const { meals: catalog, saveMeal } = useMeals();
  const { ingredients, addIngredient } = useIngredients();
  const { items: pantryItems, addItem: addToPantry } = usePantry();
  const [pickerOpen, setPickerOpen] = useState(false);
  const todayIdx = todayDayIndex(weekKey);
  const fromIdx = todayIdx === -1 ? 0 : todayIdx;

  // Todas las semanas planificadas desde la actual en adelante (no solo esta).
  const [weeks, setWeeks] = useState<WeekDays[]>([]);
  useEffect(() => {
    let cancelled = false;
    const prefix = isStageEnv() ? "stage_" : "prod_";
    supabase
      .from("meal_plan")
      .select("plan, week_key")
      .like("week_key", `${prefix}%`)
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const out: WeekDays[] = [];
        for (const row of data) {
          const iso = (row.week_key as string).slice(prefix.length);
          // Solo esta semana y las futuras (comparación lexicográfica de ISO week keys).
          if (iso < weekKey) continue;
          const raw = row.plan as unknown as (DayPlan & { isDelivery?: boolean })[];
          if (!Array.isArray(raw) || raw.length === 0) continue;
          out.push({ weekKey: iso, isCurrent: iso === weekKey, days: raw.map(normalizeStoredDay) });
        }
        out.sort((a, b) => a.weekKey.localeCompare(b.weekKey));
        setWeeks(out);
      });
    return () => { cancelled = true; };
  }, [weekKey]);

  const [have, setHave] = useState<Record<string, boolean>>({});

  // Load saved "ya tengo" marks
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredHave;
      if (parsed.weekKey === weekKey) setHave(parsed.have ?? {});
    } catch { /* estado corrupto: se arranca de cero */ }
  }, [weekKey]);

  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ weekKey, have } satisfies StoredHave));
  }, [have, weekKey]);

  // Ingredientes agregados a mano a la lista.
  const [manual, setManual] = useState<ManualItem[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(MANUAL_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredManual;
      if (parsed.weekKey === weekKey) setManual(parsed.items ?? []);
    } catch { /* estado corrupto: se arranca de cero */ }
  }, [weekKey]);
  useEffect(() => {
    localStorage.setItem(MANUAL_KEY, JSON.stringify({ weekKey, items: manual } satisfies StoredManual));
  }, [manual, weekKey]);

  const catalogById = useMemo(() => new Map(catalog.map((m) => [m.id, m])), [catalog]);
  const ingredientById = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);

  // Nombres de comidas del catálogo, para saber qué ítems de la despensa son comidas.
  const mealNameSet = useMemo(
    () => new Set(catalog.map((m) => normalizePantryName(m.name))),
    [catalog]
  );
  // Ítems de despensa que son ingredientes sueltos (no comidas). Sólo estos marcan
  // un ingrediente como "ya lo tengo": una comida en Don Bacilio cubre esa comida
  // entera, no sus ingredientes por separado (ej: "milanesa de pollo" no da "pollo").
  const pantryIngredientItems = useMemo(
    () => pantryItems.filter((p) => !mealNameSet.has(normalizePantryName(p.name))),
    [pantryItems, mealNameSet]
  );
  // Nombres (normalizados) de las comidas que están en Don Bacilio: una comida
  // planificada cuyo nombre coincide exacto está cubierta y no se expande.
  const pantryMealNameSet = useMemo(
    () => new Set(
      pantryItems
        .map((p) => normalizePantryName(p.name))
        .filter((n) => mealNameSet.has(n))
    ),
    [pantryItems, mealNameSet]
  );

  /** Lista determinística: unión de ingredientes de las comidas planificadas desde hoy. */
  const { list, mealCount } = useMemo(() => {
    const acc = new Map<string, ShoppingIngredient>();
    let count = 0;

    const addIngredientEntry = (id: string, fallbackName: string, fallbackEmoji: string, source: string) => {
      const ing = ingredientById.get(id);
      const existing = acc.get(id);
      if (existing) {
        if (!existing.sources.includes(source)) existing.sources.push(source);
        return;
      }
      const tag = ing?.tags?.[0] ?? null;
      const cat = tag ? parseTag(tag)?.category ?? "Otros" : "Otros";
      acc.set(id, {
        id,
        name: ing?.name ?? fallbackName,
        emoji: ing?.emoji ?? fallbackEmoji,
        category: cat,
        sources: [source],
      });
    };

    for (const wk of weeks) {
      // La semana actual arranca hoy; las futuras, día 0.
      const start = wk.isCurrent ? fromIdx : 0;
      const wkTag = wk.isCurrent ? "" : ` (${weekKeyLabel(wk.weekKey, weekKey)})`;
      for (let i = start; i < wk.days.length; i++) {
        const d = wk.days[i];
        for (const [slot, food] of slotFoods(d)) {
          if (!food || SENTINEL_IDS.has(food.id)) continue;
          count++;
          const source = `${d.day}${wkTag} · ${slot}`;

          // Ingrediente suelto en el slot
          if (isIngredient(food)) {
            addIngredientEntry(food.id, food.name, food.emoji, source);
            continue;
          }

          // Comida entera en Don Bacilio: está cubierta, no se compran sus ingredientes.
          if (pantryMealNameSet.has(normalizePantryName(food.name))) continue;

          // Comida: expandir por catálogo (el snapshot puede ser viejo)
          const catalogMeal = catalogById.get(food.id);
          const ids = catalogMeal?.ingredientIds ?? [];
          // Comida borrada que fue convertida a ingrediente: resolver por nombre
          const convertedIngredient = !catalogMeal ? ingredientById.get(ingredientSlug(food.name)) : undefined;
          if (ids.length > 0) {
            for (const iid of ids) addIngredientEntry(iid, iid, "🛒", `${d.day}${wkTag} · ${food.name}`);
          } else if (convertedIngredient) {
            addIngredientEntry(convertedIngredient.id, food.name, food.emoji, source);
          }
        }
      }
    }

    // Ingredientes agregados a mano (una comida se expandió a sus ingredientes al elegirla).
    for (const m of manual) addIngredientEntry(m.id, m.name, m.emoji, MANUAL_SOURCE);

    return {
      list: Array.from(acc.values()),
      mealCount: count,
    };
  }, [weeks, fromIdx, weekKey, catalogById, ingredientById, pantryMealNameSet, manual]);

  const grouped = useMemo(() => {
    const map = new Map<string, ShoppingIngredient[]>();
    for (const it of list) {
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.name.localeCompare(b.name));
    return Array.from(map.entries());
  }, [list]);

  const isHave = (it: ShoppingIngredient) => have[it.id] ?? pantryHasName(pantryIngredientItems, it.name);

  const toggleHave = (it: ShoppingIngredient) => {
    setHave((prev) => ({ ...prev, [it.id]: !isHave(it) }));
  };

  const markAllHave = (items: ShoppingIngredient[], value: boolean) => {
    setHave((prev) => {
      const next = { ...prev };
      for (const it of items) next[it.id] = value;
      return next;
    });
  };

  /**
   * "Ya lo compré": mete el ingrediente en Don Bacilio (despensa compartida) y lo
   * marca como tenido. Desde la despensa, el ingrediente queda ligado a las comidas
   * planificadas que lo usan (badge de día, consumo al pasar) y desaparece de los
   * faltantes acá — todo vía `pantryHasName` y la reconciliación despensa↔plan.
   */
  const buy = (it: ShoppingIngredient) => {
    addToPantry({ name: it.name, emoji: it.emoji });
    setHave((prev) => ({ ...prev, [it.id]: true }));
  };

  const buyAll = (items: ShoppingIngredient[]) => {
    let n = 0;
    for (const it of items) {
      if (pantryHasName(pantryIngredientItems, it.name)) continue;
      buy(it);
      n++;
    }
    if (n > 0) toast({ title: n === 1 ? "Agregado a Don Bacilio" : `${n} agregados a Don Bacilio` });
  };

  const manualIds = useMemo(() => new Set(manual.map((m) => m.id)), [manual]);

  /** Suma a la lista lo elegido en el picker: ingrediente suelto, o los ingredientes de una comida. */
  const addManual = (food: Meal) => {
    const picked: ManualItem[] = [];
    const push = (id: string, name: string, emoji: string) => {
      if (!picked.some((p) => p.id === id)) picked.push({ id, name, emoji });
    };
    if (isIngredient(food)) {
      push(food.id, food.name, food.emoji);
    } else {
      const cm = catalogById.get(food.id);
      const ids = cm?.ingredientIds ?? [];
      if (ids.length > 0) {
        for (const iid of ids) {
          const ing = ingredientById.get(iid);
          push(iid, ing?.name ?? iid, ing?.emoji ?? "🛒");
        }
      } else {
        const conv = ingredientById.get(ingredientSlug(food.name));
        if (conv) push(conv.id, conv.name, conv.emoji);
        else push(food.id, food.name, food.emoji);
      }
    }
    if (picked.length === 0) return;
    setManual((prev) => {
      const existing = new Set(prev.map((m) => m.id));
      return [...prev, ...picked.filter((p) => !existing.has(p.id))];
    });
    setHave((prev) => {
      // Al re-agregar algo, destildarlo para que vuelva a la lista de faltantes.
      const next = { ...prev };
      for (const p of picked) delete next[p.id];
      return next;
    });
    toast({ title: picked.length === 1 ? "Agregado a la lista" : `${picked.length} ingredientes agregados` });
  };

  const removeManual = (id: string) => {
    setManual((prev) => prev.filter((m) => m.id !== id));
  };

  const [freeText, setFreeText] = useState("");
  /** Agrega un texto libre a la lista, sin vínculo con comida ni ingrediente. */
  const addFree = (raw: string) => {
    const name = raw.trim();
    if (!name) return;
    const id = `free:${normalizePantryName(name).replace(/\s+/g, "-") || Date.now()}`;
    setManual((prev) => (prev.some((m) => m.id === id) ? prev : [...prev, { id, name, emoji: "🛒" }]));
    setHave((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };
  const addFreeText = () => {
    addFree(freeText);
    setFreeText("");
  };

  // Foto de la pizarra → interpretación → wizard de revisión.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoItems, setPhotoItems] = useState<string[] | null>(null);

  const onPhotoPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir la misma foto
    if (!file) return;
    setPhotoLoading(true);
    try {
      const image = await fileToCompressedDataUrl(file);
      const { data, error } = await supabase.functions.invoke("read-shopping-photo", { body: { image } });
      if (error) throw error;
      if (data?.error) {
        toast({
          title: data.error === "RATE_LIMITED"
            ? "Demasiadas peticiones"
            : data.error === "PAYMENT_REQUIRED"
              ? "Sin créditos disponibles"
              : "Error leyendo la foto",
          description: "Probá de nuevo en un rato.",
          variant: "destructive",
        });
        return;
      }
      const items = Array.isArray(data?.items) ? (data.items as string[]).filter(Boolean) : [];
      if (items.length === 0) {
        toast({ title: "No pude leer nada de la pizarra", description: "Probá con más luz o más de cerca." });
        return;
      }
      setPhotoItems(items);
    } catch (err) {
      console.error(err);
      toast({ title: "Error leyendo la foto", variant: "destructive" });
    } finally {
      setPhotoLoading(false);
    }
  };

  const toBuy = list.filter((it) => !isHave(it));
  const haveCount = list.length - toBuy.length;
  const allDone = list.length > 0 && toBuy.length === 0;

  const copyList = () => {
    const text = toBuy
      .map((it) => `• ${it.emoji} ${it.name}`.trim())
      .join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Lista copiada al portapapeles" });
  };

  const reset = () => {
    setHave({});
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="px-4 sm:px-8 py-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">
          Lista de supermercado
        </h1>
        <p className="text-sm text-muted-foreground mb-5">
          Ingredientes de todas las comidas planificadas desde hoy en adelante. Tachá lo que ya tenés.
        </p>

        <div className="rounded-xl border bg-card shadow-sm p-4 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{mealCount}</span> comida{mealCount === 1 ? "" : "s"} planificada{mealCount === 1 ? "" : "s"} ·{" "}
            <span className="font-semibold text-foreground">{list.length}</span> ingrediente{list.length === 1 ? "" : "s"} distintos
          </p>
          {Object.keys(have).length > 0 && (
            <Button size="sm" variant="ghost" onClick={reset} title="Desmarcar todo">
              <RotateCcw size={14} className="mr-1.5" /> Reiniciar marcas
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onPhotoPicked}
        />
        <Button
          variant="outline"
          className="w-full mb-3"
          onClick={() => fileInputRef.current?.click()}
          disabled={photoLoading}
        >
          {photoLoading ? (
            <><Loader2 size={16} className="mr-1.5 animate-spin" /> Leyendo la pizarra…</>
          ) : (
            <><Camera size={16} className="mr-1.5" /> Sacar foto de la pizarra</>
          )}
        </Button>

        <Button variant="outline" className="w-full mb-3" onClick={() => setPickerOpen(true)}>
          <Plus size={16} className="mr-1" /> Agregar del catálogo
        </Button>

        <form
          onSubmit={(e) => { e.preventDefault(); addFreeText(); }}
          className="flex gap-2 mb-4"
        >
          <Input
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Agregar algo suelto (ej: servilletas)"
          />
          <Button type="submit" variant="outline" disabled={!freeText.trim()}>
            <Plus size={16} className="mr-1" /> Agregar
          </Button>
        </form>

        {pickerOpen && (
          <MealPicker
            mode="adult"
            step="main"
            extraMeals={catalog}
            ingredients={ingredients}
            onCustomMeal={(meal) => void saveMeal(meal)}
            onCustomIngredient={(ing) => void addIngredient(ing)}
            onSelect={(food) => addManual(food)}
            onClose={() => setPickerOpen(false)}
            title="Agregar a la lista"
          />
        )}

        {photoItems && (
          <PhotoImportWizard
            items={photoItems}
            meals={catalog}
            ingredients={ingredients}
            onAddFood={addManual}
            onAddFree={addFree}
            onClose={() => setPhotoItems(null)}
          />
        )}

        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10 border border-dashed border-border rounded-lg">
            No hay comidas planificadas a futuro. Agregá algo a la lista con el botón de arriba.
          </p>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{haveCount}</span>/{list.length} ya tengo
                {allDone && " · ¡Listo!"}
              </span>
              <Button size="sm" variant="ghost" onClick={copyList} disabled={toBuy.length === 0}>
                <ClipboardCopy size={14} className="mr-1.5" /> Copiar faltantes
              </Button>
            </div>

            <div className="space-y-4">
              {grouped.map(([cat, items]) => {
                const meta = categoryOf(cat);
                const catAllHave = items.every(isHave);
                const buyable = items.filter((it) => !pantryHasName(pantryIngredientItems, it.name));
                return (
                  <div key={cat} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    <CollapsibleGroup
                      id={`shopping:${cat}`}
                      count={items.length}
                      rowClassName="px-3 py-2 bg-muted/40"
                      headerClassName="text-xs font-semibold text-foreground"
                      title={`${meta?.emoji ?? "🛒"} ${meta?.label ?? cat}`}
                      headerRight={
                        <div className="flex items-center gap-1.5 shrink-0">
                          {buyable.length > 0 && (
                            <button
                              onClick={() => buyAll(items)}
                              className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border border-border text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/30 transition-colors font-medium"
                              title="Agregar todos los faltantes a Don Bacilio"
                            >
                              <PackagePlus size={12} /> Compré todo
                            </button>
                          )}
                          <button
                            onClick={() => markAllHave(items, !catAllHave)}
                            className="text-[10px] px-2 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
                          >
                            {catAllHave ? "Desmarcar todo" : "Ya tengo todo"}
                          </button>
                        </div>
                      }
                    >
                    <ul className="divide-y divide-border">
                      {items.map((it) => {
                        const got = isHave(it);
                        const inPantry = pantryHasName(pantryIngredientItems, it.name);
                        const isManualOnly = manualIds.has(it.id) && it.sources.length === 1 && it.sources[0] === MANUAL_SOURCE;
                        return (
                          <li
                            key={it.id}
                            className={cn(
                              "flex items-start gap-3 px-3 py-2 text-sm transition-colors",
                              got && "opacity-50 line-through"
                            )}
                          >
                            <Checkbox
                              checked={got}
                              onCheckedChange={() => toggleHave(it)}
                              aria-label="Ya tengo"
                              className="mt-0.5"
                            />
                            <span className="text-lg shrink-0">{it.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {it.name}
                                {inPantry && (
                                  <span className="ml-2 inline-flex items-center gap-1 align-middle text-[10px] font-medium text-primary bg-primary/10 rounded-full px-1.5 py-0.5 no-underline">
                                    <Warehouse size={10} /> Don Bacilio
                                  </span>
                                )}
                              </p>
                              {it.sources.length > 0 && (
                                <p className="text-[11px] text-muted-foreground/80 mt-0.5 italic">
                                  {it.sources.join(" · ")}
                                </p>
                              )}
                            </div>
                            {!inPantry && (
                              <button
                                onClick={() => buy(it)}
                                className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border text-[10px] font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/30 transition-colors no-underline"
                                title="Ya lo compré: agregar a Don Bacilio"
                                aria-label={`Compré ${it.name}`}
                              >
                                <PackagePlus size={12} /> Compré
                              </button>
                            )}
                            {isManualOnly && (
                              <button
                                onClick={() => removeManual(it.id)}
                                className="shrink-0 p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors no-underline"
                                aria-label={`Quitar ${it.name}`}
                              >
                                <X size={14} />
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    </CollapsibleGroup>
                  </div>
                );
              })}
            </div>

            {allDone && (
              <div className="mt-6 rounded-xl border bg-card shadow-sm p-6 text-center text-sm text-muted-foreground">
                <CheckCheck size={20} className="mx-auto mb-2 text-primary" />
                ¡Ya tenés todo! No hace falta ir al super 🎉
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
