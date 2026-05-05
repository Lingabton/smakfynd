// src/App.jsx
function Smakfynd() {
  const [ageOk, setAgeOk] = useState(() => {
    try { return localStorage.getItem("smakfynd_age") === "ok"; } catch(e) { return false; }
  });
  const confirmAge = () => {
    try { localStorage.setItem("smakfynd_age", "ok"); } catch(e) {}
    setAgeOk(true);
  };
  if (!ageOk) return <AgeGate onConfirm={confirmAge} />;

  return <SmakfyndApp />;
}

// Hash routing: read initial state from URL hash
function parseHash() {
  const hash = window.location.hash.slice(1); // remove #
  if (!hash) return {};
  if (hash.startsWith('vin/')) return { openWine: hash.slice(4) };
  const catMap = { rott: 'Rött', vitt: 'Vitt', rose: 'Rosé', bubbel: 'Mousserande', alla: 'all' };
  if (catMap[hash]) return { cat: catMap[hash] };
  return { search: decodeURIComponent(hash) };
}

function SmakfyndApp() {
  const sv = useSaved();
  const auth = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const initHash = useMemo(() => parseHash(), []);
  const [showSaved, setShowSaved] = useState(false);
  const [storeMode, setStoreMode] = useState(false);
  const [cat, setCat] = useState(initHash.cat || "Rött");
  const [price, setPrice] = useState("all");
  const [search, setSearch] = useState(initHash.search || "");
  const [showNew, setShowNew] = useState(false);
  const [showDeals, setShowDeals] = useState(false);
  const [panel, setPanel] = useState(null);
  const [faqOpen, setFaqOpen] = useState(null);
  const [pkg, setPkg] = useState("Flaska");
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [openWineNr, setOpenWineNr] = useState(initHash.openWine || null);
  const [autoOpenNr, setAutoOpenNr] = useState(initHash.openWine || null);

  // Load data with retry
  useEffect(() => {
    async function loadData(attempt = 1) {
      // Try fetching from URL
      if (DATA_URL) {
        try {
          const res = await fetch(DATA_URL);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (!Array.isArray(data) || data.length < 10) throw new Error("Bad data");
          setAllData(data);
          setLoading(false);
          setLoadError(null);
          return;
        } catch(e) {
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
            return loadData(attempt + 1);
          }
          setLoadError(navigator.onLine ? "Kunde inte ladda vindata." : "Ingen internetanslutning.");
        }
      }

      setLoading(false);
    }
    loadData();
  }, []);

  // Map fields from web JSON format to component format
  const products = useMemo(() => {
    return allData.map((p, i) => ({
      ...p,
      id: p.nr || String(i),
      category: p.type || '',
      style: p.cat3 || p.style || '',
      food_pairings: typeof p.food_pairings === 'string'
        ? p.food_pairings.split(',').map(s => s.trim()).filter(Boolean)
        : (p.food_pairings || []),
      package: p.pkg || 'Flaska',
    })).sort((a, b) => b.smakfynd_score - a.smakfynd_score);
  }, [allData]);
  const totalReviews = products.reduce((sum, p) => sum + (p.crowd_reviews || 0), 0);
  const reviewsStr = totalReviews > 1000000 ? `${(totalReviews / 1000000).toFixed(1)}M` : totalReviews > 1000 ? `${Math.round(totalReviews / 1000)}K` : String(totalReviews);
  const countries = [...new Set(products.map(p => p.country).filter(Boolean))].length;

  // Handle #vin/nr hash — search for the wine when data loads
  useEffect(() => {
    if (openWineNr && products.length > 0) {
      const wine = products.find(p => String(p.nr) === String(openWineNr));
      if (wine) {
        setSearch(wine.name);
        setCat("all");
        // Scroll to wine card after render
        setTimeout(() => {
          const el = document.querySelector('[aria-expanded]');
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 500);
      }
      setOpenWineNr(null);
    }
  }, [openWineNr, products]);

  // Listen for hash changes (from similar wine clicks)
  useEffect(() => {
    const onHash = () => {
      const h = parseHash();
      if (h.openWine && products.length > 0) {
        const wine = products.find(p => String(p.nr) === String(h.openWine));
        if (wine) {
          setSearch(wine.name);
          setCat("all");
          setAutoOpenNr(h.openWine);
          // Scroll to wine list after render
          setTimeout(() => {
            const el = document.querySelector('[aria-expanded]');
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 300);
        }
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [products]);

  // Update hash on category change
  useEffect(() => {
    const catMap = { Rött: 'rott', Vitt: 'vitt', Rosé: 'rose', Mousserande: 'bubbel', all: 'alla' };
    if (!search && catMap[cat]) {
      history.replaceState(null, '', '#' + catMap[cat]);
    }
  }, [cat]);

  // Track searches (debounced)
  useEffect(() => {
    if (!search || search.length < 2) return;
    const timer = setTimeout(() => trackSearch(search, filtered?.length || 0), 1500);
    return () => clearTimeout(timer);
  }, [search]);

  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => { setShowBackToTop(window.scrollY > 800); ticking = false; });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [searchFocused, setSearchFocused] = useState(false);
  const [showEco, setShowEco] = useState(false);
  const [showBest, setShowBest] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selCountry, setSelCountry] = useState(null);
  const [selFoods, setSelFoods] = useState([]);
  const [sortBy, setSortBy] = useState("smakfynd");
  const [selRegion, setSelRegion] = useState(null);
  const [selTaste, setSelTaste] = useState(null);

  const toggleFood = (f) => setSelFoods(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const filtered = useMemo(() => {
    let r = [...products];
    if (!showBest) r = r.filter(p => p.assortment === "Fast sortiment");
    r = r.filter(p => p.package === pkg);
    if (cat !== "all") r = r.filter(p => p.category === cat);
    if (price !== "all") { const [a, b] = price.split("-").map(Number); r = r.filter(p => p.price >= a && p.price <= b); }
    if (search) { const q = search.toLowerCase(); r = r.filter(p => [p.name, p.sub, p.country, p.grape, p.style, p.organic ? "eko ekologisk organic" : ""].some(f => (f || "").toLowerCase().includes(q))); }
    if (showNew) r = r.filter(p => p.is_new);
    if (showDeals) r = r.filter(p => p.price_vs_launch_pct > 0);
    if (showEco) r = r.filter(p => p.organic);
    if (selCountry) r = r.filter(p => p.country === selCountry);
    if (selFoods.length > 0) r = r.filter(p => selFoods.some(f => (p.food_pairings || []).some(fp => fp.toLowerCase().includes(f.toLowerCase()))));
    if (selRegion) r = r.filter(p => p.region === selRegion);
    if (selTaste) {
      const tasteFilters = { "Fylligt": p => (p.taste_body || 0) >= 8, "Lätt": p => (p.taste_body || 12) <= 5, "Fruktigt": p => (p.taste_fruit || 0) >= 8, "Torrt": p => (p.taste_sweet || 12) <= 3 };
      if (tasteFilters[selTaste]) r = r.filter(tasteFilters[selTaste]);
    }
    if (sortBy === "expert") r.sort((a, b) => (b.expert_score || 0) - (a.expert_score || 0));
    else if (sortBy === "crowd") r.sort((a, b) => (b.crowd_score || 0) - (a.crowd_score || 0));
    else if (sortBy === "price_asc") r.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === "price_desc") r.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === "drop") r.sort((a, b) => (b.price_vs_launch_pct || 0) - (a.price_vs_launch_pct || 0));
    return r;
  }, [products, cat, price, search, showNew, showDeals, pkg, showEco, showBest, selCountry, selFoods, selRegion, selTaste, sortBy]);

  const baseFiltered = useMemo(() => {
    let r = products;
    if (!showBest) r = r.filter(p => p.assortment === "Fast sortiment");
    r = r.filter(p => p.package === pkg);
    if (cat !== "all") r = r.filter(p => p.category === cat);
    return r;
  }, [products, showBest, pkg, cat]);
  const newN = baseFiltered.filter(p => p.is_new).length;
  const dealN = baseFiltered.filter(p => p.price_vs_launch_pct > 0).length;
  const ecoN = baseFiltered.filter(p => p.organic).length;
  const hasFilters = search || cat !== "all" || price !== "all" || showNew || showDeals || showEco || selCountry || selFoods.length > 0 || selRegion || selTaste || sortBy !== "smakfynd";
  const hasNonCatFilters = price !== "all" || showNew || showDeals || showEco || selCountry || selFoods.length > 0 || selRegion || selTaste || pkg !== "Flaska";
  const searchCompact = hasNonCatFilters && !search && !searchFocused;

  const clearAll = () => { setSearch(""); setCat("all"); setPrice("all"); setShowNew(false); setShowDeals(false); setShowEco(false); setSelCountry(null); setSelFoods([]); setShowBest(false); setSelRegion(null); setSelTaste(null); setSortBy("smakfynd"); };

  const savedWines = useMemo(() => {
    return products.filter(p => sv.isSaved(p.nr || p.id)).sort((a, b) => b.smakfynd_score - a.smakfynd_score);
  }, [products, sv.data]);
  const [savedListFilter, setSavedListFilter] = useState("all");

  return (
    <SavedContext.Provider value={sv}>
    <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    {storeMode && <StoreMode products={products} onClose={() => setStoreMode(false)} />}
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: t.sans, display: storeMode ? "none" : "block" }}>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:scale(1) } }
        ::selection { background: ${t.wine}20 }
        input::placeholder { color: ${t.txF} }
        *::-webkit-scrollbar { display: none }
        * { scrollbar-width: none; box-sizing: border-box; }
        a { transition: color 0.15s ease; color: ${t.txM}; }
        button { transition: all 0.15s ease; }
        .tabnum { font-variant-numeric: tabular-nums; }
        img { transition: opacity 0.3s ease; }
        [role="button"]:focus-visible, button:focus-visible, a:focus-visible, input:focus-visible {
          outline: 2px solid ${t.wine}60;
          outline-offset: 2px;
        }
        @media (max-width: 480px) {
          header { padding: 10px 16px 0 !important; }
        }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <header style={{ padding: "12px 20px 0", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <svg width="22" height="22" viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill={t.wine}/><text x="20" y="27" textAnchor="middle" fontFamily="Georgia,serif" fontSize="18" fill="#f5ede3" fontWeight="400">S</text></svg>
            <span style={{ fontFamily: t.serif, fontSize: 20, color: t.wine }}>Smakfynd</span>
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 12, color: t.txL }}>
            {[["saved", `Sparade${sv.count ? ` (${sv.count})` : ""}`], ["about", "Om"],
              [auth.user ? "profile" : "login", auth.user ? "Min sida" : "Logga in"]].map(([k, l]) => (
              <span key={k} onClick={() => {
                  if (k === "login") { setShowLogin(true); return; }
                  if (k === "profile") { setPanel(panel === "profile" ? null : "profile"); return; }
                  setPanel(panel === k ? null : k);
                }}
                style={{ cursor: "pointer", color: k === "login" ? t.wine : t.txL, fontWeight: panel === k ? 600 : 400, padding: "8px 0", minHeight: 44, display: "inline-flex", alignItems: "center" }}
              >{l}</span>
            ))}
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 20px 0", textAlign: "center" }}>
        <h1 style={{
          margin: "0 0 6px", fontFamily: "'Newsreader', Georgia, serif", fontWeight: 400,
          fontSize: "clamp(32px, 6vw, 56px)", color: t.tx, lineHeight: 1.1, letterSpacing: "-0.02em",
        }}>
          Bästa köpet i sin kategori
        </h1>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: t.txL }}>
          {products.length > 100 ? `${(Math.round(products.length / 100) * 100).toLocaleString("sv-SE")}+` : ""} viner på Systembolaget, rankade efter värde
        </p>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px 80px" }}>

        {/* ═══ PANELS ═══ */}
        {panel === "about" && (
          <div style={{ padding: 22, borderRadius: 16, background: t.card, border: `1px solid ${t.bdr}`, marginBottom: 20, animation: "scaleIn 0.25s ease" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 22, fontFamily: t.serif, fontWeight: 400, color: t.tx }}>Om Smakfynd</h2>
            <p style={{ fontSize: 14, color: t.txM, lineHeight: 1.7, margin: "0 0 12px" }}>
              Systembolaget har tusentals viner. Vi hjälper dig hitta de som faktiskt är värda pengarna. Vi kombinerar <strong>crowd-betyg</strong> från hundratusentals vindrickare, <strong>expertrecensioner</strong> från internationella kritiker och <strong>prisjämförelse</strong> inom varje kategori.
            </p>
            <p style={{ fontSize: 14, color: t.txM, lineHeight: 1.7, margin: "0 0 14px" }}>
              Resultatet: <strong>en enda poäng</strong> som visar kvalitet per krona. Inte det "bästa" vinet — utan det bästa <em>köpet</em>.
            </p>
            <div style={{ padding: 16, borderRadius: 12, background: t.bg, marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontFamily: t.serif, color: t.tx, marginBottom: 4 }}>Gabriel Linton</div>
              <p style={{ fontSize: 13, color: t.txM, lineHeight: 1.6, margin: 0 }}>
                Jag har pluggat dryckeskunskap i Grythyttan, forskar i innovation vid Universitetet i Innlandet i Norge och har en MBA från Cleveland State.
              </p>
              <p style={{ fontSize: 13, color: t.txM, lineHeight: 1.6, margin: "8px 0 0" }}>
                Smakfynd började för att jag tyckte det var onödigt svårt att hitta bra vin på Systembolaget. All data fanns redan, crowd-betyg, kritikerrecensioner, priser, men ingen hade satt ihop det. Jag ville ha ett verktyg som tar hänsyn till priset, inte bara kvaliteten. Så jag byggde det.
              </p>
            </div>
            <p style={{ fontSize: 12, color: t.txL, margin: 0 }}>Olav Innovation AB · Oberoende informationstjänst · Ingen koppling till Systembolaget · Vi säljer inte alkohol</p>

            <div style={{ padding: 16, borderRadius: 12, background: `${t.wine}06`, border: `1px solid ${t.wine}12`, marginTop: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.tx, marginBottom: 4 }}>Stöd Smakfynd</div>
              <p style={{ fontSize: 12, color: t.txM, margin: "0 0 8px", lineHeight: 1.5 }}>
                Smakfynd är gratis och oberoende — inga annonser, inga sponsrade placeringar. Om du tycker om tjänsten kan du bjuda oss på ett glas.
              </p>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.wine }}>Swish: 0730-910551</div>
              <div style={{ fontSize: 10, color: t.txF, marginTop: 4 }}>Alla bidrag går till servrar, data och utveckling.</div>
            </div>

            <button onClick={() => setPanel(null)} style={{ marginTop: 12, fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Stäng</button>
          </div>
        )}

        {panel === "method" && (
          <div style={{ padding: 22, borderRadius: 16, background: t.card, border: `1px solid ${t.bdr}`, marginBottom: 20, animation: "scaleIn 0.25s ease" }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 22, fontFamily: t.serif, fontWeight: 400, color: t.tx }}>Så beräknas poängen</h2>

            {/* The three components */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {[
                ["👥", "Crowd-betyg", "Betyg från hundratusentals vanliga vindrickare. Viner med fler omdömen väger tyngre. Viner med färre än 25 omdömen rankas inte alls."],
                ["🏆", "Expertrecensioner", "Poäng från erkända vinkritiker som James Suckling, Decanter, Falstaff och Wine Enthusiast. Om crowd och experter är överens får vinet en extra bonus."],
                ["💰", "Prisvärde", "Literpriset jämförs mot medianen i samma kategori. Rött jämförs med rött — aldrig med bubbel. Billigare än snittet med samma kvalitet = högre poäng."],
              ].map(([icon, title, desc], i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.tx, marginBottom: 2 }}>{title}</div>
                    <p style={{ fontSize: 13, color: t.txM, lineHeight: 1.6, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: 14, borderRadius: 10, background: t.bg, marginBottom: 16, border: `1px solid ${t.bdrL}` }}>
              <div style={{ fontSize: 13, color: t.tx, lineHeight: 1.7 }}>
                <strong>Hög kvalitet till lågt pris = hög poäng.</strong> Kvalitet går alltid före pris — ett billigt vin med dåligt betyg kan aldrig hamna högt.
              </div>
            </div>

            {/* Transparency section */}
            <h3 style={{ margin: "0 0 10px", fontSize: 15, fontFamily: t.serif, fontWeight: 400, color: t.tx }}>Transparens</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {[
                ["Datakällor", "Crowd-betyg hämtas från internationella vindrickare. Expertpoäng kommer från Wine Enthusiast (130 000 recensioner) och Wine-Searcher (aggregat från flera kritiker). Prisdata från Systembolaget."],
                ["Osäker matchning", "Vi matchar viner mot kritiker-databaser med namn och region. Ibland blir det fel — vi kräver ordöverlapp och filtrerar bort osäkra matchningar. Viner utan expertmatch rankas bara på crowd + pris."],
                ["Vad poängen inte betyder", "Hög poäng betyder inte att vinet passar just dig — det betyder att det ger bra kvalitet för pengarna enligt crowd och experter. Smak är personligt. Använd smakprofilen och AI-matcharen för att hitta rätt."],
                ["Ekologiskt", "Ekologiska viner får en liten poängbonus (+0.2 av 10). Det räcker inte för att lyfta ett dåligt vin, men vid lika kvalitet vinner eko."],
              ].map(([title, desc], i) => (
                <div key={i}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: t.tx, marginBottom: 2 }}>{title}</div>
                  <p style={{ fontSize: 12, color: t.txM, lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>

            <button onClick={() => setPanel(null)} style={{ marginTop: 4, fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Stäng</button>
          </div>
        )}

        {panel === "faq" && (
          <div style={{ marginBottom: 20, animation: "scaleIn 0.25s ease" }}>
            {FAQS.map((f, i) => (
              <div key={i} onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                style={{
                  padding: "14px 18px",
                  borderRadius: i === 0 ? "16px 16px 0 0" : i === FAQS.length - 1 ? "0 0 16px 16px" : 0,
                  background: t.card, border: `1px solid ${t.bdr}`,
                  borderTop: i > 0 ? "none" : undefined, cursor: "pointer",
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: t.tx }}>{f.q}</span>
                  <span style={{ color: t.txL, fontSize: 16, transition: "transform 0.2s", transform: faqOpen === i ? "rotate(45deg)" : "none" }}>+</span>
                </div>
                {faqOpen === i && <p style={{ fontSize: 13, color: t.txM, margin: "10px 0 0", lineHeight: 1.65 }}>{f.a}</p>}
              </div>
            ))}
            <button onClick={() => setPanel(null)} style={{ marginTop: 10, fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Stäng</button>
          </div>
        )}

        {panel === "saved" && (
          <div style={{ padding: 22, borderRadius: 16, background: t.card, border: `1px solid ${t.bdr}`, marginBottom: 20, animation: "scaleIn 0.25s ease" }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 22, fontFamily: t.serif, fontWeight: 400, color: t.tx }}>Mina viner</h2>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: t.txL }}>Sparas i webbläsaren. Logga in (kommer snart) för att synka.</p>

            {/* List tabs */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
              <button onClick={() => setSavedListFilter("all")}
                style={{ ...pill(savedListFilter === "all", t.wine), fontSize: 12, padding: "6px 12px" }}>
                Alla ({sv.count})
              </button>
              {LISTS.map(list => {
                const cnt = sv.inList(list.k).length;
                if (cnt === 0) return null;
                return (
                  <button key={list.k} onClick={() => setSavedListFilter(list.k)}
                    style={{ ...pill(savedListFilter === list.k, t.wine), fontSize: 12, padding: "6px 12px" }}>
                    {list.i} {list.l} ({cnt})
                  </button>
                );
              })}
            </div>

            {savedWines.length === 0 ? (
              <p style={{ fontSize: 14, color: t.txM, fontStyle: "italic" }}>Inga sparade viner ännu. Tryck ♡ på ett vin för att spara det.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {savedWines
                  .filter(p => savedListFilter === "all" || sv.isInList(p.nr || p.id, savedListFilter))
                  .map((p, i) => <Card key={p.id || i} p={p} rank={i + 1} delay={0} allProducts={products} auth={auth} />)}
              </div>
            )}
            <button onClick={() => setPanel(null)} style={{ marginTop: 12, fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Stäng</button>
          </div>
        )}

        {panel === "profile" && <Profile products={products} auth={auth} onClose={() => setPanel(null)} />}

        {/* ═══ JOB 1: VIN TILL IKVÄLL ═══ */}
        <div id="section-food" style={{ marginBottom: 20 }}>
          <FoodMatch products={products} />
        </div>

        {/* ═══ JOB 2: SNABBKOLLEN ═══ */}
        <button onClick={() => setStoreMode(true)}
          style={{
            display: "flex", alignItems: "center", gap: 14, width: "100%",
            padding: "16px 20px", borderRadius: 16, border: `2px solid ${t.wine}25`,
            background: t.card, cursor: "pointer", fontFamily: "inherit",
            marginBottom: 24, transition: "all 0.2s", textAlign: "left",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = t.wine + "50"; e.currentTarget.style.boxShadow = `0 4px 16px ${t.wine}10`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = t.wine + "25"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${t.wine}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={t.wine} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: t.tx, fontFamily: t.serif }}>Sök eller skanna vin</div>
            <div style={{ fontSize: 12, color: t.txM }}>Hitta poäng, pris och bättre alternativ direkt</div>
          </div>
          <span style={{ fontSize: 18, color: t.txL }}>→</span>
        </button>

        {/* ═══ JOB 3: BROWSA TOPPEN — search + filters + list ═══ */}
        <div style={{ borderTop: `1px solid ${t.bdrL}`, paddingTop: 20, marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Browsa alla viner</div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 10 }}>
          <label htmlFor="sf-search" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>Sök vin</label>
          <input id="sf-search" type="search" placeholder="Sök vin, druva, land, stil..." value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "12px 16px 12px 40px", borderRadius: 12,
              border: `1px solid ${t.bdr}`, background: t.card, fontSize: 14,
              color: t.tx, outline: "none", boxSizing: "border-box",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={e => { setSearchFocused(true); e.target.style.borderColor = t.wine + "40"; e.target.style.boxShadow = `0 0 0 3px ${t.wine}08`; }}
            onBlur={e => { setSearchFocused(false); e.target.style.borderColor = t.bdr; e.target.style.boxShadow = "none"; }}
          />
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: t.txL, pointerEvents: "none" }}>⌕</span>
        </div>

        {/* ═══ CATEGORY PILLS ═══ */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
          {CATS.map(ct => (
            <button key={ct.k} onClick={() => { setCat(ct.k); track("filter", { type: "category", value: ct.k }); }} style={pill(cat === ct.k)}>
              {ct.l}
            </button>
          ))}
        </div>

        {/* ═══ ACTIVE FILTER CHIPS ═══ */}
        {hasNonCatFilters ? (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
            {price !== "all" && <span onClick={() => setPrice("all")} style={{ ...pill(true), cursor: "pointer", fontSize: 11 }}>{PRICES.find(p => p.k === price)?.l} ✕</span>}
            {pkg !== "Flaska" && <span onClick={() => setPkg("Flaska")} style={{ ...pill(true), cursor: "pointer", fontSize: 11 }}>{pkg === "BiB" ? "Bag-in-box" : "Storpack"} ✕</span>}
            {showEco && <span onClick={() => setShowEco(false)} style={{ ...pill(true, t.green), cursor: "pointer", fontSize: 11 }}>Ekologiskt ✕</span>}
            {showDeals && <span onClick={() => { setShowDeals(false); if (sortBy === "drop") setSortBy("smakfynd"); }} style={{ ...pill(true, t.deal), cursor: "pointer", fontSize: 11 }}>Prissänkt ✕</span>}
            {showNew && <span onClick={() => setShowNew(false)} style={{ ...pill(true), cursor: "pointer", fontSize: 11 }}>Nyheter ✕</span>}
            {selCountry && <span onClick={() => setSelCountry(null)} style={{ ...pill(true), cursor: "pointer", fontSize: 11 }}>{selCountry} ✕</span>}
            {selRegion && <span onClick={() => setSelRegion(null)} style={{ ...pill(true), cursor: "pointer", fontSize: 11 }}>{selRegion} ✕</span>}
            {selTaste && <span onClick={() => setSelTaste(null)} style={{ ...pill(true), cursor: "pointer", fontSize: 11 }}>{selTaste} ✕</span>}
            {selFoods.map(f => <span key={f} onClick={() => toggleFood(f)} style={{ ...pill(true), cursor: "pointer", fontSize: 11 }}>{f} ✕</span>)}
            <button onClick={clearAll} style={{ fontSize: 11, color: t.txL, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>Rensa alla</button>
            <button onClick={() => setShowAdvanced(!showAdvanced)} style={{ fontSize: 11, color: t.txM, background: "none", border: `1px solid ${t.bdrL}`, borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit", marginLeft: "auto" }}>
              {showAdvanced ? "Dölj filter" : "+ Filter"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <button onClick={() => setShowAdvanced(!showAdvanced)} style={{ ...pill(showAdvanced), display: "flex", alignItems: "center", gap: 4 }}>
              Filter <span style={{ fontSize: 10, transition: "transform 0.2s", display: "inline-block", transform: showAdvanced ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
            </button>
          </div>
        )}

        {showAdvanced && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12, padding: "14px 16px", borderRadius: 14, background: t.card, border: `1px solid ${t.bdrL}` }}>
            {/* Package */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Förpackning</div>
              <div style={{ display: "flex", gap: 4, background: t.bdrL, borderRadius: 100, padding: 3, width: "fit-content" }}>
                {[["Flaska", "Flaskor"], ["BiB", "Bag-in-box"], ["Stor", "Storpack"]].map(([k, l]) => (
                  <button key={k} onClick={() => setPkg(k)} style={{
                    padding: "7px 16px", borderRadius: 100, border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: pkg === k ? 600 : 400, fontFamily: "inherit",
                    background: pkg === k ? t.card : "transparent",
                    color: pkg === k ? t.tx : t.txL,
                    boxShadow: pkg === k ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}>{l}</button>
                ))}
              </div>
            </div>
            {/* Price */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pris</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {PRICES.filter(pr => pr.k !== "all").map(({ k, l }) => {
                  const cnt = products.filter(w => { const [a, b] = k.split("-").map(Number); return w.price >= a && w.price <= b; }).length;
                  return <button key={k} onClick={() => { setPrice(price === k ? "all" : k); }} style={pill(price === k)}>{l} <span style={{ fontSize: 10, color: t.txF }}>({cnt})</span></button>;
                })}
              </div>
            </div>
            {/* Toggles */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Filter</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                <button onClick={() => setShowEco(!showEco)} style={pill(showEco, t.green)}>Ekologiskt ({ecoN})</button>
                <button onClick={() => { setShowNew(!showNew); if (!showNew) setShowDeals(false); }} style={pill(showNew)}>Nyheter ({newN})</button>
                <button onClick={() => { const next = !showDeals; setShowDeals(next); if (next) { setShowNew(false); setSortBy("drop"); } else if (sortBy === "drop") setSortBy("smakfynd"); }} style={pill(showDeals, t.deal)}>Prissänkt ({dealN})</button>
              </div>
            </div>
            {/* Country → Region hierarchical */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Land</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {["Italien", "Frankrike", "Spanien", "USA", "Tyskland", "Sydafrika", "Chile", "Portugal", "Australien", "Argentina", "Nya Zeeland", "\u00d6sterrike"].map(c => {
                  const cnt = products.filter(w => w.country === c).length;
                  return <button key={c} onClick={() => { setSelCountry(selCountry === c ? null : c); setSelRegion(null); }} style={pill(selCountry === c)}>{c} ({cnt})</button>;
                })}
              </div>
              {selCountry && (() => {
                const regions = [...new Set(products.filter(w => w.country === selCountry && w.region).map(w => w.region))].sort();
                if (regions.length === 0) return null;
                return (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6, paddingLeft: 12, borderLeft: `2px solid ${t.wine}30` }}>
                    {regions.slice(0, 10).map(rg => {
                      const cnt = products.filter(w => w.country === selCountry && w.region === rg).length;
                      return <button key={rg} onClick={() => setSelRegion(selRegion === rg ? null : rg)} style={pill(selRegion === rg)}>{rg} ({cnt})</button>;
                    })}
                  </div>
                );
              })()}
            </div>
            {/* Food */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Passar till</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {["Kött", "Fågel", "Fisk", "Skaldjur", "Fläsk", "Grönsaker", "Ost", "Vilt", "Pasta", "Lamm"].map(f => (
                  <button key={f} onClick={() => toggleFood(f)} style={pill(selFoods.includes(f))}>{f}</button>
                ))}
              </div>
            </div>
            {/* Taste */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Smak</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {["Fylligt", "Lätt", "Fruktigt", "Torrt"].map(ts => (
                  <button key={ts} onClick={() => setSelTaste(selTaste === ts ? null : ts)} style={pill(selTaste === ts)}>{ts}</button>
                ))}
              </div>
            </div>
            {/* Sort — visually different */}
            <div style={{ borderTop: `1px solid ${t.bdrL}`, paddingTop: 10 }}>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Sortera</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {[["smakfynd", "Smakfynd-poäng"], ...(showDeals ? [["drop", "Störst sänkning"]] : []), ["expert", "Expertbetyg"], ["crowd", "Crowd-betyg"], ["price_asc", "Pris ↑"], ["price_desc", "Pris ↓"]].map(([k, l]) => (
                  <button key={k} onClick={() => setSortBy(k)} style={{
                    padding: "7px 14px", borderRadius: 8, border: sortBy === k ? `2px solid ${t.wine}` : `1px solid ${t.bdr}`,
                    background: sortBy === k ? `${t.wine}08` : "transparent",
                    color: sortBy === k ? t.wine : t.txM, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: sortBy === k ? 600 : 400,
                  }}>{l}</button>
                ))}
              </div>
            </div>
          </div>
        )}


        {/* ═══ RESULTS ═══ */}
        <div style={{ marginBottom: 14, padding: "0 4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 13, color: t.txL }}>{loading ? "Laddar..." : `${filtered.length} produkter`}</span>
            <span style={{ fontSize: 11, color: t.txF }}>{{ smakfynd: "Mest smak för pengarna", drop: "Störst prissänkning först", expert: "Sorterat efter expertbetyg", crowd: "Sorterat efter crowd-betyg", price_asc: "Lägst pris först", price_desc: "Högst pris först" }[sortBy]}</span>
          </div>
        </div>

        {loadError && !loading && allData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📡</div>
            <p style={{ fontSize: 15, color: t.deal, marginBottom: 8 }}>{loadError}</p>
            <button onClick={() => { setLoading(true); setLoadError(null); window.location.reload(); }}
              style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${t.bdr}`, background: t.card, cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: t.txM }}>
              Försök igen
            </button>
          </div>
        ) : loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{ padding: "16px 18px", borderRadius: 14, background: t.card, border: `1px solid ${t.bdrL}`, display: "flex", gap: 14, alignItems: "flex-start", animation: `fadeIn 0.3s ease ${i * 0.08}s both` }}>
                <div style={{ width: 52, height: 52, borderRadius: 10, background: t.bdr, opacity: 0.4 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: "60%", height: 16, borderRadius: 4, background: t.bdr, opacity: 0.3, marginBottom: 6 }} />
                  <div style={{ width: "40%", height: 12, borderRadius: 4, background: t.bdr, opacity: 0.2, marginBottom: 8 }} />
                  <div style={{ width: "80%", height: 4, borderRadius: 2, background: t.bdr, opacity: 0.2 }} />
                </div>
                <div style={{ width: 50, height: 50, borderRadius: 12, background: t.bdr, opacity: 0.3 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: t.txL }}>
            <div style={{ fontSize: 14, color: t.txL, marginBottom: 8 }}>Inga resultat</div>
            <p style={{ fontSize: 17, fontFamily: t.serif, fontStyle: "italic", color: t.txM }}>Inga produkter matchade din sökning.</p>
            <button onClick={clearAll}
              style={{ marginTop: 10, fontSize: 13, color: t.wine, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              Visa alla produkter
            </button>
          </div>
        ) : cat === "all" && !hasFilters ? (
          /* Situation-based sections when viewing "Alla" without filters */
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {[
              ["Bästa röda fynden", "Rött", null, null],
              ["Bästa vita just nu", "Vitt", null, null],
              ["Mest prisvärda bubbel", "Mousserande", null, null],
              ["Budget: bästa under 100 kr", null, 0, 100],
              ["Mellanklass: 100–200 kr", null, 100, 200],
              ["Premium: 200–500 kr", null, 200, 500],
            ].map(([title, catFilter, pLo, pHi]) => {
              const sectionWines = filtered
                .filter(p => (!catFilter || p.category === catFilter) && (!pLo && !pHi || (p.price >= (pLo||0) && p.price < (pHi||99999))))
                .slice(0, 5);
              if (sectionWines.length === 0) return null;
              return (
                <div key={title}>
                  <h3 style={{ margin: "0 0 10px", fontSize: 16, fontFamily: t.serif, fontWeight: 400, color: t.tx }}>{title}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sectionWines.map((p, i) => <Card key={p.id || i} p={p} rank={i + 1} delay={0} allProducts={products} auth={auth} />)}
                  </div>
                </div>
              );
            })}
            {/* CTA → AI matcher */}
            <div style={{ textAlign: "center", padding: "20px 16px", borderRadius: 14, background: t.card, border: `1px solid ${t.bdr}` }}>
              <div style={{ fontSize: 14, fontFamily: t.serif, color: t.tx, marginBottom: 6 }}>Vet du vad du ska äta?</div>
              <p style={{ fontSize: 12, color: t.txL, margin: "0 0 10px" }}>Vår AI matchar rätt vin till din middag.</p>
              <button onClick={() => { const el = document.getElementById("section-food"); if (el) el.scrollIntoView({ behavior: "smooth" }); }}
                style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Prova AI-matchern ↓
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.slice(0, 1).map((p, i) => (
              <div key={p.id || i}>
                <Card p={p} rank={1} delay={0} allProducts={products} autoOpen={String(p.nr) === String(autoOpenNr)} auth={auth} />
                {!autoOpenNr && <div style={{ textAlign: "center", fontSize: 11, color: t.txL, margin: "-4px 0 6px", animation: "fadeIn 1s ease 0.5s both" }}>↑ Tryck på ett vin för att se mer</div>}
              </div>
            ))}
            {filtered.slice(1, 5).map((p, i) => <Card key={p.id || i} p={p} rank={i + 2} delay={Math.min((i + 1) * 0.04, 0.4)} allProducts={products} autoOpen={String(p.nr) === String(autoOpenNr)} auth={auth} />)}
            {filtered.length > 5 && <NewsletterCTA compact={true} />}
            {filtered.slice(5, 50).map((p, i) => <Card key={p.id || i} p={p} rank={i + 6} delay={Math.min((i + 5) * 0.04, 0.4)} allProducts={products} autoOpen={String(p.nr) === String(autoOpenNr)} auth={auth} />)}
            {filtered.length > 50 && (
              <div style={{ textAlign: "center", padding: "24px 20px", borderRadius: 14, background: t.surface, border: `1px solid ${t.bdr}` }}>
                <div style={{ fontSize: 14, color: t.txM, marginBottom: 8 }}>Visar topp 50 av {filtered.length} viner</div>
                <div style={{ fontSize: 12, color: t.txL }}>Använd filter för att hitta fler, eller logga in för att se hela listan.</div>
              </div>
            )}
          </div>
        )}

        {/* ═══ METHODOLOGY ═══ */}
        <Methodology />

        {/* ═══ NEWSLETTER ═══ */}
        <NewsletterCTA />

        {/* ═══ FOOTER ═══ */}
        <footer style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${t.bdr}`, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: t.txL, lineHeight: 1.8 }}>
            <p style={{ margin: "0 0 8px" }}>
              Smakfynd hjälper dig hitta vinet som ger mest smak för pengarna.
            </p>
            <p style={{ margin: "0 0 10px", color: t.txM }}>
              Skapad av <strong>Gabriel Linton</strong> · Dryckeskunskap, Grythyttan · <strong>Olav Innovation AB</strong>
            </p>
            <a href="https://smakfynd.substack.com" target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-block", fontSize: 12, color: t.wine, textDecoration: "none", marginBottom: 10 }}>
              Prenumerera på Veckans fynd ↗
            </a>
          </div>
          <div style={{ fontSize: 10, color: t.txF, margin: "0 0 10px", lineHeight: 1.7 }}>
            <p style={{ margin: "0 0 4px" }}>Uppdaterad {new Date().toLocaleDateString("sv-SE", { month: "long", year: "numeric" })} · {products.length} viner · Data från Systembolagets sortiment</p>
            <p style={{ margin: 0 }}>Smakfynd är en oberoende tjänst och har ingen koppling till, och är inte godkänd av, Systembolaget. Vi säljer inte alkohol.</p>
            <p style={{ margin: "4px 0 0" }}><a href="/integritet/" style={{ color: t.txF, textDecoration: "none" }}>Integritetspolicy</a></p>
          </div>
          <p style={{ fontSize: 10, color: t.txF, fontStyle: "italic" }}>Njut med måtta.</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{ marginTop: 12, padding: "10px 20px", borderRadius: 10, border: `1px solid ${t.bdr}`, background: t.card, cursor: "pointer", fontFamily: "inherit", fontSize: 12, color: t.txM }}>
            ↑ Tillbaka till toppen
          </button>
        </footer>
      </div>
      {showBackToTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Tillbaka till toppen"
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 100,
            width: 44, height: 44, borderRadius: "50%",
            background: t.card, border: `1px solid ${t.bdr}`,
            boxShadow: t.sh3, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, color: t.txM, fontFamily: "inherit",
            animation: "fadeIn 0.2s ease",
          }}>↑</button>
      )}
    </div>
    {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={(data) => {
      auth.login(data);
      setShowLogin(false);
      // Sync local wines to server
      if (data.wines && Object.keys(data.wines).length > 0) {
        // Server has wines — merge into local
        const merged = { ...sv.data };
        for (const [nr, lists] of Object.entries(data.wines)) {
          merged[nr] = [...new Set([...(merged[nr] || []), ...lists])];
        }
        try { localStorage.setItem("smakfynd_saved_v2", JSON.stringify(merged)); } catch(e) {}
      }
      // Sync local to server
      auth.syncWines(sv.data);
    }} />}
    </SavedContext.Provider>
  );
}
