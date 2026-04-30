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
- Keywords MÅSTE vara på svenska: druvor (Malbec, Cabernet, Riesling) och svenska smakord (kryddigt, fruktigt, fylligt, fräscht, torrt)
- Skriv ALLTID på svenska. Aldrig engelska ord som "perhaps", "light", "full-bodied". Säg "vitt vin" inte "vitvin".`;

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
- Quick options ska vara konkreta val
- Skriv ALLTID på svenska, aldrig engelska ord`;

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
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "https://smakfynd.se",
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

      // Label reading endpoint — Gemini Flash vision
      if (url.pathname === "/label" && body.image) {
        // Validate image size (max 10MB base64 ≈ 7.5MB raw)
        if (body.image.length > 10_000_000) {
          return new Response(JSON.stringify({ error: "Image too large (max 10MB)" }), {
            status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const GEMINI_KEY = env.GEMINI_API_KEY;
        if (!GEMINI_KEY) {
          return new Response(JSON.stringify({ error: "Vision API not configured" }), {
            status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const imageData = body.image.replace(/^data:image\/\w+;base64,/, "");

        try {
          // Track daily usage
          const today = new Date().toISOString().slice(0, 10);
          const usageKey = `gemini_usage_${today}`;
          let usage = parseInt(await env.AI_KV?.get(usageKey) || "0");
          usage++;
          if (env.AI_KV) await env.AI_KV.put(usageKey, String(usage), { expirationTtl: 172800 });

          // Hard block at daily limit
          if (usage > 1500) {
            return new Response(JSON.stringify({ error: "Etikettläsningen har nått sin dagliga gräns. Prova igen imorgon.", _gemini_status: 429 }), {
              status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Alert at 80%/93% of free tier
          if (usage === 1200 || usage === 1400) {
            // Send alert via Resend if configured
            if (env.RESEND_API_KEY && env.ALERT_EMAIL) {
              fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  from: "Smakfynd <onboarding@resend.dev>",
                  to: [env.ALERT_EMAIL],
                  subject: `Gemini API: ${usage}/1500 anrop idag`,
                  html: `<p>Smakfynds etikett-skanning har använt <strong>${usage}</strong> av 1 500 gratis Gemini-anrop idag (${today}).</p><p>Om detta fortsätter behöver du uppgradera till betald plan.</p>`,
                }),
              }).catch(() => {});
            }
          }

          // Debug: log image size
          console.log(`Label scan: image base64 length=${imageData.length}`);

          const geminiRes = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_KEY },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { text: 'Read this wine label. Reply with ONLY: wine name, producer. Example: "Rubesco, Lungarotti" — nothing else, no JSON, no markdown.' },
                    { inline_data: { mime_type: "image/jpeg", data: imageData } }
                  ]
                }],
                generationConfig: { maxOutputTokens: 200, temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } }
              }),
            }
          );

          const geminiRaw = await geminiRes.text();
          console.log(`Gemini response status=${geminiRes.status}, body=${geminiRaw.slice(0, 300)}`);
          const geminiData = JSON.parse(geminiRaw);
          const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

          // Parse plain text response: "Wine Name, Producer"
          let cleaned = text.replace(/```[a-z]*\s*/g, "").replace(/```/g, "").replace(/["\n]/g, "").trim();
          // Sanitize: only allow reasonable wine name characters
          cleaned = cleaned.replace(/[<>{}]/g, "").slice(0, 200);
          // Try JSON first
          let result;
          try {
            const match = cleaned.match(/\{[\s\S]*\}/);
            result = match ? JSON.parse(match[0]) : null;
          } catch(e) { result = null; }
          // Fallback: plain text "Name, Producer"
          if (!result) {
            const parts = cleaned.split(/[,;]/);
            result = { wine_name: parts[0]?.trim() || cleaned, producer: parts[1]?.trim() || "" };
          }
          result._raw = text.slice(0, 200);

          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch(e) {
          return new Response(JSON.stringify({ error: "Vision failed: " + e.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

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
