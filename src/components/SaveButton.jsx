// src/components/SaveButton.jsx
function SaveButton({ nr, sv, auth }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const saved = sv.isSaved(nr);
  const lists = sv.getLists(nr);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button onClick={e => { e.stopPropagation(); if (saved) { setMenuOpen(!menuOpen); } else { sv.toggle(nr, "favoriter", auth); track("save", { nr, list: "favoriter" }); } }}
        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(!menuOpen); }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 12, color: saved ? t.wine : t.txL,
          background: "none", border: "none", cursor: "pointer", padding: "2px 0",
          fontFamily: "inherit", transition: "all 0.2s",
        }}>
        <span style={{ fontSize: 15, lineHeight: 1 }}>{saved ? "♥" : "♡"}</span>
        <span style={{ fontWeight: saved ? 600 : 400 }}>{saved ? (lists.length === 1 ? LISTS.find(l => l.k === lists[0])?.l || "Sparad" : `${lists.length} listor`) : "Spara"}</span>
      </button>
      {menuOpen && (
        <div onClick={e => e.stopPropagation()} style={{
          position: "absolute", bottom: "100%", left: 0, marginBottom: 6,
          background: t.card, border: `1px solid ${t.bdr}`, borderRadius: 12,
          boxShadow: "0 8px 24px rgba(30,23,16,0.12)", padding: "6px 0",
          zIndex: 100, minWidth: 160,
        }}>
          <div style={{ padding: "6px 14px 4px", fontSize: 10, color: t.txL, textTransform: "uppercase", letterSpacing: "0.08em" }}>Spara till</div>
          {LISTS.map(list => (
            <button key={list.k} onClick={e => { e.stopPropagation(); sv.toggle(nr, list.k, auth); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "8px 14px", border: "none", background: sv.isInList(nr, list.k) ? t.wineL : "transparent",
                cursor: "pointer", fontFamily: "inherit", fontSize: 13,
                color: sv.isInList(nr, list.k) ? t.wine : t.txM, textAlign: "left",
              }}>
              <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{list.i}</span>
              <span>{list.l}</span>
              {sv.isInList(nr, list.k) && <span style={{ marginLeft: "auto", fontSize: 12 }}>✓</span>}
            </button>
          ))}
          <div style={{ borderTop: `1px solid ${t.bdrL}`, margin: "4px 0" }} />
          <button onClick={e => { e.stopPropagation(); setMenuOpen(false); }}
            style={{ width: "100%", padding: "6px 14px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 11, color: t.txL, textAlign: "center" }}>
            Stäng
          </button>
        </div>
      )}
    </div>
  );
}
