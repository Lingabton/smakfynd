// ════════════════════════════════════════════════════════════
// constants.jsx
// ════════════════════════════════════════════════════════════
// src/constants.jsx
// ═══════════════════════════════════════════════════════════════
// SMAKFYND v7 — Real Data + Package Filter
// Smartare vinval på Systembolaget
// By Olav Innovation AB · Gabriel Linton
// ═══════════════════════════════════════════════════════════════

// Data: loaded async from wines.json, or embedded at build time as fallback
const DATA_URL = "wines.json";

// Analytics
const ANALYTICS_URL = "https://smakfynd-analytics.smakfynd.workers.dev";
const _sid = (() => {
  try {
    let s = sessionStorage.getItem("sf_sid");
    if (!s) { s = Math.random().toString(36).slice(2); sessionStorage.setItem("sf_sid", s); }
    return s;
  } catch(e) { return "anon"; }
})();
function track(event, data) {
  try {
    const device = window.innerWidth < 768 ? "mobile" : "desktop";
    fetch(ANALYTICS_URL + "/event", {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ session: _sid, event, wine_nr: data?.nr, data, page: location.hash || "/", device, referrer: document.referrer }),
      keepalive: true,
    }).catch(() => {});
  } catch(e) {}
}
function trackSearch(query, count, clickedNr) {
  try {
    fetch(ANALYTICS_URL + "/search", {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ session: _sid, query, results_count: count, clicked_nr: clickedNr }),
      keepalive: true,
    }).catch(() => {});
  } catch(e) {}
}
function trackAI(meal, response, latencyMs) {
  try {
    const wines = (response?.courses || []).flatMap(c => c.wines || []).map(w => w.nr).filter(Boolean).join(",");
    fetch(ANALYTICS_URL + "/ai", {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ session: _sid, meal, response, mode: response?.mode, wines_suggested: wines, latency_ms: latencyMs, model: "llama-3.1-70b" }),
      keepalive: true,
    }).catch(() => {});
  } catch(e) {}
}


const CATS = [
  { k:"all", l:"Alla" }, { k:"Rött", l:"Rött vin" },
  { k:"Vitt", l:"Vitt vin" }, { k:"Rosé", l:"Rosé" },
  { k:"Mousserande", l:"Bubbel" },
];
const PRICES = [
  { k:"all", l:"Alla priser" }, { k:"0-79", l:"Under 80 kr" },
  { k:"80-119", l:"80 – 119 kr" }, { k:"120-199", l:"120 – 199 kr" },
  { k:"200-299", l:"200 – 299 kr" }, { k:"300-499", l:"300 – 499 kr" }, { k:"500-9999", l:"500 kr +" },
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

// ════════════════════════════════════════════════════════════
// theme.jsx
// ════════════════════════════════════════════════════════════
// src/theme.jsx
// ── Design system ──
const t = {
  // Backgrounds
  bg: "#f5f1ea",
  surface: "#fdfbf7",
  card: "#ffffff",
  // Borders
  bdr: "#e2d8c8",
  bdrL: "#ede6da",
  // Brand — reserved for primary CTAs + brand mark only
  wine: "#8b2332",
  wineD: "#6b1a27",
  wineL: "#8b233210",
  // Text
  tx: "#1a1510",
  txM: "#3a2a1f",      // warm near-black for body links
  txL: "#6b6355",
  txF: "#9e9588",
  // Semantic
  green: "#3d7a4a",    // olive-green for positive signals (comparisons)
  greenL: "#3d7a4a10",
  deal: "#c44020",
  dealL: "#c4402010",
  gold: "#b08d40",
  // Shadows
  sh1: "0 1px 3px rgba(26,21,16,0.04)",
  sh2: "0 4px 12px rgba(26,21,16,0.06)",
  sh3: "0 8px 24px rgba(26,21,16,0.08)",
  shHover: "0 8px 28px rgba(26,21,16,0.10)",
  // Typography
  serif: "'Newsreader', Georgia, serif",
  sans: "'Inter', -apple-system, sans-serif",
};

// ── Shared styles ──
// STATUS pills: filled, one per card (Toppköp, Starkt fynd, EKO)
const statusPill = (label, color = t.green) => ({
  fontSize: 9, fontWeight: 700, fontFamily: t.sans,
  padding: "3px 8px", borderRadius: 6,
  background: color, color: "#fff",
  textTransform: "uppercase", letterSpacing: "0.04em",
  whiteSpace: "nowrap",
});

// VIBE pills: outlined, multiple per card (Prisvärt, Tryggt vardagsvin)
const vibePill = (color = t.txM) => ({
  fontSize: 9, fontFamily: t.sans,
  padding: "2px 7px", borderRadius: 100,
  background: "transparent",
  border: `1px solid ${color}30`,
  color: color, whiteSpace: "nowrap",
});

const pill = (active, accent = t.wine) => ({
  padding: "8px 16px", borderRadius: 100, cursor: "pointer", fontSize: 13,
  fontWeight: active ? 600 : 400, whiteSpace: "nowrap", fontFamily: "inherit",
  transition: "all 0.2s ease",
  border: active ? `1.5px solid ${accent}` : `1px solid ${t.bdr}`,
  background: active ? accent + "0c" : "transparent",
  color: active ? accent : t.txM,
  boxShadow: active ? `0 0 0 3px ${accent}08` : "none",
});

// ════════════════════════════════════════════════════════════
// utils.jsx
// ════════════════════════════════════════════════════════════
// src/utils.jsx
function rescale(raw) {
  if (raw >= 16) return Math.min(99, 90 + Math.round((raw - 16) * 5));
  if (raw >= 14) return Math.round(75 + (raw - 14) * 7.5);
  if (raw >= 12) return Math.round(60 + (raw - 12) * 7.5);
  if (raw >= 10) return Math.round(42 + (raw - 10) * 9);
  if (raw >= 8) return Math.round(22 + (raw - 8) * 10);
  return Math.max(1, Math.round(raw * 2.75));
}

// Shared wine similarity scoring — used by Card, StoreMode, and FoodMatch
function wineSimilarity(a, b) {
  const aGrapes = (a.grape || "").toLowerCase().split(",").map(g => g.trim()).filter(Boolean);
  const bGrapes = (b.grape || "").toLowerCase().split(",").map(g => g.trim()).filter(Boolean);
  let sim = 0;
  // Grape is strongest signal
  if (aGrapes.length > 0 && bGrapes.some(g => aGrapes.includes(g))) sim += 40;
  // Region
  if (a.region && b.region && a.region.toLowerCase() === b.region.toLowerCase()) sim += 20;
  // Style category
  if (a.cat3 && b.cat3 && a.cat3.toLowerCase() === b.cat3.toLowerCase()) sim += 15;
  // Taste profile
  if (a.taste_body && b.taste_body) sim += (1 - Math.abs(a.taste_body - b.taste_body) / 12) * 15;
  if (a.taste_fruit && b.taste_fruit) sim += (1 - Math.abs(a.taste_fruit - b.taste_fruit) / 12) * 5;
  // Country
  if (a.country && b.country && a.country === b.country) sim += 5;
  return sim;
}

function getScoreInfo(s100) {
  if (s100 >= 90) return ["Exceptionellt fynd", "#1a7a2e", "🏆"];
  if (s100 >= 80) return ["Toppköp", t.green, "⭐"];
  if (s100 >= 70) return ["Starkt fynd", "#5a7542", ""];
  if (s100 >= 60) return ["Bra köp", "#7a7054", ""];
  if (s100 >= 50) return ["Okej värde", "#8a7a6a", ""];
  return ["Svagt värde", "#8a7a6a", ""];
}

// ════════════════════════════════════════════════════════════
// components/ScoreBars.jsx
// ════════════════════════════════════════════════════════════
// src/components/ScoreBars.jsx
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

// ════════════════════════════════════════════════════════════
// components/ProductImage.jsx
// ════════════════════════════════════════════════════════════
// src/components/ProductImage.jsx
function getImageUrl(p) {
  if (p.image_url) return p.image_url;
  return null;
}

function ProductImage({ p, size = 52, style: extraStyle = {}, eager = false }) {
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
        loading={eager ? "eager" : "lazy"}
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

// ════════════════════════════════════════════════════════════
// hooks.jsx
// ════════════════════════════════════════════════════════════
// src/hooks.jsx
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

  const toggle = (nr, list = "favoriter", auth) => {
    const next = { ...data };
    const lists = next[nr] || [];
    if (lists.includes(list)) {
      const filtered = lists.filter(l => l !== list);
      if (filtered.length === 0) delete next[nr];
      else next[nr] = filtered;
      if (auth) auth.removeFromServer(nr, list);
    } else {
      next[nr] = [...lists, list];
      if (auth) auth.saveToServer(nr, list);
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

// ════════════════════════════════════════════════════════════
// components/WineActions.jsx
// ════════════════════════════════════════════════════════════
// src/components/WineActions.jsx — Rating, Alerts, Cellar actions for expanded card

function StarRating({ nr, auth }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [saved, setSaved] = useState(false);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: t.txL }}>Ditt betyg:</span>
      <div style={{ display: "flex", gap: 2 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star}
            onClick={e => {
              e.stopPropagation();
              if (!auth.user) return;
              setRating(star);
              setSaved(true);
              auth.rateWine(nr, star);
              track("rate", { nr, rating: star });
              setTimeout(() => setSaved(false), 2000);
            }}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            style={{
              fontSize: 18, cursor: auth.user ? "pointer" : "default",
              color: (hover || rating) >= star ? "#d4a84b" : t.bdr,
              transition: "color 0.15s, transform 0.15s",
              transform: hover >= star ? "scale(1.15)" : "scale(1)",
            }}
          >{(hover || rating) >= star ? "★" : "☆"}</span>
        ))}
      </div>
      {saved && <span style={{ fontSize: 10, color: t.green, fontWeight: 600 }}>Sparat!</span>}
      {!auth.user && <span style={{ fontSize: 10, color: t.txF }}>Logga in för att betygsätta</span>}
    </div>
  );
}

