// src/components/FoodMatch.jsx
const WINE_AI_URL = "https://smakfynd-wine-ai.smakfynd.workers.dev";

function matchWinesForCourses(courses, products, format) {
  if (!courses || !courses.length) return [];
  const bodyRange = { light: [0, 4], medium: [5, 8], full: [9, 12], lätt: [0, 4], medelkroppad: [5, 8], fylligt: [9, 12], "fyllig": [9, 12], "medel": [5, 8] };
  const usedNrs = new Set();

  // Format filter: "lådvin" → BiB, "flaska" → Flaska, "any" → both
  const pkgFilter = format === "lådvin" ? "BiB" : format === "flaska" ? "Flaska" : null;

  return courses.map(course => {
    const wines = [];
    for (const c of (course.criteria || [])) {
      if (wines.length >= 3) break;
      const typeMap = { "Rött": "Rött", "Vitt": "Vitt", "Rosé": "Rosé", "Mousserande": "Mousserande", "Red": "Rött", "White": "Vitt" };
      const wineType = typeMap[c.type] || c.type;
      const [bMin, bMax] = bodyRange[c.body] || [0, 12];
      const kw = (c.keywords || []).map(k => k.toLowerCase());

      // Try preferred format first, fall back to any format if too few results
      const withPkg = pkgFilter ? products.filter(p => p.category === wineType && p.package === pkgFilter && p.assortment === "Fast sortiment") : [];
      const pool = withPkg.length >= 5 ? withPkg : products.filter(p => p.category === wineType && p.assortment === "Fast sortiment");
      const scored = pool
        .map(p => {
          let fit = 0;
          // Body match — skip wines without taste data instead of defaulting
          const body = p.taste_body;
          if (body) {
            if (body >= bMin && body <= bMax) fit += 3;
            else if (Math.abs(body - (bMin + bMax) / 2) <= 2) fit += 1;
          }
          // Keyword matching with word boundaries
          const haystack = " " + [p.name, p.sub, p.grape, p.style, p.cat3, ...(p.food_pairings || [])].join(" ").toLowerCase() + " ";
          let wantSweet = false;
          for (const k of kw) {
            if (haystack.includes(" " + k) || haystack.includes(k + " ")) fit += 2;
            // Special: taste keywords match numeric fields
            if (k === "sött" || k === "söt") {
              wantSweet = true;
              if (p.taste_sweet && p.taste_sweet >= 6) fit += 5;
            }
            else if ((k === "torrt" || k === "torr") && p.taste_sweet != null && p.taste_sweet <= 3) fit += 2;
            else if ((k === "fylligt" || k === "fyllig") && p.taste_body && p.taste_body >= 8) fit += 2;
            else if ((k === "lätt" || k === "fräscht") && p.taste_body && p.taste_body <= 4) fit += 2;
            else if ((k === "fruktigt" || k === "fruktig") && p.taste_fruit && p.taste_fruit >= 8) fit += 2;
          }
          // Penalize dry wines when sweet was requested
          if (wantSweet && p.taste_sweet != null && p.taste_sweet <= 3) fit -= 5;
          return { ...p, _fit: fit, _why: c.why, _label: c.label || "" };
        })
        .filter(p => p._fit >= 2 && !usedNrs.has(p.nr))
        .sort((a, b) => {
          // Prioritize: good fit first, then highest smakfynd score
          const aFitOk = a._fit >= 3 ? 1 : 0;
          const bFitOk = b._fit >= 3 ? 1 : 0;
          if (aFitOk !== bFitOk) return bFitOk - aFitOk;
          return b.smakfynd_score - a.smakfynd_score;
        });

      // Pick top 2 matches per criterion (gives user a choice)
      for (const pick of scored.slice(0, 2)) {
        if (wines.length >= 3) break;
        usedNrs.add(pick.nr);
        wines.push(pick);
      }
    }
    return { dish: course.dish, wines };
  }).filter(c => c.wines.length > 0);
}

