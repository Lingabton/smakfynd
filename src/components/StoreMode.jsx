// src/components/StoreMode.jsx — "Snabbkollen"
// Inline fuzzy search (lightweight fuse-like implementation)
function fuzzySearch(items, query, keys, limit = 10) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const stopwords = new Set(["vino", "wine", "doc", "docg", "vin", "de", "la", "le", "di", "du", "des"]);
  const terms = q.split(/\s+/).filter(t => t.length > 1 && !stopwords.has(t));

  // If all digits and 5+, search by article number
  if (/^\d{5,}$/.test(q.trim())) {
    return items.filter(item => String(item.nr) === q.trim()).slice(0, 1);
  }

  return items.map(item => {
    let score = 0;
    const fields = keys.map(k => (item[k] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    const combined = fields.join(" ");

    for (const term of terms) {
      // Exact substring match
      if (combined.includes(term)) {
        score += 10;
        // Bonus for start-of-word match
        if (fields.some(f => f.startsWith(term) || f.includes(" " + term))) score += 5;
      } else {
        // Fuzzy: allow 1-2 char difference (simple Levenshtein check)
        for (const f of fields) {
          const words = f.split(/\s+/);
          for (const w of words) {
            if (w.length >= 3 && term.length >= 3) {
              let diff = 0;
              const minLen = Math.min(w.length, term.length);
              for (let i = 0; i < minLen; i++) { if (w[i] !== term[i]) diff++; }
              diff += Math.abs(w.length - term.length);
              if (diff <= 2 && minLen >= 3) { score += 5 - diff; break; }
            }
          }
        }
      }
    }
    return { item, score };
  })
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score || b.item.smakfynd_score - a.item.smakfynd_score)
  .slice(0, limit)
  .map(r => r.item);
}

function getRecommendations(wine, products) {
  if (!wine || !products) return [];
  const wineVol = wine.vol || 750;
  const wineGrape = (wine.grape || "").toLowerCase().split(",")[0].trim();
  const wineCat3 = (wine.cat3 || "").toLowerCase();
  const wineRegion = (wine.region || "").toLowerCase();

  // Base pool: same type + volume
  const base = products.filter(p =>
    p.nr !== wine.nr && p.category === wine.category && p.package === wine.package
    && p.assortment === "Fast sortiment"
    && Math.abs((p.vol || 750) - wineVol) / wineVol < 0.3
  );

  // Narrow pool: same grape/style/region (prioritized)
  const narrow = base.filter(p => {
    const g = (p.grape || "").toLowerCase().split(",")[0].trim();
    const c = (p.cat3 || "").toLowerCase();
    const r = (p.region || "").toLowerCase();
    return (wineGrape && g === wineGrape) || (wineCat3 && c === wineCat3) || (wineRegion && r === wineRegion);
  });

  const recs = [];
  const used = new Set();

  const addRec = (p, type, label) => {
    if (used.has(p.nr)) return false;
    used.add(p.nr);
    recs.push({ ...p, _recType: type, _recLabel: label });
    return true;
  };

  // Helper: describe what's similar
  const similarity = (p) => {
    const g = (p.grape || "").toLowerCase().split(",")[0].trim();
    if (wineGrape && g === wineGrape) return `Samma druva (${wine.grape.split(",")[0].trim()})`;
    const r = (p.region || "").toLowerCase();
    if (wineRegion && r === wineRegion) return `Samma region (${wine.region})`;
    const c = (p.cat3 || "").toLowerCase();
    if (wineCat3 && c === wineCat3) return `Samma stil`;
    return `Samma typ`;
  };

  // 1. Best in same sort/style — prioritize narrow pool
  const pool1 = narrow.length >= 3 ? narrow : base;
  const priceRange = wine.price * 0.25;

  // 1a. Better in same price range
  const betterSame = pool1
    .filter(p => Math.abs(p.price - wine.price) <= priceRange && p.smakfynd_score >= wine.smakfynd_score + 3)
    .sort((a, b) => b.smakfynd_score - a.smakfynd_score);
  for (const p of betterSame.slice(0, 2)) {
    addRec(p, "A", `${similarity(p)}, +${p.smakfynd_score - wine.smakfynd_score} poäng`);
  }

  // 1b. Same quality, lower price
  if (recs.length < 3) {
    const cheaper = pool1
      .filter(p => !used.has(p.nr) && Math.abs(p.smakfynd_score - wine.smakfynd_score) <= 3 && p.price <= wine.price * 0.75)
      .sort((a, b) => a.price - b.price);
    for (const p of cheaper.slice(0, 1)) {
      addRec(p, "B", `${similarity(p)}, ${Math.round(wine.price - p.price)}\u00A0kr billigare`);
    }
  }

  // 1c. Worth upgrading
  if (recs.length < 3) {
    const upgrade = pool1
      .filter(p => !used.has(p.nr) && p.smakfynd_score >= wine.smakfynd_score + 5 && p.price > wine.price * 1.3 && p.price <= wine.price * 2.5)
      .sort((a, b) => b.smakfynd_score - a.smakfynd_score);
    for (const p of upgrade.slice(0, 1)) {
      addRec(p, "C", `${similarity(p)}, +${p.smakfynd_score - wine.smakfynd_score} poäng för ${Math.round(p.price - wine.price)}\u00A0kr extra`);
    }
  }

  // 2. If we used narrow pool, also show one broader "liknande smak" from base
  if (recs.length < 4 && narrow.length >= 3) {
    const broader = base
      .filter(p => !used.has(p.nr) && !narrow.includes(p) && p.smakfynd_score >= wine.smakfynd_score)
      .sort((a, b) => {
        let sa = 0, sb = 0;
        if (a.taste_body && wine.taste_body) sa += (1 - Math.abs(a.taste_body - wine.taste_body) / 12) * 10;
        if (b.taste_body && wine.taste_body) sb += (1 - Math.abs(b.taste_body - wine.taste_body) / 12) * 10;
        return sb - sa || b.smakfynd_score - a.smakfynd_score;
      });
    for (const p of broader.slice(0, 1)) {
      addRec(p, "D", `Liknande smak, annan sort`);
    }
  }

  return recs;
}