function AlertButton({ nr, wine, auth }) {
  const [showMenu, setShowMenu] = useState(false);
  const [alertSet, setAlertSet] = useState(null); // "price_drop" | "price_below" | etc

  if (!auth.user) return null;

  return (
    <div style={{ position: "relative" }}>
      <button onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11, color: alertSet ? t.wine : t.txM, background: alertSet ? `${t.wine}08` : "none",
          border: `1px solid ${alertSet ? t.wine + "30" : t.bdrL}`, borderRadius: 8,
          cursor: "pointer", padding: "6px 10px", fontFamily: "inherit", transition: "all 0.2s",
        }}>
        {alertSet ? "Larm aktivt" : "Fynd-larm"}
      </button>
      {showMenu && (
        <div onClick={e => e.stopPropagation()} style={{
          position: "absolute", top: "100%", left: 0, marginTop: 4, zIndex: 10,
          background: t.card, borderRadius: 12, border: `1px solid ${t.bdr}`,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: 12, minWidth: 220,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.tx, marginBottom: 8 }}>Bevaka {wine.name}</div>
          {[
            ["price_drop", "📉 Meddela vid prissänkning", "När priset sjunker"],
            ["price_below", `💰 Under ${Math.round(wine.price * 0.85)} kr`, `När priset går under ${Math.round(wine.price * 0.85)} kr`],
            ["back_in_stock", "📦 Tillbaka i sortiment", "När vinet kommer tillbaka"],
          ].map(([type, label, desc]) => (
            <button key={type} onClick={() => {
              auth.setAlert(nr, type, type === "price_below" ? Math.round(wine.price * 0.85) : null);
              setAlertSet(type);
              setShowMenu(false);
              track("alert_set", { nr, type });
            }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "8px 10px", borderRadius: 8, border: "none",
                background: alertSet === type ? `${t.green}10` : "transparent",
                cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                color: t.txM, transition: "background 0.15s", marginBottom: 2,
              }}
              onMouseEnter={e => e.currentTarget.style.background = t.bg}
              onMouseLeave={e => e.currentTarget.style.background = alertSet === type ? `${t.green}10` : "transparent"}
            >
              <div style={{ fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: 10, color: t.txL }}>{desc}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CellarButton({ nr, auth }) {
  const [status, setStatus] = useState(null); // null | "added" | "tasting"
  const [showTasting, setShowTasting] = useState(false);
  const [notes, setNotes] = useState("");
  const [occasion, setOccasion] = useState("");
  const [personalRating, setPersonalRating] = useState(0);

  if (!auth.user) return null;

  if (showTasting) {
    return (
      <div onClick={e => e.stopPropagation()} style={{
        padding: 14, borderRadius: 12, background: t.bg, border: `1px solid ${t.bdrL}`, marginTop: 8,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.tx, marginBottom: 8 }}>Provningsanteckning</div>
        <input type="text" value={occasion} onChange={e => setOccasion(e.target.value)}
          placeholder="Tillfälle (t.ex. fredagsmiddag, dejt)"
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${t.bdr}`, background: t.card, fontSize: 12, color: t.tx, outline: "none", boxSizing: "border-box", marginBottom: 6 }}
        />
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Dina tankar om vinet..."
          rows={2}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${t.bdr}`, background: t.card, fontSize: 12, color: t.tx, outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", marginBottom: 6 }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: t.txL }}>Betyg:</span>
          {[1, 2, 3, 4, 5].map(s => (
            <span key={s} onClick={() => setPersonalRating(s)}
              style={{ fontSize: 16, cursor: "pointer", color: personalRating >= s ? "#d4a84b" : t.bdr }}>
              {personalRating >= s ? "★" : "☆"}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => {
            auth.addToCellar(nr, "taste", { notes, occasion, rating: personalRating || null });
            setStatus("tasted");
            setShowTasting(false);
            track("cellar_taste", { nr });
          }}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: t.wine, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Spara
          </button>
          <button onClick={() => setShowTasting(false)}
            style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${t.bdr}`, background: t.card, color: t.txM, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            Avbryt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 6 }}>
      {status !== "added" && (
        <button onClick={e => {
          e.stopPropagation();
          auth.addToCellar(nr, "add");
          setStatus("added");
          track("cellar_add", { nr });
        }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 11, color: t.txM, background: "none",
            border: `1px solid ${t.bdrL}`, borderRadius: 8,
            cursor: "pointer", padding: "6px 10px", fontFamily: "inherit",
          }}>
          Lägg i källaren
        </button>
      )}
      {status === "added" && <span style={{ fontSize: 11, color: t.green, padding: "6px 10px" }}>✓ I källaren</span>}
      <button onClick={e => { e.stopPropagation(); setShowTasting(true); }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11, color: t.txM, background: "none",
          border: `1px solid ${t.bdrL}`, borderRadius: 8,
          cursor: "pointer", padding: "6px 10px", fontFamily: "inherit",
        }}>
        Har provats
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// components/Card.jsx
// ════════════════════════════════════════════════════════════
// src/components/Card.jsx — Redesigned wine card
function Card({ p, rank, delay, allProducts, autoOpen, auth }) {
  const [open, setOpen] = useState(!!autoOpen || (rank === 1 && !autoOpen));
  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) track("click", { nr: p.nr, name: p.name, score: p.smakfynd_score, rank });
  };
  const sv = React.useContext(SavedContext);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const s100 = p.smakfynd_score;
  const [label, col] = getScoreInfo(s100);
  const sbUrl = `https://www.systembolaget.se/produkt/vin/${p.nr}`;

  // Split score: approximate kvalitet vs prisvärde contribution
  const qualPct = 75;
  const pricePct = 25;
  const qualBar = Math.min(100, ((p.crowd_score || 5) / 10) * 100);
  const priceBar = Math.min(100, ((p.price_score || 5) / 10) * 100);

  // Comparison wine: find expensive wine that actually tastes similar
  const comparison = useMemo(() => {
    if (!allProducts || !p.crowd_score || p.crowd_score < 7 || p.price > 250) return null;
    const myGrape = (p.grape || "").toLowerCase().split(",")[0].trim();
    const myBody = p.taste_body || 0;
    const myFruit = p.taste_fruit || 0;

    // Find expensive wines with similar taste profile
    const candidates = allProducts
      .filter(w => {
        if (w.nr === p.nr || w.category !== p.category || w.package !== p.package) return false;
        if (w.price < p.price * 2 || w.price < 180) return false;
        if (!w.crowd_score || w.crowd_score < p.crowd_score - 0.5) return false;

        // Must share grape OR similar taste profile
        const wGrapes = (w.grape || "").toLowerCase().split(",").map(g => g.trim()).filter(Boolean);
        const myGrapes = (p.grape || "").toLowerCase().split(",").map(g => g.trim()).filter(Boolean);
        const sameGrape = myGrapes.length > 0 && wGrapes.some(g => myGrapes.includes(g));
        const similarTaste = myBody && w.taste_body && Math.abs(w.taste_body - myBody) <= 1
          && (!myFruit || !w.taste_fruit || Math.abs(w.taste_fruit - myFruit) <= 2);

        return sameGrape || similarTaste;
      })
      .sort((a, b) => {
        // Prefer: same grape > similar taste, then highest price (most impressive comparison)
        const aGrape = (a.grape || "").toLowerCase().split(",")[0].trim() === myGrape ? 10 : 0;
        const bGrape = (b.grape || "").toLowerCase().split(",")[0].trim() === myGrape ? 10 : 0;
        return (bGrape - aGrape) || (b.price - a.price);
      });

    return candidates[0] || null;
  }, [p.nr, allProducts]);

  // Metadata line
  const meta = [p.country, p.region, p.grape].filter(Boolean).join(" · ");
  const foodStr = (p.food_pairings || []).slice(0, 3).join(", ");

  return (
    <div
      role="button" tabIndex={0} aria-expanded={open}
      aria-label={`${p.name} ${p.sub || ''}, ${s100} poäng, ${p.price}\u00A0kr`}
      onClick={handleOpen}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleOpen(); } }}
      style={{
        background: t.card, borderRadius: 14, outline: "none",
        border: `1px solid ${open ? t.bdr : t.bdrL}`,
        boxShadow: open ? t.sh3 : t.sh1,
        transition: "all 0.25s ease", overflow: "hidden",
        animation: delay ? `slideUp 0.35s ease ${delay}s both` : undefined,
        cursor: "pointer",
      }}
    >
      {/* ═══ COLLAPSED: Primary info ═══ */}
      <div style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Image */}
        <ProductImage p={p} size={48} eager={rank <= 3} />

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Row 1: Rank + Name + Status pill */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 12, color: t.txL, fontFamily: t.serif, fontWeight: 400, flexShrink: 0 }}>#{rank}</span>
            <h3 style={{
              margin: 0, fontSize: 16, fontFamily: t.serif,
              fontWeight: 400, color: t.tx, lineHeight: 1.2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{p.name}</h3>
            {p.organic && <span style={statusPill("EKO", t.green)}>EKO</span>}
            {!p.organic && s100 >= 80 && <span style={statusPill("Toppköp", t.green)}>Toppköp</span>}
            {!p.organic && s100 >= 70 && s100 < 80 && <span style={statusPill("Starkt fynd", "#5a7542")}>Starkt fynd</span>}
          </div>

          {/* Row 2: Sub + Price */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 2 }}>
            <span style={{ fontSize: 12, color: t.txL, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.sub}
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: t.tx, fontFamily: t.serif, flexShrink: 0, marginLeft: 8 }}>
              {p.price}{"\u00A0"}<span style={{ fontSize: 11, fontWeight: 400, color: t.txL }}>kr</span>
            </span>
          </div>

          {/* Row 3: Comparison line */}
          {comparison && (() => {
            const cGrape = (comparison.grape || "").toLowerCase().split(",")[0].trim();
            const pGrape = (p.grape || "").toLowerCase().split(",")[0].trim();
            const sameGrape = pGrape && cGrape && cGrape === pGrape;
            const savings = Math.round(comparison.price - p.price);
            const cCrowd = comparison.crowd_score ? comparison.crowd_score.toFixed(1) : null;
            const label = sameGrape
              ? `Samma druva som ${comparison.name} (${Math.round(comparison.price)}\u00A0kr) — du sparar ${savings}\u00A0kr`
              : `Liknande smakmönster som ${comparison.name} (${Math.round(comparison.price)}\u00A0kr) — du sparar ${savings}\u00A0kr`;
            return (
            <div style={{ marginTop: 4, fontSize: 11, color: t.green, fontWeight: 500 }}>
              {label}
              {cCrowd && <span style={{ marginLeft: 4, fontSize: 10, color: t.txL }}>(vindrickare ger {cCrowd}/10)</span>}
            </div>
            );
          })()}

          {/* Row 4: Vibe pills */}
          {(() => {
            const vibes = [];
            if (p.price_score >= 8) vibes.push("Prisvärt");
            if (p.crowd_reviews >= 5000 && p.crowd_score >= 7.5) vibes.push("Tryggt vardagsvin");
            if ((p.food_pairings || []).some(f => /kött|grillat/i.test(f)) && (p.taste_body || 0) >= 7) vibes.push("Fynd till grillat");
            if (p.price <= 100 && s100 >= 70) vibes.push("Budgetfavorit");
            if (p.expert_score >= 8) vibes.push("Kritikerfavorit");
            return vibes.length > 0 ? (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                {vibes.slice(0, 3).map(v => <span key={v} style={vibePill(t.txM)}>{v}</span>)}
              </div>
            ) : null;
          })()}

          {/* Row 5: Metadata */}
          <div style={{ marginTop: 3, fontSize: 11, color: t.txL }}>
            {meta}{foodStr ? ` · ${foodStr}` : ""}
          </div>
        </div>

        {/* Score with split bars + "?" */}
        <div style={{ flexShrink: 0, textAlign: "center", width: 58, position: "relative" }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: col, lineHeight: 1, fontFamily: t.serif }}>{s100}</div>
          <div style={{ fontSize: 10, color: col, marginTop: 3, marginBottom: 5, fontWeight: 600 }}>{label}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 9, color: t.txL, width: 12 }}>K</span>
              <div style={{ flex: 1, height: 5, borderRadius: 3, background: t.bdrL }}>
                <div style={{ width: `${qualBar}%`, height: "100%", borderRadius: 3, background: "#6b8cce" }} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 9, color: t.txL, width: 12 }}>P</span>
              <div style={{ flex: 1, height: 5, borderRadius: 3, background: t.bdrL }}>
                <div style={{ width: `${priceBar}%`, height: "100%", borderRadius: 3, background: t.green }} />
              </div>
            </div>
          </div>
          <button onClick={e => { e.stopPropagation(); setShowScoreInfo(!showScoreInfo); }}
            style={{ fontSize: 11, color: t.txL, background: "none", border: `1px solid ${t.bdrL}`, borderRadius: 4, cursor: "pointer", fontFamily: t.sans, marginTop: 5, padding: "1px 6px", lineHeight: 1.4 }}>?</button>
          {showScoreInfo && (
            <div onClick={e => e.stopPropagation()} style={{
              position: "absolute", bottom: "100%", right: -4, marginBottom: 6, zIndex: 10,
              width: 240, padding: 12, borderRadius: 10,
              background: t.card, border: `1px solid ${t.bdr}`, boxShadow: t.sh3,
              textAlign: "left", fontSize: 11, color: t.txM, lineHeight: 1.5,
            }}>
              <div style={{ fontFamily: t.serif, fontSize: 13, fontWeight: 600, color: t.tx, marginBottom: 6 }}>Hur räknas poängen?</div>
              <p style={{ margin: "0 0 6px" }}><strong style={{ color: "#6b8cce" }}>Kvalitet (75%)</strong> — snitt av crowd-betyg (Vivino) och expertbetyg.</p>
              <p style={{ margin: "0 0 6px" }}><strong style={{ color: t.green }}>Prisvärde (25%)</strong> — literpris jämfört med kategorins median.</p>
              <p style={{ margin: "0 0 8px" }}>Ekologiska viner får en liten bonus.</p>
              <div style={{ fontSize: 9, color: t.txL, marginBottom: 4 }}>KRITIKER</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {["Suckling", "Decanter", "Falstaff", "Wine Spectator", "Wine Enthusiast", "Vinous"].map(c => (
                  <span key={c} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: t.bg, color: t.txL }}>{c}</span>
                ))}
              </div>
              <a href="#" onClick={e => { e.preventDefault(); const el = document.querySelector('[id*="section"]'); if (el) el.scrollIntoView({ behavior: "smooth" }); setShowScoreInfo(false); }}
                style={{ display: "block", marginTop: 8, fontSize: 10, color: t.wine }}>Läs mer om metoden →</a>
            </div>
          )}
        </div>
      </div>

      {/* ═══ ACTION ROW — visible on hover/tap ═══ */}
      <div style={{
        padding: "0 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center",
        opacity: open ? 1 : 0.6, transition: "opacity 0.2s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a href={sbUrl} target="_blank" rel="noopener noreferrer" onClick={e => { e.stopPropagation(); track("sb_click", { nr: p.nr, name: p.name, price: p.price }); }}
            style={{ fontSize: 11, color: t.txM, textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center", padding: "0 4px" }}
            aria-label={`Köp ${p.name} på Systembolaget (öppnas i nytt fönster)`}
          >Systembolaget</a>
          {sv && <SaveButton nr={p.nr || p.id} sv={sv} auth={auth} />}
          <button onClick={e => {
              e.stopPropagation();
              track("share", { nr: p.nr, name: p.name });
              const url = `https://smakfynd.se/#vin/${p.nr}`;
              const text = `${p.name} ${p.sub || ''} \u2014 ${p.smakfynd_score}/100 på Smakfynd (${p.price}\u00A0kr)`;
              if (navigator.share) { navigator.share({ title: p.name, text, url }).catch(() => {}); }
              else {
                navigator.clipboard?.writeText(`${text}\n${url}`);
                const btn = e.currentTarget; btn.textContent = "Kopierad!"; btn.style.color = t.green;
                setTimeout(() => { btn.textContent = "Dela"; btn.style.color = t.txL; }, 2000);
              }
            }}
            style={{ fontSize: 11, color: t.txL, background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontFamily: "inherit", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
            Dela
          </button>
        </div>
        <span style={{ fontSize: 10, color: t.txF }}>
          {open ? "Stäng" : "Smakprofil & jämförbara"}
        </span>
      </div>

      {/* ═══ EXPANDED: Detail panel ═══ */}
      {open && (
        <div style={{ borderTop: `1px solid ${t.bdrL}`, padding: "14px 16px 16px" }}>
          {/* Desktop: two-column. Mobile: single column */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {/* Left: taste profile + details */}
            <div style={{ flex: "1 1 280px", minWidth: 0 }}>
              {/* Taste description */}
              {p.style && <div style={{ fontSize: 12, color: t.txM, fontStyle: "italic", marginBottom: 12, lineHeight: 1.5 }}>{p.style}</div>}

              {/* Taste sliders */}
              {(p.taste_body || p.taste_fruit || p.taste_sweet != null) && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Smakprofil</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      ["Lätt", "Fylligt", p.taste_body, 12],
                      ["Stram", "Fruktigt", p.taste_fruit, 12],
                      ["Torrt", "Sött", p.taste_sweet, 12],
                    ].filter(([_a, _b, v]) => v != null && v > 0).map(([lo, hi, val, max]) => (
                      <div key={lo} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, color: t.txL, width: 38, textAlign: "right", flexShrink: 0 }}>{lo}</span>
                        <div style={{ flex: 1, height: 3, borderRadius: 2, background: t.bdr, position: "relative" }}>
                          <div style={{
                            position: "absolute", top: "50%", left: `${(val / max) * 100}%`,
                            width: 8, height: 8, borderRadius: "50%",
                            background: t.wine, border: `2px solid ${t.card}`,
                            transform: "translate(-50%, -50%)", boxShadow: `0 0 0 1px ${t.wine}40`,
                          }} />
                        </div>
                        <span style={{ fontSize: 10, color: t.txL, width: 38, flexShrink: 0 }}>{hi}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Score breakdown */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Poängfördelning</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                      <span style={{ color: "#6b8cce", fontWeight: 600 }}>Crowd</span>
                      <span style={{ fontWeight: 700, color: "#6b8cce" }}>{p.crowd_score ? `${p.crowd_score.toFixed(1)}/10` : "\u2014"}</span>
                    </div>
                    {p.crowd_score && <div style={{ height: 3, borderRadius: 2, background: t.bdr }}><div style={{ width: `${p.crowd_score * 10}%`, height: "100%", borderRadius: 2, background: "#6b8cce" }} /></div>}
                    {p.crowd_reviews && <div style={{ fontSize: 10, color: t.txL, marginTop: 2 }}>{p.crowd_reviews > 999 ? `${(p.crowd_reviews / 1000).toFixed(0)}k` : p.crowd_reviews} omdömen</div>}
                  </div>
                  {p.expert_score && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                        <span style={{ color: "#b07d3b", fontWeight: 600 }}>Expert</span>
                        <span style={{ fontWeight: 700, color: "#b07d3b" }}>{p.expert_score.toFixed(1)}/10</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 2, background: t.bdr }}><div style={{ width: `${p.expert_score * 10}%`, height: "100%", borderRadius: 2, background: "#b07d3b" }} /></div>
                      {p.critics && p.critics.length > 0 && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                          {p.critics.map((cr, ci) => (
                            <span key={ci} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#b07d3b10", color: "#b07d3b" }}>{cr.c}: {cr.s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                      <span style={{ color: t.txM, fontWeight: 600 }}>Prisvärde</span>
                      <span style={{ fontWeight: 700, color: t.txM }}>{p.price_score ? `${p.price_score.toFixed(1)}/10` : "\u2014"}</span>
                    </div>
                    {p.price_score && <div style={{ height: 3, borderRadius: 2, background: t.bdr }}><div style={{ width: `${p.price_score * 10}%`, height: "100%", borderRadius: 2, background: t.txM }} /></div>}
                  </div>
                </div>
              </div>

              {/* Price drop */}
              {p.launch_price && p.price_vs_launch_pct > 0 && (
                <div style={{ padding: "8px 12px", borderRadius: 8, background: t.dealL, marginBottom: 14, fontSize: 12, color: t.deal }}>
                  Lanserades för {p.launch_price}{"\u00A0"}kr, nu {p.price}{"\u00A0"}kr. Du sparar {p.launch_price - p.price}{"\u00A0"}kr.
                </div>
              )}
            </div>

            {/* Right: similar wines */}
            {allProducts && (() => {
              const myGrapes = (p.grape || "").toLowerCase().split(",").map(g => g.trim()).filter(Boolean);
              const similar = allProducts
                .filter(w => w.category === p.category && w.package === p.package && w.assortment === "Fast sortiment" && (w.nr || w.id) !== (p.nr || p.id))
                .map(w => {
                  let sim = wineSimilarity(w, p);
                  if (Math.abs(w.price - p.price) <= 40) sim += 5;
                  sim += Math.max(0, (w.smakfynd_score - p.smakfynd_score)) * 1;
                  const wGrapes = (w.grape || "").toLowerCase().split(",").map(g => g.trim()).filter(Boolean);
                  const sameGrape = myGrapes.length > 0 && wGrapes.some(g => myGrapes.includes(g));
                  const sameRegion = p.region && w.region && p.region.toLowerCase() === w.region.toLowerCase();
                  return { ...w, _sim: sim, _sameGrape: sameGrape, _sameRegion: sameRegion };
                })
                .filter(w => w._sim >= 15)
                .sort((a, b) => b._sim - a._sim)
                .slice(0, 3);
              if (similar.length === 0) return null;
              return (
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <div style={{ fontSize: 9, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Jämförbara viner</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {similar.map((w, i) => (
                      <div key={i}
                        onClick={e => { e.stopPropagation(); window.location.hash = `vin/${w.nr}`; window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: t.bg, cursor: "pointer", transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = t.bdrL}
                        onMouseLeave={e => e.currentTarget.style.background = t.bg}
                      >
                        <span style={{ fontSize: 16, fontWeight: 900, color: col, fontFamily: t.serif, width: 28, textAlign: "center" }}>{w.smakfynd_score}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: t.tx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.name}</div>
                          <div style={{ fontSize: 10, color: t.txL }}>{w.country} · {w.price}{"\u00A0"}kr{w._sameGrape ? " · samma druva" : w._sameRegion ? " · samma region" : ""}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Premium actions */}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${t.bdrL}` }}>
            <StarRating nr={p.nr} auth={auth} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              <AlertButton nr={p.nr} wine={p} auth={auth} />
              <CellarButton nr={p.nr} auth={auth} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// components/SaveButton.jsx
// ════════════════════════════════════════════════════════════
// src/components/SaveButton.jsx
function SaveButton({ nr, sv, auth }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const saved = sv.isSaved(nr);
  const lists = sv.getLists(nr);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button onClick={e => { e.stopPropagation(); if (saved) { setMenuOpen(!menuOpen); } else { sv.toggle(nr, "favoriter", auth); track("save", { nr, list: "favoriter" }); } }}
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
            <button key={list.k} onClick={e => { e.stopPropagation(); sv.toggle(nr, list.k, auth); }}
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

// ════════════════════════════════════════════════════════════
// components/AIQuestion.jsx
// ════════════════════════════════════════════════════════════
// src/components/AIQuestion.jsx
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

// ════════════════════════════════════════════════════════════
// components/LoginModal.jsx
// ════════════════════════════════════════════════════════════
// src/components/LoginModal.jsx
const AUTH_URL = "https://smakfynd-auth.smakfynd.workers.dev";

function LoginModal({ onClose, onLogin }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1); // 1=email, 2=code
  const [newsletter, setNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSendCode = async () => {
    if (!email.includes("@")) { setError("Ange en giltig email"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(AUTH_URL + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newsletter }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.status === "code_sent") {
        setStep(2);
      }
    } catch (e) {
      setError(e.message || "Kunde inte skicka kod");
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (code.length < 6) { setError("Ange 6-siffrig kod"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(AUTH_URL + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newsletter }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      try { localStorage.setItem("sf_token", data.token); localStorage.setItem("sf_user", JSON.stringify(data.user)); } catch(e) {}
      onLogin(data);
    } catch (e) {
      setError(e.message || "Felaktig kod");
    }
    setLoading(false);
  };

  useEffect(() => {
    const handleEsc = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Logga in" style={{
      position: "fixed", inset: 0, background: "rgba(30,23,16,0.5)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: t.card, borderRadius: 20, padding: "32px 28px", maxWidth: 380, width: "100%",
        boxShadow: "0 20px 60px rgba(30,23,16,0.2)", animation: "scaleIn 0.2s ease",
      }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, fontFamily: t.serif, fontWeight: 400, color: t.tx }}>
          {step === 1 ? "Logga in" : "Ange kod"}
        </h2>

        {step === 1 ? (
          <>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: t.txL, lineHeight: 1.5 }}>
              Vi skickar en verifieringskod till din email. Inget lösenord behövs.
            </p>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="din@email.se"
              onKeyDown={e => e.key === "Enter" && handleSendCode()}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 12,
                border: `1px solid ${t.bdr}`, background: t.bg, fontSize: 14,
                color: t.tx, outline: "none", boxSizing: "border-box", marginBottom: 12,
              }}
            />
            <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)}
                style={{ marginTop: 3, accentColor: t.wine }} />
              <span style={{ fontSize: 12, color: t.txM, lineHeight: 1.5 }}>
                Ja, jag vill få veckans bästa vinköp via email
              </span>
            </label>
            <button onClick={handleSendCode} disabled={loading}
              style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`,
                color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer",
                fontFamily: "inherit", opacity: loading ? 0.7 : 1,
              }}>
              {loading ? "Skickar..." : "Skicka verifieringskod"}
            </button>
          </>
        ) : (
          <>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: t.txL, lineHeight: 1.5 }}>
              Vi har skickat en 6-siffrig kod till <strong>{email}</strong>
            </p>
            <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456" inputMode="numeric" autoFocus
              onKeyDown={e => e.key === "Enter" && handleVerify()}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 12,
                border: `1px solid ${t.bdr}`, background: t.bg, fontSize: 24,
                color: t.tx, outline: "none", boxSizing: "border-box", marginBottom: 12,
                textAlign: "center", letterSpacing: "0.3em", fontFamily: "monospace",
              }}
            />
            <button onClick={handleVerify} disabled={loading || code.length < 6}
              style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`,
                color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer",
                fontFamily: "inherit", opacity: (loading || code.length < 6) ? 0.7 : 1,
              }}>
              {loading ? "Verifierar..." : "Logga in"}
            </button>
            <button onClick={() => { setStep(1); setCode(""); setError(null); }}
              style={{ display: "block", margin: "10px auto 0", fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer" }}>
              Byt email
            </button>
          </>
        )}

        {error && <p style={{ fontSize: 12, color: t.deal, margin: "10px 0 0" }}>{error}</p>}

        <p style={{ fontSize: 10, color: t.txF, margin: "12px 0 0", textAlign: "center", lineHeight: 1.5 }}>
          Genom att logga in godkänner du vår <a href="/integritet/" target="_blank" style={{ color: t.txL }}>integritetspolicy</a>.
        </p>

        <button onClick={onClose} style={{
          display: "block", margin: "12px auto 0", fontSize: 12, color: t.txL,
          background: "none", border: "none", cursor: "pointer", textDecoration: "underline",
        }}>Avbryt</button>
      </div>
    </div>
  );
}

function useAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sf_user")); } catch(e) { return null; }
  });
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem("sf_token"); } catch(e) { return null; }
  });

  const login = (data) => {
    setUser(data.user);
    setToken(data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try { localStorage.removeItem("sf_token"); localStorage.removeItem("sf_user"); } catch(e) {}
  };

  const syncWines = async (localWines) => {
    if (!token) return localWines;
    try {
      const res = await fetch(AUTH_URL + "/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, wines: localWines }),
      });
      const data = await res.json();
      if (data.wines) return data.wines;
    } catch(e) {}
    return localWines;
  };

  const saveToServer = (nr, list) => {
    if (!token) return;
    fetch(AUTH_URL + "/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, nr, list }),
      keepalive: true,
    }).catch(() => {});
  };

  const removeFromServer = (nr, list) => {
    if (!token) return;
    fetch(AUTH_URL + "/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, nr, list }),
      keepalive: true,
    }).catch(() => {});
  };

  // Premium features
  const rateWine = (nr, rating, notes) => {
    if (!token) return;
    fetch(AUTH_URL + "/rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, nr, rating, notes }),
      keepalive: true,
    }).catch(() => {});
  };

  const setAlert = (nr, alertType, threshold) => {
    if (!token) return;
    return fetch(AUTH_URL + "/alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, nr, alert_type: alertType, threshold }),
    }).then(r => r.json()).catch(() => ({}));
  };

  const removeAlert = (nr, alertType) => {
    if (!token) return;
    fetch(AUTH_URL + "/remove-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, nr, alert_type: alertType }),
      keepalive: true,
    }).catch(() => {});
  };

  const addToCellar = (nr, action, data) => {
    if (!token) return;
    return fetch(AUTH_URL + "/cellar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, nr, action, ...data }),
    }).then(r => r.json()).catch(() => ({}));
  };

  const getRatings = async () => {
    if (!token) return [];
    try {
      const res = await fetch(AUTH_URL + "/ratings?token=" + token);
      const data = await res.json();
      return data.ratings || [];
    } catch(e) { return []; }
  };

  const getAlerts = async () => {
    if (!token) return [];
    try {
      const res = await fetch(AUTH_URL + "/alerts?token=" + token);
      const data = await res.json();
      return data.alerts || [];
    } catch(e) { return []; }
  };

  const getCellar = async () => {
    if (!token) return [];
    try {
      const res = await fetch(AUTH_URL + "/cellar?token=" + token);
      const data = await res.json();
      return data.cellar || [];
    } catch(e) { return []; }
  };

  return { user, token, login, logout, syncWines, saveToServer, removeFromServer,
           rateWine, setAlert, removeAlert, addToCellar, getRatings, getAlerts, getCellar };
}

// ════════════════════════════════════════════════════════════
// components/FoodMatch.jsx
// ════════════════════════════════════════════════════════════
// src/components/FoodMatch.jsx
const WINE_AI_URL = "https://smakfynd-wine-ai.smakfynd.workers.dev";

function matchWinesForCourses(courses, products) {
  if (!courses || !courses.length) return [];
  const bodyRange = { light: [0, 4], medium: [5, 8], full: [9, 12], lätt: [0, 4], medelkroppad: [5, 8], fylligt: [9, 12], "fyllig": [9, 12], "medel": [5, 8] };
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
          // Body match — skip wines without taste data instead of defaulting
          const body = p.taste_body;
          if (body) {
            if (body >= bMin && body <= bMax) fit += 3;
            else if (Math.abs(body - (bMin + bMax) / 2) <= 2) fit += 1;
          }
          // Keyword matching with word boundaries
          const haystack = " " + [p.name, p.sub, p.grape, p.style, p.cat3, ...(p.food_pairings || [])].join(" ").toLowerCase() + " ";
          for (const k of kw) { if (haystack.includes(" " + k) || haystack.includes(k + " ")) fit += 2; }
          return { ...p, _fit: fit, _why: c.why, _label: c.label || "" };
        })
        .filter(p => p._fit >= 3 && !usedNrs.has(p.nr))
        .sort((a, b) => (b._fit * 3 + b.smakfynd_score) - (a._fit * 3 + a.smakfynd_score));

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
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 400, fontFamily: t.serif, color: t.tx }}>Kvällens middag?</div>
        <div style={{ fontSize: 12, color: t.txL }}>Beskriv vad du ska äta, vi föreslår vinet.</div>
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

// ════════════════════════════════════════════════════════════
// components/NewsletterCTA.jsx
// ════════════════════════════════════════════════════════════
// src/components/NewsletterCTA.jsx
function NewsletterCTA({ compact = false }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // null | "loading" | "done" | "error"

  const handleSubmit = async () => {
    if (!email.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch("https://smakfynd-auth.smakfynd.workers.dev/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("done");
        track("subscribe", { source: compact ? "inline" : "section" });
      } else {
        setStatus("error");
      }
    } catch (e) {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div style={{
        padding: compact ? "12px 16px" : "20px 22px", borderRadius: 14,
        background: `${t.green}08`, border: `1px solid ${t.green}20`,
        textAlign: "center", margin: compact ? "8px 0" : "20px 0",
      }}>
        <div style={{ fontSize: 20, marginBottom: 4 }}>✓</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.green }}>Tack!</div>
        <div style={{ fontSize: 12, color: t.txM }}>Du får veckans bästa fynd i din inbox.</div>
      </div>
    );
  }

  if (compact) {
    return (
      <div style={{
        display: "flex", gap: 8, padding: "14px 16px", borderRadius: 14,
        background: t.surface, border: `1px solid ${t.bdr}`, margin: "8px 0",
        alignItems: "center",
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.tx }}>Veckans bästa vinköp i din inbox</div>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="din@email.se"
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${t.bdr}`, background: t.card, fontSize: 13, color: t.tx, outline: "none", boxSizing: "border-box", minWidth: 0 }}
            />
            <button onClick={handleSubmit} disabled={status === "loading"}
              style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: t.wine, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, opacity: status === "loading" ? 0.6 : 1 }}>
              {status === "loading" ? "..." : "Prenumerera"}
            </button>
          </div>
          {status === "error" && <div style={{ fontSize: 11, color: t.deal, marginTop: 4 }}>Något gick fel, försök igen.</div>}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: "24px 22px", borderRadius: 16, margin: "24px 0",
      background: `linear-gradient(145deg, ${t.wine}06, ${t.wine}03)`,
      border: `1px solid ${t.wine}15`,
    }}>
      <div style={{ fontSize: 18, fontFamily: t.serif, color: t.tx, marginBottom: 4 }}>
        Missa inte veckans vinköp
      </div>
      <p style={{ fontSize: 13, color: t.txM, margin: "0 0 12px", lineHeight: 1.5 }}>
        Varje vecka skickar vi de bästa fynden — prissänkta viner, nya topprankade och Gabriels personliga val. Gratis, ingen spam.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="din@email.se"
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: `1px solid ${t.bdr}`, background: t.card, fontSize: 14, color: t.tx, outline: "none", boxSizing: "border-box" }}
        />
        <button onClick={handleSubmit} disabled={status === "loading"}
          style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, opacity: status === "loading" ? 0.6 : 1 }}>
          {status === "loading" ? "Skickar..." : "Prenumerera"}
        </button>
      </div>
      {status === "error" && <div style={{ fontSize: 12, color: t.deal, marginTop: 6 }}>Något gick fel, försök igen.</div>}
      <p style={{ fontSize: 10, color: t.txF, margin: "8px 0 0" }}>
        Vi skickar max 1 mail/vecka. Avsluta när du vill.
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// components/WineOfDay.jsx
// ════════════════════════════════════════════════════════════
// src/components/WineOfDay.jsx
function WineOfDay({ products, onSelect }) {
  const pick = useMemo(() => {
    if (!products || products.length < 50) return null;
    const today = new Date().toISOString().slice(0, 10);
    const hash = [...today].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
    const top = products
      .filter(p => p.assortment === "Fast sortiment" && p.package === "Flaska" && p.smakfynd_score >= 70 && p.price <= 250)
      .sort((a, b) => b.smakfynd_score - a.smakfynd_score)
      .slice(0, 80);
    return top.length > 0 ? top[Math.abs(hash) % top.length] : null;
  }, [products]);

  if (!pick) return null;

  const [_label, col] = getScoreInfo(pick.smakfynd_score);

  return (
    <div style={{ marginBottom: 14, padding: "14px 16px", borderRadius: 14, background: `linear-gradient(135deg, ${t.wine}06, ${t.wine}03)`, border: `1px solid ${t.wine}12` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }} aria-hidden="true">✦</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: t.wine, textTransform: "uppercase", letterSpacing: "0.08em" }}>Dagens vin</span>
        <span style={{ fontSize: 10, color: t.txF, marginLeft: "auto" }}>{new Date().toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}</span>
      </div>
      <div
        role="button" tabIndex={0}
        onClick={() => onSelect && onSelect(pick.nr)}
        onKeyDown={e => { if (e.key === "Enter") onSelect && onSelect(pick.nr); }}
        style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}
      >
        <ProductImage p={pick} size={48} eager={true} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontFamily: t.serif, color: t.tx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pick.name}</div>
          <div style={{ fontSize: 12, color: t.txL }}>{pick.sub} · {pick.country} · {pick.grape}</div>
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `${col}15`, border: `2px solid ${col}30`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: col, lineHeight: 1, fontFamily: t.serif }}>{pick.smakfynd_score}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: t.tx, fontFamily: t.serif, marginTop: 4 }}>
            {pick.price}<span style={{ fontSize: 10, fontWeight: 400, color: t.txL }}>kr</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// components/Methodology.jsx
