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
  {name:"Delas Saint-Esprit",sub:"Syrah & Grenache · Côtes du Rhône",price:"129 kr",score:14.2,nr:"2174",note:"Delas tillhör Rhônedalens finaste producenter, men det här är deras vardagsvin — och det märks inte. Svartpeppar, violer och mörka bär med en generositet som får det att kännas som ett vin i en helt annan prisklass. Servera till lördagsbiffen eller en mustig gryta."},
  {name:"Umani Ronchi Montepulciano",sub:"Montepulciano · Abruzzo",price:"89 kr",score:16.8,nr:"77130",note:"Har funnits på Systembolaget i 25 år av en anledning. Solmogna plommon, tranbär och en jordighet som gör den till en naturlig partner till pizza och pasta. Inte flashig — bara pålitligt bra, varje gång. Italiens svar på husvin."},
  {name:"Mezzacorona Pinot Nero",sub:"Pinot Nero · Trentino",price:"89 kr",score:15.4,nr:"1368",note:"Pinot noir för under 90 kronor som faktiskt levererar druvans karaktär — det är ovanligt. Friska hallon, körsbär och en fin örtighet från Alpernas fot. Servera lätt sval till charkbrickan eller en enklare fiskrätt. Mitt mars-tips för den som vill utforska."},
];

const FOOD_TIPS = [
  {m:"pasta",w:"Palazzo del Mare, Primitivo — 89 kr",s:"14.5"},
  {m:"lax",w:"Oyster Bay, Sauvignon Blanc — 109 kr",s:"12.4"},
  {m:"pizza",w:"Fantini, Montepulciano — 89 kr",s:"12.8"},
  {m:"grillat",w:"Borsao, Selección Tinto — 69 kr",s:"18.7"},
  {m:"fisk",w:"Torres, Viña Sol — 79 kr",s:"16.3"},
  {m:"kyckling",w:"Cono Sur, Pinot Noir — 79 kr",s:"14.8"},
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
  const s100 = p.smakfynd_score;
  const [label, col] = getScoreInfo(s100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <MiniBar label="Crowd" value={p.crowd_score} color="#6b8cce" />
      <MiniBar label="Expert" value={p.expert_score} color="#b07d3b" />
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
        <span style={{ fontSize: 10, color: col, width: 52, flexShrink: 0, textAlign: "right", fontWeight: 800 }}>Smakfynd</span>
        <div style={{ flex: 1, height: 7, borderRadius: 4, background: t.bdr, overflow: "hidden" }}>
          <div style={{ width: `${s100}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${col}99, ${col})`, transition: "width 0.8s ease" }} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 900, color: col, minWidth: 32, textAlign: "right", fontFamily: "'Instrument Serif', Georgia, serif" }}>{s100}</span>
      </div>
      <div style={{ textAlign: "right", fontSize: 9, color: t.txL, marginTop: 1 }}>Kvalitet + Prisvärde</div>
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
            <div style={{ minWidth: 0 }}>
              <h3 style={{
                margin: 0, fontSize: 17, fontFamily: "'Instrument Serif', Georgia, serif",
                fontWeight: 400, color: t.tx, lineHeight: 1.2,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{p.name}</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: t.txL, letterSpacing: "0.01em" }}>
                {p.sub} · {p.country}{p.region ? `, ${p.region}` : ""}
              </p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: t.tx, lineHeight: 1, fontFamily: "'Instrument Serif', Georgia, serif" }}>
                {p.price}<span style={{ fontSize: 12, fontWeight: 400, color: t.txL, marginLeft: 1 }}>kr</span>
              </div>
              {p.launch_price && p.price_vs_launch_pct > 0 && (
                <span style={{ fontSize: 10, color: t.deal, fontWeight: 600 }}>
                  <span style={{ textDecoration: "line-through", opacity: 0.5 }}>{p.launch_price}</span> −{p.price_vs_launch_pct}%
                </span>
              )}
            </div>
          </div>

          {/* Quick info row — always visible: grape + food */}
          <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {p.grape && <span style={{ fontSize: 11, color: t.txM }}>{p.grape}</span>}
            {p.grape && foodStr && <span style={{ color: t.bdr }}>·</span>}
            {foodStr && <span style={{ fontSize: 11, color: t.txL }}>Passar till {foodStr}</span>}
          </div>

          {/* Score + meta row */}
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
          Köp på Systembolaget
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

