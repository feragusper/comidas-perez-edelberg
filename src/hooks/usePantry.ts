import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isStageEnv } from "@/lib/env";

export interface PantryItem {
  name: string;
  emoji: string;
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
    if (error) console.error("Error saving pantry:", error);
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

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`pantry_${envKey()}`)
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
      const exists = prev.some((p) => normalizePantryName(p.name) === normalizePantryName(item.name));
      if (exists || !item.name.trim()) return prev;
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

  return { items, loading, addItem, removeItem };
}
