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
    if (!s) {
      s = Math.random().toString(36).slice(2);
      sessionStorage.setItem("sf_sid", s);
    }
    return s;
  } catch (e) {
    return "anon";
  }
})();
function track(event, data) {
  try {
    const device = window.innerWidth < 768 ? "mobile" : "desktop";
    fetch(ANALYTICS_URL + "/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        session: _sid,
        event,
        wine_nr: data?.nr,
        data,
        page: location.hash || "/",
        device,
        referrer: document.referrer
      }),
      keepalive: true
    }).catch(() => {});
  } catch (e) {}
}
function trackSearch(query, count, clickedNr) {
  try {
    fetch(ANALYTICS_URL + "/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        session: _sid,
        query,
        results_count: count,
        clicked_nr: clickedNr
      }),
      keepalive: true
    }).catch(() => {});
  } catch (e) {}
}
function trackAI(meal, response, latencyMs) {
  try {
    const wines = (response?.courses || []).flatMap(c => c.wines || []).map(w => w.nr).filter(Boolean).join(",");
    fetch(ANALYTICS_URL + "/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        session: _sid,
        meal,
        response,
        mode: response?.mode,
        wines_suggested: wines,
        latency_ms: latencyMs,
        model: "llama-3.1-70b"
      }),
      keepalive: true
    }).catch(() => {});
  } catch (e) {}
}
const CATS = [{
  k: "all",
  l: "Alla"
}, {
  k: "Rött",
  l: "Rött vin"
}, {
  k: "Vitt",
  l: "Vitt vin"
}, {
  k: "Rosé",
  l: "Rosé"
}, {
  k: "Mousserande",
  l: "Bubbel"
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
  k: "200-299",
  l: "200 – 299 kr"
}, {
  k: "300-499",
  l: "300 – 499 kr"
}, {
  k: "500-9999",
  l: "500 kr +"
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

// ════════════════════════════════════════════════════════════
// theme.jsx
// ════════════════════════════════════════════════════════════
// src/theme.jsx
// ── Design system ──
const t = {
  // Backgrounds
  bg: "#f5f1ea",
  // warmer, slightly darker
  surface: "#fdfbf7",
  card: "#ffffff",
  // Borders
  bdr: "#e2d8c8",
  // warmer border
  bdrL: "#ede6da",
  // Brand
  wine: "#8b2332",
  wineD: "#6b1a27",
  wineL: "#8b233210",
  // Text
  tx: "#1a1510",
  // slightly darker for better contrast
  txM: "#3d3830",
  // darker mid-text
  txL: "#6b6355",
  // darker light text
  txF: "#9e9588",
  // Semantic
  green: "#2d7a3e",
  // slightly cooler green
  greenL: "#2d7a3e10",
  deal: "#c44020",
  dealL: "#c4402010",
  gold: "#b08d40",
  // Shadows
  sh1: "0 1px 3px rgba(26,21,16,0.04)",
  sh2: "0 4px 12px rgba(26,21,16,0.06)",
  sh3: "0 8px 24px rgba(26,21,16,0.08)",
  shHover: "0 8px 28px rgba(26,21,16,0.10)"
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
  color: active ? accent : t.txM,
  boxShadow: active ? `0 0 0 3px ${accent}08` : "none"
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

// ════════════════════════════════════════════════════════════
// components/ProductImage.jsx
// ════════════════════════════════════════════════════════════
// src/components/ProductImage.jsx
function getImageUrl(p) {
  if (p.image_url) return p.image_url;
  return null;
}
function ProductImage({
  p,
  size = 52,
  style: extraStyle = {},
  eager = false
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
    loading: eager ? "eager" : "lazy",
    onError: () => setErr(true),
    style: {
      maxWidth: "90%",
      maxHeight: "90%",
      objectFit: "contain"
    }
  }));
}

// Saved wines hook
const LISTS = [{
  k: "favoriter",
  l: "Favoriter",
  i: "♥"
}, {
  k: "att-testa",
  l: "Att testa",
  i: "🔖"
}, {
  k: "budget",
  l: "Bra köp",
  i: "💰"
}, {
  k: "middag",
  l: "Middag",
  i: "🍽"
}, {
  k: "helg",
  l: "Helg",
  i: "🥂"
}, {
  k: "fest",
  l: "Fest",
  i: "🎉"
}];

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
        old.forEach(nr => {
          migrated[nr] = ["favoriter"];
        });
        return migrated;
      }
      return {};
    } catch (e) {
      return {};
    }
  });
  const save = next => {
    setData(next);
    try {
      localStorage.setItem("smakfynd_saved_v2", JSON.stringify(next));
    } catch (e) {}
  };
  const toggle = (nr, list = "favoriter", auth) => {
    const next = {
      ...data
    };
    const lists = next[nr] || [];
    if (lists.includes(list)) {
      const filtered = lists.filter(l => l !== list);
      if (filtered.length === 0) delete next[nr];else next[nr] = filtered;
      if (auth) auth.removeFromServer(nr, list);
    } else {
      next[nr] = [...lists, list];
      if (auth) auth.saveToServer(nr, list);
    }
    save(next);
  };
  const isSaved = nr => !!(data[nr] && data[nr].length > 0);
  const isInList = (nr, list) => (data[nr] || []).includes(list);
  const getLists = nr => data[nr] || [];
  const allSaved = Object.keys(data).filter(nr => data[nr] && data[nr].length > 0);
  const inList = list => Object.keys(data).filter(nr => (data[nr] || []).includes(list));
  const count = allSaved.length;
  return {
    data,
    toggle,
    isSaved,
    isInList,
    getLists,
    allSaved,
    inList,
    count
  };
}

// Global saved state (shared between components)
const SavedContext = React.createContext(null);

// ════════════════════════════════════════════════════════════
// components/WineActions.jsx
// ════════════════════════════════════════════════════════════
// src/components/WineActions.jsx — Rating, Alerts, Cellar actions for expanded card

function StarRating({
  nr,
  auth
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [saved, setSaved] = useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: t.txL
    }
  }, "Ditt betyg:"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 2
    }
  }, [1, 2, 3, 4, 5].map(star => /*#__PURE__*/React.createElement("span", {
    key: star,
    onClick: e => {
      e.stopPropagation();
      if (!auth.user) return;
      setRating(star);
      setSaved(true);
      auth.rateWine(nr, star);
      track("rate", {
        nr,
        rating: star
      });
      setTimeout(() => setSaved(false), 2000);
    },
    onMouseEnter: () => setHover(star),
    onMouseLeave: () => setHover(0),
    style: {
      fontSize: 18,
      cursor: auth.user ? "pointer" : "default",
      color: (hover || rating) >= star ? "#d4a84b" : t.bdr,
      transition: "color 0.15s, transform 0.15s",
      transform: hover >= star ? "scale(1.15)" : "scale(1)"
    }
  }, (hover || rating) >= star ? "★" : "☆"))), saved && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: t.green,
      fontWeight: 600
    }
  }, "Sparat!"), !auth.user && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: t.txF
    }
  }, "Logga in f\xF6r att betygs\xE4tta"));
}
function AlertButton({
  nr,
  wine,
  auth
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [alertSet, setAlertSet] = useState(null); // "price_drop" | "price_below" | etc

  if (!auth.user) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      setShowMenu(!showMenu);
    },
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      color: alertSet ? t.wine : t.txM,
      background: alertSet ? `${t.wine}08` : "none",
      border: `1px solid ${alertSet ? t.wine + "30" : t.bdrL}`,
      borderRadius: 8,
      cursor: "pointer",
      padding: "6px 10px",
      fontFamily: "inherit",
      transition: "all 0.2s"
    }
  }, "\uD83D\uDD14 ", alertSet ? "Larm aktivt" : "Fynd-larm"), showMenu && /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: "absolute",
      top: "100%",
      left: 0,
      marginTop: 4,
      zIndex: 10,
      background: t.card,
      borderRadius: 12,
      border: `1px solid ${t.bdr}`,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      padding: 12,
      minWidth: 220
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: t.tx,
      marginBottom: 8
    }
  }, "Bevaka ", wine.name), [["price_drop", "📉 Meddela vid prissänkning", "När priset sjunker"], ["price_below", `💰 Under ${Math.round(wine.price * 0.85)} kr`, `När priset går under ${Math.round(wine.price * 0.85)} kr`], ["back_in_stock", "📦 Tillbaka i sortiment", "När vinet kommer tillbaka"]].map(([type, label, desc]) => /*#__PURE__*/React.createElement("button", {
    key: type,
    onClick: () => {
      auth.setAlert(nr, type, type === "price_below" ? Math.round(wine.price * 0.85) : null);
      setAlertSet(type);
      setShowMenu(false);
      track("alert_set", {
        nr,
        type
      });
    },
    style: {
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: "8px 10px",
      borderRadius: 8,
      border: "none",
      background: alertSet === type ? `${t.green}10` : "transparent",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      color: t.txM,
      transition: "background 0.15s",
      marginBottom: 2
    },
    onMouseEnter: e => e.currentTarget.style.background = t.bg,
    onMouseLeave: e => e.currentTarget.style.background = alertSet === type ? `${t.green}10` : "transparent"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: t.txL
    }
  }, desc)))));
}
function CellarButton({
  nr,
  auth
}) {
  const [status, setStatus] = useState(null); // null | "added" | "tasting"
  const [showTasting, setShowTasting] = useState(false);
  const [notes, setNotes] = useState("");
  const [occasion, setOccasion] = useState("");
  const [personalRating, setPersonalRating] = useState(0);
  if (!auth.user) return null;
  if (showTasting) {
    return /*#__PURE__*/React.createElement("div", {
      onClick: e => e.stopPropagation(),
      style: {
        padding: 14,
        borderRadius: 12,
        background: t.bg,
        border: `1px solid ${t.bdrL}`,
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 600,
        color: t.tx,
        marginBottom: 8
      }
    }, "\uD83D\uDCDD Provningsanteckning"), /*#__PURE__*/React.createElement("input", {
      type: "text",
      value: occasion,
      onChange: e => setOccasion(e.target.value),
      placeholder: "Tillf\xE4lle (t.ex. fredagsmiddag, dejt)",
      style: {
        width: "100%",
        padding: "8px 12px",
        borderRadius: 8,
        border: `1px solid ${t.bdr}`,
        background: t.card,
        fontSize: 12,
        color: t.tx,
        outline: "none",
        boxSizing: "border-box",
        marginBottom: 6
      }
    }), /*#__PURE__*/React.createElement("textarea", {
      value: notes,
      onChange: e => setNotes(e.target.value),
      placeholder: "Dina tankar om vinet...",
      rows: 2,
      style: {
        width: "100%",
        padding: "8px 12px",
        borderRadius: 8,
        border: `1px solid ${t.bdr}`,
        background: t.card,
        fontSize: 12,
        color: t.tx,
        outline: "none",
        boxSizing: "border-box",
        resize: "vertical",
        fontFamily: "inherit",
        marginBottom: 6
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: t.txL
      }
    }, "Betyg:"), [1, 2, 3, 4, 5].map(s => /*#__PURE__*/React.createElement("span", {
      key: s,
      onClick: () => setPersonalRating(s),
      style: {
        fontSize: 16,
        cursor: "pointer",
        color: personalRating >= s ? "#d4a84b" : t.bdr
      }
    }, personalRating >= s ? "★" : "☆"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        auth.addToCellar(nr, "taste", {
          notes,
          occasion,
          rating: personalRating || null
        });
        setStatus("tasted");
        setShowTasting(false);
        track("cellar_taste", {
          nr
        });
      },
      style: {
        padding: "8px 16px",
        borderRadius: 8,
        border: "none",
        background: t.wine,
        color: "#fff",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, "Spara"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setShowTasting(false),
      style: {
        padding: "8px 16px",
        borderRadius: 8,
        border: `1px solid ${t.bdr}`,
        background: t.card,
        color: t.txM,
        fontSize: 12,
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, "Avbryt")));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, status !== "added" && /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      auth.addToCellar(nr, "add");
      setStatus("added");
      track("cellar_add", {
        nr
      });
    },
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      color: t.txM,
      background: "none",
      border: `1px solid ${t.bdrL}`,
      borderRadius: 8,
      cursor: "pointer",
      padding: "6px 10px",
      fontFamily: "inherit"
    }
  }, "\uD83C\uDF7E L\xE4gg i k\xE4llaren"), status === "added" && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: t.green,
      padding: "6px 10px"
    }
  }, "\u2713 I k\xE4llaren"), /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      setShowTasting(true);
    },
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      color: t.txM,
      background: "none",
      border: `1px solid ${t.bdrL}`,
      borderRadius: 8,
      cursor: "pointer",
      padding: "6px 10px",
      fontFamily: "inherit"
    }
  }, "\uD83D\uDCDD Har provats"));
}

