// ═══════════════════════════════════════════════════════════════
// SMAKFYND v7 — Real Data + Package Filter
// Smartare vinval på Systembolaget
// By Olav Innovation AB · Gabriel Linton
// ═══════════════════════════════════════════════════════════════

// Data loaded from smakfynd_web.json (paste into DATA_URL or embed)
// To update: run python3 ~/smakfynd/scripts/score_wines_v2.py
const DATA_URL = null; // Set to hosted JSON URL when deployed

const SAMPLE_PRODUCTS = []; // Will be replaced by loaded data

const CATS = [
  { k:"all", l:"Alla", i:"✦" }, { k:"Rött", l:"Rött vin", i:"🍷" },
  { k:"Vitt", l:"Vitt vin", i:"🥂" }, { k:"Rosé", l:"Rosé", i:"🌸" },
  { k:"Mousserande", l:"Bubbel", i:"🍾" },
];
const PRICES = [
  { k:"all", l:"Alla priser" }, { k:"0-79", l:"Under 80 kr" },
  { k:"80-119", l:"80 – 119 kr" }, { k:"120-199", l:"120 – 199 kr" }, { k:"200-999", l:"200 kr +" },
];

const GABRIELS_PICKS = [
  {name:"Three Finger Jack",sub:"Cabernet Sauvignon · USA",price:"159 kr",smakfynd_score:76,nr:"352801",note:"Kraftfull Cabernet från Lodi i Kalifornien. Mörka körsbär, vanilj och en mjuk finish som gör den till en perfekt stekkompis. Prisvärd för den som gillar Nya världens generösa stil utan att det blir för tungt."},
  {name:"Mucho Mas",sub:"Grenache · Spanien",price:"99 kr",smakfynd_score:80,nr:"5234001",note:"Fruktbomb under hundralappen. Mogna hallon och körsbär med en kryddig touch — perfekt vardagsvin till pasta, tacos eller bara ett glas på balkongen. Svårslaget värde."},
  {name:"Leitz Eins Zwei Dry",sub:"Riesling · Tyskland",price:"107 kr",smakfynd_score:73,nr:"582201",note:"Torr tysk Riesling med skarp syra och gröna äpplen. Passar utmärkt till asiatisk mat, fisk och skaldjur. Annorlunda val för den som vill utforska bortom det vanliga."},
];

const FOOD_CATS = [
  { k: "Kött", e: "🥩" }, { k: "Fågel", e: "🍗" }, { k: "Fisk", e: "🐟" },
  { k: "Skaldjur", e: "🦐" }, { k: "Fläsk", e: "🥓" }, { k: "Grönsaker", e: "🥦" },
  { k: "Ost", e: "🧀" }, { k: "Vilt", e: "🦌" }, { k: "Pasta", e: "🍝" },
];

const FAQS = [
  {q:"Hur beräknas Smakfynd-poängen?",a:"Vi tittar på två saker: hur bra vinet är (enligt vanliga människors betyg) och vad det kostar jämfört med andra viner i samma prisklass. Ett vin för 159 kr jämförs med andra viner i spannet 150–249 kr — inte med viner för 79 kr. Poängen visas på en skala 1–100 där högre är bättre."},
  {q:"Var kommer betygen ifrån?",a:"Smakfynd kombinerar crowd-betyg från miljontals användare med expertrecensioner från vinkritiker, och väger in priset relativt kategorin. Resultatet är en enda poäng som visar kvalitet per krona."},
  {q:"Vad betyder 'pris sedan lansering'?",a:"När ett vin först börjar säljas på Systembolaget har det ett visst pris. Ibland sänker importören priset senare. Systembolaget skyltar inte med dessa prissänkningar, men vi håller koll."},
  {q:"Säljer Smakfynd alkohol?",a:"Nej. Vi är en helt oberoende informationstjänst som drivs av Olav Innovation AB. Alla köp gör du via Systembolaget."},
  {q:"Hur ofta uppdateras informationen?",a:"Varje vecka. Vi går igenom hela Systembolagets sortiment, hämtar senaste betygen och räknar om poängen."},
];

// ── Color system ──
const t = {
  bg: "#f7f3ec",
  surface: "#fefcf8",
  card: "#ffffff",
  bdr: "#e6ddd0",
  bdrL: "#efe8dc",
  wine: "#8b2332",
  wineD: "#6b1a27",
  wineL: "#8b233212",
  tx: "#1e1710",
  txM: "#5c5043",
  txL: "#9a8e7e",
  txF: "#c2b8a8",
  green: "#3d7a3e",
  greenL: "#3d7a3e10",
  deal: "#c44020",
  dealL: "#c4402010",
  gold: "#b08d40",
};

// ── Shared styles ──
const pill = (active, accent = t.wine) => ({
  padding: "8px 16px", borderRadius: 100, cursor: "pointer", fontSize: 13,
  fontWeight: active ? 600 : 400, whiteSpace: "nowrap", fontFamily: "inherit",
  transition: "all 0.2s ease",
  border: active ? `1.5px solid ${accent}` : `1px solid ${t.bdr}`,
  background: active ? accent + "0c" : "transparent",
  color: active ? accent : t.txM,
});

// Rescale raw score to 1-100 for display
// Uses piecewise mapping so scores spread across full range
function rescale(raw) {
  if (raw >= 16) return Math.min(99, 90 + Math.round((raw - 16) * 5));
  if (raw >= 14) return Math.round(75 + (raw - 14) * 7.5);
  if (raw >= 12) return Math.round(60 + (raw - 12) * 7.5);
  if (raw >= 10) return Math.round(42 + (raw - 10) * 9);
  if (raw >= 8) return Math.round(22 + (raw - 8) * 10);
  return Math.max(1, Math.round(raw * 2.75));
}

