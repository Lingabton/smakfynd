// ═══════════════════════════════════════════════════════════════
// SMAKFYND v7 — Real Data + Package Filter
// Smartare vinval på Systembolaget
// By Olav Innovation AB · Gabriel Linton
// ═══════════════════════════════════════════════════════════════

// Data: loaded async from wines.json, or embedded at build time as fallback
const DATA_URL = "wines.json";
const SAMPLE_PRODUCTS = []; // Data loaded async from wines.json

const CATS = [{
  k: "all",
  l: "Alla",
  i: "✦"
}, {
  k: "Rött",
  l: "Rött vin",
  i: "🍷"
}, {
  k: "Vitt",
  l: "Vitt vin",
  i: "🥂"
}, {
  k: "Rosé",
  l: "Rosé",
  i: "🌸"
}, {
  k: "Mousserande",
  l: "Bubbel",
  i: "🍾"
}];
const PRICES = [{
  k: "all",
  l: "Alla priser"
}, {
  k: "0-79",
  l: "Under 80 kr"
}, {
  k: "80-119",
  l: "80 – 119 kr"
}, {
  k: "120-199",
  l: "120 – 199 kr"
}, {
  k: "200-999",
  l: "200 kr +"
}];
const GABRIELS_PICKS = [{
  name: "Three Finger Jack",
  sub: "Cabernet Sauvignon · USA",
  price: "159 kr",
  smakfynd_score: 75,
  nr: "352801",
  food: "Grillat kött, burgare, BBQ",
  verdict: "Bäst till grillat",
  note: "Rejäl Cabernet med lite vanilj men utan att det blir för mycket. Funkar utmärkt till hamburgare och grillat kött. Omtyckt av både crowd och experter — och till 159 kr prisvärt för kvaliteten."
}, {
  name: "Mucho Mas",
  sub: "Grenache · Spanien",
  price: "99 kr",
  smakfynd_score: 78,
  nr: "5234001",
  food: "Pasta, tacos, pizza",
  verdict: "Vardagsfynd under 100 kr",
  note: "Under hundralappen och över 112 000 personer har gett det bra betyg. Funkar till tacos, pasta, eller bara ett glas. Inget fancy — bara pålitligt bra varje gång."
}, {
  name: "Leitz Eins Zwei Dry",
  sub: "Riesling · Tyskland",
  price: "107 kr",
  smakfynd_score: 70,
  nr: "582201",
  food: "Asiatiskt, fisk, skaldjur",
  verdict: "Underskattat vitt val",
  note: "Fräsch, torr Riesling med äpple och syra. Perfekt till asiatisk mat och fisk. Crowd-betyget är lågt — vi tror Riesling är underskattat i betygsättningen. Värt att testa om du vill prova något nytt."
}];
const FOOD_CATS = [{
  k: "Kött",
  e: "🥩"
}, {
  k: "Fågel",
  e: "🍗"
}, {
  k: "Fisk",
  e: "🐟"
}, {
  k: "Skaldjur",
  e: "🦐"
}, {
  k: "Fläsk",
  e: "🥓"
}, {
  k: "Grönsaker",
  e: "🥦"
}, {
  k: "Ost",
  e: "🧀"
}, {
  k: "Vilt",
  e: "🦌"
}, {
  k: "Pasta",
  e: "🍝"
}];
const FAQS = [{
  q: "Hur beräknas Smakfynd-poängen?",
  a: "Varje vin bedöms på tre saker: crowd-betyg (vad vanliga människor tycker), expertrecensioner (vinkritiker som James Suckling, Decanter m.fl.) och prisvärde (hur priset förhåller sig till andra viner i samma kategori). Hög kvalitet till lågt pris = hög poäng. Poängen visas på en skala 1–100."
}, {
  q: "Var kommer betygen ifrån?",
  a: "Crowd-betyg kommer från hundratusentals vindrickare världen över. Expertbetyg hämtas från erkända vinkritiker som James Suckling, Falstaff, Decanter och Wine Enthusiast. Prisvärdet beräknar vi själva genom att jämföra literpriset mot medianen i samma kategori — rött jämförs med rött, bubbel med bubbel."
}, {
  q: "Vad betyder Crowd- och Expert-staplarna?",
  a: "Crowd visar vad vanliga vindrickare tycker (skala 1–10). Expert visar kritikerbetyg (skala 1–10). Om Expert-stapeln saknas betyder det att vi inte hittat kritikerrecensioner för det vinet — men crowd-betyget finns alltid."
}, {
  q: "Hur fungerar AI-vinmatcharen?",
  a: "Beskriv vad du ska äta — till exempel 'grillad lax med potatisgratäng' eller 'toast skagen, sedan entrecôte'. Vår AI analyserar måltiden och föreslår viner för varje rätt i olika prisklasser, direkt från Systembolagets sortiment."
}, {
  q: "Vad betyder prissänkt?",
  a: "Vi sparar priset varje vecka. När ett vin sänks i pris visar vi det gamla priset överstruket och procentuell sänkning. Systembolaget skyltar inte alltid med prissänkningar — vi håller koll åt dig."
}, {
  q: "Varför får ekologiska viner bonus?",
  a: "Vi ger ekologiska viner en liten poängbonus (+0.2 av 10) för att främja hållbarhet. Det räcker inte för att lyfta ett dåligt vin, men vid lika kvalitet vinner det ekologiska alternativet."
}, {
  q: "Säljer Smakfynd alkohol?",
  a: "Nej. Smakfynd är en helt oberoende informationstjänst som drivs av Olav Innovation AB. Vi har ingen koppling till Systembolaget. Alla köp gör du via Systembolaget.se."
}, {
  q: "Hur ofta uppdateras sajten?",
  a: "Varje vecka. Vi hämtar hela Systembolagets sortiment, uppdaterar betyg och räknar om poängen. Prishistoriken uppdateras samtidigt."
}];

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
  gold: "#b08d40"
};

// ── Shared styles ──
const pill = (active, accent = t.wine) => ({
  padding: "8px 16px",
  borderRadius: 100,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: active ? 600 : 400,
  whiteSpace: "nowrap",
  fontFamily: "inherit",
  transition: "all 0.2s ease",
  border: active ? `1.5px solid ${accent}` : `1px solid ${t.bdr}`,
  background: active ? accent + "0c" : "transparent",
  color: active ? accent : t.txM
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
function MiniBar({
  label,
  value,
  max = 10,
  color
}) {
  const pct = value ? Math.min(100, value / max * 100) : 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: t.txL,
      width: 52,
      flexShrink: 0,
      textAlign: "right"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      background: t.bdr,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${pct}%`,
      height: "100%",
      borderRadius: 2,
      background: color || t.txM,
      transition: "width 0.8s ease"
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: color || t.txM,
      minWidth: 20,
      textAlign: "right"
    }
  }, value ? value.toFixed(1) : "—"));
}
function ScoreBars({
  p
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 3
    }
  }, /*#__PURE__*/React.createElement(MiniBar, {
    label: "Crowd",
    value: p.crowd_score,
    color: "#6b8cce"
  }), p.expert_score && /*#__PURE__*/React.createElement(MiniBar, {
    label: "Expert",
    value: p.expert_score,
    color: "#b07d3b"
  }));
}

// Product image URL from Systembolaget CDN
function getImageUrl(p, size = 200) {
  if (p.image_url) return p.image_url;
  if (p.nr) return `https://product-cdn.systembolaget.se/productimages/${p.nr}/${p.nr}_400.png`;
  return null;
}
function ProductImage({
  p,
  size = 52,
  style: extraStyle = {}
}) {
  const [err, setErr] = useState(false);
  const url = getImageUrl(p);
  const icon = {
    Rött: "🍷",
    Vitt: "🥂",
    Rosé: "🌸",
    Mousserande: "🍾",
    Öl: "🍺"
  }[p.category] || "✦";
  if (!url || err) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: size,
        height: size,
        borderRadius: 10,
        flexShrink: 0,
        background: t.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        ...extraStyle
      }
    }, icon);
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: 10,
      flexShrink: 0,
      background: t.bg,
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...extraStyle
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: url,
    alt: p.name,
    onError: () => setErr(true),
    style: {
      maxWidth: "90%",
      maxHeight: "90%",
      objectFit: "contain"
    }
  }));
}

// Saved wines hook
function useSaved() {
  const [saved, setSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("smakfynd_saved") || "[]");
    } catch (e) {
      return [];
    }
  });
  const toggle = nr => {
    const next = saved.includes(nr) ? saved.filter(x => x !== nr) : [...saved, nr];
    setSaved(next);
    try {
      localStorage.setItem("smakfynd_saved", JSON.stringify(next));
    } catch (e) {}
  };
  return {
    saved,
    toggle,
    isSaved: nr => saved.includes(nr),
    count: saved.length
  };
}

