/**
 * Smakfynd AI Wine Matcher — Cloudflare Worker
 *
 * Receives a meal description, asks Claude for wine pairing criteria,
 * returns structured JSON for the frontend to match against wine data.
 *
 * Environment variables needed:
 *   ANTHROPIC_API_KEY — your Claude API key
 *   ALLOWED_ORIGIN — e.g. "https://smakfynd.se" (or "*" for dev)
 */

const SYSTEM_PROMPT = `Du är en vinexpert som hjälper matcha vin till mat.

Användaren beskriver en måltid. Analysera maten och strukturera vinförslag per rätt.

Svara ALLTID med exakt detta JSON-format, inget annat:
{
  "reasoning": "Kort sammanfattning (1-2 meningar) på svenska om hela måltiden och vinvalet.",
  "courses": [
    {
      "dish": "Kort namn på rätten, t.ex. 'Toast Skagen' eller 'BBQ-revben'",
      "criteria": [
        {
          "type": "Rött|Vitt|Rosé|Mousserande",
          "body": "light|medium|full",
          "keywords": ["druva eller stil-ord att söka på i vindata"],
          "why": "Kort på svenska varför just detta vin passar till rätten"
        }
      ]
    }
  ]
}

Regler:
- ALLTID börja med en "course" som heter "Hela måltiden" med 1 vinförslag som funkar till allt
- Sedan en course per rätt som användaren nämner (förrätt, huvud, dessert etc)
- Varje course har 1-2 criteria (vintyper)
- keywords ska vara druvor (Pinot Noir, Chardonnay), stilar (Friskt, Fruktigt, Kryddigt) eller regioner
- body mappar till taste_body: light=1-4, medium=5-8, full=9-12
- Tänk på smaker, fett, syra, kryddighet
- Om bara en rätt nämns: ge "Hela måltiden" + den rätten med 2 criteria vardera
- Svara BARA med JSON, ingen annan text`;

export default {
  async fetch(request, env) {
    // CORS
    const origin = env.ALLOWED_ORIGIN || "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "POST only" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const body = await request.json();
      const url = new URL(request.url);

      // Expert estimation endpoint
      if (url.pathname === "/expert" && body.wines) {
        const expertPrompt = `Du är en erfaren vinkritiker. Uppskatta kvalitetspoäng (80-100, Wine Spectator-skala) för varje vin.

Basera din bedömning på: producent/varumärke, druva, region, prispositionering.
- 80-84: Enkel/vardaglig kvalitet
- 85-87: Bra kvalitet, välgjort
- 88-90: Mycket bra, utmärkt producent eller region
- 91-93: Exceptionellt, toppproducent
- 94+: Världsklass

Var realistisk. De flesta viner under 150kr hamnar 82-87. Var inte för generös.
Svara BARA med JSON-array: [{"name": "...", "points": 88}, ...]

Viner:
` + JSON.stringify(body.wines);

        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 4096,
            messages: [{ role: "user", content: expertPrompt }],
          }),
        });
        const data = await resp.json();
        const text = data.content?.[0]?.text || "";
        const match = text.match(/\[[\s\S]*\]/);
        const parsed = match ? JSON.parse(match[0]) : [];
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { meal } = body;
      if (!meal || meal.length < 3 || meal.length > 500) {
        return new Response(JSON.stringify({ error: "Beskriv din måltid (3-500 tecken)" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const apiKey = env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "API key not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: meal }],
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Claude API error:", err);
        return new Response(JSON.stringify({ error: "AI-tjänsten svarade inte" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || "";

      // Parse JSON from Claude's response
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        // Try to extract JSON from response
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          return new Response(JSON.stringify({ error: "Kunde inte tolka AI-svaret" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("Worker error:", e.message, e.stack);
      return new Response(JSON.stringify({ error: "Något gick fel: " + e.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
