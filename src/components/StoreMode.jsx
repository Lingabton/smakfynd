// src/components/StoreMode.jsx
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