// ════════════════════════════════════════════════════════════
// src/components/Methodology.jsx
function Methodology() {
  return (
    <div style={{
      maxWidth: 640, margin: "0 auto", padding: "80px 20px 60px",
      borderTop: `1px solid ${t.bdrL}`,
    }}>
      <h2 style={{
        margin: "0 0 20px", fontSize: 24,
        fontFamily: t.serif, fontWeight: 400,
        color: t.tx, lineHeight: 1.2,
      }}>Så fungerar Smakfynd-poängen</h2>

      <p style={{ margin: "0 0 16px", fontSize: 14, color: t.txM, lineHeight: 1.7 }}>
        Varje vin får en poäng mellan 0 och 100, baserad på tre saker:
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
        <div>
          <div style={{ marginBottom: 2 }}>
            <span style={{ fontFamily: t.serif, fontSize: 20, color: t.tx }}>75 %</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: t.tx, marginLeft: 8 }}>Kvalitet</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: t.txM, lineHeight: 1.6 }}>
            Vägt snitt av crowd-betyg från Vivino och expertbetyg från upp till sex kritiker (Suckling, Decanter, Falstaff m.fl.). Konsensusbonus när crowd och experter är överens.
          </p>
        </div>

        <div>
          <div style={{ marginBottom: 2 }}>
            <span style={{ fontFamily: t.serif, fontSize: 20, color: t.tx }}>25 %</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: t.tx, marginLeft: 8 }}>Prisvärde</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: t.txM, lineHeight: 1.6 }}>
            Literpriset jämfört med medianen i samma kategori. Ett rött vin för 112 kr får hög prisvärde-poäng eftersom medianen är 279 kr.
          </p>
        </div>

        <div>
          <div style={{ marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: t.tx }}>Eko-bonus</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: t.txM, lineHeight: 1.6 }}>
            En liten bonus för ekologiska viner.
          </p>
        </div>
      </div>

      <p style={{ margin: "0 0 0", fontSize: 14, color: t.tx, lineHeight: 1.7, fontWeight: 500 }}>
        Resultatet: en enda siffra som säger hur mycket smak du får per krona — inte hur prestigefullt vinet är.
      </p>

      <hr style={{ border: "none", borderTop: `1px solid ${t.bdrL}`, margin: "28px 0 20px" }} />

      <p style={{ margin: 0, fontSize: 12, color: t.txL, lineHeight: 1.7, fontStyle: "italic" }}>
        Smakfynd är byggt av Gabriel Linton, forskare i entreprenörskap och innovation. Sajten finns för att Systembolagets sortiment är svårnavigerat och vinguider tenderar att ranka "bäst" snarare än "smartast köp". Ingen koppling till Systembolaget. Drivs av Olav Innovation AB.
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// components/StoreMode.jsx
// ════════════════════════════════════════════════════════════
// src/components/StoreMode.jsx — "Snabbkollen"
// Inline fuzzy search (lightweight fuse-like implementation)
function fuzzySearch(items, query, keys, limit = 10) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const stopwords = new Set(["vino", "wine", "doc", "docg", "vin", "de", "la", "le", "di", "du", "des"]);
  const terms = q.split(/\s+/).filter(t => t.length > 1 && !stopwords.has(t));

  // If all digits and 5+, search by article number
  if (/^\d{5,}$/.test(q.trim())) {
    return items.filter(item => String(item.nr) === q.trim()).slice(0, 1);
  }

  return items.map(item => {
    let score = 0;
    const fields = keys.map(k => (item[k] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    const combined = fields.join(" ");

    for (const term of terms) {
      // Exact substring match
      if (combined.includes(term)) {
        score += 10;
        // Bonus for start-of-word match
        if (fields.some(f => f.startsWith(term) || f.includes(" " + term))) score += 5;
      } else {
        // Fuzzy: allow 1-2 char difference (simple Levenshtein check)
        for (const f of fields) {
          const words = f.split(/\s+/);
          for (const w of words) {
            if (w.length >= 3 && term.length >= 3) {
              let diff = 0;
              const minLen = Math.min(w.length, term.length);
              for (let i = 0; i < minLen; i++) { if (w[i] !== term[i]) diff++; }
              diff += Math.abs(w.length - term.length);
              if (diff <= 2 && minLen >= 3) { score += 5 - diff; break; }
            }
          }
        }
      }
    }
    return { item, score };
  })
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score || b.item.smakfynd_score - a.item.smakfynd_score)
  .slice(0, limit)
  .map(r => r.item);
}

