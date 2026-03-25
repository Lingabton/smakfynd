/**
 * Smakfynd AI Wine Matcher — Two-step architecture
 * Step 1: Classify input (Haiku — fast, cheap)
 * Step 2: Generate response within chosen strategy (Sonnet — better Swedish)
 */

// Step 1: Classification prompt (Haiku)
const CLASSIFY_PROMPT = `Klassificera denna vinförfrågan. Svara BARA med JSON.

{
  "input_type": "single_dish|multi_course|broad_category|mood_occasion",
  "dishes": ["lista av rätter/tillfällen användaren nämner"],
  "conflicts": true/false,
  "conflict_note": "kort not om varför rätterna kräver olika vin, eller null",
  "needs_followup": true/false,
  "followup_reason": "varför följdfråga behövs, eller null",
  "recommended_strategy": "ask_followup|recommend_main|recommend_two_bottles|recommend_direct",
  "suggested_followup": "föreslagen följdfråga på svenska, eller null",
  "suggested_options": ["klickbara alternativ"] eller null
}

Regler:
- single_dish: en tydlig rätt → recommend_direct
- multi_course med dessert som kräver annat vin → needs_followup=true, strategy=ask_followup
- multi_course utan konflikt → recommend_direct eller recommend_two_bottles
- broad_category (pasta, ost, skaldjur) → needs_followup=true
- mood_occasion (dejt, fest) → needs_followup=true
- Om dessert + huvudrätt med olika karaktär: ALLTID needs_followup=true`;

// Step 2: Recommendation prompt (Sonnet)
const RECOMMEND_PROMPT = `Du är en kunnig svensk vinrådgivare. Ge vinrekommendationer inom den valda strategin.

STRATEGI: {strategy}
KONTEXT: {context}

Svara med JSON:
{
  "mode": "recommend",
  "reasoning": "2-3 meningar. Naturlig svenska. Var ärlig om kompromisser.",
  "courses": [
    {
      "dish": "Naturligt namn",
      "criteria": [
        {
          "type": "Rött|Vitt|Rosé|Mousserande",
          "body": "light|medium|full",
          "keywords": ["druvor, stilar"],
          "why": "Max 1 mening. Unik. Konkret kopplad till maten.",
          "label": "Tryggt val|Mest prisvärt|Lite roligare"
        }
      ]
    }
  ],
  "followup": "Kort fråga för förfining, eller null"
}

HÅRDA REGLER:
- Max 2 criteria per course. Max 3 totalt i hela svaret.
- Varje "why" max 1 mening, unik, aldrig samma fras
- strategy=recommend_main → 2 viner till huvudrätten, nämn att dessert kräver separat
- strategy=recommend_two_bottles → 1 vin per rätt, max 2 totalt
- strategy=recommend_direct → 2-3 viner
- Var ärlig: "Det här är en kompromiss" om det är det

SPRÅK (ABSOLUTA REGLER):
- Naturlig, idiomatisk svenska. Korta meningar.
- FÖRBJUDNA uttryck: "rensar munnen", "grillmark", "mäta armen", "öppnar för", "karaktär" (generiskt), "klarar både X och Y" (om tveksamt)
- Om osäker på formulering: "Bra syra gör att det passar till den här rätten."
- Hellre enkelt och rätt än avancerat och konstigt
- Låt som en kunnig kompis, inte en vinskribent`;

// Question prompt (when follow-up needed)
const QUESTION_PROMPT = `Du är en kunnig svensk vinrådgivare. Ställ en kort följdfråga.

KONTEXT: {context}
ANLEDNING: {reason}

Svara med JSON:
{
  "mode": "question",
  "reasoning": "1-2 meningar, rådgivande ton, naturlig svenska",
  "questions": ["1 fråga, max 2"],
  "quick_options": [["Alt A", "Alt B", "Alt C"]]
}

REGLER:
- Max 1-2 frågor, korta
- Quick options ska vara naturliga val, inte interna kategorier
- Naturlig svenska, kort, varm ton`;

async function callClaude(apiKey, model, system, userMessage, context) {
  const messages = [];
  if (context && Array.isArray(context)) {
    for (const msg of context) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }
  messages.push({ role: "user", content: userMessage });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || "";

  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Could not parse AI response");
  }
}

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
        status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const body = await request.json();
      const url = new URL(request.url);
      const apiKey = env.ANTHROPIC_API_KEY;

      // Expert endpoint (unchanged)
      if (url.pathname === "/expert" && body.wines) {
        const expertPrompt = `Uppskatta kvalitetspoäng (80-100) för varje vin. Var realistisk. Svara BARA med JSON-array: [{"name":"...","points":88},...]\n\nViner:\n` + JSON.stringify(body.wines);
        const result = await callClaude(apiKey, "claude-haiku-4-5-20251001", expertPrompt, "Bedöm dessa viner", []);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Wine matching
      const { meal, context } = body;
      if (!meal || meal.length < 2) {
        return new Response(JSON.stringify({ error: "Beskriv din måltid" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // STEP 1: Classify with Haiku (fast, cheap)
      const classification = await callClaude(
        apiKey,
        "claude-haiku-4-5-20251001",
        CLASSIFY_PROMPT,
        meal,
        context || []
      );

      // STEP 2: Rule-based decision
      const strategy = classification.recommended_strategy || "recommend_direct";
      const needsFollowup = classification.needs_followup === true;

      // Hard-coded overrides
      const hasDesert = (classification.dishes || []).some(d =>
        /dessert|paj|pudding|glass|kaka|tårta|choklad|crème/i.test(d)
      );
      const hasMainAndDessert = (classification.dishes || []).length >= 2 && hasDesert;

      // Force follow-up for complex menus with dessert
      if (hasMainAndDessert && !context?.length) {
        const questionPrompt = QUESTION_PROMPT
          .replace("{context}", meal)
          .replace("{reason}", classification.conflict_note || "Menyn innehåller rätter som kräver olika vintyper");

        const question = await callClaude(
          apiKey,
          "claude-sonnet-4-6",
          questionPrompt,
          meal,
          context || []
        );

        return new Response(JSON.stringify(question), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Follow-up for broad/vague input
      if (needsFollowup && !context?.length) {
        const questionPrompt = QUESTION_PROMPT
          .replace("{context}", meal)
          .replace("{reason}", classification.followup_reason || "Inputen är bred");

        const question = await callClaude(
          apiKey,
          "claude-sonnet-4-6",
          questionPrompt,
          meal,
          context || []
        );

        return new Response(JSON.stringify(question), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // STEP 3: Generate recommendation with Sonnet
      const recPrompt = RECOMMEND_PROMPT
        .replace("{strategy}", strategy)
        .replace("{context}", `Användaren sa: "${meal}". Klassificering: ${JSON.stringify(classification)}`);

      const recommendation = await callClaude(
        apiKey,
        "claude-sonnet-4-6",
        recPrompt,
        context?.length ? meal : `Rekommendera vin till: ${meal}`,
        context || []
      );

      return new Response(JSON.stringify(recommendation), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (e) {
      console.error("Worker error:", e.message);
      return new Response(JSON.stringify({ error: "Något gick fel: " + e.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
