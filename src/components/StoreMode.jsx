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
  const same = products.filter(p =>
    p.nr !== wine.nr && p.category === wine.category && p.package === wine.package
    && p.assortment === "Fast sortiment"
  );
  const recs = [];

  // Type A: Better in same price range (±20%, +5 poäng)
  const priceRange = wine.price * 0.2;
  const typeA = same
    .filter(p => Math.abs(p.price - wine.price) <= priceRange && p.smakfynd_score >= wine.smakfynd_score + 5)
    .sort((a, b) => b.smakfynd_score - a.smakfynd_score);
  for (const p of typeA.slice(0, 2)) {
    recs.push({ ...p, _recType: "A", _recLabel: `Liknande, +${p.smakfynd_score - wine.smakfynd_score} poäng` });
  }

  // Type B: Same quality, lower price (poäng ±3, price -25%)
  if (recs.length < 3) {
    const typeB = same
      .filter(p => Math.abs(p.smakfynd_score - wine.smakfynd_score) <= 3 && p.price <= wine.price * 0.75)
      .sort((a, b) => a.price - b.price);
    for (const p of typeB.slice(0, 1)) {
      recs.push({ ...p, _recType: "B", _recLabel: `Samma kvalitet, ${Math.round(wine.price - p.price)}\u00A0kr billigare` });
    }
  }

  // Type C: Worth upgrading (poäng +8, price 30-100% higher, only if wine < 75)
  if (recs.length < 3 && wine.smakfynd_score < 75) {
    const typeC = same
      .filter(p => p.smakfynd_score >= wine.smakfynd_score + 8 && p.price > wine.price * 1.3 && p.price <= wine.price * 2)
      .sort((a, b) => b.smakfynd_score - a.smakfynd_score);
    for (const p of typeC.slice(0, 1)) {
      recs.push({ ...p, _recType: "C", _recLabel: `Märkbart bättre för ${Math.round(p.price - wine.price)}\u00A0kr extra` });
    }
  }

  return recs;
}

function availLabel(avail) {
  if (avail >= 0.7) return { text: "Brett tillgängligt", color: t.green };
  if (avail >= 0.3) return { text: "Fråga din butik", color: t.gold };
  return { text: "Beställningsvara", color: t.txL };
}

function StoreMode({ products, onClose }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
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

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo(() => {
    return fuzzySearch(products, q, ["name", "sub", "country", "grape", "region"]);
  }, [q, products]);

  const recs = useMemo(() => {
    return selected ? getRecommendations(selected, products) : [];
  }, [selected, products]);

  const handleSelect = (wine) => {
    setSelected(wine);
    addRecent(wine);
    track("snabbkoll_lookup", { nr: wine.nr, name: wine.name });
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
          onChange={e => { setQ(e.target.value); setSelected(null); }}
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
              <div key={p.nr} onClick={() => { handleSelect(p); setQ(p.name); }}
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
          {/* Main card */}
          <div style={{ padding: "16px 18px", borderRadius: 14, background: t.card, border: `1px solid ${t.bdr}`, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <ProductImage p={selected} size={56} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontFamily: t.serif, color: t.tx, lineHeight: 1.2 }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: t.txL, marginTop: 2 }}>{selected.sub}</div>
                <div style={{ fontSize: 12, color: t.txL, marginTop: 2 }}>{selected.country}{selected.region ? `, ${selected.region}` : ""} · {selected.grape}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginTop: 6 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, fontFamily: t.serif, color: t.tx }}>{selected.price}{"\u00A0"}<span style={{ fontSize: 12, color: t.txL, fontWeight: 400 }}>kr</span></span>
                  {selected.avail && <span style={{ fontSize: 10, color: availLabel(selected.avail).color }}>{availLabel(selected.avail).text}</span>}
                </div>
              </div>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: getScoreInfo(selected.smakfynd_score)[1], fontFamily: t.serif }}>{selected.smakfynd_score}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: getScoreInfo(selected.smakfynd_score)[1] }}>{getScoreInfo(selected.smakfynd_score)[0]}</div>
                {/* Compact score breakdown */}
                <div style={{ marginTop: 6, fontSize: 10, color: t.txL }}>
                  {selected.crowd_score && <div>Crowd {selected.crowd_score.toFixed(1)}/10</div>}
                  {selected.expert_score && <div>Expert {selected.expert_score.toFixed(1)}/10</div>}
                  {selected.price_score && <div>Prisvärde {selected.price_score.toFixed(1)}/10</div>}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <a href={`https://www.systembolaget.se/produkt/vin/${selected.nr}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: t.txM, textDecoration: "none", padding: "6px 12px", borderRadius: 8, border: `1px solid ${t.bdrL}` }}>
                Systembolaget
              </a>
              <button onClick={() => { setSelected(null); setQ(""); inputRef.current?.focus(); }}
                style={{ fontSize: 12, color: t.wine, background: "none", border: `1px solid ${t.wine}30`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                Sök nytt vin
              </button>
            </div>
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
            <div style={{ padding: "16px 18px", borderRadius: 12, background: `${t.green}08`, border: `1px solid ${t.green}20` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.green }}>Du gjorde rätt val</div>
              <div style={{ fontSize: 12, color: t.txM, marginTop: 2 }}>Inget bättre i prisklassen just nu.</div>
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