function availLabel(avail) {
  if (avail >= 0.7) return { text: "Brett tillgängligt", color: t.green };
  if (avail >= 0.3) return { text: "Fråga din butik", color: t.gold };
  return { text: "Beställningsvara", color: t.txL };
}

function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const loadAndStart = () => {
      if (!window.Html5QrcodeScanner) {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
        script.onload = () => initScanner();
        script.onerror = () => onClose();
        document.head.appendChild(script);
      } else {
        initScanner();
      }
    };

    const initScanner = async () => {
      try {
        const scanner = new window.Html5Qrcode("sf-scanner-region");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 20,
            qrbox: { width: 250, height: 80 },
            formatsToSupport: [
              window.Html5QrcodeSupportedFormats.EAN_13,
              window.Html5QrcodeSupportedFormats.EAN_8,
              window.Html5QrcodeSupportedFormats.CODE_128,
              window.Html5QrcodeSupportedFormats.CODE_39,
              window.Html5QrcodeSupportedFormats.ITF,
            ],
          },
          (decodedText) => {
            if (doneRef.current) return;
            doneRef.current = true;
            if (navigator.vibrate) navigator.vibrate(50);
            scanner.stop().then(() => scanner.clear()).catch(() => {});
            onScan(decodedText, "barcode");
          },
          () => {}
        );
      } catch(e) {
        onClose();
      }
    };

    loadAndStart();

    return () => {
      try { if (scannerRef.current) { scannerRef.current.stop().catch(() => {}); scannerRef.current.clear().catch(() => {}); } } catch(e) {}
    };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: t.bg, zIndex: 1000, overflowY: "auto" }}>
      <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 16, fontFamily: t.serif, color: t.tx }}>Skanna streckkod</div>
        <button onClick={() => { try { scannerRef.current?.stop().catch(() => {}); scannerRef.current?.clear().catch(() => {}); } catch(e) {} onClose(); }} style={{
          padding: "8px 16px", borderRadius: 100, border: `1px solid ${t.bdr}`,
          background: t.card, color: t.txM, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
        }}>Avbryt</button>
      </div>
      <div style={{ padding: "0 16px 8px", fontSize: 12, color: t.txL }}>
        Rikta kameran mot streckkoden på flaskan eller hyllkanten
      </div>
      <div id="sf-scanner-region" style={{ padding: "0 16px" }} />
    </div>
  );
}