function WineResult({ m }) {
  const [_lbl, col] = getScoreInfo(m.smakfynd_score);
  return (
    <a href={`https://www.systembolaget.se/produkt/vin/${m.nr}`} target="_blank" rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      style={{ padding: "12px 14px", borderRadius: 12, background: t.card, border: `1px solid ${t.bdrL}`, textDecoration: "none", display: "flex", alignItems: "center", gap: 12, transition: "border-color 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = t.wine + "40"}
      onMouseLeave={e => e.currentTarget.style.borderColor = t.bdrL}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 11, flexShrink: 0,
        background: `${col}12`, border: `2px solid ${col}30`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 17, fontWeight: 900, color: col, lineHeight: 1, fontFamily: t.serif }}>{m.smakfynd_score}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontFamily: t.serif, color: t.tx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
        <div style={{ fontSize: 12, color: t.txL }}>{m.sub} · {m.country}</div>
        {m._why && <div style={{ fontSize: 11, color: t.txM, marginTop: 3, lineHeight: 1.4 }}>{m._why}</div>}
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: t.tx, fontFamily: t.serif }}>
          {m.price}{"\u00A0"}<span style={{ fontSize: 11, fontWeight: 400, color: t.txL }}>kr</span>
        </div>
        {m._tier && <div style={{ fontSize: 9, fontWeight: 700, color: m._tierCol || t.txL, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>{m._tier}</div>}
      </div>
    </a>
  );
}

