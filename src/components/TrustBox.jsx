// src/components/TrustBox.jsx
function TrustBox() {
  const isMobile = window.innerWidth < 768;
  const [open, setOpen] = useState(!isMobile);
  return (
    <div style={{
      padding: open ? "14px 20px" : "10px 16px", borderRadius: 14,
      border: `1px solid ${t.bdr}`, background: t.card, marginBottom: 20,
      textAlign: "left", cursor: isMobile ? "pointer" : "default",
    }} onClick={() => isMobile && setOpen(!open)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.tx }}>Så funkar Smakfynd</span>
          {!open && <span style={{ fontSize: 11, color: t.txL, marginLeft: 6 }}>— baserat på data, inte magkänsla</span>}
        </div>
        {isMobile && <span style={{ fontSize: 10, color: t.txL }}>{open ? "▲" : "▼"}</span>}
      </div>
      {open && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: t.txM, marginBottom: 8, lineHeight: 1.4 }}>Bästa köp i varje stil och prisklass.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              ["🍷", "Vi jämför bara med liknande viner — rött mot rött, bubbel mot bubbel"],
              ["⚖️", "Vi väger ihop crowd-betyg, expertrecensioner och prisvärde"],
              ["📊", "Fler omdömen ger säkrare signal — viner med få betyg rankas lägre"],
              ["🤝", "Vi säljer inte vin — vi hjälper dig välja bättre"],
            ].map(([icon, text], i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 13, lineHeight: 1.4, flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: 12, color: t.txM, lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
