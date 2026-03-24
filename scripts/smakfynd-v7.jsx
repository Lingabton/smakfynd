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
  {name:"Three Finger Jack",sub:"Cabernet Sauvignon · USA",price:"159 kr",smakfynd_score:75,nr:"352801",
   food:"Grillat kött, burgare, BBQ",
   verdict:"Bäst till grillat",
   note:"Rejäl Cabernet med lite vanilj men utan att det blir för mycket. Funkar utmärkt till hamburgare och grillat kött. Omtyckt av både crowd och experter — och till 159 kr prisvärt för kvaliteten."},
  {name:"Mucho Mas",sub:"Grenache · Spanien",price:"99 kr",smakfynd_score:78,nr:"5234001",
   food:"Pasta, tacos, pizza",
   verdict:"Vardagsfynd under 100 kr",
   note:"Under hundralappen och över 112 000 personer har gett det bra betyg. Funkar till tacos, pasta, eller bara ett glas. Inget fancy — bara pålitligt bra varje gång."},
  {name:"Leitz Eins Zwei Dry",sub:"Riesling · Tyskland",price:"107 kr",smakfynd_score:70,nr:"582201",
   food:"Asiatiskt, fisk, skaldjur",
   verdict:"Underskattat vitt val",
   note:"Fräsch, torr Riesling med äpple och syra. Perfekt till asiatisk mat och fisk. Crowd-betyget är lågt — vi tror Riesling är underskattat i betygsättningen. Värt att testa om du vill prova något nytt."},
];

const FOOD_CATS = [
  { k: "Kött", e: "🥩" }, { k: "Fågel", e: "🍗" }, { k: "Fisk", e: "🐟" },
  { k: "Skaldjur", e: "🦐" }, { k: "Fläsk", e: "🥓" }, { k: "Grönsaker", e: "🥦" },
  { k: "Ost", e: "🧀" }, { k: "Vilt", e: "🦌" }, { k: "Pasta", e: "🍝" },
];

const FAQS = [
  {q:"Hur beräknas Smakfynd-poängen?",a:"Varje vin bedöms på tre saker: crowd-betyg (vad vanliga människor tycker), expertrecensioner (vinkritiker som James Suckling, Decanter m.fl.) och prisvärde (hur priset förhåller sig till andra viner i samma kategori). Kvalitet väger 75%, prisvärde 25%. Poängen visas på en skala 1–100."},
  {q:"Var kommer betygen ifrån?",a:"Crowd-betyg kommer från hundratusentals vindrickare världen över. Expertbetyg hämtas från erkända vinkritiker som James Suckling, Falstaff, Decanter och Wine Enthusiast. Prisvärdet beräknar vi själva genom att jämföra literpriset mot medianen i samma kategori — rött jämförs med rött, bubbel med bubbel."},
  {q:"Vad betyder Crowd- och Expert-staplarna?",a:"Crowd visar vad vanliga vindrickare tycker (skala 1–10). Expert visar kritikerbetyg (skala 1–10). Om Expert-stapeln saknas betyder det att vi inte hittat kritikerrecensioner för det vinet — men crowd-betyget finns alltid."},
  {q:"Hur fungerar AI-vinmatcharen?",a:"Beskriv vad du ska äta — till exempel 'grillad lax med potatisgratäng' eller 'toast skagen, sedan entrecôte'. Vår AI analyserar måltiden och föreslår viner för varje rätt i olika prisklasser, direkt från Systembolagets sortiment."},
  {q:"Vad betyder prissänkt?",a:"Vi sparar priset varje vecka. När ett vin sänks i pris visar vi det gamla priset överstruket och procentuell sänkning. Systembolaget skyltar inte alltid med prissänkningar — vi håller koll åt dig."},
  {q:"Varför får ekologiska viner bonus?",a:"Vi ger ekologiska viner en liten poängbonus (+0.2 av 10) för att främja hållbarhet. Det räcker inte för att lyfta ett dåligt vin, men vid lika kvalitet vinner det ekologiska alternativet."},
  {q:"Säljer Smakfynd alkohol?",a:"Nej. Smakfynd är en helt oberoende informationstjänst som drivs av Olav Innovation AB. Vi har ingen koppling till Systembolaget. Alla köp gör du via Systembolaget.se."},
  {q:"Hur ofta uppdateras sajten?",a:"Varje vecka. Vi hämtar hela Systembolagets sortiment, uppdaterar betyg och räknar om poängen. Prishistoriken uppdateras samtidigt."},
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
      {p.expert_score && <MiniBar label="Expert" value={p.expert_score} color="#b07d3b" />}
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

// Saved wines hook
function useSaved() {
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem("smakfynd_saved") || "[]"); } catch(e) { return []; }
  });
  const toggle = (nr) => {
    const next = saved.includes(nr) ? saved.filter(x => x !== nr) : [...saved, nr];
    setSaved(next);
    try { localStorage.setItem("smakfynd_saved", JSON.stringify(next)); } catch(e) {}
  };
  return { saved, toggle, isSaved: (nr) => saved.includes(nr), count: saved.length };
}

