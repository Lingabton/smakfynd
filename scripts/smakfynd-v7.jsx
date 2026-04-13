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
const _sessionStart = Date.now();

// Session duration tracking — sends on page leave
try {
  const sendDuration = () => {
    const duration = Math.round((Date.now() - _sessionStart) / 1000);
    if (duration < 2) return; // skip bounces under 2s
    const device = window.innerWidth < 768 ? "mobile" : "desktop";
    navigator.sendBeacon?.(ANALYTICS_URL + "/event",
      JSON.stringify({ session: _sid, event: "session_end", data: { duration_s: duration, pages_viewed: performance.getEntriesByType?.("navigation")?.length || 1 }, page: location.hash || "/", device, referrer: document.referrer })
    ) || fetch(ANALYTICS_URL + "/event", {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ session: _sid, event: "session_end", data: { duration_s: duration }, page: location.hash || "/", device: device }),
      keepalive: true,
    }).catch(() => {});
  };
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") sendDuration(); });
  window.addEventListener("pagehide", sendDuration);
} catch(e) {}

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

// Debounced search tracking — only logs final query (not every keystroke)
let _searchTimer = null;
function trackSearch(query, count, clickedNr) {
  try {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => {
      fetch(ANALYTICS_URL + "/search", {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ session: _sid, query, results_count: count, clicked_nr: clickedNr }),
        keepalive: true,
      }).catch(() => {});
    }, 2000); // wait 2s after last keystroke
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

const SAMPLE_PRODUCTS = []; // Will be replaced by loaded data OR fetched from DATA_URL

const CATS = [
  { k:"all", l:"Alla", i:"✦" }, { k:"Rött", l:"Rött vin", i:"🍷" },
  { k:"Vitt", l:"Vitt vin", i:"🥂" }, { k:"Rosé", l:"Rosé", i:"🌸" },
  { k:"Mousserande", l:"Bubbel", i:"🍾" },
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
  bg: "#f5f1ea",       // warmer, slightly darker
  surface: "#fdfbf7",
  card: "#ffffff",
  // Borders
  bdr: "#e2d8c8",      // warmer border
  bdrL: "#ede6da",
  // Brand
  wine: "#8b2332",
  wineD: "#6b1a27",
  wineL: "#8b233210",
  // Text
  tx: "#1a1510",       // slightly darker for better contrast
  txM: "#3d3830",      // darker mid-text
  txL: "#6b6355",      // darker light text
  txF: "#9e9588",
  // Semantic
  green: "#2d7a3e",    // slightly cooler green
  greenL: "#2d7a3e10",
  deal: "#c44020",
  dealL: "#c4402010",
  gold: "#b08d40",
  // Shadows
  sh1: "0 1px 3px rgba(26,21,16,0.04)",
  sh2: "0 4px 12px rgba(26,21,16,0.06)",
  sh3: "0 8px 24px rgba(26,21,16,0.08)",
  shHover: "0 8px 28px rgba(26,21,16,0.10)",
};

// ── Shared styles ──
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
function getImageUrl(p, size = 200) {
  // Try SB image URL - use direct URL (works in most browsers)
  if (p.image_url) return p.image_url;
  if (p.nr) return `https://product-cdn.systembolaget.se/productimages/${p.nr}/${p.nr}_400.png`;
  return null;
}

