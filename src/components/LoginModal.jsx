// src/components/LoginModal.jsx
const AUTH_URL = "https://smakfynd-auth.smakfynd.workers.dev";

function LoginModal({ onClose, onLogin }) {
  const [email, setEmail] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
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
      // Save token
      try { localStorage.setItem("sf_token", data.token); localStorage.setItem("sf_user", JSON.stringify(data.user)); } catch(e) {}
      onLogin(data);
    } catch (e) {
      setError(e.message || "Kunde inte logga in");
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
        <h2 style={{ margin: "0 0 6px", fontSize: 22, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>Logga in</h2>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: t.txL, lineHeight: 1.5 }}>
          Spara dina viner och synka mellan enheter. Inget lösenord — bara din email.
        </p>

        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="din@email.se"
          onKeyDown={e => e.key === "Enter" && handleLogin()}
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

        {error && <p style={{ fontSize: 12, color: t.deal, margin: "0 0 10px" }}>{error}</p>}

        <button onClick={handleLogin} disabled={loading}
          style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none",
            background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`,
            color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer",
            fontFamily: "inherit", opacity: loading ? 0.7 : 1,
          }}>
          {loading ? "Loggar in..." : "Logga in"}
        </button>

        <p style={{ fontSize: 10, color: t.txF, margin: "12px 0 0", textAlign: "center", lineHeight: 1.5 }}>
          Genom att logga in godkänner du vår <a href="/integritet/" target="_blank" style={{ color: t.txL }}>integritetspolicy</a>.
          Vi sparar bara din email och dina vinlistor.
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

  // Sync saved wines on login
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

  // Save wine to server
  const saveToServer = (nr, list) => {
    if (!token) return;
    fetch(AUTH_URL + "/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, nr, list }),
      keepalive: true,
    }).catch(() => {});
  };

  // Remove wine from server
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