function getRecommendations(wine, products) {
  if (!wine || !products) return [];
  const wineVol = wine.vol || 750;
  const wineGrapes = (wine.grape || "").toLowerCase().split(",").map(g => g.trim()).filter(Boolean);
  const wineGrape = wineGrapes[0] || "";
  const wineCat3 = (wine.cat3 || "").toLowerCase();
  const wineRegion = (wine.region || "").toLowerCase();

  // Base pool: same type + volume
  const base = products.filter(p =>
    p.nr !== wine.nr && p.category === wine.category && p.package === wine.package
    && p.assortment === "Fast sortiment"
    && Math.abs((p.vol || 750) - wineVol) / wineVol < 0.3
  );

  // Narrow pool: same grape/style/region (prioritized)
  const narrow = base.filter(p => {
    const pGrapes = (p.grape || "").toLowerCase().split(",").map(g => g.trim()).filter(Boolean);
    const c = (p.cat3 || "").toLowerCase();
    const r = (p.region || "").toLowerCase();
    return (wineGrapes.length > 0 && pGrapes.some(g => wineGrapes.includes(g))) || (wineCat3 && c === wineCat3) || (wineRegion && r === wineRegion);
  });

  const recs = [];
  const used = new Set();

  const addRec = (p, type, label) => {
    if (used.has(p.nr)) return false;
    used.add(p.nr);
    recs.push({ ...p, _recType: type, _recLabel: label });
    return true;
  };

  // Helper: describe what's similar
  const similarity = (p) => {
    const g = (p.grape || "").toLowerCase().split(",")[0].trim();
    if (wineGrape && g === wineGrape) return `Samma druva (${wine.grape.split(",")[0].trim()})`;
    const r = (p.region || "").toLowerCase();
    if (wineRegion && r === wineRegion) return `Samma region (${wine.region})`;
    const c = (p.cat3 || "").toLowerCase();
    if (wineCat3 && c === wineCat3) return `Samma stil`;
    return `Liknande vin`;
  };

  // 1. Best in same sort/style — prioritize narrow pool
  const pool1 = narrow.length >= 3 ? narrow : base;
  const priceRange = wine.price < 150 ? wine.price * 0.25 : wine.price < 300 ? wine.price * 0.15 : wine.price * 0.10;

  // 1a. Better in same price range
  const betterSame = pool1
    .filter(p => Math.abs(p.price - wine.price) <= priceRange && p.smakfynd_score >= wine.smakfynd_score + 3)
    .sort((a, b) => b.smakfynd_score - a.smakfynd_score);
  for (const p of betterSame.slice(0, 2)) {
    addRec(p, "A", `${similarity(p)}, +${p.smakfynd_score - wine.smakfynd_score} poäng`);
  }

  // 1b. Same quality, lower price
  if (recs.length < 3) {
    const cheaper = pool1
      .filter(p => !used.has(p.nr) && Math.abs(p.smakfynd_score - wine.smakfynd_score) <= 3 && p.price <= wine.price * 0.75)
      .sort((a, b) => a.price - b.price);
    for (const p of cheaper.slice(0, 1)) {
      addRec(p, "B", `${similarity(p)}, ${Math.round(wine.price - p.price)}\u00A0kr billigare`);
    }
  }

  // 1c. Worth upgrading
  if (recs.length < 3) {
    const upgrade = pool1
      .filter(p => !used.has(p.nr) && p.smakfynd_score >= wine.smakfynd_score + 5 && p.price > wine.price * 1.3 && p.price <= wine.price * 2.5)
      .sort((a, b) => b.smakfynd_score - a.smakfynd_score);
    for (const p of upgrade.slice(0, 1)) {
      addRec(p, "C", `${similarity(p)}, +${p.smakfynd_score - wine.smakfynd_score} poäng för ${Math.round(p.price - wine.price)}\u00A0kr extra`);
    }
  }

  // 2. If we used narrow pool, also show one broader "liknande smak" from base
  if (recs.length < 4 && narrow.length >= 3) {
    const broader = base
      .filter(p => !used.has(p.nr) && !narrow.includes(p) && p.smakfynd_score >= wine.smakfynd_score)
      .sort((a, b) => {
        let sa = 0, sb = 0;
        if (a.taste_body && wine.taste_body) sa += (1 - Math.abs(a.taste_body - wine.taste_body) / 12) * 10;
        if (b.taste_body && wine.taste_body) sb += (1 - Math.abs(b.taste_body - wine.taste_body) / 12) * 10;
        return sb - sa || b.smakfynd_score - a.smakfynd_score;
      });
    for (const p of broader.slice(0, 1)) {
      addRec(p, "D", `Liknande smakprofil, annan druva`);
    }
  }

  return recs;
}

