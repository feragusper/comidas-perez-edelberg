import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isStageEnv } from "@/lib/env";

/** Slot del menú que consumió el ítem (semana ISO + día 0=Lunes…6=Domingo). */
export interface PantryUsedOn {
  week: string;
  day: number;
}

export interface PantryItem {
  name: string;
  emoji: string;
  /**
   * Presente cuando el ítem ya se usó en el menú y ese día pasó: se oculta de la
   * despensa pero no se borra, así vuelve si se cambia la comida de ese día.
   */
  usedOn?: PantryUsedOn;
  /**
   * Respuesta a "¿es lo último que queda?" al elegirlo en el menú:
   * true = se consume al comerlo (sale de la despensa cuando pasa el día);
   * false = queda más en casa (nunca sale solo); undefined = todavía no se preguntó.
   */
  depleteOnUse?: boolean;
}

function envKey(): string {
  return `${isStageEnv() ? "stage" : "prod"}_pantry`;
}

/** Normalize a name for loose matching (lowercase, no accents, singular-ish). */
export function normalizePantryName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True if a shopping/ingredient name matches something in the pantry. */
export function pantryHasName(items: PantryItem[], name: string): boolean {
  const target = normalizePantryName(name);
  if (!target) return false;
  return items.some((it) => {
    const p = normalizePantryName(it.name);
    if (!p) return false;
    return target.includes(p) || p.includes(target);
  });
}

export function usePantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(async (next: PantryItem[]) => {
    const { error } = await supabase
      .from("pantry")
      .upsert(
        { env: envKey(), items: next as unknown as never[] },
        { onConflict: "env" }
      );
    if (error) console.error("Error saving pantry:", error.message, error.details, error.hint);
  }, []);

  const scheduleSave = useCallback((next: PantryItem[]) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => void persist(next), 400);
  }, [persist]);

  // Load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("pantry")
      .select("items")
      .eq("env", envKey())
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("Error loading pantry:", error);
        else if (data?.items && Array.isArray(data.items)) {
          setItems(data.items as unknown as PantryItem[]);
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Realtime. Channel name must be unique per hook instance: supabase.channel()
  // returns the same channel object for a repeated name, and calling .on() on an
  // already-subscribed channel throws (e.g. page + picker both using usePantry).
  useEffect(() => {
    const channel = supabase
      .channel(`pantry_${envKey()}_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pantry", filter: `env=eq.${envKey()}` },
        (payload) => {
          const next = (payload.new as { items?: PantryItem[] })?.items;
          if (Array.isArray(next)) setItems(next);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const addItem = useCallback((item: PantryItem) => {
    setItems((prev) => {
      if (!item.name.trim()) return prev;
      const n = normalizePantryName(item.name);
      const existing = prev.find((p) => normalizePantryName(p.name) === n);
      if (existing) {
        // Si estaba marcado como usado, re-agregarlo lo revive (y resetea "última").
        if (!existing.usedOn) return prev;
        const next = prev.map((p) => (p === existing ? { name: p.name, emoji: p.emoji } : p));
        scheduleSave(next);
        return next;
      }
      const next = [...prev, { name: item.name.trim(), emoji: item.emoji || "🥫" }];
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const removeItem = useCallback((name: string) => {
    setItems((prev) => {
      const next = prev.filter((p) => normalizePantryName(p.name) !== normalizePantryName(name));
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  /** Marca un ítem como consumido por un slot del menú (no-op si ya está usado). */
  const markUsed = useCallback((name: string, usedOn: PantryUsedOn) => {
    setItems((prev) => {
      const n = normalizePantryName(name);
      let changed = false;
      const next = prev.map((p) => {
        if (p.usedOn || normalizePantryName(p.name) !== n) return p;
        changed = true;
        return { ...p, usedOn };
      });
      if (!changed) return prev;
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  /** Setea la respuesta a "¿es lo último que queda?" de un ítem. */
  const setDepleteOnUse = useCallback((name: string, value: boolean) => {
    setItems((prev) => {
      const n = normalizePantryName(name);
      let changed = false;
      const next = prev.map((p) => {
        if (normalizePantryName(p.name) !== n || p.depleteOnUse === value) return p;
        changed = true;
        return { ...p, depleteOnUse: value };
      });
      if (!changed) return prev;
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  /** Devuelve un ítem usado a la despensa (se cambió la comida que lo consumía). */
  const clearUsed = useCallback((name: string) => {
    setItems((prev) => {
      const n = normalizePantryName(name);
      let changed = false;
      const next = prev.map((p) => {
        if (!p.usedOn || normalizePantryName(p.name) !== n) return p;
        changed = true;
        // Mantiene depleteOnUse: sigue siendo lo último que queda.
        const { usedOn: _drop, ...rest } = p;
        return rest;
      });
      if (!changed) return prev;
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  // `items`: lo disponible en casa (lo que se muestra y se usa para matchear).
  // `allItems`: incluye los consumidos, para reconciliar contra el menú.
  const visibleItems = items.filter((p) => !p.usedOn);

  return { items: visibleItems, allItems: items, loading, addItem, removeItem, markUsed, clearUsed, setDepleteOnUse };
}
