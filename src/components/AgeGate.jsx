// src/components/AgeGate.jsx
function AgeGate({ onConfirm }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#f5f1eb", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', -apple-system, sans-serif", padding: 20,
    }} role="dialog" aria-modal="true" aria-label="Åldersverifiering">
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">🍷</div>
        <h1 style={{ margin: "0 0 8px", fontSize: 28, fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, color: "#2d2520" }}>Smakfynd</h1>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "#8a7e72", lineHeight: 1.6 }}>
          Den här sidan innehåller information om alkoholhaltiga drycker och riktar sig till personer som fyllt 25 år.
        </p>
        <button onClick={onConfirm} autoFocus style={{
          padding: "14px 36px", borderRadius: 14, border: "none", cursor: "pointer",
          background: "#6b2a3a", color: "#fff", fontSize: 15, fontWeight: 600,
          fontFamily: "inherit", transition: "opacity 0.2s", marginBottom: 12,
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >Ja, jag är över 25</button>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#b0a898" }}>
          Genom att gå vidare bekräftar du att du är minst 25 år.
        </p>
        <p style={{ margin: 0, fontSize: 10, color: "#c5bdb3", lineHeight: 1.6 }}>
          Smakfynd är en oberoende informationstjänst från Olav Innovation AB.<br />Ingen koppling till Systembolaget. Vi säljer inte alkohol.
        </p>
      </div>
    </div>
  );
}