function FoodMatch({ products }) {
  const [meal, setMeal] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [courseResults, setCourseResults] = useState([]);
  const [error, setError] = useState(null);
  const [conversation, setConversation] = useState([]); // conversation history for follow-ups

  const sendToAI = async (userMessage, existingContext) => {
    setLoading(true);
    setError(null);
    const t0 = Date.now();

    try {
      let data;
      for (let attempt = 0; attempt < 2; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        const res = await fetch(WINE_AI_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meal: userMessage,
            context: existingContext || [],
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        data = await res.json();
        if (!data.error) break;
        if (attempt === 0) await new Promise(r => setTimeout(r, 1000));
      }
      if (data.error) throw new Error(data.error);

      setAiResult(data);
      trackAI(userMessage, data, Date.now() - t0);

      const fmt = data.format || (meal.toLowerCase().match(/lådvin|box|bib|bag.in.box/) ? "lådvin" : "any");
      if (data.mode === "recommend" && data.courses) {
        setCourseResults(matchWinesForCourses(data.courses, products, fmt));
      } else if (data.courses) {
        setCourseResults(matchWinesForCourses(data.courses, products, fmt));
      } else if (data.criteria) {
        setCourseResults(matchWinesForCourses([{ dish: meal, criteria: data.criteria }], products, fmt));
      }
    } catch (e) {
      setError("Kunde inte hämta vinförslag just nu. Försök igen.");
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!meal.trim() || meal.length < 2) return;
    setConversation([]);
    setCourseResults([]);
    setAiResult(null);
    await sendToAI(meal.trim(), []);
  };

  const handleFollowup = async (answer) => {
    // Build conversation context
    const newConv = [
      ...conversation,
      { role: "user", content: meal },
      { role: "assistant", content: JSON.stringify(aiResult) },
    ];
    setConversation(newConv);
    setCourseResults([]);
    setAiResult(null);
    await sendToAI(answer, newConv);
  };

  const dishColors = ["#6b2a3a", "#2a5a6b", "#5a6b2a", "#6b4a2a"];

  return (
    <div style={{ padding: "14px 18px", borderRadius: 16, background: t.surface, border: `1px solid ${t.bdr}`, marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 400, fontFamily: t.serif, color: t.tx }}>Kvällens middag?</div>
        </div>
        <label htmlFor="sf-meal" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>Beskriv din måltid</label>
        <input id="sf-meal" type="text" value={meal} onChange={e => setMeal(e.target.value)}
          placeholder="T.ex. oxfilé, lax, tacos..."
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{ flex: 2, padding: "10px 14px", borderRadius: 10, border: `1px solid ${t.bdr}`, background: t.card, fontSize: 13, color: t.tx, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
          onFocus={e => e.target.style.borderColor = t.wine + "55"}
          onBlur={e => e.target.style.borderColor = t.bdr}
        />
        <button onClick={handleSubmit} disabled={loading || meal.length < 3}
          style={{
            padding: "10px 16px", borderRadius: 10, border: "none", cursor: loading ? "wait" : "pointer",
            background: t.wine, color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
            opacity: loading || meal.length < 3 ? 0.5 : 1, transition: "opacity 0.2s", flexShrink: 0,
          }}>{loading ? "..." : "Hitta vin"}</button>
      </div>

      {!aiResult && !loading && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
          {["Fredagstacos", "Grillat kött", "Pasta", "Lax", "Skaldjur", "Dejt"].map(s => (
            <button key={s} onClick={() => setMeal(s)}
              style={{ padding: "3px 10px", borderRadius: 100, border: `1px solid ${t.bdr}`, background: t.card, color: t.txL, fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.wine; e.currentTarget.style.color = t.wine; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = t.bdr; e.currentTarget.style.color = t.txL; }}
            >{s}</button>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "20px 0", color: t.txL }}>
          <div style={{ width: 24, height: 24, margin: "0 auto 8px", border: `3px solid ${t.bdr}`, borderTopColor: t.wine, borderRadius: "50%", animation: "sfSpin 0.8s linear infinite" }} />
          <style>{`@keyframes sfSpin { to { transform: rotate(360deg) } }`}</style>
          <div style={{ fontSize: 13, fontStyle: "italic" }}>Analyserar din måltid, kan ta några sekunder...</div>
        </div>
      )}

      {error && <p style={{ marginTop: 10, fontSize: 12, color: t.deal }}>{error}</p>}

      {aiResult && !loading && (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 13, color: t.txM, lineHeight: 1.5, margin: "0 0 12px" }}>
            {aiResult.reasoning}
          </p>

          {/* MODE: Question — AI needs more info */}
          {aiResult.mode === "question" && <AIQuestion aiResult={aiResult} onFollowup={handleFollowup} />}

          {/* MODE: Recommend — show wines */}
          {(aiResult.mode === "recommend" || courseResults.length > 0) && (
            <div>
              {courseResults.map((course, ci) => (
                <div key={ci} style={{ marginBottom: ci < courseResults.length - 1 ? 16 : 0 }}>
                  {courseResults.length > 1 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 4, height: 18, borderRadius: 2, background: dishColors[ci % dishColors.length] }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: dishColors[ci % dishColors.length], fontFamily: t.serif }}>{course.dish}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {course.wines.map((m, i) => {
                      const matchedP = products.find(pr => String(pr.nr) === String(m.nr));
                      return matchedP
                        ? <div key={i}>
                            {m._why && <div style={{ fontSize: 10, color: t.txM, marginBottom: 3, fontStyle: "italic" }}>{m._why}</div>}
                            <Card p={matchedP} rank={i + 1} delay={0} allProducts={products} auth={{}} />
                          </div>
                        : <WineResult key={i} m={m} />;
                    })}
                  </div>
                </div>
              ))}

              {/* Follow-up suggestion */}
              {aiResult.followup && (
                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: t.bg, fontSize: 12, color: t.txM, lineHeight: 1.5 }}>
                  {aiResult.followup}
                </div>
              )}

              {courseResults.length === 0 && aiResult.mode === "recommend" && <p style={{ fontSize: 12, color: t.txL }}>Hittade inga matchningar. Prova en annan beskrivning.</p>}

              {/* Share wine list */}
              {courseResults.length > 0 && courseResults.some(c => c.wines.length > 0) && (
                <button onClick={() => {
                  const lines = courseResults.flatMap(c => {
                    const header = courseResults.length > 1 ? [`\n${c.dish}:`] : [];
                    return [...header, ...c.wines.filter(m => m.nr).map(m => {
                      const p = products.find(pr => String(pr.nr) === String(m.nr));
                      return p ? `  ${p.name} ${p.sub || ""} \u2014 ${p.price}\u00A0kr (${p.smakfynd_score}/100)` : null;
                    }).filter(Boolean)];
                  });
                  const text = `Vinlista till ${meal}:\n${lines.join("\n")}\n\nSmakfynd.se`;
                  if (navigator.share) {
                    navigator.share({ title: `Vinlista till ${meal}`, text }).catch(() => {});
                  } else {
                    navigator.clipboard?.writeText(text);
                  }
                  track("share", { type: "ai_list", meal });
                }}
                  style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 10, border: `1px solid ${t.bdr}`, background: t.card, cursor: "pointer", fontFamily: "inherit", fontSize: 12, color: t.txM }}>
                  <span style={{ fontSize: 14 }}>↗</span> Dela vinlista
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
