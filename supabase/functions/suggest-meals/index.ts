const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      currentMeals,       // string[] — meals already confirmed in plan
      mealCatalog,        // {id, name, category}[]
      sideCatalog,        // {id, name}[]
      targetDayIndex,     // optional number — if set, only regenerate this day
      existingSuggestions, // optional {dayIndex, mealId, sideId}[] — already shown suggestions
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const currentNames = (currentMeals as string[]).filter(Boolean).join(", ") || "ninguno todavía";

    // Usamos TODO el catálogo (no solo keto) para tener mucha más variedad.
    const mainList = (mealCatalog as { id: string; name: string; category: string; isKeto?: boolean }[])
      .map(m => `${m.id}|${m.name}|${m.category}${m.isKeto ? "|keto" : ""}`)
      .join("\n");
    const sideList = (sideCatalog as { id: string; name: string; isKeto?: boolean }[])
      .map(m => `${m.id}|${m.name}${m.isKeto ? "|keto" : ""}`)
      .join("\n");

    const existing = (existingSuggestions ?? []) as { dayIndex: number; mealId: string; sideId: string }[];
    const existingNames = existing.map(s => s.mealId).join(", ");

    const isSingleDay = typeof targetDayIndex === "number";
    const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

    // Semilla de aleatoriedad para que el modelo no devuelva siempre lo mismo.
    const seed = Math.floor(Math.random() * 1_000_000);

    const creativityRule = `
OBJETIVO: máxima variedad y creatividad. NO sugieras siempre lo mismo.
- Mezcla proteínas a lo largo de la semana: pollo, pescado, carne roja, cerdo/pavo, huevos/vegetariano, alguna pasta o legumbre.
- Evita repetir el mismo plato o proteína dos días seguidos.
- Aprovecha TODO el catálogo, incluyendo platos menos obvios, no solo los 4 o 5 de siempre.
- Varía mucho las guarniciones (verduras, ensaladas, asados, purés, etc.).
- Combinaciones sabrosas y realistas para una familia española.
- Semilla aleatoria de esta tanda: ${seed} (úsala para elegir opciones distintas a otras veces).
`;

    let prompt: string;

    if (isSingleDay) {
      const dayName = days[targetDayIndex as number];
      const otherMealsContext = [...currentMeals as string[], ...existingNames].filter(Boolean).join(", ");
      prompt = `Eres un asistente creativo de planificación de menús semanales para una familia española.

Esta semana ya tienen: ${otherMealsContext || "ninguno todavía"}.

Necesito UNA SOLA sugerencia de cena para el ${dayName}, distinta y variada respecto al resto de la semana.
${creativityRule}

CATÁLOGO DISPONIBLE (id|nombre|categoría):
${mainList}

GUARNICIONES (id|nombre):
${sideList}

Elige SOLO ids que existan en el catálogo.
Devuelve ÚNICAMENTE un JSON (sin texto adicional, sin markdown):
{"mealId": "id_del_plato", "sideId": "id_guarnicion"}`;
    } else {
      prompt = `Eres un asistente creativo de planificación de menús semanales para una familia española.

Esta semana ya tienen confirmadas estas cenas: ${currentNames}

Sugiere una cena con guarnición para cada uno de los 7 días (lunes a domingo), con mucha variedad.
${creativityRule}

Los días ya confirmados NO necesitan sugerencia (devuelve null para esos).

CATÁLOGO DISPONIBLE (id|nombre|categoría):
${mainList}

GUARNICIONES (id|nombre):
${sideList}

Elige SOLO ids que existan en el catálogo.
Devuelve ÚNICAMENTE un JSON array con exactamente 7 elementos (sin texto, sin markdown):
[
  {"mealId": "id_plato", "sideId": "id_guarnicion"},
  null,
  ...
]

Reglas:
- No repetir el mismo plato principal en la semana.
- Variar proteínas y guarniciones al máximo.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
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
          JSON.stringify({ error: response.status === 429 ? "RATE_LIMITED" : "PAYMENT_REQUIRED", fallback: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      throw new Error(`AI gateway error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? (isSingleDay ? "{}" : "[]");
    const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    if (isSingleDay) {
      const suggestion = JSON.parse(clean);
      return new Response(JSON.stringify({ suggestion }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      const suggestions = JSON.parse(clean);
      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error suggesting meals:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
