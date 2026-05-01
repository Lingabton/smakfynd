// src/components/Card.jsx — Redesigned wine card
function Card({ p, rank, delay, allProducts, autoOpen, auth }) {
  const [open, setOpen] = useState(!!autoOpen || (rank === 1 && !autoOpen));
  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) track("click", { nr: p.nr, name: p.name, score: p.smakfynd_score, rank });
  };
  const sv = React.useContext(SavedContext);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const s100 = p.smakfynd_score;
  const [label, col] = getScoreInfo(s100);
  const sbUrl = `https://www.systembolaget.se/produkt/vin/${p.nr}`;

  // Split score: approximate kvalitet vs prisvärde contribution
  const qualPct = 75;
  const pricePct = 25;
  const qualBar = Math.min(100, ((p.crowd_score || 5) / 10) * 100);
  const priceBar = Math.min(100, ((p.price_score || 5) / 10) * 100);

  // Comparison wine: find expensive wine that actually tastes similar
  const comparison = useMemo(() => {
    if (!allProducts || !p.crowd_score || p.crowd_score < 7 || p.price > 250) return null;
    const myGrape = (p.grape || "").toLowerCase().split(",")[0].trim();
    const myBody = p.taste_body || 0;
    const myFruit = p.taste_fruit || 0;

    // Find expensive wines with similar taste profile
    const candidates = allProducts
      .filter(w => {
        if (w.nr === p.nr || w.category !== p.category || w.package !== p.package) return false;
        if (w.price < p.price * 2 || w.price < 180) return false;
        if (!w.crowd_score || w.crowd_score < p.crowd_score - 0.5) return false;

        // Must share grape OR similar taste profile
        const wGrapes = (w.grape || "").toLowerCase().split(",").map(g => g.trim()).filter(Boolean);
        const myGrapes = (p.grape || "").toLowerCase().split(",").map(g => g.trim()).filter(Boolean);
        const sameGrape = myGrapes.length > 0 && wGrapes.some(g => myGrapes.includes(g));
        const similarTaste = myBody && w.taste_body && Math.abs(w.taste_body - myBody) <= 1
          && (!myFruit || !w.taste_fruit || Math.abs(w.taste_fruit - myFruit) <= 2);

        return sameGrape || similarTaste;
      })
      .sort((a, b) => {
        // Prefer: same grape > similar taste, then highest price (most impressive comparison)
        const aGrape = (a.grape || "").toLowerCase().split(",")[0].trim() === myGrape ? 10 : 0;
        const bGrape = (b.grape || "").toLowerCase().split(",")[0].trim() === myGrape ? 10 : 0;
        return (bGrape - aGrape) || (b.price - a.price);
      });

    return candidates[0] || null;
  }, [p.nr, allProducts]);

  // Metadata line
  const meta = [p.country, p.region, p.grape].filter(Boolean).join(" · ");
  const foodStr = (p.food_pairings || []).slice(0, 3).join(", ");

  return (
    <div
      role="button" tabIndex={0} aria-expanded={open}
      aria-label={`${p.name} ${p.sub || ''}, ${s100} poäng, ${p.price}\u00A0kr`}
      onClick={handleOpen}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleOpen(); } }}
      style={{
        background: t.card, borderRadius: 14, outline: "none",
        border: `1px solid ${open ? t.bdr : t.bdrL}`,
        boxShadow: open ? t.sh3 : t.sh1,
        transition: "all 0.25s ease", overflow: "hidden",
        animation: delay ? `slideUp 0.35s ease ${delay}s both` : undefined,
        cursor: "pointer",
      }}
    >
      {/* ═══ COLLAPSED: Primary info ═══ */}
      <div style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Image */}
        <ProductImage p={p} size={48} eager={rank <= 3} />

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Row 1: Rank + Name + Status pill */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 12, color: t.txL, fontFamily: t.serif, fontWeight: 400, flexShrink: 0 }}>#{rank}</span>
            <h3 style={{
              margin: 0, fontSize: 16, fontFamily: t.serif,
              fontWeight: 400, color: t.tx, lineHeight: 1.2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{p.name}</h3>
            {p.organic && <span style={statusPill("EKO", t.green)}>EKO</span>}
            {!p.organic && s100 >= 80 && <span style={statusPill("Toppköp", t.green)}>Toppköp</span>}
            {!p.organic && s100 >= 70 && s100 < 80 && <span style={statusPill("Starkt fynd", "#5a7542")}>Starkt fynd</span>}
          </div>

          {/* Row 2: Sub + Price */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 2 }}>
            <span style={{ fontSize: 12, color: t.txL, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.sub}
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: t.tx, fontFamily: t.serif, flexShrink: 0, marginLeft: 8 }}>
              {p.price}{"\u00A0"}<span style={{ fontSize: 11, fontWeight: 400, color: t.txL }}>kr</span>
            </span>
          </div>

          {/* Row 3: Comparison line */}
          {comparison && (() => {
            const cGrape = (comparison.grape || "").toLowerCase().split(",")[0].trim();
            const pGrape = (p.grape || "").toLowerCase().split(",")[0].trim();
            const sameGrape = pGrape && cGrape && cGrape === pGrape;
            const savings = Math.round(comparison.price - p.price);
            const cCrowd = comparison.crowd_score ? comparison.crowd_score.toFixed(1) : null;
            const label = sameGrape
              ? `Samma druva som ${comparison.name} (${Math.round(comparison.price)}\u00A0kr) — du sparar ${savings}\u00A0kr`
              : `Liknande smakmönster som ${comparison.name} (${Math.round(comparison.price)}\u00A0kr) — du sparar ${savings}\u00A0kr`;
            return (
            <div style={{ marginTop: 4, fontSize: 11, color: t.green, fontWeight: 500 }}>
              {label}
              {cCrowd && <span style={{ marginLeft: 4, fontSize: 10, color: t.txL }}>(vindrickare ger {cCrowd}/10)</span>}
            </div>
            );
          })()}

          {/* Row 4: Vibe pills */}
          {(() => {
            const vibes = [];
            if (p.price_score >= 8) vibes.push("Prisvärt");
            if (p.crowd_reviews >= 5000 && p.crowd_score >= 7.5) vibes.push("Tryggt vardagsvin");
            if ((p.food_pairings || []).some(f => /kött|grillat/i.test(f)) && (p.taste_body || 0) >= 7) vibes.push("Fynd till grillat");
            if (p.price <= 100 && s100 >= 70) vibes.push("Budgetfavorit");
            if (p.expert_score >= 8) vibes.push("Kritikerfavorit");
            return vibes.length > 0 ? (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                {vibes.slice(0, 3).map(v => <span key={v} style={vibePill(t.txM)}>{v}</span>)}
              </div>
            ) : null;
          })()}

          {/* Row 5: Metadata */}
          <div style={{ marginTop: 3, fontSize: 11, color: t.txL }}>
            {meta}{foodStr ? ` · ${foodStr}` : ""}
          </div>
        </div>

        {/* Score with split bars + "?" */}
        <div style={{ flexShrink: 0, textAlign: "center", width: 58, position: "relative" }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: col, lineHeight: 1, fontFamily: t.serif }}>{s100}</div>
          <div style={{ fontSize: 10, color: col, marginTop: 3, marginBottom: 5, fontWeight: 600 }}>{label}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 9, color: t.txL, width: 12 }}>K</span>
              <div style={{ flex: 1, height: 5, borderRadius: 3, background: t.bdrL }}>
                <div style={{ width: `${qualBar}%`, height: "100%", borderRadius: 3, background: "#6b8cce" }} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 9, color: t.txL, width: 12 }}>P</span>
              <div style={{ flex: 1, height: 5, borderRadius: 3, background: t.bdrL }}>
                <div style={{ width: `${priceBar}%`, height: "100%", borderRadius: 3, background: t.green }} />
              </div>
            </div>
          </div>
          <button onClick={e => { e.stopPropagation(); setShowScoreInfo(!showScoreInfo); }}
            style={{ fontSize: 11, color: t.txL, background: "none", border: `1px solid ${t.bdrL}`, borderRadius: 4, cursor: "pointer", fontFamily: t.sans, marginTop: 5, padding: "1px 6px", lineHeight: 1.4 }}>?</button>
          {showScoreInfo && (
            <div onClick={e => e.stopPropagation()} style={{
              position: "absolute", bottom: "100%", right: -4, marginBottom: 6, zIndex: 10,
              width: 240, padding: 12, borderRadius: 10,
              background: t.card, border: `1px solid ${t.bdr}`, boxShadow: t.sh3,
              textAlign: "left", fontSize: 11, color: t.txM, lineHeight: 1.5,
            }}>
              <div style={{ fontFamily: t.serif, fontSize: 13, fontWeight: 600, color: t.tx, marginBottom: 6 }}>Hur räknas poängen?</div>
              <p style={{ margin: "0 0 6px" }}><strong style={{ color: "#6b8cce" }}>Kvalitet (75%)</strong> — snitt av crowd-betyg (Vivino) och expertbetyg.</p>
              <p style={{ margin: "0 0 6px" }}><strong style={{ color: t.green }}>Prisvärde (25%)</strong> — literpris jämfört med kategorins median.</p>
              <p style={{ margin: "0 0 8px" }}>Ekologiska viner får en liten bonus.</p>
              <div style={{ fontSize: 9, color: t.txL, marginBottom: 4 }}>KRITIKER</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {["Suckling", "Decanter", "Falstaff", "Wine Spectator", "Wine Enthusiast", "Vinous"].map(c => (
                  <span key={c} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: t.bg, color: t.txL }}>{c}</span>
                ))}
              </div>
              <a href="#" onClick={e => { e.preventDefault(); const el = document.querySelector('[id*="section"]'); if (el) el.scrollIntoView({ behavior: "smooth" }); setShowScoreInfo(false); }}
                style={{ display: "block", marginTop: 8, fontSize: 10, color: t.wine }}>Läs mer om metoden →</a>
            </div>
          )}
        </div>
      </div>

      {/* ═══ ACTION ROW — visible on hover/tap ═══ */}
      <div style={{
        padding: "0 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center",
        opacity: open ? 1 : 0.6, transition: "opacity 0.2s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a href={sbUrl} target="_blank" rel="noopener noreferrer" onClick={e => { e.stopPropagation(); track("sb_click", { nr: p.nr, name: p.name, price: p.price }); }}
            style={{ fontSize: 11, color: t.txM, textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center", padding: "0 4px" }}
            aria-label={`Köp ${p.name} på Systembolaget (öppnas i nytt fönster)`}
          >Systembolaget</a>
          {sv && <SaveButton nr={p.nr || p.id} sv={sv} auth={auth} />}
          <button onClick={e => {
              e.stopPropagation();
              track("share", { nr: p.nr, name: p.name });
              const url = `https://smakfynd.se/#vin/${p.nr}`;
              const text = `${p.name} ${p.sub || ''} \u2014 ${p.smakfynd_score}/100 på Smakfynd (${p.price}\u00A0kr)`;
              if (navigator.share) { navigator.share({ title: p.name, text, url }).catch(() => {}); }
              else {
                navigator.clipboard?.writeText(`${text}\n${url}`);
                const btn = e.currentTarget; btn.textContent = "Kopierad!"; btn.style.color = t.green;
                setTimeout(() => { btn.textContent = "Dela"; btn.style.color = t.txL; }, 2000);
              }
            }}
            style={{ fontSize: 11, color: t.txL, background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontFamily: "inherit", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
            Dela
          </button>
        </div>
        <span style={{ fontSize: 10, color: t.txF }}>
          {open ? "Stäng" : "Smakprofil & jämförbara"}
        </span>
      </div>

      {/* ═══ EXPANDED: Detail panel ═══ */}
      {open && (
        <div style={{ borderTop: `1px solid ${t.bdrL}`, padding: "14px 16px 16px" }}>
          {/* Desktop: two-column. Mobile: single column */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {/* Left: taste profile + details */}
            <div style={{ flex: "1 1 280px", minWidth: 0 }}>
              {/* Taste description */}
              {p.style && <div style={{ fontSize: 12, color: t.txM, fontStyle: "italic", marginBottom: 12, lineHeight: 1.5 }}>{p.style}</div>}

              {/* Taste sliders */}
              {(p.taste_body || p.taste_fruit || p.taste_sweet != null) && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Smakprofil</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      ["Lätt", "Fylligt", p.taste_body, 12],
                      ["Stram", "Fruktigt", p.taste_fruit, 12],
                      ["Torrt", "Sött", p.taste_sweet, 12],
                    ].filter(([_a, _b, v]) => v != null && v > 0).map(([lo, hi, val, max]) => (
                      <div key={lo} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, color: t.txL, width: 38, textAlign: "right", flexShrink: 0 }}>{lo}</span>
                        <div style={{ flex: 1, height: 3, borderRadius: 2, background: t.bdr, position: "relative" }}>
                          <div style={{
                            position: "absolute", top: "50%", left: `${(val / max) * 100}%`,
                            width: 8, height: 8, borderRadius: "50%",
                            background: t.wine, border: `2px solid ${t.card}`,
                            transform: "translate(-50%, -50%)", boxShadow: `0 0 0 1px ${t.wine}40`,
                          }} />
                        </div>
                        <span style={{ fontSize: 10, color: t.txL, width: 38, flexShrink: 0 }}>{hi}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Score breakdown */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Poängfördelning</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                      <span style={{ color: "#6b8cce", fontWeight: 600 }}>Crowd</span>
                      <span style={{ fontWeight: 700, color: "#6b8cce" }}>{p.crowd_score ? `${p.crowd_score.toFixed(1)}/10` : "\u2014"}</span>
                    </div>
                    {p.crowd_score && <div style={{ height: 3, borderRadius: 2, background: t.bdr }}><div style={{ width: `${p.crowd_score * 10}%`, height: "100%", borderRadius: 2, background: "#6b8cce" }} /></div>}
                    {p.crowd_reviews && <div style={{ fontSize: 10, color: t.txL, marginTop: 2 }}>{p.crowd_reviews > 999 ? `${(p.crowd_reviews / 1000).toFixed(0)}k` : p.crowd_reviews} omdömen</div>}
                  </div>
                  {p.expert_score && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                        <span style={{ color: "#b07d3b", fontWeight: 600 }}>Expert</span>
                        <span style={{ fontWeight: 700, color: "#b07d3b" }}>{p.expert_score.toFixed(1)}/10</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 2, background: t.bdr }}><div style={{ width: `${p.expert_score * 10}%`, height: "100%", borderRadius: 2, background: "#b07d3b" }} /></div>
                      {p.critics && p.critics.length > 0 && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                          {p.critics.map((cr, ci) => (
                            <span key={ci} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#b07d3b10", color: "#b07d3b" }}>{cr.c}: {cr.s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                      <span style={{ color: t.txM, fontWeight: 600 }}>Prisvärde</span>
                      <span style={{ fontWeight: 700, color: t.txM }}>{p.price_score ? `${p.price_score.toFixed(1)}/10` : "\u2014"}</span>
                    </div>
                    {p.price_score && <div style={{ height: 3, borderRadius: 2, background: t.bdr }}><div style={{ width: `${p.price_score * 10}%`, height: "100%", borderRadius: 2, background: t.txM }} /></div>}
                  </div>
                </div>
              </div>

              {/* Price drop */}
              {p.launch_price && p.price_vs_launch_pct > 0 && (
                <div style={{ padding: "8px 12px", borderRadius: 8, background: t.dealL, marginBottom: 14, fontSize: 12, color: t.deal }}>
                  Lanserades för {p.launch_price}{"\u00A0"}kr, nu {p.price}{"\u00A0"}kr. Du sparar {p.launch_price - p.price}{"\u00A0"}kr.
                </div>
              )}
            </div>

            {/* Right: similar wines */}
            {allProducts && (() => {
              const myGrapes = (p.grape || "").toLowerCase().split(",").map(g => g.trim()).filter(Boolean);
              const similar = allProducts
                .filter(w => w.category === p.category && w.package === p.package && w.assortment === "Fast sortiment" && (w.nr || w.id) !== (p.nr || p.id))
                .map(w => {
                  let sim = wineSimilarity(w, p);
                  if (Math.abs(w.price - p.price) <= 40) sim += 5;
                  sim += Math.max(0, (w.smakfynd_score - p.smakfynd_score)) * 1;
                  const wGrapes = (w.grape || "").toLowerCase().split(",").map(g => g.trim()).filter(Boolean);
                  const sameGrape = myGrapes.length > 0 && wGrapes.some(g => myGrapes.includes(g));
                  const sameRegion = p.region && w.region && p.region.toLowerCase() === w.region.toLowerCase();
                  return { ...w, _sim: sim, _sameGrape: sameGrape, _sameRegion: sameRegion };
                })
                .filter(w => w._sim >= 15)
                .sort((a, b) => b._sim - a._sim)
                .slice(0, 3);
              if (similar.length === 0) return null;
              return (
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <div style={{ fontSize: 9, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Jämförbara viner</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {similar.map((w, i) => (
                      <div key={i}
                        onClick={e => { e.stopPropagation(); window.location.hash = `vin/${w.nr}`; window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: t.bg, cursor: "pointer", transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = t.bdrL}
                        onMouseLeave={e => e.currentTarget.style.background = t.bg}
                      >
                        <span style={{ fontSize: 16, fontWeight: 900, color: col, fontFamily: t.serif, width: 28, textAlign: "center" }}>{w.smakfynd_score}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: t.tx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.name}</div>
                          <div style={{ fontSize: 10, color: t.txL }}>{w.country} · {w.price}{"\u00A0"}kr{w._sameGrape ? " · samma druva" : w._sameRegion ? " · samma region" : ""}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Premium actions */}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${t.bdrL}` }}>
            <StarRating nr={p.nr} auth={auth} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              <AlertButton nr={p.nr} wine={p} auth={auth} />
              <CellarButton nr={p.nr} auth={auth} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