// Global saved state (shared between components)
const SavedContext = React.createContext(null);

function Card({ p, rank, delay, totalInCategory }) {
  const [open, setOpen] = useState(false);
  const sv = React.useContext(SavedContext);
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
          {/* Row 1: Name + score badge */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
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
            {/* Score badge with overlapping tags */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 12,
                background: `linear-gradient(135deg, ${col}18, ${col}08)`,
                border: `2px solid ${col}30`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: col, lineHeight: 1, fontFamily: "'Instrument Serif', Georgia, serif" }}>{s100}</span>
                <span style={{ fontSize: 6, fontWeight: 700, color: col, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.7 }}>poäng</span>
              </div>
              {/* Overlapping mini-badges */}
              {(p.organic || p.price_vs_launch_pct > 0 || p.is_new) && (
                <div style={{ position: "absolute", top: -6, left: -14, display: "flex", gap: 2 }}>
                  {p.price_vs_launch_pct > 0 && <span style={{ fontSize: 8, fontWeight: 800, padding: "2px 5px", borderRadius: 4, background: t.deal, color: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>−{p.price_vs_launch_pct}%</span>}
                  {p.organic && <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 7px", borderRadius: 5, background: t.green, color: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", letterSpacing: "0.05em" }}>EKO</span>}
                  {p.is_new && <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 4, background: t.wine, color: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>NY</span>}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Price + grape + food */}
          <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: t.tx, fontFamily: "'Instrument Serif', Georgia, serif" }}>{p.price}<span style={{ fontSize: 11, fontWeight: 400, color: t.txL }}>kr</span></span>
            {p.launch_price && p.price_vs_launch_pct > 0 && (
              <span style={{ fontSize: 12, color: t.txL, textDecoration: "line-through" }}>{p.launch_price}kr</span>
            )}
            {(p.grape || foodStr) && <span style={{ color: t.bdr }}>·</span>}
            {p.grape && <span style={{ fontSize: 11, color: t.txM }}>{p.grape}</span>}
            {p.grape && foodStr && <span style={{ color: t.bdr }}>·</span>}
            {foodStr && <span style={{ fontSize: 11, color: t.txL }}>{foodStr}</span>}
          </div>

          {/* Row 3: Crowd/Expert bars */}
          <div style={{ marginTop: 8 }}>
            <ScoreBars p={p} />
          </div>
        </div>
      </div>

      {/* Action row */}
      <div style={{
        padding: "0 18px 12px", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href={sbUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 11, color: t.txM, textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = t.wine}
            onMouseLeave={e => e.currentTarget.style.color = t.txM}
          >
            Systembolaget <span style={{ fontSize: 9 }}>↗</span>
          </a>
          {sv && (
            <button onClick={e => { e.stopPropagation(); sv.toggle(p.nr || p.id); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 12, color: sv.isSaved(p.nr || p.id) ? t.wine : t.txL,
                background: "none", border: "none", cursor: "pointer", padding: "2px 0",
                fontFamily: "inherit", transition: "all 0.2s",
              }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>{sv.isSaved(p.nr || p.id) ? "♥" : "♡"}</span>
              <span style={{ fontWeight: sv.isSaved(p.nr || p.id) ? 600 : 400 }}>{sv.isSaved(p.nr || p.id) ? "I min lista" : "Spara i min lista"}</span>
            </button>
          )}
        </div>
        <span style={{ fontSize: 10, color: t.txF, display: "flex", alignItems: "center", gap: 3 }}>
          {open ? "Stäng ▲" : "Detaljer ▼"}
        </span>
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${t.bdrL}`, paddingTop: 14 }}>
          {/* Badges */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {badge && <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 100, background: rank === 1 ? `linear-gradient(135deg, #b08d40, #d4a84b)` : `${t.wine}15`, color: rank === 1 ? "#fff" : t.wine, textTransform: "uppercase", letterSpacing: "0.08em", boxShadow: rank === 1 ? "0 1px 4px rgba(176,141,64,0.3)" : "none" }}>{rank === 1 ? "🏆 " : ""}{badge}</span>}
            <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: `${col}12`, color: col, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
            {p.confidence === "hög" && <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: t.greenL, color: t.green }}>Hög konfidens</span>}
            {p.price_vs_launch_pct > 0 && <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: t.dealL, color: t.deal, textTransform: "uppercase" }}>Prissänkt −{p.price_vs_launch_pct}%</span>}
            {p.organic && <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: t.greenL, color: t.green }}>Ekologiskt</span>}
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
            {/* Large bottle image */}
            <ProductImage p={p} size={100} style={{ borderRadius: 12, background: "#faf7f2" }} />
            {/* Details grid */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 10 }}>
                {[["Druva", p.grape], ["Stil", p.style], ["Alkohol", p.alc ? `${p.alc}%` : null], ["Volym", `${p.vol} ml`]].filter(([_l, v]) => v).map(([l, v], i) => (
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
  const sv = useSaved();
  const [showSaved, setShowSaved] = useState(false);
  const [cat, setCat] = useState("Rött");
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

  const savedWines = useMemo(() => {
    return products.filter(p => sv.saved.includes(p.nr || p.id)).sort((a, b) => b.smakfynd_score - a.smakfynd_score);
  }, [products, sv.saved]);

  return (
    <SavedContext.Provider value={sv}>
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
          Hitta vinet som ger<br />mest <em style={{ color: t.wine }}>smak för pengarna</em>
        </h1>

        <p style={{
          margin: "0 auto 20px", fontSize: 15, color: t.txM, lineHeight: 1.6,
          maxWidth: 440, fontWeight: 300,
        }}>
          {products.length} viner rankade efter kvalitet per krona — baserat på crowd-betyg, expertrecensioner och prisjämförelse.
        </p>

        {/* Trust module — concrete promises */}
        <div style={{
          padding: "14px 20px", borderRadius: 14,
          border: `1px solid ${t.bdr}`, background: t.card, marginBottom: 20,
          textAlign: "left",
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.tx, marginBottom: 8 }}>Så funkar Smakfynd</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {[
              "Vi jämför bara med liknande viner — rött mot rött, bubbel mot bubbel",
              "Vi väger ihop crowd-betyg, expertrecensioner och prisvärde",
              "Fler omdömen ger säkrare signal — viner med få betyg rankas lägre",
              "Vi säljer inte vin — vi hjälper dig välja bättre",
            ].map((t2, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: t.green, fontSize: 12, lineHeight: 1.5, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 12, color: t.txM, lineHeight: 1.5 }}>{t2}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: "flex", justifyContent: "center", gap: 20, fontSize: 13, color: t.txL, marginBottom: 6 }}>
          {[["about", "Om Smakfynd"], ["method", "Metoden"], ["faq", "Vanliga frågor"], ["saved", `♥ Min lista (${sv.count})`]].map(([k, l]) => (
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
              Smakfynd hjälper dig hitta viner som ger mest smak för pengarna. Vi rankar <strong>{products.length} viner</strong> på Systembolaget genom att kombinera tre datakällor: crowd-betyg från hundratusentals vindrickare, poäng från erkända vinkritiker, och en prisjämförelse mot andra viner i samma kategori.
            </p>
            <p style={{ fontSize: 14, color: t.txM, lineHeight: 1.7, margin: "0 0 14px" }}>
              Resultatet är en enda poäng — <strong>Smakfynd-poängen</strong> — som visar kvalitet per krona. Vi har även en AI-vinmatchare som föreslår viner baserat på vad du ska äta.
            </p>
            <div style={{ padding: 16, borderRadius: 12, background: t.bg, marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontFamily: "'Instrument Serif', serif", color: t.tx, marginBottom: 4 }}>Gabriel Linton, grundare</div>
              <p style={{ fontSize: 13, color: t.txM, lineHeight: 1.6, margin: 0 }}>
                Utbildad i dryckeskunskap vid Restaurang- och hotellhögskolan i Grythyttan (Örebro universitet). Besöker regelbundet vingårdar i Italien och Sydeuropa. Smakfynd föddes ur frustrationen att behöva gissa sig fram bland tusentals viner — och insikten att all data redan fanns, men ingen hade kopplat ihop den åt konsumenten.
              </p>
            </div>
            <p style={{ fontSize: 12, color: t.txL, margin: 0 }}>Olav Innovation AB · Oberoende informationstjänst · Ingen koppling till Systembolaget · Vi säljer inte alkohol</p>
            <button onClick={() => setPanel(null)} style={{ marginTop: 12, fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Stäng</button>
          </div>
        )}

        {panel === "method" && (
          <div style={{ padding: 22, borderRadius: 16, background: t.card, border: `1px solid ${t.bdr}`, marginBottom: 20, animation: "scaleIn 0.25s ease" }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 22, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>Så beräknas poängen</h2>

            {/* The three components */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {[
                ["👥", "Crowd-betyg", "Betyg från hundratusentals vanliga vindrickare. Viner med fler omdömen väger tyngre. Viner med färre än 25 omdömen rankas inte alls."],
                ["🏆", "Expertrecensioner", "Poäng från erkända vinkritiker som James Suckling, Decanter, Falstaff och Wine Enthusiast. Om crowd och experter är överens får vinet en extra bonus."],
                ["💰", "Prisvärde", "Literpriset jämförs mot medianen i samma kategori. Rött jämförs med rött — aldrig med bubbel. Billigare än snittet med samma kvalitet = högre poäng."],
              ].map(([icon, title, desc], i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.tx, marginBottom: 2 }}>{title}</div>
                    <p style={{ fontSize: 13, color: t.txM, lineHeight: 1.6, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: 14, borderRadius: 10, background: t.bg, marginBottom: 16, border: `1px solid ${t.bdrL}` }}>
              <div style={{ fontSize: 13, color: t.tx, lineHeight: 1.7 }}>
                <strong>Kvalitet väger 75%</strong>, prisvärde <strong>25%</strong>. Kvalitet går alltid före pris — ett billigt vin med dåligt betyg kan aldrig hamna högt.
              </div>
            </div>

            {/* Transparency section */}
            <h3 style={{ margin: "0 0 10px", fontSize: 15, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>Transparens</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {[
                ["Datakällor", "Crowd-betyg hämtas från internationella vindrickare. Expertpoäng kommer från Wine Enthusiast (130 000 recensioner) och Wine-Searcher (aggregat från flera kritiker). Prisdata från Systembolaget."],
                ["Osäker matchning", "Vi matchar viner mot kritiker-databaser med namn och region. Ibland blir det fel — vi kräver ordöverlapp och filtrerar bort osäkra matchningar. Viner utan expertmatch rankas bara på crowd + pris."],
                ["Vad poängen inte betyder", "Hög poäng betyder inte att vinet passar just dig — det betyder att det ger bra kvalitet för pengarna enligt crowd och experter. Smak är personligt. Använd smakprofilen och AI-matcharen för att hitta rätt."],
                ["Ekologiskt", "Ekologiska viner får en liten poängbonus (+0.2 av 10). Det räcker inte för att lyfta ett dåligt vin, men vid lika kvalitet vinner eko."],
              ].map(([title, desc], i) => (
                <div key={i}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: t.tx, marginBottom: 2 }}>{title}</div>
                  <p style={{ fontSize: 12, color: t.txM, lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>

            <button onClick={() => setPanel(null)} style={{ marginTop: 4, fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Stäng</button>
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

        {panel === "saved" && (
          <div style={{ padding: 22, borderRadius: 16, background: t.card, border: `1px solid ${t.bdr}`, marginBottom: 20, animation: "scaleIn 0.25s ease" }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 22, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>Sparade viner</h2>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: t.txL }}>Dina favoriter sparas i den här webbläsaren.</p>
            {savedWines.length === 0 ? (
              <p style={{ fontSize: 14, color: t.txM, fontStyle: "italic" }}>Inga sparade viner ännu. Tryck ♡ på ett vin för att spara det.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {savedWines.map((p, i) => <Card key={p.id || i} p={p} rank={i + 1} delay={0} />)}
              </div>
            )}
            <button onClick={() => setPanel(null)} style={{ marginTop: 12, fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Stäng</button>
          </div>
        )}

        {/* ═══ FOOD MATCH ═══ */}
        <FoodMatch products={products} />

        {/* ═══ MÅNADENS TIPS ═══ */}
        {(() => {
          const [tipsOpen, setTipsOpen] = useState(false);
          return (
            <div style={{ marginBottom: 16 }}>
              <button onClick={() => setTipsOpen(!tipsOpen)}
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 12,
                  background: t.card, border: `1px solid ${t.bdr}`,
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>🍷</span>
                  <span style={{ fontSize: 13, color: t.tx }}>
                    <strong style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400 }}>Redaktionens val</strong>
                    <span style={{ color: t.txL }}> — 3 utvalda fynd vi testat och gillar</span>
                  </span>
                </div>
                <span style={{ fontSize: 10, color: t.txL, transition: "transform 0.2s", display: "inline-block", transform: tipsOpen ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
              </button>
              {tipsOpen && (
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 12 }}>
                  {GABRIELS_PICKS.map((pick, i) => {
                    const [_l, col] = getScoreInfo(pick.smakfynd_score);
                    return (
                      <div key={i} style={{
                        padding: "16px 18px", borderRadius: 14,
                        background: t.card, border: `1px solid ${t.bdr}`,
                      }}>
                        {/* Header: score + name + price */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                            background: `${col}12`, border: `2px solid ${col}30`,
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          }}>
                            <span style={{ fontSize: 18, fontWeight: 900, color: col, lineHeight: 1, fontFamily: "'Instrument Serif', Georgia, serif" }}>{pick.smakfynd_score}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 17, fontFamily: "'Instrument Serif', serif", color: t.tx, lineHeight: 1.2 }}>{pick.name}</div>
                            <div style={{ fontSize: 12, color: t.txL, marginTop: 2 }}>{pick.sub}</div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: t.tx, fontFamily: "'Instrument Serif', serif" }}>{pick.price}</div>
                          </div>
                        </div>

                        {/* Verdict badge */}
                        {pick.verdict && (
                          <div style={{ fontSize: 11, fontWeight: 700, color: t.wine, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                            {pick.verdict}
                          </div>
                        )}

                        {/* Note */}
                        <p style={{ fontSize: 14, color: t.txM, lineHeight: 1.65, margin: "0 0 12px" }}>
                          {pick.note}
                        </p>

                        {/* Food + buy */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: `1px solid ${t.bdrL}` }}>
                          {pick.food && (
                            <div style={{ fontSize: 11, color: t.txL }}>
                              Passar till: <span style={{ color: t.txM }}>{pick.food}</span>
                            </div>
                          )}
                          <a href={`https://www.systembolaget.se/produkt/${pick.nr}`} target="_blank" rel="noopener noreferrer"
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              padding: "6px 14px", borderRadius: 8,
                              background: t.tx, color: "#faf6f0",
                              fontSize: 11, fontWeight: 600, textDecoration: "none",
                              transition: "opacity 0.2s", flexShrink: 0,
                            }}
                            onClick={e => e.stopPropagation()}
                            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                          >Köp på Systembolaget ↗</a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

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

        {/* ═══ PRICE PILLS + EKO ═══ */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {[["0-99", "Under 100 kr"], ["100-150", "100–150 kr"], ["151-200", "150–200 kr"], ["201-9999", "200+ kr"]].map(([k, l]) => (
            <button key={k} onClick={() => setPrice(price === k ? "all" : k)} style={pill(price === k)}>{l}</button>
          ))}
          <button onClick={() => setShowEco(!showEco)} style={{ ...pill(showEco, t.green), display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 12 }}>🌿</span> Ekologiskt
          </button>
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
    </SavedContext.Provider>
  );
}