// ════════════════════════════════════════════════════════════
// components/Card.jsx
// ════════════════════════════════════════════════════════════
// src/components/Card.jsx
function Card({
  p,
  rank,
  delay,
  totalInCategory,
  allProducts,
  autoOpen,
  auth
}) {
  const [open, setOpen] = useState(!!autoOpen);
  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) track("click", {
      nr: p.nr,
      name: p.name,
      score: p.smakfynd_score,
      rank
    });
  };
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
    role: "button",
    tabIndex: 0,
    "aria-expanded": open,
    "aria-label": `${p.name} ${p.sub || ''} — ${s100} poäng, ${p.price} kr`,
    onClick: handleOpen,
    onKeyDown: e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleOpen();
      }
    },
    style: {
      background: t.card,
      borderRadius: 14,
      outline: "none",
      border: `1px solid ${open ? t.bdr : t.bdrL}`,
      boxShadow: open ? t.sh3 : t.sh1,
      transition: "all 0.25s ease",
      overflow: "hidden",
      animation: `slideUp 0.35s ease ${delay}s both`,
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
    size: 52,
    eager: rank <= 3
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
  }, "kr")), p.vol && p.price && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: t.txM,
      background: t.bg,
      padding: "1px 6px",
      borderRadius: 4
    }
  }, Math.round(p.price / (p.vol / 1000)), " kr/l"), p.launch_price && p.price_vs_launch_pct > 0 && /*#__PURE__*/React.createElement("span", {
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
      display: "flex",
      gap: 4,
      flexWrap: "wrap",
      marginTop: 5
    }
  }, p.expert_score >= 7.5 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      padding: "2px 7px",
      borderRadius: 100,
      background: "#b07d3b10",
      color: "#b07d3b"
    }
  }, "Expertbetyg"), p.price_score >= 8 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      padding: "2px 7px",
      borderRadius: 100,
      background: t.greenL,
      color: t.green
    }
  }, "Prisv\xE4rt"), (p.crowd_reviews || 0) >= 5000 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      padding: "2px 7px",
      borderRadius: 100,
      background: "#6b8cce10",
      color: "#6b8cce"
    }
  }, "Popul\xE4rt"), p.organic && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      padding: "2px 7px",
      borderRadius: 100,
      background: "#2d7a3e10",
      color: "#2d7a3e"
    }
  }, "Eko"), p.price_vs_launch_pct > 5 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      padding: "2px 7px",
      borderRadius: 100,
      background: t.dealL,
      color: t.deal
    }
  }, "Priss\xE4nkt"), p.critics && p.critics.length >= 3 && p.critics.every(cr => cr.s >= 85) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      padding: "2px 7px",
      borderRadius: 100,
      background: "#b07d3b10",
      color: "#b07d3b"
    }
  }, p.critics.length, " av ", p.num_critics || p.critics.length, " kritiker ger 85+"), p.critic_consensus === "stark konsensus" && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      padding: "2px 7px",
      borderRadius: 100,
      background: "#b07d3b10",
      color: "#b07d3b"
    }
  }, "Stark konsensus"), p.critic_consensus === "kontroversiellt" && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      padding: "2px 7px",
      borderRadius: 100,
      background: "#ce6b6b10",
      color: "#ce6b6b"
    }
  }, "Delade meningar")), (() => {
    const chips = [];
    if (p.food_pairings?.some(f => /lamm|grillat|kött/i.test(f)) && p.taste_body >= 7) chips.push("Fynd till grillat");else if (p.food_pairings?.some(f => /fisk|skaldjur/i.test(f)) && p.category === "Vitt") chips.push("Perfekt till fisk");
    if (p.price <= 100 && p.smakfynd_score >= 70) chips.push("Tryggt vardagsvin");
    if (p.crowd_reviews >= 10000 && p.crowd_score >= 7.5) chips.push("Tryggt middagsvin");
    if (p.price >= 200 && p.expert_score >= 8) chips.push("Imponera på middagen");
    return chips.length > 0 ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 4,
        flexWrap: "wrap",
        marginTop: 3
      }
    }, chips.slice(0, 2).map(c => /*#__PURE__*/React.createElement("span", {
      key: c,
      style: {
        fontSize: 9,
        padding: "2px 7px",
        borderRadius: 100,
        background: `${t.wine}08`,
        color: t.wine,
        fontWeight: 500
      }
    }, c))) : null;
  })(), p.insight && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 5,
      fontSize: 11,
      color: t.wine,
      lineHeight: 1.4,
      fontWeight: 500
    }
  }, p.insight), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: p.insight ? 2 : 5,
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
    onClick: e => {
      e.stopPropagation();
      track("sb_click", {
        nr: p.nr,
        name: p.name,
        price: p.price
      });
    },
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      color: t.txM,
      textDecoration: "none",
      transition: "color 0.2s",
      minHeight: 44,
      padding: "8px 4px"
    },
    onMouseEnter: e => e.currentTarget.style.color = t.wine,
    onMouseLeave: e => e.currentTarget.style.color = t.txM,
    "aria-label": `Köp ${p.name} på Systembolaget (öppnas i nytt fönster)`
  }, "Systembolaget ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9
    },
    "aria-hidden": "true"
  }, "\u2197")), sv && /*#__PURE__*/React.createElement(SaveButton, {
    nr: p.nr || p.id,
    sv: sv,
    auth: auth
  }), /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      track("share", {
        nr: p.nr,
        name: p.name
      });
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
        const btn = e.currentTarget;
        const orig = btn.textContent;
        btn.textContent = "✓ Kopierad!";
        btn.style.color = t.green;
        setTimeout(() => {
          btn.innerHTML = '<span style="font-size:13px;line-height:1">↗</span> Dela';
          btn.style.color = t.txL;
        }, 2000);
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
      padding: "8px 4px",
      fontFamily: "inherit",
      minHeight: 44
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
    size: 56,
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
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      fontSize: 11,
      color: t.txM,
      marginBottom: 6
    }
  }, [p.grape, p.alc ? `${p.alc}%` : null, `${p.vol} ml`, `${p.country}${p.region ? `, ${p.region}` : ""}`].filter(Boolean).map((v, i, arr) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, v, i < arr.length - 1 ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: t.bdr,
      margin: "0 2px"
    }
  }, "\xB7") : ""))), p.food_pairings?.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      flexWrap: "wrap"
    }
  }, p.food_pairings.map((f, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      fontSize: 10,
      padding: "2px 7px",
      borderRadius: 100,
      background: t.bg,
      color: t.txM,
      border: `1px solid ${t.bdrL}`
    }
  }, f))))), (p.taste_body || p.taste_fruit || p.taste_sweet != null) && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14,
      padding: "12px 14px",
      borderRadius: 10,
      background: t.bg
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      color: t.txL,
      textTransform: "uppercase",
      letterSpacing: "0.1em"
    }
  }, "Smakprofil"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: t.txM,
      fontStyle: "italic"
    }
  }, (() => {
    const words = [];
    if (p.taste_body >= 9) words.push("fylligt");else if (p.taste_body >= 6) words.push("medelkroppad");else if (p.taste_body && p.taste_body <= 4) words.push("lätt");
    if (p.taste_fruit >= 9) words.push("fruktigt");else if (p.taste_fruit && p.taste_fruit <= 3) words.push("stramt");
    if (p.taste_sweet != null && p.taste_sweet <= 2) words.push("torrt");else if (p.taste_sweet >= 8) words.push("sött");
    return words.length > 0 ? words.join(", ") : null;
  })())), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
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
  })), p.critics && p.critics.length > 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      flexWrap: "wrap",
      marginTop: 4
    }
  }, p.critics.map((cr, ci) => /*#__PURE__*/React.createElement("span", {
    key: ci,
    style: {
      fontSize: 9,
      padding: "2px 6px",
      borderRadius: 4,
      background: "#b07d3b10",
      color: "#b07d3b"
    }
  }, cr.c, ": ", cr.s)), p.num_critics > (p.critics || []).length && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      padding: "2px 6px",
      color: t.txL
    }
  }, "+", p.num_critics - p.critics.length, " till"), p.critic_spread != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      padding: "2px 6px",
      color: p.critic_spread <= 4 ? t.green : p.critic_spread >= 12 ? "#ce6b6b" : t.txL
    }
  }, "Spridning: ", p.critic_spread, "p")) : /*#__PURE__*/React.createElement("div", {
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
    // Taste similarity: how close are body, fruit, sweet profiles?
    const tasteSim = (a, b) => {
      let score = 0,
        count = 0;
      if (a.taste_body && b.taste_body) {
        score += 1 - Math.abs(a.taste_body - b.taste_body) / 12;
        count++;
      }
      if (a.taste_fruit && b.taste_fruit) {
        score += 1 - Math.abs(a.taste_fruit - b.taste_fruit) / 12;
        count++;
      }
      if (a.taste_sweet != null && b.taste_sweet != null) {
        score += 1 - Math.abs(a.taste_sweet - b.taste_sweet) / 12;
        count++;
      }
      return count > 0 ? score / count : 0;
    };
    const similar = allProducts.filter(w => w.category === p.category && w.package === p.package && w.assortment === "Fast sortiment" && (w.nr || w.id) !== (p.nr || p.id)).map(w => {
      // Calculate similarity score
      let sim = 0;
      const taste = tasteSim(w, p);
      sim += taste * 40; // taste profile most important (0-40)
      if (w.grape && p.grape && w.grape.toLowerCase() === p.grape.toLowerCase()) sim += 20; // same grape
      if (w.cat3 && p.cat3 && w.cat3 === p.cat3) sim += 15; // same style (e.g. "Fruktigt & Smakrikt")
      if (w.country && p.country && w.country === p.country) sim += 5; // same country
      if (w.region && p.region && w.region === p.region) sim += 10; // same region
      if (Math.abs(w.price - p.price) <= 30) sim += 5; // similar price
      // Score matters: bonus for better, penalty for worse
      sim += (w.smakfynd_score - p.smakfynd_score) * 2;
      return {
        ...w,
        _sim: sim,
        _taste: taste
      };
    }).filter(w => w._sim >= 20) // minimum similarity threshold
    .sort((a, b) => b._sim - a._sim).slice(0, 3).map(w => {
      // Generate reason WHY this is recommended
      const reasons = [];
      if (w._taste >= 0.8) reasons.push("Liknande smakprofil");
      if (w.grape && p.grape && w.grape.toLowerCase() === p.grape.toLowerCase()) reasons.push("Samma druva");
      if (w.cat3 && p.cat3 && w.cat3 === p.cat3 && !reasons.length) reasons.push("Samma stil");
      if (w.region && p.region && w.region === p.region) reasons.push("Samma region");
      if (w.price < p.price - 10) reasons.push(`${Math.round(p.price - w.price)}kr billigare`);
      if (w.smakfynd_score > p.smakfynd_score + 2) reasons.push("Bättre värde per krona");else if (w.smakfynd_score > p.smakfynd_score) reasons.push("Högre poäng");
      if ((w.expert_score || 0) > (p.expert_score || 0) + 0.5) reasons.push("Starkare expertstöd");
      return {
        ...w,
        _reason: reasons.slice(0, 2).join(" · ") || "Liknande stil och prisklass"
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
    }, similar.map((w, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      onClick: e => {
        e.stopPropagation();
        window.location.hash = `vin/${w.nr}`;
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      },
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 10,
        background: t.bg,
        border: `1px solid ${t.bdrL}`,
        textDecoration: "none",
        transition: "border-color 0.2s",
        cursor: "pointer"
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
        flexShrink: 0,
        textAlign: "right",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 3
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        color: t.tx,
        fontFamily: "'Instrument Serif', serif"
      }
    }, w.price, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        fontWeight: 400,
        color: t.txL
      }
    }, "kr")), /*#__PURE__*/React.createElement("a", {
      href: `https://www.systembolaget.se/produkt/vin/${w.nr}`,
      target: "_blank",
      rel: "noopener noreferrer",
      onClick: e => e.stopPropagation(),
      style: {
        fontSize: 9,
        color: t.txL,
        textDecoration: "none"
      }
    }, "SB \u2197"))))));
  })(), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      paddingTop: 12,
      borderTop: `1px solid ${t.bdrL}`
    }
  }, /*#__PURE__*/React.createElement(StarRating, {
    nr: p.nr,
    auth: auth
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(AlertButton, {
    nr: p.nr,
    wine: p,
    auth: auth
  }), /*#__PURE__*/React.createElement(CellarButton, {
    nr: p.nr,
    auth: auth
  })))));
}

