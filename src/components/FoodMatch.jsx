// src/components/FoodMatch.jsx
const WINE_AI_URL = "https://smakfynd-wine-ai.smakfynd.workers.dev";

function matchWinesForCourses(courses, products) {
  if (!courses || !courses.length) return [];
  const bodyRange = { light: [0, 4], medium: [5, 8], full: [9, 12] };
  const usedNrs = new Set();

  return courses.map(course => {
    const wines = [];
    for (const c of (course.criteria || [])) {
      if (wines.length >= 3) break; // Max 3 wines per course
      const typeMap = { "Rött": "Rött", "Vitt": "Vitt", "Rosé": "Rosé", "Mousserande": "Mousserande" };
      const wineType = typeMap[c.type] || c.type;
      const [bMin, bMax] = bodyRange[c.body] || [0, 12];
      const kw = (c.keywords || []).map(k => k.toLowerCase());

      const scored = products
        .filter(p => p.category === wineType && p.package === "Flaska" && p.assortment === "Fast sortiment")
        .map(p => {
          let fit = 0;
          const body = p.taste_body || 6;
          if (body >= bMin && body <= bMax) fit += 3;
          else if (Math.abs(body - (bMin + bMax) / 2) <= 3) fit += 1;
          const haystack = [p.name, p.sub, p.grape, p.style, p.cat3, ...(p.food_pairings || [])].join(" ").toLowerCase();
          for (const k of kw) { if (haystack.includes(k)) fit += 2; }
          return { ...p, _fit: fit, _why: c.why, _label: c.label || "" };
        })
        .filter(p => p._fit >= 2 && !usedNrs.has(p.nr))
        .sort((a, b) => (b._fit * 10 + b.smakfynd_score) - (a._fit * 10 + a.smakfynd_score));

      // Pick best match for this criterion
      if (scored.length > 0) {
        usedNrs.add(scored[0].nr);
        wines.push(scored[0]);
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
        <span style={{ fontSize: 17, fontWeight: 900, color: col, lineHeight: 1, fontFamily: "'Instrument Serif', Georgia, serif" }}>{m.smakfynd_score}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontFamily: "'Instrument Serif', Georgia, serif", color: t.tx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
        <div style={{ fontSize: 12, color: t.txL }}>{m.sub} · {m.country}</div>
        {m._why && <div style={{ fontSize: 11, color: t.txM, marginTop: 3, lineHeight: 1.4 }}>{m._why}</div>}
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: t.tx, fontFamily: "'Instrument Serif', Georgia, serif" }}>
          {m.price}<span style={{ fontSize: 11, fontWeight: 400, color: t.txL }}>kr</span>
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
        const timeout = setTimeout(() => controller.abort(), 15000);
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

      if (data.mode === "recommend" && data.courses) {
        setCourseResults(matchWinesForCourses(data.courses, products));
      } else if (data.courses) {
        setCourseResults(matchWinesForCourses(data.courses, products));
      } else if (data.criteria) {
        setCourseResults(matchWinesForCourses([{ dish: meal, criteria: data.criteria }], products));
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
    <div style={{ padding: "20px 22px", borderRadius: 16, background: t.surface, border: `1px solid ${t.bdr}`, marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>🍽</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 400, fontFamily: "'Instrument Serif', Georgia, serif", color: t.tx }}>Kvällens middag?</div>
          <div style={{ fontSize: 12, color: t.txL }}>Beskriv vad du ska äta — vi föreslår vinet.</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <label htmlFor="sf-meal" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>Beskriv din måltid</label>
        <input id="sf-meal" type="text" value={meal} onChange={e => setMeal(e.target.value)}
          placeholder="T.ex. toast skagen, sedan oxfilé med rödvinssky..."
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: `1px solid ${t.bdr}`, background: t.card, fontSize: 14, color: t.tx, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
          onFocus={e => e.target.style.borderColor = t.wine + "55"}
          onBlur={e => e.target.style.borderColor = t.bdr}
        />
        <button onClick={handleSubmit} disabled={loading || meal.length < 3}
          style={{
            padding: "12px 18px", borderRadius: 12, border: "none", cursor: loading ? "wait" : "pointer",
            background: t.wine, color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
            opacity: loading || meal.length < 3 ? 0.5 : 1, transition: "opacity 0.2s", flexShrink: 0,
          }}>{loading ? "Tänker..." : "Hitta vin"}</button>
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
        {[["Under 100 kr", "0-100"], ["100–200 kr", "100-200"], ["200+ kr", "200-999"]].map(([l, k]) => (
          <button key={k} onClick={() => {
            const cur = meal.replace(/\s*\(budget:.*?\)\s*/g, "").trim();
            setMeal(cur ? `${cur} (budget: ${k} kr)` : "");
          }}
            style={{ padding: "5px 10px", borderRadius: 100, border: `1px solid ${t.green}40`, background: `${t.green}08`, color: t.green, fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}
          >{l}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 5 }}>
        {["Fredagstacos", "Grillat kött", "Pasta", "Lax", "Pizza", "Skaldjur", "Ost & chark", "Dejt"].map(s => (
          <button key={s} onClick={() => setMeal(s)}
            style={{ padding: "5px 12px", borderRadius: 100, border: `1px solid ${t.bdr}`, background: t.card, color: t.txM, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.wine; e.currentTarget.style.color = t.wine; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.bdr; e.currentTarget.style.color = t.txM; }}
          >{s}</button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "20px 0", color: t.txL }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>🍷</div>
          <div style={{ fontSize: 13, fontStyle: "italic" }}>Analyserar din måltid...</div>
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
                      <span style={{ fontSize: 13, fontWeight: 600, color: dishColors[ci % dishColors.length], fontFamily: "'Instrument Serif', Georgia, serif" }}>{course.dish}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {course.wines.map((m, i) => {
                      const matchedP = products.find(pr => String(pr.nr) === String(m.nr));
                      return matchedP
                        ? <div key={i}>
                            {m._why && <div style={{ fontSize: 10, color: t.txM, marginBottom: 3, fontStyle: "italic" }}>{m._why}</div>}
                            <Card p={matchedP} rank={i + 1} delay={0} allProducts={products} />
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
                      return p ? `  ${p.name} ${p.sub || ""} — ${p.price}kr (${p.smakfynd_score}/100)` : null;
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
