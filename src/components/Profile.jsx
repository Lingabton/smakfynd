// src/components/Profile.jsx — Min sida dashboard
function Profile({ products, auth, onClose }) {
  const [tab, setTab] = useState("saved");
  const [ratings, setRatings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [cellar, setCellar] = useState([]);
  const [loading, setLoading] = useState(true);
  const sv = React.useContext(SavedContext);

  useEffect(() => {
    if (!auth.token) return;
    setLoading(true);
    Promise.all([
      auth.getRatings(),
      auth.getAlerts(),
      auth.getCellar(),
    ]).then(([r, a, c]) => {
      setRatings(r);
      setAlerts(a);
      setCellar(c);
      setLoading(false);
    });
  }, [auth.token]);

  const findWine = (nr) => products.find(p => String(p.nr) === String(nr));

  const WineRow = ({ nr, extra }) => {
    const w = findWine(nr);
    if (!w) return <div style={{ fontSize: 12, color: t.txL, padding: "8px 0" }}>Vin #{nr} (ej i sortiment)</div>;
    const [_l, col] = getScoreInfo(w.smakfynd_score);
    return (
      <div onClick={() => { window.location.hash = `vin/${nr}`; onClose(); }}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${t.bdrL}`, cursor: "pointer" }}>
        <ProductImage p={w} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontFamily: t.serif, color: t.tx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.name}</div>
          <div style={{ fontSize: 11, color: t.txL }}>{w.sub} · {w.price}{"\u00A0"}kr{extra ? ` · ${extra}` : ""}</div>
        </div>
        <span style={{ fontSize: 18, fontWeight: 900, color: col, fontFamily: t.serif }}>{w.smakfynd_score}</span>
      </div>
    );
  };

  // Taste profile from ratings
  const tasteProfile = useMemo(() => {
    if (ratings.length < 3) return null;
    const liked = ratings.filter(r => r.rating >= 4).map(r => findWine(r.wine_nr)).filter(Boolean);
    if (liked.length < 2) return null;
    const avgBody = liked.reduce((s, w) => s + (w.taste_body || 6), 0) / liked.length;
    const avgFruit = liked.reduce((s, w) => s + (w.taste_fruit || 6), 0) / liked.length;
    const avgSweet = liked.reduce((s, w) => s + (w.taste_sweet || 3), 0) / liked.length;
    const topGrapes = {};
    liked.forEach(w => { const g = (w.grape || "").split(",")[0].trim(); if (g) topGrapes[g] = (topGrapes[g] || 0) + 1; });
    const topCountries = {};
    liked.forEach(w => { if (w.country) topCountries[w.country] = (topCountries[w.country] || 0) + 1; });
    return { avgBody, avgFruit, avgSweet, topGrapes, topCountries, count: liked.length };
  }, [ratings, products]);

  const pillStyle = (active) => ({
    padding: "8px 16px", borderRadius: 100, border: active ? `1.5px solid ${t.wine}` : `1px solid ${t.bdr}`,
    background: active ? `${t.wine}0c` : "transparent", color: active ? t.wine : t.txM,
    fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: "inherit",
  });

  if (!auth.user) {
    return (
      <div style={{ padding: 22, borderRadius: 16, background: t.card, border: `1px solid ${t.bdr}`, marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontFamily: t.serif, color: t.tx, marginBottom: 8 }}>Min sida</div>
        <p style={{ fontSize: 13, color: t.txM }}>Logga in för att se dina sparade viner, betyg och larm.</p>
        <button onClick={onClose} style={{ fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Stäng</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 22, borderRadius: 16, background: t.card, border: `1px solid ${t.bdr}`, marginBottom: 20, animation: "scaleIn 0.25s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontFamily: t.serif, color: t.tx }}>Min sida</div>
          <div style={{ fontSize: 12, color: t.txL }}>{auth.user.email}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { auth.logout(); onClose(); }} style={{ fontSize: 12, color: t.txL, background: "none", border: `1px solid ${t.bdrL}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}>Logga ut</button>
          <button onClick={onClose} style={{ fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer" }}>Stäng</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={() => setTab("saved")} style={pillStyle(tab === "saved")}>Sparade ({sv.count})</button>
        <button onClick={() => setTab("ratings")} style={pillStyle(tab === "ratings")}>Betyg ({ratings.length})</button>
        <button onClick={() => setTab("alerts")} style={pillStyle(tab === "alerts")}>Larm ({alerts.length})</button>
        <button onClick={() => setTab("cellar")} style={pillStyle(tab === "cellar")}>Källare ({cellar.length})</button>
        <button onClick={() => setTab("taste")} style={pillStyle(tab === "taste")}>Smakprofil</button>
      </div>

      {loading && <div style={{ fontSize: 13, color: t.txL, padding: "20px 0", textAlign: "center" }}>Laddar...</div>}

      {!loading && tab === "saved" && (
        <div>
          {sv.count === 0 ? (
            <p style={{ fontSize: 13, color: t.txL }}>Inga sparade viner ännu. Tryck hjärtat på ett vinkort.</p>
          ) : (
            products.filter(p => sv.isSaved(p.nr)).sort((a, b) => b.smakfynd_score - a.smakfynd_score).map(w => (
              <WineRow key={w.nr} nr={w.nr} />
            ))
          )}
        </div>
      )}

      {!loading && tab === "ratings" && (
        <div>
          {ratings.length === 0 ? (
            <p style={{ fontSize: 13, color: t.txL }}>Inga betyg ännu. Expandera ett vinkort och ge stjärnor.</p>
          ) : (
            ratings.sort((a, b) => b.rating - a.rating).map(r => (
              <WineRow key={r.wine_nr} nr={r.wine_nr} extra={`${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}`} />
            ))
          )}
        </div>
      )}

      {!loading && tab === "alerts" && (
        <div>
          {alerts.length === 0 ? (
            <p style={{ fontSize: 13, color: t.txL }}>Inga aktiva larm. Tryck "Fynd-larm" på ett vinkort.</p>
          ) : (
            alerts.map((a, i) => (
              <WineRow key={i} nr={a.wine_nr} extra={
                a.alert_type === "price_drop" ? "Prissänkning" :
                a.alert_type === "price_below" ? `Under ${a.threshold} kr` :
                "Tillbaka i lager"
              } />
            ))
          )}
        </div>
      )}

      {!loading && tab === "cellar" && (
        <div>
          {cellar.length === 0 ? (
            <p style={{ fontSize: 13, color: t.txL }}>Tomt i källaren. Tryck "Lägg i källaren" på ett vinkort.</p>
          ) : (
            cellar.map((c, i) => (
              <WineRow key={i} nr={c.wine_nr} extra={
                c.status === "tasted"
                  ? `Provad${c.personal_rating ? ` ${"★".repeat(c.personal_rating)}` : ""}${c.occasion ? ` · ${c.occasion}` : ""}`
                  : "I källaren"
              } />
            ))
          )}
          {cellar.filter(c => c.notes).length > 0 && (
            <div style={{ marginTop: 12, borderTop: `1px solid ${t.bdrL}`, paddingTop: 12 }}>
              <div style={{ fontSize: 11, color: t.txL, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Provningsanteckningar</div>
              {cellar.filter(c => c.notes).map((c, i) => {
                const w = findWine(c.wine_nr);
                return (
                  <div key={i} style={{ marginBottom: 10, fontSize: 12, color: t.txM, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600, color: t.tx }}>{w ? w.name : `#${c.wine_nr}`}</span>
                    {c.occasion && <span style={{ color: t.txL }}> · {c.occasion}</span>}
                    <div style={{ fontStyle: "italic", marginTop: 2 }}>{c.notes}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!loading && tab === "taste" && (
        <div>
          {!tasteProfile ? (
            <div>
              <p style={{ fontSize: 13, color: t.txL }}>Betygsätt minst 3 viner med 4+ stjärnor för att se din smakprofil.</p>
              <p style={{ fontSize: 12, color: t.txF }}>Din profil beräknas från viner du gillat och hjälper oss rekommendera bättre.</p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, color: t.txM, marginBottom: 12 }}>Baserat på {tasteProfile.count} viner du gillar:</div>

              {/* Taste sliders */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: t.txL, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Din smak</div>
                {[
                  ["Lätt", "Fylligt", tasteProfile.avgBody, 12],
                  ["Stram", "Fruktigt", tasteProfile.avgFruit, 12],
                  ["Torrt", "Sött", tasteProfile.avgSweet, 12],
                ].map(([lo, hi, val, max]) => (
                  <div key={lo} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: t.txL, width: 38, textAlign: "right" }}>{lo}</span>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: t.bdr, position: "relative" }}>
                      <div style={{
                        position: "absolute", top: "50%", left: `${(val / max) * 100}%`,
                        width: 10, height: 10, borderRadius: "50%", background: t.wine,
                        border: `2px solid ${t.card}`, transform: "translate(-50%, -50%)",
                      }} />
                    </div>
                    <span style={{ fontSize: 10, color: t.txL, width: 38 }}>{hi}</span>
                  </div>
                ))}
              </div>

              {/* Favorite grapes */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: t.txL, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Favoritdruvor</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {Object.entries(tasteProfile.topGrapes).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([grape, count]) => (
                    <span key={grape} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, background: t.bg, color: t.txM }}>{grape} ({count})</span>
                  ))}
                </div>
              </div>

              {/* Favorite countries */}
              <div>
                <div style={{ fontSize: 11, color: t.txL, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Favoritländer</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {Object.entries(tasteProfile.topCountries).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([country, count]) => (
                    <span key={country} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, background: t.bg, color: t.txM }}>{country} ({count})</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
