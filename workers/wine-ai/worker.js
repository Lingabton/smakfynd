/**
 * Smakfynd AI Wine Matcher — Cloudflare Workers AI
 * Uses Llama 3.1 70B (free tier: 10k req/day)
 * Two-step: classify → recommend/ask
 */

const MODEL = "@cf/meta/llama-3.1-70b-instruct";

const CLASSIFY_PROMPT = `Du klassificerar vinförfrågningar. Svara BARA med giltig JSON, inget annat.

Svarsformat:
{
  "input_type": "single_dish|multi_course|broad_category|mood_occasion",
  "dishes": ["lista av rätter"],
  "needs_followup": true/false,
  "followup_reason": "varför, eller null",
  "recommended_strategy": "ask_followup|recommend_direct|recommend_two_bottles",
  "suggested_followup": "föreslagen fråga, eller null",
  "suggested_options": ["alternativ"] eller null
}

Regler:
- single_dish (en tydlig rätt) → recommend_direct
- multi_course utan konflikt → recommend_direct eller recommend_two_bottles
- broad_category (bara "pasta", "kött") → needs_followup=true, ask_followup
- mood_occasion (dejt, fest) → needs_followup=true, ask_followup`;

const RECOMMEND_PROMPT = `Du är en kunnig svensk vinrådgivare. Svara BARA med giltig JSON.

Svarsformat:
{
  "mode": "recommend",
  "reasoning": "2-3 meningar på naturlig svenska om varför dessa viner passar.",
  "courses": [
    {
      "dish": "Rättens namn",
      "criteria": [
        {
          "type": "Rött|Vitt|Rosé|Mousserande",
          "body": "light|medium|full",
          "keywords": ["druvor eller stilar PÅ SVENSKA, t.ex. Malbec, Shiraz, kryddigt, fruktigt"],
          "why": "En kort mening om varför detta passar till rätten.",
          "label": "Tryggt val|Mest prisvärt|Lite roligare"
        }
      ]
    }
  ]
}

REGLER:
- Max 2 criteria per course. Max 3 criteria totalt.
- Varje "why" max 1 mening, unik
- Naturlig svenska. Korta meningar. Som en kunnig kompis.
- FÖRBJUDET: "rensar munnen", "karaktär" (generiskt), "klarar både X och Y"
- Keywords MÅSTE vara på svenska: druvor (Malbec, Cabernet, Riesling) och svenska smakord (kryddigt, fruktigt, fylligt, fräscht, torrt)`;

const QUESTION_PROMPT = `Du är en kunnig svensk vinrådgivare. Ställ en kort följdfråga. Svara BARA med giltig JSON.

Svarsformat:
{
  "mode": "question",
  "reasoning": "1-2 meningar, rådgivande ton",
  "questions": ["1 kort fråga"],
  "quick_options": [["Alt A", "Alt B", "Alt C"]]
}

REGLER:
- Max 1 fråga, kort och naturlig
- Quick options ska vara konkreta val`;

async function callAI(ai, system, userMessage, context) {
  const messages = [];
  if (context && Array.isArray(context)) {
    for (const msg of context) {
      messages.push({ role: msg.role, content: String(msg.content) });
    }
  }
  messages.push({ role: "user", content: userMessage });

  const response = await ai.run(MODEL, {
    messages: [
      { role: "system", content: system },
      ...messages,
    ],
    max_tokens: 1024,
    temperature: 0.7,
  });

  const text = response.response || "";

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
    const corsHeaders = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
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

      // Expert endpoint
      if (url.pathname === "/expert" && body.wines) {
        const prompt = `Uppskatta kvalitetspoäng (80-100) för varje vin. Svara BARA med JSON-array: [{"name":"...","points":88},...]\n\nViner:\n` + JSON.stringify(body.wines);
        const result = await callAI(env.AI, prompt, "Bedöm dessa viner", []);
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

      // STEP 1: Classify
      const classification = await callAI(env.AI, CLASSIFY_PROMPT, meal, context || []);

      const strategy = classification.recommended_strategy || "recommend_direct";
      const needsFollowup = classification.needs_followup === true;

      // Follow-up for broad/vague input (only if no prior context)
      if (needsFollowup && !context?.length) {
        const question = await callAI(
          env.AI,
          QUESTION_PROMPT,
          `Måltid: "${meal}". Anledning till följdfråga: ${classification.followup_reason || "Bred input"}`,
          context || []
        );
        return new Response(JSON.stringify(question), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // STEP 2: Recommend
      const recInput = context?.length
        ? meal
        : `Rekommendera vin till: ${meal}. Strategi: ${strategy}. Rätter: ${JSON.stringify(classification.dishes || [meal])}`;

      const recommendation = await callAI(
        env.AI,
        RECOMMEND_PROMPT,
        recInput,
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
