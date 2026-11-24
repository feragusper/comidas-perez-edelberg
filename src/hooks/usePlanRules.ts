import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isStageEnv } from "@/lib/env";
import { DEFAULT_PLAN_RULES, normalizePlanRules, type PlanRules } from "@/lib/planRules";

/**
 * Reglas del plan guardadas en `app_settings.settings.planRules` (una fila por entorno).
 * Si la tabla todavía no existe o falla la lectura, se usan los defaults.
 */

// La tabla es nueva y todavía no está en los tipos generados por Lovable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const settingsTable = () => (supabase as any).from("app_settings");

const envKey = () => (isStageEnv() ? "stage" : "prod");
const queryKey = () => ["app-settings", envKey()] as const;

type Settings = { planRules?: unknown } & Record<string, unknown>;

async function fetchSettings(): Promise<Settings> {
  const { data, error } = await settingsTable().select("settings").eq("env", envKey()).maybeSingle();
  if (error) {
    console.warn("No se pudieron leer las reglas, uso defaults:", error.message ?? error);
    return {};
  }
  return (data?.settings as Settings) ?? {};
}

export function usePlanRules() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: queryKey(),
    queryFn: fetchSettings,
    staleTime: Infinity,
  });

  // Si otro dispositivo cambia las reglas, refrescar.
  useEffect(() => {
    const channel = supabase
      .channel(`app_settings_${envKey()}_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings", filter: `env=eq.${envKey()}` },
        (payload) => {
          const next = (payload.new as { settings?: Settings } | null)?.settings;
          if (next) qc.setQueryData(queryKey(), next);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const mutation = useMutation({
    mutationFn: async (rules: PlanRules) => {
      const current = (qc.getQueryData(queryKey()) as Settings | undefined) ?? {};
      const next = { ...current, planRules: rules };
      const { error } = await settingsTable().upsert({ env: envKey(), settings: next }, { onConflict: "env" });
      if (error) throw error;
      return next;
    },
    onMutate: async (rules) => {
      const prev = qc.getQueryData(queryKey()) as Settings | undefined;
      qc.setQueryData(queryKey(), { ...(prev ?? {}), planRules: rules });
      return { prev };
    },
    onError: (_err, _rules, ctx) => {
      if (ctx) qc.setQueryData(queryKey(), ctx.prev);
    },
  });

  const rules = settings ? normalizePlanRules(settings.planRules) : DEFAULT_PLAN_RULES;

  return {
    rules,
    loading: isLoading,
    saving: mutation.isPending,
    saveRules: (rules: PlanRules) => mutation.mutateAsync(rules),
  };
}