function availLabel(avail) {
  if (avail >= 0.7) return { text: "Brett tillgängligt", color: t.green };
  if (avail >= 0.3) return { text: "Fråga din butik", color: t.gold };
  return { text: "Beställningsvara", color: t.txL };
}

function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const loadAndStart = () => {
      if (!window.Html5QrcodeScanner) {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
        script.onload = () => initScanner();
        script.onerror = () => onClose();
        document.head.appendChild(script);
      } else {
        initScanner();
      }
    };

    const initScanner = async () => {
      try {
        const scanner = new window.Html5Qrcode("sf-scanner-region");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 20,
            qrbox: { width: 250, height: 80 },
            formatsToSupport: [
              window.Html5QrcodeSupportedFormats.EAN_13,
              window.Html5QrcodeSupportedFormats.EAN_8,
              window.Html5QrcodeSupportedFormats.CODE_128,
              window.Html5QrcodeSupportedFormats.CODE_39,
              window.Html5QrcodeSupportedFormats.ITF,
            ],
          },
          (decodedText) => {
            if (doneRef.current) return;
            doneRef.current = true;
            if (navigator.vibrate) navigator.vibrate(50);
            scanner.stop().then(() => scanner.clear()).catch(() => {});
            onScan(decodedText, "barcode");
          },
          () => {}
        );
      } catch(e) {
        onClose();
      }
    };

    loadAndStart();

    return () => {
      try { if (scannerRef.current) { scannerRef.current.stop().catch(() => {}); scannerRef.current.clear().catch(() => {}); } } catch(e) {}
    };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: t.bg, zIndex: 1000, overflowY: "auto" }}>
      <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 16, fontFamily: t.serif, color: t.tx }}>Skanna streckkod</div>
        <button onClick={() => { try { scannerRef.current?.stop().catch(() => {}); scannerRef.current?.clear().catch(() => {}); } catch(e) {} onClose(); }} style={{
          padding: "8px 16px", borderRadius: 100, border: `1px solid ${t.bdr}`,
          background: t.card, color: t.txM, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
        }}>Avbryt</button>
      </div>
      <div style={{ padding: "0 16px 8px", fontSize: 12, color: t.txL }}>
        Rikta kameran mot streckkoden på flaskan eller hyllkanten
      </div>
      <div id="sf-scanner-region" style={{ padding: "0 16px" }} />
    </div>
  );
}

