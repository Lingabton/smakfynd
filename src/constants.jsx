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