function getScoreInfo(s100) {
  if (s100 >= 90) return ["Fantastiskt fynd", "#1a7a2e", "🏆"];
  if (s100 >= 75) return ["Utmärkt värde", t.green, "⭐"];
  if (s100 >= 60) return ["Bra fynd", "#5a7542", ""];
  if (s100 >= 40) return ["Godkänt", "#7a7054", ""];
  return ["Medel", "#8a7a6a", ""];
}

function MiniBar({ label, value, max = 10, color }) {
  const pct = value ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 10, color: t.txL, width: 52, flexShrink: 0, textAlign: "right" }}>{label}</span>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: t.bdr, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: color || t.txM, transition: "width 0.8s ease" }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: color || t.txM, minWidth: 20, textAlign: "right" }}>{value ? value.toFixed(1) : "—"}</span>
    </div>
  );
}

function ScoreBars({ p }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <MiniBar label="Crowd" value={p.crowd_score} color="#6b8cce" />
      <MiniBar label="Expert" value={p.expert_score} color="#b07d3b" />
    </div>
  );
}

// Product image URL from Systembolaget CDN
function getImageUrl(p, size = 200) {
  if (p.image_url) return p.image_url;
  if (p.nr) return `https://product-cdn.systembolaget.se/productimages/${p.nr}/${p.nr}_400.png`;
  return null;
}

function ProductImage({ p, size = 52, style: extraStyle = {} }) {
  const [err, setErr] = useState(false);
  const url = getImageUrl(p);
  const icon = ({ Rött: "🍷", Vitt: "🥂", Rosé: "🌸", Mousserande: "🍾", Öl: "🍺" })[p.category] || "✦";

  if (!url || err) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 10, flexShrink: 0,
        background: t.bg, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.4, ...extraStyle,
      }}>{icon}</div>
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: 10, flexShrink: 0,
      background: t.bg, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
      ...extraStyle,
    }}>
      <img
        src={url}
        alt={p.name}
        onError={() => setErr(true)}
        style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }}
      />
    </div>
  );
}