// ════════════════════════════════════════════════════════════
// components/SaveButton.jsx
// ════════════════════════════════════════════════════════════
// src/components/SaveButton.jsx
function SaveButton({
  nr,
  sv,
  auth
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const saved = sv.isSaved(nr);
  const lists = sv.getLists(nr);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "inline-block"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      if (saved) {
        setMenuOpen(!menuOpen);
      } else {
        sv.toggle(nr, "favoriter", auth);
        track("save", {
          nr,
          list: "favoriter"
        });
      }
    },
    onContextMenu: e => {
      e.preventDefault();
      e.stopPropagation();
      setMenuOpen(!menuOpen);
    },
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 12,
      color: saved ? t.wine : t.txL,
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
  }, saved ? "♥" : "♡"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: saved ? 600 : 400
    }
  }, saved ? lists.length === 1 ? LISTS.find(l => l.k === lists[0])?.l || "Sparad" : `${lists.length} listor` : "Spara")), menuOpen && /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: "absolute",
      bottom: "100%",
      left: 0,
      marginBottom: 6,
      background: t.card,
      border: `1px solid ${t.bdr}`,
      borderRadius: 12,
      boxShadow: "0 8px 24px rgba(30,23,16,0.12)",
      padding: "6px 0",
      zIndex: 100,
      minWidth: 160
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "6px 14px 4px",
      fontSize: 10,
      color: t.txL,
      textTransform: "uppercase",
      letterSpacing: "0.08em"
    }
  }, "Spara till"), LISTS.map(list => /*#__PURE__*/React.createElement("button", {
    key: list.k,
    onClick: e => {
      e.stopPropagation();
      sv.toggle(nr, list.k, auth);
    },
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      width: "100%",
      padding: "8px 14px",
      border: "none",
      background: sv.isInList(nr, list.k) ? t.wineL : "transparent",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      color: sv.isInList(nr, list.k) ? t.wine : t.txM,
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      width: 20,
      textAlign: "center"
    }
  }, list.i), /*#__PURE__*/React.createElement("span", null, list.l), sv.isInList(nr, list.k) && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 12
    }
  }, "\u2713"))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: `1px solid ${t.bdrL}`,
      margin: "4px 0"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      setMenuOpen(false);
    },
    style: {
      width: "100%",
      padding: "6px 14px",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 11,
      color: t.txL,
      textAlign: "center"
    }
  }, "St\xE4ng")));
}

// ════════════════════════════════════════════════════════════
// components/AIQuestion.jsx
// ════════════════════════════════════════════════════════════
// src/components/AIQuestion.jsx
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

// ════════════════════════════════════════════════════════════
// components/LoginModal.jsx
// ════════════════════════════════════════════════════════════
// src/components/LoginModal.jsx
const AUTH_URL = "https://smakfynd-auth.smakfynd.workers.dev";
function LoginModal({
  onClose,
  onLogin
}) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1); // 1=email, 2=code
  const [newsletter, setNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const handleSendCode = async () => {
    if (!email.includes("@")) {
      setError("Ange en giltig email");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(AUTH_URL + "/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          newsletter
        })
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
    if (code.length < 6) {
      setError("Ange 6-siffrig kod");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(AUTH_URL + "/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          code,
          newsletter
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      try {
        localStorage.setItem("sf_token", data.token);
        localStorage.setItem("sf_user", JSON.stringify(data.user));
      } catch (e) {}
      onLogin(data);
    } catch (e) {
      setError(e.message || "Felaktig kod");
    }
    setLoading(false);
  };
  useEffect(() => {
    const handleEsc = e => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);
  return /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Logga in",
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(30,23,16,0.5)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: t.card,
      borderRadius: 20,
      padding: "32px 28px",
      maxWidth: 380,
      width: "100%",
      boxShadow: "0 20px 60px rgba(30,23,16,0.2)",
      animation: "scaleIn 0.2s ease"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "0 0 6px",
      fontSize: 22,
      fontFamily: "'Instrument Serif', serif",
      fontWeight: 400,
      color: t.tx
    }
  }, step === 1 ? "Logga in" : "Ange kod"), step === 1 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 16px",
      fontSize: 13,
      color: t.txL,
      lineHeight: 1.5
    }
  }, "Vi skickar en verifieringskod till din email. Inget l\xF6senord beh\xF6vs."), /*#__PURE__*/React.createElement("input", {
    type: "email",
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: "din@email.se",
    onKeyDown: e => e.key === "Enter" && handleSendCode(),
    style: {
      width: "100%",
      padding: "14px 16px",
      borderRadius: 12,
      border: `1px solid ${t.bdr}`,
      background: t.bg,
      fontSize: 14,
      color: t.tx,
      outline: "none",
      boxSizing: "border-box",
      marginBottom: 12
    }
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "flex-start",
      marginBottom: 12,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: newsletter,
    onChange: e => setNewsletter(e.target.checked),
    style: {
      marginTop: 3,
      accentColor: t.wine
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: t.txM,
      lineHeight: 1.5
    }
  }, "Ja, jag vill f\xE5 veckans b\xE4sta vink\xF6p via email")), /*#__PURE__*/React.createElement("button", {
    onClick: handleSendCode,
    disabled: loading,
    style: {
      width: "100%",
      padding: "14px",
      borderRadius: 12,
      border: "none",
      background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`,
      color: "#fff",
      fontSize: 14,
      fontWeight: 600,
      cursor: loading ? "wait" : "pointer",
      fontFamily: "inherit",
      opacity: loading ? 0.7 : 1
    }
  }, loading ? "Skickar..." : "Skicka verifieringskod")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 16px",
      fontSize: 13,
      color: t.txL,
      lineHeight: 1.5
    }
  }, "Vi har skickat en 6-siffrig kod till ", /*#__PURE__*/React.createElement("strong", null, email)), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: code,
    onChange: e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6)),
    placeholder: "123456",
    inputMode: "numeric",
    autoFocus: true,
    onKeyDown: e => e.key === "Enter" && handleVerify(),
    style: {
      width: "100%",
      padding: "14px 16px",
      borderRadius: 12,
      border: `1px solid ${t.bdr}`,
      background: t.bg,
      fontSize: 24,
      color: t.tx,
      outline: "none",
      boxSizing: "border-box",
      marginBottom: 12,
      textAlign: "center",
      letterSpacing: "0.3em",
      fontFamily: "monospace"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: handleVerify,
    disabled: loading || code.length < 6,
    style: {
      width: "100%",
      padding: "14px",
      borderRadius: 12,
      border: "none",
      background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`,
      color: "#fff",
      fontSize: 14,
      fontWeight: 600,
      cursor: loading ? "wait" : "pointer",
      fontFamily: "inherit",
      opacity: loading || code.length < 6 ? 0.7 : 1
    }
  }, loading ? "Verifierar..." : "Logga in"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setStep(1);
      setCode("");
      setError(null);
    },
    style: {
      display: "block",
      margin: "10px auto 0",
      fontSize: 12,
      color: t.txL,
      background: "none",
      border: "none",
      cursor: "pointer"
    }
  }, "Byt email")), error && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: t.deal,
      margin: "10px 0 0"
    }
  }, error), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 10,
      color: t.txF,
      margin: "12px 0 0",
      textAlign: "center",
      lineHeight: 1.5
    }
  }, "Genom att logga in godk\xE4nner du v\xE5r ", /*#__PURE__*/React.createElement("a", {
    href: "/integritet/",
    target: "_blank",
    style: {
      color: t.txL
    }
  }, "integritetspolicy"), "."), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      display: "block",
      margin: "12px auto 0",
      fontSize: 12,
      color: t.txL,
      background: "none",
      border: "none",
      cursor: "pointer",
      textDecoration: "underline"
    }
  }, "Avbryt")));
}
function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sf_user"));
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("sf_token");
    } catch (e) {
      return null;
    }
  });
  const login = data => {
    setUser(data.user);
    setToken(data.token);
  };
  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem("sf_token");
      localStorage.removeItem("sf_user");
    } catch (e) {}
  };
  const syncWines = async localWines => {
    if (!token) return localWines;
    try {
      const res = await fetch(AUTH_URL + "/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          wines: localWines
        })
      });
      const data = await res.json();
      if (data.wines) return data.wines;
    } catch (e) {}
    return localWines;
  };
  const saveToServer = (nr, list) => {
    if (!token) return;
    fetch(AUTH_URL + "/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token,
        nr,
        list
      }),
      keepalive: true
    }).catch(() => {});
  };
  const removeFromServer = (nr, list) => {
    if (!token) return;
    fetch(AUTH_URL + "/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token,
        nr,
        list
      }),
      keepalive: true
    }).catch(() => {});
  };

  // Premium features
  const rateWine = (nr, rating, notes) => {
    if (!token) return;
    fetch(AUTH_URL + "/rate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token,
        nr,
        rating,
        notes
      }),
      keepalive: true
    }).catch(() => {});
  };
  const setAlert = (nr, alertType, threshold) => {
    if (!token) return;
    return fetch(AUTH_URL + "/alert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token,
        nr,
        alert_type: alertType,
        threshold
      })
    }).then(r => r.json()).catch(() => ({}));
  };
  const removeAlert = (nr, alertType) => {
    if (!token) return;
    fetch(AUTH_URL + "/remove-alert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token,
        nr,
        alert_type: alertType
      }),
      keepalive: true
    }).catch(() => {});
  };
  const addToCellar = (nr, action, data) => {
    if (!token) return;
    return fetch(AUTH_URL + "/cellar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token,
        nr,
        action,
        ...data
      })
    }).then(r => r.json()).catch(() => ({}));
  };
  const getRatings = async () => {
    if (!token) return [];
    try {
      const res = await fetch(AUTH_URL + "/ratings?token=" + token);
      const data = await res.json();
      return data.ratings || [];
    } catch (e) {
      return [];
    }
  };
  const getAlerts = async () => {
    if (!token) return [];
    try {
      const res = await fetch(AUTH_URL + "/alerts?token=" + token);
      const data = await res.json();
      return data.alerts || [];
    } catch (e) {
      return [];
    }
  };
  const getCellar = async () => {
    if (!token) return [];
    try {
      const res = await fetch(AUTH_URL + "/cellar?token=" + token);
      const data = await res.json();
      return data.cellar || [];
    } catch (e) {
      return [];
    }
  };
  return {
    user,
    token,
    login,
    logout,
    syncWines,
    saveToServer,
    removeFromServer,
    rateWine,
    setAlert,
    removeAlert,
    addToCellar,
    getRatings,
    getAlerts,
    getCellar
  };
}