function LabelScanner({ products, onMatch, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("camera"); // camera | processing | results | error
  const [matches, setMatches] = useState([]);
  const [ocrText, setOcrText] = useState("");

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      } catch(e) {
        setStatus("error");
      }
    };
    startCamera();
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
  }, []);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    // Wait for video to be ready
    if (video.readyState < 2 || video.videoWidth === 0) {
      setOcrText("Kameran är inte redo ännu. Vänta en sekund och försök igen.");
      setStatus("error");
      return;
    }

    setStatus("processing");
    const canvas = canvasRef.current;
    const w = Math.min(video.videoWidth, 1024);
    const h = Math.round(w * video.videoHeight / video.videoWidth);
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(video, 0, 0, w, h);

    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());

    try {
      const imageBase64 = canvas.toDataURL("image/jpeg", 0.8);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const res = await fetch("https://smakfynd-wine-ai.smakfynd.workers.dev/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64 }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        setOcrText(`Server-fel: ${res.status} ${errText.slice(0, 100)}`);
        setStatus("error");
        return;
      }

      const data = await res.json();

      if (data.error) {
        setOcrText(`AI-fel: ${data.error}`);
        setStatus("error");
        return;
      }

      const wineName = data.wine_name || "";
      const producer = data.producer || "";
      const searchQuery = `${wineName} ${producer}`.trim();
      setOcrText(`AI läste: ${searchQuery}${data.region ? ` (${data.region})` : ""}${data.vintage ? ` ${data.vintage}` : ""}${data._raw ? `\n\nRåsvar: ${data._raw.slice(0,150)}` : ""}`);

      if (!searchQuery) {
        setOcrText(data._gemini_status === 429
          ? "Etikettläsningen har nått sin dagliga gräns. Prova igen imorgon, eller skriv vinets namn."
          : "Kunde inte läsa etiketten. Prova en tydligare bild.");
        setStatus("error");
        return;
      }

      // Fuzzy search with AI-extracted name
      const queries = [searchQuery, wineName, producer].filter(q => q.length >= 3);
      const seen = new Set();
      const allMatches = [];
      for (const query of queries) {
        const results = fuzzySearch(products, query, ["name", "sub", "country", "grape", "region"], 5);
        for (const r of results) {
          if (!seen.has(r.nr)) { seen.add(r.nr); allMatches.push(r); }
        }
      }

      setMatches(allMatches.slice(0, 5));
      setStatus("results");
      if (navigator.vibrate) navigator.vibrate(50);
    } catch(e) {
      setOcrText("Fel: " + String(e).slice(0, 200));
      setStatus("error");
    }
  };

  if (status === "error") {
    return (
      <div style={{ position: "fixed", inset: 0, background: t.bg, zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ fontSize: 14, color: t.txM, textAlign: "center", marginBottom: 16 }}>Kunde inte läsa etiketten. Prova igen eller skriv vinets namn.</div>
        {ocrText && <div style={{ fontSize: 10, color: t.txF, textAlign: "center", marginBottom: 12, maxWidth: 300 }}>{ocrText}</div>}
        <button onClick={onClose} style={{ padding: "12px 24px", borderRadius: 10, border: `1px solid ${t.bdr}`, background: t.card, color: t.txM, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Tillbaka</button>
      </div>
    );
  }

  if (status === "results") {
    return (
      <div style={{ position: "fixed", inset: 0, background: t.bg, zIndex: 1000, overflowY: "auto" }}>
        <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontFamily: t.serif, color: t.tx }}>Resultat från etikett</div>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 100, border: `1px solid ${t.bdr}`, background: t.card, color: t.txM, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Stäng</button>
        </div>
        {matches.length > 0 ? (
          <div style={{ padding: "0 16px" }}>
            <div style={{ fontSize: 11, color: t.txL, marginBottom: 8 }}>Hittade {matches.length} möjliga matchningar:</div>
            {matches.map((p, i) => {
              const [_l, col] = getScoreInfo(p.smakfynd_score);
              return (
                <div key={p.nr} onClick={() => { onMatch(p); onClose(); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", borderRadius: 10, background: t.card, border: `1px solid ${t.bdrL}`, marginBottom: 6, cursor: "pointer" }}>
                  <ProductImage p={p} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontFamily: t.serif, color: t.tx }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: t.txL }}>{p.sub} · {p.country} · {p.price}{"\u00A0"}kr</div>
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 900, color: col, fontFamily: t.serif }}>{p.smakfynd_score}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: "32px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: t.txM, marginBottom: 4 }}>Kunde inte matcha etiketten</div>
            <div style={{ fontSize: 12, color: t.txL }}>Prova att skriva vinets namn istället</div>
          </div>
        )}
        {ocrText && (
          <div style={{ padding: "16px", marginTop: 8 }}>
            <div style={{ fontSize: 10, color: t.txL, marginBottom: 4 }}>Avläst text:</div>
            <div style={{ fontSize: 10, color: t.txF, fontFamily: "monospace", lineHeight: 1.4, maxHeight: 80, overflow: "hidden" }}>{ocrText.slice(0, 300)}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 1000, display: "flex", flexDirection: "column" }}>
      <video ref={videoRef} style={{ flex: 1, width: "100%", objectFit: "cover" }} playsInline muted />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px", background: "linear-gradient(transparent, rgba(0,0,0,0.8))", textAlign: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 12 }}>
          Rikta kameran mot vinets etikett
        </div>
        <button onClick={captureAndAnalyze} disabled={status === "processing"} style={{
          padding: "14px 32px", borderRadius: 12, border: "none",
          background: status === "processing" ? "#666" : "#fff", color: "#000",
          fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        }}>
          {status === "processing" ? "Läser etikett..." : "Ta bild"}
        </button>
      </div>

      <button onClick={onClose} style={{
        position: "absolute", top: 16, right: 16, padding: "8px 16px", borderRadius: 100,
        background: "rgba(0,0,0,0.5)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)",
        fontSize: 13, cursor: "pointer", fontFamily: "inherit", zIndex: 10,
      }}>Avbryt</button>
    </div>
  );
}

function StoreMode({ products, onClose }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showLabelScanner, setShowLabelScanner] = useState(false);
  const [scanMsg, setScanMsg] = useState(null);
  const [scanCode, setScanCode] = useState(null);
  const sv = React.useContext(SavedContext);
  const inputRef = useRef(null);

  // Recent searches (localStorage)
  const [recent, setRecent] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sf_recent_snabbkoll") || "[]"); } catch(e) { return []; }
  });
  const addRecent = (wine) => {
    const updated = [{ nr: wine.nr, name: wine.name, sub: wine.sub || "" },
      ...recent.filter(r => r.nr !== wine.nr)].slice(0, 5);
    setRecent(updated);
    try { localStorage.setItem("sf_recent_snabbkoll", JSON.stringify(updated)); } catch(e) {}
  };

  useEffect(() => { if (!showScanner) inputRef.current?.focus(); }, [showScanner]);

  // EAN → productNumber lookup (built over time from successful scans)
  const [eanMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sf_ean_map") || "{}"); } catch(e) { return {}; }
  });
  const saveEanMapping = (ean, nr) => {
    eanMap[ean] = nr;
    try { localStorage.setItem("sf_ean_map", JSON.stringify(eanMap)); } catch(e) {}
    // Also save server-side for all users
    fetch("https://smakfynd-analytics.smakfynd.workers.dev/ean", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ean, nr }), keepalive: true,
    }).catch(() => {});
  };

  const handleBarcodeScan = (code, format) => {
    setShowScanner(false);
    setTimeout(() => {
      track("snabbkoll_scan", { code, format });

      // 1. Direct productNumber match (shelf label)
      const byNr = products.find(p => String(p.nr) === code || String(p.nr) === code.replace(/^0+/, ""));
      if (byNr) {
        setQ(byNr.name);
        handleSelect(byNr);
        return;
      }

      // 2. Check local EAN mapping (learned from previous successful manual matches)
      if (eanMap[code]) {
        const mapped = products.find(p => String(p.nr) === eanMap[code]);
        if (mapped) {
          setQ(mapped.name);
          handleSelect(mapped);
          return;
        }
      }

      // 3. Check server-side EAN map (crowdsourced from all users)
      fetch(`https://smakfynd-analytics.smakfynd.workers.dev/ean?code=${code}`)
        .then(r => r.json())
        .then(eanData => {
          if (eanData.nr) {
            const serverMatch = products.find(p => String(p.nr) === eanData.nr);
            if (serverMatch && !selected) { setQ(serverMatch.name); handleSelect(serverMatch); setScanMsg(null); }
          }
        }).catch(() => {});

      // 4. Partial productNumber match
      const shortMatch = products.find(p => String(p.nr).startsWith(code) || code.startsWith(String(p.nr)));
      if (shortMatch) {
        setQ(shortMatch.name);
        handleSelect(shortMatch);
        return;
      }

      // 5. Not found — focus search input with helpful message
      setQ("");
      setSelected(null);
      setScanMsg(`Streckkoden ${code} kunde inte matchas automatiskt. Skriv vinets namn så hittar vi det.`);
      setScanCode(code);
      inputRef.current?.focus();
    }, 150);
  };

  // When user manually finds the wine after failed scan, learn the mapping
  const handleSelectWithLearn = (wine) => {
    handleSelect(wine);
    if (scanCode && wine.nr) {
      saveEanMapping(scanCode, String(wine.nr));
      setScanCode(null);
    }
  };

  const results = useMemo(() => {
    return fuzzySearch(products, q, ["name", "sub", "country", "grape", "region"]);
  }, [q, products]);

  const recs = useMemo(() => {
    return selected ? getRecommendations(selected, products) : [];
  }, [selected, products]);

  // Log Snabbkollen searches (debounced)
  useEffect(() => {
    if (!q || q.length < 2) return;
    const timer = setTimeout(() => trackSearch(q, results?.length || 0), 1500);
    return () => clearTimeout(timer);
  }, [q]);

  const handleSelect = (wine) => {
    setSelected(wine);
    addRecent(wine);
    track("snabbkoll_lookup", { nr: wine.nr, name: wine.name, source: "snabbkoll" });
  };

  const RecCard = ({ p, label, type }) => {
    const [_l, col] = getScoreInfo(p.smakfynd_score);
    const av = availLabel(p.avail || 0.25);
    return (
      <div onClick={() => handleSelect(p)} style={{
        display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
        borderRadius: 12, background: t.card, border: `1px solid ${t.bdrL}`,
        cursor: "pointer", transition: "border-color 0.2s", marginBottom: 6,
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = t.wine + "40"}
        onMouseLeave={e => e.currentTarget.style.borderColor = t.bdrL}
      >
        <ProductImage p={p} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontFamily: t.serif, color: t.tx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
          <div style={{ fontSize: 11, color: t.txL }}>{p.sub} · {p.country}</div>
          <div style={{ fontSize: 11, color: type === "B" ? t.green : type === "C" ? t.gold : t.txM, fontWeight: 500, marginTop: 2 }}>{label}</div>
          <div style={{ fontSize: 9, color: av.color, marginTop: 2 }}>{av.text}</div>
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: col, fontFamily: t.serif }}>{p.smakfynd_score}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.tx, fontFamily: t.serif }}>{p.price}{"\u00A0"}<span style={{ fontSize: 10, color: t.txL, fontWeight: 400 }}>kr</span></div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: t.sans, padding: "0 16px 40px" }}>
      {/* Header */}
      <div style={{ padding: "16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 18, fontFamily: t.serif, color: t.tx }}>Snabbkollen</div>
          <div style={{ fontSize: 11, color: t.txL }}>Kolla snabbt — i butik, hemma, eller på restaurang</div>
        </div>
        <button onClick={onClose} style={{
          padding: "8px 16px", borderRadius: 100, border: `1px solid ${t.bdr}`,
          background: t.card, color: t.txM, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
        }}>Hela rankingen</button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <input ref={inputRef} type="search" inputMode="search" value={q}
          onChange={e => { setQ(e.target.value); setSelected(null); setScanMsg(null); }}
          placeholder="Skriv vinets namn, druva eller artikelnummer..."
          style={{
            width: "100%", padding: "16px 16px 16px 46px", borderRadius: 14,
            border: `2px solid ${selected ? t.green + "40" : t.wine + "30"}`, background: t.card, fontSize: 16,
            color: t.tx, outline: "none", boxSizing: "border-box", fontFamily: t.serif,
          }}
          onFocus={e => e.target.style.borderColor = t.wine}
          onBlur={e => e.target.style.borderColor = selected ? t.green + "40" : t.wine + "30"}
        />
        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: t.txL, pointerEvents: "none" }}>⌕</span>
      </div>

      {/* Scan buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setShowScanner(true)} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "14px 12px", borderRadius: 12,
          border: `1.5px solid ${t.wine}25`, background: t.card,
          cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: t.tx,
          transition: "all 0.2s",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.wine} strokeWidth="2" strokeLinecap="round">
            <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/>
            <line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="8" x2="10" y2="8"/><line x1="14" y1="8" x2="17" y2="8"/>
          </svg>
          Skanna hyllkant
        </button>
        <button onClick={() => setShowLabelScanner(true)} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "14px 12px", borderRadius: 12,
          border: `1.5px solid ${t.bdr}`, background: t.card,
          cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500, color: t.txM,
          transition: "all 0.2s",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.txM} strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M5 21c0-3 3-5 7-5s7 2 7 5"/>
          </svg>
          Skanna etikett
          <span style={{ fontSize: 9, background: t.bg, padding: "1px 5px", borderRadius: 4, color: t.txL, fontWeight: 600 }}>BETA</span>
        </button>
      </div>

      {/* Scanner overlays */}
      {showScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />}
      {showLabelScanner && <LabelScanner products={products} onMatch={p => { setQ(p.name); handleSelectWithLearn(p); }} onClose={() => setShowLabelScanner(false)} />}

      {/* Scan message */}
      {scanMsg && (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: `${t.deal}08`, border: `1px solid ${t.deal}20`, marginBottom: 12, fontSize: 12, color: t.deal }}>
          {scanMsg}
        </div>
      )}

      {/* Recent searches */}
      {!q && !selected && recent.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Senaste sökningar</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {recent.map(r => (
              <button key={r.nr} onClick={() => { setQ(r.name); const w = products.find(p => String(p.nr) === String(r.nr)); if (w) handleSelect(w); }}
                style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${t.bdrL}`, background: t.card, fontSize: 12, color: t.txM, cursor: "pointer", fontFamily: "inherit" }}>
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search results (when typing, before selecting) */}
      {q && !selected && results.length > 0 && (
        <div>
          {results.map(p => {
            const [_l, col] = getScoreInfo(p.smakfynd_score);
            return (
              <div key={p.nr} onClick={() => { handleSelectWithLearn(p); setQ(p.name); setScanMsg(null); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, cursor: "pointer", transition: "background 0.15s", marginBottom: 2 }}
                onMouseEnter={e => e.currentTarget.style.background = t.card}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <ProductImage p={p} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: t.tx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name} <span style={{ color: t.txL }}>{p.sub}</span></div>
                  <div style={{ fontSize: 11, color: t.txL }}>{p.country} · {p.grape} · {p.price}{"\u00A0"}kr</div>
                </div>
                <span style={{ fontSize: 18, fontWeight: 900, color: col, fontFamily: t.serif }}>{p.smakfynd_score}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* No results */}
      {q && q.length >= 2 && !selected && results.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 20px", color: t.txL }}>
          <div style={{ fontSize: 14, color: t.txM, marginBottom: 4 }}>Hittade inget vin med "{q}"</div>
          <div style={{ fontSize: 12 }}>Prova vinets namn, druva eller artikelnummer</div>
        </div>
      )}

      {/* Selected wine + recommendations */}
      {selected && (
        <div>
          {/* Main card — use the full Card component */}
          <div style={{ marginBottom: 12 }}>
            <Card p={selected} rank={1} delay={0} allProducts={products} autoOpen={true} auth={{}} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={() => { setSelected(null); setQ(""); inputRef.current?.focus(); }}
              style={{ fontSize: 12, color: t.wine, background: "none", border: `1px solid ${t.wine}30`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>
              Sök nytt vin
            </button>
          </div>

          {/* Recommendations */}
          {recs.length > 0 ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.txL, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Bättre alternativ
              </div>
              {recs.map((r, i) => <RecCard key={i} p={r} label={r._recLabel} type={r._recType} />)}
            </div>
          ) : (
            <div>
              <div style={{ padding: "16px 18px", borderRadius: 12, background: `${t.green}08`, border: `1px solid ${t.green}20`, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.green }}>Du gjorde rätt val</div>
                <div style={{ fontSize: 12, color: t.txM, marginTop: 2 }}>Inget bättre i prisklassen just nu.</div>
              </div>
              {/* Similar wines you might like */}
              {(() => {
                const selVol = selected.vol || 750;
                const similar = products
                  .filter(w => w.nr !== selected.nr && w.category === selected.category && w.package === selected.package && w.assortment === "Fast sortiment" && Math.abs((w.vol || 750) - selVol) / selVol < 0.3)
                  .map(w => {
                    let sim = 0;
                    const selGrapes = (selected.grape || "").toLowerCase().split(",").map(g => g.trim()).filter(Boolean);
                  const wGrapes = (w.grape || "").toLowerCase().split(",").map(g => g.trim()).filter(Boolean);
                  if (selGrapes.length > 0 && wGrapes.some(g => selGrapes.includes(g))) sim += 20;
                    if (w.country === selected.country) sim += 10;
                    if (w.region && selected.region && w.region === selected.region) sim += 15;
                    if (w.taste_body && selected.taste_body) sim += (1 - Math.abs(w.taste_body - selected.taste_body) / 12) * 15;
                    return { ...w, _sim: sim };
                  })
                  .filter(w => w._sim >= 15)
                  .sort((a, b) => b._sim - a._sim || b.smakfynd_score - a.smakfynd_score)
                  .slice(0, 3);
                if (similar.length === 0) return null;
                return (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: t.txL, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                      Du kanske också gillar
                    </div>
                    {similar.map((r, i) => <RecCard key={i} p={r} label={`Liknande stil${r.grape && selected.grape && r.grape.toLowerCase() === selected.grape.toLowerCase() ? ", samma druva" : ""}`} type="A" />)}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Empty state: Veckans fynd */}
      {!q && !selected && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Veckans fynd</div>
          {products
            .filter(p => p.assortment === "Fast sortiment" && p.package === "Flaska" && p.smakfynd_score >= 78)
            .sort((a, b) => b.smakfynd_score - a.smakfynd_score)
            .slice(0, 5)
            .map((p, i) => {
              const [_l, col] = getScoreInfo(p.smakfynd_score);
              return (
                <div key={i} onClick={() => { setQ(p.name); handleSelect(p); }} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
                  borderTop: i > 0 ? `1px solid ${t.bdrL}` : "none", cursor: "pointer",
                }}>
                  <ProductImage p={p} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: t.tx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: t.txL }}>{p.sub} · {p.price}{"\u00A0"}kr</div>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 900, color: col, fontFamily: t.serif }}>{p.smakfynd_score}</span>
                </div>
              );
            })
          }
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// components/AgeGate.jsx
// ════════════════════════════════════════════════════════════
// src/components/AgeGate.jsx
function AgeGate({ onConfirm }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#f5f1eb", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: t.sans, padding: 20,
    }} role="dialog" aria-modal="true" aria-label="Åldersverifiering">
      <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">🍷</div>
        <h1 style={{ margin: "0 0 8px", fontSize: 28, fontFamily: t.serif, fontWeight: 400, color: "#2d2520" }}>Smakfynd</h1>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "#8a7e72", lineHeight: 1.6 }}>
          Den här sidan innehåller information om alkoholhaltiga drycker och riktar sig till personer som fyllt 25 år.
        </p>
        <button onClick={onConfirm} autoFocus style={{
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

// ════════════════════════════════════════════════════════════
// App.jsx
// ════════════════════════════════════════════════════════════
// src/App.jsx
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
  const auth = useAuth();
  const [showLogin, setShowLogin] = useState(false);
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
  const [loadError, setLoadError] = useState(null);
  const [openWineNr, setOpenWineNr] = useState(initHash.openWine || null);
  const [autoOpenNr, setAutoOpenNr] = useState(initHash.openWine || null);

  // Load data with retry
  useEffect(() => {
    async function loadData(attempt = 1) {
      // Try fetching from URL
      if (DATA_URL) {
        try {
          const res = await fetch(DATA_URL);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (!Array.isArray(data) || data.length < 10) throw new Error("Bad data");
          setAllData(data);
          setLoading(false);
          setLoadError(null);
          return;
        } catch(e) {
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
            return loadData(attempt + 1);
          }
          setLoadError(navigator.onLine ? "Kunde inte ladda vindata." : "Ingen internetanslutning.");
        }
      }

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
        // Scroll to wine card after render
        setTimeout(() => {
          const el = document.querySelector('[aria-expanded]');
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 500);
      }
      setOpenWineNr(null);
    }
  }, [openWineNr, products]);

  // Listen for hash changes (from similar wine clicks)
  useEffect(() => {
    const onHash = () => {
      const h = parseHash();
      if (h.openWine && products.length > 0) {
        const wine = products.find(p => String(p.nr) === String(h.openWine));
        if (wine) {
          setSearch(wine.name);
          setCat("all");
          setAutoOpenNr(h.openWine);
          // Scroll to wine list after render
          setTimeout(() => {
            const el = document.querySelector('[aria-expanded]');
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 300);
        }
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [products]);

  // Update hash on category change
  useEffect(() => {
    const catMap = { Rött: 'rott', Vitt: 'vitt', Rosé: 'rose', Mousserande: 'bubbel', all: 'alla' };
    if (!search && catMap[cat]) {
      history.replaceState(null, '', '#' + catMap[cat]);
    }
  }, [cat]);

  // Track searches (debounced)
  useEffect(() => {
    if (!search || search.length < 2) return;
    const timer = setTimeout(() => trackSearch(search, filtered?.length || 0), 1500);
    return () => clearTimeout(timer);
  }, [search]);

  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => { setShowBackToTop(window.scrollY > 800); ticking = false; });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [searchFocused, setSearchFocused] = useState(false);
  const [showEco, setShowEco] = useState(false);
  const [showBest, setShowBest] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selCountry, setSelCountry] = useState(null);
  const [selFoods, setSelFoods] = useState([]);
  const [sortBy, setSortBy] = useState("smakfynd");
  const [selRegion, setSelRegion] = useState(null);
  const [selTaste, setSelTaste] = useState(null);

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
    if (selRegion) r = r.filter(p => p.region === selRegion);
    if (selTaste) {
      const tasteFilters = { "Fylligt": p => (p.taste_body || 0) >= 8, "Lätt": p => (p.taste_body || 12) <= 5, "Fruktigt": p => (p.taste_fruit || 0) >= 8, "Torrt": p => (p.taste_sweet || 12) <= 3 };
      if (tasteFilters[selTaste]) r = r.filter(tasteFilters[selTaste]);
    }
    if (sortBy === "expert") r.sort((a, b) => (b.expert_score || 0) - (a.expert_score || 0));
    else if (sortBy === "crowd") r.sort((a, b) => (b.crowd_score || 0) - (a.crowd_score || 0));
    else if (sortBy === "price_asc") r.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === "price_desc") r.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === "drop") r.sort((a, b) => (b.price_vs_launch_pct || 0) - (a.price_vs_launch_pct || 0));
    return r;
  }, [products, cat, price, search, showNew, showDeals, pkg, showEco, showBest, selCountry, selFoods, selRegion, selTaste, sortBy]);

  const newN = products.filter(p => p.is_new).length;
  const dealN = products.filter(p => p.price_vs_launch_pct > 0).length;
  const ecoN = products.filter(p => p.organic).length;
  const hasFilters = search || cat !== "all" || price !== "all" || showNew || showDeals || showEco || selCountry || selFoods.length > 0 || selRegion || selTaste || sortBy !== "smakfynd";
  const hasNonCatFilters = price !== "all" || showNew || showDeals || showEco || selCountry || selFoods.length > 0 || selRegion || selTaste || pkg !== "Flaska";
  const searchCompact = hasNonCatFilters && !search && !searchFocused;

  const clearAll = () => { setSearch(""); setCat("all"); setPrice("all"); setShowNew(false); setShowDeals(false); setShowEco(false); setSelCountry(null); setSelFoods([]); setShowBest(false); setSelRegion(null); setSelTaste(null); setSortBy("smakfynd"); };

  const savedWines = useMemo(() => {
    return products.filter(p => sv.isSaved(p.nr || p.id)).sort((a, b) => b.smakfynd_score - a.smakfynd_score);
  }, [products, sv.data]);
  const [savedListFilter, setSavedListFilter] = useState("all");

  return (
    <SavedContext.Provider value={sv}>
    <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    {storeMode && <StoreMode products={products} onClose={() => setStoreMode(false)} />}
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: t.sans, display: storeMode ? "none" : "block" }}>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:scale(1) } }
        ::selection { background: ${t.wine}20 }
        input::placeholder { color: ${t.txF} }
        *::-webkit-scrollbar { display: none }
        * { scrollbar-width: none; box-sizing: border-box; }
        a { transition: color 0.15s ease; color: ${t.txM}; }
        button { transition: all 0.15s ease; }
        .tabnum { font-variant-numeric: tabular-nums; }
        img { transition: opacity 0.3s ease; }
        [role="button"]:focus-visible, button:focus-visible, a:focus-visible, input:focus-visible {
          outline: 2px solid ${t.wine}60;
          outline-offset: 2px;
        }
        @media (max-width: 480px) {
          header { padding: 10px 16px 0 !important; }
        }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <header style={{ padding: "12px 20px 0", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <svg width="22" height="22" viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill={t.wine}/><text x="20" y="27" textAnchor="middle" fontFamily="Georgia,serif" fontSize="18" fill="#f5ede3" fontWeight="400">S</text></svg>
            <span style={{ fontFamily: t.serif, fontSize: 20, color: t.wine }}>Smakfynd</span>
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 12, color: t.txL }}>
            {[["saved", `Sparade${sv.count ? ` (${sv.count})` : ""}`], ["about", "Om"],
              [auth.user ? "profile" : "login", auth.user ? "Konto" : "Logga in"]].map(([k, l]) => (
              <span key={k} onClick={() => {
                  if (k === "login") { setShowLogin(true); return; }
                  if (k === "profile") { auth.logout(); return; }
                  setPanel(panel === k ? null : k);
                }}
                style={{ cursor: "pointer", color: k === "login" ? t.wine : t.txL, fontWeight: panel === k ? 600 : 400, padding: "8px 0", minHeight: 44, display: "inline-flex", alignItems: "center" }}
              >{l}</span>
            ))}
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 20px 0", textAlign: "center" }}>
        <h1 style={{
          margin: "0 0 6px", fontFamily: "'Newsreader', Georgia, serif", fontWeight: 400,
          fontSize: "clamp(32px, 6vw, 56px)", color: t.tx, lineHeight: 1.1, letterSpacing: "-0.02em",
        }}>
          Bästa köpet i sin kategori
        </h1>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: t.txL }}>
          {products.length > 100 ? `${(Math.round(products.length / 100) * 100).toLocaleString("sv-SE")}+` : ""} viner på Systembolaget, rankade efter värde
        </p>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px 80px" }}>

        {/* ═══ PANELS ═══ */}
        {panel === "about" && (
          <div style={{ padding: 22, borderRadius: 16, background: t.card, border: `1px solid ${t.bdr}`, marginBottom: 20, animation: "scaleIn 0.25s ease" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 22, fontFamily: t.serif, fontWeight: 400, color: t.tx }}>Om Smakfynd</h2>
            <p style={{ fontSize: 14, color: t.txM, lineHeight: 1.7, margin: "0 0 12px" }}>
              Systembolaget har tusentals viner. Vi hjälper dig hitta de som faktiskt är värda pengarna. Vi kombinerar <strong>crowd-betyg</strong> från hundratusentals vindrickare, <strong>expertrecensioner</strong> från internationella kritiker och <strong>prisjämförelse</strong> inom varje kategori.
            </p>
            <p style={{ fontSize: 14, color: t.txM, lineHeight: 1.7, margin: "0 0 14px" }}>
              Resultatet: <strong>en enda poäng</strong> som visar kvalitet per krona. Inte det "bästa" vinet — utan det bästa <em>köpet</em>.
            </p>
            <div style={{ padding: 16, borderRadius: 12, background: t.bg, marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontFamily: t.serif, color: t.tx, marginBottom: 4 }}>Gabriel Linton</div>
              <p style={{ fontSize: 13, color: t.txM, lineHeight: 1.6, margin: 0 }}>
                Jag har pluggat dryckeskunskap i Grythyttan, forskar i innovation vid Universitetet i Innlandet i Norge och har en MBA från Cleveland State.
              </p>
              <p style={{ fontSize: 13, color: t.txM, lineHeight: 1.6, margin: "8px 0 0" }}>
                Smakfynd började för att jag tyckte det var onödigt svårt att hitta bra vin på Systembolaget. All data fanns redan, crowd-betyg, kritikerrecensioner, priser, men ingen hade satt ihop det. Jag ville ha ett verktyg som tar hänsyn till priset, inte bara kvaliteten. Så jag byggde det.
              </p>
            </div>
            <p style={{ fontSize: 12, color: t.txL, margin: 0 }}>Olav Innovation AB · Oberoende informationstjänst · Ingen koppling till Systembolaget · Vi säljer inte alkohol</p>

            <div style={{ padding: 16, borderRadius: 12, background: `${t.wine}06`, border: `1px solid ${t.wine}12`, marginTop: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.tx, marginBottom: 4 }}>Stöd Smakfynd</div>
              <p style={{ fontSize: 12, color: t.txM, margin: "0 0 8px", lineHeight: 1.5 }}>
                Smakfynd är gratis och oberoende — inga annonser, inga sponsrade placeringar. Om du tycker om tjänsten kan du bjuda oss på ett glas.
              </p>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.wine }}>Swish: 0730-910551</div>
              <div style={{ fontSize: 10, color: t.txF, marginTop: 4 }}>Alla bidrag går till servrar, data och utveckling.</div>
            </div>

            <button onClick={() => setPanel(null)} style={{ marginTop: 12, fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Stäng</button>
          </div>
        )}

        {panel === "method" && (
          <div style={{ padding: 22, borderRadius: 16, background: t.card, border: `1px solid ${t.bdr}`, marginBottom: 20, animation: "scaleIn 0.25s ease" }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 22, fontFamily: t.serif, fontWeight: 400, color: t.tx }}>Så beräknas poängen</h2>

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
            <h3 style={{ margin: "0 0 10px", fontSize: 15, fontFamily: t.serif, fontWeight: 400, color: t.tx }}>Transparens</h3>
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
            <h2 style={{ margin: "0 0 4px", fontSize: 22, fontFamily: t.serif, fontWeight: 400, color: t.tx }}>Mina viner</h2>
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
                  .map((p, i) => <Card key={p.id || i} p={p} rank={i + 1} delay={0} allProducts={products} auth={auth} />)}
              </div>
            )}
            <button onClick={() => setPanel(null)} style={{ marginTop: 12, fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Stäng</button>
          </div>
        )}

        {/* ═══ JOB 1: VIN TILL IKVÄLL ═══ */}
        <div id="section-food" style={{ marginBottom: 20 }}>
          <FoodMatch products={products} />
        </div>

        {/* ═══ JOB 2: SNABBKOLLEN ═══ */}
        <button onClick={() => setStoreMode(true)}
          style={{
            display: "flex", alignItems: "center", gap: 14, width: "100%",
            padding: "16px 20px", borderRadius: 16, border: `2px solid ${t.wine}25`,
            background: t.card, cursor: "pointer", fontFamily: "inherit",
            marginBottom: 24, transition: "all 0.2s", textAlign: "left",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = t.wine + "50"; e.currentTarget.style.boxShadow = `0 4px 16px ${t.wine}10`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = t.wine + "25"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${t.wine}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={t.wine} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: t.tx, fontFamily: t.serif }}>Sök eller skanna vin</div>
            <div style={{ fontSize: 12, color: t.txM }}>Hitta poäng, pris och bättre alternativ direkt</div>
          </div>
          <span style={{ fontSize: 18, color: t.txL }}>→</span>
        </button>

        {/* ═══ JOB 3: BROWSA TOPPEN — search + filters + list ═══ */}
        <div style={{ borderTop: `1px solid ${t.bdrL}`, paddingTop: 20, marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Browsa alla viner</div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 10 }}>
          <label htmlFor="sf-search" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>Sök vin</label>
          <input id="sf-search" type="search" placeholder="Sök vin, druva, land, stil..." value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "12px 16px 12px 40px", borderRadius: 12,
              border: `1px solid ${t.bdr}`, background: t.card, fontSize: 14,
              color: t.tx, outline: "none", boxSizing: "border-box",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={e => { setSearchFocused(true); e.target.style.borderColor = t.wine + "40"; e.target.style.boxShadow = `0 0 0 3px ${t.wine}08`; }}
            onBlur={e => { setSearchFocused(false); e.target.style.borderColor = t.bdr; e.target.style.boxShadow = "none"; }}
          />
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: t.txL, pointerEvents: "none" }}>⌕</span>
        </div>

        {/* ═══ CATEGORY PILLS ═══ */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
          {CATS.map(ct => (
            <button key={ct.k} onClick={() => { setCat(ct.k); track("filter", { type: "category", value: ct.k }); }} style={pill(cat === ct.k)}>
              {ct.l}
            </button>
          ))}
        </div>

        {/* ═══ ACTIVE FILTER CHIPS ═══ */}
        {hasNonCatFilters ? (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
            {price !== "all" && <span onClick={() => setPrice("all")} style={{ ...pill(true), cursor: "pointer", fontSize: 11 }}>{PRICES.find(p => p.k === price)?.l} ✕</span>}
            {pkg !== "Flaska" && <span onClick={() => setPkg("Flaska")} style={{ ...pill(true), cursor: "pointer", fontSize: 11 }}>{pkg === "BiB" ? "Bag-in-box" : "Storpack"} ✕</span>}
            {showEco && <span onClick={() => setShowEco(false)} style={{ ...pill(true, t.green), cursor: "pointer", fontSize: 11 }}>Ekologiskt ✕</span>}
            {showDeals && <span onClick={() => { setShowDeals(false); if (sortBy === "drop") setSortBy("smakfynd"); }} style={{ ...pill(true, t.deal), cursor: "pointer", fontSize: 11 }}>Prissänkt ✕</span>}
            {showNew && <span onClick={() => setShowNew(false)} style={{ ...pill(true), cursor: "pointer", fontSize: 11 }}>Nyheter ✕</span>}
            {selCountry && <span onClick={() => setSelCountry(null)} style={{ ...pill(true), cursor: "pointer", fontSize: 11 }}>{selCountry} ✕</span>}
            {selRegion && <span onClick={() => setSelRegion(null)} style={{ ...pill(true), cursor: "pointer", fontSize: 11 }}>{selRegion} ✕</span>}
            {selTaste && <span onClick={() => setSelTaste(null)} style={{ ...pill(true), cursor: "pointer", fontSize: 11 }}>{selTaste} ✕</span>}
            {selFoods.map(f => <span key={f} onClick={() => toggleFood(f)} style={{ ...pill(true), cursor: "pointer", fontSize: 11 }}>{f} ✕</span>)}
            <button onClick={clearAll} style={{ fontSize: 11, color: t.txL, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>Rensa alla</button>
            <button onClick={() => setShowAdvanced(!showAdvanced)} style={{ fontSize: 11, color: t.txM, background: "none", border: `1px solid ${t.bdrL}`, borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit", marginLeft: "auto" }}>
              {showAdvanced ? "Dölj filter" : "+ Filter"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <button onClick={() => setShowAdvanced(!showAdvanced)} style={{ ...pill(showAdvanced), display: "flex", alignItems: "center", gap: 4 }}>
              Filter <span style={{ fontSize: 10, transition: "transform 0.2s", display: "inline-block", transform: showAdvanced ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
            </button>
          </div>
        )}

        {showAdvanced && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12, padding: "14px 16px", borderRadius: 14, background: t.card, border: `1px solid ${t.bdrL}` }}>
            {/* Package */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Förpackning</div>
              <div style={{ display: "flex", gap: 4, background: t.bdrL, borderRadius: 100, padding: 3, width: "fit-content" }}>
                {[["Flaska", "Flaskor"], ["BiB", "Bag-in-box"], ["Stor", "Storpack"]].map(([k, l]) => (
                  <button key={k} onClick={() => setPkg(k)} style={{
                    padding: "7px 16px", borderRadius: 100, border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: pkg === k ? 600 : 400, fontFamily: "inherit",
                    background: pkg === k ? t.card : "transparent",
                    color: pkg === k ? t.tx : t.txL,
                    boxShadow: pkg === k ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}>{l}</button>
                ))}
              </div>
            </div>
            {/* Price */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pris</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {PRICES.filter(pr => pr.k !== "all").map(({ k, l }) => {
                  const cnt = products.filter(w => { const [a, b] = k.split("-").map(Number); return w.price >= a && w.price <= b; }).length;
                  return <button key={k} onClick={() => { setPrice(price === k ? "all" : k); }} style={pill(price === k)}>{l} <span style={{ fontSize: 10, color: t.txF }}>({cnt})</span></button>;
                })}
              </div>
            </div>
            {/* Toggles */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Filter</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                <button onClick={() => setShowEco(!showEco)} style={pill(showEco, t.green)}>Ekologiskt ({ecoN})</button>
                <button onClick={() => { setShowNew(!showNew); if (!showNew) setShowDeals(false); }} style={pill(showNew)}>Nyheter ({products.filter(p => p.is_new).length})</button>
                <button onClick={() => { const next = !showDeals; setShowDeals(next); if (next) { setShowNew(false); setSortBy("drop"); } else if (sortBy === "drop") setSortBy("smakfynd"); }} style={pill(showDeals, t.deal)}>Prissänkt ({products.filter(p => p.price_vs_launch_pct > 0).length})</button>
              </div>
            </div>
            {/* Country → Region hierarchical */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Land</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {["Italien", "Frankrike", "Spanien", "USA", "Tyskland", "Sydafrika", "Chile", "Portugal", "Australien", "Argentina", "Nya Zeeland", "\u00d6sterrike"].map(c => {
                  const cnt = products.filter(w => w.country === c).length;
                  return <button key={c} onClick={() => { setSelCountry(selCountry === c ? null : c); setSelRegion(null); }} style={pill(selCountry === c)}>{c} ({cnt})</button>;
                })}
              </div>
              {selCountry && (() => {
                const regions = [...new Set(products.filter(w => w.country === selCountry && w.region).map(w => w.region))].sort();
                if (regions.length === 0) return null;
                return (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6, paddingLeft: 12, borderLeft: `2px solid ${t.wine}30` }}>
                    {regions.slice(0, 10).map(rg => {
                      const cnt = products.filter(w => w.country === selCountry && w.region === rg).length;
                      return <button key={rg} onClick={() => setSelRegion(selRegion === rg ? null : rg)} style={pill(selRegion === rg)}>{rg} ({cnt})</button>;
                    })}
                  </div>
                );
              })()}
            </div>
            {/* Food */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Passar till</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {["Kött", "Fågel", "Fisk", "Skaldjur", "Fläsk", "Grönsaker", "Ost", "Vilt", "Pasta", "Lamm"].map(f => (
                  <button key={f} onClick={() => toggleFood(f)} style={pill(selFoods.includes(f))}>{f}</button>
                ))}
              </div>
            </div>
            {/* Taste */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Smak</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {["Fylligt", "Lätt", "Fruktigt", "Torrt"].map(ts => (
                  <button key={ts} onClick={() => setSelTaste(selTaste === ts ? null : ts)} style={pill(selTaste === ts)}>{ts}</button>
                ))}
              </div>
            </div>
            {/* Sort — visually different */}
            <div style={{ borderTop: `1px solid ${t.bdrL}`, paddingTop: 10 }}>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Sortera</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {[["smakfynd", "Smakfynd-poäng"], ...(showDeals ? [["drop", "Störst sänkning"]] : []), ["expert", "Expertbetyg"], ["crowd", "Crowd-betyg"], ["price_asc", "Pris ↑"], ["price_desc", "Pris ↓"]].map(([k, l]) => (
                  <button key={k} onClick={() => setSortBy(k)} style={{
                    padding: "7px 14px", borderRadius: 8, border: sortBy === k ? `2px solid ${t.wine}` : `1px solid ${t.bdr}`,
                    background: sortBy === k ? `${t.wine}08` : "transparent",
                    color: sortBy === k ? t.wine : t.txM, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: sortBy === k ? 600 : 400,
                  }}>{l}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ WINE OF THE DAY ═══ */}
        {!search && !showDeals && !showNew && cat === "Rött" && <WineOfDay products={products} onSelect={nr => { window.location.hash = `vin/${nr}`; window.scrollTo({ top: 0, behavior: "smooth" }); }} />}

        {/* ═══ RESULTS ═══ */}
        <div style={{ marginBottom: 14, padding: "0 4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 13, color: t.txL }}>{loading ? "Laddar..." : `${filtered.length} produkter`}</span>
            <span style={{ fontSize: 11, color: t.txF }}>{{ smakfynd: "Mest smak för pengarna", drop: "Störst prissänkning först", expert: "Sorterat efter expertbetyg", crowd: "Sorterat efter crowd-betyg", price_asc: "Lägst pris först", price_desc: "Högst pris först" }[sortBy]}</span>
          </div>
        </div>

        {loadError && !loading && allData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📡</div>
            <p style={{ fontSize: 15, color: t.deal, marginBottom: 8 }}>{loadError}</p>
            <button onClick={() => { setLoading(true); setLoadError(null); window.location.reload(); }}
              style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${t.bdr}`, background: t.card, cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: t.txM }}>
              Försök igen
            </button>
          </div>
        ) : loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{ padding: "16px 18px", borderRadius: 14, background: t.card, border: `1px solid ${t.bdrL}`, display: "flex", gap: 14, alignItems: "flex-start", animation: `fadeIn 0.3s ease ${i * 0.08}s both` }}>
                <div style={{ width: 52, height: 52, borderRadius: 10, background: t.bdr, opacity: 0.4 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: "60%", height: 16, borderRadius: 4, background: t.bdr, opacity: 0.3, marginBottom: 6 }} />
                  <div style={{ width: "40%", height: 12, borderRadius: 4, background: t.bdr, opacity: 0.2, marginBottom: 8 }} />
                  <div style={{ width: "80%", height: 4, borderRadius: 2, background: t.bdr, opacity: 0.2 }} />
                </div>
                <div style={{ width: 50, height: 50, borderRadius: 12, background: t.bdr, opacity: 0.3 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: t.txL }}>
            <div style={{ fontSize: 14, color: t.txL, marginBottom: 8 }}>Inga resultat</div>
            <p style={{ fontSize: 17, fontFamily: t.serif, fontStyle: "italic", color: t.txM }}>Inga produkter matchade din sökning.</p>
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
              ["Budget: bästa under 100 kr", null, 0, 100],
              ["Mellanklass: 100–200 kr", null, 100, 200],
              ["Premium: 200–500 kr", null, 200, 500],
            ].map(([title, catFilter, pLo, pHi]) => {
              const sectionWines = filtered
                .filter(p => (!catFilter || p.category === catFilter) && (!pLo && !pHi || (p.price >= (pLo||0) && p.price < (pHi||99999))))
                .slice(0, 5);
              if (sectionWines.length === 0) return null;
              return (
                <div key={title}>
                  <h3 style={{ margin: "0 0 10px", fontSize: 16, fontFamily: t.serif, fontWeight: 400, color: t.tx }}>{title}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sectionWines.map((p, i) => <Card key={p.id || i} p={p} rank={i + 1} delay={0} allProducts={products} auth={auth} />)}
                  </div>
                </div>
              );
            })}
            {/* CTA → AI matcher */}
            <div style={{ textAlign: "center", padding: "20px 16px", borderRadius: 14, background: t.card, border: `1px solid ${t.bdr}` }}>
              <div style={{ fontSize: 14, fontFamily: t.serif, color: t.tx, marginBottom: 6 }}>Vet du vad du ska äta?</div>
              <p style={{ fontSize: 12, color: t.txL, margin: "0 0 10px" }}>Vår AI matchar rätt vin till din middag.</p>
              <button onClick={() => { const el = document.getElementById("section-food"); if (el) el.scrollIntoView({ behavior: "smooth" }); }}
                style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Prova AI-matchern ↓
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.slice(0, 1).map((p, i) => (
              <div key={p.id || i}>
                <Card p={p} rank={1} delay={0} allProducts={products} autoOpen={String(p.nr) === String(autoOpenNr)} auth={auth} />
                {!autoOpenNr && <div style={{ textAlign: "center", fontSize: 11, color: t.txL, margin: "-4px 0 6px", animation: "fadeIn 1s ease 0.5s both" }}>↑ Tryck på ett vin för att se mer</div>}
              </div>
            ))}
            {filtered.slice(1, 5).map((p, i) => <Card key={p.id || i} p={p} rank={i + 2} delay={Math.min((i + 1) * 0.04, 0.4)} allProducts={products} autoOpen={String(p.nr) === String(autoOpenNr)} auth={auth} />)}
            {filtered.length > 5 && <NewsletterCTA compact={true} />}
            {filtered.slice(5, 50).map((p, i) => <Card key={p.id || i} p={p} rank={i + 6} delay={Math.min((i + 5) * 0.04, 0.4)} allProducts={products} autoOpen={String(p.nr) === String(autoOpenNr)} auth={auth} />)}
            {filtered.length > 50 && (
              <div style={{ textAlign: "center", padding: "24px 20px", borderRadius: 14, background: t.surface, border: `1px solid ${t.bdr}` }}>
                <div style={{ fontSize: 14, color: t.txM, marginBottom: 8 }}>Visar topp 50 av {filtered.length} viner</div>
                <div style={{ fontSize: 12, color: t.txL }}>Använd filter för att hitta fler, eller logga in för att se hela listan.</div>
              </div>
            )}
          </div>
        )}

        {/* ═══ METHODOLOGY ═══ */}
        <Methodology />

        {/* ═══ NEWSLETTER ═══ */}
        <NewsletterCTA />

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
            <p style={{ margin: "0 0 4px" }}>Uppdaterad {new Date().toLocaleDateString("sv-SE", { month: "long", year: "numeric" })} · {products.length} viner · Data från Systembolagets sortiment</p>
            <p style={{ margin: 0 }}>Smakfynd är en oberoende tjänst och har ingen koppling till, och är inte godkänd av, Systembolaget. Vi säljer inte alkohol.</p>
            <p style={{ margin: "4px 0 0" }}><a href="/integritet/" style={{ color: t.txF, textDecoration: "none" }}>Integritetspolicy</a></p>
          </div>
          <p style={{ fontSize: 10, color: t.txF, fontStyle: "italic" }}>Njut med måtta.</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{ marginTop: 12, padding: "10px 20px", borderRadius: 10, border: `1px solid ${t.bdr}`, background: t.card, cursor: "pointer", fontFamily: "inherit", fontSize: 12, color: t.txM }}>
            ↑ Tillbaka till toppen
          </button>
        </footer>
      </div>
      {showBackToTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Tillbaka till toppen"
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 100,
            width: 44, height: 44, borderRadius: "50%",
            background: t.card, border: `1px solid ${t.bdr}`,
            boxShadow: t.sh3, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, color: t.txM, fontFamily: "inherit",
            animation: "fadeIn 0.2s ease",
          }}>↑</button>
      )}
    </div>
    {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={(data) => {
      auth.login(data);
      setShowLogin(false);
      // Sync local wines to server
      if (data.wines && Object.keys(data.wines).length > 0) {
        // Server has wines — merge into local
        const merged = { ...sv.data };
        for (const [nr, lists] of Object.entries(data.wines)) {
          merged[nr] = [...new Set([...(merged[nr] || []), ...lists])];
        }
        try { localStorage.setItem("smakfynd_saved_v2", JSON.stringify(merged)); } catch(e) {}
      }
      // Sync local to server
      auth.syncWines(sv.data);
    }} />}
    </SavedContext.Provider>
  );
}