// Global saved state (shared between components)
const SavedContext = React.createContext(null);
function Card({
  p,
  rank,
  delay,
  totalInCategory,
  allProducts
}) {
  const [open, setOpen] = useState(false);
  const sv = React.useContext(SavedContext);
  const icon = {
    Rött: "🍷",
    Vitt: "🥂",
    Rosé: "🌸",
    Mousserande: "🍾"
  }[p.category] || "✦";
  const s100 = p.smakfynd_score;
  const [label, col, emoji] = getScoreInfo(s100);
  const foodStr = (p.food_pairings || []).slice(0, 3).join(", ");
  const sbUrl = `https://www.systembolaget.se/produkt/vin/${p.nr}`;

  // Rank badges
  const badge = rank === 1 ? "Bästa köpet" : rank <= 3 ? `Topp ${rank}` : null;
  // Don't show rank numbers — just show wines as "Topp-viner" when scores are close

  return /*#__PURE__*/React.createElement("div", {
    onClick: () => setOpen(!open),
    style: {
      background: t.card,
      borderRadius: 16,
      border: `1px solid ${open ? t.bdr : t.bdrL}`,
      boxShadow: open ? "0 12px 40px rgba(30,23,16,0.08)" : "0 1px 3px rgba(30,23,16,0.03)",
      transition: "all 0.3s ease",
      overflow: "hidden",
      animation: `slideUp 0.4s ease ${delay}s both`,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 18px",
      display: "flex",
      gap: 14,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(ProductImage, {
    p: p,
    size: 52
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: -4,
      left: -4,
      width: 20,
      height: 20,
      borderRadius: 6,
      background: rank <= 3 ? `linear-gradient(135deg, ${t.wine}, ${t.wineD})` : t.card,
      border: rank <= 3 ? "none" : `1px solid ${t.bdr}`,
      color: rank <= 3 ? "#fff" : t.txM,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 10,
      fontWeight: 800,
      fontFamily: "'Instrument Serif', Georgia, serif",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
    }
  }, rank)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 10,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 17,
      fontFamily: "'Instrument Serif', Georgia, serif",
      fontWeight: 400,
      color: t.tx,
      lineHeight: 1.2,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, p.name), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "2px 0 0",
      fontSize: 12,
      color: t.txL,
      letterSpacing: "0.01em"
    }
  }, p.sub, " \xB7 ", p.country, p.region ? `, ${p.region}` : "")), /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "inline-block"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "50",
    height: "50",
    viewBox: "0 0 50 50",
    style: {
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "25",
    cy: "25",
    r: "22",
    fill: "#e8f0e4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "25",
    cy: "25",
    r: "22",
    fill: "none",
    stroke: "#d4ddd0",
    strokeWidth: "2.5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "25",
    cy: "25",
    r: "22",
    fill: "none",
    stroke: "#2d6b3f",
    strokeWidth: "2.5",
    strokeDasharray: `${s100 * 1.38} 138`,
    strokeLinecap: "round",
    transform: "rotate(-90 25 25)",
    style: {
      transition: "stroke-dasharray 0.8s ease"
    }
  }), /*#__PURE__*/React.createElement("text", {
    x: "25",
    y: "30",
    textAnchor: "middle",
    fontFamily: "'Instrument Serif', Georgia, serif",
    fontSize: "19",
    fontWeight: "900",
    fill: "#2d6b3f"
  }, s100)), (p.organic || p.price_vs_launch_pct > 0 || p.is_new) && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: -6,
      left: -14,
      display: "flex",
      gap: 2
    }
  }, p.price_vs_launch_pct > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 8,
      fontWeight: 800,
      padding: "2px 5px",
      borderRadius: 4,
      background: t.deal,
      color: "#fff",
      boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
    }
  }, "\u2212", p.price_vs_launch_pct, "%"), p.organic && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 800,
      padding: "3px 7px",
      borderRadius: 5,
      background: t.green,
      color: "#fff",
      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      letterSpacing: "0.05em"
    }
  }, "EKO"), p.is_new && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 8,
      fontWeight: 700,
      padding: "2px 5px",
      borderRadius: 4,
      background: t.wine,
      color: "#fff",
      boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
    }
  }, "NY"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 600,
      color: col,
      marginTop: 3
    }
  }, label))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      display: "flex",
      alignItems: "baseline",
      gap: 6,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: t.tx,
      fontFamily: "'Instrument Serif', Georgia, serif"
    }
  }, p.price, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 400,
      color: t.txL
    }
  }, "kr")), p.launch_price && p.price_vs_launch_pct > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: t.txL,
      textDecoration: "line-through"
    }
  }, p.launch_price, "kr"), (p.grape || foodStr) && /*#__PURE__*/React.createElement("span", {
    style: {
      color: t.bdr
    }
  }, "\xB7"), p.grape && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: t.txM
    }
  }, p.grape), p.grape && foodStr && /*#__PURE__*/React.createElement("span", {
    style: {
      color: t.bdr
    }
  }, "\xB7"), foodStr && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: t.txL
    }
  }, foodStr)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(ScoreBars, {
    p: p
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 5,
      fontSize: 11,
      color: t.txM,
      lineHeight: 1.4,
      fontStyle: "italic"
    }
  }, (() => {
    const c = p.crowd_score || 0,
      e = p.expert_score || 0,
      pr = p.price_score || 0;
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
  })()))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 18px 12px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: sbUrl,
    target: "_blank",
    rel: "noopener noreferrer",
    onClick: e => e.stopPropagation(),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      color: t.txM,
      textDecoration: "none",
      transition: "color 0.2s"
    },
    onMouseEnter: e => e.currentTarget.style.color = t.wine,
    onMouseLeave: e => e.currentTarget.style.color = t.txM
  }, "Systembolaget ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9
    }
  }, "\u2197")), sv && /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      sv.toggle(p.nr || p.id);
    },
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 12,
      color: sv.isSaved(p.nr || p.id) ? t.wine : t.txL,
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "2px 0",
      fontFamily: "inherit",
      transition: "all 0.2s"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      lineHeight: 1
    }
  }, sv.isSaved(p.nr || p.id) ? "♥" : "♡"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: sv.isSaved(p.nr || p.id) ? 600 : 400
    }
  }, sv.isSaved(p.nr || p.id) ? "Sparad" : "Spara")), /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      const url = `https://smakfynd.se/#vin/${p.nr}`;
      const text = `${p.name} ${p.sub || ''} — ${p.smakfynd_score}/100 på Smakfynd (${p.price}kr)`;
      if (navigator.share) {
        navigator.share({
          title: p.name,
          text,
          url
        }).catch(() => {});
      } else {
        navigator.clipboard?.writeText(`${text}\n${url}`);
      }
    },
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 12,
      color: t.txL,
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "2px 0",
      fontFamily: "inherit"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      lineHeight: 1
    }
  }, "\u2197"), " Dela")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: t.txF,
      display: "flex",
      alignItems: "center",
      gap: 3
    }
  }, open ? "Stäng ▲" : "Se varför ▼")), open && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 18px 18px",
      borderTop: `1px solid ${t.bdrL}`,
      paddingTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      flexWrap: "wrap",
      marginBottom: 10
    }
  }, badge && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 800,
      padding: "3px 10px",
      borderRadius: 100,
      background: rank === 1 ? `linear-gradient(135deg, #b08d40, #d4a84b)` : `${t.wine}15`,
      color: rank === 1 ? "#fff" : t.wine,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      boxShadow: rank === 1 ? "0 1px 4px rgba(176,141,64,0.3)" : "none"
    }
  }, rank === 1 ? "🏆 " : "", badge), p.confidence === "hög" && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 600,
      padding: "3px 10px",
      borderRadius: 100,
      background: t.greenL,
      color: t.green
    }
  }, "H\xF6g trygghet"), p.price_vs_launch_pct > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      padding: "3px 10px",
      borderRadius: 100,
      background: t.dealL,
      color: t.deal,
      textTransform: "uppercase"
    }
  }, "Priss\xE4nkt \u2212", p.price_vs_launch_pct, "%"), p.organic && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 600,
      padding: "3px 10px",
      borderRadius: 100,
      background: t.greenL,
      color: t.green
    }
  }, "Ekologiskt"), p.food_pairings?.length > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 500,
      padding: "3px 10px",
      borderRadius: 100,
      background: t.bg,
      color: t.txM,
      border: `1px solid ${t.bdrL}`
    }
  }, "Passar till ", p.food_pairings.slice(0, 2).join(", "))), p.style && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: t.txM,
      fontStyle: "italic",
      marginBottom: 10,
      lineHeight: 1.5
    }
  }, p.style), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(ProductImage, {
    p: p,
    size: 72,
    style: {
      borderRadius: 10,
      background: "#faf7f2"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(2,1fr)",
      gap: 6
    }
  }, [["Druva", p.grape], ["Alkohol", p.alc ? `${p.alc}%` : null], ["Volym", `${p.vol} ml`], ["Land", `${p.country}${p.region ? `, ${p.region}` : ""}`]].filter(([_l, v]) => v).map(([l, v], i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: t.txL,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      marginBottom: 1
    }
  }, l), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: t.txM,
      fontWeight: 500
    }
  }, v)))), p.food_pairings?.length > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: t.txL,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      marginBottom: 4
    }
  }, "Passar till"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      flexWrap: "wrap"
    }
  }, p.food_pairings.map((f, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      fontSize: 11,
      padding: "3px 8px",
      borderRadius: 100,
      background: t.bg,
      color: t.txM,
      border: `1px solid ${t.bdrL}`
    }
  }, f)))))), (p.taste_body || p.taste_fruit || p.taste_sweet != null) && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14,
      padding: "12px 14px",
      borderRadius: 10,
      background: t.bg
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: t.txL,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      marginBottom: 10
    }
  }, "Smakprofil"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, [["Lätt", "Fylligt", p.taste_body, 12], ["Stram", "Fruktigt", p.taste_fruit, 12], ["Torrt", "Sött", p.taste_sweet, 12]].filter(([_a, _b, v]) => v != null && v > 0).map(([lo, hi, val, max]) => /*#__PURE__*/React.createElement("div", {
    key: lo
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: t.txL,
      width: 40,
      textAlign: "right",
      flexShrink: 0
    }
  }, lo), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 3,
      borderRadius: 2,
      background: t.bdr,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "50%",
      left: `${val / max * 100}%`,
      width: 9,
      height: 9,
      borderRadius: "50%",
      background: t.wine,
      border: `2px solid ${t.card}`,
      transform: "translate(-50%, -50%)",
      boxShadow: `0 0 0 1px ${t.wine}40`
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: t.txL,
      width: 40,
      flexShrink: 0
    }
  }, hi)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14,
      padding: "12px 14px",
      borderRadius: 10,
      background: t.bg
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: t.txL,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      marginBottom: 10
    }
  }, "Po\xE4ngf\xF6rdelning"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: "#6b8cce"
    }
  }, "Crowd"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: p.crowd_score ? "#6b8cce" : t.txL
    }
  }, p.crowd_score ? `${p.crowd_score.toFixed(1)}/10` : "—")), p.crowd_score && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4,
      borderRadius: 2,
      background: t.bdr,
      overflow: "hidden",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${p.crowd_score * 10}%`,
      height: "100%",
      borderRadius: 2,
      background: "#6b8cce"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: t.txL
    }
  }, p.crowd_reviews ? `${p.crowd_reviews > 999 ? `${(p.crowd_reviews / 1000).toFixed(0)}k` : p.crowd_reviews} omdömen från vanliga vindrickare` : "", p.crowd_reviews >= 50000 && /*#__PURE__*/React.createElement("span", {
    style: {
      color: t.green,
      fontWeight: 600
    }
  }, " \u2014 mycket p\xE5litligt"), p.crowd_reviews >= 10000 && p.crowd_reviews < 50000 && /*#__PURE__*/React.createElement("span", {
    style: {
      color: t.txM
    }
  }, " \u2014 p\xE5litligt")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: "#b07d3b"
    }
  }, "Expert"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: p.expert_score ? "#b07d3b" : t.txL
    }
  }, p.expert_score ? `${p.expert_score.toFixed(1)}/10` : "—")), p.expert_score ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4,
      borderRadius: 2,
      background: t.bdr,
      overflow: "hidden",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${p.expert_score * 10}%`,
      height: "100%",
      borderRadius: 2,
      background: "#b07d3b"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: t.txL
    }
  }, "Snitt fr\xE5n erk\xE4nda vinkritiker")) : /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: t.txL,
      fontStyle: "italic"
    }
  }, "Inga kritikerrecensioner hittade f\xF6r detta vin")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: t.txM
    }
  }, "Prisv\xE4rde"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: t.txM
    }
  }, p.price_score ? `${p.price_score.toFixed(1)}/10` : "—")), p.price_score && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4,
      borderRadius: 2,
      background: t.bdr,
      overflow: "hidden",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${p.price_score * 10}%`,
      height: "100%",
      borderRadius: 2,
      background: t.txM
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: t.txL
    }
  }, (() => {
    const catMedians = {
      "Rött": 279,
      "Vitt": 239,
      "Rosé": 160,
      "Mousserande": 399
    };
    const catNames = {
      "Rött": "rött vin",
      "Vitt": "vitt vin",
      "Rosé": "rosévin",
      "Mousserande": "mousserande"
    };
    const median = catMedians[p.category] || 250;
    return `${p.price}kr · Medianen för ${catNames[p.category] || "vin"}: ${median}kr`;
  })())))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 14,
      background: `linear-gradient(135deg, ${col}18, ${col}08)`,
      border: `2px solid ${col}30`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 24,
      fontWeight: 900,
      color: col,
      lineHeight: 1,
      fontFamily: "'Instrument Serif', Georgia, serif"
    }
  }, s100)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      color: t.txL,
      marginTop: 4
    }
  }, "Smak f\xF6r"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      color: t.txL
    }
  }, "pengarna")))), p.launch_price && p.price_vs_launch_pct > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px",
      borderRadius: 10,
      background: t.dealL,
      marginBottom: 14,
      fontSize: 13,
      color: t.deal,
      lineHeight: 1.5
    }
  }, "Lanserades f\xF6r ", /*#__PURE__*/React.createElement("strong", null, p.launch_price, " kr"), " \u2014 nu ", p.price, " kr. Du sparar ", p.launch_price - p.price, " kr per flaska."), allProducts && (() => {
    const similar = allProducts.filter(w => w.category === p.category && w.package === p.package && w.assortment === "Fast sortiment" && Math.abs(w.price - p.price) <= 50 && (w.nr || w.id) !== (p.nr || p.id) && w.smakfynd_score >= p.smakfynd_score - 5).sort((a, b) => b.smakfynd_score - a.smakfynd_score).slice(0, 3).map(w => {
      // Generate reason WHY this is recommended
      let reason = "";
      if (w.price < p.price - 10) reason = `${p.price - w.price}kr billigare`;else if (w.smakfynd_score > p.smakfynd_score) reason = "Högre fyndpoäng";
      if ((w.expert_score || 0) > (p.expert_score || 0)) reason += (reason ? " · " : "") + "Starkare expertstöd";else if ((w.crowd_score || 0) > (p.crowd_score || 0) + 0.3) reason += (reason ? " · " : "") + "Högre crowd-betyg";
      if (w.grape && p.grape && w.grape === p.grape) reason += (reason ? " · " : "") + "Samma druva";
      if (!reason) reason = "Liknande stil och prisklass";
      return {
        ...w,
        _reason: reason
      };
    });
    if (similar.length === 0) return null;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        color: t.tx,
        marginBottom: 8
      }
    }, "Gillar du ", p.name, "? Testa \xE4ven"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 6
      }
    }, similar.map((w, i) => /*#__PURE__*/React.createElement("a", {
      key: i,
      href: `https://www.systembolaget.se/produkt/vin/${w.nr}`,
      target: "_blank",
      rel: "noopener noreferrer",
      onClick: e => e.stopPropagation(),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 10,
        background: t.bg,
        border: `1px solid ${t.bdrL}`,
        textDecoration: "none",
        transition: "border-color 0.2s"
      },
      onMouseEnter: e => e.currentTarget.style.borderColor = t.wine + "40",
      onMouseLeave: e => e.currentTarget.style.borderColor = t.bdrL
    }, /*#__PURE__*/React.createElement("svg", {
      width: "34",
      height: "34",
      viewBox: "0 0 50 50",
      style: {
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "25",
      cy: "25",
      r: "22",
      fill: "#e8f0e4"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "25",
      cy: "25",
      r: "22",
      fill: "none",
      stroke: "#d4ddd0",
      strokeWidth: "2.5"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "25",
      cy: "25",
      r: "22",
      fill: "none",
      stroke: "#2d6b3f",
      strokeWidth: "2.5",
      strokeDasharray: `${w.smakfynd_score * 1.38} 138`,
      strokeLinecap: "round",
      transform: "rotate(-90 25 25)"
    }), /*#__PURE__*/React.createElement("text", {
      x: "25",
      y: "30",
      textAnchor: "middle",
      fontFamily: "'Instrument Serif', Georgia, serif",
      fontSize: "16",
      fontWeight: "900",
      fill: "#2d6b3f"
    }, w.smakfynd_score)), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontFamily: "'Instrument Serif', serif",
        color: t.tx,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, w.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: t.txL
      }
    }, w.sub, " \xB7 ", w.country), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: t.green,
        marginTop: 2,
        fontWeight: 500
      }
    }, w._reason)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        color: t.tx,
        flexShrink: 0,
        fontFamily: "'Instrument Serif', serif"
      }
    }, w.price, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        fontWeight: 400,
        color: t.txL
      }
    }, "kr"))))));
  })()));
}
function AIQuestion({
  aiResult,
  onFollowup
}) {
  const [freetext, setFreetext] = useState("");
  return /*#__PURE__*/React.createElement("div", null, (aiResult.questions || []).map((q, qi) => /*#__PURE__*/React.createElement("div", {
    key: qi,
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: t.tx,
      fontWeight: 500,
      marginBottom: 6
    }
  }, q), aiResult.quick_options && aiResult.quick_options[qi] && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, aiResult.quick_options[qi].map((opt, oi) => /*#__PURE__*/React.createElement("button", {
    key: oi,
    onClick: () => onFollowup(opt),
    style: {
      padding: "8px 16px",
      borderRadius: 100,
      border: `1px solid ${t.wine}30`,
      background: t.card,
      color: t.wine,
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer",
      fontFamily: "inherit",
      transition: "all 0.2s"
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = t.wine;
      e.currentTarget.style.color = "#fff";
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = t.card;
      e.currentTarget.style.color = t.wine;
    }
  }, opt))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: freetext,
    onChange: e => setFreetext(e.target.value),
    placeholder: "Eller skriv eget svar...",
    onKeyDown: e => e.key === "Enter" && freetext.trim() && onFollowup(freetext.trim()),
    style: {
      flex: 1,
      padding: "10px 14px",
      borderRadius: 10,
      border: `1px solid ${t.bdr}`,
      background: t.card,
      fontSize: 13,
      color: t.tx,
      outline: "none",
      boxSizing: "border-box"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => freetext.trim() && onFollowup(freetext.trim()),
    disabled: !freetext.trim(),
    style: {
      padding: "10px 16px",
      borderRadius: 10,
      border: "none",
      background: t.wine,
      color: "#fff",
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit",
      opacity: freetext.trim() ? 1 : 0.4
    }
  }, "Skicka")));
}
function EditorsPicks({
  products,
  onSelect
}) {
  const [open, setOpen] = useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(!open),
    style: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: 12,
      background: t.card,
      border: `1px solid ${t.bdr}`,
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14
    }
  }, "\uD83C\uDF77"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: t.tx
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: "'Instrument Serif', serif",
      fontWeight: 400
    }
  }, "Redaktionens val"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: t.txL
    }
  }, " \u2014 3 utvalda fynd vi testat och gillar"))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: t.txL,
      transition: "transform 0.2s",
      display: "inline-block",
      transform: open ? "rotate(180deg)" : "rotate(0)"
    }
  }, "\u25BC")), open && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, GABRIELS_PICKS.map((pick, i) => {
    const mp = products.find(pr => String(pr.nr) === String(pick.nr));
    const [_l, pCol] = getScoreInfo(pick.smakfynd_score);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        padding: "14px 16px",
        borderRadius: 12,
        background: t.card,
        border: `1px solid ${t.bdr}`,
        cursor: mp ? "pointer" : "default"
      },
      onClick: () => mp && onSelect(mp.name)
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: t.wine,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 6
      }
    }, pick.verdict), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "40",
      height: "40",
      viewBox: "0 0 50 50",
      style: {
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "25",
      cy: "25",
      r: "22",
      fill: "#e8f0e4"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "25",
      cy: "25",
      r: "22",
      fill: "none",
      stroke: "#d4ddd0",
      strokeWidth: "2.5"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "25",
      cy: "25",
      r: "22",
      fill: "none",
      stroke: "#2d6b3f",
      strokeWidth: "2.5",
      strokeDasharray: `${pick.smakfynd_score * 1.38} 138`,
      strokeLinecap: "round",
      transform: "rotate(-90 25 25)"
    }), /*#__PURE__*/React.createElement("text", {
      x: "25",
      y: "30",
      textAnchor: "middle",
      fontFamily: "'Instrument Serif', Georgia, serif",
      fontSize: "17",
      fontWeight: "900",
      fill: "#2d6b3f"
    }, pick.smakfynd_score)), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontFamily: "'Instrument Serif', serif",
        color: t.tx
      }
    }, pick.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: t.txL
      }
    }, pick.sub, " \xB7 ", pick.price))), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 12,
        color: t.txM,
        lineHeight: 1.5,
        margin: "8px 0 0",
        fontStyle: "italic"
      }
    }, pick.note), mp && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: t.wine,
        marginTop: 6
      }
    }, "Klicka f\xF6r att se fullst\xE4ndig profil \u2192"));
  })));
}
const WINE_AI_URL = "https://smakfynd-wine-ai.smakfynd.workers.dev";
function matchWinesForCourses(courses, products) {
  if (!courses || !courses.length) return [];
  const bodyRange = {
    light: [0, 4],
    medium: [5, 8],
    full: [9, 12]
  };
  const usedNrs = new Set();
  return courses.map(course => {
    const wines = [];
    for (const c of course.criteria || []) {
      if (wines.length >= 3) break; // Max 3 wines per course
      const typeMap = {
        "Rött": "Rött",
        "Vitt": "Vitt",
        "Rosé": "Rosé",
        "Mousserande": "Mousserande"
      };
      const wineType = typeMap[c.type] || c.type;
      const [bMin, bMax] = bodyRange[c.body] || [0, 12];
      const kw = (c.keywords || []).map(k => k.toLowerCase());
      const scored = products.filter(p => p.category === wineType && p.package === "Flaska" && p.assortment === "Fast sortiment").map(p => {
        let fit = 0;
        const body = p.taste_body || 6;
        if (body >= bMin && body <= bMax) fit += 3;else if (Math.abs(body - (bMin + bMax) / 2) <= 3) fit += 1;
        const haystack = [p.name, p.sub, p.grape, p.style, p.cat3, ...(p.food_pairings || [])].join(" ").toLowerCase();
        for (const k of kw) {
          if (haystack.includes(k)) fit += 2;
        }
        return {
          ...p,
          _fit: fit,
          _why: c.why,
          _label: c.label || ""
        };
      }).filter(p => p._fit >= 2 && !usedNrs.has(p.nr)).sort((a, b) => b._fit * 10 + b.smakfynd_score - (a._fit * 10 + a.smakfynd_score));

      // Pick best match for this criterion
      if (scored.length > 0) {
        usedNrs.add(scored[0].nr);
        wines.push(scored[0]);
      }
    }
    return {
      dish: course.dish,
      wines
    };
  }).filter(c => c.wines.length > 0);
}
function WineResult({
  m
}) {
  const [_lbl, col] = getScoreInfo(m.smakfynd_score);
  return /*#__PURE__*/React.createElement("a", {
    href: `https://www.systembolaget.se/produkt/vin/${m.nr}`,
    target: "_blank",
    rel: "noopener noreferrer",
    onClick: e => e.stopPropagation(),
    style: {
      padding: "12px 14px",
      borderRadius: 12,
      background: t.card,
      border: `1px solid ${t.bdrL}`,
      textDecoration: "none",
      display: "flex",
      alignItems: "center",
      gap: 12,
      transition: "border-color 0.2s"
    },
    onMouseEnter: e => e.currentTarget.style.borderColor = t.wine + "40",
    onMouseLeave: e => e.currentTarget.style.borderColor = t.bdrL
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 42,
      height: 42,
      borderRadius: 11,
      flexShrink: 0,
      background: `${col}12`,
      border: `2px solid ${col}30`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17,
      fontWeight: 900,
      color: col,
      lineHeight: 1,
      fontFamily: "'Instrument Serif', Georgia, serif"
    }
  }, m.smakfynd_score)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontFamily: "'Instrument Serif', Georgia, serif",
      color: t.tx,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, m.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: t.txL
    }
  }, m.sub, " \xB7 ", m.country), m._why && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: t.txM,
      marginTop: 3,
      lineHeight: 1.4
    }
  }, m._why)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: t.tx,
      fontFamily: "'Instrument Serif', Georgia, serif"
    }
  }, m.price, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 400,
      color: t.txL
    }
  }, "kr")), m._tier && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      color: m._tierCol || t.txL,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      marginTop: 2
    }
  }, m._tier)));
}
function FoodMatch({
  products
}) {
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
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            meal: userMessage,
            context: existingContext || []
          })
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
        setCourseResults(matchWinesForCourses([{
          dish: meal,
          criteria: data.criteria
        }], products));
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
  const handleFollowup = async answer => {
    // Build conversation context
    const newConv = [...conversation, {
      role: "user",
      content: meal
    }, {
      role: "assistant",
      content: JSON.stringify(aiResult)
    }];
    setConversation(newConv);
    setCourseResults([]);
    setAiResult(null);
    await sendToAI(answer, newConv);
  };
  const dishColors = ["#6b2a3a", "#2a5a6b", "#5a6b2a", "#6b4a2a"];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 22px",
      borderRadius: 16,
      background: t.surface,
      border: `1px solid ${t.bdr}`,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18
    }
  }, "\uD83C\uDF7D"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 400,
      fontFamily: "'Instrument Serif', Georgia, serif",
      color: t.tx
    }
  }, "Kv\xE4llens middag?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: t.txL
    }
  }, "Beskriv vad du ska \xE4ta \u2014 vi f\xF6resl\xE5r vinet."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: meal,
    onChange: e => setMeal(e.target.value),
    placeholder: "T.ex. toast skagen, sedan oxfil\xE9 med r\xF6dvinssky...",
    onKeyDown: e => e.key === "Enter" && handleSubmit(),
    style: {
      flex: 1,
      padding: "12px 16px",
      borderRadius: 12,
      border: `1px solid ${t.bdr}`,
      background: t.card,
      fontSize: 14,
      color: t.tx,
      outline: "none",
      boxSizing: "border-box",
      transition: "border-color 0.2s"
    },
    onFocus: e => e.target.style.borderColor = t.wine + "55",
    onBlur: e => e.target.style.borderColor = t.bdr
  }), /*#__PURE__*/React.createElement("button", {
    onClick: handleSubmit,
    disabled: loading || meal.length < 3,
    style: {
      padding: "12px 18px",
      borderRadius: 12,
      border: "none",
      cursor: loading ? "wait" : "pointer",
      background: t.wine,
      color: "#fff",
      fontSize: 13,
      fontWeight: 600,
      fontFamily: "inherit",
      opacity: loading || meal.length < 3 ? 0.5 : 1,
      transition: "opacity 0.2s",
      flexShrink: 0
    }
  }, loading ? "Tänker..." : "Hitta vin")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      flexWrap: "wrap",
      marginTop: 8
    }
  }, ["Fredagstacos", "Grillat kött", "Pasta", "Lax", "Pizza", "Skaldjur", "Ost & chark", "Dejt"].map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    onClick: () => setMeal(s),
    style: {
      padding: "5px 12px",
      borderRadius: 100,
      border: `1px solid ${t.bdr}`,
      background: t.card,
      color: t.txM,
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 500,
      transition: "all 0.2s"
    },
    onMouseEnter: e => {
      e.currentTarget.style.borderColor = t.wine;
      e.currentTarget.style.color = t.wine;
    },
    onMouseLeave: e => {
      e.currentTarget.style.borderColor = t.bdr;
      e.currentTarget.style.color = t.txM;
    }
  }, s))), loading && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "20px 0",
      color: t.txL
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      marginBottom: 6
    }
  }, "\uD83C\uDF77"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontStyle: "italic"
    }
  }, "Analyserar din m\xE5ltid...")), error && /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 10,
      fontSize: 12,
      color: t.deal
    }
  }, error), aiResult && !loading && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: t.txM,
      lineHeight: 1.5,
      margin: "0 0 12px"
    }
  }, aiResult.reasoning), aiResult.mode === "question" && /*#__PURE__*/React.createElement(AIQuestion, {
    aiResult: aiResult,
    onFollowup: handleFollowup
  }), (aiResult.mode === "recommend" || courseResults.length > 0) && /*#__PURE__*/React.createElement("div", null, courseResults.map((course, ci) => /*#__PURE__*/React.createElement("div", {
    key: ci,
    style: {
      marginBottom: ci < courseResults.length - 1 ? 16 : 0
    }
  }, courseResults.length > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 4,
      height: 18,
      borderRadius: 2,
      background: dishColors[ci % dishColors.length]
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: dishColors[ci % dishColors.length],
      fontFamily: "'Instrument Serif', Georgia, serif"
    }
  }, course.dish)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, course.wines.map((m, i) => {
    const matchedP = products.find(pr => String(pr.nr) === String(m.nr));
    return matchedP ? /*#__PURE__*/React.createElement("div", {
      key: i
    }, m._why && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: t.txM,
        marginBottom: 3,
        fontStyle: "italic"
      }
    }, m._why), /*#__PURE__*/React.createElement(Card, {
      p: matchedP,
      rank: i + 1,
      delay: 0,
      allProducts: products
    })) : /*#__PURE__*/React.createElement(WineResult, {
      key: i,
      m: m
    });
  })))), aiResult.followup && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      padding: "10px 14px",
      borderRadius: 10,
      background: t.bg,
      fontSize: 12,
      color: t.txM,
      lineHeight: 1.5
    }
  }, aiResult.followup), courseResults.length === 0 && aiResult.mode === "recommend" && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: t.txL
    }
  }, "Hittade inga matchningar. Prova en annan beskrivning."))));
}
function StoreMode({
  products,
  onClose
}) {
  const [q, setQ] = useState("");
  const sv = React.useContext(SavedContext);
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const result = useMemo(() => {
    if (q.length < 2) return null;
    const query = q.toLowerCase().trim();

    // Search by article number or name — show multiple matches
    const matches = products.filter(p => String(p.nr) === query || p.name?.toLowerCase().includes(query) || p.sub && p.sub.toLowerCase().includes(query)).slice(0, 5);
    if (!matches.length) return {
      match: null,
      alternatives: []
    };
    const match = matches[0];

    // Find better alternatives in same type within ±40kr
    const alts = products.filter(p => p.category === match.category && p.package === match.package && p.assortment === "Fast sortiment" && Math.abs(p.price - match.price) <= 40 && p.nr !== match.nr && p.smakfynd_score > match.smakfynd_score).sort((a, b) => b.smakfynd_score - a.smakfynd_score).slice(0, 3);
    return {
      match,
      alternatives: alts,
      otherMatches: matches.slice(1)
    };
  }, [q, products]);
  const WineRow = ({
    p,
    isCurrent
  }) => {
    const [_l, col] = getScoreInfo(p.smakfynd_score);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 14,
        background: isCurrent ? t.card : t.card,
        border: `1px solid ${isCurrent ? t.bdr : t.bdrL}`,
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 50,
        height: 50,
        borderRadius: 14,
        flexShrink: 0,
        background: `linear-gradient(135deg, ${col}18, ${col}08)`,
        border: `2px solid ${col}30`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 22,
        fontWeight: 900,
        color: col,
        lineHeight: 1,
        fontFamily: "'Instrument Serif', Georgia, serif"
      }
    }, p.smakfynd_score), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 6,
        fontWeight: 700,
        color: col,
        opacity: 0.7
      }
    }, "PO\xC4NG")), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16,
        fontFamily: "'Instrument Serif', Georgia, serif",
        color: t.tx,
        lineHeight: 1.2
      }
    }, p.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: t.txL,
        marginTop: 2
      }
    }, p.sub, " \xB7 ", p.country), p.grape && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: t.txM,
        marginTop: 2
      }
    }, p.grape), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        marginTop: 4
      }
    }, p.crowd_score >= 7.5 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        color: "#6b8cce",
        background: "#6b8cce10",
        padding: "2px 6px",
        borderRadius: 100
      }
    }, "Crowd-favorit"), p.expert_score >= 7.0 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        color: "#b07d3b",
        background: "#b07d3b10",
        padding: "2px 6px",
        borderRadius: 100
      }
    }, "Expertst\xF6d"), p.organic && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        color: t.green,
        background: `${t.green}10`,
        padding: "2px 6px",
        borderRadius: 100
      }
    }, "Eko"))), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "right",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 20,
        fontWeight: 700,
        color: t.tx,
        fontFamily: "'Instrument Serif', Georgia, serif"
      }
    }, p.price, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 400,
        color: t.txL
      }
    }, "kr")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: t.txL
      }
    }, "nr ", p.nr)));
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: t.bg,
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      padding: "0 16px 40px"
    }
  }, /*#__PURE__*/React.createElement("link", {
    href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap",
    rel: "stylesheet"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 0 16px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontFamily: "'Instrument Serif', Georgia, serif",
      color: t.tx
    }
  }, "Smakfynd"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: t.txL
    }
  }, "St\xE5-i-butiken-l\xE4ge")), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      padding: "8px 16px",
      borderRadius: 100,
      border: `1px solid ${t.bdr}`,
      background: t.card,
      color: t.txM,
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "Tillbaka")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    type: "search",
    inputMode: "search",
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Skriv vinets namn eller artikelnummer...",
    style: {
      width: "100%",
      padding: "20px 60px 20px 52px",
      borderRadius: 16,
      border: `2px solid ${t.wine}30`,
      background: t.card,
      fontSize: 20,
      color: t.tx,
      outline: "none",
      boxSizing: "border-box",
      fontFamily: "'Instrument Serif', Georgia, serif"
    },
    onFocus: e => e.target.style.borderColor = t.wine,
    onBlur: e => e.target.style.borderColor = t.wine + "30"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 18,
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: 22,
      color: t.txL,
      pointerEvents: "none"
    }
  }, "\uD83D\uDD0D"), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 18,
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: 20,
      color: t.bdr,
      pointerEvents: "none"
    },
    title: "Streckkods-scanner kommer snart"
  }, "\uD83D\uDCF7")), result && result.match && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: t.txL,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      marginBottom: 8
    }
  }, "Ditt vin"), /*#__PURE__*/React.createElement(WineRow, {
    p: result.match,
    isCurrent: true
  }), result.alternatives.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: t.green,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      marginBottom: 8,
      fontWeight: 700
    }
  }, "B\xE4ttre alternativ i samma prisklass"), result.alternatives.map((p, i) => /*#__PURE__*/React.createElement(WineRow, {
    key: i,
    p: p,
    isCurrent: false
  }))), result.alternatives.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 20px",
      borderRadius: 14,
      background: `${t.green}08`,
      border: `1px solid ${t.green}20`,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: t.green,
      fontWeight: 600
    }
  }, "Bra val!"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: t.txM,
      marginTop: 2
    }
  }, "Det h\xE4r \xE4r bland de b\xE4sta i sin prisklass.")), result.otherMatches && result.otherMatches.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: t.txL,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      marginBottom: 8
    }
  }, "Matchade \xE4ven"), result.otherMatches.map((p, i) => /*#__PURE__*/React.createElement(WineRow, {
    key: i,
    p: p,
    isCurrent: false
  })))), result && !result.match && q.length >= 2 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "40px 20px",
      color: t.txL
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      marginBottom: 8,
      opacity: 0.4
    }
  }, "\uD83D\uDD0D"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: t.txM
    }
  }, "Hittade inget vin med \"", q, "\""), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: t.txL,
      marginTop: 4
    }
  }, "Prova vinets namn eller artikelnummer (finns p\xE5 hyllkanten)")), !result && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "40px 20px",
      color: t.txL
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      marginBottom: 12
    }
  }, "\uD83C\uDFEA"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontFamily: "'Instrument Serif', Georgia, serif",
      color: t.tx,
      marginBottom: 6
    }
  }, "St\xE5 i butiken?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: t.txM,
      lineHeight: 1.6
    }
  }, "Skriv in vinets namn eller artikelnummer.", /*#__PURE__*/React.createElement("br", null), "Vi visar po\xE4ngen och om det finns b\xE4ttre alternativ.")));
}
function AgeGate({
  onConfirm
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "#f5f1eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("link", {
    href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap",
    rel: "stylesheet"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      maxWidth: 380
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 48,
      marginBottom: 16
    }
  }, "\uD83C\uDF77"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "0 0 8px",
      fontSize: 28,
      fontFamily: "'Instrument Serif', Georgia, serif",
      fontWeight: 400,
      color: "#2d2520"
    }
  }, "Smakfynd"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 24px",
      fontSize: 14,
      color: "#8a7e72",
      lineHeight: 1.6
    }
  }, "Den h\xE4r sidan inneh\xE5ller information om alkoholhaltiga drycker och riktar sig till personer som fyllt 25 \xE5r."), /*#__PURE__*/React.createElement("button", {
    onClick: onConfirm,
    style: {
      padding: "14px 36px",
      borderRadius: 14,
      border: "none",
      cursor: "pointer",
      background: "#6b2a3a",
      color: "#fff",
      fontSize: 15,
      fontWeight: 600,
      fontFamily: "inherit",
      transition: "opacity 0.2s",
      marginBottom: 12
    },
    onMouseEnter: e => e.currentTarget.style.opacity = "0.85",
    onMouseLeave: e => e.currentTarget.style.opacity = "1"
  }, "Ja, jag \xE4r \xF6ver 25"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 16px",
      fontSize: 12,
      color: "#b0a898"
    }
  }, "Genom att g\xE5 vidare bekr\xE4ftar du att du \xE4r minst 25 \xE5r."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 10,
      color: "#c5bdb3",
      lineHeight: 1.6
    }
  }, "Smakfynd \xE4r en oberoende informationstj\xE4nst fr\xE5n Olav Innovation AB.", /*#__PURE__*/React.createElement("br", null), "Ingen koppling till Systembolaget. Vi s\xE4ljer inte alkohol.")));
}
function Smakfynd() {
  const [ageOk, setAgeOk] = useState(() => {
    try {
      return localStorage.getItem("smakfynd_age") === "ok";
    } catch (e) {
      return false;
    }
  });
  const confirmAge = () => {
    try {
      localStorage.setItem("smakfynd_age", "ok");
    } catch (e) {}
    setAgeOk(true);
  };
  if (!ageOk) return /*#__PURE__*/React.createElement(AgeGate, {
    onConfirm: confirmAge
  });
  return /*#__PURE__*/React.createElement(SmakfyndApp, null);
}

