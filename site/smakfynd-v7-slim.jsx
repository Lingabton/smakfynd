// ═══════════════════════════════════════════════════════════════
// SMAKFYND v7 — Real Data + Package Filter
// Smartare vinval på Systembolaget
// By Olav Innovation AB · Gabriel Linton
// ═══════════════════════════════════════════════════════════════

// Data: loaded async from wines.json, or embedded at build time as fallback
const DATA_URL = "wines.json";

const SAMPLE_PRODUCTS = []; // Data loaded async from wines.json

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
  {q:"Hur beräknas Smakfynd-poängen?",a:"Varje vin bedöms på tre saker: crowd-betyg (vad vanliga människor tycker), expertrecensioner (vinkritiker som James Suckling, Decanter m.fl.) och prisvärde (hur priset förhåller sig till andra viner i samma kategori). Hög kvalitet till lågt pris = hög poäng. Poängen visas på en skala 1–100."},
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
  txM: "#4a4238",
  txL: "#7a7060",
  txF: "#a89e8e",
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
  if (s100 >= 90) return ["Exceptionellt fynd", "#1a7a2e", "🏆"];
  if (s100 >= 80) return ["Toppköp", t.green, "⭐"];
  if (s100 >= 70) return ["Starkt fynd", "#5a7542", ""];
  if (s100 >= 60) return ["Bra köp", "#7a7054", ""];
  if (s100 >= 50) return ["Okej värde", "#8a7a6a", ""];
  return ["Svagt värde", "#8a7a6a", ""];
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
const LISTS = [
  { k: "favoriter", l: "Favoriter", i: "♥" },
  { k: "att-testa", l: "Att testa", i: "🔖" },
  { k: "budget", l: "Bra köp", i: "💰" },
  { k: "middag", l: "Middag", i: "🍽" },
  { k: "helg", l: "Helg", i: "🥂" },
  { k: "fest", l: "Fest", i: "🎉" },
];

function useSaved() {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem("smakfynd_saved_v2");
      if (raw) return JSON.parse(raw);
      // Migrate from old format (flat array → favoriter list)
      const old = JSON.parse(localStorage.getItem("smakfynd_saved") || "[]");
      if (old.length) {
        const migrated = {};
        old.forEach(nr => { migrated[nr] = ["favoriter"]; });
        return migrated;
      }
      return {};
    } catch(e) { return {}; }
  });

  const save = (next) => {
    setData(next);
    try { localStorage.setItem("smakfynd_saved_v2", JSON.stringify(next)); } catch(e) {}
  };

  const toggle = (nr, list = "favoriter") => {
    const next = { ...data };
    const lists = next[nr] || [];
    if (lists.includes(list)) {
      const filtered = lists.filter(l => l !== list);
      if (filtered.length === 0) delete next[nr];
      else next[nr] = filtered;
    } else {
      next[nr] = [...lists, list];
    }
    save(next);
  };

  const isSaved = (nr) => !!(data[nr] && data[nr].length > 0);
  const isInList = (nr, list) => (data[nr] || []).includes(list);
  const getLists = (nr) => data[nr] || [];
  const allSaved = Object.keys(data).filter(nr => data[nr] && data[nr].length > 0);
  const inList = (list) => Object.keys(data).filter(nr => (data[nr] || []).includes(list));
  const count = allSaved.length;

  return { data, toggle, isSaved, isInList, getLists, allSaved, inList, count };
}

// Global saved state (shared between components)
const SavedContext = React.createContext(null);

