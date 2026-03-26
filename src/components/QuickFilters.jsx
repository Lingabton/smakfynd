// src/components/QuickFilters.jsx
function QuickFilters({ onFilter }) {
  const presets = [
    { label: "Topp under 100 kr", icon: "💰", action: { cat: "all", price: "0-99", showBest: false } },
    { label: "Bästa röda just nu", icon: "🍷", action: { cat: "Rött", price: "all", showBest: false } },
    { label: "Expertfavoriter", icon: "🏆", action: { cat: "all", price: "all", showBest: true } },
    { label: "Ekologiskt & prisvärt", icon: "🌿", action: { cat: "all", price: "all", showEco: true } },
    { label: "Bubbel till fest", icon: "🍾", action: { cat: "Mousserande", price: "all", showBest: false } },
  ];

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Snabbval</div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
        {presets.map((p, i) => (
          <button key={i} onClick={() => { onFilter(p.action); track("filter", { type: "quickfilter", value: p.label }); }}
            style={{
              padding: "8px 14px", borderRadius: 10, border: `1px solid ${t.bdr}`,
              background: t.card, cursor: "pointer", fontFamily: "inherit",
              fontSize: 12, color: t.txM, whiteSpace: "nowrap",
              display: "flex", alignItems: "center", gap: 5,
              transition: "all 0.2s", boxShadow: "0 1px 3px rgba(30,23,16,0.04)",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.wine + "40"; e.currentTarget.style.color = t.wine; e.currentTarget.style.boxShadow = "0 2px 8px rgba(30,23,16,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.bdr; e.currentTarget.style.color = t.txM; e.currentTarget.style.boxShadow = "0 1px 3px rgba(30,23,16,0.04)"; }}
          >
            <span style={{ fontSize: 14 }}>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
