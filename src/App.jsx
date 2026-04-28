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

  const newN = products.filter(p => p.is_new).length;
  const dealN = products.filter(p => p.price_vs_launch_pct > 0).length;
  const ecoN = products.filter(p => p.organic).length;
  const hasFilters = search || cat !== "all" || price !== "all" || showNew || showDeals || showEco || selCountry || selFoods.length > 0 || selRegion || selTaste || sortBy !== "smakfynd";

  const clearAll = () => { setSearch(""); setCat("all"); setPrice("all"); setShowNew(false); setShowDeals(false); setShowEco(false); setSelCountry(null); setSelFoods([]); setShowBest(false); setSelRegion(null); setSelTaste(null); setSortBy("smakfynd"); };

  const savedWines = useMemo(() => {
    return products.filter(p => sv.isSaved(p.nr || p.id)).sort((a, b) => b.smakfynd_score - a.smakfynd_score);
  }, [products, sv.data]);
  const [savedListFilter, setSavedListFilter] = useState("all");

  return (
    <SavedContext.Provider value={sv}>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
    {storeMode && <StoreMode products={products} onClose={() => setStoreMode(false)} />}
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: "'DM Sans', -apple-system, sans-serif", display: storeMode ? "none" : "block" }}>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:scale(1) } }
        ::selection { background: ${t.wine}20 }
        input::placeholder { color: ${t.txF} }
        *::-webkit-scrollbar { display: none }
        * { scrollbar-width: none; box-sizing: border-box; }
        a { transition: color 0.15s ease; }
        button { transition: all 0.15s ease; }
        img { transition: opacity 0.3s ease; }
        [role="button"]:focus-visible, button:focus-visible, a:focus-visible, input:focus-visible {
          outline: 2px solid ${t.wine}60;
          outline-offset: 2px;
        }
        @media (max-width: 480px) {
          header { padding: 10px 16px 0 !important; }
        }
      `}</style>

      {/* ═══ HERO — compact, collapsible on mobile ═══ */}
      <header style={{ padding: "16px 20px 0", maxWidth: 580, margin: "0 auto", animation: "fadeIn 0.4s ease" }}>
        {/* Top bar: Logo + nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <svg width="24" height="24" viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill={t.wine}/><text x="20" y="27" textAnchor="middle" fontFamily="Georgia,serif" fontSize="18" fill="#f5ede3" fontWeight="400">S</text></svg>
            <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, color: t.wine }}>Smakfynd</span>
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 12, color: t.txL }}>
            {[["weekly", "Veckans fynd"], ["food", "Kvällens middag"], ["picks", "Gabriels val"], ["saved", `♥${sv.count ? ` ${sv.count}` : ""}`],
              ["about", "Om"], [auth.user ? "profile" : "login", auth.user ? "👤" : "Logga in"]].map(([k, l]) => (
              <span key={k} onClick={() => {
                  if (k === "login") { setShowLogin(true); return; }
                  if (k === "profile") { auth.logout(); return; }
                  if (k === "weekly" || k === "food" || k === "picks") {
                    const el = document.getElementById("section-" + k);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    return;
                  }
                  setPanel(panel === k ? null : k);
                }}
                style={{ cursor: "pointer", color: panel === k ? t.wine : (k === "login" ? t.wine : t.txL), fontWeight: panel === k ? 600 : 400, padding: "8px 2px", minHeight: 44, display: "inline-flex", alignItems: "center" }}
              >{l}</span>
            ))}
          </div>
        </div>

        {/* Tagline */}
        <p style={{ margin: "0 0 4px", fontSize: 14, fontFamily: "'Instrument Serif', Georgia, serif", color: t.txM, textAlign: "center", lineHeight: 1.3 }}>
          {products.length > 100 ? `${(Math.round(products.length / 100) * 100).toLocaleString("sv-SE")}+` : ""} viner rankade efter värde — inte prestige.
        </p>
        <p style={{ margin: "0 0 10px", fontSize: 12, fontStyle: "italic", color: t.txL, textAlign: "center", lineHeight: 1.4 }}>
          Inte "bästa vinet" utan bästa köpet i sin kategori.
        </p>
      </header>

      <div style={{ maxWidth: 580, margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* ═══ PANELS ═══ */}
        {panel === "about" && (
          <div style={{ padding: 22, borderRadius: 16, background: t.card, border: `1px solid ${t.bdr}`, marginBottom: 20, animation: "scaleIn 0.25s ease" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 22, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>Om Smakfynd</h2>
            <p style={{ fontSize: 14, color: t.txM, lineHeight: 1.7, margin: "0 0 12px" }}>
              Systembolaget har tusentals viner. Vi hjälper dig hitta de som faktiskt är värda pengarna. Vi kombinerar <strong>crowd-betyg</strong> från hundratusentals vindrickare, <strong>expertrecensioner</strong> från internationella kritiker och <strong>prisjämförelse</strong> inom varje kategori.
            </p>
            <p style={{ fontSize: 14, color: t.txM, lineHeight: 1.7, margin: "0 0 14px" }}>
              Resultatet: <strong>en enda poäng</strong> som visar kvalitet per krona. Inte det "bästa" vinet — utan det bästa <em>köpet</em>.
            </p>
            <div style={{ padding: 16, borderRadius: 12, background: t.bg, marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontFamily: "'Instrument Serif', serif", color: t.tx, marginBottom: 4 }}>Gabriel Linton, grundare</div>
              <p style={{ fontSize: 13, color: t.txM, lineHeight: 1.6, margin: 0 }}>
                Forskare i innovation och entreprenörskap (PhD, Örebro universitet). Førsteamanuensis vid Universitetet i Innlandet, Norge. Utbildad i dryckeskunskap vid Restaurang- och hotellhögskolan i Grythyttan. MBA, Cleveland State University.
              </p>
              <p style={{ fontSize: 13, color: t.txM, lineHeight: 1.6, margin: "8px 0 0" }}>
                Jag ville hitta bra vin utan att gissa. Som forskare vill jag ha data — inte magkänsla. All information fanns redan, men ingen hade kopplat ihop den åt vanliga konsumenter. Och jag märkte att billigare viner ofta smakade nästan lika bra som betydligt dyrare. Så jag byggde Smakfynd — ett system som väger in priset i omdömet, systematiskt.
              </p>
            </div>
            <p style={{ fontSize: 12, color: t.txL, margin: 0 }}>Olav Innovation AB · Oberoende informationstjänst · Ingen koppling till Systembolaget · Vi säljer inte alkohol</p>

            <div style={{ padding: 16, borderRadius: 12, background: `${t.wine}06`, border: `1px solid ${t.wine}12`, marginTop: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.tx, marginBottom: 4 }}>🍷 Stöd Smakfynd</div>
              <p style={{ fontSize: 12, color: t.txM, margin: "0 0 8px", lineHeight: 1.5 }}>
                Smakfynd är gratis och oberoende — inga annonser, inga sponsrade placeringar. Om du tycker om tjänsten kan du bjuda oss på ett glas.
              </p>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.wine }}>Swish: 123 456 78 90</div>
              <div style={{ fontSize: 10, color: t.txF, marginTop: 4 }}>Alla bidrag går till servrar, data och utveckling.</div>
            </div>

            <button onClick={() => setPanel(null)} style={{ marginTop: 12, fontSize: 12, color: t.txL, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Stäng</button>
          </div>
        )}

        {panel === "method" && (
          <div style={{ padding: 22, borderRadius: 16, background: t.card, border: `1px solid ${t.bdr}`, marginBottom: 20, animation: "scaleIn 0.25s ease" }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 22, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>Så beräknas poängen</h2>

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
            <h3 style={{ margin: "0 0 10px", fontSize: 15, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>Transparens</h3>
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
            <h2 style={{ margin: "0 0 4px", fontSize: 22, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>Mina viner</h2>
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

        {/* ═══ SEARCH ═══ */}
        <div style={{ position: "relative", marginBottom: 10 }}>
          <label htmlFor="sf-search" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>Sök vin</label>
          <input id="sf-search" type="search" placeholder="Sök vin, druva, land, stil..." value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "14px 16px 14px 42px", borderRadius: 14,
              border: `1px solid ${t.bdr}`, background: t.card, fontSize: 14,
              color: t.tx, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={e => { e.target.style.borderColor = t.wine + "40"; e.target.style.boxShadow = `0 0 0 3px ${t.wine}08`; }}
            onBlur={e => { e.target.style.borderColor = t.bdr; e.target.style.boxShadow = "none"; }}
          />
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: t.txL, pointerEvents: "none" }}>⌕</span>
        </div>

        {/* ═══ STORE MODE BANNER ═══ */}
        <div role="button" tabIndex={0} aria-label="Öppna butiksläge — sök på vinets namn och se poäng direkt"
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setStoreMode(true); } }}
          onClick={() => setStoreMode(true)} style={{
          display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
          borderRadius: 14, background: `linear-gradient(135deg, ${t.wine}08, ${t.wine}04)`,
          border: `1px solid ${t.wine}20`, marginBottom: 14, cursor: "pointer",
          transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = t.wine + "40"; e.currentTarget.style.background = t.wine + "10"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = t.wine + "20"; e.currentTarget.style.background = `linear-gradient(135deg, ${t.wine}08, ${t.wine}04)`; }}
        >
          <span style={{ fontSize: 24 }}>🏪</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: t.tx }}>Står du i butiken?</div>
            <div style={{ fontSize: 12, color: t.txM }}>Sök på vinets namn — se poängen och bättre alternativ direkt</div>
          </div>
          <span style={{ fontSize: 16, color: t.txL }}>→</span>
        </div>

        {/* ═══ CATEGORY PILLS ═══ */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
          {CATS.map(ct => (
            <button key={ct.k} onClick={() => { setCat(ct.k); track("filter", { type: "category", value: ct.k }); }} style={pill(cat === ct.k)}>
              {ct.l}
            </button>
          ))}
        </div>

        {/* ═══ QUICK PICKS ═══ */}
        {!search && !showAdvanced && cat === "Rött" && price === "all" && !showDeals && !showNew && !showEco && !selCountry && selFoods.length === 0 && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
            {[
              ["🔥", "Till grillat", () => { setSelFoods(["Kött"]); setShowAdvanced(true); }],
              ["🐟", "Till fisk", () => { setCat("Vitt"); setSelFoods(["Fisk"]); setShowAdvanced(true); }],
              ["💰", "Under 100 kr", () => { setPrice("0-79"); setShowAdvanced(true); }],
              ["📉", "Prissänkt", () => { setShowDeals(true); setSortBy("drop"); setShowAdvanced(true); }],
              ["🌿", "Ekologiskt", () => { setShowEco(true); }],
            ].map(([icon, label, fn]) => (
              <button key={label} onClick={fn} style={{
                padding: "8px 14px", borderRadius: 10, border: `1px solid ${t.bdrL}`,
                background: t.card, cursor: "pointer", fontFamily: "inherit",
                fontSize: 12, color: t.txM, display: "flex", alignItems: "center", gap: 5,
                whiteSpace: "nowrap", transition: "all 0.2s", boxShadow: t.sh1,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.wine + "40"; e.currentTarget.style.color = t.wine; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.bdrL; e.currentTarget.style.color = t.txM; }}
              ><span style={{ fontSize: 14 }}>{icon}</span> {label}</button>
            ))}
          </div>
        )}

        {/* ═══ ADVANCED TOGGLE ═══ */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
          <button onClick={() => setShowAdvanced(!showAdvanced)}
            style={{ ...pill(showAdvanced || price !== "all" || pkg !== "Flaska" || showEco || showDeals || showNew || selCountry || selFoods.length > 0 || selRegion || selTaste || sortBy !== "smakfynd"), display: "flex", alignItems: "center", gap: 4 }}>
            Filter {(() => { const n = (price !== "all" ? 1 : 0) + (pkg !== "Flaska" ? 1 : 0) + (showEco ? 1 : 0) + (showDeals ? 1 : 0) + (showNew ? 1 : 0) + (selCountry ? 1 : 0) + (selFoods.length > 0 ? 1 : 0) + (selRegion ? 1 : 0) + (selTaste ? 1 : 0) + (sortBy !== "smakfynd" ? 1 : 0); return n > 0 ? `(${n})` : ""; })()} <span style={{ fontSize: 10, transition: "transform 0.2s", display: "inline-block", transform: showAdvanced ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
          </button>
          {hasFilters && (
            <button onClick={clearAll}
              style={{ padding: "8px 14px", borderRadius: 100, border: `1px solid ${t.bdr}`, background: "transparent", color: t.txL, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              Rensa filter ✕
            </button>
          )}
        </div>

        {showAdvanced && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, padding: "14px 16px", borderRadius: 14, background: t.card, border: `1px solid ${t.bdrL}` }}>
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
                    transition: "all 0.2s",
                  }}>{l}</button>
                ))}
              </div>
            </div>
            {/* Price */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pris</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {PRICES.filter(p => p.k !== "all").map(({ k, l }) => (
                  <button key={k} onClick={() => { setPrice(price === k ? "all" : k); track("filter", { type: "price", value: k }); }} style={pill(price === k)}>{l}</button>
                ))}
              </div>
            </div>
            {/* Tags row */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => setShowEco(!showEco)} style={pill(showEco, t.green)}>Ekologiskt ({ecoN})</button>
              <button onClick={() => { setShowNew(!showNew); if (!showNew) setShowDeals(false); }} style={pill(showNew)}>Nyheter</button>
              <button onClick={() => { const next = !showDeals; setShowDeals(next); if (next) { setShowNew(false); setSortBy("drop"); } else if (sortBy === "drop") { setSortBy("smakfynd"); } }} style={pill(showDeals, t.deal)}>Prissänkt</button>
              <button onClick={() => setShowBest(!showBest)} style={pill(showBest)}>Beställning</button>
            </div>
            {/* Country */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Land</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  ["Italien", "\ud83c\uddee\ud83c\uddf9"], ["Frankrike", "\ud83c\uddeb\ud83c\uddf7"], ["Spanien", "\ud83c\uddea\ud83c\uddf8"],
                  ["USA", "\ud83c\uddfa\ud83c\uddf8"], ["Tyskland", "\ud83c\udde9\ud83c\uddea"], ["Sydafrika", "\ud83c\uddff\ud83c\udde6"],
                  ["Chile", "\ud83c\udde8\ud83c\uddf1"], ["Portugal", "\ud83c\uddf5\ud83c\uddf9"], ["Australien", "\ud83c\udde6\ud83c\uddfa"],
                  ["Argentina", "\ud83c\udde6\ud83c\uddf7"], ["Nya Zeeland", "\ud83c\uddf3\ud83c\uddff"], ["\u00d6sterrike", "\ud83c\udde6\ud83c\uddf9"],
                ].map(([c, flag]) => (
                  <button key={c} onClick={() => setSelCountry(selCountry === c ? null : c)} style={pill(selCountry === c)}>{flag} {c}</button>
                ))}
              </div>
            </div>
            {/* Food */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Passar till</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Kött", "Fågel", "Fisk", "Skaldjur", "Fläsk", "Grönsaker", "Ost", "Vilt", "Pasta", "Lamm"].map(f => (
                  <button key={f} onClick={() => toggleFood(f)} style={pill(selFoods.includes(f))}>{f}</button>
                ))}
              </div>
            </div>
            {/* Taste */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Smak</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Fylligt", "Lätt", "Fruktigt", "Torrt"].map(ts => (
                  <button key={ts} onClick={() => setSelTaste(selTaste === ts ? null : ts)} style={pill(selTaste === ts)}>{ts}</button>
                ))}
              </div>
            </div>
            {/* Region */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Region</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Bordeaux", "Toscana", "Rioja", "Piemonte", "Bourgogne", "Rhonedalen", "Champagne", "Kalifornien"].map(rg => (
                  <button key={rg} onClick={() => setSelRegion(selRegion === rg ? null : rg)} style={pill(selRegion === rg)}>{rg}</button>
                ))}
              </div>
            </div>
            {/* Sort */}
            <div>
              <div style={{ fontSize: 10, color: t.txL, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Sortera</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[["smakfynd", "Smakfynd-poäng"], ...(showDeals ? [["drop", "Störst sänkning"]] : []), ["expert", "Expertbetyg"], ["crowd", "Crowd-betyg"], ["price_asc", "Pris ↑"], ["price_desc", "Pris ↓"]].map(([k, l]) => (
                  <button key={k} onClick={() => setSortBy(k)} style={pill(sortBy === k)}>{l}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ WINE OF THE DAY ═══ */}
        {!search && !showDeals && !showNew && cat === "Rött" && <WineOfDay products={products} onSelect={nr => { window.location.hash = `vin/${nr}`; window.scrollTo({ top: 0, behavior: "smooth" }); }} />}

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
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>🔍</div>
            <p style={{ fontSize: 17, fontFamily: "'Instrument Serif', serif", fontStyle: "italic", color: t.txM }}>Inga produkter matchade din sökning.</p>
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
                  <h3 style={{ margin: "0 0 10px", fontSize: 16, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>{title}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sectionWines.map((p, i) => <Card key={p.id || i} p={p} rank={i + 1} delay={0} allProducts={products} auth={auth} />)}
                  </div>
                </div>
              );
            })}
            {/* CTA → AI matcher */}
            <div style={{ textAlign: "center", padding: "20px 16px", borderRadius: 14, background: t.card, border: `1px solid ${t.bdr}` }}>
              <div style={{ fontSize: 14, fontFamily: "'Instrument Serif', serif", color: t.tx, marginBottom: 6 }}>Vet du vad du ska äta?</div>
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

        {/* ═══ VECKANS FYND (below wine list) ═══ */}
        <div id="section-weekly"><WeeklyPick products={products} /></div>

        {/* ═══ AI FOOD MATCH ═══ */}
        <div id="section-food"><FoodMatch products={products} /></div>

        {/* ═══ NEWSLETTER CTA ═══ */}
        <NewsletterCTA />

        {/* ═══ REDAKTIONENS VAL ═══ */}
        <div id="section-picks"><EditorsPicks products={products} onSelect={nr => { window.location.hash = `vin/${nr}`; window.scrollTo({ top: 0, behavior: "smooth" }); }} /></div>

        {/* ═══ SÄSONGSINNEHÅLL ═══ */}
        {(() => {
          const month = new Date().getMonth(); // 0-11
          const season = month >= 4 && month <= 8 ? "sommar" : month >= 2 && month <= 4 ? "vår" : month >= 9 && month <= 10 ? "höst" : "vinter";
          const seasonConfig = {
            vår: { title: "Vårviner", sub: "Lätta, friska viner för ljusare kvällar", emoji: "🌸", filter: p => (p.category === "Vitt" || p.category === "Rosé") && (p.taste_body || 12) <= 7 },
            sommar: { title: "Sommarviner", sub: "Kylda favoriter till grillkvällar och picknick", emoji: "☀️", filter: p => (p.category === "Vitt" || p.category === "Rosé" || p.category === "Mousserande") && p.price <= 200 },
            höst: { title: "Höstviner", sub: "Fylliga röda till mörka kvällar", emoji: "🍂", filter: p => p.category === "Rött" && (p.taste_body || 0) >= 7 },
            vinter: { title: "Vinterviner", sub: "Värmande röda och festliga bubbel", emoji: "❄️", filter: p => (p.category === "Rött" && (p.taste_body || 0) >= 8) || p.category === "Mousserande" },
          };
          const cfg = seasonConfig[season];
          const seasonWines = products.filter(p => p.assortment === "Fast sortiment" && p.package === "Flaska" && cfg.filter(p)).sort((a, b) => b.smakfynd_score - a.smakfynd_score).slice(0, 4);
          if (seasonWines.length === 0) return null;
          return (
            <div style={{ marginTop: 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>{cfg.emoji}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>{cfg.title}</h3>
                  <p style={{ margin: 0, fontSize: 12, color: t.txL }}>{cfg.sub}</p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {seasonWines.map((p, i) => <Card key={p.id || i} p={p} rank={i + 1} delay={0} allProducts={products} auth={auth} />)}
              </div>
            </div>
          );
        })()}

        {/* ═══ SITUATIONER ═══ */}
        <div style={{ marginTop: 40 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 18, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>Hitta vin till tillfället</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              ["Dejt", "Romantisk middag", "🕯️", p => p.expert_score >= 7 && p.price >= 120 && p.price <= 300],
              ["Grillkväll", "Sommar & BBQ", "🔥", p => p.taste_body >= 7 && (p.food_pairings || []).some(f => /kött|grillat|fläsk/i.test(f))],
              ["Svärföräldrarna", "Tryggt & imponerande", "🎩", p => p.expert_score >= 7.5 && p.crowd_score >= 7 && p.price >= 150],
              ["Fredagsmys", "Under 120 kr", "🍕", p => p.price <= 120 && p.smakfynd_score >= 70],
              ["Picknick", "Lätt & friskt", "🧺", p => (p.category === "Vitt" || p.category === "Rosé") && (p.taste_body || 12) <= 6],
              ["After work", "Bubbel & lättviner", "🥂", p => p.category === "Mousserande" || ((p.taste_body || 12) <= 5 && p.category === "Vitt")],
            ].map(([title, sub, emoji, filterFn]) => {
              const matches = products.filter(p => p.assortment === "Fast sortiment" && p.package === "Flaska" && filterFn(p)).slice(0, 3);
              return (
                <button key={title} onClick={() => { setSearch(""); setCat("all"); setShowAdvanced(false);
                  const best = matches[0]; if (best) { window.location.hash = `vin/${best.nr}`; window.scrollTo({ top: 0, behavior: "smooth" }); }
                }}
                  style={{ padding: "14px 16px", borderRadius: 14, background: t.card, border: `1px solid ${t.bdr}`, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = t.wine + "40"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = t.bdr}
                >
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{emoji}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.tx }}>{title}</div>
                  <div style={{ fontSize: 11, color: t.txL }}>{sub}</div>
                  <div style={{ fontSize: 10, color: t.txF, marginTop: 4 }}>{matches.length} viner</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ PRESENT-SEKTION ═══ */}
        <div style={{ marginTop: 40 }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 18, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>Ge bort vin</h3>
          <p style={{ margin: "0 0 14px", fontSize: 12, color: t.txL }}>Kurerade val per budget — trygga presenter.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["Under 100 kr", 0, 100, "Trevlig gest"],
              ["100–200 kr", 100, 200, "Uppskattad present"],
              ["200–400 kr", 200, 400, "Lyxig gåva"],
            ].map(([label, lo, hi, desc]) => {
              const picks = products.filter(p => p.assortment === "Fast sortiment" && p.package === "Flaska" && p.price >= lo && p.price < hi && p.expert_score >= 7).sort((a, b) => b.smakfynd_score - a.smakfynd_score).slice(0, 3);
              if (picks.length === 0) return null;
              return (
                <div key={label} style={{ padding: "14px 16px", borderRadius: 14, background: t.card, border: `1px solid ${t.bdr}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: t.tx }}>{label}</span>
                    <span style={{ fontSize: 11, color: t.txL }}>{desc}</span>
                  </div>
                  {picks.map((p, i) => (
                    <div key={i} onClick={() => { window.location.hash = `vin/${p.nr}`; window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", cursor: "pointer", borderTop: i > 0 ? `1px solid ${t.bdrL}` : "none" }}>
                      <span style={{ fontSize: 13, color: t.txM }}>{p.name} <span style={{ color: t.txL }}>{p.sub}</span></span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: t.tx, fontFamily: "'Instrument Serif', serif" }}>{p.price}kr</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ NYBÖRJARGUIDE ═══ */}
        <div style={{ marginTop: 40, padding: "24px 20px", borderRadius: 18, background: t.card, border: `1px solid ${t.bdr}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: t.wine, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>Ny på vin?</div>
          <h3 style={{ margin: "0 0 8px", fontSize: 20, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>Börja här</h3>
          <p style={{ fontSize: 13, color: t.txM, margin: "0 0 16px", lineHeight: 1.6 }}>
            Du behöver inte kunna något om vin. Smakfynd har redan gjort jobbet — vi har analyserat tusentals viner och rankat dem efter kvalitet per krona. Högst poäng = mest smak för pengarna.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["1. Börja med ett rött under 100 kr", "Rött", 0, 100, "Tryggt och prisvärt — de flesta gillar dessa."],
              ["2. Testa ett vitt till fisk eller kyckling", "Vitt", 0, 150, "Fräscht och enkelt — passar till vardagsmiddag."],
              ["3. Prova bubbel till fredagen", "Mousserande", 0, 200, "Inte bara för fest — perfekt till fredagsmys."],
            ].map(([title, cat, lo, hi, tip]) => {
              const pick = products.find(p => p.category === cat && p.assortment === "Fast sortiment" && p.package === "Flaska" && p.price >= lo && p.price < hi && p.smakfynd_score >= 70);
              return (
                <div key={title} style={{ padding: "12px 14px", borderRadius: 12, background: t.bg }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.tx, marginBottom: 4 }}>{title}</div>
                  <p style={{ fontSize: 12, color: t.txL, margin: "0 0 6px" }}>{tip}</p>
                  {pick && (
                    <div onClick={() => { window.location.hash = `vin/${pick.nr}`; window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      style={{ fontSize: 12, color: t.wine, cursor: "pointer", fontWeight: 600 }}>
                      Vårt tips: {pick.name} ({pick.price}kr, {pick.smakfynd_score}/100) →
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ METODIK ═══ */}
        <Methodology />

        {/* ═══ NEWSLETTER ═══ */}
        <div style={{
          marginTop: 40, padding: "28px 24px", borderRadius: 18,
          background: t.card, border: `1px solid ${t.bdr}`,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: t.wine, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>Nyhetsbrev</div>
          <h3 style={{ margin: "0 0 6px", fontSize: 22, fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: t.tx }}>Veckans bästa köp</h3>
          <p style={{ fontSize: 13, color: t.txM, margin: "0 0 16px", lineHeight: 1.5 }}>Smartaste vinvalen direkt i inkorgen — varje torsdag.</p>
          <a href="https://smakfynd.substack.com" target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-block", padding: "12px 28px", borderRadius: 12, border: "none", cursor: "pointer",
              background: `linear-gradient(145deg, ${t.wine}, ${t.wineD})`,
              color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none",
              boxShadow: `0 2px 8px ${t.wine}25`, transition: "opacity 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >Prenumerera på Substack ↗</a>
          <p style={{ fontSize: 11, color: t.txL, margin: "10px 0 0" }}>Gratis. Avsluta när du vill.</p>
        </div>

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
