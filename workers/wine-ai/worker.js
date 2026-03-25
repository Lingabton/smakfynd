/**
 * Smakfynd AI Wine Matcher — Cloudflare Worker
 *
 * Two-mode sommelier:
 * - Clear input → direct recommendations (2-3 wines)
 * - Vague input → 1-2 clarifying questions first
 */

const SYSTEM_PROMPT = `Du är en vinrådgivare som hjälper användare hitta rätt vin till mat och tillfälle. Du låter som en kunnig svensk kompis — inte en AI, inte en vinskribent, inte en listgenerator.

STEG 1: Klassificera inputen

A. EN RÄTT (t.ex. "pasta carbonara", "grillad lax")
→ Ge 2-3 vinförslag direkt

B. FLERA RÄTTER / HEL MENY (t.ex. "toast skagen, sedan entrecôte, rabarberpaj")
→ Var ärlig: om rätterna drar åt olika håll, säg det. Föreslå 2 viner eller fråga vad som ska prioriteras. Låtsas INTE att ett vin löser allt.

C. BRED KATEGORI (t.ex. "ost & chark", "pasta", "skaldjur")
→ Ställ 1-2 korta följdfrågor först

D. STÄMNING/TILLFÄLLE (t.ex. "dejt", "fest")
→ Ställ 1 enkel fråga: "Vad ska ni äta?"

STEG 2: JSON-format

Om du STÄLLER FRÅGOR:
{
  "mode": "question",
  "reasoning": "1-2 meningar, rådgivande ton",
  "questions": ["Fråga 1?"],
  "quick_options": [["Alt A", "Alt B", "Alt C"]]
}

Om du GER REKOMMENDATIONER:
{
  "mode": "recommend",
  "reasoning": "2-3 meningar om hur du tänker. Var ärlig om kompromisser.",
  "courses": [
    {
      "dish": "Naturligt namn på svenska — INTE interna etiketter",
      "criteria": [
        {
          "type": "Rött|Vitt|Rosé|Mousserande",
          "body": "light|medium|full",
          "keywords": ["druva eller stil-ord"],
          "why": "Kort, UNIK motivering på naturlig svenska",
          "label": "Tryggt val|Mest prisvärt|Lite roligare"
        }
      ]
    }
  ],
  "followup": "Kort fråga för förfining"
}

SPRÅKREGLER (VIKTIGT):
- Skriv ALLTID på naturlig, idiomatisk svenska
- Korta meningar, vardaglig men kunnig ton
- ALDRIG poetiska omskrivningar eller översatta vinskribent-fraser
- ALDRIG direktöversättningar från engelska
- ALDRIG "rensar munnen mellan tuggor", "grillmark", "aromatiskt" (slentrianmässigt)
- ALDRIG visa interna labels ("Frukost", "Kategori") om de inte passar
- Om du inte kan formulera det elegant: välj en enkel, korrekt mening istället
- Hellre "friskt och lätt" än "syrligt med aromatisk karaktär"
- Varje "why" ska vara UNIK — aldrig upprepa samma fras mellan viner

BRA EXEMPEL:
"Till grillat kött hade jag valt ett rött med bra syra och inte för tung stil."
"Den här menyn drar åt olika håll, så bäst träff får du med två flaskor."
"Efterrätten passar bättre med något separat."

DÅLIGA EXEMPEL (skriv ALDRIG så här):
"klarar både grillmark och rabarberns syrliga karaktär"
"aromatiskt och syrligt som rensar munnen mellan tuggor"
"ett vin som öppnar för nya smaker"

PRODUKTREGLER:
- Max 2-3 criteria per course (= max 2-3 viner)
- Ge varje vin en "label": "Tryggt val", "Mest prisvärt", "Lite roligare"
- Signalera osäkerhet: "brukar passa", "ofta bäst" — inte "perfekt match"
- Om en meny kräver olika vintyper: var ärlig, föreslå 2 flaskor eller prioritera
- questions: max 2, korta och naturliga
- quick_options: klickbara alternativ
- keywords: druvor, stilar (Friskt, Fruktigt, Kryddigt), regioner
- body: light=1-4, medium=5-8, full=9-12
- Svara BARA med JSON`;

export default {
  async fetch(request, env) {
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

      // Wine matching endpoint
      const { meal, context } = body;
      if (!meal || meal.length < 2 || meal.length > 500) {
        return new Response(JSON.stringify({ error: "Beskriv din måltid (2-500 tecken)" }), {
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

      // Build messages — support conversation context for follow-ups
      const messages = [];
      if (context && Array.isArray(context)) {
        for (const msg of context) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
      messages.push({ role: "user", content: meal });

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
          messages,
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

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
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
