const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MealEntry {
  day: string;
  slot: string;
  name: string;
  emoji?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { meals } = await req.json() as { meals: MealEntry[] };
    const list = (meals ?? [])
      .filter((m) => m && m.name)
      .map((m) => `- ${m.day} · ${m.slot}: ${m.emoji ?? ""} ${m.name}`.trim())
      .join("\n");

    if (!list) {
      return new Response(JSON.stringify({ items: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Eres un asistente de cocina familiar española. Dada esta lista de comidas planificadas para los próximos días:

${list}

Generá una lista de compras de supermercado consolidada con los ingredientes necesarios para preparar todas esas comidas. Agrupá ingredientes idénticos sumando cantidades cuando sea posible.

Devolvé ÚNICAMENTE un JSON array (sin texto, sin markdown), con este formato exacto:
[
  {"name": "Pechuga de pollo", "quantity": "1 kg", "category": "Carnes", "emoji": "🍗", "sources": ["Lunes · Almuerzo: Pollo al horno", "Martes · Cena: Pollo a la plancha"]},
  {"name": "Tomate", "quantity": "4 unidades", "category": "Verduras", "emoji": "🍅", "sources": ["Lunes · Almuerzo: Ensalada"]},
  ...
]

Reglas:
- name: ingrediente concreto (no preparación)
- quantity: cantidad estimada para una familia de 2 adultos + 1 niño
- category: una de: "Carnes", "Pescados", "Verduras", "Frutas", "Lácteos", "Panadería", "Despensa", "Congelados", "Otros"
- emoji: un emoji representativo del ingrediente
- sources: array con las comidas (de la lista de arriba) que usan ese ingrediente, en formato "Día · Slot: Nombre". Incluí todas las comidas que lo requieran.
- No incluyas sal, agua, aceite común, ni especias básicas
- Consolidá ingredientes repetidos en una sola línea (sumando sus sources)
- Máximo 30 ítems`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
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
    const items = JSON.parse(clean);

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-shopping-list:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