function Card({ p, rank, delay, totalInCategory, allProducts }) {
  const [open, setOpen] = useState(false);
  const sv = React.useContext(SavedContext);
  const icon = ({ Rött: "🍷", Vitt: "🥂", Rosé: "🌸", Mousserande: "🍾" })[p.category] || "✦";
  const s100 = p.smakfynd_score;
  const [label, col, emoji] = getScoreInfo(s100);
  const foodStr = (p.food_pairings || []).slice(0, 3).join(", ");
  const sbUrl = `https://www.systembolaget.se/produkt/vin/${p.nr}`;
  
  // Rank badges
  const badge = rank === 1 ? "Bästa köpet" : rank <= 3 ? `Topp ${rank}` : null;
  // Don't show rank numbers — just show wines as "Topp-viner" when scores are close

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
            <div style={{ flexShrink: 0, textAlign: "center" }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                <svg width="50" height="50" viewBox="0 0 50 50" style={{ display: "block" }}>
                  <circle cx="25" cy="25" r="22" fill="#e8f0e4" />
                  <circle cx="25" cy="25" r="22" fill="none" stroke="#d4ddd0" strokeWidth="2.5" />
                  <circle cx="25" cy="25" r="22" fill="none" stroke="#2d6b3f" strokeWidth="2.5"
                    strokeDasharray={`${s100 * 1.38} 138`} strokeLinecap="round"
                    transform="rotate(-90 25 25)" style={{ transition: "stroke-dasharray 0.8s ease" }} />
                  <text x="25" y="30" textAnchor="middle" fontFamily="'Instrument Serif', Georgia, serif"
                    fontSize="19" fontWeight="900" fill="#2d6b3f">{s100}</text>
                </svg>
              {/* Overlapping mini-badges */}
              {(p.organic || p.price_vs_launch_pct > 0 || p.is_new) && (
                <div style={{ position: "absolute", top: -6, left: -14, display: "flex", gap: 2 }}>
                  {p.price_vs_launch_pct > 0 && <span style={{ fontSize: 8, fontWeight: 800, padding: "2px 5px", borderRadius: 4, background: t.deal, color: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>−{p.price_vs_launch_pct}%</span>}
                  {p.organic && <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 7px", borderRadius: 5, background: t.green, color: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", letterSpacing: "0.05em" }}>EKO</span>}
                  {p.is_new && <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 4, background: t.wine, color: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>NY</span>}
                </div>
              )}
              </div>
              <div style={{ fontSize: 9, fontWeight: 600, color: col, marginTop: 3 }}>{label}</div>
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

          {/* Row 4: Human-readable verdict */}
          <div style={{ marginTop: 5, fontSize: 11, color: t.txM, lineHeight: 1.4, fontStyle: "italic" }}>
            {(() => {
              const c = p.crowd_score || 0, e = p.expert_score || 0, pr = p.price_score || 0;
              const rev = p.crowd_reviews || 0;
              // Generate a natural, specific verdict
              if (c >= 8.0 && pr >= 8) return "Publikfavorit till bra pris — få viner slår detta i prisklassen";
              if (c >= 8.0 && e >= 7.5) return "Omtyckt av både crowd och kritiker — tryggt val";
              if (c >= 8.0) return "Mycket omtyckt bland vindrickare";
              if (e >= 8.0 && pr >= 8) return "Kritikerfavorit till överraskande lågt pris";
              if (e >= 7.5 && pr >= 8) return "Bra expertbetyg och mer smak än prislappen antyder";
              if (e >= 7.5 && c >= 7.0) return "Uppskattat av både publik och kritiker";
              if (pr >= 9 && c >= 7.0) return "Mycket vin för pengarna — svårslaget i prisklassen";
              if (pr >= 8 && c >= 7.0) return "Bra köp för priset — bred uppskattning";
              if (pr >= 8) return "Prisvärt val med rimligt betyg";
              if (c >= 7.5 && rev >= 5000) return "Tryggt och populärt — många har provat och gillar";
              if (c >= 7.0) return "Solitt val med god crowd-uppskattning";
              return null;
            })()}
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
          {sv && <SaveButton nr={p.nr || p.id} sv={sv} />}
          <button onClick={e => {
              e.stopPropagation();
              const url = `https://smakfynd.se/#vin/${p.nr}`;
              const text = `${p.name} ${p.sub || ''} — ${p.smakfynd_score}/100 på Smakfynd (${p.price}kr)`;
              if (navigator.share) {
                navigator.share({ title: p.name, text, url }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(`${text}\n${url}`);
              }
            }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 12, color: t.txL, background: "none", border: "none",
              cursor: "pointer", padding: "2px 0", fontFamily: "inherit",
            }}>
            <span style={{ fontSize: 13, lineHeight: 1 }}>↗</span> Dela
          </button>
        </div>
        <span style={{ fontSize: 10, color: t.txF, display: "flex", alignItems: "center", gap: 3 }}>
          {open ? "Stäng ▲" : "Se varför ▼"}
        </span>
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${t.bdrL}`, paddingTop: 14 }}>
          {/* Badges */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
            {badge && <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 100, background: rank === 1 ? `linear-gradient(135deg, #b08d40, #d4a84b)` : `${t.wine}15`, color: rank === 1 ? "#fff" : t.wine, textTransform: "uppercase", letterSpacing: "0.08em", boxShadow: rank === 1 ? "0 1px 4px rgba(176,141,64,0.3)" : "none" }}>{rank === 1 ? "🏆 " : ""}{badge}</span>}
            {p.confidence === "hög" && <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: t.greenL, color: t.green }}>Hög trygghet</span>}
            {p.price_vs_launch_pct > 0 && <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: t.dealL, color: t.deal, textTransform: "uppercase" }}>Prissänkt −{p.price_vs_launch_pct}%</span>}
            {p.organic && <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: t.greenL, color: t.green }}>Ekologiskt</span>}
            {p.food_pairings?.length > 0 && <span style={{ fontSize: 9, fontWeight: 500, padding: "3px 10px", borderRadius: 100, background: t.bg, color: t.txM, border: `1px solid ${t.bdrL}` }}>Passar till {p.food_pairings.slice(0,2).join(", ")}</span>}
          </div>
          {/* Quick taste description */}
          {p.style && <div style={{ fontSize: 12, color: t.txM, fontStyle: "italic", marginBottom: 10, lineHeight: 1.5 }}>{p.style}</div>}

          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <ProductImage p={p} size={72} style={{ borderRadius: 10, background: "#faf7f2" }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6 }}>
                {[["Druva", p.grape], ["Alkohol", p.alc ? `${p.alc}%` : null], ["Volym", `${p.vol} ml`], ["Land", `${p.country}${p.region ? `, ${p.region}` : ""}`]].filter(([_l, v]) => v).map(([l, v], i) => (
                  <div key={i}>
                    <div style={{ fontSize: 8, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 1 }}>{l}</div>
                    <div style={{ fontSize: 12, color: t.txM, fontWeight: 500 }}>{v}</div>
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

          {/* Score breakdown */}
          <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 10, background: t.bg }}>
            <div style={{ fontSize: 9, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Poängfördelning</div>
            <div style={{ display: "flex", gap: 12 }}>
              {/* Left: score bars */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Crowd */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#6b8cce" }}>Crowd</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: p.crowd_score ? "#6b8cce" : t.txL }}>{p.crowd_score ? `${p.crowd_score.toFixed(1)}/10` : "—"}</span>
                  </div>
                  {p.crowd_score && (
                    <div>
                      <div style={{ height: 4, borderRadius: 2, background: t.bdr, overflow: "hidden", marginBottom: 4 }}>
                        <div style={{ width: `${p.crowd_score * 10}%`, height: "100%", borderRadius: 2, background: "#6b8cce" }} />
                      </div>
                      <div style={{ fontSize: 10, color: t.txL }}>
                        {p.crowd_reviews ? `${p.crowd_reviews > 999 ? `${(p.crowd_reviews / 1000).toFixed(0)}k` : p.crowd_reviews} omdömen från vanliga vindrickare` : ""}
                        {p.crowd_reviews >= 50000 && <span style={{ color: t.green, fontWeight: 600 }}> — mycket pålitligt</span>}
                        {p.crowd_reviews >= 10000 && p.crowd_reviews < 50000 && <span style={{ color: t.txM }}> — pålitligt</span>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Expert */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#b07d3b" }}>Expert</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: p.expert_score ? "#b07d3b" : t.txL }}>{p.expert_score ? `${p.expert_score.toFixed(1)}/10` : "—"}</span>
                  </div>
                  {p.expert_score ? (
                    <div>
                      <div style={{ height: 4, borderRadius: 2, background: t.bdr, overflow: "hidden", marginBottom: 4 }}>
                        <div style={{ width: `${p.expert_score * 10}%`, height: "100%", borderRadius: 2, background: "#b07d3b" }} />
                      </div>
                      <div style={{ fontSize: 10, color: t.txL }}>
                        Snitt från erkända vinkritiker
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, color: t.txL, fontStyle: "italic" }}>Inga kritikerrecensioner hittade för detta vin</div>
                  )}
                </div>

                {/* Price */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: t.txM }}>Prisvärde</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.txM }}>{p.price_score ? `${p.price_score.toFixed(1)}/10` : "—"}</span>
                  </div>
                  {p.price_score && (
                    <div>
                      <div style={{ height: 4, borderRadius: 2, background: t.bdr, overflow: "hidden", marginBottom: 4 }}>
                        <div style={{ width: `${p.price_score * 10}%`, height: "100%", borderRadius: 2, background: t.txM }} />
                      </div>
                      <div style={{ fontSize: 10, color: t.txL }}>
                        {(() => {
                          const catMedians = { "Rött": 279, "Vitt": 239, "Rosé": 160, "Mousserande": 399 };
                          const catNames = { "Rött": "rött vin", "Vitt": "vitt vin", "Rosé": "rosévin", "Mousserande": "mousserande" };
                          const median = catMedians[p.category] || 250;
                          return `${p.price}kr · Medianen för ${catNames[p.category] || "vin"}: ${median}kr`;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: total score */}
              <div style={{ textAlign: "center", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: `linear-gradient(135deg, ${col}18, ${col}08)`,
                  border: `2px solid ${col}30`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: col, lineHeight: 1, fontFamily: "'Instrument Serif', Georgia, serif" }}>{s100}</span>
                </div>
                <span style={{ fontSize: 9, color: t.txL, marginTop: 4 }}>Smak för</span>
                <span style={{ fontSize: 9, color: t.txL }}>pengarna</span>
              </div>
            </div>
          </div>

          {/* Price drop info */}
          {p.launch_price && p.price_vs_launch_pct > 0 && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: t.dealL, marginBottom: 14, fontSize: 13, color: t.deal, lineHeight: 1.5 }}>
              Lanserades för <strong>{p.launch_price} kr</strong> — nu {p.price} kr. Du sparar {p.launch_price - p.price} kr per flaska.
            </div>
          )}

          {/* Similar wines with reasons */}
          {allProducts && (() => {
            const similar = allProducts
              .filter(w => w.category === p.category && w.package === p.package
                && w.assortment === "Fast sortiment"
                && Math.abs(w.price - p.price) <= 50
                && (w.nr || w.id) !== (p.nr || p.id)
                && w.smakfynd_score >= p.smakfynd_score - 5)
              .sort((a, b) => b.smakfynd_score - a.smakfynd_score)
              .slice(0, 3)
              .map(w => {
                // Generate reason WHY this is recommended
                let reason = "";
                if (w.price < p.price - 10) reason = `${p.price - w.price}kr billigare`;
                else if (w.smakfynd_score > p.smakfynd_score) reason = "Högre fyndpoäng";
                if ((w.expert_score || 0) > (p.expert_score || 0)) reason += (reason ? " · " : "") + "Starkare expertstöd";
                else if ((w.crowd_score || 0) > (p.crowd_score || 0) + 0.3) reason += (reason ? " · " : "") + "Högre crowd-betyg";
                if (w.grape && p.grape && w.grape === p.grape) reason += (reason ? " · " : "") + "Samma druva";
                if (!reason) reason = "Liknande stil och prisklass";
                return { ...w, _reason: reason };
              });
            if (similar.length === 0) return null;
            return (
              <div style={{ marginBottom: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.tx, marginBottom: 8 }}>Gillar du {p.name}? Testa även</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {similar.map((w, i) => (
                    <a key={i} href={`https://www.systembolaget.se/produkt/vin/${w.nr}`} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: t.bg, border: `1px solid ${t.bdrL}`, textDecoration: "none", transition: "border-color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = t.wine + "40"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = t.bdrL}
                    >
                      <svg width="34" height="34" viewBox="0 0 50 50" style={{ flexShrink: 0 }}>
                        <circle cx="25" cy="25" r="22" fill="#e8f0e4" />
                        <circle cx="25" cy="25" r="22" fill="none" stroke="#d4ddd0" strokeWidth="2.5" />
                        <circle cx="25" cy="25" r="22" fill="none" stroke="#2d6b3f" strokeWidth="2.5"
                          strokeDasharray={`${w.smakfynd_score * 1.38} 138`} strokeLinecap="round"
                          transform="rotate(-90 25 25)" />
                        <text x="25" y="30" textAnchor="middle" fontFamily="'Instrument Serif', Georgia, serif"
                          fontSize="16" fontWeight="900" fill="#2d6b3f">{w.smakfynd_score}</text>
                      </svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontFamily: "'Instrument Serif', serif", color: t.tx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.name}</div>
                        <div style={{ fontSize: 10, color: t.txL }}>{w.sub} · {w.country}</div>
                        <div style={{ fontSize: 10, color: t.green, marginTop: 2, fontWeight: 500 }}>{w._reason}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: t.tx, flexShrink: 0, fontFamily: "'Instrument Serif', serif" }}>
                        {w.price}<span style={{ fontSize: 9, fontWeight: 400, color: t.txL }}>kr</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })()}

        </div>
      )}
    </div>
  );
}

