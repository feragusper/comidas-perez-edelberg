const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return new Response(JSON.stringify({ items: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Esta es la foto de una pizarra donde una familia anota lo que necesita comprar en el supermercado. Está escrita a mano, en español.

Leé la pizarra y devolvé cada cosa anotada como un ítem de la lista de la compra.

Devolvé ÚNICAMENTE un JSON array de strings (sin texto, sin markdown), por ejemplo:
["Leche", "Servilletas", "Pollo", "Tomates"]

Reglas:
- Un string por cada cosa anotada.
- Normalizá cada nombre: sin cantidades ni números ("2 leches" -> "Leche"), sin viñetas ni guiones, primera letra en mayúscula.
- Mantené el idioma español tal como está escrito.
- Si algo es ilegible, omitilo.
- Si la pizarra está vacía o no se entiende nada, devolvé [].`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        temperature: 0.2,
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
    let items: string[] = [];
    try {
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) {
        items = parsed.map((s) => String(s).trim()).filter(Boolean);
      }
    } catch (e) {
      console.error("Could not parse model output:", clean);
    }

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in read-shopping-photo:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
