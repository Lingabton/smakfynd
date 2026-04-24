// src/components/Card.jsx
function Card({ p, rank, delay, totalInCategory, allProducts, autoOpen, auth }) {
  const [open, setOpen] = useState(!!autoOpen);
  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) track("click", { nr: p.nr, name: p.name, score: p.smakfynd_score, rank });
  };
  const sv = React.useContext(SavedContext);
  const icon = ({ Rött: "🍷", Vitt: "🥂", Rosé: "🌸", Mousserande: "🍾" })[p.category] || "✦";
  const s100 = p.smakfynd_score;
  const [label, col, emoji] = getScoreInfo(s100);
  const foodStr = (p.food_pairings || []).slice(0, 3).join(", ");
  const sbUrl = `https://www.systembolaget.se/produkt/vin/${p.nr}`;
  
  // Rank badges
  const badge = rank === 1 ? "Bästa köpet" : rank <= 3 ? `Topp ${rank}` : null;
  // Don't show rank numbers — just show wines as "Topp-viner" when scores are close

  return (
    <div
      role="button" tabIndex={0} aria-expanded={open}
      aria-label={`${p.name} ${p.sub || ''} — ${s100} poäng, ${p.price} kr`}
      onClick={handleOpen}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleOpen(); } }}
      style={{
        background: t.card, borderRadius: 14, outline: "none",
        border: `1px solid ${open ? t.bdr : t.bdrL}`,
        boxShadow: open ? t.sh3 : t.sh1,
        transition: "all 0.25s ease", overflow: "hidden",
        animation: `slideUp 0.35s ease ${delay}s both`,
        cursor: "pointer",
      }}
    >
      {/* Main row */}
      <div style={{ padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Product image with rank overlay */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <ProductImage p={p} size={52} eager={rank <= 3} />
          <div style={{
            position: "absolute", top: -4, left: -4,
            width: 20, height: 20, borderRadius: 6,
            background: rank <= 3 ? `linear-gradient(135deg, ${t.wine}, ${t.wineD})` : t.card,
            border: rank <= 3 ? "none" : `1px solid ${t.bdr}`,
            color: rank <= 3 ? "#fff" : t.txM,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 800, fontFamily: "'Instrument Serif', Georgia, serif",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}>
            {rank}
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Row 1: Name + score badge */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={{
                margin: 0, fontSize: 17, fontFamily: "'Instrument Serif', Georgia, serif",
                fontWeight: 400, color: t.tx, lineHeight: 1.2,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{p.name}</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: t.txL, letterSpacing: "0.01em" }}>
                {p.sub} · {p.country}{p.region ? `, ${p.region}` : ""}
              </p>
            </div>
            {/* Score badge with overlapping tags */}
            <div style={{ flexShrink: 0, textAlign: "center" }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                <svg width="50" height="50" viewBox="0 0 50 50" style={{ display: "block" }}>
                  <circle cx="25" cy="25" r="22" fill="#e8f0e4" />
                  <circle cx="25" cy="25" r="22" fill="none" stroke="#d4ddd0" strokeWidth="2.5" />
                  <circle cx="25" cy="25" r="22" fill="none" stroke="#2d6b3f" strokeWidth="2.5"
                    strokeDasharray={`${s100 * 1.38} 138`} strokeLinecap="round"
                    transform="rotate(-90 25 25)" style={{ transition: "stroke-dasharray 0.8s ease" }} />
                  <text x="25" y="30" textAnchor="middle" fontFamily="'Instrument Serif', Georgia, serif"
                    fontSize="19" fontWeight="900" fill="#2d6b3f">{s100}</text>
                </svg>
              {/* Overlapping mini-badges */}
              {(p.organic || p.price_vs_launch_pct > 0 || p.is_new) && (
                <div style={{ position: "absolute", top: -6, left: -14, display: "flex", gap: 2 }}>
                  {p.price_vs_launch_pct > 0 && <span style={{ fontSize: 8, fontWeight: 800, padding: "2px 5px", borderRadius: 4, background: t.deal, color: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>−{p.price_vs_launch_pct}%</span>}
                  {p.organic && <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 7px", borderRadius: 5, background: t.green, color: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", letterSpacing: "0.05em" }}>EKO</span>}
                  {p.is_new && <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 4, background: t.wine, color: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>NY</span>}
                </div>
              )}
              </div>
              <div style={{ fontSize: 9, fontWeight: 600, color: col, marginTop: 3 }}>{label}</div>
            </div>
          </div>

          {/* Row 2: Price + kr/l + grape + food */}
          <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: t.tx, fontFamily: "'Instrument Serif', Georgia, serif" }}>{p.price}<span style={{ fontSize: 11, fontWeight: 400, color: t.txL }}>kr</span></span>
            {p.vol && p.price && <span style={{ fontSize: 11, fontWeight: 600, color: t.txM, background: t.bg, padding: "1px 6px", borderRadius: 4 }}>{Math.round(p.price / (p.vol / 1000))} kr/l</span>}
            {p.launch_price && p.price_vs_launch_pct > 0 && (
              <span style={{ fontSize: 12, color: t.txL, textDecoration: "line-through" }}>{p.launch_price}kr</span>
            )}
            {(p.grape || foodStr) && <span style={{ color: t.bdr }}>·</span>}
            {p.grape && <span style={{ fontSize: 11, color: t.txM }}>{p.grape}</span>}
            {p.grape && foodStr && <span style={{ color: t.bdr }}>·</span>}
            {foodStr && <span style={{ fontSize: 11, color: t.txL }}>{foodStr}</span>}
          </div>

          {/* Row 3: Crowd/Expert bars */}
          <div style={{ marginTop: 8 }}>
            <ScoreBars p={p} />
          </div>

          {/* Row 3b: Why-chips — explain why this wine ranks high */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 5 }}>
            {p.expert_score >= 7.5 && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100, background: "#b07d3b10", color: "#b07d3b" }}>Expertbetyg</span>}
            {p.price_score >= 8 && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100, background: t.greenL, color: t.green }}>Prisvärt</span>}
            {(p.crowd_reviews || 0) >= 5000 && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100, background: "#6b8cce10", color: "#6b8cce" }}>Populärt</span>}
            {p.organic && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100, background: "#2d7a3e10", color: "#2d7a3e" }}>Eko</span>}
            {p.price_vs_launch_pct > 5 && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100, background: t.dealL, color: t.deal }}>Prissänkt</span>}
            {p.critics && p.critics.length >= 3 && p.critics.every(cr => cr.s >= 85) && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100, background: "#b07d3b10", color: "#b07d3b" }}>{p.critics.length} av {p.num_critics || p.critics.length} kritiker ger 85+</span>}
            {p.critic_consensus === "stark konsensus" && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100, background: "#b07d3b10", color: "#b07d3b" }}>Stark konsensus</span>}
            {p.critic_consensus === "kontroversiellt" && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100, background: "#ce6b6b10", color: "#ce6b6b" }}>Delade meningar</span>}
          </div>

          {/* Row 3c: Situation chips */}
          {(() => {
            const chips = [];
            if (p.food_pairings?.some(f => /lamm|grillat|kött/i.test(f)) && p.taste_body >= 7) chips.push("Fynd till grillat");
            else if (p.food_pairings?.some(f => /fisk|skaldjur/i.test(f)) && p.category === "Vitt") chips.push("Perfekt till fisk");
            if (p.price <= 100 && p.smakfynd_score >= 70) chips.push("Tryggt vardagsvin");
            if (p.crowd_reviews >= 10000 && p.crowd_score >= 7.5) chips.push("Tryggt middagsvin");
            if (p.price >= 200 && p.expert_score >= 8) chips.push("Imponera på middagen");
            return chips.length > 0 ? (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 3 }}>
                {chips.slice(0, 2).map(c => <span key={c} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100, background: `${t.wine}08`, color: t.wine, fontWeight: 500 }}>{c}</span>)}
              </div>
            ) : null;
          })()}

          {/* Row 4: Contextual insight + verdict */}
          {p.insight && (
            <div style={{ marginTop: 5, fontSize: 11, color: t.wine, lineHeight: 1.4, fontWeight: 500 }}>
              {p.insight}
            </div>
          )}
          <div style={{ marginTop: p.insight ? 2 : 5, fontSize: 11, color: t.txM, lineHeight: 1.4, fontStyle: "italic" }}>
            {(() => {
              const c = p.crowd_score || 0, e = p.expert_score || 0, pr = p.price_score || 0;
              const rev = p.crowd_reviews || 0;
              if (c >= 8.0 && pr >= 8) return "Publikfavorit till bra pris — få viner slår detta i prisklassen";
              if (c >= 8.0 && e >= 7.5) return "Omtyckt av både crowd och kritiker — tryggt val";
              if (c >= 8.0) return "Mycket omtyckt bland vindrickare";
              if (e >= 8.0 && pr >= 8) return "Kritikerfavorit till överraskande lågt pris";
              if (e >= 7.5 && pr >= 8) return "Bra expertbetyg och mer smak än prislappen antyder";
              if (e >= 7.5 && c >= 7.0) return "Uppskattat av både publik och kritiker";
              if (pr >= 9 && c >= 7.0) return "Mycket vin för pengarna — svårslaget i prisklassen";
              if (pr >= 8 && c >= 7.0) return "Bra köp för priset — bred uppskattning";
              if (pr >= 8) return "Prisvärt val med rimligt betyg";
              if (c >= 7.5 && rev >= 5000) return "Tryggt och populärt — många har provat och gillar";
              if (c >= 7.0) return "Solitt val med god crowd-uppskattning";
              return null;
            })()}
          </div>
        </div>
      </div>

      {/* Action row */}
      <div style={{
        padding: "0 18px 12px", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href={sbUrl} target="_blank" rel="noopener noreferrer" onClick={e => { e.stopPropagation(); track("sb_click", { nr: p.nr, name: p.name, price: p.price }); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 11, color: t.txM, textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = t.wine}
            onMouseLeave={e => e.currentTarget.style.color = t.txM}
            aria-label={`Köp ${p.name} på Systembolaget (öppnas i nytt fönster)`}
          >
            Systembolaget <span style={{ fontSize: 9 }} aria-hidden="true">↗</span>
          </a>
          {sv && <SaveButton nr={p.nr || p.id} sv={sv} auth={auth} />}
          <button onClick={e => {
              e.stopPropagation();
              track("share", { nr: p.nr, name: p.name });
              const url = `https://smakfynd.se/#vin/${p.nr}`;
              const text = `${p.name} ${p.sub || ''} — ${p.smakfynd_score}/100 på Smakfynd (${p.price}kr)`;
              if (navigator.share) {
                navigator.share({ title: p.name, text, url }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(`${text}\n${url}`);
              }
            }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 12, color: t.txL, background: "none", border: "none",
              cursor: "pointer", padding: "2px 0", fontFamily: "inherit",
            }}>
            <span style={{ fontSize: 13, lineHeight: 1 }}>↗</span> Dela
          </button>
        </div>
        <span style={{ fontSize: 10, color: t.txF, display: "flex", alignItems: "center", gap: 3 }}>
          {open ? "Stäng ▲" : "Se varför ▼"}
        </span>
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${t.bdrL}`, paddingTop: 14 }}>
          {/* Badges */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
            {badge && <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 100, background: rank === 1 ? `linear-gradient(135deg, #b08d40, #d4a84b)` : `${t.wine}15`, color: rank === 1 ? "#fff" : t.wine, textTransform: "uppercase", letterSpacing: "0.08em", boxShadow: rank === 1 ? "0 1px 4px rgba(176,141,64,0.3)" : "none" }}>{rank === 1 ? "🏆 " : ""}{badge}</span>}
            {p.confidence === "hög" && <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: t.greenL, color: t.green }}>Hög trygghet</span>}
            {p.price_vs_launch_pct > 0 && <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: t.dealL, color: t.deal, textTransform: "uppercase" }}>Prissänkt −{p.price_vs_launch_pct}%</span>}
            {p.organic && <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: t.greenL, color: t.green }}>Ekologiskt</span>}
            {p.food_pairings?.length > 0 && <span style={{ fontSize: 9, fontWeight: 500, padding: "3px 10px", borderRadius: 100, background: t.bg, color: t.txM, border: `1px solid ${t.bdrL}` }}>Passar till {p.food_pairings.slice(0,2).join(", ")}</span>}
          </div>
          {/* Quick taste description */}
          {p.style && <div style={{ fontSize: 12, color: t.txM, fontStyle: "italic", marginBottom: 10, lineHeight: 1.5 }}>{p.style}</div>}

          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <ProductImage p={p} size={56} style={{ borderRadius: 10, background: "#faf7f2" }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 11, color: t.txM, marginBottom: 6 }}>
                {[p.grape, p.alc ? `${p.alc}%` : null, `${p.vol} ml`, `${p.country}${p.region ? `, ${p.region}` : ""}`].filter(Boolean).map((v, i, arr) => (
                  <span key={i}>{v}{i < arr.length - 1 ? <span style={{ color: t.bdr, margin: "0 2px" }}>·</span> : ""}</span>
                ))}
              </div>
              {p.food_pairings?.length > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {p.food_pairings.map((f, i) => <span key={i} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 100, background: t.bg, color: t.txM, border: `1px solid ${t.bdrL}` }}>{f}</span>)}
                </div>
              )}
            </div>
          </div>

          {/* Taste profile — compact with verbal descriptor */}
          {(p.taste_body || p.taste_fruit || p.taste_sweet != null) && (
            <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 10, background: t.bg }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <span style={{ fontSize: 9, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em" }}>Smakprofil</span>
                <span style={{ fontSize: 11, color: t.txM, fontStyle: "italic" }}>{(() => {
                  const words = [];
                  if (p.taste_body >= 9) words.push("fylligt");
                  else if (p.taste_body >= 6) words.push("medelkroppad");
                  else if (p.taste_body && p.taste_body <= 4) words.push("lätt");
                  if (p.taste_fruit >= 9) words.push("fruktigt");
                  else if (p.taste_fruit && p.taste_fruit <= 3) words.push("stramt");
                  if (p.taste_sweet != null && p.taste_sweet <= 2) words.push("torrt");
                  else if (p.taste_sweet >= 8) words.push("sött");
                  return words.length > 0 ? words.join(", ") : null;
                })()}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["Lätt", "Fylligt", p.taste_body, 12],
                  ["Stram", "Fruktigt", p.taste_fruit, 12],
                  ["Torrt", "Sött", p.taste_sweet, 12],
                ].filter(([_a, _b, v]) => v != null && v > 0).map(([lo, hi, val, max]) => (
                  <div key={lo}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, color: t.txL, width: 40, textAlign: "right", flexShrink: 0 }}>{lo}</span>
                      <div style={{ flex: 1, height: 3, borderRadius: 2, background: t.bdr, position: "relative" }}>
                        <div style={{
                          position: "absolute", top: "50%", left: `${(val / max) * 100}%`,
                          width: 9, height: 9, borderRadius: "50%",
                          background: t.wine, border: `2px solid ${t.card}`,
                          transform: "translate(-50%, -50%)",
                          boxShadow: `0 0 0 1px ${t.wine}40`,
                        }} />
                      </div>
                      <span style={{ fontSize: 10, color: t.txL, width: 40, flexShrink: 0 }}>{hi}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score breakdown */}
          <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 10, background: t.bg }}>
            <div style={{ fontSize: 9, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Poängfördelning</div>
            <div style={{ display: "flex", gap: 12 }}>
              {/* Left: score bars */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Crowd */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#6b8cce" }}>Crowd</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: p.crowd_score ? "#6b8cce" : t.txL }}>{p.crowd_score ? `${p.crowd_score.toFixed(1)}/10` : "—"}</span>
                  </div>
                  {p.crowd_score && (
                    <div>
                      <div style={{ height: 4, borderRadius: 2, background: t.bdr, overflow: "hidden", marginBottom: 4 }}>
                        <div style={{ width: `${p.crowd_score * 10}%`, height: "100%", borderRadius: 2, background: "#6b8cce" }} />
                      </div>
                      <div style={{ fontSize: 10, color: t.txL }}>
                        {p.crowd_reviews ? `${p.crowd_reviews > 999 ? `${(p.crowd_reviews / 1000).toFixed(0)}k` : p.crowd_reviews} omdömen från vanliga vindrickare` : ""}
                        {p.crowd_reviews >= 50000 && <span style={{ color: t.green, fontWeight: 600 }}> — mycket pålitligt</span>}
                        {p.crowd_reviews >= 10000 && p.crowd_reviews < 50000 && <span style={{ color: t.txM }}> — pålitligt</span>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Expert */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#b07d3b" }}>Expert</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: p.expert_score ? "#b07d3b" : t.txL }}>{p.expert_score ? `${p.expert_score.toFixed(1)}/10` : "—"}</span>
                  </div>
                  {p.expert_score ? (
                    <div>
                      <div style={{ height: 4, borderRadius: 2, background: t.bdr, overflow: "hidden", marginBottom: 4 }}>
                        <div style={{ width: `${p.expert_score * 10}%`, height: "100%", borderRadius: 2, background: "#b07d3b" }} />
                      </div>
                      {p.critics && p.critics.length > 0 ? (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                          {p.critics.map((cr, ci) => (
                            <span key={ci} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#b07d3b10", color: "#b07d3b" }}>
                              {cr.c}: {cr.s}
                            </span>
                          ))}
                          {p.num_critics > (p.critics || []).length && (
                            <span style={{ fontSize: 9, padding: "2px 6px", color: t.txL }}>+{p.num_critics - p.critics.length} till</span>
                          )}
                          {p.critic_spread != null && (
                            <span style={{ fontSize: 9, padding: "2px 6px", color: p.critic_spread <= 4 ? t.green : p.critic_spread >= 12 ? "#ce6b6b" : t.txL }}>
                              Spridning: {p.critic_spread}p
                            </span>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: 10, color: t.txL }}>Snitt från erkända vinkritiker</div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, color: t.txL, fontStyle: "italic" }}>Inga kritikerrecensioner hittade för detta vin</div>
                  )}
                </div>

                {/* Price */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: t.txM }}>Prisvärde</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.txM }}>{p.price_score ? `${p.price_score.toFixed(1)}/10` : "—"}</span>
                  </div>
                  {p.price_score && (
                    <div>
                      <div style={{ height: 4, borderRadius: 2, background: t.bdr, overflow: "hidden", marginBottom: 4 }}>
                        <div style={{ width: `${p.price_score * 10}%`, height: "100%", borderRadius: 2, background: t.txM }} />
                      </div>
                      <div style={{ fontSize: 10, color: t.txL }}>
                        {(() => {
                          const catMedians = { "Rött": 279, "Vitt": 239, "Rosé": 160, "Mousserande": 399 };
                          const catNames = { "Rött": "rött vin", "Vitt": "vitt vin", "Rosé": "rosévin", "Mousserande": "mousserande" };
                          const median = catMedians[p.category] || 250;
                          return `${p.price}kr · Medianen för ${catNames[p.category] || "vin"}: ${median}kr`;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: total score */}
              <div style={{ textAlign: "center", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: `linear-gradient(135deg, ${col}18, ${col}08)`,
                  border: `2px solid ${col}30`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: col, lineHeight: 1, fontFamily: "'Instrument Serif', Georgia, serif" }}>{s100}</span>
                </div>
                <span style={{ fontSize: 9, color: t.txL, marginTop: 4 }}>Smak för</span>
                <span style={{ fontSize: 9, color: t.txL }}>pengarna</span>
              </div>
            </div>
          </div>

          {/* Price drop info */}
          {p.launch_price && p.price_vs_launch_pct > 0 && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: t.dealL, marginBottom: 14, fontSize: 13, color: t.deal, lineHeight: 1.5 }}>
              Lanserades för <strong>{p.launch_price} kr</strong> — nu {p.price} kr. Du sparar {p.launch_price - p.price} kr per flaska.
            </div>
          )}

          {/* Similar wines with reasons */}
          {allProducts && (() => {
            // Taste similarity: how close are body, fruit, sweet profiles?
            const tasteSim = (a, b) => {
              let score = 0, count = 0;
              if (a.taste_body && b.taste_body) { score += 1 - Math.abs(a.taste_body - b.taste_body) / 12; count++; }
              if (a.taste_fruit && b.taste_fruit) { score += 1 - Math.abs(a.taste_fruit - b.taste_fruit) / 12; count++; }
              if (a.taste_sweet != null && b.taste_sweet != null) { score += 1 - Math.abs(a.taste_sweet - b.taste_sweet) / 12; count++; }
              return count > 0 ? score / count : 0;
            };

            const similar = allProducts
              .filter(w => w.category === p.category && w.package === p.package
                && w.assortment === "Fast sortiment"
                && (w.nr || w.id) !== (p.nr || p.id)
)
              .map(w => {
                // Calculate similarity score
                let sim = 0;
                const taste = tasteSim(w, p);
                sim += taste * 40; // taste profile most important (0-40)
                if (w.grape && p.grape && w.grape.toLowerCase() === p.grape.toLowerCase()) sim += 20; // same grape
                if (w.cat3 && p.cat3 && w.cat3 === p.cat3) sim += 15; // same style (e.g. "Fruktigt & Smakrikt")
                if (w.country && p.country && w.country === p.country) sim += 5; // same country
                if (w.region && p.region && w.region === p.region) sim += 10; // same region
                if (Math.abs(w.price - p.price) <= 30) sim += 5; // similar price
                // Score matters: bonus for better, penalty for worse
                sim += (w.smakfynd_score - p.smakfynd_score) * 2;
                return { ...w, _sim: sim, _taste: taste };
              })
              .filter(w => w._sim >= 20) // minimum similarity threshold
              .sort((a, b) => b._sim - a._sim)
              .slice(0, 3)
              .map(w => {
                // Generate reason WHY this is recommended
                const reasons = [];
                if (w._taste >= 0.8) reasons.push("Liknande smakprofil");
                if (w.grape && p.grape && w.grape.toLowerCase() === p.grape.toLowerCase()) reasons.push("Samma druva");
                if (w.cat3 && p.cat3 && w.cat3 === p.cat3 && !reasons.length) reasons.push("Samma stil");
                if (w.region && p.region && w.region === p.region) reasons.push("Samma region");
                if (w.price < p.price - 10) reasons.push(`${Math.round(p.price - w.price)}kr billigare`);
                if (w.smakfynd_score > p.smakfynd_score + 2) reasons.push("Bättre värde per krona");
                else if (w.smakfynd_score > p.smakfynd_score) reasons.push("Högre poäng");
                if ((w.expert_score || 0) > (p.expert_score || 0) + 0.5) reasons.push("Starkare expertstöd");
                return { ...w, _reason: reasons.slice(0, 2).join(" · ") || "Liknande stil och prisklass" };
              });
            if (similar.length === 0) return null;
            return (
              <div style={{ marginBottom: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.tx, marginBottom: 8 }}>Gillar du {p.name}? Testa även</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {similar.map((w, i) => (
                    <div key={i}
                      onClick={e => { e.stopPropagation(); window.location.hash = `vin/${w.nr}`; window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: t.bg, border: `1px solid ${t.bdrL}`, textDecoration: "none", transition: "border-color 0.2s", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = t.wine + "40"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = t.bdrL}
                    >
                      <svg width="34" height="34" viewBox="0 0 50 50" style={{ flexShrink: 0 }}>
                        <circle cx="25" cy="25" r="22" fill="#e8f0e4" />
                        <circle cx="25" cy="25" r="22" fill="none" stroke="#d4ddd0" strokeWidth="2.5" />
                        <circle cx="25" cy="25" r="22" fill="none" stroke="#2d6b3f" strokeWidth="2.5"
                          strokeDasharray={`${w.smakfynd_score * 1.38} 138`} strokeLinecap="round"
                          transform="rotate(-90 25 25)" />
                        <text x="25" y="30" textAnchor="middle" fontFamily="'Instrument Serif', Georgia, serif"
                          fontSize="16" fontWeight="900" fill="#2d6b3f">{w.smakfynd_score}</text>
                      </svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontFamily: "'Instrument Serif', serif", color: t.tx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.name}</div>
                        <div style={{ fontSize: 10, color: t.txL }}>{w.sub} · {w.country}</div>
                        <div style={{ fontSize: 10, color: t.green, marginTop: 2, fontWeight: 500 }}>{w._reason}</div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: t.tx, fontFamily: "'Instrument Serif', serif" }}>
                          {w.price}<span style={{ fontSize: 9, fontWeight: 400, color: t.txL }}>kr</span>
                        </span>
                        <a href={`https://www.systembolaget.se/produkt/vin/${w.nr}`} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ fontSize: 9, color: t.txL, textDecoration: "none" }}>SB ↗</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

        </div>
      )}
    </div>
  );
}