// ════════════════════════════════════════════════════════════
// components/TrustBox.jsx
// ════════════════════════════════════════════════════════════
// src/components/TrustBox.jsx
function TrustBox() {
  const isMobile = window.innerWidth < 768;
  const [open, setOpen] = useState(!isMobile);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: open ? "14px 20px" : "10px 16px",
      borderRadius: 14,
      border: `1px solid ${t.bdr}`,
      background: t.card,
      marginBottom: 20,
      textAlign: "left",
      cursor: isMobile ? "pointer" : "default"
    },
    onClick: () => isMobile && setOpen(!open)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: t.tx
    }
  }, "S\xE5 funkar Smakfynd"), !open && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: t.txL,
      marginLeft: 6
    }
  }, "\u2014 baserat p\xE5 data, inte magk\xE4nsla")), isMobile && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: t.txL
    }
  }, open ? "▲" : "▼")), open && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: t.txM,
      marginBottom: 8,
      lineHeight: 1.4
    }
  }, "B\xE4sta k\xF6p i varje stil och prisklass."), /*#__PURE__*/React.createElement("div", {
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
  }, text))))));
}

// ════════════════════════════════════════════════════════════
// components/WeeklyPick.jsx
// ════════════════════════════════════════════════════════════
// src/components/WeeklyPick.jsx
function WeeklyPick({
  products
}) {
  const pick = useMemo(() => {
    const candidates = products.filter(p => p.assortment === "Fast sortiment" && p.package === "Flaska" && p.price && p.price <= 150 && p.smakfynd_score >= 75).sort((a, b) => {
      const aBonus = a.crowd_score && a.expert_score ? 5 : 0;
      const bBonus = b.crowd_score && b.expert_score ? 5 : 0;
      return b.smakfynd_score + bBonus - (a.smakfynd_score + aBonus);
    });
    return candidates[0] || null;
  }, [products]);
  if (!pick) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: t.wine,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      marginBottom: 8
    }
  }, "Veckans fynd"), /*#__PURE__*/React.createElement(Card, {
    p: pick,
    rank: 1,
    delay: 0,
    allProducts: products
  }));
}

// ════════════════════════════════════════════════════════════
// components/QuickFilters.jsx
// ════════════════════════════════════════════════════════════
// src/components/QuickFilters.jsx
function QuickFilters({
  onFilter
}) {
  const presets = [{
    label: "Topp under 100 kr",
    icon: "💰",
    action: {
      cat: "all",
      price: "0-99",
      showBest: false
    }
  }, {
    label: "Bästa röda just nu",
    icon: "🍷",
    action: {
      cat: "Rött",
      price: "all",
      showBest: false
    }
  }, {
    label: "Expertfavoriter",
    icon: "🏆",
    action: {
      cat: "all",
      price: "all",
      showBest: true
    }
  }, {
    label: "Ekologiskt & prisvärt",
    icon: "🌿",
    action: {
      cat: "all",
      price: "all",
      showEco: true
    }
  }, {
    label: "Bubbel till fest",
    icon: "🍾",
    action: {
      cat: "Mousserande",
      price: "all",
      showBest: false
    }
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      color: t.txL,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      marginBottom: 6
    }
  }, "Snabbval"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      overflowX: "auto",
      paddingBottom: 4
    }
  }, presets.map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => {
      onFilter(p.action);
      track("filter", {
        type: "quickfilter",
        value: p.label
      });
    },
    style: {
      padding: "8px 14px",
      borderRadius: 10,
      border: `1px solid ${t.bdr}`,
      background: t.card,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      color: t.txM,
      whiteSpace: "nowrap",
      display: "flex",
      alignItems: "center",
      gap: 5,
      transition: "all 0.2s",
      boxShadow: "0 1px 3px rgba(30,23,16,0.04)"
    },
    onMouseEnter: e => {
      e.currentTarget.style.borderColor = t.wine + "40";
      e.currentTarget.style.color = t.wine;
      e.currentTarget.style.boxShadow = "0 2px 8px rgba(30,23,16,0.08)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.borderColor = t.bdr;
      e.currentTarget.style.color = t.txM;
      e.currentTarget.style.boxShadow = "0 1px 3px rgba(30,23,16,0.04)";
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14
    }
  }, p.icon), p.label))));
}

// ════════════════════════════════════════════════════════════
// components/EditorsPicks.jsx
// ════════════════════════════════════════════════════════════
// src/components/EditorsPicks.jsx
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
      onClick: () => mp && onSelect(mp.nr || pick.nr)
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

// ════════════════════════════════════════════════════════════
// components/FoodMatch.jsx
// ════════════════════════════════════════════════════════════
// src/components/FoodMatch.jsx
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
    const t0 = Date.now();
    try {
      let data;
      for (let attempt = 0; attempt < 2; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(WINE_AI_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            meal: userMessage,
            context: existingContext || []
          }),
          signal: controller.signal
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
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "sf-meal",
    style: {
      position: "absolute",
      width: 1,
      height: 1,
      overflow: "hidden",
      clip: "rect(0,0,0,0)"
    }
  }, "Beskriv din m\xE5ltid"), /*#__PURE__*/React.createElement("input", {
    id: "sf-meal",
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
  }, [["Under 100 kr", "0-100"], ["100–200 kr", "100-200"], ["200+ kr", "200-999"]].map(([l, k]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => {
      const cur = meal.replace(/\s*\(budget:.*?\)\s*/g, "").trim();
      setMeal(cur ? `${cur} (budget: ${k} kr)` : "");
    },
    style: {
      padding: "5px 10px",
      borderRadius: 100,
      border: `1px solid ${t.green}40`,
      background: `${t.green}08`,
      color: t.green,
      fontSize: 11,
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 600
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      flexWrap: "wrap",
      marginTop: 5
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
  }, "Hittade inga matchningar. Prova en annan beskrivning."), courseResults.length > 0 && courseResults.some(c => c.wines.length > 0) && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const lines = courseResults.flatMap(c => {
        const header = courseResults.length > 1 ? [`\n${c.dish}:`] : [];
        return [...header, ...c.wines.filter(m => m.nr).map(m => {
          const p = products.find(pr => String(pr.nr) === String(m.nr));
          return p ? `  ${p.name} ${p.sub || ""} — ${p.price}kr (${p.smakfynd_score}/100)` : null;
        }).filter(Boolean)];
      });
      const text = `Vinlista till ${meal}:\n${lines.join("\n")}\n\nSmakfynd.se`;
      if (navigator.share) {
        navigator.share({
          title: `Vinlista till ${meal}`,
          text
        }).catch(() => {});
      } else {
        navigator.clipboard?.writeText(text);
      }
      track("share", {
        type: "ai_list",
        meal
      });
    },
    style: {
      marginTop: 10,
      display: "flex",
      alignItems: "center",
      gap: 5,
      padding: "8px 14px",
      borderRadius: 10,
      border: `1px solid ${t.bdr}`,
      background: t.card,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      color: t.txM
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14
    }
  }, "\u2197"), " Dela vinlista"))));
}