// Fallback: try Systembolaget's other image CDN
function getImageUrlFallback(p) {
  if (p.nr) return `https://sb-product-media-prod.azureedge.net/productimages/${p.nr}/${p.nr}_100.png`;
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
        loading="lazy"
        onError={(e) => {
          // Try fallback CDN before giving up
          const fallback = getImageUrlFallback(p);
          if (fallback && e.target.src !== fallback) {
            e.target.src = fallback;
          } else {
            setErr(true);
          }
        }}
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

// Scroll-reveal hook — triggers animation when element enters viewport
function useScrollReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold, rootMargin: "50px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// Internal link helper — maps wine properties to relevant landing pages
function getInternalLinks(p) {
  const links = [];
  // Country links
  const countryMap = {
    "Italien": "basta-italienska-vin", "Frankrike": "basta-franska-vin",
    "Spanien": "basta-spanska-vin", "Chile": "basta-chilenska-vin",
    "Sydafrika": "basta-sydafrikanska-vin", "Australien": "basta-australiska-vin",
    "Portugal": "basta-portugisiska-vin",
  };
  if (countryMap[p.country]) links.push({ url: `/${countryMap[p.country]}/`, label: `Bästa ${p.country.toLowerCase()}ska viner` });

  // Grape links
  const grapeMap = {
    "cabernet sauvignon": "basta-cabernet-sauvignon", "malbec": "basta-malbec",
    "pinot noir": "basta-pinot-noir", "syrah": "basta-syrah-shiraz", "shiraz": "basta-syrah-shiraz",
    "tempranillo": "basta-tempranillo", "sangiovese": "basta-sangiovese",
    "chardonnay": "basta-chardonnay", "riesling": "basta-riesling",
    "sauvignon blanc": "basta-sauvignon-blanc", "zinfandel": "basta-zinfandel",
  };
  const grape = (p.grape || "").toLowerCase();
  for (const [key, slug] of Object.entries(grapeMap)) {
    if (grape.includes(key)) { links.push({ url: `/${slug}/`, label: `Bästa ${key.charAt(0).toUpperCase() + key.slice(1)}` }); break; }
  }

  // Type links
  const typeMap = { "Rött": "basta-roda-vin", "Vitt": "basta-vita-vin", "Rosé": "basta-rose", "Mousserande": "basta-bubbel" };
  if (typeMap[p.category]) links.push({ url: `/${typeMap[p.category]}/`, label: `Alla ${(p.category || "").toLowerCase()} viner` });

  // Price links
  if (p.price < 100) links.push({ url: "/vin-under-100-kr/", label: "Viner under 100 kr" });
  else if (p.price < 150) links.push({ url: "/vin-under-150-kr/", label: "Viner under 150 kr" });
  else if (p.price < 200) links.push({ url: "/vin-under-200-kr/", label: "Viner under 200 kr" });

  if (p.organic) links.push({ url: "/ekologiskt-vin/", label: "Ekologiska viner" });

  return links.slice(0, 3);
}

// ════════════════════════════════════════════════════════════
// components/Card.jsx
// ════════════════════════════════════════════════════════════
// src/components/Card.jsx
function Card({ p, rank, delay, totalInCategory, allProducts, autoOpen, auth }) {
  const [open, setOpen] = useState(!!autoOpen);
  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) track("click", { nr: p.nr, name: p.name, score: p.smakfynd_score, rank });
  };
  const sv = React.useContext(SavedContext);
  const s100 = p.smakfynd_score;
  const [label, col, emoji] = getScoreInfo(s100);
  const foodStr = (p.food_pairings || []).slice(0, 3).join(", ");
  const sbUrl = `https://www.systembolaget.se/produkt/vin/${p.nr}`;
  const badge = rank === 1 ? "Bästa köpet" : rank <= 3 ? `Topp ${rank}` : null;
  const [cardRef, cardVisible] = useScrollReveal(0.05);
  const [hovered, setHovered] = useState(false);
  // Systembolaget food pairing SVG icons (official paths)
  const SB_FOOD_ICONS = {
    "Nöt": { vb: "0 0 35 32", tx: -335, ty: -407, d: "M362.64,417.04 C364.12,416.28 365.48,416 366.6,416 C367.8,416 368.88,416.36 369.68,417.04 C369.12,417.72 368.16,420.04 365.44,420.04 C364.4,420.04 363.24,419.76 361.76,419.04 C361.8,419.2 361.8,419.44 361.8,419.64 C361.8,421.08 360.92,423.52 360.84,426.24 C361.04,427.52 361.2,428.8 361.2,429.84 C361.2,433.88 359.8,436.24 358.6,436.92 C357.28,437.64 355,438.48 352.52,438.48 C350.04,438.48 347.76,437.68 346.36,436.92 C345.16,436.28 343.8,433.76 343.8,429.8 C343.8,428.72 343.92,427.52 344.12,426.24 C344.12,423.6 343.24,421.08 343.24,419.64 C343.24,419.44 343.24,419.2 343.28,419.04 C341.8,419.76 340.68,420.04 339.68,420.04 C337.04,420.04 335.8,418 335.32,417.04 C336.12,416.36 337.08,416 338.4,416 C339.52,416 340.88,416.28 342.4,417.04 C340.48,415.56 339.88,413.56 339.88,411.88 C339.88,409.48 341.16,407.52 342.12,407.52 C342.2,407.52 342.36,407.6 342.52,407.64 C343.84,408.68 342.68,413.48 345.72,413.48 L359.36,413.48 C362.44,413.48 361.16,408.68 362.48,407.64 C362.64,407.6 362.8,407.52 362.88,407.52 C363.92,407.52 365.12,409.48 365.12,411.92 C365.12,413.64 364.44,415.56 362.64,417.04 Z M345.56,421.88 C345.56,423.24 347,423.8 347.8,423.8 C349.44,423.8 349.88,422.6 349.88,421.88 C349.88,420.88 349.2,419.84 347.8,419.84 C347.04,419.84 345.56,420.24 345.56,421.88 Z M355.16,421.88 C355.16,423.24 356.32,423.8 357.2,423.8 C358.76,423.8 359.44,422.6 359.44,421.88 C359.44,420.88 358.72,419.84 357.28,419.84 C356.6,419.84 355.16,420.24 355.16,421.88 Z" },
    "Kött": { vb: "0 0 35 32", tx: -335, ty: -407, d: "M362.64,417.04 C364.12,416.28 365.48,416 366.6,416 C367.8,416 368.88,416.36 369.68,417.04 C369.12,417.72 368.16,420.04 365.44,420.04 C364.4,420.04 363.24,419.76 361.76,419.04 C361.8,419.2 361.8,419.44 361.8,419.64 C361.8,421.08 360.92,423.52 360.84,426.24 C361.04,427.52 361.2,428.8 361.2,429.84 C361.2,433.88 359.8,436.24 358.6,436.92 C357.28,437.64 355,438.48 352.52,438.48 C350.04,438.48 347.76,437.68 346.36,436.92 C345.16,436.28 343.8,433.76 343.8,429.8 C343.8,428.72 343.92,427.52 344.12,426.24 C344.12,423.6 343.24,421.08 343.24,419.64 C343.24,419.44 343.24,419.2 343.28,419.04 C341.8,419.76 340.68,420.04 339.68,420.04 C337.04,420.04 335.8,418 335.32,417.04 C336.12,416.36 337.08,416 338.4,416 C339.52,416 340.88,416.28 342.4,417.04 C340.48,415.56 339.88,413.56 339.88,411.88 C339.88,409.48 341.16,407.52 342.12,407.52 C342.2,407.52 342.36,407.6 342.52,407.64 C343.84,408.68 342.68,413.48 345.72,413.48 L359.36,413.48 C362.44,413.48 361.16,408.68 362.48,407.64 C362.64,407.6 362.8,407.52 362.88,407.52 C363.92,407.52 365.12,409.48 365.12,411.92 C365.12,413.64 364.44,415.56 362.64,417.04 Z M345.56,421.88 C345.56,423.24 347,423.8 347.8,423.8 C349.44,423.8 349.88,422.6 349.88,421.88 C349.88,420.88 349.2,419.84 347.8,419.84 C347.04,419.84 345.56,420.24 345.56,421.88 Z M355.16,421.88 C355.16,423.24 356.32,423.8 357.2,423.8 C358.76,423.8 359.44,422.6 359.44,421.88 C359.44,420.88 358.72,419.84 357.28,419.84 C356.6,419.84 355.16,420.24 355.16,421.88 Z" },
    "Lamm": { vb: "0 0 36 30", tx: -697, ty: -409, d: "M730.28,429.88 C730.28,430.48 730.16,431.36 729.4,432.12 C729.72,433.52 730.32,436.2 730.32,437.12 C730.32,437.76 729.96,438.12 729.52,438.12 C729.16,438.12 728.8,437.8 728.6,437.2 C728.32,436.36 727.72,434.4 727.12,433 C725.88,433 724.88,432.36 724.84,431.92 L724.84,432.12 C724.84,433.36 723.56,434.16 722.16,434.16 C721.08,434.16 720.04,433.64 719.44,432.32 C718.8,433.28 717.56,433.76 716.32,433.76 C714.92,433.76 713.68,433.16 713.32,431.72 C712.88,432.16 712.24,432.4 711.64,432.52 C711,433.8 710.28,436.2 710.04,437.24 C709.88,437.92 709.4,438.24 709.04,438.24 C708.6,438.24 708.28,437.8 708.28,437.2 C708.28,435.8 709.04,432.76 709.24,431.68 C708.96,431.32 708.64,430.92 708.64,430.24 L708.64,429.84 C708.64,429.72 708.64,429.6 708.68,429.48 L708.64,429.48 C708.16,429.48 705.8,428.36 705.8,425.84 C705.8,424.52 706.48,423.72 707.16,423.12 C707.56,422.8 708,422.56 708.48,422.36 C708.04,421.36 707.4,420.96 706.48,420.96 C704.72,420.96 702.04,422.56 699.96,422.56 C697.84,422.56 697.12,421 697.12,419.84 C697.12,419.4 697.2,418.96 697.4,418.6 C698.04,417.52 700.16,416.2 702.12,415.2 C703.28,414.6 704.52,414 705.92,413.4 C705.84,413.24 705.76,413.08 705.68,412.88 C705.56,412.56 705.44,412.04 705.44,411.52 C705.44,411.24 705.48,410.84 705.64,410.4 C705.96,409.48 706.2,409 706.56,409 C707,409 707.32,409.6 707.96,410.64 C708.36,411.32 708.36,412.2 708.36,412.84 L708.36,413.24 C708.56,412.88 708.8,412.52 709.04,412.2 C709.48,411.6 710,411.08 710.6,410.88 C711.52,410.6 712.08,410.44 712.44,410.44 C712.8,410.44 712.96,410.6 712.96,410.96 C712.96,411.16 712.88,411.6 712.76,412.2 C712.56,413.04 711.96,413.64 711.36,414.08 C711,414.32 710.64,414.52 710.24,414.64 C711.04,415.4 711.48,416.32 711.72,417.12 C711.88,417.6 711.96,418.08 712.04,418.52 C712.08,418.08 712.24,417.72 712.48,417.4 C712.92,416.8 713.68,416.28 715.08,416.28 C716,416.28 716.56,416.72 717,417.16 C717.24,417.44 717.44,417.72 717.56,418.04 C717.8,417.56 718.08,417.12 718.4,416.76 C719,416.12 719.84,415.48 721.08,415.48 C722.24,415.48 722.96,416.04 723.44,416.64 C723.72,417 723.96,417.4 724.12,417.84 C724.36,417.56 724.64,417.32 724.92,417.12 C725.44,416.76 726.12,416.44 726.88,416.44 C728.6,416.44 729.8,418 729.8,419.72 L729.8,420 L730.16,420 C732.04,420 732.88,421.04 732.88,422.28 C732.88,423.2 732.36,424.16 731.4,424.76 C732.32,424.88 732.8,425.88 732.8,426.84 C732.8,428.16 732,429.44 730.28,429.44 L730.28,429.88 Z M707.04,418.2 C707.96,418.2 708.64,417.8 708.64,416.88 C708.64,416.08 707.92,415.24 706.96,415.24 C706.16,415.24 705.52,415.92 705.52,416.68 C705.52,417.64 706.12,418.2 707.04,418.2 Z" },
    "Fisk": { vb: "0 0 41 23", tx: -97, ty: -414, d: "M137.38,419.8 C137.38,421.16 135.34,423.52 135.34,426.12 C135.34,428.48 137.54,430.48 137.54,432.08 C137.54,432.8 136.7,433.12 136.1,433.12 C133.34,433.12 129.26,428.76 128.14,427.52 C125.78,430.28 119.98,436.08 113.34,436.08 C110.14,436.08 107.18,434.76 104.7,433 C109.62,432.08 110.18,429.04 110.18,429.04 C108.7,429.8 106.78,430.28 104.9,430.28 C102.22,430.28 99.22,429.04 97.74,426.52 C97.54,426.12 97.46,425.92 97.46,425.68 C97.46,425 98.54,425.08 99.22,424.8 C101.82,420.2 106.34,418.04 106.34,418.04 C106.34,418.04 108.62,414.84 111.1,414.84 C121.5,414.84 125.78,421.84 128.14,424.6 C129.26,423.24 133.86,418.88 136.22,418.88 C136.66,418.88 137.38,419 137.38,419.8 Z M105.58,423.56 C105.58,424.48 106.14,425.44 107.5,425.44 C108.82,425.44 109.54,424.44 109.54,423.72 C109.54,422.72 108.82,421.64 107.54,421.64 C106.06,421.64 105.58,422.64 105.58,423.56 Z" },
    "Fläsk": { vb: "0 0 42 29", tx: -273, ty: -409, d: "M314.72,410.88 L314.76,410.88 C314.76,411.08 312.52,414.68 308.68,415.96 C308,417.24 306.96,418.44 306.28,419.04 C307.44,420.76 308,422.56 308,424.2 C308,430.12 305.32,432.12 305.32,436.08 C305.32,436.68 305.36,437.28 305.52,438 L301.76,438 C301.84,437.64 301.84,437.28 301.84,436.92 C301.84,434.12 300.2,432.52 297.76,432.52 C297.08,432.52 296.68,432.68 294,432.68 C291.6,432.68 290.84,432.52 290.28,432.52 C289,432.52 288.16,432.96 287.6,434.64 C287.36,435.72 287.24,436.88 287.24,438 L283.72,438 C283.72,438 283.84,437.28 283.84,436.36 C283.84,435.16 283.72,433.36 282.96,432.16 C281.56,430.04 274.64,429.12 273.24,428.8 L273.24,424.32 C273.24,424.32 274.32,424.76 275.36,424.76 C276.2,424.76 277.08,424.52 277.44,423.64 C278.32,421.6 279.64,418.84 279.64,418.84 L278.2,413.48 L282.76,416.12 L282.4,411.08 L286.12,414.24 C287.8,413.52 290.24,413.04 293.48,413.04 C298.92,413.04 302.8,415.04 305.16,417.64 C305.52,417.32 306,416.76 306.4,416.16 C304.2,416.16 302.68,414.36 302.68,412.48 C302.68,410.76 303.96,409.56 305.76,409.56 C307.64,409.56 309.28,410.92 309.28,413.12 C309.28,413.48 309.16,414.28 309.12,414.4 C311.16,414.16 314.72,410.88 314.72,410.88 Z M284.84,425.2 C285.8,425.2 286.68,424.52 286.68,423.44 C286.68,422.44 286.04,421.48 284.72,421.48 C283.44,421.48 282.68,422.44 282.68,423.32 C282.68,424.48 283.68,425.2 284.84,425.2 Z M306.76,414.64 L307.12,414.64 C307.28,414.24 307.48,413.52 307.48,413.12 C307.48,411.92 306.72,410.84 305.48,410.84 C304.72,410.84 304.2,411.52 304.2,412.24 C304.2,413.56 305.2,414.64 306.76,414.64 Z" },
    "Skaldjur": { vb: "0 0 46 19", tx: -158, ty: -415, d: "M193.14,415.92 C199.34,415.92 203.74,419.12 203.74,424.52 C203.74,431.12 198.38,434 192.22,434 C187.86,434 183.34,432.56 180.66,430.16 C184.34,430.6 187.74,431.08 190.46,431.08 C194.3,431.08 196.74,430.24 196.74,427.92 C196.74,426 193.26,425.96 193.26,425.96 C192.58,425.96 192.14,426.64 191.38,427.36 C190.94,427.52 189.26,428.12 186.78,428.12 C185.02,428.12 182.74,427.88 180.3,426.8 C179.42,426.44 178.06,425.4 178.06,425.4 C178.06,425.4 166.82,423.72 163.46,422.76 C164.5,422.84 169.62,423.24 172.98,423.24 C174.3,423.24 175.42,423.16 175.82,423.04 C175.82,423.04 162.62,420.44 158.26,417.76 C158.26,417.76 167.7,420 174.86,420 C176.94,420 178.86,419.8 180.3,419.32 C186.7,417.04 190.06,415.92 193.14,415.92 Z M178.78,420.6 C178.26,420.6 177.14,420.96 177.14,422.08 C177.14,423.24 178.02,423.6 178.58,423.6 C179.1,423.6 180.14,423.24 180.14,422.08 C180.14,421 179.26,420.6 178.78,420.6 Z" },
    "Kyckling": { vb: "0 0 29 31", tx: -224, ty: -409, d: "M251.16,425.84 C251.76,426.64 252.64,427.76 252.64,428.68 C252.64,429.04 252.6,429.24 252.28,429.52 C252.08,429.8 250.28,430.04 249.84,430.24 C248.16,431.2 247.2,432.96 245.48,433.8 C245.32,433.84 245,434.04 245,434.52 C245,434.88 245.36,435.92 245.68,436.28 C246,436.64 247.76,436.44 247.76,437.12 C247.76,437.72 246.44,437.68 244.8,438.32 C243.24,438.92 242.32,439.96 241.6,439.96 C241.32,439.96 241.04,439.76 241.04,439.48 C241.04,438.92 242.72,438.12 242.72,437.76 C242.72,437.68 242.68,437.56 242.52,437.56 C242.36,437.56 240.64,438.32 240.4,438.32 C240.2,438.32 240.08,438.04 240.08,437.88 C240.08,437 242.28,436.36 243.8,436.16 C244.24,436.08 244.36,435.88 244.36,435.6 C244.36,435.24 244.16,434.88 243.96,434.6 C243.8,434.48 243.76,434.48 243.6,434.48 C243.2,434.48 242.32,434.92 240.08,434.92 C238.24,434.92 237.8,434.72 237.24,434.72 C237,434.72 236.84,434.84 236.64,435.04 C236.24,435.48 235.72,436.24 235.72,436.68 C235.72,437.68 237.36,438.08 237.36,438.8 C237.36,438.88 237.36,439 237.24,439.08 C237.24,439.12 237.16,439.12 237.04,439.12 C236.64,439.12 234.8,438.32 232.76,438.32 L231,438.32 C230.6,438.32 230.4,438.32 230.4,438.08 C230.4,436.92 232.96,437.36 232.96,436.92 C232.96,436.44 230.4,436.92 230.4,436.24 C230.4,435.8 230.96,435.6 231.56,435.6 C232.56,435.6 234,436.08 234.28,436.08 C234.8,436.08 235.28,435.24 235.28,434.6 C235.28,434.28 234.96,434.04 234.72,433.96 C230.68,432.44 227.6,429.48 227.6,424.92 C227.6,421 230.44,418.8 230.44,417.08 L230.44,417 C230.44,417 224.36,416.8 224.36,416.16 C224.36,415.56 229.36,412.48 229.36,412.48 C229.72,410.48 231.84,409.12 233.72,409.12 C236.28,409.12 237.92,411.56 237.92,413.84 C237.92,415.16 237.44,416.72 236.36,418.16 C235.92,418.72 234.2,420.4 234.2,421.44 C234.2,421.88 234.64,422.36 235.4,422.36 C237.24,422.36 239.24,420.8 241.04,420.8 C244.76,420.8 248.84,423 251.16,425.84 Z M231.56,412.64 C231.56,413.28 232,414.04 233.16,414.04 C234.08,414.04 234.72,413.52 234.72,412.72 C234.72,411.92 234.08,411.08 233.16,411.08 C232.2,411.08 231.56,411.76 231.56,412.64 Z" },
    "Fågel": { vb: "0 0 29 31", tx: -224, ty: -409, d: "M251.16,425.84 C251.76,426.64 252.64,427.76 252.64,428.68 C252.64,429.04 252.6,429.24 252.28,429.52 C252.08,429.8 250.28,430.04 249.84,430.24 C248.16,431.2 247.2,432.96 245.48,433.8 C245.32,433.84 245,434.04 245,434.52 C245,434.88 245.36,435.92 245.68,436.28 C246,436.64 247.76,436.44 247.76,437.12 C247.76,437.72 246.44,437.68 244.8,438.32 C243.24,438.92 242.32,439.96 241.6,439.96 C241.32,439.96 241.04,439.76 241.04,439.48 C241.04,438.92 242.72,438.12 242.72,437.76 C242.72,437.68 242.68,437.56 242.52,437.56 C242.36,437.56 240.64,438.32 240.4,438.32 C240.2,438.32 240.08,438.04 240.08,437.88 C240.08,437 242.28,436.36 243.8,436.16 C244.24,436.08 244.36,435.88 244.36,435.6 C244.36,435.24 244.16,434.88 243.96,434.6 C243.8,434.48 243.76,434.48 243.6,434.48 C243.2,434.48 242.32,434.92 240.08,434.92 C238.24,434.92 237.8,434.72 237.24,434.72 C237,434.72 236.84,434.84 236.64,435.04 C236.24,435.48 235.72,436.24 235.72,436.68 C235.72,437.68 237.36,438.08 237.36,438.8 C237.36,438.88 237.36,439 237.24,439.08 C237.24,439.12 237.16,439.12 237.04,439.12 C236.64,439.12 234.8,438.32 232.76,438.32 L231,438.32 C230.6,438.32 230.4,438.32 230.4,438.08 C230.4,436.92 232.96,437.36 232.96,436.92 C232.96,436.44 230.4,436.92 230.4,436.24 C230.4,435.8 230.96,435.6 231.56,435.6 C232.56,435.6 234,436.08 234.28,436.08 C234.8,436.08 235.28,435.24 235.28,434.6 C235.28,434.28 234.96,434.04 234.72,433.96 C230.68,432.44 227.6,429.48 227.6,424.92 C227.6,421 230.44,418.8 230.44,417.08 L230.44,417 C230.44,417 224.36,416.8 224.36,416.16 C224.36,415.56 229.36,412.48 229.36,412.48 C229.72,410.48 231.84,409.12 233.72,409.12 C236.28,409.12 237.92,411.56 237.92,413.84 C237.92,415.16 237.44,416.72 236.36,418.16 C235.92,418.72 234.2,420.4 234.2,421.44 C234.2,421.88 234.64,422.36 235.4,422.36 C237.24,422.36 239.24,420.8 241.04,420.8 C244.76,420.8 248.84,423 251.16,425.84 Z M231.56,412.64 C231.56,413.28 232,414.04 233.16,414.04 C234.08,414.04 234.72,413.52 234.72,412.72 C234.72,411.92 234.08,411.08 233.16,411.08 C232.2,411.08 231.56,411.76 231.56,412.64 Z" },
    "Vilt": { vb: "0 0 40 29", tx: -390, ty: -407, d: "M410.78,433.84 C410.78,433.84 410.46,434 409.86,434 C409.22,434 408.26,433.84 407.14,433.24 C405.9,432.56 404.3,430.04 402.38,430.04 C401.1,430.04 400.5,430.8 398.42,433.08 C397.86,433.64 397.26,433.96 396.54,433.96 C393.78,433.96 390.46,429.88 390.46,428.04 C390.46,425 394.18,419.68 399.54,419.6 L413.62,419.36 C414.46,419.36 414.82,418.28 414.82,417.6 C414.82,417.12 414.74,416.8 414.5,416.76 C414.06,416.68 411.98,416.68 409.7,416.68 C406.3,416.68 399.5,416.52 397.46,414.2 C396.9,413.52 396.02,412.44 396.02,411.44 C396.02,410.84 396.42,410.2 397.06,410.2 C397.54,410.2 398.06,410.44 398.42,411.04 C399.1,412.2 400.06,413.36 401.62,413.36 C402.94,413.36 402.38,411.4 402.78,410.68 C403.06,410.16 403.46,409.96 403.9,409.96 C404.46,409.96 404.94,410.36 405.06,411.2 C405.22,412.2 404.86,413.56 406.18,414.04 C406.94,414.32 408.22,414.4 409.58,414.4 C411.62,414.4 413.86,414.16 414.3,414.04 C415.66,413.64 415.38,412.2 415.58,411.24 C415.74,410.48 416.34,410.12 416.82,410.12 C417.26,410.12 417.58,410.36 417.86,410.88 C418.1,411.36 418.06,412.24 418.14,412.8 C418.22,413.52 418.74,413.88 419.38,413.88 C419.94,413.88 420.5,413.64 420.7,413.08 C421.06,411.88 420.7,411.24 421.22,410.32 C421.54,409.8 421.94,409.56 422.46,409.56 C423.46,409.56 423.58,410.48 423.58,411.44 C423.58,412.04 423.58,412.8 424.66,412.8 C426.7,412.8 426.34,408.88 427.34,408.04 C427.54,407.84 427.82,407.76 428.14,407.76 C429.26,407.76 429.54,408.6 429.54,409.24 C429.54,410.76 428.54,413.84 427.06,414.88 C425.78,415.8 420.54,415.52 418.42,416.92 C418.14,417.12 417.98,417.6 417.98,418 C417.98,418.56 418.18,419.36 418.78,419.88 C423.26,423.64 424.42,431.6 424.58,434.72 C424.62,435.4 424.14,435.72 423.5,435.72 L411.42,435.72 C410.86,435.72 410.78,433.84 410.78,433.84 Z M411.66,425.4 C412.54,425.4 413.3,424.76 413.3,423.88 C413.3,422.92 412.7,422.16 411.62,422.16 C410.54,422.16 409.9,423.12 409.9,423.88 C409.9,424.84 411.02,425.4 411.66,425.4 Z" },
    "Ost": { vb: "0 0 27 28", tx: -604, ty: -410, d: "M619.72,423.08 C621.44,423.08 622.76,421.64 622.84,419.92 L630.52,433.04 C630.52,433.04 625.24,437.96 617.48,437.96 C609.76,437.96 604.48,433.04 604.48,433.04 L607.68,427.6 C608.08,429.52 609.76,431 611.72,431 C613.92,431 615.72,429.04 615.72,426.72 C615.72,424.28 613.84,422.4 611.48,422.4 C611.16,422.4 610.88,422.52 610.52,422.6 L617.48,410.36 L620.96,416.72 C620.6,416.56 620.2,416.4 619.76,416.4 C617.96,416.4 616.6,417.92 616.6,419.76 C616.6,421.64 617.96,423.08 619.72,423.08 Z M624.84,432.4 C624.84,431.2 624.16,429.52 622.24,429.52 C620.76,429.52 619.44,430.8 619.44,432.4 C619.44,433.88 620.6,435.12 622.04,435.12 C623.52,435.12 624.84,433.88 624.84,432.4 Z" },
    "Grönsaker": { vb: "0 0 23 37", tx: -450, ty: -404, d: "M463.42,423.12 C464.18,423.08 464.98,423 465.78,423 C467.78,423 469.86,423.4 471.46,425.04 C472.46,426.04 472.94,427.32 472.94,428.72 C472.94,430.24 472.3,431.84 470.86,433.28 C468.98,435.24 466.26,435.88 464.38,437 C462.14,438.32 462.34,440.12 461.54,440.12 C460.66,440.12 460.86,438.32 458.58,437 C456.66,435.88 453.94,435.24 452.02,433.28 C450.7,431.84 450.06,430.24 450.06,428.72 C450.06,427.32 450.54,425.96 451.46,425.04 C453.1,423.4 455.06,423 457.06,423 C457.62,423 458.06,423 458.66,423.08 C458.26,422.2 457.86,421.28 457.46,420.56 C456.78,419.36 455.94,419.56 454.82,419.44 C453.66,419.28 452.7,418.96 452.7,418.04 C452.7,417.72 452.78,417.32 453.1,416.88 C452.78,417 452.46,417.08 452.22,417.08 C451.38,417.08 450.94,416.4 450.94,415.64 C450.94,415.2 451.14,414.56 451.62,414.32 C451.14,413.68 450.94,413.04 450.94,412.56 C450.94,411.64 451.58,410.96 452.38,410.96 C452.98,410.96 453.66,411.32 454.3,412.12 C454.78,411.72 455.22,411.52 455.62,411.52 C456.46,411.52 457.06,412.12 457.06,412.96 C457.06,413.36 456.94,413.68 456.74,414.12 C457.06,413.96 457.46,413.92 457.7,413.92 C458.78,413.92 459.3,414.8 459.3,415.76 C459.3,417.08 459.02,418.28 459.02,419.36 C459.02,419.64 459.02,420 459.1,420.2 C459.3,420.92 459.7,422.08 460.14,423.12 C460.66,423.2 461.1,423.2 461.86,423.2 C462.06,421.48 462.5,419.36 462.5,417.92 C462.5,416.6 461.5,415.32 461.02,414.12 C460.78,413.56 460.66,412.96 460.66,412.48 C460.66,411.32 461.3,410.52 462.98,410.2 C462.3,409.64 461.94,408.88 461.94,408.32 C461.94,407.36 462.74,406.56 463.74,406.56 C464.18,406.56 464.78,406.72 465.3,407.04 C465.5,405.4 466.54,404.64 467.46,404.64 C468.42,404.64 469.26,405.28 469.26,406.56 C469.26,407 469.1,407.56 468.9,408.12 C468.9,408.12 469.02,408.08 469.38,408.08 C470.62,408.08 471.26,409 471.26,409.76 C471.26,410.6 470.62,411.36 469.18,411.52 C469.86,412.56 470.1,413.24 470.1,413.92 C470.1,415.04 469.18,415.6 467.98,416 C466.34,416.52 464.82,416.68 464.42,418.4 C464.06,419.8 463.7,421.64 463.42,423.12 Z" },
  };
  const foodSvg = (type) => {
    const match = Object.entries(SB_FOOD_ICONS).find(([k]) => type.toLowerCase().includes(k.toLowerCase()));
    if (!match) return null;
    const ic = match[1];
    return React.createElement("svg", { width: 18, height: 18, viewBox: ic.vb, style: { flexShrink: 0 } },
      React.createElement("g", { stroke: "none", strokeWidth: "1", fillRule: "evenodd" },
        React.createElement("g", { transform: `translate(${ic.tx}, ${ic.ty})`, fill: t.txM },
          React.createElement("path", { d: ic.d })
        )
      )
    );
  };

  return (
    <div
      ref={cardRef}
      role="button" tabIndex={0} aria-expanded={open}
      aria-label={`${p.name} ${p.sub || ''} — ${s100} poäng, ${p.price} kr`}
      onClick={handleOpen}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleOpen(); } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: t.card, borderRadius: 16, outline: "none",
        border: `1px solid ${open ? t.bdr : hovered ? t.bdr : t.bdrL}`,
        boxShadow: open ? t.sh3 : hovered ? t.shHover : t.sh1,
        transition: "all 0.3s ease", overflow: "hidden",
        opacity: cardVisible ? 1 : 0,
        transform: cardVisible
          ? (hovered && !open ? "translateY(-2px) perspective(800px) rotateX(0.5deg)" : "translateY(0)")
          : "translateY(16px)",
        cursor: "pointer",
      }}
    >
      {/* ═══ TOP: Image + Name + Score ═══ */}
      <div style={{ padding: "18px 20px 0", display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* Product image with rank badge */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <ProductImage p={p} size={56} />
          <div style={{
            position: "absolute", top: -5, left: -5,
            width: 22, height: 22, borderRadius: 7,
            background: rank <= 3 ? `linear-gradient(135deg, ${t.wine}, ${t.wineD})` : t.card,
            border: rank <= 3 ? "none" : `1px solid ${t.bdr}`,
            color: rank <= 3 ? "#fff" : t.txM,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 800, fontFamily: "'Instrument Serif', Georgia, serif",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          }}>
            {rank}
          </div>
          {/* Badge below image */}
          {badge && (
            <div style={{
              marginTop: 6, padding: "2px 6px", borderRadius: 4, textAlign: "center",
              background: rank === 1 ? t.wine : `${t.wine}15`,
              color: rank === 1 ? "#fff" : t.wine,
              fontSize: 7, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em",
              whiteSpace: "nowrap",
            }}>{badge}</div>
          )}
        </div>

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            margin: 0, fontSize: 20, fontFamily: "'Instrument Serif', Georgia, serif",
            fontWeight: 400, color: t.tx, lineHeight: 1.15,
          }}>{p.name}</h3>
          {/* Overlapping badges */}
          {(p.organic || p.price_vs_launch_pct > 0 || p.is_new) && (
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              {p.price_vs_launch_pct > 0 && <span style={{ fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: t.deal, color: "#fff" }}>−{p.price_vs_launch_pct}%</span>}
              {p.organic && <span style={{ fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: t.green, color: "#fff" }}>EKO</span>}
              {p.is_new && <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: t.wine, color: "#fff" }}>NY</span>}
            </div>
          )}
        </div>

        {/* Score circle + label */}
        <div style={{ flexShrink: 0, textAlign: "center" }}>
          <svg width="52" height="52" viewBox="0 0 50 50" style={{ display: "block" }}>
            <circle cx="25" cy="25" r="22" fill="#e8f0e4" />
            <circle cx="25" cy="25" r="22" fill="none" stroke="#d4ddd0" strokeWidth="2.5" />
            <circle cx="25" cy="25" r="22" fill="none" stroke="#2d6b3f" strokeWidth="2.5"
              strokeDasharray={`${s100 * 1.38} 138`} strokeLinecap="round"
              transform="rotate(-90 25 25)" style={{ transition: "stroke-dasharray 0.8s ease" }} />
            <text x="25" y="30" textAnchor="middle" fontFamily="'Instrument Serif', Georgia, serif"
              fontSize="19" fontWeight="900" fill="#2d6b3f">{s100}</text>
          </svg>
          <div style={{ fontSize: 9, fontWeight: 600, color: col, marginTop: 2 }}>{label}</div>
        </div>
      </div>

      {/* ═══ STRUCTURED INFO GRID ═══ */}
      <div style={{ padding: "12px 20px 0" }}>
        {/* 2-column metadata grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
          <div>
            <div style={{ fontSize: 9, color: t.txF, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Druva</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{p.grape || p.sub || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: t.txF, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Land</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{p.country}{p.region ? `, ${p.region}` : ""}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: t.txF, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Passar till</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {(p.food_pairings || []).slice(0, 3).map((f, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 13, color: t.txM }}>
                  {foodSvg(f)}
                  {f}
                </span>
              ))}
              {(!p.food_pairings || p.food_pairings.length === 0) && <span style={{ fontSize: 13, color: t.txL }}>—</span>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: t.txF, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Pris</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: t.tx, fontFamily: "'Instrument Serif', Georgia, serif" }}>{p.price} kr</span>
              {p.vol && p.price && <span style={{ fontSize: 11, color: t.txL }}>{Math.round(p.price / (p.vol / 1000))} kr/l</span>}
            </div>
            {p.launch_price && p.price_vs_launch_pct > 0 && (
              <span style={{ fontSize: 11, color: t.deal, fontWeight: 600 }}>Sänkt från {p.launch_price} kr</span>
            )}
          </div>
        </div>

        {/* ═══ SMAKPROFIL + POÄNG side by side — grouped with bg ═══ */}
        <div style={{
          display: "flex", gap: 20, marginTop: 14,
          padding: "14px 16px", borderRadius: 12,
          background: t.bg,
        }}>
          {/* Taste profile (left) */}
          {(p.taste_body || p.taste_fruit) && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: t.txF, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Smakprofil</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["Lätt", "Fylligt", p.taste_body, 12],
                  ["Stram", "Fruktigt", p.taste_fruit, 12],
                ].filter(([_a, _b, v]) => v != null && v > 0).map(([lo, hi, val, max]) => (
                  <div key={lo} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: t.txL, width: 34, textAlign: "right", flexShrink: 0 }}>{lo}</span>
                    <div style={{ flex: 1, height: 2, borderRadius: 1, background: t.bdr, position: "relative" }}>
                      <div style={{
                        position: "absolute", top: "50%", left: `${(val / max) * 100}%`,
                        width: 9, height: 9, borderRadius: "50%",
                        background: t.wine, border: `2px solid ${t.bg}`,
                        transform: "translate(-50%, -50%)",
                        boxShadow: `0 0 0 1px ${t.wine}30`,
                      }} />
                    </div>
                    <span style={{ fontSize: 11, color: t.txL, width: 40, flexShrink: 0 }}>{hi}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {(p.taste_body || p.taste_fruit) && <div style={{ width: 1, background: t.bdr, alignSelf: "stretch" }} />}

          {/* Score bars (right) */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: t.txF, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Poäng</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {p.crowd_score && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: t.txL, width: 40 }}>Crowd</span>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: t.bdr, overflow: "hidden" }}>
                    <div style={{ width: `${p.crowd_score * 10}%`, height: "100%", borderRadius: 2, background: "#6b8cce", transition: "width 0.8s ease" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#6b8cce", minWidth: 24, textAlign: "right" }}>{p.crowd_score.toFixed(1)}</span>
                </div>
              )}
              {p.expert_score && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: t.txL, width: 40 }}>Expert</span>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: t.bdr, overflow: "hidden" }}>
                    <div style={{ width: `${p.expert_score * 10}%`, height: "100%", borderRadius: 2, background: "#b07d3b", transition: "width 0.8s ease" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#b07d3b", minWidth: 24, textAlign: "right" }}>{p.expert_score.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ACTION ROW ═══ */}
      <div style={{
        padding: "14px 20px", marginTop: 10,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderTop: `1px solid ${t.bdrL}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {sv && <SaveButton nr={p.nr || p.id} sv={sv} auth={auth} />}
          <button onClick={e => {
              e.stopPropagation();
              track("share", { nr: p.nr, name: p.name });
              const url = `https://smakfynd.se/#vin/${p.nr}`;
              const text = `${p.name} ${p.sub || ''} — ${p.smakfynd_score}/100 på Smakfynd (${p.price}kr)`;
              if (navigator.share) { navigator.share({ title: p.name, text, url }).catch(() => {}); }
              else { navigator.clipboard?.writeText(`${text}\n${url}`); }
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 500, color: t.txM, background: "none", border: "none", cursor: "pointer", padding: "2px 0", fontFamily: "inherit" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            Dela
          </button>
          <a href={sbUrl} target="_blank" rel="noopener noreferrer" onClick={e => { e.stopPropagation(); track("sb_click", { nr: p.nr, name: p.name, price: p.price }); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 500, color: t.txM, textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.color = t.wine}
            onMouseLeave={e => e.currentTarget.style.color = t.txM}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Se på systembolaget
          </a>
        </div>
        <span style={{ fontSize: 12, color: t.txM, display: "flex", alignItems: "center", gap: 4, fontWeight: 500, cursor: "pointer" }}>
          {open ? "Dölj information" : "Mer information"}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }}><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </div>

      {/* ═══ EXPANDED DETAIL ═══ */}
      {open && (
        <div style={{ padding: "0 20px 20px", animation: "scaleIn 0.2s ease both" }}>
          {/* Insight */}
          {p.insight && (
            <div style={{ marginBottom: 12, fontSize: 12, color: t.wine, fontWeight: 500, lineHeight: 1.4 }}>
              {p.insight}
            </div>
          )}

          {/* Quick taste description */}
          {p.style && <div style={{ fontSize: 12, color: t.txM, fontStyle: "italic", marginBottom: 14, lineHeight: 1.5 }}>{p.style}</div>}

          {/* ═══ POÄNGFÖRDELNING — 3 columns ═══ */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: t.txF, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, borderTop: `1px solid ${t.bdrL}`, paddingTop: 14 }}>Poängfördelning</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {/* Crowd */}
              <div style={{ padding: "12px 10px", borderRadius: 10, background: t.bg }}>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Instrument Serif', Georgia, serif", color: p.crowd_score ? "#6b8cce" : t.txL }}>
                  {p.crowd_score ? p.crowd_score.toFixed(1) : "—"}<span style={{ fontSize: 11, fontWeight: 400 }}>/10</span>
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#6b8cce", marginBottom: 6 }}>Crowd</div>
                <div style={{ height: 3, borderRadius: 2, background: t.bdr, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ width: `${(p.crowd_score || 0) * 10}%`, height: "100%", borderRadius: 2, background: "#6b8cce" }} />
                </div>
                <div style={{ fontSize: 9, color: t.txL, lineHeight: 1.4 }}>
                  {p.crowd_reviews ? `${p.crowd_reviews > 999 ? `${(p.crowd_reviews / 1000).toFixed(0)}k` : p.crowd_reviews} omdömen från vanliga vindrickare` : "Omdömen från vindrickare"}
                </div>
              </div>

              {/* Expert */}
              <div style={{ padding: "12px 10px", borderRadius: 10, background: t.bg }}>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Instrument Serif', Georgia, serif", color: p.expert_score ? "#b07d3b" : t.txL }}>
                  {p.expert_score ? p.expert_score.toFixed(1) : "—"}<span style={{ fontSize: 11, fontWeight: 400 }}>/10</span>
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#b07d3b", marginBottom: 6 }}>Expert</div>
                <div style={{ height: 3, borderRadius: 2, background: t.bdr, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ width: `${(p.expert_score || 0) * 10}%`, height: "100%", borderRadius: 2, background: "#b07d3b" }} />
                </div>
                <div style={{ fontSize: 9, color: t.txL, lineHeight: 1.4 }}>
                  {p.critics && p.critics.length > 0
                    ? `Snitt från ${p.critics.length} erkända vinkritiker`
                    : "Snitt från erkända vinkritiker"}
                </div>
              </div>

              {/* Prisvärde */}
              <div style={{ padding: "12px 10px", borderRadius: 10, background: t.bg }}>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Instrument Serif', Georgia, serif", color: p.price_score ? t.txM : t.txL }}>
                  {p.price_score ? p.price_score.toFixed(1) : "—"}<span style={{ fontSize: 11, fontWeight: 400 }}>/10</span>
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: t.txM, marginBottom: 6 }}>Prisvärde</div>
                <div style={{ height: 3, borderRadius: 2, background: t.bdr, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ width: `${(p.price_score || 0) * 10}%`, height: "100%", borderRadius: 2, background: t.txM }} />
                </div>
                <div style={{ fontSize: 9, color: t.txL, lineHeight: 1.4 }}>
                  {(() => {
                    const catMedians = { "Rött": 279, "Vitt": 239, "Rosé": 160, "Mousserande": 399 };
                    const catNames = { "Rött": "rött vin", "Vitt": "vitt vin", "Rosé": "rosévin", "Mousserande": "mousserande" };
                    const median = catMedians[p.category] || 250;
                    return `${p.price}kr · Medianen för ${catNames[p.category] || "vin"}: ${median}kr`;
                  })()}
                </div>
              </div>
            </div>

            {/* Critic detail chips */}
            {p.critics && p.critics.length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                {p.critics.map((cr, ci) => (
                  <span key={ci} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#b07d3b10", color: "#b07d3b" }}>
                    {cr.c}: {cr.s}
                  </span>
                ))}
                {p.num_critics > (p.critics || []).length && (
                  <span style={{ fontSize: 9, padding: "2px 6px", color: t.txL }}>+{p.num_critics - p.critics.length} till</span>
                )}
              </div>
            )}
          </div>

          {/* Price drop info */}
          {p.launch_price && p.price_vs_launch_pct > 0 && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: t.dealL, marginBottom: 14, fontSize: 13, color: t.deal, lineHeight: 1.5 }}>
              Lanserades för <strong>{p.launch_price} kr</strong> — nu {p.price} kr. Du sparar {p.launch_price - p.price} kr per flaska.
            </div>
          )}

          {/* ═══ SIMILAR WINES ═══ */}
          {allProducts && (() => {
            const tasteSim = (a, b) => {
              let score = 0, count = 0;
              if (a.taste_body && b.taste_body) { score += 1 - Math.abs(a.taste_body - b.taste_body) / 12; count++; }
              if (a.taste_fruit && b.taste_fruit) { score += 1 - Math.abs(a.taste_fruit - b.taste_fruit) / 12; count++; }
              if (a.taste_sweet != null && b.taste_sweet != null) { score += 1 - Math.abs(a.taste_sweet - b.taste_sweet) / 12; count++; }
              return count > 0 ? score / count : 0;
            };

            const similar = allProducts
              .filter(w => w.category === p.category && w.package === p.package
                && w.assortment === "Fast sortiment"
                && (w.nr || w.id) !== (p.nr || p.id))
              .map(w => {
                let sim = 0;
                const taste = tasteSim(w, p);
                sim += taste * 40;
                if (w.grape && p.grape && w.grape.toLowerCase() === p.grape.toLowerCase()) sim += 20;
                if (w.cat3 && p.cat3 && w.cat3 === p.cat3) sim += 15;
                if (w.country && p.country && w.country === p.country) sim += 5;
                if (w.region && p.region && w.region === p.region) sim += 10;
                if (Math.abs(w.price - p.price) <= 30) sim += 5;
                sim += (w.smakfynd_score - p.smakfynd_score) * 2;
                return { ...w, _sim: sim, _taste: taste };
              })
              .filter(w => w._sim >= 20)
              .sort((a, b) => b._sim - a._sim)
              .slice(0, 3)
              .map(w => {
                const reasons = [];
                if (w._taste >= 0.8) reasons.push("Liknande smakprofil");
                if (w.grape && p.grape && w.grape.toLowerCase() === p.grape.toLowerCase()) reasons.push("Samma druva");
                if (w.cat3 && p.cat3 && w.cat3 === p.cat3 && !reasons.length) reasons.push("Samma stil");
                if (w.region && p.region && w.region === p.region) reasons.push("Samma region");
                if (w.price < p.price - 10) reasons.push(`${Math.round(p.price - w.price)}kr billigare`);
                if (w.smakfynd_score > p.smakfynd_score + 2) reasons.push("Bättre värde per krona");
                else if (w.smakfynd_score > p.smakfynd_score) reasons.push("Högre poäng");
                if ((w.expert_score || 0) > (p.expert_score || 0) + 0.5) reasons.push("Starkare expertstöd");
                return { ...w, _reason: reasons.slice(0, 2).join(" – ") || "Liknande stil och prisklass" };
              });
            if (similar.length === 0) return null;
            return (
              <div>
                <div style={{ fontSize: 16, fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: t.tx, marginBottom: 12, borderTop: `1px solid ${t.bdrL}`, paddingTop: 14 }}>
                  Här är fler tips om du gillar {p.name}:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {similar.map((w, i) => (
                    <div key={i}
                      onClick={e => { e.stopPropagation(); window.location.hash = `vin/${w.nr}`; window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px", borderRadius: 12,
                        background: t.bg, border: `1px solid ${t.bdrL}`,
                        cursor: "pointer", transition: "all 0.2s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = t.wine + "40"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = t.bdrL; e.currentTarget.style.transform = "translateY(0)"; }}
                    >
                      {/* Score circle */}
                      <svg width="38" height="38" viewBox="0 0 50 50" style={{ flexShrink: 0 }}>
                        <circle cx="25" cy="25" r="22" fill="#e8f0e4" />
                        <circle cx="25" cy="25" r="22" fill="none" stroke="#d4ddd0" strokeWidth="2.5" />
                        <circle cx="25" cy="25" r="22" fill="none" stroke="#2d6b3f" strokeWidth="2.5"
                          strokeDasharray={`${w.smakfynd_score * 1.38} 138`} strokeLinecap="round"
                          transform="rotate(-90 25 25)" />
                        <text x="25" y="30" textAnchor="middle" fontFamily="'Instrument Serif', Georgia, serif"
                          fontSize="16" fontWeight="900" fill="#2d6b3f">{w.smakfynd_score}</text>
                      </svg>

                      {/* Wine image */}
                      <ProductImage p={w} size={36} />

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontFamily: "'Instrument Serif', serif", color: t.tx, lineHeight: 1.2 }}>{w.name}</div>
                        <div style={{ fontSize: 11, color: t.txL, marginTop: 2 }}>{w.grape || w.sub}, {w.country}</div>
                        <div style={{ fontSize: 10, color: t.green, marginTop: 2, fontWeight: 500 }}>{w._reason}</div>
                      </div>

                      {/* Price */}
                      <div style={{ flexShrink: 0, textAlign: "right" }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: t.tx, fontFamily: "'Instrument Serif', serif" }}>
                          {w.price} kr
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ═══ INTERNAL LINKS — SEO + navigation ═══ */}
          {(() => {
            const links = getInternalLinks(p);
            if (links.length === 0) return null;
            return (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.bdrL}`, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {links.map((link, i) => (
                  <a key={i} href={link.url} onClick={e => e.stopPropagation()}
                    style={{
                      fontSize: 11, color: t.wine, textDecoration: "none",
                      padding: "4px 10px", borderRadius: 100,
                      border: `1px solid ${t.wine}20`, background: `${t.wine}06`,
                      fontWeight: 500, transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${t.wine}12`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${t.wine}06`; }}
                  >{link.label} →</a>
                ))}
              </div>
            );
          })()}

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
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 13, color: saved ? t.wine : t.txM,
          background: "none", border: "none", cursor: "pointer", padding: "2px 0",
          fontFamily: "inherit", transition: "all 0.2s", fontWeight: 500,
        }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        <span style={{ fontWeight: saved ? 600 : 500 }}>{saved ? (lists.length === 1 ? LISTS.find(l => l.k === lists[0])?.l || "Sparad" : `${lists.length} listor`) : "Spara"}</span>
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
        // TEMP: auto-fill code during development
        if (data._dev_code) setCode(data._dev_code);
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

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(30,23,16,0.5)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose} role="dialog" aria-modal="true" aria-label="Logga in">
      <div onClick={e => e.stopPropagation()} style={{
        background: t.card, borderRadius: 20, padding: "32px 28px", maxWidth: 380, width: "100%",
        boxShadow: "0 20px 60px rgba(30,23,16,0.2)", animation: "scaleIn 0.2s ease",
      }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>
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

  return { user, token, login, logout, syncWines, saveToServer, removeFromServer };
}

// ════════════════════════════════════════════════════════════
// components/TrustBox.jsx
// ════════════════════════════════════════════════════════════
// src/components/TrustBox.jsx
function TrustBox() {
  const isMobile = window.innerWidth < 768;
  const [open, setOpen] = useState(!isMobile);
  return (
    <div style={{
      padding: open ? "14px 20px" : "10px 16px", borderRadius: 14,
      border: `1px solid ${t.bdr}`, background: t.card, marginBottom: 20,
      textAlign: "left", cursor: isMobile ? "pointer" : "default",
    }} onClick={() => isMobile && setOpen(!open)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.tx }}>Så funkar Smakfynd</span>
          {!open && <span style={{ fontSize: 11, color: t.txL, marginLeft: 6 }}>— baserat på data, inte magkänsla</span>}
        </div>
        {isMobile && <span style={{ fontSize: 10, color: t.txL }}>{open ? "▲" : "▼"}</span>}
      </div>
      {open && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: t.txM, marginBottom: 8, lineHeight: 1.4 }}>Bästa köp i varje stil och prisklass.</div>
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
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// components/WeeklyPick.jsx
// ════════════════════════════════════════════════════════════
// src/components/WeeklyPick.jsx
function WeeklyPick({ products }) {
  const pick = useMemo(() => {
    const candidates = products
      .filter(p => p.assortment === "Fast sortiment" && p.package === "Flaska" && p.price && p.price <= 150 && p.smakfynd_score >= 75)
      .sort((a, b) => {
        const aBonus = (a.crowd_score && a.expert_score) ? 5 : 0;
        const bBonus = (b.crowd_score && b.expert_score) ? 5 : 0;
        return (b.smakfynd_score + bBonus) - (a.smakfynd_score + aBonus);
      });
    return candidates[0] || null;
  }, [products]);

  if (!pick) return null;

  const [_label, scoreCol] = getScoreInfo(pick.smakfynd_score);
  const foodStr = (pick.food_pairings || []).slice(0, 3).join(", ");
  const sbUrl = `https://www.systembolaget.se/produkt/vin/${pick.nr}`;

  return (
    <div style={{
      margin: "0 -16px 24px", padding: "32px 28px",
      background: "linear-gradient(165deg, #1a1510 0%, #2a2118 40%, #1e1814 100%)",
      borderRadius: 20, position: "relative", overflow: "hidden",
    }}>
      {/* Subtle wine-colored glow */}
      <div style={{
        position: "absolute", top: -40, right: -40, width: 160, height: 160,
        borderRadius: "50%", background: `radial-gradient(circle, ${t.wine}18, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Label */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, position: "relative" }}>
        <div style={{ width: 3, height: 18, borderRadius: 2, background: t.gold }} />
        <span style={{ fontSize: 10, fontWeight: 800, color: t.gold, textTransform: "uppercase", letterSpacing: "0.16em" }}>Veckans fynd</span>
      </div>

      {/* Main content */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", position: "relative" }}>
        {/* Large product image */}
        <ProductImage p={pick} size={100} style={{ borderRadius: 14, background: "#2a2520", border: "1px solid rgba(255,255,255,0.06)" }} />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            margin: 0, fontSize: 24, fontFamily: "'Instrument Serif', Georgia, serif",
            fontWeight: 400, color: "#f5ede3", lineHeight: 1.15,
          }}>{pick.name}</h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9e9588" }}>
            {pick.sub} · {pick.country}{pick.region ? `, ${pick.region}` : ""}
          </p>

          {/* Price + score side by side */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 12 }}>
            <span style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Instrument Serif', Georgia, serif", color: "#f5ede3" }}>
              {pick.price}<span style={{ fontSize: 14, fontWeight: 400, color: "#9e9588" }}>kr</span>
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="38" height="38" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                <circle cx="25" cy="25" r="22" fill="none" stroke="#b08d40" strokeWidth="2.5"
                  strokeDasharray={`${pick.smakfynd_score * 1.38} 138`} strokeLinecap="round"
                  transform="rotate(-90 25 25)" style={{ transition: "stroke-dasharray 1s ease" }} />
                <text x="25" y="30" textAnchor="middle" fontFamily="'Instrument Serif', Georgia, serif"
                  fontSize="17" fontWeight="900" fill="#b08d40">{pick.smakfynd_score}</text>
              </svg>
            </div>
          </div>

          {/* Score bars — inverted colors */}
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
            {pick.crowd_score && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: "#6b6355", width: 44, textAlign: "right" }}>Crowd</span>
                <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ width: `${pick.crowd_score * 10}%`, height: "100%", borderRadius: 2, background: "#6b8cce", animation: "fillBar 1s ease 0.3s both" }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#6b8cce", minWidth: 24, textAlign: "right" }}>{pick.crowd_score.toFixed(1)}</span>
              </div>
            )}
            {pick.expert_score && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: "#6b6355", width: 44, textAlign: "right" }}>Expert</span>
                <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ width: `${pick.expert_score * 10}%`, height: "100%", borderRadius: 2, background: "#b07d3b", animation: "fillBar 1s ease 0.5s both" }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#b07d3b", minWidth: 24, textAlign: "right" }}>{pick.expert_score.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Food + reason */}
          {foodStr && <p style={{ margin: "10px 0 0", fontSize: 11, color: "#6b6355" }}>Passar till {foodStr}</p>}

          {/* CTA */}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <a href={sbUrl} target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "8px 16px", borderRadius: 8,
                background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`,
                color: "#f5ede3", fontSize: 12, fontWeight: 600, textDecoration: "none",
                boxShadow: `0 2px 8px ${t.wine}30`,
              }}>
              Köp på Systembolaget <span style={{ fontSize: 10 }}>↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// components/QuickFilters.jsx
// ════════════════════════════════════════════════════════════
// src/components/QuickFilters.jsx
function QuickFilters({ onFilter }) {
  const presets = [
    { label: "Prissänkt just nu", icon: "🏷️", action: { cat: "all", price: "all", showDeals: true }, highlight: true },
    { label: "Topp under 100 kr", icon: "💰", action: { cat: "all", price: "0-99", showBest: false } },
    { label: "Bästa röda just nu", icon: "🍷", action: { cat: "Rött", price: "all", showBest: false } },
    { label: "Expertfavoriter", icon: "🏆", action: { cat: "all", price: "all", showBest: true } },
    { label: "Ekologiskt & prisvärt", icon: "🌿", action: { cat: "all", price: "all", showEco: true } },
    { label: "Bubbel till fest", icon: "🍾", action: { cat: "Mousserande", price: "all", showBest: false } },
  ];

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Snabbval</div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
        {presets.map((p, i) => (
          <button key={i} onClick={() => {
              if (p.action.showDeals) { window.open("/prissankt/", "_self"); return; }
              onFilter(p.action); track("filter", { type: "quickfilter", value: p.label });
            }}
            style={{
              padding: "8px 14px", borderRadius: 10,
              border: p.highlight ? `1.5px solid ${t.deal}` : `1px solid ${t.bdr}`,
              background: p.highlight ? `${t.deal}08` : t.card,
              cursor: "pointer", fontFamily: "inherit",
              fontSize: 12, color: p.highlight ? t.deal : t.txM, whiteSpace: "nowrap",
              fontWeight: p.highlight ? 600 : 400,
              display: "flex", alignItems: "center", gap: 5,
              transition: "all 0.2s", boxShadow: "0 1px 3px rgba(30,23,16,0.04)",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.wine + "40"; e.currentTarget.style.color = t.wine; e.currentTarget.style.boxShadow = "0 2px 8px rgba(30,23,16,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.bdr; e.currentTarget.style.color = t.txM; e.currentTarget.style.boxShadow = "0 1px 3px rgba(30,23,16,0.04)"; }}
          >
            <span style={{ fontSize: 14 }}>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// components/EditorsPicks.jsx
// ════════════════════════════════════════════════════════════
// src/components/EditorsPicks.jsx
function EditorsPicks({ products, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      <button onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "16px 20px", borderRadius: 16,
          background: t.card, border: `1px solid ${t.bdr}`,
          cursor: "pointer", fontFamily: "inherit", textAlign: "left",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: open ? t.sh2 : t.sh1,
          transition: "all 0.25s ease",
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${t.wine}18, ${t.wine}08)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15,
          }}>🍷</div>
          <span style={{ fontSize: 14, color: t.tx }}>
            <strong style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontStyle: "italic" }}>Gabriels val</strong>
            <span style={{ color: t.txL, fontSize: 12 }}> — utvalda fynd vi testat</span>
          </span>
        </div>
        <span style={{ fontSize: 10, color: t.txL, transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
      </button>
      {open && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
          {GABRIELS_PICKS.map((pick, i) => {
            const mp = products.find(pr => String(pr.nr) === String(pick.nr));
            const [_l, pCol] = getScoreInfo(pick.smakfynd_score);
            return (
              <div key={i}
                style={{
                  padding: "20px 20px", borderRadius: 16, background: t.card,
                  border: `1px solid ${t.bdr}`, cursor: mp ? "pointer" : "default",
                  position: "relative", overflow: "hidden",
                  animation: `slideUp 0.3s ease ${i * 0.1}s both`,
                }}
                onClick={() => mp && onSelect(mp.nr || pick.nr)}>
                {/* Accent line */}
                <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: `linear-gradient(180deg, ${t.wine}, ${t.wine}40)`, borderRadius: "4px 0 0 4px" }} />

                <div style={{ fontSize: 9, fontWeight: 800, color: t.wine, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>{pick.verdict}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <svg width="48" height="48" viewBox="0 0 50 50" style={{ flexShrink: 0 }}>
                    <circle cx="25" cy="25" r="22" fill="#e8f0e4" />
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#d4ddd0" strokeWidth="2.5" />
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#2d6b3f" strokeWidth="2.5"
                      strokeDasharray={`${pick.smakfynd_score * 1.38} 138`} strokeLinecap="round"
                      transform="rotate(-90 25 25)" />
                    <text x="25" y="30" textAnchor="middle" fontFamily="'Instrument Serif', Georgia, serif"
                      fontSize="17" fontWeight="900" fill="#2d6b3f">{pick.smakfynd_score}</text>
                  </svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontFamily: "'Instrument Serif', serif", color: t.tx, lineHeight: 1.2 }}>{pick.name}</div>
                    <div style={{ fontSize: 12, color: t.txL, marginTop: 2 }}>{pick.sub} · {pick.price}</div>
                  </div>
                </div>
                {/* Pull-quote style note */}
                <p style={{
                  fontSize: 13, color: t.txM, lineHeight: 1.6, margin: "12px 0 0",
                  fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic",
                  paddingLeft: 14, borderLeft: `2px solid ${t.bdrL}`,
                }}>"{pick.note}"</p>
                {pick.food && <div style={{ fontSize: 11, color: t.txL, marginTop: 8 }}>Passar till: {pick.food}</div>}
                {mp && <div style={{ fontSize: 11, color: t.wine, marginTop: 8, fontWeight: 500 }}>Se fullständig profil →</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// components/FoodMatch.jsx
// ════════════════════════════════════════════════════════════
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
    <div style={{
      padding: "28px 24px", borderRadius: 20, marginBottom: 24,
      background: "linear-gradient(160deg, #fdfbf7 0%, #f8f0e8 50%, #f5ede3 100%)",
      border: `1px solid ${t.bdr}`,
      boxShadow: "0 4px 20px rgba(139,35,50,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `linear-gradient(135deg, ${t.wine}15, ${t.wine}08)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>🍽</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 400, fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: t.tx }}>Kvällens middag?</div>
          <div style={{ fontSize: 12, color: t.txL }}>Beskriv din måltid — vi matchar vinet.</div>
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
        <div style={{ textAlign: "center", padding: "24px 0", color: t.txL }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 10 }}>
            {["🍷", "🥂", "🍾"].map((glass, i) => (
              <span key={i} style={{ fontSize: 22, animation: `dotPulse 1.2s ease ${i * 0.3}s infinite` }}>{glass}</span>
            ))}
          </div>
          <div style={{ fontSize: 13, fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: t.txM }}>Analyserar din måltid...</div>
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

// ════════════════════════════════════════════════════════════
// components/StoreMode.jsx
// ════════════════════════════════════════════════════════════
// src/components/BarcodeScanner.jsx
// Uses html5-qrcode library for cross-browser support (iPhone + Android)
function BarcodeScanner({ onScan, onClose }) {
  const scannerDivRef = useRef(null);
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stopped = false;

    async function loadAndStart() {
      // Dynamically load html5-qrcode if not already loaded
      if (!window.Html5Qrcode) {
        try {
          await new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
          });
        } catch(e) {
          setError("Kunde inte ladda streckkodsskannern.");
          setLoading(false);
          return;
        }
      }
      if (stopped) return;

      try {
        const scanner = new window.Html5Qrcode("sf-barcode-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.7778,
            formatsToSupport: [
              window.Html5QrcodeSupportedFormats?.EAN_13,
              window.Html5QrcodeSupportedFormats?.EAN_8,
              window.Html5QrcodeSupportedFormats?.CODE_128,
              window.Html5QrcodeSupportedFormats?.CODE_39,
              window.Html5QrcodeSupportedFormats?.ITF,
            ].filter(Boolean),
          },
          (decodedText) => {
            // Success — stop scanner and return result
            scanner.stop().catch(() => {});
            onScan(decodedText);
          },
          () => {} // Ignore scan failures (continuous scanning)
        );
        setLoading(false);
      } catch(e) {
        setError("Kunde inte öppna kameran. Kontrollera att du gett tillåtelse i webbläsarens inställningar.");
        setLoading(false);
      }
    }

    loadAndStart();

    return () => {
      stopped = true;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000, background: "#000",
      display: "flex", flexDirection: "column",
    }}>
      {/* Scanner renders into this div */}
      <div id="sf-barcode-reader" ref={scannerDivRef} style={{ flex: 1, background: "#000" }} />

      {/* Bottom panel */}
      <div style={{ padding: "20px 16px 40px", textAlign: "center", background: "rgba(0,0,0,0.85)" }}>
        {loading && !error && (
          <p style={{ color: "#fff", fontSize: 14, margin: "0 0 12px" }}>Startar kameran...</p>
        )}
        {error ? (
          <div>
            <p style={{ color: "#ff6b6b", fontSize: 14, margin: "0 0 12px" }}>{error}</p>
            <button onClick={onClose} style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: t.card, color: t.tx, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Tillbaka</button>
          </div>
        ) : (
          <div>
            <p style={{ color: "#fff", fontSize: 15, margin: "0 0 4px", fontWeight: 600 }}>
              Rikta kameran mot streckkoden
            </p>
            <p style={{ color: "#ffffff80", fontSize: 12, margin: "0 0 16px" }}>
              Hyllkanten eller flaskans streckkod
            </p>
            <button onClick={() => { if (scannerRef.current) scannerRef.current.stop().catch(() => {}); onClose(); }}
              style={{ padding: "12px 28px", borderRadius: 12, border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 14, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
              Avbryt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// src/components/StoreMode.jsx
function StoreMode({ products, onClose }) {
  const [q, setQ] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const sv = React.useContext(SavedContext);
  const inputRef = useRef(null);
  // EAN lookup: loaded from ean_lookup.json if available
  const [eanMap, setEanMap] = useState({});

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Try to load EAN lookup data
  useEffect(() => {
    fetch("ean_lookup.json").then(r => r.ok ? r.json() : {}).then(data => {
      if (data && typeof data === "object") setEanMap(data);
    }).catch(() => {});
  }, []);

  const handleBarcodeScan = (code) => {
    setShowScanner(false);
    // Try direct article number match first
    const directMatch = products.find(p => String(p.nr) === code);
    if (directMatch) {
      setQ(code);
      track("barcode_scan", { code, type: "nr", matched: true });
      return;
    }
    // Try EAN lookup
    if (eanMap[code]) {
      setQ(String(eanMap[code]));
      track("barcode_scan", { code, type: "ean", matched: true });
      return;
    }
    // Try partial match (last digits might be article number)
    const partial = code.replace(/^0+/, "");
    const partialMatch = products.find(p => String(p.nr) === partial);
    if (partialMatch) {
      setQ(partial);
      track("barcode_scan", { code, type: "partial", matched: true });
      return;
    }
    // No match — show the code in search
    setQ(code);
    track("barcode_scan", { code, type: "unknown", matched: false });
  };

  const result = useMemo(() => {
    if (q.length < 2) return null;
    const query = q.toLowerCase().trim();

    // Search by article number, EAN, or name
    const matches = products.filter(p =>
      String(p.nr) === query ||
      String(p.nr) === q.trim() ||
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
        <button onClick={() => setShowScanner(true)}
          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 22, background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: 8 }}
          title="Skanna streckkod">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.wine} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>
      </div>

      {/* Barcode scanner overlay */}
      {showScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />}

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
            Skanna streckkoden eller skriv vinets namn.<br />
            Vi visar poängen och om det finns bättre alternativ.
          </div>
          <button onClick={() => setShowScanner(true)}
            style={{
              marginTop: 16, padding: "14px 24px", borderRadius: 12,
              background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`,
              color: "#fff", fontSize: 15, fontWeight: 600, border: "none",
              cursor: "pointer", fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Skanna streckkod
          </button>
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

      // Fallback to embedded sample data
      if (SAMPLE_PRODUCTS.length > 0) {
        setAllData(SAMPLE_PRODUCTS);
        setLoadError(null);
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
    const onScroll = () => setShowBackToTop(window.scrollY > 800);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    return r;
  }, [products, cat, price, search, showNew, showDeals, pkg, showEco, showBest, selCountry, selFoods, selRegion, selTaste, sortBy]);

  const newN = products.filter(p => p.is_new).length;
  const dealN = products.filter(p => p.price_vs_launch_pct > 0).length;
  const ecoN = products.filter(p => p.organic).length;
  const hasFilters = search || cat !== "all" || price !== "all" || showNew || showDeals || showEco || selCountry || selFoods.length > 0 || selRegion || selTaste || sortBy !== "smakfynd";

  const clearAll = () => { setSearch(""); setCat("all"); setPrice("all"); setShowNew(false); setShowDeals(false); setShowEco(false); setSelCountry(null); setSelFoods([]); setShowBest(false); setSelRegion(null); setSelTaste(null); setSortBy("smakfynd"); };

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
        @keyframes slideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:scale(1) } }
        @keyframes countUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes heroReveal { from { opacity:0; transform:translateY(20px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes glowPulse { 0%,100% { box-shadow: 0 0 20px rgba(139,35,50,0.08) } 50% { box-shadow: 0 0 40px rgba(139,35,50,0.15) } }
        @keyframes fillBar { from { width: 0% } }
        @keyframes dotPulse { 0%,100% { opacity:0.3 } 50% { opacity:1 } }
        @keyframes scanLine { 0% { top:0 } 50% { top:calc(100% - 3px) } 100% { top:0 } }
        ::selection { background: ${t.wine}20 }
        input::placeholder { color: ${t.txF} }
        *::-webkit-scrollbar { display: none }
        * { scrollbar-width: none; box-sizing: border-box; }
        a { transition: color 0.15s ease; }
        button { transition: all 0.15s ease; }
        img { transition: opacity 0.3s ease; }
        [role="button"]:focus-visible, button:focus-visible, a:focus-visible, input:focus-visible {
          outline: 2px solid ${t.wine}60;
          outline-offset: 2px;
        }
        [role="button"]:hover { transform: translateY(-1px); }
        @media (max-width: 480px) {
          header { padding: 10px 16px 0 !important; }
        }
      `}</style>

      {/* ═══ HERO — cinematic header ═══ */}
      <header style={{
        padding: "0 20px", maxWidth: 580, margin: "0 auto",
        animation: "heroReveal 0.6s ease both",
      }}>
        {/* Top bar: Logo + nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <svg width="28" height="28" viewBox="0 0 40 40" style={{ animation: "fadeIn 0.8s ease 0.2s both" }}>
              <circle cx="20" cy="20" r="19" fill={t.wine}/>
              <text x="20" y="27" textAnchor="middle" fontFamily="Georgia,serif" fontSize="18" fill="#f5ede3" fontWeight="400">S</text>
            </svg>
            <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, color: t.wine }}>Smakfynd</span>
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 12, color: t.txL }}>
            {[["weekly", "Veckans fynd"], ["deals", "Prissänkt"], ["food", "Kvällens middag"], ["picks", "Gabriels val"], ["saved", `♥${sv.count ? ` ${sv.count}` : ""}`],
              ["about", "Om"], [auth.user ? "profile" : "login", auth.user ? "👤" : "Logga in"]].map(([k, l]) => (
              <span key={k} onClick={() => {
                  if (k === "login") { setShowLogin(true); return; }
                  if (k === "profile") { auth.logout(); return; }
                  if (k === "deals") { window.open("/prissankt/", "_self"); return; }
                  if (k === "weekly" || k === "food" || k === "picks") {
                    const el = document.getElementById("section-" + k);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    return;
                  }
                  setPanel(panel === k ? null : k);
                }}
                style={{ cursor: "pointer", color: panel === k ? t.wine : (k === "login" ? t.wine : t.txL), fontWeight: panel === k ? 600 : 400 }}
              >{l}</span>
            ))}
          </div>
        </div>

        {/* Hero headline */}
        <div style={{ textAlign: "center", padding: "28px 0 20px" }}>
          <h1 style={{
            margin: 0, fontSize: 36, lineHeight: 1.1,
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontWeight: 400, fontStyle: "italic", color: t.tx,
            animation: "heroReveal 0.7s ease 0.15s both",
            letterSpacing: "-0.01em",
          }}>
            Hela Systembolagets butikssortiment.
            <br />
            <span style={{ color: t.wine }}>Vi hittade de bästa köpen.</span>
          </h1>
          <p style={{
            margin: "10px 0 0", fontSize: 14, color: t.txM, lineHeight: 1.5,
            animation: "countUp 0.5s ease 0.3s both",
          }}>
            Vi kombinerar crowd-betyg, expertrecensioner och prisjämförelse<br />
            för att ranka varje vin efter kvalitet per krona.
          </p>

          {/* Animated stats row */}
          <div style={{
            display: "flex", justifyContent: "center", gap: 24, marginTop: 18,
            animation: "countUp 0.5s ease 0.4s both",
          }}>
            {[
              [reviewsStr, "omdömen"],
              [String(countries), "länder"],
              ["100%", "av Systembolaget"],
            ].map(([num, label], i) => (
              <div key={i} style={{ textAlign: "center", animation: `countUp 0.4s ease ${0.5 + i * 0.1}s both` }}>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Instrument Serif', Georgia, serif", color: t.tx }}>{num}</div>
                <div style={{ fontSize: 10, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Subtle divider */}
          <div style={{
            width: 40, height: 2, borderRadius: 1,
            background: `linear-gradient(90deg, transparent, ${t.wine}40, transparent)`,
            margin: "18px auto 0",
          }} />
        </div>
      </header>

      <div style={{ maxWidth: 580, margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* ═══ PANELS ═══ */}
        {panel === "about" && (
          <div style={{ padding: 22, borderRadius: 16, background: t.card, border: `1px solid ${t.bdr}`, marginBottom: 20, animation: "scaleIn 0.25s ease" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 22, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>Om Smakfynd</h2>
            <p style={{ fontSize: 14, color: t.txM, lineHeight: 1.7, margin: "0 0 12px" }}>
              Systembolaget har tusentals viner. Vi hjälper dig hitta de som faktiskt är värda pengarna. Vi kombinerar <strong>crowd-betyg</strong> från hundratusentals vindrickare, <strong>expertrecensioner</strong> från internationella kritiker och <strong>prisjämförelse</strong> inom varje kategori.
            </p>
            <p style={{ fontSize: 14, color: t.txM, lineHeight: 1.7, margin: "0 0 14px" }}>
              Resultatet: <strong>en enda poäng</strong> som visar kvalitet per krona. Inte det "bästa" vinet — utan det bästa <em>köpet</em>.
            </p>
            <div style={{ padding: 16, borderRadius: 12, background: t.bg, marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontFamily: "'Instrument Serif', serif", color: t.tx, marginBottom: 4 }}>Gabriel Linton, grundare</div>
              <p style={{ fontSize: 13, color: t.txM, lineHeight: 1.6, margin: 0 }}>
                Forskare i innovation och entreprenörskap (PhD, Örebro universitet). Førsteamanuensis vid Universitetet i Innlandet, Norge. Utbildad i dryckeskunskap vid Restaurang- och hotellhögskolan i Grythyttan. MBA, Cleveland State University.
              </p>
              <p style={{ fontSize: 13, color: t.txM, lineHeight: 1.6, margin: "8px 0 0" }}>
                Jag ville hitta bra vin utan att gissa. Som forskare vill jag ha data — inte magkänsla. All information fanns redan, men ingen hade kopplat ihop den åt vanliga konsumenter. Och jag märkte att billigare viner ofta smakade nästan lika bra som betydligt dyrare. Så jag byggde Smakfynd — ett system som väger in priset i omdömet, systematiskt.
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
                  .map((p, i) => <Card key={p.id || i} p={p} rank={i + 1} delay={0} allProducts={products} auth={auth} />)}
              </div>
            )}
            <button onClick={() => setPanel(null)} style={{ marginTop: 12, fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Stäng</button>
          </div>
        )}

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
            <button key={ct.k} onClick={() => { setCat(ct.k); track("filter", { type: "category", value: ct.k }); }} style={{
              ...pill(cat === ct.k),
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ fontSize: 14 }}>{ct.i}</span> {ct.l}
            </button>
          ))}
        </div>

        {/* ═══ PRICE PILLS + EKO ═══ */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {PRICES.filter(p => p.k !== "all").map(({ k, l }) => (
            <button key={k} onClick={() => { setPrice(price === k ? "all" : k); track("filter", { type: "price", value: k }); }} style={pill(price === k)}>{l}</button>
          ))}
          <button onClick={() => setShowEco(!showEco)} style={{ ...pill(showEco, t.green), display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 12 }}>🌿</span> Ekologiskt ({ecoN})
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
                  ["Argentina", "\ud83c\udde6\ud83c\uddf7"], ["Nya Zeeland", "\ud83c\uddf3\ud83c\uddff"], ["\u00d6sterrike", "\ud83c\udde6\ud83c\uddf9"],
                ].map(([c, flag]) => (
                  <button key={c} onClick={() => setSelCountry(selCountry === c ? null : c)} style={pill(selCountry === c)}>{flag} {c}</button>
                ))}
              </div>
            </div>
            {/* Food */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Passar till</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Kött", "Fågel", "Fisk", "Skaldjur", "Fläsk", "Grönsaker", "Ost", "Vilt", "Pasta", "Lamm"].map(f => (
                  <button key={f} onClick={() => toggleFood(f)} style={pill(selFoods.includes(f))}>{f}</button>
                ))}
              </div>
            </div>
            {/* Taste */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Smak</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Fylligt", "Lätt", "Fruktigt", "Torrt"].map(ts => (
                  <button key={ts} onClick={() => setSelTaste(selTaste === ts ? null : ts)} style={pill(selTaste === ts)}>{ts}</button>
                ))}
              </div>
            </div>
            {/* Region */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Region</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Bordeaux", "Toscana", "Rioja", "Piemonte", "Bourgogne", "Rhonedalen", "Champagne", "Kalifornien"].map(rg => (
                  <button key={rg} onClick={() => setSelRegion(selRegion === rg ? null : rg)} style={pill(selRegion === rg)}>{rg}</button>
                ))}
              </div>
            </div>
            {/* Sort */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Sortera</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[["smakfynd", "Smakfynd-poäng"], ["expert", "Expertbetyg"], ["crowd", "Crowd-betyg"], ["price_asc", "Pris ↑"], ["price_desc", "Pris ↓"]].map(([k, l]) => (
                  <button key={k} onClick={() => setSortBy(k)} style={pill(sortBy === k)}>{l}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ RESULTS ═══ */}
        <div style={{ marginBottom: 14, padding: "0 4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 13, color: t.txL }}>{loading ? "Laddar..." : `${filtered.length} produkter`}</span>
            <span style={{ fontSize: 11, color: t.txF }}>{{ smakfynd: "Mest smak för pengarna", expert: "Sorterat efter expertbetyg", crowd: "Sorterat efter crowd-betyg", price_asc: "Lägst pris först", price_desc: "Högst pris först" }[sortBy]}</span>
          </div>
          <div style={{ fontSize: 10, color: t.txF, marginTop: 3 }}>Rankade efter kvalitet i förhållande till pris — inte "bästa vinet", utan bästa värdet i sin kategori.</div>
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
                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 12px" }}>
                    <div style={{ width: 3, height: 20, borderRadius: 2, background: t.wine }} />
                    <h3 style={{ margin: 0, fontSize: 18, fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontStyle: "italic", color: t.tx }}>{title}</h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sectionWines.map((p, i) => <Card key={p.id || i} p={p} rank={i + 1} delay={0} allProducts={products} auth={auth} />)}
                  </div>
                </div>
              );
            })}
            {/* CTA → AI matcher */}
            <div style={{ textAlign: "center", padding: "20px 16px", borderRadius: 14, background: t.card, border: `1px solid ${t.bdr}` }}>
              <div style={{ fontSize: 14, fontFamily: "'Instrument Serif', serif", color: t.tx, marginBottom: 6 }}>Vet du vad du ska äta?</div>
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
              <div key={p.id || i} style={{ position: "relative" }}>
                {/* Gold accent for #1 */}
                <div style={{
                  position: "absolute", top: 0, left: 20, right: 20, height: 3, zIndex: 1,
                  borderRadius: "0 0 3px 3px",
                  background: "linear-gradient(90deg, transparent, #b08d40, #d4a84b, #b08d40, transparent)",
                }} />
                <Card p={p} rank={1} delay={0} allProducts={products} autoOpen={String(p.nr) === String(autoOpenNr)} auth={auth} />
                {!autoOpenNr && <div style={{ textAlign: "center", fontSize: 11, color: t.txL, margin: "-4px 0 6px", animation: "fadeIn 1s ease 0.5s both" }}>↑ Tryck på ett vin för att se mer</div>}
              </div>
            ))}
            {filtered.slice(1, 50).map((p, i) => <Card key={p.id || i} p={p} rank={i + 2} delay={Math.min((i + 1) * 0.04, 0.4)} allProducts={products} autoOpen={String(p.nr) === String(autoOpenNr)} auth={auth} />)}
            {filtered.length > 50 && (
              <div style={{ textAlign: "center", padding: 20, color: t.txL, fontSize: 13 }}>
                Visar topp 50 av {filtered.length}. Använd filter för att hitta fler.
              </div>
            )}
          </div>
        )}

        {/* ═══ VECKANS FYND (below wine list) ═══ */}
        <div id="section-weekly"><WeeklyPick products={products} /></div>

        {/* ═══ AI FOOD MATCH ═══ */}
        <div id="section-food"><FoodMatch products={products} /></div>

        {/* ═══ REDAKTIONENS VAL ═══ */}
        <div id="section-picks"><EditorsPicks products={products} onSelect={nr => { window.location.hash = `vin/${nr}`; window.scrollTo({ top: 0, behavior: "smooth" }); }} /></div>

        {/* ═══ SÄSONGSINNEHÅLL ═══ */}
        {(() => {
          const month = new Date().getMonth(); // 0-11
          const season = month >= 4 && month <= 8 ? "sommar" : month >= 2 && month <= 4 ? "vår" : month >= 9 && month <= 10 ? "höst" : "vinter";
          const seasonConfig = {
            vår: { title: "Vårviner", sub: "Lätta, friska viner för ljusare kvällar", emoji: "🌸", filter: p => (p.category === "Vitt" || p.category === "Rosé") && (p.taste_body || 12) <= 7 },
            sommar: { title: "Sommarviner", sub: "Kylda favoriter till grillkvällar och picknick", emoji: "☀️", filter: p => (p.category === "Vitt" || p.category === "Rosé" || p.category === "Mousserande") && p.price <= 200 },
            höst: { title: "Höstviner", sub: "Fylliga röda till mörka kvällar", emoji: "🍂", filter: p => p.category === "Rött" && (p.taste_body || 0) >= 7 },
            vinter: { title: "Vinterviner", sub: "Värmande röda och festliga bubbel", emoji: "❄️", filter: p => (p.category === "Rött" && (p.taste_body || 0) >= 8) || p.category === "Mousserande" },
          };
          const cfg = seasonConfig[season];
          const seasonWines = products.filter(p => p.assortment === "Fast sortiment" && p.package === "Flaska" && cfg.filter(p)).sort((a, b) => b.smakfynd_score - a.smakfynd_score).slice(0, 4);
          if (seasonWines.length === 0) return null;
          return (
            <div style={{ marginTop: 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>{cfg.emoji}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>{cfg.title}</h3>
                  <p style={{ margin: 0, fontSize: 12, color: t.txL }}>{cfg.sub}</p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {seasonWines.map((p, i) => <Card key={p.id || i} p={p} rank={i + 1} delay={0} allProducts={products} auth={auth} />)}
              </div>
            </div>
          );
        })()}

        {/* ═══ SITUATIONER ═══ */}
        <div style={{ marginTop: 44 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 16px" }}>
            <div style={{ width: 3, height: 20, borderRadius: 2, background: t.wine }} />
            <h3 style={{ margin: 0, fontSize: 20, fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontStyle: "italic", color: t.tx }}>Hitta vin till tillfället</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              ["Dejt", "Romantisk middag", "🕯️", p => p.expert_score >= 7 && p.price >= 120 && p.price <= 300],
              ["Grillkväll", "Sommar & BBQ", "🔥", p => p.taste_body >= 7 && (p.food_pairings || []).some(f => /kött|grillat|fläsk/i.test(f))],
              ["Svärföräldrarna", "Tryggt & imponerande", "🎩", p => p.expert_score >= 7.5 && p.crowd_score >= 7 && p.price >= 150],
              ["Fredagsmys", "Under 120 kr", "🍕", p => p.price <= 120 && p.smakfynd_score >= 70],
              ["Picknick", "Lätt & friskt", "🧺", p => (p.category === "Vitt" || p.category === "Rosé") && (p.taste_body || 12) <= 6],
              ["After work", "Bubbel & lättviner", "🥂", p => p.category === "Mousserande" || ((p.taste_body || 12) <= 5 && p.category === "Vitt")],
            ].map(([title, sub, emoji, filterFn]) => {
              const matches = products.filter(p => p.assortment === "Fast sortiment" && p.package === "Flaska" && filterFn(p)).slice(0, 3);
              return (
                <button key={title} onClick={() => { setSearch(""); setCat("all"); setShowAdvanced(false);
                  const best = matches[0]; if (best) { window.location.hash = `vin/${best.nr}`; window.scrollTo({ top: 0, behavior: "smooth" }); }
                }}
                  style={{
                    padding: "18px 18px", borderRadius: 16, background: t.card,
                    border: `1px solid ${t.bdrL}`, cursor: "pointer", textAlign: "left",
                    fontFamily: "inherit", transition: "all 0.25s ease",
                    boxShadow: t.sh1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = t.wine + "40"; e.currentTarget.style.boxShadow = t.sh2; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = t.bdrL; e.currentTarget.style.boxShadow = t.sh1; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{emoji}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: t.tx, fontFamily: "'Instrument Serif', serif" }}>{title}</div>
                  <div style={{ fontSize: 11, color: t.txL, marginTop: 2 }}>{sub}</div>
                  <div style={{ fontSize: 10, color: t.txF, marginTop: 6, fontWeight: 500 }}>{matches.length} viner →</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ PRESENT-SEKTION ═══ */}
        <div style={{ marginTop: 40 }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 18, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>Ge bort vin</h3>
          <p style={{ margin: "0 0 14px", fontSize: 12, color: t.txL }}>Kurerade val per budget — trygga presenter.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["Under 100 kr", 0, 100, "Trevlig gest"],
              ["100–200 kr", 100, 200, "Uppskattad present"],
              ["200–400 kr", 200, 400, "Lyxig gåva"],
            ].map(([label, lo, hi, desc]) => {
              const picks = products.filter(p => p.assortment === "Fast sortiment" && p.package === "Flaska" && p.price >= lo && p.price < hi && p.expert_score >= 7).sort((a, b) => b.smakfynd_score - a.smakfynd_score).slice(0, 3);
              if (picks.length === 0) return null;
              return (
                <div key={label} style={{ padding: "14px 16px", borderRadius: 14, background: t.card, border: `1px solid ${t.bdr}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: t.tx }}>{label}</span>
                    <span style={{ fontSize: 11, color: t.txL }}>{desc}</span>
                  </div>
                  {picks.map((p, i) => (
                    <div key={i} onClick={() => { window.location.hash = `vin/${p.nr}`; window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", cursor: "pointer", borderTop: i > 0 ? `1px solid ${t.bdrL}` : "none" }}>
                      <span style={{ fontSize: 13, color: t.txM }}>{p.name} <span style={{ color: t.txL }}>{p.sub}</span></span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: t.tx, fontFamily: "'Instrument Serif', serif" }}>{p.price}kr</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ NYBÖRJARGUIDE ═══ */}
        <div style={{ marginTop: 40, padding: "24px 20px", borderRadius: 18, background: t.card, border: `1px solid ${t.bdr}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: t.wine, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>Ny på vin?</div>
          <h3 style={{ margin: "0 0 8px", fontSize: 20, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>Börja här</h3>
          <p style={{ fontSize: 13, color: t.txM, margin: "0 0 16px", lineHeight: 1.6 }}>
            Du behöver inte kunna något om vin. Smakfynd har redan gjort jobbet — vi har analyserat tusentals viner och rankat dem efter kvalitet per krona. Högst poäng = mest smak för pengarna.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["1. Börja med ett rött under 100 kr", "Rött", 0, 100, "Tryggt och prisvärt — de flesta gillar dessa."],
              ["2. Testa ett vitt till fisk eller kyckling", "Vitt", 0, 150, "Fräscht och enkelt — passar till vardagsmiddag."],
              ["3. Prova bubbel till fredagen", "Mousserande", 0, 200, "Inte bara för fest — perfekt till fredagsmys."],
            ].map(([title, cat, lo, hi, tip]) => {
              const pick = products.find(p => p.category === cat && p.assortment === "Fast sortiment" && p.package === "Flaska" && p.price >= lo && p.price < hi && p.smakfynd_score >= 70);
              return (
                <div key={title} style={{ padding: "12px 14px", borderRadius: 12, background: t.bg }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.tx, marginBottom: 4 }}>{title}</div>
                  <p style={{ fontSize: 12, color: t.txL, margin: "0 0 6px" }}>{tip}</p>
                  {pick && (
                    <div onClick={() => { window.location.hash = `vin/${pick.nr}`; window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      style={{ fontSize: 12, color: t.wine, cursor: "pointer", fontWeight: 600 }}>
                      Vårt tips: {pick.name} ({pick.price}kr, {pick.smakfynd_score}/100) →
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ NEWSLETTER ═══ */}
        <div style={{
          marginTop: 44, padding: "36px 28px", borderRadius: 20,
          background: "linear-gradient(165deg, #1a1510 0%, #2a2118 50%, #1e1814 100%)",
          textAlign: "center", position: "relative", overflow: "hidden",
        }}>
          {/* Subtle glow */}
          <div style={{
            position: "absolute", bottom: -30, left: "50%", transform: "translateX(-50%)",
            width: 200, height: 100, borderRadius: "50%",
            background: `radial-gradient(circle, ${t.wine}15, transparent 70%)`,
            pointerEvents: "none",
          }} />
          <div style={{ fontSize: 10, fontWeight: 800, color: t.gold, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 10, position: "relative" }}>Nyhetsbrev</div>
          <h3 style={{ margin: "0 0 8px", fontSize: 26, fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontStyle: "italic", color: "#f5ede3", position: "relative" }}>Veckans bästa köp</h3>
          <p style={{ fontSize: 13, color: "#9e9588", margin: "0 0 20px", lineHeight: 1.5, position: "relative" }}>Smartaste vinvalen direkt i inkorgen — varje torsdag.</p>
          <a href="https://smakfynd.substack.com" target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-block", padding: "14px 32px", borderRadius: 12, border: "none", cursor: "pointer",
              background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`,
              color: "#f5ede3", fontSize: 14, fontWeight: 600, textDecoration: "none",
              boxShadow: `0 4px 16px ${t.wine}40`, transition: "all 0.2s",
              position: "relative",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${t.wine}50`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 16px ${t.wine}40`; }}
          >Prenumerera gratis ↗</a>
          <p style={{ fontSize: 11, color: "#6b6355", margin: "12px 0 0", position: "relative" }}>Avsluta när du vill.</p>
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
