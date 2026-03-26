// src/components/AIQuestion.jsx
function AIQuestion({ aiResult, onFollowup }) {
  const [freetext, setFreetext] = useState("");
  return (
    <div>
      {(aiResult.questions || []).map((q, qi) => (
        <div key={qi} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 13, color: t.tx, fontWeight: 500, marginBottom: 6 }}>{q}</div>
          {aiResult.quick_options && aiResult.quick_options[qi] && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {aiResult.quick_options[qi].map((opt, oi) => (
                <button key={oi} onClick={() => onFollowup(opt)}
                  style={{
                    padding: "8px 16px", borderRadius: 100, border: `1px solid ${t.wine}30`,
                    background: t.card, color: t.wine, fontSize: 13, fontWeight: 500,
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = t.wine; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = t.card; e.currentTarget.style.color = t.wine; }}
                >{opt}</button>
              ))}
            </div>
          )}
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input type="text" value={freetext} onChange={e => setFreetext(e.target.value)}
          placeholder="Eller skriv eget svar..."
          onKeyDown={e => e.key === "Enter" && freetext.trim() && onFollowup(freetext.trim())}
          style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${t.bdr}`, background: t.card, fontSize: 13, color: t.tx, outline: "none", boxSizing: "border-box" }}
        />
        <button onClick={() => freetext.trim() && onFollowup(freetext.trim())}
          disabled={!freetext.trim()}
          style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: t.wine, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: freetext.trim() ? 1 : 0.4 }}
        >Skicka</button>
      </div>
    </div>
  );
}