function FoodMatch({ products }) {
  const [q, setQ] = useState("");
  
  // Search real product data by food_pairings field
  const matches = useMemo(() => {
    if (q.length < 2) return [];
    const query = q.toLowerCase();
    const foodMap = { "kött": "kött", "nöt": "nöt", "lamm": "lamm", "fläsk": "fläsk", "kyckling": "kyckling", "fågel": "fågel",
      "fisk": "fisk", "lax": "fisk", "torsk": "fisk", "skaldjur": "skaldjur", "räkor": "skaldjur",
      "pasta": "pasta", "pizza": "pizza", "grillat": "grillat", "bbq": "grillat",
      "ost": "ost", "sallad": "sallad", "vilt": "vilt", "dessert": "dessert", "choklad": "dessert",
      "asiatiskt": "asiatiskt", "sushi": "fisk", "thai": "asiatiskt", "indiskt": "asiatiskt" };
    const mapped = foodMap[query] || query;
    
    return products
      .filter(p => {
        const fp = (p.food_pairings || []);
        const fpStr = Array.isArray(fp) ? fp.join(' ').toLowerCase() : String(fp).toLowerCase();
        return fpStr.includes(mapped) && p.package === 'Flaska';
      })
      .sort((a, b) => b.smakfynd_score - a.smakfynd_score)
      .slice(0, 3);
  }, [q, products]);

  return (
    <div style={{ padding: "20px 22px", borderRadius: 16, background: t.surface, border: `1px solid ${t.bdr}`, marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>🍽</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 400, fontFamily: "'Instrument Serif', Georgia, serif", color: t.tx }}>Kvällens middag?</div>
          <div style={{ fontSize: 12, color: t.txL }}>Berätta vad du äter — vi föreslår vinet.</div>
        </div>
      </div>
      <input type="text" placeholder="T.ex. pasta, grillat, lax, pizza, ost..." value={q} onChange={e => setQ(e.target.value)}
        style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `1px solid ${t.bdr}`, background: t.card, fontSize: 14, color: t.tx, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
        onFocus={e => e.target.style.borderColor = t.wine + "55"}
        onBlur={e => e.target.style.borderColor = t.bdr}
      />
      {matches.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {matches.map((m, i) => (
            <a key={i} href={`https://www.systembolaget.se/produkt/${m.nr}`} target="_blank" rel="noopener noreferrer"
              style={{ padding: "10px 14px", borderRadius: 10, background: t.card, border: `1px solid ${t.bdrL}`, textDecoration: "none", display: "block", transition: "border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = t.wine + "40"}
              onMouseLeave={e => e.currentTarget.style.borderColor = t.bdrL}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontFamily: "'Instrument Serif', Georgia, serif", color: t.tx }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: t.txL }}>{m.sub} · {m.country}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: t.tx }}>{m.price} kr</div>
                  <div style={{ fontSize: 11, color: t.green, fontWeight: 600 }}>{rescale(m.smakfynd_score)}/100</div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
      {q.length >= 2 && matches.length === 0 && <p style={{ marginTop: 8, fontSize: 12, color: t.txL, fontStyle: "italic" }}>Inga viner matchade "{q}". Prova: pasta, lax, grillat, pizza, fisk, kyckling, ost, skaldjur</p>}
    </div>
  );
}

function Smakfynd() {
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
  const [assortment, setAssortment] = useState("fast");
  const [selCountry, setSelCountry] = useState(null);
  const [selFoods, setSelFoods] = useState([]);

  const toggleFood = (f) => setSelFoods(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const filtered = useMemo(() => {
    let r = [...products];
    if (assortment === "fast") r = r.filter(p => p.assortment === "Fast sortiment");
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
  }, [products, cat, price, search, showNew, showDeals, pkg, showEco, assortment, selCountry, selFoods]);

  const newN = products.filter(p => p.is_new).length;
  const dealN = products.filter(p => p.price_vs_launch_pct > 0).length;
  const ecoN = products.filter(p => p.organic).length;
  const hasFilters = search || cat !== "all" || price !== "all" || showNew || showDeals || showEco || selCountry || selFoods.length > 0;

  const clearAll = () => { setSearch(""); setCat("all"); setPrice("all"); setShowNew(false); setShowDeals(false); setShowEco(false); setSelCountry(null); setSelFoods([]); };

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
                  <span style={{ fontSize: 12, fontWeight: 600, color: t.green }}>{rescale(pick.score)}/100</span>
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
                  >Köp på SB ↗</a>
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
          <div style={{ display: "flex", gap: 4, background: t.bdrL, borderRadius: 100, padding: 3, width: "fit-content" }}>
            {[["fast", "Fast sortiment"], ["all", "Alla"]].map(([k, l]) => (
              <button key={k} onClick={() => setAssortment(k)} style={{
                padding: "7px 14px", borderRadius: 100, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: assortment === k ? 600 : 400, fontFamily: "inherit",
                background: assortment === k ? t.card : "transparent",
                color: assortment === k ? t.tx : t.txL,
                boxShadow: assortment === k ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
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
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {[["0-99", "Under 100"], ["100-150", "100–150"], ["151-200", "150–200"], ["201-9999", "200+"]].map(([k, l]) => (
            <button key={k} onClick={() => setPrice(price === k ? "all" : k)} style={pill(price === k)}>{l} kr</button>
          ))}
          <button onClick={() => { setShowDeals(!showDeals); if (!showDeals) setShowNew(false); }} style={pill(showDeals, t.deal)}>
            Prissänkt <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 100, background: showDeals ? t.deal : t.bdr, color: showDeals ? "#fff" : t.txL, marginLeft: 2 }}>{dealN}</span>
          </button>
          <button onClick={() => setShowEco(!showEco)} style={pill(showEco, t.green)}>Eko</button>
          <button onClick={() => { setShowNew(!showNew); if (!showNew) setShowDeals(false); }} style={pill(showNew)}>Nyheter</button>
        </div>

        {/* ═══ COUNTRY PILLS ═══ */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {[
            ["Italien", "\ud83c\uddee\ud83c\uddf9"], ["Frankrike", "\ud83c\uddeb\ud83c\uddf7"], ["Spanien", "\ud83c\uddea\ud83c\uddf8"],
            ["USA", "\ud83c\uddfa\ud83c\uddf8"], ["Tyskland", "\ud83c\udde9\ud83c\uddea"], ["Sydafrika", "\ud83c\uddff\ud83c\udde6"],
            ["Chile", "\ud83c\udde8\ud83c\uddf1"], ["Portugal", "\ud83c\uddf5\ud83c\uddf9"], ["Australien", "\ud83c\udde6\ud83c\uddfa"],
          ].map(([c, flag]) => (
            <button key={c} onClick={() => setSelCountry(selCountry === c ? null : c)} style={pill(selCountry === c)}>{flag} {c}</button>
          ))}
        </div>

        {/* ═══ FOOD PILLS ═══ */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {["Kött", "Fågel", "Fisk", "Skaldjur", "Fläsk", "Grönsaker", "Ost", "Vilt"].map(f => (
            <button key={f} onClick={() => toggleFood(f)} style={pill(selFoods.includes(f))}>{f}</button>
          ))}
        </div>

        {/* ═══ CLEAR FILTERS ═══ */}
        {hasFilters && (
          <div style={{ marginBottom: 16 }}>
            <button onClick={clearAll}
              style={{ padding: "8px 16px", borderRadius: 100, border: `1px solid ${t.bdr}`, background: "transparent", color: t.txL, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              Rensa filter ✕
            </button>
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
            <button onClick={() => { setSearch(""); setCat("all"); setPrice("all"); setShowNew(false); setShowDeals(false); setShowEco(false); }}
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
          <p style={{ fontSize: 10, color: t.txF, margin: "0 0 10px" }}>Data från Systembolaget · Uppdaterad mars 2026</p>
          <p style={{ fontSize: 10, color: t.txF, fontStyle: "italic" }}>Njut med måtta.</p>
        </footer>
      </div>
    </div>
  );
}