// Hash routing: read initial state from URL hash
function parseHash() {
  const hash = window.location.hash.slice(1); // remove #
  if (!hash) return {};
  if (hash.startsWith('vin/')) return {
    openWine: hash.slice(4)
  };
  const catMap = {
    rott: 'Rött',
    vitt: 'Vitt',
    rose: 'Rosé',
    bubbel: 'Mousserande',
    alla: 'all'
  };
  if (catMap[hash]) return {
    cat: catMap[hash]
  };
  return {
    search: decodeURIComponent(hash)
  };
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
      } catch (e) {}

      // Try fetching from URL
      if (DATA_URL) {
        try {
          const res = await fetch(DATA_URL);
          const data = await res.json();
          setAllData(data);
          setLoading(false);
          return;
        } catch (e) {}
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
      food_pairings: typeof p.food_pairings === 'string' ? p.food_pairings.split(',').map(s => s.trim()).filter(Boolean) : p.food_pairings || [],
      package: p.pkg || 'Flaska'
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
    const catMap = {
      Rött: 'rott',
      Vitt: 'vitt',
      Rosé: 'rose',
      Mousserande: 'bubbel',
      all: 'alla'
    };
    if (!search && catMap[cat]) {
      history.replaceState(null, '', '#' + catMap[cat]);
    }
  }, [cat]);
  const [showEco, setShowEco] = useState(false);
  const [showBest, setShowBest] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selCountry, setSelCountry] = useState(null);
  const [selFoods, setSelFoods] = useState([]);
  const toggleFood = f => setSelFoods(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  const filtered = useMemo(() => {
    let r = [...products];
    if (!showBest) r = r.filter(p => p.assortment === "Fast sortiment");
    r = r.filter(p => p.package === pkg);
    if (cat !== "all") r = r.filter(p => p.category === cat);
    if (price !== "all") {
      const [a, b] = price.split("-").map(Number);
      r = r.filter(p => p.price >= a && p.price <= b);
    }
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(p => [p.name, p.sub, p.country, p.grape, p.style, p.organic ? "eko ekologisk organic" : ""].some(f => (f || "").toLowerCase().includes(q)));
    }
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
  const clearAll = () => {
    setSearch("");
    setCat("all");
    setPrice("all");
    setShowNew(false);
    setShowDeals(false);
    setShowEco(false);
    setSelCountry(null);
    setSelFoods([]);
    setShowBest(false);
  };
  const savedWines = useMemo(() => {
    return products.filter(p => sv.saved.includes(p.nr || p.id)).sort((a, b) => b.smakfynd_score - a.smakfynd_score);
  }, [products, sv.saved]);
  return /*#__PURE__*/React.createElement(SavedContext.Provider, {
    value: sv
  }, /*#__PURE__*/React.createElement("link", {
    href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap",
    rel: "stylesheet"
  }), storeMode && /*#__PURE__*/React.createElement(StoreMode, {
    products: products,
    onClose: () => setStoreMode(false)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: t.bg,
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      display: storeMode ? "none" : "block"
    }
  }, /*#__PURE__*/React.createElement("style", null, `
        @keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.96) } to { opacity:1; transform:scale(1) } }
        ::selection { background: ${t.wine}22 }
        input::placeholder { color: ${t.txF} }
        *::-webkit-scrollbar { display: none }
        * { scrollbar-width: none }
      `), /*#__PURE__*/React.createElement("header", {
    style: {
      padding: "44px 20px 0",
      maxWidth: 580,
      margin: "0 auto",
      textAlign: "center",
      animation: "fadeIn 0.6s ease"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    },
    dangerouslySetInnerHTML: {
      __html: `<svg width="160" height="36" viewBox="0 0 200 44"><text x="0" y="30" font-family="Georgia, 'Times New Roman', serif" font-size="32" font-weight="400" fill="#7a2332" letter-spacing="0.3">Smakfynd</text><line x1="0" y1="37" x2="178" y2="37" stroke="#c9a84c" stroke-width="1.2" opacity="0.7"/></svg>`
    }
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "0 0 12px",
      fontSize: 36,
      lineHeight: 1.1,
      fontFamily: "'Instrument Serif', Georgia, serif",
      fontWeight: 400,
      color: t.tx
    }
  }, "Mindre hype,", /*#__PURE__*/React.createElement("br", null), "b\xE4ttre ", /*#__PURE__*/React.createElement("em", {
    style: {
      color: t.wine
    }
  }, "vink\xF6p")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 auto 20px",
      fontSize: 15,
      color: t.txM,
      lineHeight: 1.6,
      maxWidth: 440,
      fontWeight: 300
    }
  }, "Vi j\xE4mf\xF6r 11 500+ viner mot r\xE4tt kategori \u2014 inte hela hyllan. H\xE4r hittar du fynden."), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 20px",
      borderRadius: 14,
      border: `1px solid ${t.bdr}`,
      background: t.card,
      marginBottom: 20,
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: t.tx,
      marginBottom: 4
    }
  }, "S\xE5 funkar Smakfynd"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: t.txM,
      marginBottom: 8,
      lineHeight: 1.4
    }
  }, "B\xE4sta k\xF6p i varje stil och prisklass \u2014 baserat p\xE5 data, inte magk\xE4nsla."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, [["🍷", "Vi jämför bara med liknande viner — rött mot rött, bubbel mot bubbel"], ["⚖️", "Vi väger ihop crowd-betyg, expertrecensioner och prisvärde"], ["📊", "Fler omdömen ger säkrare signal — viner med få betyg rankas lägre"], ["🤝", "Vi säljer inte vin — vi hjälper dig välja bättre"]].map(([icon, text], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 8,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      lineHeight: 1.4,
      flexShrink: 0
    }
  }, icon), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: t.txM,
      lineHeight: 1.5
    }
  }, text))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      gap: 20,
      fontSize: 13,
      color: t.txL,
      marginBottom: 6
    }
  }, [["about", "Om Smakfynd"], ["method", "Metoden"], ["faq", "Vanliga frågor"], ["saved", `♥ Min lista (${sv.count})`]].map(([k, l]) => /*#__PURE__*/React.createElement("span", {
    key: k,
    onClick: () => setPanel(panel === k ? null : k),
    style: {
      cursor: "pointer",
      borderBottom: panel === k ? `1.5px solid ${t.wine}` : "1.5px solid transparent",
      paddingBottom: 2,
      transition: "all 0.2s",
      color: panel === k ? t.wine : t.txL
    }
  }, l)))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 580,
      margin: "0 auto",
      padding: "24px 16px 80px"
    }
  }, panel === "about" && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 22,
      borderRadius: 16,
      background: t.card,
      border: `1px solid ${t.bdr}`,
      marginBottom: 20,
      animation: "scaleIn 0.25s ease"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "0 0 12px",
      fontSize: 22,
      fontFamily: "'Instrument Serif', serif",
      fontWeight: 400,
      color: t.tx
    }
  }, "Om Smakfynd"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: t.txM,
      lineHeight: 1.7,
      margin: "0 0 12px"
    }
  }, "Smakfynd hj\xE4lper dig hitta viner som ger mest smak f\xF6r pengarna. Vi f\xF6ljer ", /*#__PURE__*/React.createElement("strong", null, "11 500+ viner"), " p\xE5 Systembolaget och kombinerar crowd-betyg, expertrecensioner och prisj\xE4mf\xF6relse f\xF6r att lyfta fram de b\xE4sta fynden."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: t.txM,
      lineHeight: 1.7,
      margin: "0 0 14px"
    }
  }, "Resultatet \xE4r en enda po\xE4ng \u2014 ", /*#__PURE__*/React.createElement("strong", null, "Smakfynd-po\xE4ngen"), " \u2014 som visar kvalitet per krona. Vi har \xE4ven en AI-vinmatchare som f\xF6resl\xE5r viner baserat p\xE5 vad du ska \xE4ta."), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      borderRadius: 12,
      background: t.bg,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontFamily: "'Instrument Serif', serif",
      color: t.tx,
      marginBottom: 4
    }
  }, "Gabriel Linton, grundare"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: t.txM,
      lineHeight: 1.6,
      margin: 0
    }
  }, "Forskare i innovation och entrepren\xF6rskap (PhD, \xD6rebro universitet). F\xF8rsteamanuensis vid Universitetet i Innlandet, Norge. Utbildad i dryckeskunskap vid Restaurang- och hotellh\xF6gskolan i Grythyttan. MBA, Cleveland State University."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: t.txM,
      lineHeight: 1.6,
      margin: "8px 0 0"
    }
  }, "Smakfynd startade med mitt eget problem: jag ville hitta bra vin utan att gissa. Som forskare vill jag ha data \u2014 inte magk\xE4nsla. All information fanns redan, men ingen hade kopplat ihop den p\xE5 ett enkelt s\xE4tt. Och jag fick ofta k\xE4nslan att billigare viner smakade n\xE4stan lika bra som betydligt dyrare. D\xE4rf\xF6r byggde jag ett system som v\xE4ger in priset i omd\xF6met \u2014 systematiskt.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: t.txL,
      margin: 0
    }
  }, "Olav Innovation AB \xB7 Oberoende informationstj\xE4nst \xB7 Ingen koppling till Systembolaget \xB7 Vi s\xE4ljer inte alkohol"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPanel(null),
    style: {
      marginTop: 12,
      fontSize: 12,
      color: t.txL,
      background: "none",
      border: "none",
      cursor: "pointer",
      textDecoration: "underline"
    }
  }, "St\xE4ng")), panel === "method" && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 22,
      borderRadius: 16,
      background: t.card,
      border: `1px solid ${t.bdr}`,
      marginBottom: 20,
      animation: "scaleIn 0.25s ease"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "0 0 14px",
      fontSize: 22,
      fontFamily: "'Instrument Serif', serif",
      fontWeight: 400,
      color: t.tx
    }
  }, "S\xE5 ber\xE4knas po\xE4ngen"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      marginBottom: 16
    }
  }, [["👥", "Crowd-betyg", "Betyg från hundratusentals vanliga vindrickare. Viner med fler omdömen väger tyngre. Viner med färre än 25 omdömen rankas inte alls."], ["🏆", "Expertrecensioner", "Poäng från erkända vinkritiker som James Suckling, Decanter, Falstaff och Wine Enthusiast. Om crowd och experter är överens får vinet en extra bonus."], ["💰", "Prisvärde", "Literpriset jämförs mot medianen i samma kategori. Rött jämförs med rött — aldrig med bubbel. Billigare än snittet med samma kvalitet = högre poäng."]].map(([icon, title, desc], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      flexShrink: 0,
      marginTop: 2
    }
  }, icon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: t.tx,
      marginBottom: 2
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: t.txM,
      lineHeight: 1.6,
      margin: 0
    }
  }, desc))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      borderRadius: 10,
      background: t.bg,
      marginBottom: 16,
      border: `1px solid ${t.bdrL}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: t.tx,
      lineHeight: 1.7
    }
  }, /*#__PURE__*/React.createElement("strong", null, "H\xF6g kvalitet till l\xE5gt pris = h\xF6g po\xE4ng."), " Kvalitet g\xE5r alltid f\xF6re pris \u2014 ett billigt vin med d\xE5ligt betyg kan aldrig hamna h\xF6gt.")), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 10px",
      fontSize: 15,
      fontFamily: "'Instrument Serif', serif",
      fontWeight: 400,
      color: t.tx
    }
  }, "Transparens"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginBottom: 14
    }
  }, [["Datakällor", "Crowd-betyg hämtas från internationella vindrickare. Expertpoäng kommer från Wine Enthusiast (130 000 recensioner) och Wine-Searcher (aggregat från flera kritiker). Prisdata från Systembolaget."], ["Osäker matchning", "Vi matchar viner mot kritiker-databaser med namn och region. Ibland blir det fel — vi kräver ordöverlapp och filtrerar bort osäkra matchningar. Viner utan expertmatch rankas bara på crowd + pris."], ["Vad poängen inte betyder", "Hög poäng betyder inte att vinet passar just dig — det betyder att det ger bra kvalitet för pengarna enligt crowd och experter. Smak är personligt. Använd smakprofilen och AI-matcharen för att hitta rätt."], ["Ekologiskt", "Ekologiska viner får en liten poängbonus (+0.2 av 10). Det räcker inte för att lyfta ett dåligt vin, men vid lika kvalitet vinner eko."]].map(([title, desc], i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: t.tx,
      marginBottom: 2
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: t.txM,
      lineHeight: 1.6,
      margin: 0
    }
  }, desc)))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPanel(null),
    style: {
      marginTop: 4,
      fontSize: 12,
      color: t.txL,
      background: "none",
      border: "none",
      cursor: "pointer",
      textDecoration: "underline"
    }
  }, "St\xE4ng")), panel === "faq" && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20,
      animation: "scaleIn 0.25s ease"
    }
  }, FAQS.map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    onClick: () => setFaqOpen(faqOpen === i ? null : i),
    style: {
      padding: "14px 18px",
      borderRadius: i === 0 ? "16px 16px 0 0" : i === FAQS.length - 1 ? "0 0 16px 16px" : 0,
      background: t.card,
      border: `1px solid ${t.bdr}`,
      borderTop: i > 0 ? "none" : undefined,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: t.tx
    }
  }, f.q), /*#__PURE__*/React.createElement("span", {
    style: {
      color: t.txL,
      fontSize: 16,
      transition: "transform 0.2s",
      transform: faqOpen === i ? "rotate(45deg)" : "none"
    }
  }, "+")), faqOpen === i && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: t.txM,
      margin: "10px 0 0",
      lineHeight: 1.65
    }
  }, f.a))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPanel(null),
    style: {
      marginTop: 10,
      fontSize: 12,
      color: t.txL,
      background: "none",
      border: "none",
      cursor: "pointer",
      textDecoration: "underline"
    }
  }, "St\xE4ng")), panel === "saved" && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 22,
      borderRadius: 16,
      background: t.card,
      border: `1px solid ${t.bdr}`,
      marginBottom: 20,
      animation: "scaleIn 0.25s ease"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "0 0 4px",
      fontSize: 22,
      fontFamily: "'Instrument Serif', serif",
      fontWeight: 400,
      color: t.tx
    }
  }, "Sparade viner"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 14px",
      fontSize: 12,
      color: t.txL
    }
  }, "Dina favoriter sparas i den h\xE4r webbl\xE4saren."), savedWines.length === 0 ? /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: t.txM,
      fontStyle: "italic"
    }
  }, "Inga sparade viner \xE4nnu. Tryck \u2661 p\xE5 ett vin f\xF6r att spara det.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, savedWines.map((p, i) => /*#__PURE__*/React.createElement(Card, {
    key: p.id || i,
    p: p,
    rank: i + 1,
    delay: 0,
    allProducts: products
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPanel(null),
    style: {
      marginTop: 12,
      fontSize: 12,
      color: t.txL,
      background: "none",
      border: "none",
      cursor: "pointer",
      textDecoration: "underline"
    }
  }, "St\xE4ng")), /*#__PURE__*/React.createElement(FoodMatch, {
    products: products
  }), /*#__PURE__*/React.createElement(EditorsPicks, {
    products: products,
    onSelect: name => setSearch(name)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "S\xF6k vin, druva, land, stil...",
    value: search,
    onChange: e => setSearch(e.target.value),
    style: {
      width: "100%",
      padding: "14px 16px 14px 42px",
      borderRadius: 14,
      border: `1px solid ${t.bdr}`,
      background: t.card,
      fontSize: 14,
      color: t.tx,
      outline: "none",
      boxSizing: "border-box",
      transition: "border-color 0.2s, box-shadow 0.2s"
    },
    onFocus: e => {
      e.target.style.borderColor = t.wine + "40";
      e.target.style.boxShadow = `0 0 0 3px ${t.wine}08`;
    },
    onBlur: e => {
      e.target.style.borderColor = t.bdr;
      e.target.style.boxShadow = "none";
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 14,
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: 16,
      color: t.txL,
      pointerEvents: "none"
    }
  }, "\u2315")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setStoreMode(true),
    style: {
      padding: "14px 16px",
      borderRadius: 14,
      border: `1px solid ${t.bdr}`,
      background: t.card,
      cursor: "pointer",
      flexShrink: 0,
      fontFamily: "inherit",
      fontSize: 13,
      color: t.txM,
      display: "flex",
      alignItems: "center",
      gap: 5,
      transition: "all 0.2s"
    },
    onMouseEnter: e => {
      e.currentTarget.style.borderColor = t.wine + "40";
      e.currentTarget.style.color = t.wine;
    },
    onMouseLeave: e => {
      e.currentTarget.style.borderColor = t.bdr;
      e.currentTarget.style.color = t.txM;
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16
    }
  }, "\uD83C\uDFEA"), " I butiken?")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 10,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      background: t.bdrL,
      borderRadius: 100,
      padding: 3,
      width: "fit-content"
    }
  }, [["Flaska", "🍾 Flaskor"], ["BiB", "📦 Bag-in-box"], ["Stor", "🧴 Storpack"]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setPkg(k),
    style: {
      padding: "7px 16px",
      borderRadius: 100,
      border: "none",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: pkg === k ? 600 : 400,
      fontFamily: "inherit",
      background: pkg === k ? t.card : "transparent",
      color: pkg === k ? t.tx : t.txL,
      boxShadow: pkg === k ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
      transition: "all 0.2s"
    }
  }, l)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      overflowX: "auto",
      paddingBottom: 4,
      marginBottom: 10
    }
  }, CATS.map(ct => /*#__PURE__*/React.createElement("button", {
    key: ct.k,
    onClick: () => setCat(ct.k),
    style: {
      ...pill(cat === ct.k),
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14
    }
  }, ct.i), " ", ct.l))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      marginBottom: 10
    }
  }, [["0-99", "Under 100 kr"], ["100-150", "100–150 kr"], ["151-200", "150–200 kr"], ["201-9999", "200+ kr"]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setPrice(price === k ? "all" : k),
    style: pill(price === k)
  }, l)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowEco(!showEco),
    style: {
      ...pill(showEco, t.green),
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12
    }
  }, "\uD83C\uDF3F"), " Ekologiskt")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      marginBottom: 10,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAdvanced(!showAdvanced),
    style: {
      ...pill(showAdvanced),
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, "Fler filter ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      transition: "transform 0.2s",
      display: "inline-block",
      transform: showAdvanced ? "rotate(180deg)" : "rotate(0)"
    }
  }, "\u25BC")), hasFilters && /*#__PURE__*/React.createElement("button", {
    onClick: clearAll,
    style: {
      padding: "8px 14px",
      borderRadius: 100,
      border: `1px solid ${t.bdr}`,
      background: "transparent",
      color: t.txL,
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "Rensa filter \u2715")), showAdvanced && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginBottom: 12,
      padding: "14px 16px",
      borderRadius: 14,
      background: t.card,
      border: `1px solid ${t.bdrL}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowEco(!showEco),
    style: pill(showEco, t.green)
  }, "Eko"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setShowNew(!showNew);
      if (!showNew) setShowDeals(false);
    },
    style: pill(showNew)
  }, "Nyheter"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setShowDeals(!showDeals);
      if (!showDeals) setShowNew(false);
    },
    style: pill(showDeals, t.deal)
  }, "Priss\xE4nkt"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowBest(!showBest),
    style: pill(showBest)
  }, "Best\xE4llning")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: t.txL,
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: "0.08em"
    }
  }, "Land"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, [["Italien", "\ud83c\uddee\ud83c\uddf9"], ["Frankrike", "\ud83c\uddeb\ud83c\uddf7"], ["Spanien", "\ud83c\uddea\ud83c\uddf8"], ["USA", "\ud83c\uddfa\ud83c\uddf8"], ["Tyskland", "\ud83c\udde9\ud83c\uddea"], ["Sydafrika", "\ud83c\uddff\ud83c\udde6"], ["Chile", "\ud83c\udde8\ud83c\uddf1"], ["Portugal", "\ud83c\uddf5\ud83c\uddf9"], ["Australien", "\ud83c\udde6\ud83c\uddfa"]].map(([c, flag]) => /*#__PURE__*/React.createElement("button", {
    key: c,
    onClick: () => setSelCountry(selCountry === c ? null : c),
    style: pill(selCountry === c)
  }, flag, " ", c)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: t.txL,
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: "0.08em"
    }
  }, "Passar till"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, ["Kött", "Fågel", "Fisk", "Skaldjur", "Fläsk", "Grönsaker", "Ost", "Vilt"].map(f => /*#__PURE__*/React.createElement("button", {
    key: f,
    onClick: () => toggleFood(f),
    style: pill(selFoods.includes(f))
  }, f))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14,
      padding: "0 4px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: t.txL
    }
  }, loading ? "Laddar..." : `${filtered.length} produkter`), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: t.txF
    }
  }, "Mest smak f\xF6r pengarna")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: t.txF,
      marginTop: 3
    }
  }, "Rankade efter kvalitet i f\xF6rh\xE5llande till pris \u2014 inte \"b\xE4sta vinet\", utan b\xE4sta v\xE4rdet i sin kategori.")), loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "48px 20px",
      color: t.txL
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      marginBottom: 12
    }
  }, "\u23F3"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      color: t.txM
    }
  }, "Laddar...")) : filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "48px 20px",
      color: t.txL
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      marginBottom: 12,
      opacity: 0.4
    }
  }, "\uD83D\uDD0D"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      fontFamily: "'Instrument Serif', serif",
      fontStyle: "italic",
      color: t.txM
    }
  }, "Inga produkter matchade din s\xF6kning."), /*#__PURE__*/React.createElement("button", {
    onClick: clearAll,
    style: {
      marginTop: 10,
      fontSize: 13,
      color: t.wine,
      background: "none",
      border: "none",
      cursor: "pointer",
      textDecoration: "underline"
    }
  }, "Visa alla produkter")) : cat === "all" && !hasFilters ?
  /*#__PURE__*/
  /* Situation-based sections when viewing "Alla" without filters */
  React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 24
    }
  }, [["Bästa röda fynden", "Rött", null, null], ["Bästa vita just nu", "Vitt", null, null], ["Mest prisvärda bubbel", "Mousserande", null, null], ["Trygga köp under 100 kr", null, 0, 100], ["Mest smak för pengarna 100–200 kr", null, 100, 200]].map(([title, catFilter, pLo, pHi]) => {
    const sectionWines = filtered.filter(p => (!catFilter || p.category === catFilter) && (!pLo && !pHi || p.price >= (pLo || 0) && p.price < (pHi || 99999))).slice(0, 5);
    if (sectionWines.length === 0) return null;
    return /*#__PURE__*/React.createElement("div", {
      key: title
    }, /*#__PURE__*/React.createElement("h3", {
      style: {
        margin: "0 0 10px",
        fontSize: 16,
        fontFamily: "'Instrument Serif', serif",
        fontWeight: 400,
        color: t.tx
      }
    }, title), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, sectionWines.map((p, i) => /*#__PURE__*/React.createElement(Card, {
      key: p.id || i,
      p: p,
      rank: i + 1,
      delay: 0,
      allProducts: products
    }))));
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, filtered.slice(0, 50).map((p, i) => /*#__PURE__*/React.createElement(Card, {
    key: p.id || i,
    p: p,
    rank: i + 1,
    delay: Math.min(i * 0.04, 0.4),
    allProducts: products
  })), filtered.length > 50 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: 20,
      color: t.txL,
      fontSize: 13
    }
  }, "Visar topp 50 av ", filtered.length, ". Anv\xE4nd filter f\xF6r att hitta fler.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40,
      padding: "28px 24px",
      borderRadius: 18,
      background: t.card,
      border: `1px solid ${t.bdr}`,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: t.wine,
      textTransform: "uppercase",
      letterSpacing: "0.14em",
      marginBottom: 8
    }
  }, "Nyhetsbrev"), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 6px",
      fontSize: 22,
      fontFamily: "'Instrument Serif', serif",
      fontWeight: 400,
      color: t.tx
    }
  }, "Veckans b\xE4sta k\xF6p"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: t.txM,
      margin: "0 0 16px",
      lineHeight: 1.5
    }
  }, "Smartaste vinvalen direkt i inkorgen \u2014 varje torsdag."), /*#__PURE__*/React.createElement("a", {
    href: "https://smakfynd.substack.com",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      display: "inline-block",
      padding: "12px 28px",
      borderRadius: 12,
      border: "none",
      cursor: "pointer",
      background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`,
      color: "#fff",
      fontSize: 14,
      fontWeight: 600,
      textDecoration: "none",
      boxShadow: `0 2px 8px ${t.wine}25`,
      transition: "opacity 0.2s"
    },
    onMouseEnter: e => e.currentTarget.style.opacity = "0.9",
    onMouseLeave: e => e.currentTarget.style.opacity = "1"
  }, "Prenumerera p\xE5 Substack \u2197"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: t.txL,
      margin: "10px 0 0"
    }
  }, "Gratis. Avsluta n\xE4r du vill.")), /*#__PURE__*/React.createElement("footer", {
    style: {
      marginTop: 40,
      paddingTop: 24,
      borderTop: `1px solid ${t.bdr}`,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: t.txL,
      lineHeight: 1.8
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 8px"
    }
  }, "Smakfynd hj\xE4lper dig hitta vinet som ger mest smak f\xF6r pengarna."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 10px",
      color: t.txM
    }
  }, "Skapad av ", /*#__PURE__*/React.createElement("strong", null, "Gabriel Linton"), " \xB7 Dryckeskunskap, Grythyttan \xB7 ", /*#__PURE__*/React.createElement("strong", null, "Olav Innovation AB")), /*#__PURE__*/React.createElement("a", {
    href: "https://smakfynd.substack.com",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      display: "inline-block",
      fontSize: 12,
      color: t.wine,
      textDecoration: "none",
      marginBottom: 10
    }
  }, "Prenumerera p\xE5 Veckans fynd \u2197")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: t.txF,
      margin: "0 0 10px",
      lineHeight: 1.7
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 4px"
    }
  }, "Uppdaterad mars 2026 \xB7 Produktdata fr\xE5n Systembolagets \xF6ppna sortiment"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0
    }
  }, "Smakfynd \xE4r en oberoende tj\xE4nst och har ingen koppling till, och \xE4r inte godk\xE4nd av, Systembolaget. Vi s\xE4ljer inte alkohol.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 10,
      color: t.txF,
      fontStyle: "italic"
    }
  }, "Njut med m\xE5tta.")))));
}