function Card({ p, rank, delay, totalInCategory }) {
  const [open, setOpen] = useState(false);
  const icon = ({ Rött: "🍷", Vitt: "🥂", Rosé: "🌸", Mousserande: "🍾" })[p.category] || "✦";
  const s100 = p.smakfynd_score;
  const [label, col, emoji] = getScoreInfo(s100);
  const foodStr = (p.food_pairings || []).slice(0, 3).join(", ");
  const sbUrl = `https://www.systembolaget.se/produkt/${p.nr}`;
  
  // Rank badges
  const badge = rank === 1 ? "Bästa köpet" : rank <= 3 ? `Top ${rank}` : null;

  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        background: t.card, borderRadius: 16,
        border: `1px solid ${open ? t.bdr : t.bdrL}`,
        boxShadow: open ? "0 12px 40px rgba(30,23,16,0.08)" : "0 1px 3px rgba(30,23,16,0.03)",
        transition: "all 0.3s ease", overflow: "hidden",
        animation: `slideUp 0.4s ease ${delay}s both`,
        cursor: "pointer",
      }}
    >
      {/* Main row */}
      <div style={{ padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Product image with rank overlay */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <ProductImage p={p} size={52} />
          <div style={{
            position: "absolute", top: -4, left: -4,
            width: 20, height: 20, borderRadius: 6,
            background: rank <= 3 ? `linear-gradient(135deg, ${t.wine}, ${t.wineD})` : t.card,
            border: rank <= 3 ? "none" : `1px solid ${t.bdr}`,
            color: rank <= 3 ? "#fff" : t.txM,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 800, fontFamily: "'Instrument Serif', Georgia, serif",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}>
            {rank}
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={{
                margin: 0, fontSize: 17, fontFamily: "'Instrument Serif', Georgia, serif",
                fontWeight: 400, color: t.tx, lineHeight: 1.2,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{p.name}</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: t.txL, letterSpacing: "0.01em" }}>
                {p.sub} · {p.country}{p.region ? `, ${p.region}` : ""}
              </p>
            </div>
            {/* Score badge + price */}
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `linear-gradient(135deg, ${col}18, ${col}08)`,
                border: `2px solid ${col}30`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                margin: "0 auto",
              }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: col, lineHeight: 1, fontFamily: "'Instrument Serif', Georgia, serif" }}>{s100}</span>
                <span style={{ fontSize: 6, fontWeight: 700, color: col, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.7 }}>poäng</span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: t.tx, lineHeight: 1, marginTop: 5, fontFamily: "'Instrument Serif', Georgia, serif" }}>
                {p.price}<span style={{ fontSize: 11, fontWeight: 400, color: t.txL, marginLeft: 1 }}>kr</span>
              </div>
              {p.launch_price && p.price_vs_launch_pct > 0 && (
                <span style={{ fontSize: 9, color: t.deal, fontWeight: 600 }}>−{p.price_vs_launch_pct}%</span>
              )}
            </div>
          </div>

          {/* Grape + food */}
          <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {p.grape && <span style={{ fontSize: 11, color: t.txM }}>{p.grape}</span>}
            {p.grape && foodStr && <span style={{ color: t.bdr }}>·</span>}
            {foodStr && <span style={{ fontSize: 11, color: t.txL }}>Passar till {foodStr}</span>}
          </div>

          {/* Crowd/Expert bars + tags */}
          <div style={{ marginTop: 8 }}>
            <ScoreBars p={p} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              {badge && <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 10px", borderRadius: 100, background: rank === 1 ? `linear-gradient(135deg, #b08d40, #d4a84b)` : `${t.wine}15`, color: rank === 1 ? "#fff" : t.wine, textTransform: "uppercase", letterSpacing: "0.08em", boxShadow: rank === 1 ? "0 1px 4px rgba(176,141,64,0.3)" : "none" }}>{rank === 1 ? "🏆 " : ""}{badge}</span>}
              <span style={{ fontSize: 10, fontWeight: 600, color: col, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
              {p.is_new && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: t.wineL, color: t.wine, textTransform: "uppercase", letterSpacing: "0.06em" }}>Nyhet</span>}
              {p.price_vs_launch_pct > 0 && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: t.dealL, color: t.deal, textTransform: "uppercase" }}>Prissänkt</span>}
              {p.organic && <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: t.greenL, color: t.green }}>Eko</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Action row — always visible: SB link + expand hint */}
      <div style={{
        padding: "0 18px 12px", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <a href={sbUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "7px 14px", borderRadius: 10,
            background: t.tx, color: "#faf6f0",
            fontSize: 12, fontWeight: 600, textDecoration: "none", letterSpacing: "0.02em",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          Köp på <span style={{ fontWeight: 700 }}>Systembolaget</span>
          <span style={{ fontSize: 10 }}>↗</span>
        </a>
        <span
          onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          style={{
            fontSize: 11, color: t.txL, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            padding: "4px 0",
          }}
        >
          {open ? "Dölj detaljer" : "Mer info"}
          <span style={{ fontSize: 10, transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
        </span>
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${t.bdrL}`, paddingTop: 14 }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
            {/* Large bottle image */}
            <ProductImage p={p} size={100} style={{ borderRadius: 12, background: "#faf7f2" }} />
            {/* Details grid */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 10 }}>
                {[["Druva", p.grape || "—"], ["Stil", p.style || "—"], ["Alkohol", p.alc ? `${p.alc}%` : "—"], ["Volym", `${p.vol} ml`]].map(([l, v], i) => (
                  <div key={i}>
                    <div style={{ fontSize: 9, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 13, color: t.txM, fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>
              {p.food_pairings?.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Passar till</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {p.food_pairings.map((f, i) => <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 100, background: t.bg, color: t.txM, border: `1px solid ${t.bdrL}` }}>{f}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Taste profile */}
          {(p.taste_body || p.taste_fruit || p.taste_sweet != null) && (
            <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 10, background: t.bg }}>
              <div style={{ fontSize: 9, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Smakprofil</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["Lätt", "Fylligt", p.taste_body, 12],
                  ["Stram", "Fruktigt", p.taste_fruit, 12],
                  ["Torrt", "Sött", p.taste_sweet, 12],
                ].filter(([_a, _b, v]) => v != null && v > 0).map(([lo, hi, val, max]) => (
                  <div key={lo}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, color: t.txL, width: 40, textAlign: "right", flexShrink: 0 }}>{lo}</span>
                      <div style={{ flex: 1, height: 3, borderRadius: 2, background: t.bdr, position: "relative" }}>
                        <div style={{
                          position: "absolute", top: "50%", left: `${(val / max) * 100}%`,
                          width: 9, height: 9, borderRadius: "50%",
                          background: t.wine, border: `2px solid ${t.card}`,
                          transform: "translate(-50%, -50%)",
                          boxShadow: `0 0 0 1px ${t.wine}40`,
                        }} />
                      </div>
                      <span style={{ fontSize: 10, color: t.txL, width: 40, flexShrink: 0 }}>{hi}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price drop info */}
          {p.launch_price && p.price_vs_launch_pct > 0 && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: t.dealL, marginBottom: 14, fontSize: 13, color: t.deal, lineHeight: 1.5 }}>
              Lanserades för <strong>{p.launch_price} kr</strong> — nu {p.price} kr. Du sparar {p.launch_price - p.price} kr per flaska.
            </div>
          )}

          {/* Score explanation */}
          <div style={{ padding: "10px 14px", borderRadius: 10, background: t.bg, marginBottom: 0, fontSize: 12, color: t.txM, lineHeight: 1.6 }}>
            <strong style={{ color: t.tx }}>Smakfynd-poäng {s100}/100:</strong>{" "}
            {[
              p.crowd_score && `Crowd ${p.crowd_score.toFixed(1)}/10`,
              p.expert_score && `Expert ${p.expert_score.toFixed(1)}/10`,
              p.price_score && `Pris ${p.price_score.toFixed(1)}/10`,
            ].filter(Boolean).join(" · ")}
            {" — "}
            {s100 >= 90
              ? "Fantastiskt fynd. Höga betyg till klart lägre pris än snittet."
              : s100 >= 75
              ? "Utmärkt värde. Starka betyg relativt priset."
              : s100 >= 60
              ? "Bra fynd i sin prisklass."
              : "Godkänt men inte bland de bästa fynden."
            }
            {p.confidence && <span style={{ marginLeft: 6, fontSize: 10, color: t.txL }}>(Konfidens: {p.confidence})</span>}
          </div>
        </div>
      )}
    </div>
  );
}

const WINE_AI_URL = "https://smakfynd-wine-ai.smakfynd.workers.dev";

function matchWinesForCourses(courses, products) {
  if (!courses || !courses.length) return [];
  const bodyRange = { light: [0, 4], medium: [5, 8], full: [9, 12] };
  const priceTiers = [[0, 110, "Budget"], [110, 200, "Mellan"], [200, 99999, "Fint"]];
  const tierColors = { "Budget": "#5a8a5a", "Mellan": "#7a6a4a", "Fint": "#8a5a6a" };
  const usedNrs = new Set();

  return courses.map(course => {
    const wines = [];
    for (const c of (course.criteria || [])) {
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
          return { ...p, _fit: fit, _why: c.why };
        })
        .filter(p => p._fit >= 2)
        .sort((a, b) => (b._fit * 10 + b.smakfynd_score) - (a._fit * 10 + a.smakfynd_score));

      for (const [lo, hi, tierLabel] of priceTiers) {
        const pick = scored.find(p => p.price >= lo && p.price < hi && !usedNrs.has(p.nr));
        if (pick) {
          usedNrs.add(pick.nr);
          wines.push({ ...pick, _tier: tierLabel, _tierCol: tierColors[tierLabel] });
        }
      }
    }
    return { dish: course.dish, wines };
  }).filter(c => c.wines.length > 0);

  return results;
}

function WineResult({ m }) {
  const [_lbl, col] = getScoreInfo(m.smakfynd_score);
  return (
    <a href={`https://www.systembolaget.se/produkt/${m.nr}`} target="_blank" rel="noopener noreferrer"
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

  const handleSubmit = async () => {
    if (!meal.trim() || meal.length < 3) return;
    setLoading(true);
    setError(null);
    setAiResult(null);
    setCourseResults([]);

    try {
      let data;
      for (let attempt = 0; attempt < 2; attempt++) {
        const res = await fetch(WINE_AI_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ meal: meal.trim() }),
        });
        data = await res.json();
        if (!data.error) break;
        if (attempt === 0) await new Promise(r => setTimeout(r, 1000));
      }
      if (data.error) throw new Error(data.error);

      setAiResult(data);
      // Support both old (criteria) and new (courses) format
      if (data.courses) {
        setCourseResults(matchWinesForCourses(data.courses, products));
      } else if (data.criteria) {
        setCourseResults(matchWinesForCourses([{ dish: "Hela måltiden", criteria: data.criteria }], products));
      }
    } catch (e) {
      setError("Kunde inte hämta vinförslag just nu. Försök igen.");
    }
    setLoading(false);
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
        <input type="text" value={meal} onChange={e => setMeal(e.target.value)}
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

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
        {["Grillat kött med potatis", "Pasta carbonara", "Sushi och sashimi", "Toast skagen, sedan entrecôte", "Ostbricka med honung"].map(s => (
          <button key={s} onClick={() => setMeal(s)}
            style={{ padding: "4px 10px", borderRadius: 100, border: `1px solid ${t.bdrL}`, background: "transparent", color: t.txL, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
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
          <p style={{ fontSize: 13, color: t.txM, lineHeight: 1.5, margin: "0 0 14px", fontStyle: "italic" }}>
            {aiResult.reasoning}
          </p>

          {courseResults.map((course, ci) => (
            <div key={ci} style={{ marginBottom: ci < courseResults.length - 1 ? 16 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 4, height: 18, borderRadius: 2,
                  background: dishColors[ci % dishColors.length],
                }} />
                <span style={{
                  fontSize: 13, fontWeight: 600, color: dishColors[ci % dishColors.length],
                  fontFamily: "'Instrument Serif', Georgia, serif",
                }}>{course.dish}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingLeft: 12 }}>
                {course.wines.map((m, i) => <WineResult key={i} m={m} />)}
              </div>
            </div>
          ))}

          {courseResults.length === 0 && <p style={{ fontSize: 12, color: t.txL }}>Hittade inga matchningar i fast sortiment. Prova en annan beskrivning.</p>}
        </div>
      )}
    </div>
  );
}

function AgeGate({ onConfirm }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#f5f1eb", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', -apple-system, sans-serif", padding: 20,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🍷</div>
        <h1 style={{ margin: "0 0 8px", fontSize: 28, fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, color: "#2d2520" }}>Smakfynd</h1>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "#8a7e72", lineHeight: 1.6 }}>
          Den här sidan innehåller information om alkoholhaltiga drycker och riktar sig till personer som fyllt 25 år.
        </p>
        <button onClick={onConfirm} style={{
          padding: "14px 36px", borderRadius: 14, border: "none", cursor: "pointer",
          background: "#6b2a3a", color: "#fff", fontSize: 15, fontWeight: 600,
          fontFamily: "inherit", transition: "opacity 0.2s", marginBottom: 12,
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >Ja, jag är över 25</button>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#b0a898" }}>
          Genom att gå vidare bekräftar du att du är minst 25 år.
        </p>
        <p style={{ margin: 0, fontSize: 10, color: "#c5bdb3", lineHeight: 1.6 }}>
          Smakfynd är en oberoende informationstjänst från Olav Innovation AB.<br />Ingen koppling till Systembolaget. Vi säljer inte alkohol.
        </p>
      </div>
    </div>
  );
}

function Smakfynd() {
  const [ageOk, setAgeOk] = useState(() => {
    try { return localStorage.getItem("smakfynd_age") === "ok"; } catch(e) { return false; }
  });
  const confirmAge = () => {
    try { localStorage.setItem("smakfynd_age", "ok"); } catch(e) {}
    setAgeOk(true);
  };
  if (!ageOk) return <AgeGate onConfirm={confirmAge} />;

  return <SmakfyndApp />;
}

function SmakfyndApp() {
  const [cat, setCat] = useState("all");
  const [price, setPrice] = useState("all");
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showDeals, setShowDeals] = useState(false);
  const [panel, setPanel] = useState(null);
  const [faqOpen, setFaqOpen] = useState(null);
  const [pkg, setPkg] = useState("Flaska"); // Flaska or BiB
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data from storage or embedded
  useEffect(() => {
    async function loadData() {
      try {
        // Try persistent storage first
        const stored = await window.storage?.get('smakfynd-products');
        if (stored?.value) {
          const parsed = JSON.parse(stored.value);
          setAllData(parsed);
          setLoading(false);
          return;
        }
      } catch(e) {}
      
      // Try fetching from URL
      if (DATA_URL) {
        try {
          const res = await fetch(DATA_URL);
          const data = await res.json();
          setAllData(data);
          setLoading(false);
          return;
        } catch(e) {}
      }
      
      // Fallback to sample data
      setAllData(SAMPLE_PRODUCTS);
      setLoading(false);
    }
    loadData();
  }, []);

  // Map fields from web JSON format to component format
  const products = useMemo(() => {
    return allData.map((p, i) => ({
      ...p,
      id: p.nr || String(i),
      category: p.type || p.category || '',
      smakfynd_score: p.smakfynd_score || (p.score ? rescale(p.score) : 0),
      vivino_rating: p.rating || p.vivino_rating || 0,
      vivino_reviews: p.reviews || p.vivino_reviews || 0,
      style: p.cat3 || p.style || '',
      food_pairings: typeof p.food_pairings === 'string' 
        ? p.food_pairings.split(',').map(s => s.trim()).filter(Boolean)
        : (p.food_pairings || []),
      package: p.pkg || p.package || 'Flaska',
    })).sort((a, b) => b.smakfynd_score - a.smakfynd_score);
  }, [allData]);
  const totalReviews = products.reduce((sum, p) => sum + (p.vivino_reviews || 0), 0);
  const reviewsStr = totalReviews > 1000000 ? `${(totalReviews / 1000000).toFixed(1)}M` : totalReviews > 1000 ? `${Math.round(totalReviews / 1000)}K` : String(totalReviews);
  const countries = [...new Set(products.map(p => p.country).filter(Boolean))].length;

  const [showEco, setShowEco] = useState(false);
  const [showBest, setShowBest] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selCountry, setSelCountry] = useState(null);
  const [selFoods, setSelFoods] = useState([]);

  const toggleFood = (f) => setSelFoods(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const filtered = useMemo(() => {
    let r = [...products];
    if (!showBest) r = r.filter(p => p.assortment === "Fast sortiment");
    r = r.filter(p => p.package === pkg);
    if (cat !== "all") r = r.filter(p => p.category === cat);
    if (price !== "all") { const [a, b] = price.split("-").map(Number); r = r.filter(p => p.price >= a && p.price <= b); }
    if (search) { const q = search.toLowerCase(); r = r.filter(p => [p.name, p.sub, p.country, p.grape, p.style, p.organic ? "eko ekologisk organic" : ""].some(f => (f || "").toLowerCase().includes(q))); }
    if (showNew) r = r.filter(p => p.is_new);
    if (showDeals) r = r.filter(p => p.price_vs_launch_pct > 0);
    if (showEco) r = r.filter(p => p.organic);
    if (selCountry) r = r.filter(p => p.country === selCountry);
    if (selFoods.length > 0) r = r.filter(p => selFoods.some(f => (p.food_pairings || []).some(fp => fp.toLowerCase().includes(f.toLowerCase()))));
    return r;
  }, [products, cat, price, search, showNew, showDeals, pkg, showEco, showBest, selCountry, selFoods]);

  const newN = products.filter(p => p.is_new).length;
  const dealN = products.filter(p => p.price_vs_launch_pct > 0).length;
  const ecoN = products.filter(p => p.organic).length;
  const hasFilters = search || cat !== "all" || price !== "all" || showNew || showDeals || showEco || selCountry || selFoods.length > 0;

  const clearAll = () => { setSearch(""); setCat("all"); setPrice("all"); setShowNew(false); setShowDeals(false); setShowEco(false); setSelCountry(null); setSelFoods([]); setShowBest(false); };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.96) } to { opacity:1; transform:scale(1) } }
        ::selection { background: ${t.wine}22 }
        input::placeholder { color: ${t.txF} }
        *::-webkit-scrollbar { display: none }
        * { scrollbar-width: none }
      `}</style>

      {/* ═══ HERO ═══ */}
      <header style={{ padding: "44px 20px 0", maxWidth: 580, margin: "0 auto", textAlign: "center", animation: "fadeIn 0.6s ease" }}>
        {/* Logo */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: "#fff", fontWeight: 700, fontFamily: "'Instrument Serif', serif",
            boxShadow: `0 2px 8px ${t.wine}30`,
          }}>S</div>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.wine, letterSpacing: "0.16em", textTransform: "uppercase" }}>Smakfynd</span>
        </div>

        {/* Headline */}
        <h1 style={{
          margin: "0 0 12px", fontSize: 36, lineHeight: 1.1,
          fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, color: t.tx,
        }}>
          Smartare vinval<br />på <em style={{ color: t.wine }}>Systembolaget</em>
        </h1>

        <p style={{
          margin: "0 auto 28px", fontSize: 15, color: t.txM, lineHeight: 1.6,
          maxWidth: 400, fontWeight: 300,
        }}>
          Varje produkt rankad efter kvalitet i förhållande till pris — baserat på crowd-betyg, expertrecensioner och prisjämförelse.
        </p>

        {/* Stats */}
        <div style={{
          display: "inline-flex", gap: 0, borderRadius: 14, overflow: "hidden",
          border: `1px solid ${t.bdr}`, background: t.card, marginBottom: 20,
        }}>
          {[
            [products.length, "produkter"],
            [reviewsStr, "omdömen"],
            [countries, "länder"],
          ].map(([val, label], i) => (
            <div key={i} style={{
              padding: "14px 24px", textAlign: "center",
              borderLeft: i > 0 ? `1px solid ${t.bdr}` : "none",
            }}>
              <div style={{ fontSize: 22, fontWeight: 400, color: t.tx, fontFamily: "'Instrument Serif', serif", lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: 10, color: t.txL, marginTop: 3, letterSpacing: "0.04em" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Nav links */}
        <div style={{ display: "flex", justifyContent: "center", gap: 20, fontSize: 13, color: t.txL, marginBottom: 6 }}>
          {[["about", "Om Smakfynd"], ["method", "Metoden"], ["faq", "Vanliga frågor"]].map(([k, l]) => (
            <span key={k} onClick={() => setPanel(panel === k ? null : k)}
              style={{ cursor: "pointer", borderBottom: panel === k ? `1.5px solid ${t.wine}` : "1.5px solid transparent", paddingBottom: 2, transition: "all 0.2s", color: panel === k ? t.wine : t.txL }}
            >{l}</span>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 580, margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* ═══ PANELS ═══ */}
        {panel === "about" && (
          <div style={{ padding: 22, borderRadius: 16, background: t.card, border: `1px solid ${t.bdr}`, marginBottom: 20, animation: "scaleIn 0.25s ease" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 22, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>Om Smakfynd</h2>
            <p style={{ fontSize: 14, color: t.txM, lineHeight: 1.7, margin: "0 0 12px" }}>
              Smakfynd är en oberoende tjänst som hjälper dig hitta de bästa vinfynden på Systembolaget — oavsett budget. Vi rankar <strong>{products.length} viner</strong> baserat på crowd-betyg, expertrecensioner och prisvärde.
            </p>
            <p style={{ fontSize: 14, color: t.txM, lineHeight: 1.7, margin: "0 0 14px" }}>
              Röda viner jämförs med röda viner, inte med öl. Du hittar det bästa valet oavsett budget.
            </p>
            <div style={{ padding: 16, borderRadius: 12, background: t.bg, marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontFamily: "'Instrument Serif', serif", color: t.tx, marginBottom: 4 }}>Gabriel Linton, grundare</div>
              <p style={{ fontSize: 13, color: t.txM, lineHeight: 1.6, margin: 0 }}>
                Utbildad i dryckeskunskap vid Restaurang- och hotellhögskolan i Grythyttan (Örebro universitet). Regelbunden besökare av vingårdar i Italien och resten av Sydeuropa. Smakfynd föddes ur frustrationen att behöva gissa sig fram på Systembolaget — och insikten att datan redan fanns, men att ingen kopplat ihop den åt konsumenten.
              </p>
            </div>
            <p style={{ fontSize: 12, color: t.txL, margin: 0 }}>Olav Innovation AB · Ingen alkoholförsäljning · Inget samarbete med Systembolaget</p>
            <button onClick={() => setPanel(null)} style={{ marginTop: 12, fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Stäng</button>
          </div>
        )}

        {panel === "method" && (
          <div style={{ padding: 22, borderRadius: 16, background: t.card, border: `1px solid ${t.bdr}`, marginBottom: 20, animation: "scaleIn 0.25s ease" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 22, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>Så beräknas poängen</h2>
            <div style={{ padding: 14, borderRadius: 10, background: t.bg, fontFamily: "'DM Mono', monospace", fontSize: 12, color: t.tx, lineHeight: 1.9, marginBottom: 14, border: `1px solid ${t.bdrL}` }}>
              <div><strong>Smakfynd-poäng</strong> = Kvalitet ÷ Relativt pris</div>
              <div style={{ marginTop: 4, opacity: 0.7 }}>Kvalitet = betyg × (0.55 + 0.45 × min(omdömen / 15000, 1))</div>
              <div style={{ opacity: 0.7 }}>Relativt pris = literpris ÷ medianpris i kategorin</div>
            </div>
            <p style={{ fontSize: 14, color: t.txM, lineHeight: 1.7, margin: "0 0 8px" }}>
              <strong>Kvalitet</strong> baseras på crowd-betyg viktat mot antal omdömen — fler röster ger högre tillförlitlighet.
            </p>
            <p style={{ fontSize: 14, color: t.txM, lineHeight: 1.7, margin: "0 0 8px" }}>
              <strong>Relativt pris</strong> jämför mot medianen i samma kategori. Ett rött vin jämförs mot andra röda viner, inte mot öl.
            </p>
            <p style={{ fontSize: 14, color: t.txM, lineHeight: 1.7, margin: 0 }}>
              <strong>Resultat:</strong> Högt betyg + lägre pris = hög poäng. Lågt betyg = alltid låg poäng oavsett pris.
            </p>
            <button onClick={() => setPanel(null)} style={{ marginTop: 12, fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Stäng</button>
          </div>
        )}

        {panel === "faq" && (
          <div style={{ marginBottom: 20, animation: "scaleIn 0.25s ease" }}>
            {FAQS.map((f, i) => (
              <div key={i} onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                style={{
                  padding: "14px 18px",
                  borderRadius: i === 0 ? "16px 16px 0 0" : i === FAQS.length - 1 ? "0 0 16px 16px" : 0,
                  background: t.card, border: `1px solid ${t.bdr}`,
                  borderTop: i > 0 ? "none" : undefined, cursor: "pointer",
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: t.tx }}>{f.q}</span>
                  <span style={{ color: t.txL, fontSize: 16, transition: "transform 0.2s", transform: faqOpen === i ? "rotate(45deg)" : "none" }}>+</span>
                </div>
                {faqOpen === i && <p style={{ fontSize: 13, color: t.txM, margin: "10px 0 0", lineHeight: 1.65 }}>{f.a}</p>}
              </div>
            ))}
            <button onClick={() => setPanel(null)} style={{ marginTop: 10, fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Stäng</button>
          </div>
        )}

        {/* ═══ FOOD MATCH ═══ */}
        <FoodMatch products={products} />

        {/* ═══ GABRIELS VAL ═══ */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>Gabriels val</h2>
            <span style={{ fontSize: 12, color: t.txL }}>mars 2026</span>
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
            {GABRIELS_PICKS.map((pick, i) => (
              <div key={i} style={{
                minWidth: 260, maxWidth: 280, padding: 18, borderRadius: 16,
                background: t.card, border: `1px solid ${t.bdr}`,
                flexShrink: 0, display: "flex", flexDirection: "column", gap: 8,
                animation: `slideUp 0.4s ease ${0.1 + i * 0.08}s both`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 16, fontFamily: "'Instrument Serif', serif", color: t.tx, lineHeight: 1.2 }}>{pick.name}</div>
                    <div style={{ fontSize: 11, color: t.txL, marginTop: 2 }}>{pick.sub}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: t.tx, flexShrink: 0 }}>{pick.price}</div>
                </div>
                <p style={{ fontSize: 13, color: t.txM, lineHeight: 1.55, margin: 0, fontStyle: "italic", flex: 1 }}>
                  &ldquo;{pick.note}&rdquo;
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px solid ${t.bdrL}`, gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: t.green }}>{pick.smakfynd_score}/100</span>
                  <a href={`https://www.systembolaget.se/produkt/${pick.nr}`} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "5px 12px", borderRadius: 8,
                      background: t.tx, color: "#faf6f0",
                      fontSize: 11, fontWeight: 600, textDecoration: "none",
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  >Systembolaget ↗</a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ SEARCH ═══ */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <input type="text" placeholder="Sök vin, druva, land, stil..." value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "14px 16px 14px 42px", borderRadius: 14,
              border: `1px solid ${t.bdr}`, background: t.card, fontSize: 14,
              color: t.tx, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={e => { e.target.style.borderColor = t.wine + "40"; e.target.style.boxShadow = `0 0 0 3px ${t.wine}08`; }}
            onBlur={e => { e.target.style.borderColor = t.bdr; e.target.style.boxShadow = "none"; }}
          />
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: t.txL, pointerEvents: "none" }}>⌕</span>
        </div>

        {/* ═══ PACKAGE TOGGLE ═══ */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 4, background: t.bdrL, borderRadius: 100, padding: 3, width: "fit-content" }}>
            {[["Flaska", "🍾 Flaskor"], ["BiB", "📦 Bag-in-box"], ["Stor", "🧴 Storpack"]].map(([k, l]) => (
              <button key={k} onClick={() => setPkg(k)} style={{
                padding: "7px 16px", borderRadius: 100, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: pkg === k ? 600 : 400, fontFamily: "inherit",
                background: pkg === k ? t.card : "transparent",
                color: pkg === k ? t.tx : t.txL,
                boxShadow: pkg === k ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s",
              }}>{l}</button>
            ))}
          </div>
        </div>

        {/* ═══ CATEGORY PILLS ═══ */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
          {CATS.map(ct => (
            <button key={ct.k} onClick={() => setCat(ct.k)} style={{
              ...pill(cat === ct.k),
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ fontSize: 14 }}>{ct.i}</span> {ct.l}
            </button>
          ))}
        </div>

        {/* ═══ PRICE PILLS ═══ */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {[["0-99", "Under 100 kr"], ["100-150", "100–150 kr"], ["151-200", "150–200 kr"], ["201-9999", "200+ kr"]].map(([k, l]) => (
            <button key={k} onClick={() => setPrice(price === k ? "all" : k)} style={pill(price === k)}>{l}</button>
          ))}
        </div>

        {/* ═══ ADVANCED TOGGLE ═══ */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
          <button onClick={() => setShowAdvanced(!showAdvanced)}
            style={{ ...pill(showAdvanced), display: "flex", alignItems: "center", gap: 4 }}>
            Fler filter <span style={{ fontSize: 10, transition: "transform 0.2s", display: "inline-block", transform: showAdvanced ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
          </button>
          {hasFilters && (
            <button onClick={clearAll}
              style={{ padding: "8px 14px", borderRadius: 100, border: `1px solid ${t.bdr}`, background: "transparent", color: t.txL, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              Rensa filter ✕
            </button>
          )}
        </div>

        {showAdvanced && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, padding: "14px 16px", borderRadius: 14, background: t.card, border: `1px solid ${t.bdrL}` }}>
            {/* Tags row */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => setShowEco(!showEco)} style={pill(showEco, t.green)}>Eko</button>
              <button onClick={() => { setShowNew(!showNew); if (!showNew) setShowDeals(false); }} style={pill(showNew)}>Nyheter</button>
              <button onClick={() => { setShowDeals(!showDeals); if (!showDeals) setShowNew(false); }} style={pill(showDeals, t.deal)}>Prissänkt</button>
              <button onClick={() => setShowBest(!showBest)} style={pill(showBest)}>Beställning</button>
            </div>
            {/* Country */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Land</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  ["Italien", "\ud83c\uddee\ud83c\uddf9"], ["Frankrike", "\ud83c\uddeb\ud83c\uddf7"], ["Spanien", "\ud83c\uddea\ud83c\uddf8"],
                  ["USA", "\ud83c\uddfa\ud83c\uddf8"], ["Tyskland", "\ud83c\udde9\ud83c\uddea"], ["Sydafrika", "\ud83c\uddff\ud83c\udde6"],
                  ["Chile", "\ud83c\udde8\ud83c\uddf1"], ["Portugal", "\ud83c\uddf5\ud83c\uddf9"], ["Australien", "\ud83c\udde6\ud83c\uddfa"],
                ].map(([c, flag]) => (
                  <button key={c} onClick={() => setSelCountry(selCountry === c ? null : c)} style={pill(selCountry === c)}>{flag} {c}</button>
                ))}
              </div>
            </div>
            {/* Food */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Passar till</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Kött", "Fågel", "Fisk", "Skaldjur", "Fläsk", "Grönsaker", "Ost", "Vilt"].map(f => (
                  <button key={f} onClick={() => toggleFood(f)} style={pill(selFoods.includes(f))}>{f}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ RESULTS ═══ */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, padding: "0 4px" }}>
          <span style={{ fontSize: 13, color: t.txL }}>{loading ? "Laddar..." : `${filtered.length} produkter`}</span>
          <span style={{ fontSize: 11, color: t.txF }}>Sorterat efter Smakfynd-poäng</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: t.txL }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            <p style={{ fontSize: 15, color: t.txM }}>Laddar {products.length > 0 ? products.length : ''} produkter...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: t.txL }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>🔍</div>
            <p style={{ fontSize: 17, fontFamily: "'Instrument Serif', serif", fontStyle: "italic", color: t.txM }}>Inga produkter matchade din sökning.</p>
            <button onClick={clearAll}
              style={{ marginTop: 10, fontSize: 13, color: t.wine, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              Visa alla produkter
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.slice(0, 50).map((p, i) => <Card key={p.id || i} p={p} rank={i + 1} delay={Math.min(i * 0.04, 0.4)} />)}
            {filtered.length > 50 && (
              <div style={{ textAlign: "center", padding: 20, color: t.txL, fontSize: 13 }}>
                Visar topp 50 av {filtered.length}. Använd filter för att hitta fler.
              </div>
            )}
          </div>
        )}

        {/* ═══ NEWSLETTER ═══ */}
        <div style={{
          marginTop: 40, padding: "28px 24px", borderRadius: 18,
          background: t.card, border: `1px solid ${t.bdr}`,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: t.wine, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>Nyhetsbrev</div>
          <h3 style={{ margin: "0 0 6px", fontSize: 22, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>Veckans bästa köp</h3>
          <p style={{ fontSize: 13, color: t.txM, margin: "0 0 16px", lineHeight: 1.5 }}>Smartaste vinvalen direkt i inkorgen — varje torsdag.</p>
          <div style={{ display: "flex", gap: 8, maxWidth: 380, margin: "0 auto" }}>
            <input type="email" placeholder="din@email.se"
              style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: `1px solid ${t.bdr}`, background: t.bg, fontSize: 14, color: t.tx, outline: "none" }} />
            <button style={{
              padding: "12px 20px", borderRadius: 12, border: "none", cursor: "pointer",
              background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`,
              color: "#fff", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
              boxShadow: `0 2px 8px ${t.wine}25`, transition: "opacity 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >Prenumerera</button>
          </div>
          <p style={{ fontSize: 11, color: t.txL, margin: "10px 0 0" }}>Gratis. Avsluta när du vill.</p>
        </div>

        {/* ═══ FOOTER ═══ */}
        <footer style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${t.bdr}`, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: t.txL, lineHeight: 1.8 }}>
            <p style={{ margin: "0 0 8px" }}>
              Smakfynd hjälper dig hitta vinet som ger mest smak för pengarna.<br />
              Hela Systembolagets sortiment, rankat efter kvalitet per krona.
            </p>
            <p style={{ margin: "0 0 10px", color: t.txM }}>
              Skapad av <strong>Gabriel Linton</strong> · Dryckeskunskap, Grythyttan · <strong>Olav Innovation AB</strong>
            </p>
          </div>
          <div style={{ fontSize: 10, color: t.txF, margin: "0 0 10px", lineHeight: 1.7 }}>
            <p style={{ margin: "0 0 4px" }}>Produktdata från Systembolagets öppna sortiment · Uppdaterad mars 2026</p>
            <p style={{ margin: 0 }}>Smakfynd är en oberoende tjänst och har ingen koppling till, och är inte godkänd av, Systembolaget. Vi säljer inte alkohol. Alla köp sker via Systembolaget.se.</p>
          </div>
          <p style={{ fontSize: 10, color: t.txF, fontStyle: "italic" }}>Njut med måtta.</p>
        </footer>
      </div>
    </div>
  );
}
