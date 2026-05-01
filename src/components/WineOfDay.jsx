// src/components/WineOfDay.jsx
function WineOfDay({ products, onSelect }) {
  const pick = useMemo(() => {
    if (!products || products.length < 50) return null;
    const today = new Date().toISOString().slice(0, 10);
    const hash = [...today].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
    const top = products
      .filter(p => p.assortment === "Fast sortiment" && p.package === "Flaska" && p.smakfynd_score >= 70 && p.price <= 250)
      .sort((a, b) => b.smakfynd_score - a.smakfynd_score)
      .slice(0, 80);
    return top.length > 0 ? top[Math.abs(hash) % top.length] : null;
  }, [products]);

  if (!pick) return null;

  const [_label, col] = getScoreInfo(pick.smakfynd_score);

  return (
    <div style={{ marginBottom: 14, padding: "14px 16px", borderRadius: 14, background: `linear-gradient(135deg, ${t.wine}06, ${t.wine}03)`, border: `1px solid ${t.wine}12` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }} aria-hidden="true">✦</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: t.wine, textTransform: "uppercase", letterSpacing: "0.08em" }}>Dagens vin</span>
        <span style={{ fontSize: 10, color: t.txF, marginLeft: "auto" }}>{new Date().toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}</span>
      </div>
      <div
        role="button" tabIndex={0}
        onClick={() => onSelect && onSelect(pick.nr)}
        onKeyDown={e => { if (e.key === "Enter") onSelect && onSelect(pick.nr); }}
        style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}
      >
        <ProductImage p={pick} size={48} eager={true} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontFamily: t.serif, color: t.tx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pick.name}</div>
          <div style={{ fontSize: 12, color: t.txL }}>{pick.sub} · {pick.country} · {pick.grape}</div>
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `${col}15`, border: `2px solid ${col}30`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: col, lineHeight: 1, fontFamily: t.serif }}>{pick.smakfynd_score}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: t.tx, fontFamily: t.serif, marginTop: 4 }}>
            {pick.price}<span style={{ fontSize: 10, fontWeight: 400, color: t.txL }}>kr</span>
          </div>
        </div>
      </div>
    </div>
  );
}
