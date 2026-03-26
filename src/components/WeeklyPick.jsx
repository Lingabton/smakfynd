// src/components/WeeklyPick.jsx
function WeeklyPick({ products }) {
  // Auto-select best value wine: highest score, under 150kr, fast sortiment
  const pick = useMemo(() => {
    const candidates = products
      .filter(p => p.assortment === "Fast sortiment" && p.package === "Flaska" && p.price && p.price <= 150 && p.smakfynd_score >= 75)
      .sort((a, b) => {
        // Prefer wines with both crowd + expert, then highest score
        const aBonus = (a.crowd_score && a.expert_score) ? 5 : 0;
        const bBonus = (b.crowd_score && b.expert_score) ? 5 : 0;
        return (b.smakfynd_score + bBonus) - (a.smakfynd_score + aBonus);
      });
    return candidates[0] || null;
  }, [products]);

  if (!pick) return null;

  const [_label, col] = getScoreInfo(pick.smakfynd_score);
  const sbUrl = `https://www.systembolaget.se/produkt/vin/${pick.nr}`;

  return (
    <div style={{
      padding: "16px 18px", borderRadius: 14, marginBottom: 16,
      background: `linear-gradient(135deg, ${t.wine}08, ${t.wine}03)`,
      border: `1px solid ${t.wine}18`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: t.wine, textTransform: "uppercase", letterSpacing: "0.1em" }}>Veckans fynd</span>
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <ProductImage p={pick} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontFamily: "'Instrument Serif', Georgia, serif", color: t.tx, lineHeight: 1.2 }}>{pick.name}</div>
          <div style={{ fontSize: 12, color: t.txL, marginTop: 2 }}>{pick.sub} · {pick.country}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Instrument Serif', Georgia, serif", color: t.tx }}>{pick.price}<span style={{ fontSize: 11, fontWeight: 400, color: t.txL }}>kr</span></span>
            {pick.crowd_score && <span style={{ fontSize: 10, color: "#6b8cce", background: "#6b8cce10", padding: "2px 6px", borderRadius: 100 }}>Crowd {pick.crowd_score.toFixed(1)}</span>}
            {pick.expert_score && <span style={{ fontSize: 10, color: "#b07d3b", background: "#b07d3b10", padding: "2px 6px", borderRadius: 100 }}>Expert {pick.expert_score.toFixed(1)}</span>}
          </div>
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <svg width="48" height="48" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="22" fill="#e8f0e4" />
            <circle cx="25" cy="25" r="22" fill="none" stroke="#2d6b3f" strokeWidth="2.5"
              strokeDasharray={`${pick.smakfynd_score * 1.38} 138`} strokeLinecap="round"
              transform="rotate(-90 25 25)" />
            <text x="25" y="30" textAnchor="middle" fontFamily="'Instrument Serif', Georgia, serif"
              fontSize="18" fontWeight="900" fill="#2d6b3f">{pick.smakfynd_score}</text>
          </svg>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <a href={sbUrl} target="_blank" rel="noopener noreferrer" onClick={e => { e.stopPropagation(); track("sb_click", { nr: pick.nr, source: "weekly_pick" }); }}
          style={{ fontSize: 12, color: t.wine, textDecoration: "none", fontWeight: 500 }}>Köp på Systembolaget →</a>
        <a href={`#vin/${pick.nr}`} style={{ fontSize: 12, color: t.txL, textDecoration: "none" }}>Se detaljer</a>
      </div>
    </div>
  );
}