function SaveButton({ nr, sv }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const saved = sv.isSaved(nr);
  const lists = sv.getLists(nr);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button onClick={e => { e.stopPropagation(); if (saved) { setMenuOpen(!menuOpen); } else { sv.toggle(nr, "favoriter"); } }}
        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(!menuOpen); }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 12, color: saved ? t.wine : t.txL,
          background: "none", border: "none", cursor: "pointer", padding: "2px 0",
          fontFamily: "inherit", transition: "all 0.2s",
        }}>
        <span style={{ fontSize: 15, lineHeight: 1 }}>{saved ? "♥" : "♡"}</span>
        <span style={{ fontWeight: saved ? 600 : 400 }}>{saved ? (lists.length === 1 ? LISTS.find(l => l.k === lists[0])?.l || "Sparad" : `${lists.length} listor`) : "Spara"}</span>
      </button>
      {menuOpen && (
        <div onClick={e => e.stopPropagation()} style={{
          position: "absolute", bottom: "100%", left: 0, marginBottom: 6,
          background: t.card, border: `1px solid ${t.bdr}`, borderRadius: 12,
          boxShadow: "0 8px 24px rgba(30,23,16,0.12)", padding: "6px 0",
          zIndex: 100, minWidth: 160,
        }}>
          <div style={{ padding: "6px 14px 4px", fontSize: 10, color: t.txL, textTransform: "uppercase", letterSpacing: "0.08em" }}>Spara till</div>
          {LISTS.map(list => (
            <button key={list.k} onClick={e => { e.stopPropagation(); sv.toggle(nr, list.k); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "8px 14px", border: "none", background: sv.isInList(nr, list.k) ? t.wineL : "transparent",
                cursor: "pointer", fontFamily: "inherit", fontSize: 13,
                color: sv.isInList(nr, list.k) ? t.wine : t.txM, textAlign: "left",
              }}>
              <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{list.i}</span>
              <span>{list.l}</span>
              {sv.isInList(nr, list.k) && <span style={{ marginLeft: "auto", fontSize: 12 }}>✓</span>}
            </button>
          ))}
          <div style={{ borderTop: `1px solid ${t.bdrL}`, margin: "4px 0" }} />
          <button onClick={e => { e.stopPropagation(); setMenuOpen(false); }}
            style={{ width: "100%", padding: "6px 14px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 11, color: t.txL, textAlign: "center" }}>
            Stäng
          </button>
        </div>
      )}
    </div>
  );
}

