// src/components/NewsletterCTA.jsx
function NewsletterCTA({ compact = false }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // null | "loading" | "done" | "error"

  const handleSubmit = async () => {
    if (!email.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch("https://smakfynd-auth.smakfynd.workers.dev/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("done");
        track("subscribe", { source: compact ? "inline" : "section" });
      } else {
        setStatus("error");
      }
    } catch (e) {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div style={{
        padding: compact ? "12px 16px" : "20px 22px", borderRadius: 14,
        background: `${t.green}08`, border: `1px solid ${t.green}20`,
        textAlign: "center", margin: compact ? "8px 0" : "20px 0",
      }}>
        <div style={{ fontSize: 20, marginBottom: 4 }}>✓</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.green }}>Tack!</div>
        <div style={{ fontSize: 12, color: t.txM }}>Du får veckans bästa fynd i din inbox.</div>
      </div>
    );
  }

  if (compact) {
    return (
      <div style={{
        display: "flex", gap: 8, padding: "14px 16px", borderRadius: 14,
        background: t.surface, border: `1px solid ${t.bdr}`, margin: "8px 0",
        alignItems: "center",
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.tx }}>Veckans bästa vinköp i din inbox</div>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="din@email.se"
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${t.bdr}`, background: t.card, fontSize: 13, color: t.tx, outline: "none", boxSizing: "border-box", minWidth: 0 }}
            />
            <button onClick={handleSubmit} disabled={status === "loading"}
              style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: t.wine, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, opacity: status === "loading" ? 0.6 : 1 }}>
              {status === "loading" ? "..." : "Prenumerera"}
            </button>
          </div>
          {status === "error" && <div style={{ fontSize: 11, color: t.deal, marginTop: 4 }}>Något gick fel, försök igen.</div>}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: "24px 22px", borderRadius: 16, margin: "24px 0",
      background: `linear-gradient(145deg, ${t.wine}06, ${t.wine}03)`,
      border: `1px solid ${t.wine}15`,
    }}>
      <div style={{ fontSize: 18, fontFamily: t.serif, color: t.tx, marginBottom: 4 }}>
        Missa inte veckans vinköp
      </div>
      <p style={{ fontSize: 13, color: t.txM, margin: "0 0 12px", lineHeight: 1.5 }}>
        Varje vecka skickar vi de bästa fynden — prissänkta viner, nya topprankade och Gabriels personliga val. Gratis, ingen spam.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="din@email.se"
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: `1px solid ${t.bdr}`, background: t.card, fontSize: 14, color: t.tx, outline: "none", boxSizing: "border-box" }}
        />
        <button onClick={handleSubmit} disabled={status === "loading"}
          style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, opacity: status === "loading" ? 0.6 : 1 }}>
          {status === "loading" ? "Skickar..." : "Prenumerera"}
        </button>
      </div>
      {status === "error" && <div style={{ fontSize: 12, color: t.deal, marginTop: 6 }}>Något gick fel, försök igen.</div>}
      <p style={{ fontSize: 10, color: t.txF, margin: "8px 0 0" }}>
        Vi skickar max 1 mail/vecka. Avsluta när du vill.
      </p>
    </div>
  );
}