// ════════════════════════════════════════════════════════════
// components/NewsletterCTA.jsx
// ════════════════════════════════════════════════════════════
// src/components/NewsletterCTA.jsx
function NewsletterCTA({
  compact = false
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // null | "loading" | "done" | "error"

  const handleSubmit = async () => {
    if (!email.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch("https://smakfynd-auth.smakfynd.workers.dev/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim()
        })
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("done");
        track("subscribe", {
          source: compact ? "inline" : "section"
        });
      } else {
        setStatus("error");
      }
    } catch (e) {
      setStatus("error");
    }
  };
  if (status === "done") {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: compact ? "12px 16px" : "20px 22px",
        borderRadius: 14,
        background: `${t.green}08`,
        border: `1px solid ${t.green}20`,
        textAlign: "center",
        margin: compact ? "8px 0" : "20px 0"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 20,
        marginBottom: 4
      }
    }, "\u2713"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        color: t.green
      }
    }, "Tack!"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: t.txM
      }
    }, "Du f\xE5r veckans b\xE4sta fynd i din inbox."));
  }
  if (compact) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        padding: "14px 16px",
        borderRadius: 14,
        background: t.surface,
        border: `1px solid ${t.bdr}`,
        margin: "8px 0",
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 600,
        color: t.tx
      }
    }, "\uD83D\uDCEC Veckans b\xE4sta vink\xF6p i din inbox"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "email",
      value: email,
      onChange: e => setEmail(e.target.value),
      placeholder: "din@email.se",
      onKeyDown: e => e.key === "Enter" && handleSubmit(),
      style: {
        flex: 1,
        padding: "8px 12px",
        borderRadius: 8,
        border: `1px solid ${t.bdr}`,
        background: t.card,
        fontSize: 13,
        color: t.tx,
        outline: "none",
        boxSizing: "border-box",
        minWidth: 0
      }
    }), /*#__PURE__*/React.createElement("button", {
      onClick: handleSubmit,
      disabled: status === "loading",
      style: {
        padding: "8px 14px",
        borderRadius: 8,
        border: "none",
        background: t.wine,
        color: "#fff",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        flexShrink: 0,
        opacity: status === "loading" ? 0.6 : 1
      }
    }, status === "loading" ? "..." : "Prenumerera")), status === "error" && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: t.deal,
        marginTop: 4
      }
    }, "N\xE5got gick fel, f\xF6rs\xF6k igen.")));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "24px 22px",
      borderRadius: 16,
      margin: "24px 0",
      background: `linear-gradient(145deg, ${t.wine}06, ${t.wine}03)`,
      border: `1px solid ${t.wine}15`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontFamily: "'Instrument Serif', Georgia, serif",
      color: t.tx,
      marginBottom: 4
    }
  }, "\uD83D\uDCEC Missa inte veckans vink\xF6p"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: t.txM,
      margin: "0 0 12px",
      lineHeight: 1.5
    }
  }, "Varje vecka skickar vi de b\xE4sta fynden \u2014 priss\xE4nkta viner, nya topprankade och Gabriels personliga val. Gratis, ingen spam."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "email",
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: "din@email.se",
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
      boxSizing: "border-box"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: handleSubmit,
    disabled: status === "loading",
    style: {
      padding: "12px 20px",
      borderRadius: 12,
      border: "none",
      background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`,
      color: "#fff",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit",
      flexShrink: 0,
      opacity: status === "loading" ? 0.6 : 1
    }
  }, status === "loading" ? "Skickar..." : "Prenumerera")), status === "error" && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: t.deal,
      marginTop: 6
    }
  }, "N\xE5got gick fel, f\xF6rs\xF6k igen."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 10,
      color: t.txF,
      margin: "8px 0 0"
    }
  }, "Vi skickar max 1 mail/vecka. Avsluta n\xE4r du vill."));
}

// ════════════════════════════════════════════════════════════
// components/WineOfDay.jsx
// ════════════════════════════════════════════════════════════
// src/components/WineOfDay.jsx
function WineOfDay({
  products,
  onSelect
}) {
  const pick = useMemo(() => {
    if (!products || products.length < 50) return null;
    const today = new Date().toISOString().slice(0, 10);
    const hash = [...today].reduce((h, c) => h * 31 + c.charCodeAt(0) | 0, 0);
    const top = products.filter(p => p.assortment === "Fast sortiment" && p.package === "Flaska" && p.smakfynd_score >= 72 && p.price <= 200).sort((a, b) => b.smakfynd_score - a.smakfynd_score).slice(0, 80);
    return top.length > 0 ? top[Math.abs(hash) % top.length] : null;
  }, [products]);
  if (!pick) return null;
  const [_label, col] = getScoreInfo(pick.smakfynd_score);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14,
      padding: "14px 16px",
      borderRadius: 14,
      background: `linear-gradient(135deg, ${t.wine}06, ${t.wine}03)`,
      border: `1px solid ${t.wine}12`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14
    },
    "aria-hidden": "true"
  }, "\u2726"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: t.wine,
      textTransform: "uppercase",
      letterSpacing: "0.08em"
    }
  }, "Dagens vin"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: t.txF,
      marginLeft: "auto"
    }
  }, new Date().toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short"
  }))), /*#__PURE__*/React.createElement("div", {
    role: "button",
    tabIndex: 0,
    onClick: () => onSelect && onSelect(pick.nr),
    onKeyDown: e => {
      if (e.key === "Enter") onSelect && onSelect(pick.nr);
    },
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(ProductImage, {
    p: pick,
    size: 48,
    eager: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontFamily: "'Instrument Serif', Georgia, serif",
      color: t.tx,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, pick.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: t.txL
    }
  }, pick.sub, " \xB7 ", pick.country, " \xB7 ", pick.grape)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 12,
      background: `${col}15`,
      border: `2px solid ${col}30`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      fontWeight: 900,
      color: col,
      lineHeight: 1,
      fontFamily: "'Instrument Serif', Georgia, serif"
    }
  }, pick.smakfynd_score)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: t.tx,
      fontFamily: "'Instrument Serif', Georgia, serif",
      marginTop: 4
    }
  }, pick.price, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 400,
      color: t.txL
    }
  }, "kr")))));
}

// ════════════════════════════════════════════════════════════
// components/Methodology.jsx
// ════════════════════════════════════════════════════════════
// src/components/Methodology.jsx
function Methodology() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 640,
      margin: "0 auto",
      padding: "80px 20px 60px",
      borderTop: `1px solid ${t.bdrL}`
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "0 0 20px",
      fontSize: 24,
      fontFamily: "'Instrument Serif', Georgia, serif",
      fontWeight: 400,
      color: t.tx,
      lineHeight: 1.2
    }
  }, "S\xE5 fungerar Smakfynd-po\xE4ngen"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 16px",
      fontSize: 14,
      color: t.txM,
      lineHeight: 1.7
    }
  }, "Varje vin f\xE5r en po\xE4ng mellan 0 och 100, baserad p\xE5 tre saker:"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'Instrument Serif', Georgia, serif",
      fontSize: 20,
      color: t.tx
    }
  }, "75 %"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: t.tx,
      marginLeft: 8
    }
  }, "Kvalitet")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13,
      color: t.txM,
      lineHeight: 1.6
    }
  }, "V\xE4gt snitt av crowd-betyg fr\xE5n Vivino och expertbetyg fr\xE5n upp till sex kritiker (Suckling, Decanter, Falstaff m.fl.). Konsensusbonus n\xE4r crowd och experter \xE4r \xF6verens.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'Instrument Serif', Georgia, serif",
      fontSize: 20,
      color: t.tx
    }
  }, "25 %"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: t.tx,
      marginLeft: 8
    }
  }, "Prisv\xE4rde")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13,
      color: t.txM,
      lineHeight: 1.6
    }
  }, "Literpriset j\xE4mf\xF6rt med medianen i samma kategori. Ett r\xF6tt vin f\xF6r 112 kr f\xE5r h\xF6g prisv\xE4rde-po\xE4ng eftersom medianen \xE4r 279 kr.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: t.tx
    }
  }, "Eko-bonus")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13,
      color: t.txM,
      lineHeight: 1.6
    }
  }, "En liten bonus f\xF6r ekologiska viner."))), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 0",
      fontSize: 14,
      color: t.tx,
      lineHeight: 1.7,
      fontWeight: 500
    }
  }, "Resultatet: en enda siffra som s\xE4ger hur mycket smak du f\xE5r per krona \u2014 inte hur prestigefullt vinet \xE4r."), /*#__PURE__*/React.createElement("hr", {
    style: {
      border: "none",
      borderTop: `1px solid ${t.bdrL}`,
      margin: "28px 0 20px"
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 12,
      color: t.txL,
      lineHeight: 1.7,
      fontStyle: "italic"
    }
  }, "Smakfynd \xE4r byggt av Gabriel Linton, forskare i entrepren\xF6rskap och innovation. Sajten finns f\xF6r att Systembolagets sortiment \xE4r sv\xE5rnavigerat och vinguider tenderar att ranka \"b\xE4st\" snarare \xE4n \"smartast k\xF6p\". Ingen koppling till Systembolaget. Drivs av Olav Innovation AB."));
}

// ════════════════════════════════════════════════════════════
// components/StoreMode.jsx
// ════════════════════════════════════════════════════════════
// src/components/StoreMode.jsx
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

// ════════════════════════════════════════════════════════════
// components/AgeGate.jsx
// ════════════════════════════════════════════════════════════
// src/components/AgeGate.jsx
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
    },
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "\xC5ldersverifiering"
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
    },
    "aria-hidden": "true"
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
    autoFocus: true,
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

// ════════════════════════════════════════════════════════════
// App.jsx
// ════════════════════════════════════════════════════════════
// src/App.jsx
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
        } catch (e) {
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
        requestAnimationFrame(() => {
          setShowBackToTop(window.scrollY > 800);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, {
      passive: true
    });
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
    if (selRegion) r = r.filter(p => p.region === selRegion);
    if (selTaste) {
      const tasteFilters = {
        "Fylligt": p => (p.taste_body || 0) >= 8,
        "Lätt": p => (p.taste_body || 12) <= 5,
        "Fruktigt": p => (p.taste_fruit || 0) >= 8,
        "Torrt": p => (p.taste_sweet || 12) <= 3
      };
      if (tasteFilters[selTaste]) r = r.filter(tasteFilters[selTaste]);
    }
    if (sortBy === "expert") r.sort((a, b) => (b.expert_score || 0) - (a.expert_score || 0));else if (sortBy === "crowd") r.sort((a, b) => (b.crowd_score || 0) - (a.crowd_score || 0));else if (sortBy === "price_asc") r.sort((a, b) => (a.price || 0) - (b.price || 0));else if (sortBy === "price_desc") r.sort((a, b) => (b.price || 0) - (a.price || 0));else if (sortBy === "drop") r.sort((a, b) => (b.price_vs_launch_pct || 0) - (a.price_vs_launch_pct || 0));
    return r;
  }, [products, cat, price, search, showNew, showDeals, pkg, showEco, showBest, selCountry, selFoods, selRegion, selTaste, sortBy]);
  const newN = products.filter(p => p.is_new).length;
  const dealN = products.filter(p => p.price_vs_launch_pct > 0).length;
  const ecoN = products.filter(p => p.organic).length;
  const hasFilters = search || cat !== "all" || price !== "all" || showNew || showDeals || showEco || selCountry || selFoods.length > 0 || selRegion || selTaste || sortBy !== "smakfynd";
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
    setSelRegion(null);
    setSelTaste(null);
    setSortBy("smakfynd");
  };
  const savedWines = useMemo(() => {
    return products.filter(p => sv.isSaved(p.nr || p.id)).sort((a, b) => b.smakfynd_score - a.smakfynd_score);
  }, [products, sv.data]);
  const [savedListFilter, setSavedListFilter] = useState("all");
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
        @keyframes slideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:scale(1) } }
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
        @media (max-width: 480px) {
          header { padding: 10px 16px 0 !important; }
        }
      `), /*#__PURE__*/React.createElement("header", {
    style: {
      padding: "16px 20px 0",
      maxWidth: 580,
      margin: "0 auto",
      animation: "fadeIn 0.4s ease"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "24",
    height: "24",
    viewBox: "0 0 40 40"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "20",
    cy: "20",
    r: "19",
    fill: t.wine
  }), /*#__PURE__*/React.createElement("text", {
    x: "20",
    y: "27",
    textAnchor: "middle",
    fontFamily: "Georgia,serif",
    fontSize: "18",
    fill: "#f5ede3",
    fontWeight: "400"
  }, "S")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'Instrument Serif', Georgia, serif",
      fontSize: 22,
      color: t.wine
    }
  }, "Smakfynd")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      fontSize: 12,
      color: t.txL
    }
  }, [["weekly", "Veckans fynd"], ["food", "Kvällens middag"], ["picks", "Gabriels val"], ["saved", `♥${sv.count ? ` ${sv.count}` : ""}`], ["about", "Om"], [auth.user ? "profile" : "login", auth.user ? "👤" : "Logga in"]].map(([k, l]) => /*#__PURE__*/React.createElement("span", {
    key: k,
    onClick: () => {
      if (k === "login") {
        setShowLogin(true);
        return;
      }
      if (k === "profile") {
        auth.logout();
        return;
      }
      if (k === "weekly" || k === "food" || k === "picks") {
        const el = document.getElementById("section-" + k);
        if (el) el.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
        return;
      }
      setPanel(panel === k ? null : k);
    },
    style: {
      cursor: "pointer",
      color: panel === k ? t.wine : k === "login" ? t.wine : t.txL,
      fontWeight: panel === k ? 600 : 400,
      padding: "8px 2px",
      minHeight: 44,
      display: "inline-flex",
      alignItems: "center"
    }
  }, l)))), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 4px",
      fontSize: 14,
      fontFamily: "'Instrument Serif', Georgia, serif",
      color: t.txM,
      textAlign: "center",
      lineHeight: 1.3
    }
  }, products.length > 100 ? `${(Math.round(products.length / 100) * 100).toLocaleString("sv-SE")}+` : "", " viner rankade efter v\xE4rde."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 10px",
      fontSize: 12,
      fontStyle: "italic",
      color: t.txL,
      textAlign: "center",
      lineHeight: 1.4
    }
  }, "Inte \"b\xE4sta vinet\" utan b\xE4sta k\xF6pet i sin kategori.")), /*#__PURE__*/React.createElement("div", {
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
  }, "Systembolaget har tusentals viner. Vi hj\xE4lper dig hitta de som faktiskt \xE4r v\xE4rda pengarna. Vi kombinerar ", /*#__PURE__*/React.createElement("strong", null, "crowd-betyg"), " fr\xE5n hundratusentals vindrickare, ", /*#__PURE__*/React.createElement("strong", null, "expertrecensioner"), " fr\xE5n internationella kritiker och ", /*#__PURE__*/React.createElement("strong", null, "prisj\xE4mf\xF6relse"), " inom varje kategori."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: t.txM,
      lineHeight: 1.7,
      margin: "0 0 14px"
    }
  }, "Resultatet: ", /*#__PURE__*/React.createElement("strong", null, "en enda po\xE4ng"), " som visar kvalitet per krona. Inte det \"b\xE4sta\" vinet \u2014 utan det b\xE4sta ", /*#__PURE__*/React.createElement("em", null, "k\xF6pet"), "."), /*#__PURE__*/React.createElement("div", {
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
  }, "Gabriel Linton"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: t.txM,
      lineHeight: 1.6,
      margin: 0
    }
  }, "Jag har pluggat dryckeskunskap i Grythyttan, forskar i innovation vid Universitetet i Innlandet i Norge och har en MBA fr\xE5n Cleveland State."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: t.txM,
      lineHeight: 1.6,
      margin: "8px 0 0"
    }
  }, "Smakfynd b\xF6rjade f\xF6r att jag tyckte det var on\xF6digt sv\xE5rt att hitta bra vin p\xE5 Systembolaget. All data fanns redan, crowd-betyg, kritikerrecensioner, priser, men ingen hade satt ihop det. Jag ville ha ett verktyg som tar h\xE4nsyn till priset, inte bara kvaliteten. S\xE5 jag byggde det.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: t.txL,
      margin: 0
    }
  }, "Olav Innovation AB \xB7 Oberoende informationstj\xE4nst \xB7 Ingen koppling till Systembolaget \xB7 Vi s\xE4ljer inte alkohol"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      borderRadius: 12,
      background: `${t.wine}06`,
      border: `1px solid ${t.wine}12`,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: t.tx,
      marginBottom: 4
    }
  }, "\uD83C\uDF77 St\xF6d Smakfynd"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: t.txM,
      margin: "0 0 8px",
      lineHeight: 1.5
    }
  }, "Smakfynd \xE4r gratis och oberoende \u2014 inga annonser, inga sponsrade placeringar. Om du tycker om tj\xE4nsten kan du bjuda oss p\xE5 ett glas."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: t.wine
    }
  }, "Swish: 123 456 78 90"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: t.txF,
      marginTop: 4
    }
  }, "Alla bidrag g\xE5r till servrar, data och utveckling.")), /*#__PURE__*/React.createElement("button", {
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
  }, "Mina viner"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 12px",
      fontSize: 12,
      color: t.txL
    }
  }, "Sparas i webbl\xE4saren. Logga in (kommer snart) f\xF6r att synka."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      flexWrap: "wrap",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSavedListFilter("all"),
    style: {
      ...pill(savedListFilter === "all", t.wine),
      fontSize: 12,
      padding: "6px 12px"
    }
  }, "Alla (", sv.count, ")"), LISTS.map(list => {
    const cnt = sv.inList(list.k).length;
    if (cnt === 0) return null;
    return /*#__PURE__*/React.createElement("button", {
      key: list.k,
      onClick: () => setSavedListFilter(list.k),
      style: {
        ...pill(savedListFilter === list.k, t.wine),
        fontSize: 12,
        padding: "6px 12px"
      }
    }, list.i, " ", list.l, " (", cnt, ")");
  })), savedWines.length === 0 ? /*#__PURE__*/React.createElement("p", {
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
  }, savedWines.filter(p => savedListFilter === "all" || sv.isInList(p.nr || p.id, savedListFilter)).map((p, i) => /*#__PURE__*/React.createElement(Card, {
    key: p.id || i,
    p: p,
    rank: i + 1,
    delay: 0,
    allProducts: products,
    auth: auth
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
  }, "St\xE4ng")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "sf-search",
    style: {
      position: "absolute",
      width: 1,
      height: 1,
      overflow: "hidden",
      clip: "rect(0,0,0,0)"
    }
  }, "S\xF6k vin"), /*#__PURE__*/React.createElement("input", {
    id: "sf-search",
    type: "search",
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
  }, "\u2315")), /*#__PURE__*/React.createElement("div", {
    role: "button",
    tabIndex: 0,
    "aria-label": "\xD6ppna butiksl\xE4ge \u2014 s\xF6k p\xE5 vinets namn och se po\xE4ng direkt",
    onKeyDown: e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setStoreMode(true);
      }
    },
    onClick: () => setStoreMode(true),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      borderRadius: 14,
      background: `linear-gradient(135deg, ${t.wine}08, ${t.wine}04)`,
      border: `1px solid ${t.wine}20`,
      marginBottom: 14,
      cursor: "pointer",
      transition: "all 0.2s"
    },
    onMouseEnter: e => {
      e.currentTarget.style.borderColor = t.wine + "40";
      e.currentTarget.style.background = t.wine + "10";
    },
    onMouseLeave: e => {
      e.currentTarget.style.borderColor = t.wine + "20";
      e.currentTarget.style.background = `linear-gradient(135deg, ${t.wine}08, ${t.wine}04)`;
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 24
    }
  }, "\uD83C\uDFEA"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: t.tx
    }
  }, "St\xE5r du i butiken?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: t.txM
    }
  }, "S\xF6k p\xE5 vinets namn \u2014 se po\xE4ngen och b\xE4ttre alternativ direkt")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      color: t.txL
    }
  }, "\u2192")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      overflowX: "auto",
      paddingBottom: 4,
      marginBottom: 10
    }
  }, CATS.map(ct => /*#__PURE__*/React.createElement("button", {
    key: ct.k,
    onClick: () => {
      setCat(ct.k);
      track("filter", {
        type: "category",
        value: ct.k
      });
    },
    style: pill(cat === ct.k)
  }, ct.l))), !search && !showAdvanced && cat === "Rött" && price === "all" && !showDeals && !showNew && !showEco && !selCountry && selFoods.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      overflowX: "auto",
      paddingBottom: 4,
      marginBottom: 10
    }
  }, [["🔥", "Till grillat", () => {
    setSelFoods(["Kött"]);
    setShowAdvanced(true);
  }], ["🐟", "Till fisk", () => {
    setCat("Vitt");
    setSelFoods(["Fisk"]);
    setShowAdvanced(true);
  }], ["💰", "Under 100 kr", () => {
    setPrice("0-79");
    setShowAdvanced(true);
  }], ["📉", "Prissänkt", () => {
    setShowDeals(true);
    setSortBy("drop");
    setShowAdvanced(true);
  }], ["🌿", "Ekologiskt", () => {
    setShowEco(true);
  }]].map(([icon, label, fn]) => /*#__PURE__*/React.createElement("button", {
    key: label,
    onClick: fn,
    style: {
      padding: "8px 14px",
      borderRadius: 10,
      border: `1px solid ${t.bdrL}`,
      background: t.card,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      color: t.txM,
      display: "flex",
      alignItems: "center",
      gap: 5,
      whiteSpace: "nowrap",
      transition: "all 0.2s",
      boxShadow: t.sh1
    },
    onMouseEnter: e => {
      e.currentTarget.style.borderColor = t.wine + "40";
      e.currentTarget.style.color = t.wine;
    },
    onMouseLeave: e => {
      e.currentTarget.style.borderColor = t.bdrL;
      e.currentTarget.style.color = t.txM;
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14
    }
  }, icon), " ", label))), /*#__PURE__*/React.createElement("div", {
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
      ...pill(showAdvanced || price !== "all" || pkg !== "Flaska" || showEco || showDeals || showNew || selCountry || selFoods.length > 0 || selRegion || selTaste || sortBy !== "smakfynd"),
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, "Filter ", (() => {
    const n = (price !== "all" ? 1 : 0) + (pkg !== "Flaska" ? 1 : 0) + (showEco ? 1 : 0) + (showDeals ? 1 : 0) + (showNew ? 1 : 0) + (selCountry ? 1 : 0) + (selFoods.length > 0 ? 1 : 0) + (selRegion ? 1 : 0) + (selTaste ? 1 : 0) + (sortBy !== "smakfynd" ? 1 : 0);
    return n > 0 ? `(${n})` : "";
  })(), " ", /*#__PURE__*/React.createElement("span", {
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
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: t.txL,
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: "0.08em"
    }
  }, "F\xF6rpackning"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      background: t.bdrL,
      borderRadius: 100,
      padding: 3,
      width: "fit-content"
    }
  }, [["Flaska", "Flaskor"], ["BiB", "Bag-in-box"], ["Stor", "Storpack"]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
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
  }, l)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: t.txL,
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: "0.08em"
    }
  }, "Pris"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, PRICES.filter(p => p.k !== "all").map(({
    k,
    l
  }) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => {
      setPrice(price === k ? "all" : k);
      track("filter", {
        type: "price",
        value: k
      });
    },
    style: pill(price === k)
  }, l)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowEco(!showEco),
    style: pill(showEco, t.green)
  }, "Ekologiskt (", ecoN, ")"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setShowNew(!showNew);
      if (!showNew) setShowDeals(false);
    },
    style: pill(showNew)
  }, "Nyheter"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const next = !showDeals;
      setShowDeals(next);
      if (next) {
        setShowNew(false);
        setSortBy("drop");
      } else if (sortBy === "drop") {
        setSortBy("smakfynd");
      }
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
  }, [["Italien", "\ud83c\uddee\ud83c\uddf9"], ["Frankrike", "\ud83c\uddeb\ud83c\uddf7"], ["Spanien", "\ud83c\uddea\ud83c\uddf8"], ["USA", "\ud83c\uddfa\ud83c\uddf8"], ["Tyskland", "\ud83c\udde9\ud83c\uddea"], ["Sydafrika", "\ud83c\uddff\ud83c\udde6"], ["Chile", "\ud83c\udde8\ud83c\uddf1"], ["Portugal", "\ud83c\uddf5\ud83c\uddf9"], ["Australien", "\ud83c\udde6\ud83c\uddfa"], ["Argentina", "\ud83c\udde6\ud83c\uddf7"], ["Nya Zeeland", "\ud83c\uddf3\ud83c\uddff"], ["\u00d6sterrike", "\ud83c\udde6\ud83c\uddf9"]].map(([c, flag]) => /*#__PURE__*/React.createElement("button", {
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
  }, ["Kött", "Fågel", "Fisk", "Skaldjur", "Fläsk", "Grönsaker", "Ost", "Vilt", "Pasta", "Lamm"].map(f => /*#__PURE__*/React.createElement("button", {
    key: f,
    onClick: () => toggleFood(f),
    style: pill(selFoods.includes(f))
  }, f)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: t.txL,
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: "0.08em"
    }
  }, "Smak"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, ["Fylligt", "Lätt", "Fruktigt", "Torrt"].map(ts => /*#__PURE__*/React.createElement("button", {
    key: ts,
    onClick: () => setSelTaste(selTaste === ts ? null : ts),
    style: pill(selTaste === ts)
  }, ts)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: t.txL,
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: "0.08em"
    }
  }, "Region"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, ["Bordeaux", "Toscana", "Rioja", "Piemonte", "Bourgogne", "Rhonedalen", "Champagne", "Kalifornien"].map(rg => /*#__PURE__*/React.createElement("button", {
    key: rg,
    onClick: () => setSelRegion(selRegion === rg ? null : rg),
    style: pill(selRegion === rg)
  }, rg)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: t.txL,
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: "0.08em"
    }
  }, "Sortera"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, [["smakfynd", "Smakfynd-poäng"], ...(showDeals ? [["drop", "Störst sänkning"]] : []), ["expert", "Expertbetyg"], ["crowd", "Crowd-betyg"], ["price_asc", "Pris ↑"], ["price_desc", "Pris ↓"]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setSortBy(k),
    style: pill(sortBy === k)
  }, l))))), !search && !showDeals && !showNew && cat === "Rött" && /*#__PURE__*/React.createElement(WineOfDay, {
    products: products,
    onSelect: nr => {
      window.location.hash = `vin/${nr}`;
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  }), /*#__PURE__*/React.createElement("div", {
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
  }, {
    smakfynd: "Mest smak för pengarna",
    drop: "Störst prissänkning först",
    expert: "Sorterat efter expertbetyg",
    crowd: "Sorterat efter crowd-betyg",
    price_asc: "Lägst pris först",
    price_desc: "Högst pris först"
  }[sortBy]))), loadError && !loading && allData.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "48px 20px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      marginBottom: 12
    }
  }, "\uD83D\uDCE1"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      color: t.deal,
      marginBottom: 8
    }
  }, loadError), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setLoading(true);
      setLoadError(null);
      window.location.reload();
    },
    style: {
      padding: "10px 20px",
      borderRadius: 10,
      border: `1px solid ${t.bdr}`,
      background: t.card,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      color: t.txM
    }
  }, "F\xF6rs\xF6k igen")) : loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, [0, 1, 2, 3, 4].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "16px 18px",
      borderRadius: 14,
      background: t.card,
      border: `1px solid ${t.bdrL}`,
      display: "flex",
      gap: 14,
      alignItems: "flex-start",
      animation: `fadeIn 0.3s ease ${i * 0.08}s both`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 10,
      background: t.bdr,
      opacity: 0.4
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "60%",
      height: 16,
      borderRadius: 4,
      background: t.bdr,
      opacity: 0.3,
      marginBottom: 6
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: "40%",
      height: 12,
      borderRadius: 4,
      background: t.bdr,
      opacity: 0.2,
      marginBottom: 8
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: "80%",
      height: 4,
      borderRadius: 2,
      background: t.bdr,
      opacity: 0.2
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 50,
      height: 50,
      borderRadius: 12,
      background: t.bdr,
      opacity: 0.3
    }
  })))) : filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
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
  }, [["Bästa röda fynden", "Rött", null, null], ["Bästa vita just nu", "Vitt", null, null], ["Mest prisvärda bubbel", "Mousserande", null, null], ["Budget: bästa under 100 kr", null, 0, 100], ["Mellanklass: 100–200 kr", null, 100, 200], ["Premium: 200–500 kr", null, 200, 500]].map(([title, catFilter, pLo, pHi]) => {
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
      allProducts: products,
      auth: auth
    }))));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "20px 16px",
      borderRadius: 14,
      background: t.card,
      border: `1px solid ${t.bdr}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontFamily: "'Instrument Serif', serif",
      color: t.tx,
      marginBottom: 6
    }
  }, "Vet du vad du ska \xE4ta?"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: t.txL,
      margin: "0 0 10px"
    }
  }, "V\xE5r AI matchar r\xE4tt vin till din middag."), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const el = document.getElementById("section-food");
      if (el) el.scrollIntoView({
        behavior: "smooth"
      });
    },
    style: {
      padding: "10px 20px",
      borderRadius: 10,
      border: "none",
      background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`,
      color: "#fff",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "Prova AI-matchern \u2193"))) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, filtered.slice(0, 1).map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: p.id || i
  }, /*#__PURE__*/React.createElement(Card, {
    p: p,
    rank: 1,
    delay: 0,
    allProducts: products,
    autoOpen: String(p.nr) === String(autoOpenNr),
    auth: auth
  }), !autoOpenNr && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      fontSize: 11,
      color: t.txL,
      margin: "-4px 0 6px",
      animation: "fadeIn 1s ease 0.5s both"
    }
  }, "\u2191 Tryck p\xE5 ett vin f\xF6r att se mer"))), filtered.slice(1, 5).map((p, i) => /*#__PURE__*/React.createElement(Card, {
    key: p.id || i,
    p: p,
    rank: i + 2,
    delay: Math.min((i + 1) * 0.04, 0.4),
    allProducts: products,
    autoOpen: String(p.nr) === String(autoOpenNr),
    auth: auth
  })), filtered.length > 5 && /*#__PURE__*/React.createElement(NewsletterCTA, {
    compact: true
  }), filtered.slice(5, 50).map((p, i) => /*#__PURE__*/React.createElement(Card, {
    key: p.id || i,
    p: p,
    rank: i + 6,
    delay: Math.min((i + 5) * 0.04, 0.4),
    allProducts: products,
    autoOpen: String(p.nr) === String(autoOpenNr),
    auth: auth
  })), filtered.length > 50 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "24px 20px",
      borderRadius: 14,
      background: t.surface,
      border: `1px solid ${t.bdr}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: t.txM,
      marginBottom: 8
    }
  }, "Visar topp 50 av ", filtered.length, " viner"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: t.txL
    }
  }, "Anv\xE4nd filter f\xF6r att hitta fler, eller logga in f\xF6r att se hela listan."))), /*#__PURE__*/React.createElement("div", {
    id: "section-weekly"
  }, /*#__PURE__*/React.createElement(WeeklyPick, {
    products: products
  })), /*#__PURE__*/React.createElement("div", {
    id: "section-food"
  }, /*#__PURE__*/React.createElement(FoodMatch, {
    products: products
  })), /*#__PURE__*/React.createElement(NewsletterCTA, null), /*#__PURE__*/React.createElement("div", {
    id: "section-picks"
  }, /*#__PURE__*/React.createElement(EditorsPicks, {
    products: products,
    onSelect: nr => {
      window.location.hash = `vin/${nr}`;
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  })), (() => {
    const month = new Date().getMonth(); // 0-11
    const season = month >= 4 && month <= 8 ? "sommar" : month >= 2 && month <= 4 ? "vår" : month >= 9 && month <= 10 ? "höst" : "vinter";
    const seasonConfig = {
      vår: {
        title: "Vårviner",
        sub: "Lätta, friska viner för ljusare kvällar",
        emoji: "🌸",
        filter: p => (p.category === "Vitt" || p.category === "Rosé") && (p.taste_body || 12) <= 7
      },
      sommar: {
        title: "Sommarviner",
        sub: "Kylda favoriter till grillkvällar och picknick",
        emoji: "☀️",
        filter: p => (p.category === "Vitt" || p.category === "Rosé" || p.category === "Mousserande") && p.price <= 200
      },
      höst: {
        title: "Höstviner",
        sub: "Fylliga röda till mörka kvällar",
        emoji: "🍂",
        filter: p => p.category === "Rött" && (p.taste_body || 0) >= 7
      },
      vinter: {
        title: "Vinterviner",
        sub: "Värmande röda och festliga bubbel",
        emoji: "❄️",
        filter: p => p.category === "Rött" && (p.taste_body || 0) >= 8 || p.category === "Mousserande"
      }
    };
    const cfg = seasonConfig[season];
    const seasonWines = products.filter(p => p.assortment === "Fast sortiment" && p.package === "Flaska" && cfg.filter(p)).sort((a, b) => b.smakfynd_score - a.smakfynd_score).slice(0, 4);
    if (seasonWines.length === 0) return null;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 40
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
        fontSize: 20
      }
    }, cfg.emoji), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
      style: {
        margin: 0,
        fontSize: 18,
        fontFamily: "'Instrument Serif', serif",
        fontWeight: 400,
        color: t.tx
      }
    }, cfg.title), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontSize: 12,
        color: t.txL
      }
    }, cfg.sub))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, seasonWines.map((p, i) => /*#__PURE__*/React.createElement(Card, {
      key: p.id || i,
      p: p,
      rank: i + 1,
      delay: 0,
      allProducts: products,
      auth: auth
    }))));
  })(), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 14px",
      fontSize: 18,
      fontFamily: "'Instrument Serif', serif",
      fontWeight: 400,
      color: t.tx
    }
  }, "Hitta vin till tillf\xE4llet"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8
    }
  }, [["Dejt", "Romantisk middag", "🕯️", p => p.expert_score >= 7 && p.price >= 120 && p.price <= 300], ["Grillkväll", "Sommar & BBQ", "🔥", p => p.taste_body >= 7 && (p.food_pairings || []).some(f => /kött|grillat|fläsk/i.test(f))], ["Svärföräldrarna", "Tryggt & imponerande", "🎩", p => p.expert_score >= 7.5 && p.crowd_score >= 7 && p.price >= 150], ["Fredagsmys", "Under 120 kr", "🍕", p => p.price <= 120 && p.smakfynd_score >= 70], ["Picknick", "Lätt & friskt", "🧺", p => (p.category === "Vitt" || p.category === "Rosé") && (p.taste_body || 12) <= 6], ["After work", "Bubbel & lättviner", "🥂", p => p.category === "Mousserande" || (p.taste_body || 12) <= 5 && p.category === "Vitt"]].map(([title, sub, emoji, filterFn]) => {
    const matches = products.filter(p => p.assortment === "Fast sortiment" && p.package === "Flaska" && filterFn(p)).slice(0, 3);
    return /*#__PURE__*/React.createElement("button", {
      key: title,
      onClick: () => {
        setSearch("");
        setCat("all");
        setShowAdvanced(false);
        const best = matches[0];
        if (best) {
          window.location.hash = `vin/${best.nr}`;
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        }
      },
      style: {
        padding: "14px 16px",
        borderRadius: 14,
        background: t.card,
        border: `1px solid ${t.bdr}`,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        transition: "all 0.2s"
      },
      onMouseEnter: e => e.currentTarget.style.borderColor = t.wine + "40",
      onMouseLeave: e => e.currentTarget.style.borderColor = t.bdr
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 20,
        marginBottom: 4
      }
    }, emoji), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        color: t.tx
      }
    }, title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: t.txL
      }
    }, sub), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: t.txF,
        marginTop: 4
      }
    }, matches.length, " viner"));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 6px",
      fontSize: 18,
      fontFamily: "'Instrument Serif', serif",
      fontWeight: 400,
      color: t.tx
    }
  }, "Ge bort vin"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 14px",
      fontSize: 12,
      color: t.txL
    }
  }, "Kurerade val per budget \u2014 trygga presenter."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, [["Under 100 kr", 0, 100, "Trevlig gest"], ["100–200 kr", 100, 200, "Uppskattad present"], ["200–400 kr", 200, 400, "Lyxig gåva"]].map(([label, lo, hi, desc]) => {
    const picks = products.filter(p => p.assortment === "Fast sortiment" && p.package === "Flaska" && p.price >= lo && p.price < hi && p.expert_score >= 7).sort((a, b) => b.smakfynd_score - a.smakfynd_score).slice(0, 3);
    if (picks.length === 0) return null;
    return /*#__PURE__*/React.createElement("div", {
      key: label,
      style: {
        padding: "14px 16px",
        borderRadius: 14,
        background: t.card,
        border: `1px solid ${t.bdr}`
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        color: t.tx
      }
    }, label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: t.txL
      }
    }, desc)), picks.map((p, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      onClick: () => {
        window.location.hash = `vin/${p.nr}`;
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      },
      style: {
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        cursor: "pointer",
        borderTop: i > 0 ? `1px solid ${t.bdrL}` : "none"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: t.txM
      }
    }, p.name, " ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: t.txL
      }
    }, p.sub)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: t.tx,
        fontFamily: "'Instrument Serif', serif"
      }
    }, p.price, "kr"))));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40,
      padding: "24px 20px",
      borderRadius: 18,
      background: t.card,
      border: `1px solid ${t.bdr}`
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
  }, "Ny p\xE5 vin?"), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 8px",
      fontSize: 20,
      fontFamily: "'Instrument Serif', serif",
      fontWeight: 400,
      color: t.tx
    }
  }, "B\xF6rja h\xE4r"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: t.txM,
      margin: "0 0 16px",
      lineHeight: 1.6
    }
  }, "Du beh\xF6ver inte kunna n\xE5got om vin. Smakfynd har redan gjort jobbet \u2014 vi har analyserat tusentals viner och rankat dem efter kvalitet per krona. H\xF6gst po\xE4ng = mest smak f\xF6r pengarna."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, [["1. Börja med ett rött under 100 kr", "Rött", 0, 100, "Tryggt och prisvärt — de flesta gillar dessa."], ["2. Testa ett vitt till fisk eller kyckling", "Vitt", 0, 150, "Fräscht och enkelt — passar till vardagsmiddag."], ["3. Prova bubbel till fredagen", "Mousserande", 0, 200, "Inte bara för fest — perfekt till fredagsmys."]].map(([title, cat, lo, hi, tip]) => {
    const pick = products.find(p => p.category === cat && p.assortment === "Fast sortiment" && p.package === "Flaska" && p.price >= lo && p.price < hi && p.smakfynd_score >= 70);
    return /*#__PURE__*/React.createElement("div", {
      key: title,
      style: {
        padding: "12px 14px",
        borderRadius: 12,
        background: t.bg
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: t.tx,
        marginBottom: 4
      }
    }, title), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 12,
        color: t.txL,
        margin: "0 0 6px"
      }
    }, tip), pick && /*#__PURE__*/React.createElement("div", {
      onClick: () => {
        window.location.hash = `vin/${pick.nr}`;
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      },
      style: {
        fontSize: 12,
        color: t.wine,
        cursor: "pointer",
        fontWeight: 600
      }
    }, "V\xE5rt tips: ", pick.name, " (", pick.price, "kr, ", pick.smakfynd_score, "/100) \u2192"));
  }))), /*#__PURE__*/React.createElement(Methodology, null), /*#__PURE__*/React.createElement("div", {
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
  }, "Uppdaterad ", new Date().toLocaleDateString("sv-SE", {
    month: "long",
    year: "numeric"
  }), " \xB7 ", products.length, " viner \xB7 Data fr\xE5n Systembolagets sortiment"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0
    }
  }, "Smakfynd \xE4r en oberoende tj\xE4nst och har ingen koppling till, och \xE4r inte godk\xE4nd av, Systembolaget. Vi s\xE4ljer inte alkohol."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "4px 0 0"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "/integritet/",
    style: {
      color: t.txF,
      textDecoration: "none"
    }
  }, "Integritetspolicy"))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 10,
      color: t.txF,
      fontStyle: "italic"
    }
  }, "Njut med m\xE5tta."), /*#__PURE__*/React.createElement("button", {
    onClick: () => window.scrollTo({
      top: 0,
      behavior: "smooth"
    }),
    style: {
      marginTop: 12,
      padding: "10px 20px",
      borderRadius: 10,
      border: `1px solid ${t.bdr}`,
      background: t.card,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      color: t.txM
    }
  }, "\u2191 Tillbaka till toppen"))), showBackToTop && /*#__PURE__*/React.createElement("button", {
    onClick: () => window.scrollTo({
      top: 0,
      behavior: "smooth"
    }),
    "aria-label": "Tillbaka till toppen",
    style: {
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 100,
      width: 44,
      height: 44,
      borderRadius: "50%",
      background: t.card,
      border: `1px solid ${t.bdr}`,
      boxShadow: t.sh3,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 18,
      color: t.txM,
      fontFamily: "inherit",
      animation: "fadeIn 0.2s ease"
    }
  }, "\u2191")), showLogin && /*#__PURE__*/React.createElement(LoginModal, {
    onClose: () => setShowLogin(false),
    onLogin: data => {
      auth.login(data);
      setShowLogin(false);
      // Sync local wines to server
      if (data.wines && Object.keys(data.wines).length > 0) {
        // Server has wines — merge into local
        const merged = {
          ...sv.data
        };
        for (const [nr, lists] of Object.entries(data.wines)) {
          merged[nr] = [...new Set([...(merged[nr] || []), ...lists])];
        }
        try {
          localStorage.setItem("smakfynd_saved_v2", JSON.stringify(merged));
        } catch (e) {}
      }
      // Sync local to server
      auth.syncWines(sv.data);
    }
  }));
}