function AIQuestion({ aiResult, onFollowup }) {
  const [freetext, setFreetext] = useState("");
  return (
    <div>
      {(aiResult.questions || []).map((q, qi) => (
        <div key={qi} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 13, color: t.tx, fontWeight: 500, marginBottom: 6 }}>{q}</div>
          {aiResult.quick_options && aiResult.quick_options[qi] && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {aiResult.quick_options[qi].map((opt, oi) => (
                <button key={oi} onClick={() => onFollowup(opt)}
                  style={{
                    padding: "8px 16px", borderRadius: 100, border: `1px solid ${t.wine}30`,
                    background: t.card, color: t.wine, fontSize: 13, fontWeight: 500,
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = t.wine; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = t.card; e.currentTarget.style.color = t.wine; }}
                >{opt}</button>
              ))}
            </div>
          )}
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input type="text" value={freetext} onChange={e => setFreetext(e.target.value)}
          placeholder="Eller skriv eget svar..."
          onKeyDown={e => e.key === "Enter" && freetext.trim() && onFollowup(freetext.trim())}
          style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${t.bdr}`, background: t.card, fontSize: 13, color: t.tx, outline: "none", boxSizing: "border-box" }}
        />
        <button onClick={() => freetext.trim() && onFollowup(freetext.trim())}
          disabled={!freetext.trim()}
          style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: t.wine, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: freetext.trim() ? 1 : 0.4 }}
        >Skicka</button>
      </div>
    </div>
  );
}

function EditorsPicks({ products, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <button onClick={() => setOpen(!open)}
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
        <span style={{ fontSize: 10, color: t.txL, transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
      </button>
      {open && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          {GABRIELS_PICKS.map((pick, i) => {
            const mp = products.find(pr => String(pr.nr) === String(pick.nr));
            const [_l, pCol] = getScoreInfo(pick.smakfynd_score);
            return (
              <div key={i} style={{ padding: "14px 16px", borderRadius: 12, background: t.card, border: `1px solid ${t.bdr}`, cursor: mp ? "pointer" : "default" }}
                onClick={() => mp && onSelect(mp.name)}>
                <div style={{ fontSize: 10, fontWeight: 700, color: t.wine, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{pick.verdict}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <svg width="40" height="40" viewBox="0 0 50 50" style={{ flexShrink: 0 }}>
                    <circle cx="25" cy="25" r="22" fill="#e8f0e4" />
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#d4ddd0" strokeWidth="2.5" />
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#2d6b3f" strokeWidth="2.5"
                      strokeDasharray={`${pick.smakfynd_score * 1.38} 138`} strokeLinecap="round"
                      transform="rotate(-90 25 25)" />
                    <text x="25" y="30" textAnchor="middle" fontFamily="'Instrument Serif', Georgia, serif"
                      fontSize="17" fontWeight="900" fill="#2d6b3f">{pick.smakfynd_score}</text>
                  </svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontFamily: "'Instrument Serif', serif", color: t.tx }}>{pick.name}</div>
                    <div style={{ fontSize: 11, color: t.txL }}>{pick.sub} · {pick.price}</div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: t.txM, lineHeight: 1.5, margin: "8px 0 0", fontStyle: "italic" }}>{pick.note}</p>
                {mp && <div style={{ fontSize: 10, color: t.wine, marginTop: 6 }}>Klicka för att se fullständig profil →</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

    try {
      let data;
      for (let attempt = 0; attempt < 2; attempt++) {
        const res = await fetch(WINE_AI_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meal: userMessage,
            context: existingContext || [],
          }),
        });
        data = await res.json();
        if (!data.error) break;
        if (attempt === 0) await new Promise(r => setTimeout(r, 1000));
      }
      if (data.error) throw new Error(data.error);

      setAiResult(data);

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

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StoreMode({ products, onClose }) {
  const [q, setQ] = useState("");
  const sv = React.useContext(SavedContext);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const result = useMemo(() => {
    if (q.length < 2) return null;
    const query = q.toLowerCase().trim();

    // Search by article number or name — show multiple matches
    const matches = products.filter(p =>
      String(p.nr) === query ||
      p.name?.toLowerCase().includes(query) ||
      (p.sub && p.sub.toLowerCase().includes(query))
    ).slice(0, 5);

    if (!matches.length) return { match: null, alternatives: [] };

    const match = matches[0];

    // Find better alternatives in same type within ±40kr
    const alts = products
      .filter(p =>
        p.category === match.category &&
        p.package === match.package &&
        p.assortment === "Fast sortiment" &&
        Math.abs(p.price - match.price) <= 40 &&
        p.nr !== match.nr &&
        p.smakfynd_score > match.smakfynd_score
      )
      .sort((a, b) => b.smakfynd_score - a.smakfynd_score)
      .slice(0, 3);

    return { match, alternatives: alts, otherMatches: matches.slice(1) };
  }, [q, products]);

  const WineRow = ({ p, isCurrent }) => {
    const [_l, col] = getScoreInfo(p.smakfynd_score);
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
        borderRadius: 14, background: isCurrent ? t.card : t.card,
        border: `1px solid ${isCurrent ? t.bdr : t.bdrL}`,
        marginBottom: 8,
      }}>
        <div style={{
          width: 50, height: 50, borderRadius: 14, flexShrink: 0,
          background: `linear-gradient(135deg, ${col}18, ${col}08)`,
          border: `2px solid ${col}30`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: col, lineHeight: 1, fontFamily: "'Instrument Serif', Georgia, serif" }}>{p.smakfynd_score}</span>
          <span style={{ fontSize: 6, fontWeight: 700, color: col, opacity: 0.7 }}>POÄNG</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontFamily: "'Instrument Serif', Georgia, serif", color: t.tx, lineHeight: 1.2 }}>{p.name}</div>
          <div style={{ fontSize: 12, color: t.txL, marginTop: 2 }}>{p.sub} · {p.country}</div>
          {p.grape && <div style={{ fontSize: 11, color: t.txM, marginTop: 2 }}>{p.grape}</div>}
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            {p.crowd_score >= 7.5 && <span style={{ fontSize: 9, color: "#6b8cce", background: "#6b8cce10", padding: "2px 6px", borderRadius: 100 }}>Crowd-favorit</span>}
            {p.expert_score >= 7.0 && <span style={{ fontSize: 9, color: "#b07d3b", background: "#b07d3b10", padding: "2px 6px", borderRadius: 100 }}>Expertstöd</span>}
            {p.organic && <span style={{ fontSize: 9, color: t.green, background: `${t.green}10`, padding: "2px 6px", borderRadius: 100 }}>Eko</span>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: t.tx, fontFamily: "'Instrument Serif', Georgia, serif" }}>
            {p.price}<span style={{ fontSize: 11, fontWeight: 400, color: t.txL }}>kr</span>
          </div>
          <div style={{ fontSize: 10, color: t.txL }}>nr {p.nr}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      minHeight: "100vh", background: t.bg, fontFamily: "'DM Sans', -apple-system, sans-serif",
      padding: "0 16px 40px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: "20px 0 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 18, fontFamily: "'Instrument Serif', Georgia, serif", color: t.tx }}>Smakfynd</div>
          <div style={{ fontSize: 11, color: t.txL }}>Stå-i-butiken-läge</div>
        </div>
        <button onClick={onClose} style={{
          padding: "8px 16px", borderRadius: 100, border: `1px solid ${t.bdr}`,
          background: t.card, color: t.txM, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
        }}>Tillbaka</button>
      </div>

      {/* Big search */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <input ref={inputRef} type="search" inputMode="search" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Skriv vinets namn eller artikelnummer..."
          style={{
            width: "100%", padding: "20px 60px 20px 52px", borderRadius: 16,
            border: `2px solid ${t.wine}30`, background: t.card, fontSize: 20,
            color: t.tx, outline: "none", boxSizing: "border-box",
            fontFamily: "'Instrument Serif', Georgia, serif",
          }}
          onFocus={e => e.target.style.borderColor = t.wine}
          onBlur={e => e.target.style.borderColor = t.wine + "30"}
        />
        <span style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", fontSize: 22, color: t.txL, pointerEvents: "none" }}>🔍</span>
        <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", fontSize: 20, color: t.bdr, pointerEvents: "none" }} title="Streckkods-scanner kommer snart">📷</span>
      </div>

      {/* Result */}
      {result && result.match && (
        <div>
          <div style={{ fontSize: 10, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Ditt vin</div>
          <WineRow p={result.match} isCurrent={true} />

          {result.alternatives.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, color: t.green, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontWeight: 700 }}>
                Bättre alternativ i samma prisklass
              </div>
              {result.alternatives.map((p, i) => <WineRow key={i} p={p} isCurrent={false} />)}
            </div>
          )}

          {result.alternatives.length === 0 && (
            <div style={{ padding: "16px 20px", borderRadius: 14, background: `${t.green}08`, border: `1px solid ${t.green}20`, marginTop: 12 }}>
              <div style={{ fontSize: 13, color: t.green, fontWeight: 600 }}>Bra val!</div>
              <div style={{ fontSize: 12, color: t.txM, marginTop: 2 }}>Det här är bland de bästa i sin prisklass.</div>
            </div>
          )}

          {result.otherMatches && result.otherMatches.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                Matchade även
              </div>
              {result.otherMatches.map((p, i) => <WineRow key={i} p={p} isCurrent={false} />)}
            </div>
          )}
        </div>
      )}

      {result && !result.match && q.length >= 2 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: t.txL }}>
          <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>🔍</div>
          <div style={{ fontSize: 15, color: t.txM }}>Hittade inget vin med "{q}"</div>
          <div style={{ fontSize: 12, color: t.txL, marginTop: 4 }}>Prova vinets namn eller artikelnummer (finns på hyllkanten)</div>
        </div>
      )}

      {!result && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: t.txL }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏪</div>
          <div style={{ fontSize: 16, fontFamily: "'Instrument Serif', Georgia, serif", color: t.tx, marginBottom: 6 }}>Stå i butiken?</div>
          <div style={{ fontSize: 13, color: t.txM, lineHeight: 1.6 }}>
            Skriv in vinets namn eller artikelnummer.<br />
            Vi visar poängen och om det finns bättre alternativ.
          </div>
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

// Hash routing: read initial state from URL hash
function parseHash() {
  const hash = window.location.hash.slice(1); // remove #
  if (!hash) return {};
  if (hash.startsWith('vin/')) return { openWine: hash.slice(4) };
  const catMap = { rott: 'Rött', vitt: 'Vitt', rose: 'Rosé', bubbel: 'Mousserande', alla: 'all' };
  if (catMap[hash]) return { cat: catMap[hash] };
  return { search: decodeURIComponent(hash) };
}

function SmakfyndApp() {
  const sv = useSaved();
  const initHash = useMemo(() => parseHash(), []);
  const [showSaved, setShowSaved] = useState(false);
  const [storeMode, setStoreMode] = useState(false);
  const [cat, setCat] = useState(initHash.cat || "Rött");
  const [price, setPrice] = useState("all");
  const [search, setSearch] = useState(initHash.search || "");
  const [showNew, setShowNew] = useState(false);
  const [showDeals, setShowDeals] = useState(false);
  const [panel, setPanel] = useState(null);
  const [faqOpen, setFaqOpen] = useState(null);
  const [pkg, setPkg] = useState("Flaska");
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openWineNr, setOpenWineNr] = useState(initHash.openWine || null);

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
      category: p.type || '',
      style: p.cat3 || p.style || '',
      food_pairings: typeof p.food_pairings === 'string'
        ? p.food_pairings.split(',').map(s => s.trim()).filter(Boolean)
        : (p.food_pairings || []),
      package: p.pkg || 'Flaska',
    })).sort((a, b) => b.smakfynd_score - a.smakfynd_score);
  }, [allData]);
  const totalReviews = products.reduce((sum, p) => sum + (p.crowd_reviews || 0), 0);
  const reviewsStr = totalReviews > 1000000 ? `${(totalReviews / 1000000).toFixed(1)}M` : totalReviews > 1000 ? `${Math.round(totalReviews / 1000)}K` : String(totalReviews);
  const countries = [...new Set(products.map(p => p.country).filter(Boolean))].length;

  // Handle #vin/nr hash — search for the wine when data loads
  useEffect(() => {
    if (openWineNr && products.length > 0) {
      const wine = products.find(p => String(p.nr) === String(openWineNr));
      if (wine) {
        setSearch(wine.name);
        setCat("all");
      }
      setOpenWineNr(null);
    }
  }, [openWineNr, products]);

  // Update hash on category change
  useEffect(() => {
    const catMap = { Rött: 'rott', Vitt: 'vitt', Rosé: 'rose', Mousserande: 'bubbel', all: 'alla' };
    if (!search && catMap[cat]) {
      history.replaceState(null, '', '#' + catMap[cat]);
    }
  }, [cat]);

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
    return products.filter(p => sv.isSaved(p.nr || p.id)).sort((a, b) => b.smakfynd_score - a.smakfynd_score);
  }, [products, sv.data]);
  const [savedListFilter, setSavedListFilter] = useState("all");

  return (
    <SavedContext.Provider value={sv}>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
    {storeMode && <StoreMode products={products} onClose={() => setStoreMode(false)} />}
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: "'DM Sans', -apple-system, sans-serif", display: storeMode ? "none" : "block" }}>
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
        {/* Logo — wordmark */}
        <div style={{ marginBottom: 20 }} dangerouslySetInnerHTML={{ __html: `<svg width="160" height="36" viewBox="0 0 200 44"><text x="0" y="30" font-family="Georgia, 'Times New Roman', serif" font-size="32" font-weight="400" fill="#7a2332" letter-spacing="0.3">Smakfynd</text><line x1="0" y1="37" x2="178" y2="37" stroke="#c9a84c" stroke-width="1.2" opacity="0.7"/></svg>` }} />

        {/* Headline */}
        <h1 style={{
          margin: "0 0 12px", fontSize: 36, lineHeight: 1.1,
          fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, color: t.tx,
        }}>
          Mindre hype,<br />bättre <em style={{ color: t.wine }}>vinköp</em>
        </h1>

        <p style={{
          margin: "0 auto 20px", fontSize: 15, color: t.txM, lineHeight: 1.6,
          maxWidth: 440, fontWeight: 300,
        }}>
          Vi jämför 11 500+ viner mot rätt kategori — inte hela hyllan. Här hittar du fynden.
        </p>

        {/* Trust module — concrete promises */}
        <div style={{
          padding: "14px 20px", borderRadius: 14,
          border: `1px solid ${t.bdr}`, background: t.card, marginBottom: 20,
          textAlign: "left",
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.tx, marginBottom: 4 }}>Så funkar Smakfynd</div>
          <div style={{ fontSize: 11, color: t.txM, marginBottom: 8, lineHeight: 1.4 }}>Bästa köp i varje stil och prisklass — baserat på data, inte magkänsla.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              ["🍷", "Vi jämför bara med liknande viner — rött mot rött, bubbel mot bubbel"],
              ["⚖️", "Vi väger ihop crowd-betyg, expertrecensioner och prisvärde"],
              ["📊", "Fler omdömen ger säkrare signal — viner med få betyg rankas lägre"],
              ["🤝", "Vi säljer inte vin — vi hjälper dig välja bättre"],
            ].map(([icon, text], i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 13, lineHeight: 1.4, flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: 12, color: t.txM, lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: "flex", justifyContent: "center", gap: 20, fontSize: 13, color: t.txL, marginBottom: 6 }}>
          {[["about", "Om Smakfynd"], ["method", "Metoden"], ["faq", "Vanliga frågor"], ["saved", `♥ Mina viner${sv.count ? ` (${sv.count})` : ""}`]].map(([k, l]) => (
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
              Smakfynd hjälper dig hitta viner som ger mest smak för pengarna. Vi följer <strong>11 500+ viner</strong> på Systembolaget och kombinerar crowd-betyg, expertrecensioner och prisjämförelse för att lyfta fram de bästa fynden.
            </p>
            <p style={{ fontSize: 14, color: t.txM, lineHeight: 1.7, margin: "0 0 14px" }}>
              Resultatet är en enda poäng — <strong>Smakfynd-poängen</strong> — som visar kvalitet per krona. Vi har även en AI-vinmatchare som föreslår viner baserat på vad du ska äta.
            </p>
            <div style={{ padding: 16, borderRadius: 12, background: t.bg, marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontFamily: "'Instrument Serif', serif", color: t.tx, marginBottom: 4 }}>Gabriel Linton, grundare</div>
              <p style={{ fontSize: 13, color: t.txM, lineHeight: 1.6, margin: 0 }}>
                Forskare i innovation och entreprenörskap (PhD, Örebro universitet). Førsteamanuensis vid Universitetet i Innlandet, Norge. Utbildad i dryckeskunskap vid Restaurang- och hotellhögskolan i Grythyttan. MBA, Cleveland State University.
              </p>
              <p style={{ fontSize: 13, color: t.txM, lineHeight: 1.6, margin: "8px 0 0" }}>
                Smakfynd startade med mitt eget problem: jag ville hitta bra vin utan att gissa. Som forskare vill jag ha data — inte magkänsla. All information fanns redan, men ingen hade kopplat ihop den på ett enkelt sätt. Och jag fick ofta känslan att billigare viner smakade nästan lika bra som betydligt dyrare. Därför byggde jag ett system som väger in priset i omdömet — systematiskt.
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
                <strong>Hög kvalitet till lågt pris = hög poäng.</strong> Kvalitet går alltid före pris — ett billigt vin med dåligt betyg kan aldrig hamna högt.
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
            <h2 style={{ margin: "0 0 4px", fontSize: 22, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>Mina viner</h2>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: t.txL }}>Sparas i webbläsaren. Logga in (kommer snart) för att synka.</p>

            {/* List tabs */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
              <button onClick={() => setSavedListFilter("all")}
                style={{ ...pill(savedListFilter === "all", t.wine), fontSize: 12, padding: "6px 12px" }}>
                Alla ({sv.count})
              </button>
              {LISTS.map(list => {
                const cnt = sv.inList(list.k).length;
                if (cnt === 0) return null;
                return (
                  <button key={list.k} onClick={() => setSavedListFilter(list.k)}
                    style={{ ...pill(savedListFilter === list.k, t.wine), fontSize: 12, padding: "6px 12px" }}>
                    {list.i} {list.l} ({cnt})
                  </button>
                );
              })}
            </div>

            {savedWines.length === 0 ? (
              <p style={{ fontSize: 14, color: t.txM, fontStyle: "italic" }}>Inga sparade viner ännu. Tryck ♡ på ett vin för att spara det.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {savedWines
                  .filter(p => savedListFilter === "all" || sv.isInList(p.nr || p.id, savedListFilter))
                  .map((p, i) => <Card key={p.id || i} p={p} rank={i + 1} delay={0} allProducts={products} />)}
              </div>
            )}
            <button onClick={() => setPanel(null)} style={{ marginTop: 12, fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Stäng</button>
          </div>
        )}

        {/* ═══ FOOD MATCH ═══ */}
        <FoodMatch products={products} />

        {/* ═══ MÅNADENS TIPS ═══ */}
        <EditorsPicks products={products} onSelect={name => setSearch(name)} />

        {/* ═══ SEARCH + STORE MODE ═══ */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div style={{ position: "relative", flex: 1 }}>
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
          <button onClick={() => setStoreMode(true)} style={{
            padding: "14px 16px", borderRadius: 14, border: `1px solid ${t.bdr}`,
            background: t.card, cursor: "pointer", flexShrink: 0, fontFamily: "inherit",
            fontSize: 13, color: t.txM, display: "flex", alignItems: "center", gap: 5,
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.wine + "40"; e.currentTarget.style.color = t.wine; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.bdr; e.currentTarget.style.color = t.txM; }}
          ><span style={{ fontSize: 16 }}>🏪</span> I butiken?</button>
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
        <div style={{ marginBottom: 14, padding: "0 4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 13, color: t.txL }}>{loading ? "Laddar..." : `${filtered.length} produkter`}</span>
            <span style={{ fontSize: 11, color: t.txF }}>Mest smak för pengarna</span>
          </div>
          <div style={{ fontSize: 10, color: t.txF, marginTop: 3 }}>Rankade efter kvalitet i förhållande till pris — inte "bästa vinet", utan bästa värdet i sin kategori.</div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: t.txL }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            <p style={{ fontSize: 15, color: t.txM }}>Laddar...</p>
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
        ) : cat === "all" && !hasFilters ? (
          /* Situation-based sections when viewing "Alla" without filters */
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {[
              ["Bästa röda fynden", "Rött", null, null],
              ["Bästa vita just nu", "Vitt", null, null],
              ["Mest prisvärda bubbel", "Mousserande", null, null],
              ["Trygga köp under 100 kr", null, 0, 100],
              ["Mest smak för pengarna 100–200 kr", null, 100, 200],
            ].map(([title, catFilter, pLo, pHi]) => {
              const sectionWines = filtered
                .filter(p => (!catFilter || p.category === catFilter) && (!pLo && !pHi || (p.price >= (pLo||0) && p.price < (pHi||99999))))
                .slice(0, 5);
              if (sectionWines.length === 0) return null;
              return (
                <div key={title}>
                  <h3 style={{ margin: "0 0 10px", fontSize: 16, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>{title}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sectionWines.map((p, i) => <Card key={p.id || i} p={p} rank={i + 1} delay={0} allProducts={products} />)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.slice(0, 50).map((p, i) => <Card key={p.id || i} p={p} rank={i + 1} delay={Math.min(i * 0.04, 0.4)} allProducts={products} />)}
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
          <a href="https://smakfynd.substack.com" target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-block", padding: "12px 28px", borderRadius: 12, border: "none", cursor: "pointer",
              background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`,
              color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none",
              boxShadow: `0 2px 8px ${t.wine}25`, transition: "opacity 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >Prenumerera på Substack ↗</a>
          <p style={{ fontSize: 11, color: t.txL, margin: "10px 0 0" }}>Gratis. Avsluta när du vill.</p>
        </div>

        {/* ═══ FOOTER ═══ */}
        <footer style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${t.bdr}`, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: t.txL, lineHeight: 1.8 }}>
            <p style={{ margin: "0 0 8px" }}>
              Smakfynd hjälper dig hitta vinet som ger mest smak för pengarna.
            </p>
            <p style={{ margin: "0 0 10px", color: t.txM }}>
              Skapad av <strong>Gabriel Linton</strong> · Dryckeskunskap, Grythyttan · <strong>Olav Innovation AB</strong>
            </p>
            <a href="https://smakfynd.substack.com" target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-block", fontSize: 12, color: t.wine, textDecoration: "none", marginBottom: 10 }}>
              Prenumerera på Veckans fynd ↗
            </a>
          </div>
          <div style={{ fontSize: 10, color: t.txF, margin: "0 0 10px", lineHeight: 1.7 }}>
            <p style={{ margin: "0 0 4px" }}>Uppdaterad mars 2026 · Produktdata från Systembolagets öppna sortiment</p>
            <p style={{ margin: 0 }}>Smakfynd är en oberoende tjänst och har ingen koppling till, och är inte godkänd av, Systembolaget. Vi säljer inte alkohol.</p>
          </div>
          <p style={{ fontSize: 10, color: t.txF, fontStyle: "italic" }}>Njut med måtta.</p>
        </footer>
      </div>
    </div>
    </SavedContext.Provider>
  );
}
