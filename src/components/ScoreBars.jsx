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
