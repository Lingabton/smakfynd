// src/components/Profile.jsx — Min sida dashboard
function Profile({ products, auth, onClose }) {
  const sv = React.useContext(SavedContext);
  const [sortBy, setSortBy] = useState("score"); // score | price | name

  if (!auth.user) {
    return (
      <div style={{ padding: 22, borderRadius: 16, background: t.card, border: `1px solid ${t.bdr}`, marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontFamily: t.serif, color: t.tx, marginBottom: 8 }}>Min sida</div>
        <p style={{ fontSize: 13, color: t.txM }}>Logga in för att spara viner och synka mellan enheter.</p>
        <button onClick={onClose} style={{ fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Stäng</button>
      </div>
    );
  }

  const savedWines = products.filter(p => sv.isSaved(p.nr));
  const sorted = [...savedWines].sort((a, b) => {
    if (sortBy === "price") return (a.price || 0) - (b.price || 0);
    if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
    return (b.smakfynd_score || 0) - (a.smakfynd_score || 0);
  });

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

      {/* Cross-links */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <a href="https://quiz.smakfynd.se" target="_blank" rel="noopener"
          style={{ padding: "8px 14px", borderRadius: 10, background: `${t.wine}08`, border: `1px solid ${t.wine}20`, fontSize: 12, color: t.wine, textDecoration: "none", fontWeight: 500 }}>
          Smakfynd Quiz →
        </a>
        <span style={{ padding: "8px 14px", borderRadius: 10, background: t.bg, border: `1px solid ${t.bdrL}`, fontSize: 12, color: t.txF }}>
          Premium — kommer snart
        </span>
      </div>

      {/* Saved wines */}
      <div style={{ fontSize: 14, fontFamily: t.serif, color: t.tx, marginBottom: 8 }}>
        Sparade viner ({savedWines.length})
      </div>

      {savedWines.length === 0 ? (
        <p style={{ fontSize: 13, color: t.txL }}>Inga sparade viner ännu. Tryck hjärtat på ett vinkort.</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[["score", "Poäng"], ["price", "Pris"], ["name", "Namn"]].map(([k, l]) => (
              <button key={k} onClick={() => setSortBy(k)}
                style={{ padding: "4px 10px", borderRadius: 8, border: `1px solid ${sortBy === k ? t.wine : t.bdr}`,
                  background: sortBy === k ? `${t.wine}0c` : "transparent", color: sortBy === k ? t.wine : t.txL,
                  fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: sortBy === k ? 600 : 400 }}>
                {l}
              </button>
            ))}
          </div>
          <div>
            {sorted.slice(0, 30).map(w => {
              const [_l, col] = getScoreInfo(w.smakfynd_score);
              return (
                <div key={w.nr} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${t.bdrL}` }}>
                  <ProductImage p={w} size={36} />
                  <div onClick={() => { window.location.hash = `vin/${w.nr}`; onClose(); }}
                    style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                    <div style={{ fontSize: 14, fontFamily: t.serif, color: t.tx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.name}</div>
                    <div style={{ fontSize: 11, color: t.txL }}>{w.sub} · {w.price}{"\u00A0"}kr</div>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 900, color: col, fontFamily: t.serif, flexShrink: 0 }}>{w.smakfynd_score}</span>
                  <button onClick={() => sv.toggle(w.nr)} aria-label="Ta bort"
                    style={{ fontSize: 14, color: t.txL, background: "none", border: "none", cursor: "pointer", padding: "4px", flexShrink: 0 }}>✕</button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
