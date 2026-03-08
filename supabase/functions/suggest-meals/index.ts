const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentMeals, mealCatalog, sideCatalog } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const currentNames = (currentMeals as string[]).filter(Boolean).join(", ") || "ninguno todavía";
    const mainList = (mealCatalog as { id: string; name: string; category: string }[])
      .map((m) => `${m.id}|${m.name}|${m.category}`)
      .join("\n");
    const sideList = (sideCatalog as { id: string; name: string }[])
      .map((m) => `${m.id}|${m.name}`)
      .join("\n");

    const prompt = `Eres un asistente de planificación de menú semanal para una familia española.

Esta semana ya tienen planificadas estas cenas: ${currentNames}

Necesito que sugiereas una cena diferente con su guarnición para cada uno de los 7 días de la semana (de lunes a domingo). Deben ser variadas, equilibradas y distintas a las ya planificadas. Prioriza platos típicos españoles y mediterráneos.

CATÁLOGO DE PLATOS PRINCIPALES (formato id|nombre|categoría):
${mainList}

CATÁLOGO DE GUARNICIONES (formato id|nombre):
${sideList}

Devuelve ÚNICAMENTE un JSON array con exactamente 7 objetos (uno por día), sin texto adicional, sin markdown, sin \`\`\`json:
[
  {"mealId": "id_del_plato", "sideId": "id_guarnicion"},
  ...
]

Reglas:
- No repitas el mismo plato principal más de una vez
- No repitas la misma guarnición más de dos veces
- El domingo sugiere siempre pasta (id: "pasta")
- Varía entre carnes, pescados, vegetariano y sopas`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI gateway error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "[]";

    // Clean possible markdown fences
    const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const suggestions = JSON.parse(clean);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error suggesting meals:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
