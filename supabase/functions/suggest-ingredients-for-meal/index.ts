const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mealName, catalog } = await req.json();
    if (!mealName || typeof mealName !== "string") {
      return new Response(JSON.stringify({ error: "mealName requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const catalogList = (Array.isArray(catalog) ? catalog : [])
      .filter((c) => c?.id && c?.name)
      .map((c: { id: string; name: string }) => `- ${c.id}: ${c.name}`)
      .join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Eres un asistente de cocina familiar española. Descompón el plato "${mealName}" en sus ingredientes principales (entre 1 y 6, solo los que definen el plato, sin sal/aceite/especias básicas).

Catálogo de ingredientes disponibles (id: nombre):
${catalogList}

Devuelve ÚNICAMENTE un JSON (sin texto, sin markdown) con este formato exacto:
{
  "ingredientIds": ["id-del-catalogo", ...],
  "newIngredients": [{"name": "Nombre", "emoji": "🥕", "tag": "Categoría/Subcategoría"}, ...]
}

Reglas:
- Usá SIEMPRE ids del catálogo cuando el ingrediente ya existe (aunque el nombre no coincida exacto).
- "newIngredients" solo para ingredientes que de verdad no están en el catálogo.
- "tag" debe ser una de: Carbohidratos/Pasta, Carbohidratos/Pan, Carbohidratos/Arroz, Carbohidratos/Patata, Carbohidratos/Legumbres, Carbohidratos/Cereales, Carbohidratos/Masas, Proteína/Vaca, Proteína/Cerdo, Proteína/Pollo, Proteína/Pavo, Proteína/Pescado, Proteína/Marisco, Proteína/Huevo, Proteína/Vegetal, Verdura/Hojas verdes, Verdura/Tubérculos, Verdura/Crucíferas, Verdura/Solanáceas, Verdura/Calabaza, Verdura/Setas, Verdura/Otras, Fruta/Cítricos, Fruta/Tropical, Fruta/Bosque, Fruta/Hueso, Fruta/Pomácea, Fruta/Aguacate, Lácteo/Leche, Lácteo/Queso, Lácteo/Crema, Otros/Sopa, Otros/Salsa, Otros/Snack, Otros/Dulce, Otros/Bebida
- emoji: un solo emoji representativo.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
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
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean);

    return new Response(
      JSON.stringify({
        ingredientIds: Array.isArray(parsed.ingredientIds) ? parsed.ingredientIds : [],
        newIngredients: Array.isArray(parsed.newIngredients) ? parsed.newIngredients : [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in suggest-ingredients-for-meal:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
