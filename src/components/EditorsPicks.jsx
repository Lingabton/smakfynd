// src/components/EditorsPicks.jsx
function EditorsPicks({ products, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <button onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "12px 16px", borderRadius: 12,
          background: t.card, border: `1px solid ${t.bdr}`,
          cursor: "pointer", fontFamily: "inherit", textAlign: "left",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>🍷</span>
          <span style={{ fontSize: 13, color: t.tx }}>
            <strong style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400 }}>Redaktionens val</strong>
            <span style={{ color: t.txL }}> — 3 utvalda fynd vi testat och gillar</span>
          </span>
        </div>
        <span style={{ fontSize: 10, color: t.txL, transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
      </button>
      {open && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          {GABRIELS_PICKS.map((pick, i) => {
            const mp = products.find(pr => String(pr.nr) === String(pick.nr));
            const [_l, pCol] = getScoreInfo(pick.smakfynd_score);
            return (
              <div key={i} style={{ padding: "14px 16px", borderRadius: 12, background: t.card, border: `1px solid ${t.bdr}`, cursor: mp ? "pointer" : "default" }}
                onClick={() => mp && onSelect(mp.nr || pick.nr)}>
                <div style={{ fontSize: 10, fontWeight: 700, color: t.wine, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{pick.verdict}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <svg width="40" height="40" viewBox="0 0 50 50" style={{ flexShrink: 0 }}>
                    <circle cx="25" cy="25" r="22" fill="#e8f0e4" />
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#d4ddd0" strokeWidth="2.5" />
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#2d6b3f" strokeWidth="2.5"
                      strokeDasharray={`${pick.smakfynd_score * 1.38} 138`} strokeLinecap="round"
                      transform="rotate(-90 25 25)" />
                    <text x="25" y="30" textAnchor="middle" fontFamily="'Instrument Serif', Georgia, serif"
                      fontSize="17" fontWeight="900" fill="#2d6b3f">{pick.smakfynd_score}</text>
                  </svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontFamily: "'Instrument Serif', serif", color: t.tx }}>{pick.name}</div>
                    <div style={{ fontSize: 11, color: t.txL }}>{pick.sub} · {pick.price}</div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: t.txM, lineHeight: 1.5, margin: "8px 0 0", fontStyle: "italic" }}>{pick.note}</p>
                {mp && <div style={{ fontSize: 10, color: t.wine, marginTop: 6 }}>Klicka för att se fullständig profil →</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
