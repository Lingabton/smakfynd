// src/components/LoginModal.jsx — Supabase magic link auth

function LoginModal({ onClose, onLogin }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [newsletter, setNewsletter] = useState(false);

  const handleSend = async () => {
    if (!email.includes("@")) { setError("Ange en giltig email"); return; }
    setLoading(true);
    setError(null);
    try {
      const { error: sbError } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (sbError) throw sbError;
      if (newsletter) {
        fetch("https://smakfynd-auth.smakfynd.workers.dev/subscribe", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }).catch(() => {});
      }
      setSent(true);
    } catch (e) {
      setError(e.message || "Kunde inte skicka länk");
    }
    setLoading(false);
  };

  useEffect(() => {
    const handleEsc = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Logga in" style={{
      position: "fixed", inset: 0, background: "rgba(30,23,16,0.5)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: t.card, borderRadius: 20, padding: "32px 28px", maxWidth: 380, width: "100%",
        boxShadow: "0 20px 60px rgba(30,23,16,0.2)", animation: "scaleIn 0.2s ease",
      }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, fontFamily: t.serif, fontWeight: 400, color: t.tx }}>
          {sent ? "Kolla din inbox" : "Logga in"}
        </h2>

        {sent ? (
          <>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: t.txL, lineHeight: 1.5 }}>
              Vi har skickat en inloggningslänk till <strong>{email}</strong>. Klicka på länken för att logga in.
            </p>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: t.txF, lineHeight: 1.5 }}>
              Kolla din skräppost om du inte ser mailet inom en minut.
            </p>
            <button onClick={() => { setSent(false); setError(null); }}
              style={{ display: "block", margin: "0 auto", fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer" }}>
              Byt email
            </button>
          </>
        ) : (
          <>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: t.txL, lineHeight: 1.5 }}>
              Vi skickar en inloggningslänk till din email. Inget lösenord behövs.
            </p>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="din@email.se"
              onKeyDown={e => e.key === "Enter" && handleSend()}
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
            <button onClick={handleSend} disabled={loading}
              style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`,
                color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer",
                fontFamily: "inherit", opacity: loading ? 0.7 : 1,
              }}>
              {loading ? "Skickar..." : "Skicka inloggningslänk"}
            </button>
          </>
        )}

        {error && <p style={{ fontSize: 12, color: t.deal, margin: "10px 0 0" }}>{error}</p>}

        <p style={{ fontSize: 10, color: t.txF, margin: "12px 0 0", textAlign: "center", lineHeight: 1.5 }}>
          Genom att logga in godkänner du vår <a href="/integritet/" target="_blank" style={{ color: t.txL }}>integritetspolicy</a>.
          {" "}Ditt konto delas med <a href="https://quiz.smakfynd.se" target="_blank" style={{ color: t.txL }}>Smakfynd Quiz</a>.
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
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing session
    sb.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user || null);
      setLoading(false);
    });

    // Listen for auth changes (magic link callback, sign out, etc.)
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = () => {}; // handled by onAuthStateChange
  const logout = async () => {
    await sb.auth.signOut();
    setUser(null);
    setSession(null);
  };

  // Saved wines via Supabase
  const syncWines = async (localWines) => {
    if (!session) return localWines;
    try {
      // Get server wines
      const { data } = await sb.from("saved_wines").select("wine_nr, notes").eq("user_id", session.user.id);
      if (data && data.length > 0) {
        const merged = { ...localWines };
        for (const row of data) {
          if (!merged[row.wine_nr]) merged[row.wine_nr] = ["Favoriter"];
        }
        return merged;
      }
    } catch(e) {}
    return localWines;
  };

  const saveToServer = (nr) => {
    if (!session) return;
    sb.from("saved_wines").upsert({ user_id: session.user.id, wine_nr: String(nr) }).then(() => {});
  };

  const removeFromServer = (nr) => {
    if (!session) return;
    sb.from("saved_wines").delete().eq("user_id", session.user.id).eq("wine_nr", String(nr)).then(() => {});
  };

  // Stub premium features (keep interface compatible)
  const rateWine = () => {};
  const setAlert = () => Promise.resolve({});
  const removeAlert = () => {};
  const addToCellar = () => Promise.resolve({});
  const getRatings = () => Promise.resolve([]);
  const getAlerts = () => Promise.resolve([]);
  const getCellar = () => Promise.resolve([]);

  const token = session?.access_token || null;

  return { user, token, loading: loading, login, logout, syncWines, saveToServer, removeFromServer,
           rateWine, setAlert, removeAlert, addToCellar, getRatings, getAlerts, getCellar };
}
