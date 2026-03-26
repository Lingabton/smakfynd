// src/components/LoginModal.jsx
const AUTH_URL = "https://smakfynd-auth.smakfynd.workers.dev";

function LoginModal({ onClose, onLogin }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1); // 1=email, 2=code
  const [newsletter, setNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSendCode = async () => {
    if (!email.includes("@")) { setError("Ange en giltig email"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(AUTH_URL + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newsletter }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.status === "code_sent") {
        setStep(2);
        // TEMP: auto-fill code during development
        if (data._dev_code) setCode(data._dev_code);
      }
    } catch (e) {
      setError(e.message || "Kunde inte skicka kod");
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (code.length < 6) { setError("Ange 6-siffrig kod"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(AUTH_URL + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newsletter }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      try { localStorage.setItem("sf_token", data.token); localStorage.setItem("sf_user", JSON.stringify(data.user)); } catch(e) {}
      onLogin(data);
    } catch (e) {
      setError(e.message || "Felaktig kod");
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(30,23,16,0.5)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: t.card, borderRadius: 20, padding: "32px 28px", maxWidth: 380, width: "100%",
        boxShadow: "0 20px 60px rgba(30,23,16,0.2)", animation: "scaleIn 0.2s ease",
      }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>
          {step === 1 ? "Logga in" : "Ange kod"}
        </h2>

        {step === 1 ? (
          <>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: t.txL, lineHeight: 1.5 }}>
              Vi skickar en verifieringskod till din email. Inget lösenord behövs.
            </p>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="din@email.se"
              onKeyDown={e => e.key === "Enter" && handleSendCode()}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 12,
                border: `1px solid ${t.bdr}`, background: t.bg, fontSize: 14,
                color: t.tx, outline: "none", boxSizing: "border-box", marginBottom: 12,
              }}
            />
            <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)}
                style={{ marginTop: 3, accentColor: t.wine }} />
              <span style={{ fontSize: 12, color: t.txM, lineHeight: 1.5 }}>
                Ja, jag vill få veckans bästa vinköp via email
              </span>
            </label>
            <button onClick={handleSendCode} disabled={loading}
              style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`,
                color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer",
                fontFamily: "inherit", opacity: loading ? 0.7 : 1,
              }}>
              {loading ? "Skickar..." : "Skicka verifieringskod"}
            </button>
          </>
        ) : (
          <>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: t.txL, lineHeight: 1.5 }}>
              Vi har skickat en 6-siffrig kod till <strong>{email}</strong>
            </p>
            <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456" inputMode="numeric" autoFocus
              onKeyDown={e => e.key === "Enter" && handleVerify()}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 12,
                border: `1px solid ${t.bdr}`, background: t.bg, fontSize: 24,
                color: t.tx, outline: "none", boxSizing: "border-box", marginBottom: 12,
                textAlign: "center", letterSpacing: "0.3em", fontFamily: "monospace",
              }}
            />
            <button onClick={handleVerify} disabled={loading || code.length < 6}
              style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`,
                color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer",
                fontFamily: "inherit", opacity: (loading || code.length < 6) ? 0.7 : 1,
              }}>
              {loading ? "Verifierar..." : "Logga in"}
            </button>
            <button onClick={() => { setStep(1); setCode(""); setError(null); }}
              style={{ display: "block", margin: "10px auto 0", fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer" }}>
              Byt email
            </button>
          </>
        )}

        {error && <p style={{ fontSize: 12, color: t.deal, margin: "10px 0 0" }}>{error}</p>}

        <p style={{ fontSize: 10, color: t.txF, margin: "12px 0 0", textAlign: "center", lineHeight: 1.5 }}>
          Genom att logga in godkänner du vår <a href="/integritet/" target="_blank" style={{ color: t.txL }}>integritetspolicy</a>.
        </p>

        <button onClick={onClose} style={{
          display: "block", margin: "12px auto 0", fontSize: 12, color: t.txL,
          background: "none", border: "none", cursor: "pointer", textDecoration: "underline",
        }}>Avbryt</button>
      </div>
    </div>
  );
}

function useAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sf_user")); } catch(e) { return null; }
  });
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem("sf_token"); } catch(e) { return null; }
  });

  const login = (data) => {
    setUser(data.user);
    setToken(data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try { localStorage.removeItem("sf_token"); localStorage.removeItem("sf_user"); } catch(e) {}
  };

  const syncWines = async (localWines) => {
    if (!token) return localWines;
    try {
      const res = await fetch(AUTH_URL + "/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, wines: localWines }),
      });
      const data = await res.json();
      if (data.wines) return data.wines;
    } catch(e) {}
    return localWines;
  };

  const saveToServer = (nr, list) => {
    if (!token) return;
    fetch(AUTH_URL + "/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, nr, list }),
      keepalive: true,
    }).catch(() => {});
  };

  const removeFromServer = (nr, list) => {
    if (!token) return;
    fetch(AUTH_URL + "/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, nr, list }),
      keepalive: true,
    }).catch(() => {});
  };

  return { user, token, login, logout, syncWines, saveToServer, removeFromServer };
}
