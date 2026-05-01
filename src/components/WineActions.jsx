// src/components/WineActions.jsx — Rating, Alerts, Cellar actions for expanded card

function StarRating({ nr, auth }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [saved, setSaved] = useState(false);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: t.txL }}>Ditt betyg:</span>
      <div style={{ display: "flex", gap: 2 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star}
            onClick={e => {
              e.stopPropagation();
              if (!auth.user) return;
              setRating(star);
              setSaved(true);
              auth.rateWine(nr, star);
              track("rate", { nr, rating: star });
              setTimeout(() => setSaved(false), 2000);
            }}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            style={{
              fontSize: 18, cursor: auth.user ? "pointer" : "default",
              color: (hover || rating) >= star ? "#d4a84b" : t.bdr,
              transition: "color 0.15s, transform 0.15s",
              transform: hover >= star ? "scale(1.15)" : "scale(1)",
            }}
          >{(hover || rating) >= star ? "★" : "☆"}</span>
        ))}
      </div>
      {saved && <span style={{ fontSize: 10, color: t.green, fontWeight: 600 }}>Sparat!</span>}
      {!auth.user && <span style={{ fontSize: 10, color: t.txF }}>Logga in för att betygsätta</span>}
    </div>
  );
}

function AlertButton({ nr, wine, auth }) {
  const [showMenu, setShowMenu] = useState(false);
  const [alertSet, setAlertSet] = useState(null); // "price_drop" | "price_below" | etc

  if (!auth.user) return null;

  return (
    <div style={{ position: "relative" }}>
      <button onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11, color: alertSet ? t.wine : t.txM, background: alertSet ? `${t.wine}08` : "none",
          border: `1px solid ${alertSet ? t.wine + "30" : t.bdrL}`, borderRadius: 8,
          cursor: "pointer", padding: "6px 10px", fontFamily: "inherit", transition: "all 0.2s",
        }}>
        {alertSet ? "Larm aktivt" : "Fynd-larm"}
      </button>
      {showMenu && (
        <div onClick={e => e.stopPropagation()} style={{
          position: "absolute", top: "100%", left: 0, marginTop: 4, zIndex: 10,
          background: t.card, borderRadius: 12, border: `1px solid ${t.bdr}`,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: 12, minWidth: 220,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.tx, marginBottom: 8 }}>Bevaka {wine.name}</div>
          {[
            ["price_drop", "📉 Meddela vid prissänkning", "När priset sjunker"],
            ["price_below", `💰 Under ${Math.round(wine.price * 0.85)} kr`, `När priset går under ${Math.round(wine.price * 0.85)} kr`],
            ["back_in_stock", "📦 Tillbaka i sortiment", "När vinet kommer tillbaka"],
          ].map(([type, label, desc]) => (
            <button key={type} onClick={() => {
              auth.setAlert(nr, type, type === "price_below" ? Math.round(wine.price * 0.85) : null);
              setAlertSet(type);
              setShowMenu(false);
              track("alert_set", { nr, type });
            }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "8px 10px", borderRadius: 8, border: "none",
                background: alertSet === type ? `${t.green}10` : "transparent",
                cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                color: t.txM, transition: "background 0.15s", marginBottom: 2,
              }}
              onMouseEnter={e => e.currentTarget.style.background = t.bg}
              onMouseLeave={e => e.currentTarget.style.background = alertSet === type ? `${t.green}10` : "transparent"}
            >
              <div style={{ fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: 10, color: t.txL }}>{desc}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CellarButton({ nr, auth }) {
  const [status, setStatus] = useState(null); // null | "added" | "tasting"
  const [showTasting, setShowTasting] = useState(false);
  const [notes, setNotes] = useState("");
  const [occasion, setOccasion] = useState("");
  const [personalRating, setPersonalRating] = useState(0);

  if (!auth.user) return null;

  if (showTasting) {
    return (
      <div onClick={e => e.stopPropagation()} style={{
        padding: 14, borderRadius: 12, background: t.bg, border: `1px solid ${t.bdrL}`, marginTop: 8,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.tx, marginBottom: 8 }}>Provningsanteckning</div>
        <input type="text" value={occasion} onChange={e => setOccasion(e.target.value)}
          placeholder="Tillfälle (t.ex. fredagsmiddag, dejt)"
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${t.bdr}`, background: t.card, fontSize: 12, color: t.tx, outline: "none", boxSizing: "border-box", marginBottom: 6 }}
        />
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Dina tankar om vinet..."
          rows={2}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${t.bdr}`, background: t.card, fontSize: 12, color: t.tx, outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", marginBottom: 6 }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: t.txL }}>Betyg:</span>
          {[1, 2, 3, 4, 5].map(s => (
            <span key={s} onClick={() => setPersonalRating(s)}
              style={{ fontSize: 16, cursor: "pointer", color: personalRating >= s ? "#d4a84b" : t.bdr }}>
              {personalRating >= s ? "★" : "☆"}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => {
            auth.addToCellar(nr, "taste", { notes, occasion, rating: personalRating || null });
            setStatus("tasted");
            setShowTasting(false);
            track("cellar_taste", { nr });
          }}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: t.wine, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Spara
          </button>
          <button onClick={() => setShowTasting(false)}
            style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${t.bdr}`, background: t.card, color: t.txM, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            Avbryt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 6 }}>
      {status !== "added" && (
        <button onClick={e => {
          e.stopPropagation();
          auth.addToCellar(nr, "add");
          setStatus("added");
          track("cellar_add", { nr });
        }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 11, color: t.txM, background: "none",
            border: `1px solid ${t.bdrL}`, borderRadius: 8,
            cursor: "pointer", padding: "6px 10px", fontFamily: "inherit",
          }}>
          Lägg i källaren
        </button>
      )}
      {status === "added" && <span style={{ fontSize: 11, color: t.green, padding: "6px 10px" }}>✓ I källaren</span>}
      <button onClick={e => { e.stopPropagation(); setShowTasting(true); }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11, color: t.txM, background: "none",
          border: `1px solid ${t.bdrL}`, borderRadius: 8,
          cursor: "pointer", padding: "6px 10px", fontFamily: "inherit",
        }}>
        Har provats
      </button>
    </div>
  );
}
