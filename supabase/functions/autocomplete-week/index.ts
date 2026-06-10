import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      envPrefix,           // "stage" | "prod"
      currentWeekKey,      // full env week key to exclude from history
      currentDinners,      // string[] — dinner names already set this week (keep variety vs these)
      mealCatalog,         // {id,name,category}[]
      sideCatalog,         // {id,name}[]
      breakfastCatalog,    // {id,name}[]
      snackCatalog,        // {id,name}[]
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // ── Read history from previous weeks ──
    let historyDinners: string[] = [];
    let historyBreakfasts: string[] = [];
    let historySnacks: string[] = [];
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data } = await supabase
        .from("meal_plan")
        .select("week_key, plan")
        .like("week_key", `${envPrefix ?? "prod"}_%`)
        .order("week_key", { ascending: false })
        .limit(10);

      for (const row of data ?? []) {
        if (row.week_key === currentWeekKey) continue;
        const plan = Array.isArray(row.plan) ? row.plan : [];
        for (const d of plan) {
          if (d?.dinner?.name) historyDinners.push(d.dinner.name);
          if (d?.breakfast?.name) historyBreakfasts.push(d.breakfast.name);
          if (d?.snack?.name) historySnacks.push(d.snack.name);
        }
      }
    } catch (e) {
      console.warn("History read failed, continuing without it:", e);
    }

    const topN = (arr: string[], n: number) => {
      const counts: Record<string, number> = {};
      for (const x of arr) counts[x] = (counts[x] ?? 0) + 1;
      return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
    };

    const favDinners = topN(historyDinners, 12).join(", ") || "sin historial todavía";
    const favBreakfasts = topN(historyBreakfasts, 8).join(", ") || "sin historial todavía";
    const favSnacks = topN(historySnacks, 8).join(", ") || "sin historial todavía";

    const mainList = (mealCatalog as { id: string; name: string; category: string }[])
      .map((m) => `${m.id}|${m.name}|${m.category}`).join("\n");
    const sideList = (sideCatalog as { id: string; name: string }[])
      .map((m) => `${m.id}|${m.name}`).join("\n");
    const bfList = (breakfastCatalog as { id: string; name: string }[])
      .map((m) => `${m.id}|${m.name}`).join("\n");
    const snList = (snackCatalog as { id: string; name: string }[])
      .map((m) => `${m.id}|${m.name}`).join("\n");

    const seed = Math.floor(Math.random() * 1_000_000);
    const alreadySet = (currentDinners as string[] ?? []).filter(Boolean).join(", ") || "ninguna";

    const prompt = `Eres un asistente creativo de planificación de menús semanales para una familia española (dos adultos + un bebé de ~1 año llamado Nico).

HISTORIAL (lo que esta familia suele comer — úsalo como base, mézclalo con ideas nuevas):
- Cenas frecuentes: ${favDinners}
- Desayunos frecuentes de Nico: ${favBreakfasts}
- Meriendas frecuentes de Nico: ${favSnacks}

Cenas ya elegidas esta semana (no las repitas): ${alreadySet}

OBJETIVO: completar los 7 días (lunes a domingo) con:
- una CENA con guarnición (para los adultos; el bebé come una versión adaptada de lo mismo),
- un DESAYUNO para Nico,
- una MERIENDA para Nico.

REGLAS DE CREATIVIDAD:
- Mezcla el historial favorito con platos nuevos del catálogo para que sea variado pero familiar.
- No repitas el mismo plato principal dos veces en la semana.
- Varía las proteínas (pollo, pescado, carne, cerdo/pavo, huevo/vegetariano, pasta/legumbre) y las guarniciones.
- Varía desayunos y meriendas día a día, no pongas siempre lo mismo.
- Combinaciones sabrosas, realistas y aptas para un bebé de 1 año cuando sea posible.
- Semilla aleatoria de esta tanda: ${seed} (úsala para elegir opciones distintas a otras veces).

CATÁLOGO CENAS (id|nombre|categoría):
${mainList}

GUARNICIONES (id|nombre):
${sideList}

DESAYUNOS (id|nombre):
${bfList}

MERIENDAS (id|nombre):
${snList}

Elige SOLO ids que existan en cada catálogo correspondiente.
Devuelve ÚNICAMENTE un JSON array con exactamente 7 elementos (sin texto, sin markdown):
[
  {"dinnerId": "id", "sideId": "id", "breakfastId": "id", "snackId": "id"},
  ... (7 en total, uno por día de lunes a domingo)
]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 1.1,
        top_p: 0.95,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI gateway error:", response.status, err);
      if (response.status === 429 || response.status === 402) {
        return new Response(
          JSON.stringify({ error: response.status === 429 ? "RATE_LIMITED" : "PAYMENT_REQUIRED" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(`AI gateway error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "[]";
    const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const week = JSON.parse(clean);

    return new Response(JSON.stringify({ week }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error autocompleting week:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