function LabelScanner({ products, onMatch, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("camera"); // camera | processing | results | error
  const [matches, setMatches] = useState([]);
  const [ocrText, setOcrText] = useState("");

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      } catch(e) {
        setStatus("error");
      }
    };
    startCamera();
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
  }, []);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    // Wait for video to be ready
    if (video.readyState < 2 || video.videoWidth === 0) {
      setOcrText("Kameran är inte redo ännu. Vänta en sekund och försök igen.");
      setStatus("error");
      return;
    }

    setStatus("processing");
    const canvas = canvasRef.current;
    const w = Math.min(video.videoWidth, 1024);
    const h = Math.round(w * video.videoHeight / video.videoWidth);
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(video, 0, 0, w, h);

    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());

    try {
      const imageBase64 = canvas.toDataURL("image/jpeg", 0.8);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const res = await fetch("https://smakfynd-wine-ai.smakfynd.workers.dev/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64 }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        setOcrText(`Server-fel: ${res.status} ${errText.slice(0, 100)}`);
        setStatus("error");
        return;
      }

      const data = await res.json();

      if (data.error) {
        setOcrText(`AI-fel: ${data.error}`);
        setStatus("error");
        return;
      }

      const wineName = data.wine_name || "";
      const producer = data.producer || "";
      const searchQuery = `${wineName} ${producer}`.trim();
      setOcrText(`AI läste: ${searchQuery}${data.region ? ` (${data.region})` : ""}${data.vintage ? ` ${data.vintage}` : ""}${data._raw ? `\n\nRåsvar: ${data._raw.slice(0,150)}` : ""}`);

      if (!searchQuery) {
        setOcrText(data._gemini_status === 429
          ? "Etikettläsningen har nått sin dagliga gräns. Prova igen imorgon, eller skriv vinets namn."
          : "Kunde inte läsa etiketten. Prova en tydligare bild.");
        setStatus("error");
        return;
      }

      // Fuzzy search with AI-extracted name
      const queries = [searchQuery, wineName, producer].filter(q => q.length >= 3);
      const seen = new Set();
      const allMatches = [];
      for (const query of queries) {
        const results = fuzzySearch(products, query, ["name", "sub", "country", "grape", "region"], 5);
        for (const r of results) {
          if (!seen.has(r.nr)) { seen.add(r.nr); allMatches.push(r); }
        }
      }

      setMatches(allMatches.slice(0, 5));
      setStatus("results");
      if (navigator.vibrate) navigator.vibrate(50);
    } catch(e) {
      setOcrText("Fel: " + String(e).slice(0, 200));
      setStatus("error");
    }
  };

  if (status === "error") {
    return (
      <div style={{ position: "fixed", inset: 0, background: t.bg, zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ fontSize: 14, color: t.txM, textAlign: "center", marginBottom: 16 }}>Kunde inte läsa etiketten. Prova igen eller skriv vinets namn.</div>
        {ocrText && <div style={{ fontSize: 10, color: t.txF, textAlign: "center", marginBottom: 12, maxWidth: 300 }}>{ocrText}</div>}
        <button onClick={onClose} style={{ padding: "12px 24px", borderRadius: 10, border: `1px solid ${t.bdr}`, background: t.card, color: t.txM, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Tillbaka</button>
      </div>
    );
  }

  if (status === "results") {
    return (
      <div style={{ position: "fixed", inset: 0, background: t.bg, zIndex: 1000, overflowY: "auto" }}>
        <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontFamily: t.serif, color: t.tx }}>Resultat från etikett</div>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 100, border: `1px solid ${t.bdr}`, background: t.card, color: t.txM, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Stäng</button>
        </div>
        {matches.length > 0 ? (
          <div style={{ padding: "0 16px" }}>
            <div style={{ fontSize: 11, color: t.txL, marginBottom: 8 }}>Hittade {matches.length} möjliga matchningar:</div>
            {matches.map((p, i) => {
              const [_l, col] = getScoreInfo(p.smakfynd_score);
              return (
                <div key={p.nr} onClick={() => { onMatch(p); onClose(); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", borderRadius: 10, background: t.card, border: `1px solid ${t.bdrL}`, marginBottom: 6, cursor: "pointer" }}>
                  <ProductImage p={p} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontFamily: t.serif, color: t.tx }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: t.txL }}>{p.sub} · {p.country} · {p.price}{"\u00A0"}kr</div>
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 900, color: col, fontFamily: t.serif }}>{p.smakfynd_score}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: "32px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: t.txM, marginBottom: 4 }}>Kunde inte matcha etiketten</div>
            <div style={{ fontSize: 12, color: t.txL }}>Prova att skriva vinets namn istället</div>
          </div>
        )}
        {ocrText && (
          <div style={{ padding: "16px", marginTop: 8 }}>
            <div style={{ fontSize: 10, color: t.txL, marginBottom: 4 }}>Avläst text:</div>
            <div style={{ fontSize: 10, color: t.txF, fontFamily: "monospace", lineHeight: 1.4, maxHeight: 80, overflow: "hidden" }}>{ocrText.slice(0, 300)}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 1000, display: "flex", flexDirection: "column" }}>
      <video ref={videoRef} style={{ flex: 1, width: "100%", objectFit: "cover" }} playsInline muted />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px", background: "linear-gradient(transparent, rgba(0,0,0,0.8))", textAlign: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 12 }}>
          Rikta kameran mot vinets etikett
        </div>
        <button onClick={captureAndAnalyze} disabled={status === "processing"} style={{
          padding: "14px 32px", borderRadius: 12, border: "none",
          background: status === "processing" ? "#666" : "#fff", color: "#000",
          fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        }}>
          {status === "processing" ? "Läser etikett..." : "Ta bild"}
        </button>
      </div>

      <button onClick={onClose} style={{
        position: "absolute", top: 16, right: 16, padding: "8px 16px", borderRadius: 100,
        background: "rgba(0,0,0,0.5)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)",
        fontSize: 13, cursor: "pointer", fontFamily: "inherit", zIndex: 10,
      }}>Avbryt</button>
    </div>
  );
}

function StoreMode({ products, onClose }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showLabelScanner, setShowLabelScanner] = useState(false);
  const [scanMsg, setScanMsg] = useState(null);
  const [scanCode, setScanCode] = useState(null);
  const sv = React.useContext(SavedContext);
  const inputRef = useRef(null);

  // Recent searches (localStorage)
  const [recent, setRecent] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sf_recent_snabbkoll") || "[]"); } catch(e) { return []; }
  });
  const addRecent = (wine) => {
    const updated = [{ nr: wine.nr, name: wine.name, sub: wine.sub || "" },
      ...recent.filter(r => r.nr !== wine.nr)].slice(0, 5);
    setRecent(updated);
    try { localStorage.setItem("sf_recent_snabbkoll", JSON.stringify(updated)); } catch(e) {}
  };

  useEffect(() => { if (!showScanner) inputRef.current?.focus(); }, [showScanner]);

  // EAN → productNumber lookup (built over time from successful scans)
  const [eanMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sf_ean_map") || "{}"); } catch(e) { return {}; }
  });
  const saveEanMapping = (ean, nr) => {
    eanMap[ean] = nr;
    try { localStorage.setItem("sf_ean_map", JSON.stringify(eanMap)); } catch(e) {}
    // Also save server-side for all users
    fetch("https://smakfynd-analytics.smakfynd.workers.dev/ean", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ean, nr }), keepalive: true,
    }).catch(() => {});
  };

  const handleBarcodeScan = (code, format) => {
    setShowScanner(false);
    setTimeout(() => {
      track("snabbkoll_scan", { code, format });

      // 1. Direct productNumber match (shelf label)
      const byNr = products.find(p => String(p.nr) === code || String(p.nr) === code.replace(/^0+/, ""));
      if (byNr) {
        setQ(byNr.name);
        handleSelect(byNr);
        return;
      }

      // 2. Check local EAN mapping (learned from previous successful manual matches)
      if (eanMap[code]) {
        const mapped = products.find(p => String(p.nr) === eanMap[code]);
        if (mapped) {
          setQ(mapped.name);
          handleSelect(mapped);
          return;
        }
      }

      // 3. Check server-side EAN map (crowdsourced from all users)
      fetch(`https://smakfynd-analytics.smakfynd.workers.dev/ean?code=${code}`)
        .then(r => r.json())
        .then(eanData => {
          if (eanData.nr) {
            const serverMatch = products.find(p => String(p.nr) === eanData.nr);
            if (serverMatch && !selected) { setQ(serverMatch.name); handleSelect(serverMatch); setScanMsg(null); }
          }
        }).catch(() => {});

      // 4. Partial productNumber match
      const shortMatch = products.find(p => String(p.nr).startsWith(code) || code.startsWith(String(p.nr)));
      if (shortMatch) {
        setQ(shortMatch.name);
        handleSelect(shortMatch);
        return;
      }

      // 5. Not found — focus search input with helpful message
      setQ("");
      setSelected(null);
      setScanMsg(`Streckkoden ${code} kunde inte matchas automatiskt. Skriv vinets namn så hittar vi det.`);
      setScanCode(code);
      inputRef.current?.focus();
    }, 150);
  };

  // When user manually finds the wine after failed scan, learn the mapping
  const handleSelectWithLearn = (wine) => {
    handleSelect(wine);
    if (scanCode && wine.nr) {
      saveEanMapping(scanCode, String(wine.nr));
      setScanCode(null);
    }
  };

  const results = useMemo(() => {
    return fuzzySearch(products, q, ["name", "sub", "country", "grape", "region"]);
  }, [q, products]);

  const recs = useMemo(() => {
    return selected ? getRecommendations(selected, products) : [];
  }, [selected, products]);

  // Log Snabbkollen searches (debounced)
  useEffect(() => {
    if (!q || q.length < 2) return;
    const timer = setTimeout(() => trackSearch(q, results?.length || 0), 1500);
    return () => clearTimeout(timer);
  }, [q]);

  const handleSelect = (wine) => {
    setSelected(wine);
    addRecent(wine);
    track("snabbkoll_lookup", { nr: wine.nr, name: wine.name, source: "snabbkoll" });
  };

  const RecCard = ({ p, label, type }) => {
    const [_l, col] = getScoreInfo(p.smakfynd_score);
    const av = availLabel(p.avail || 0.25);
    return (
      <div onClick={() => handleSelect(p)} style={{
        display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
        borderRadius: 12, background: t.card, border: `1px solid ${t.bdrL}`,
        cursor: "pointer", transition: "border-color 0.2s", marginBottom: 6,
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = t.wine + "40"}
        onMouseLeave={e => e.currentTarget.style.borderColor = t.bdrL}
      >
        <ProductImage p={p} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontFamily: t.serif, color: t.tx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
          <div style={{ fontSize: 11, color: t.txL }}>{p.sub} · {p.country}</div>
          <div style={{ fontSize: 11, color: type === "B" ? t.green : type === "C" ? t.gold : t.txM, fontWeight: 500, marginTop: 2 }}>{label}</div>
          <div style={{ fontSize: 9, color: av.color, marginTop: 2 }}>{av.text}</div>
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: col, fontFamily: t.serif }}>{p.smakfynd_score}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.tx, fontFamily: t.serif }}>{p.price}{"\u00A0"}<span style={{ fontSize: 10, color: t.txL, fontWeight: 400 }}>kr</span></div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: t.sans, padding: "0 16px 40px" }}>
      {/* Header */}
      <div style={{ padding: "16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 18, fontFamily: t.serif, color: t.tx }}>Snabbkollen</div>
          <div style={{ fontSize: 11, color: t.txL }}>Kolla snabbt — i butik, hemma, eller på restaurang</div>
        </div>
        <button onClick={onClose} style={{
          padding: "8px 16px", borderRadius: 100, border: `1px solid ${t.bdr}`,
          background: t.card, color: t.txM, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
        }}>Hela rankingen</button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <input ref={inputRef} type="search" inputMode="search" value={q}
          onChange={e => { setQ(e.target.value); setSelected(null); setScanMsg(null); }}
          placeholder="Skriv vinets namn, druva eller artikelnummer..."
          style={{
            width: "100%", padding: "16px 16px 16px 46px", borderRadius: 14,
            border: `2px solid ${selected ? t.green + "40" : t.wine + "30"}`, background: t.card, fontSize: 16,
            color: t.tx, outline: "none", boxSizing: "border-box", fontFamily: t.serif,
          }}
          onFocus={e => e.target.style.borderColor = t.wine}
          onBlur={e => e.target.style.borderColor = selected ? t.green + "40" : t.wine + "30"}
        />
        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: t.txL, pointerEvents: "none" }}>⌕</span>
      </div>

      {/* Scan buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setShowScanner(true)} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "14px 12px", borderRadius: 12,
          border: `1.5px solid ${t.wine}25`, background: t.card,
          cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: t.tx,
          transition: "all 0.2s",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.wine} strokeWidth="2" strokeLinecap="round">
            <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/>
            <line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="8" x2="10" y2="8"/><line x1="14" y1="8" x2="17" y2="8"/>
          </svg>
          Skanna hyllkant
        </button>
        <button onClick={() => setShowLabelScanner(true)} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "14px 12px", borderRadius: 12,
          border: `1.5px solid ${t.bdr}`, background: t.card,
          cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500, color: t.txM,
          transition: "all 0.2s",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.txM} strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M5 21c0-3 3-5 7-5s7 2 7 5"/>
          </svg>
          Skanna etikett
          <span style={{ fontSize: 9, background: t.bg, padding: "1px 5px", borderRadius: 4, color: t.txL, fontWeight: 600 }}>BETA</span>
        </button>
      </div>

      {/* Scanner overlays */}
      {showScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />}
      {showLabelScanner && <LabelScanner products={products} onMatch={p => { setQ(p.name); handleSelectWithLearn(p); }} onClose={() => setShowLabelScanner(false)} />}

      {/* Scan message */}
      {scanMsg && (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: `${t.deal}08`, border: `1px solid ${t.deal}20`, marginBottom: 12, fontSize: 12, color: t.deal }}>
          {scanMsg}
        </div>
      )}

      {/* Recent searches */}
      {!q && !selected && recent.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Senaste sökningar</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {recent.map(r => (
              <button key={r.nr} onClick={() => { setQ(r.name); const w = products.find(p => String(p.nr) === String(r.nr)); if (w) handleSelect(w); }}
                style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${t.bdrL}`, background: t.card, fontSize: 12, color: t.txM, cursor: "pointer", fontFamily: "inherit" }}>
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search results (when typing, before selecting) */}
      {q && !selected && results.length > 0 && (
        <div>
          {results.map(p => {
            const [_l, col] = getScoreInfo(p.smakfynd_score);
            return (
              <div key={p.nr} onClick={() => { handleSelectWithLearn(p); setQ(p.name); setScanMsg(null); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, cursor: "pointer", transition: "background 0.15s", marginBottom: 2 }}
                onMouseEnter={e => e.currentTarget.style.background = t.card}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <ProductImage p={p} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: t.tx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name} <span style={{ color: t.txL }}>{p.sub}</span></div>
                  <div style={{ fontSize: 11, color: t.txL }}>{p.country} · {p.grape} · {p.price}{"\u00A0"}kr</div>
                </div>
                <span style={{ fontSize: 18, fontWeight: 900, color: col, fontFamily: t.serif }}>{p.smakfynd_score}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* No results */}
      {q && q.length >= 2 && !selected && results.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 20px", color: t.txL }}>
          <div style={{ fontSize: 14, color: t.txM, marginBottom: 4 }}>Hittade inget vin med "{q}"</div>
          <div style={{ fontSize: 12 }}>Prova vinets namn, druva eller artikelnummer</div>
        </div>
      )}

      {/* Selected wine + recommendations */}
      {selected && (
        <div>
          {/* Main card — use the full Card component */}
          <div style={{ marginBottom: 12 }}>
            <Card p={selected} rank={1} delay={0} allProducts={products} autoOpen={true} auth={{}} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={() => { setSelected(null); setQ(""); inputRef.current?.focus(); }}
              style={{ fontSize: 12, color: t.wine, background: "none", border: `1px solid ${t.wine}30`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>
              Sök nytt vin
            </button>
          </div>

          {/* Recommendations */}
          {recs.length > 0 ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.txL, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Bättre alternativ
              </div>
              {recs.map((r, i) => <RecCard key={i} p={r} label={r._recLabel} type={r._recType} />)}
            </div>
          ) : (
            <div>
              <div style={{ padding: "16px 18px", borderRadius: 12, background: `${t.green}08`, border: `1px solid ${t.green}20`, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.green }}>Du gjorde rätt val</div>
                <div style={{ fontSize: 12, color: t.txM, marginTop: 2 }}>Inget bättre i prisklassen just nu.</div>
              </div>
              {/* Similar wines you might like */}
              {(() => {
                const selVol = selected.vol || 750;
                const similar = products
                  .filter(w => w.nr !== selected.nr && w.category === selected.category && w.package === selected.package && w.assortment === "Fast sortiment" && Math.abs((w.vol || 750) - selVol) / selVol < 0.3)
                  .map(w => {
                    let sim = 0;
                    if (w.grape && selected.grape && w.grape.toLowerCase() === selected.grape.toLowerCase()) sim += 20;
                    if (w.country === selected.country) sim += 10;
                    if (w.region && selected.region && w.region === selected.region) sim += 15;
                    if (w.taste_body && selected.taste_body) sim += (1 - Math.abs(w.taste_body - selected.taste_body) / 12) * 15;
                    return { ...w, _sim: sim };
                  })
                  .filter(w => w._sim >= 8)
                  .sort((a, b) => b._sim - a._sim || b.smakfynd_score - a.smakfynd_score)
                  .slice(0, 3);
                if (similar.length === 0) return null;
                return (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: t.txL, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                      Du kanske också gillar
                    </div>
                    {similar.map((r, i) => <RecCard key={i} p={r} label={`Liknande stil${r.grape && selected.grape && r.grape.toLowerCase() === selected.grape.toLowerCase() ? ", samma druva" : ""}`} type="A" />)}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Empty state: Veckans fynd */}
      {!q && !selected && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, color: t.txL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Veckans fynd</div>
          {products
            .filter(p => p.assortment === "Fast sortiment" && p.package === "Flaska" && p.smakfynd_score >= 78)
            .sort((a, b) => b.smakfynd_score - a.smakfynd_score)
            .slice(0, 5)
            .map((p, i) => {
              const [_l, col] = getScoreInfo(p.smakfynd_score);
              return (
                <div key={i} onClick={() => { setQ(p.name); handleSelect(p); }} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
                  borderTop: i > 0 ? `1px solid ${t.bdrL}` : "none", cursor: "pointer",
                }}>
                  <ProductImage p={p} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: t.tx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: t.txL }}>{p.sub} · {p.price}{"\u00A0"}kr</div>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 900, color: col, fontFamily: t.serif }}>{p.smakfynd_score}</span>
                </div>
              );
            })
          }
        </div>
      )}
    </div>
  );
}
