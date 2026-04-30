#!/usr/bin/env python3
"""Deploy smakfynd JSX to docs/index.html with full SEO."""
import os, re, json, subprocess
from pathlib import Path

BASE = str(Path(__file__).parent.parent)
JSX_PATH = os.path.join(BASE, "site", "smakfynd-v7-slim.jsx")
DATA_PATH = os.path.join(BASE, "data", "smakfynd_ranked_v2.json")
OUT_PATH = os.path.join(BASE, "docs", "index.html")
JS_PATH = os.path.join(BASE, "site", "smakfynd-v7-slim.js")

# Pre-transpile JSX → JS (removes need for 1.2 MB Babel in browser)
print("Transpiling JSX → JS with Babel...")
result = subprocess.run(
    ["npx", "babel", "--presets", "@babel/preset-react", JSX_PATH, "-o", JS_PATH],
    capture_output=True, text=True, cwd=BASE
)
if result.returncode != 0:
    print(f"Babel error: {result.stderr}")
    raise SystemExit(1)
print(f"  {os.path.getsize(JS_PATH)/1024:.0f} KB transpiled")

js = open(JS_PATH).read()
js = re.sub(r'^import\s+\{[^}]+\}\s+from\s+"react";\s*\n', '', js)

m = re.search(r'export\s+default\s+function\s+(\w+)', js)
if m:
    comp = m.group(1)
else:
    m2 = re.search(r'export\s+default\s+(\w+)', js)
    comp = m2.group(1) if m2 else "Smakfynd"

js = re.sub(r'export\s+default\s+', '', js)

# Load data for noscript content and structured data
wines = []
if os.path.exists(DATA_PATH):
    all_wines = json.load(open(DATA_PATH))
    wines = sorted(
        [w for w in all_wines if w.get('assortment') == 'Fast sortiment' and w.get('smakfynd_score', 0) >= 70],
        key=lambda x: -x['smakfynd_score']
    )[:30]

# Build noscript HTML (visible to crawlers)
noscript_wines = ""
for w in wines[:20]:
    name = w.get('name', '')
    sub = w.get('sub', '')
    country = w.get('country', '')
    price = w.get('price', 0)
    score = w.get('smakfynd_score', 0)
    grape = w.get('grape', '')
    nr = w.get('nr', '')
    noscript_wines += f'<li><a href="https://www.systembolaget.se/produkt/vin/{nr}"><strong>{name}</strong> — {sub}</a> · {country} · {grape} · {price} kr · Smakfynd-poäng: {score}/100</li>\n'

# Build JSON-LD structured data
json_ld = json.dumps({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Smakfynd",
    "url": "https://smakfynd.se",
    "description": "Hitta bästa vinerna för pengarna på Systembolaget. Rankat efter kvalitet per krona med crowd-betyg, expertrecensioner och prisjämförelse.",
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "Web",
    "author": {
        "@type": "Organization",
        "name": "Olav Innovation AB",
        "founder": {
            "@type": "Person",
            "name": "Gabriel Linton"
        }
    },
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "SEK"
    },
    "aggregateRating": {
        "@type": "AggregateRating",
        "ratingCount": len(wines),
        "bestRating": 100,
        "worstRating": 1,
        "ratingValue": round(sum(w['smakfynd_score'] for w in wines) / max(1, len(wines)))
    }
}, ensure_ascii=False)

# Top wines as ReviewAction items
wine_ld = []
for w in wines[:10]:
    wine_ld.append({
        "@type": "Review",
        "itemReviewed": {
            "@type": "Product",
            "name": f"{w.get('name','')} {w.get('sub','')}".strip(),
            "category": "Wine",
            "brand": {"@type": "Brand", "name": w.get('name', '')},
        },
        "reviewRating": {
            "@type": "Rating",
            "ratingValue": w.get('smakfynd_score', 0),
            "bestRating": 100,
            "worstRating": 1,
        },
        "author": {"@type": "Organization", "name": "Smakfynd"},
        "publisher": {"@type": "Organization", "name": "Smakfynd"},
    })

wine_ld_json = json.dumps(wine_ld, ensure_ascii=False)

# FAQPage structured data (enables rich snippets in Google)
faq_ld = json.dumps({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {"@type": "Question", "name": "Hur beräknas Smakfynd-poängen?",
         "acceptedAnswer": {"@type": "Answer", "text": "Varje vin bedöms på tre saker: crowd-betyg (vad vanliga människor tycker), expertrecensioner (vinkritiker som James Suckling, Decanter m.fl.) och prisvärde (hur priset förhåller sig till andra viner i samma kategori). Hög kvalitet till lågt pris = hög poäng. Poängen visas på en skala 1–100."}},
        {"@type": "Question", "name": "Var kommer betygen ifrån?",
         "acceptedAnswer": {"@type": "Answer", "text": "Crowd-betyg kommer från hundratusentals vindrickare världen över. Expertbetyg hämtas från erkända vinkritiker som James Suckling, Falstaff, Decanter och Wine Enthusiast. Prisvärdet beräknar vi själva genom att jämföra literpriset mot medianen i samma kategori — rött jämförs med rött, bubbel med bubbel."}},
        {"@type": "Question", "name": "Hur fungerar AI-vinmatcharen?",
         "acceptedAnswer": {"@type": "Answer", "text": "Beskriv vad du ska äta — till exempel 'grillad lax med potatisgratäng' eller 'toast skagen, sedan entrecôte'. Vår AI analyserar måltiden och föreslår viner för varje rätt i olika prisklasser, direkt från Systembolagets sortiment."}},
        {"@type": "Question", "name": "Säljer Smakfynd alkohol?",
         "acceptedAnswer": {"@type": "Answer", "text": "Nej. Smakfynd är en helt oberoende informationstjänst som drivs av Olav Innovation AB. Vi har ingen koppling till Systembolaget. Alla köp gör du via Systembolaget.se."}},
        {"@type": "Question", "name": "Hur ofta uppdateras sajten?",
         "acceptedAnswer": {"@type": "Answer", "text": "Varje vecka. Vi hämtar hela Systembolagets sortiment, uppdaterar betyg och räknar om poängen. Prishistoriken uppdateras samtidigt."}},
    ]
}, ensure_ascii=False)

num_wines = len(all_wines) if os.path.exists(DATA_PATH) else 800
num_countries = len(set(w.get('country','') for w in all_wines if w.get('country'))) if os.path.exists(DATA_PATH) else 18

from datetime import datetime
TODAY = datetime.now().strftime('%Y-%m-%d')
MONTH_SV = ['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'][datetime.now().month - 1]

# SameAs links for Organization
org_ld = json.dumps({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Smakfynd",
    "alternateName": "Olav Innovation AB",
    "url": "https://smakfynd.se",
    "logo": "https://smakfynd.se/og-image.png",
    "founder": {
        "@type": "Person",
        "name": "Gabriel Linton",
        "jobTitle": "Grundare",
        "alumniOf": [
            {"@type": "EducationalOrganization", "name": "Restaurang- och hotellhögskolan, Grythyttan"},
            {"@type": "EducationalOrganization", "name": "Örebro universitet"},
            {"@type": "EducationalOrganization", "name": "Cleveland State University"}
        ]
    },
    "sameAs": ["https://smakfynd.substack.com"],
}, ensure_ascii=False)

# SiteNavigationElement for sitelinks
nav_ld = json.dumps({
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    "name": "Smakfynd",
    "hasPart": [
        {"@type": "WebPage", "name": "Bästa röda viner", "url": "https://smakfynd.se/basta-roda-vin/"},
        {"@type": "WebPage", "name": "Bästa vita viner", "url": "https://smakfynd.se/basta-vita-vin/"},
        {"@type": "WebPage", "name": "Bästa bubbel", "url": "https://smakfynd.se/basta-bubbel/"},
        {"@type": "WebPage", "name": "Vin under 100 kr", "url": "https://smakfynd.se/vin-under-100-kr/"},
        {"@type": "WebPage", "name": "Ekologiskt vin", "url": "https://smakfynd.se/ekologiskt-vin/"},
        {"@type": "WebPage", "name": "Vin till grillat", "url": "https://smakfynd.se/vin-till-grillat/"},
    ]
}, ensure_ascii=False)

# Generate noscript landing page links for internal linking
noscript_links = """
      <h2>Utforska viner per kategori</h2>
      <h3>Per druva</h3>
      <ul>
        <li><a href="/basta-cabernet-sauvignon/">Bästa Cabernet Sauvignon</a></li>
        <li><a href="/basta-malbec/">Bästa Malbec</a></li>
        <li><a href="/basta-pinot-noir/">Bästa Pinot Noir</a></li>
        <li><a href="/basta-syrah-shiraz/">Bästa Syrah &amp; Shiraz</a></li>
        <li><a href="/basta-tempranillo/">Bästa Tempranillo</a></li>
        <li><a href="/basta-sangiovese/">Bästa Sangiovese</a></li>
        <li><a href="/basta-chardonnay/">Bästa Chardonnay</a></li>
        <li><a href="/basta-riesling/">Bästa Riesling</a></li>
        <li><a href="/basta-sauvignon-blanc/">Bästa Sauvignon Blanc</a></li>
      </ul>
      <h3>Per land</h3>
      <ul>
        <li><a href="/basta-italienska-vin/">Bästa italienska viner</a></li>
        <li><a href="/basta-franska-vin/">Bästa franska viner</a></li>
        <li><a href="/basta-spanska-vin/">Bästa spanska viner</a></li>
        <li><a href="/basta-chilenska-vin/">Bästa chilenska viner</a></li>
        <li><a href="/basta-sydafrikanska-vin/">Bästa sydafrikanska viner</a></li>
        <li><a href="/basta-australiska-vin/">Bästa australiska viner</a></li>
        <li><a href="/basta-portugisiska-vin/">Bästa portugisiska viner</a></li>
      </ul>
      <h3>Per tillfälle</h3>
      <ul>
        <li><a href="/vin-till-grillat/">Vin till grillat</a></li>
        <li><a href="/vin-till-fisk/">Vin till fisk</a></li>
        <li><a href="/vin-till-ost/">Vin till ost</a></li>
        <li><a href="/vin-till-kyckling/">Vin till kyckling</a></li>
        <li><a href="/vin-till-dejt/">Vin till dejt</a></li>
        <li><a href="/vin-till-pasta/">Vin till pasta</a></li>
      </ul>
      <h3>Per pris</h3>
      <ul>
        <li><a href="/vin-under-100-kr/">Bästa viner under 100 kr</a></li>
        <li><a href="/vin-under-150-kr/">Bästa viner under 150 kr</a></li>
        <li><a href="/vin-under-200-kr/">Bästa viner under 200 kr</a></li>
        <li><a href="/basta-premium-vin/">Bästa premiumviner 200-500 kr</a></li>
        <li><a href="/ekologiskt-vin/">Ekologiska viner</a></li>
      </ul>
"""

html = f"""<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>Smakfynd — Hitta bästa vinerna på Systembolaget {datetime.now().year}</title>
  <meta name="description" content="Smakfynd rankar {num_wines} viner från {num_countries} länder efter kvalitet per krona. Crowd-betyg + expertrecensioner + prisjämförelse = Smakfynd-poäng. Uppdaterad {MONTH_SV} {datetime.now().year}.">
  <meta name="author" content="Gabriel Linton">
  <meta name="theme-color" content="#7a2332">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://gc.zgo.at https://unpkg.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https://product-cdn.systembolaget.se data:; connect-src 'self' https://*.smakfynd.workers.dev https://unpkg.com https://cdn.jsdelivr.net https://tessdata.projectnaptha.com; media-src 'self' blob:; frame-ancestors 'none'">
  <link rel="canonical" href="https://smakfynd.se">

  <!-- Preconnect for faster loading -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://product-cdn.systembolaget.se">
  <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&family=Inter:wght@300;400;500;600;700&display=swap" as="style">
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

  <!-- Open Graph -->
  <meta property="og:title" content="Smakfynd — Bästa vinerna på Systembolaget {datetime.now().year}">
  <meta property="og:description" content="Vi rankar hela Systembolagets butikssortiment efter kvalitet per krona. Crowd-betyg, expertrecensioner och AI-vinmatchning. Gratis.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://smakfynd.se">
  <meta property="og:image" content="https://smakfynd.se/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="sv_SE">
  <meta property="og:site_name" content="Smakfynd">
  <meta property="article:modified_time" content="{TODAY}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Smakfynd — Bästa vinerna på Systembolaget {datetime.now().year}">
  <meta name="twitter:description" content="Vi rankar hela Systembolagets sortiment efter kvalitet per krona.">
  <meta name="twitter:image" content="https://smakfynd.se/og-image.png">

  <!-- Structured Data -->
  <script type="application/ld+json">{json_ld}</script>
  <script type="application/ld+json">{wine_ld_json}</script>
  <script type="application/ld+json">{faq_ld}</script>
  <script type="application/ld+json">{org_ld}</script>
  <script type="application/ld+json">{nav_ld}</script>

  <style>
    :root {{
      --bg: #f5f1ea; --surface: #fdfbf7; --card: #ffffff;
      --bdr: #e2d8c8; --bdr-light: #ede6da;
      --wine: #8b2332; --wine-dark: #6b1a27;
      --tx: #1a1510; --tx-mid: #3d3830; --tx-light: #6b6355; --tx-faint: #9e9588;
      --green: #2d7a3e; --deal: #c44020; --gold: #b08d40;
      --radius-card: 14px; --radius-pill: 100px; --radius-input: 12px;
      --font-serif: 'Instrument Serif', Georgia, serif;
      --font-sans: 'DM Sans', -apple-system, sans-serif;
      --sh-sm: 0 1px 3px rgba(26,21,16,0.04);
      --sh-md: 0 4px 12px rgba(26,21,16,0.06);
      --sh-lg: 0 8px 24px rgba(26,21,16,0.08);
    }}
    body {{ margin: 0; background: var(--bg); font-family: var(--font-sans); color: var(--tx); -webkit-font-smoothing: antialiased; }}
  </style>
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='19' fill='%237a2332'/><text x='20' y='27' text-anchor='middle' font-family='Georgia,serif' font-size='22' fill='%23f5ede3'>S</text></svg>">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
</head>
<body>
  <div id="root"></div>

  <!-- Noscript fallback: visible to search engines and AI crawlers -->
  <noscript>
    <div style="max-width:700px;margin:0 auto;padding:40px 20px;font-family:Georgia,serif">
      <h1>Smakfynd — Smartare vinval på Systembolaget</h1>
      <p>Smakfynd rankar {num_wines} viner från {num_countries} länder efter kvalitet i förhållande till pris.
      Vi kombinerar crowd-betyg från hundratusentals användare med expertrecensioner från vinkritiker
      och jämför priset relativt kategorin. Resultatet: en enda poäng som visar kvalitet per krona.</p>

      <h2>Så fungerar Smakfynd-poängen</h2>
      <p>Varje vin bedöms på tre dimensioner:</p>
      <ul>
        <li><strong>Crowd-betyg</strong> — betyg från hundratusentals vanliga vindrickare</li>
        <li><strong>Expertrecensioner</strong> — poäng från erkända vinkritiker som James Suckling, Decanter och Falstaff</li>
        <li><strong>Prisvärde</strong> — vinets pris jämfört med medianen i sin kategori</li>
      </ul>
      <p>Kvalitet väger 75%, prisvärde 25%. Ekologiska viner får en liten bonus.</p>

      <h2>AI-vinmatchare</h2>
      <p>Beskriv din måltid och få personliga vinförslag baserat på AI-analys matchad mot vår databas.
      Till exempel: "Toast skagen till förrätt, sedan oxfilé med rödvinssky" — och vi föreslår viner
      för varje rätt i olika prisklasser.</p>

      <h2>Topp 20 viner just nu</h2>
      <ol>
{noscript_wines}
      </ol>

      {noscript_links}

      <h2>Om Smakfynd</h2>
      <p>Smakfynd är en oberoende tjänst skapad av Gabriel Linton, utbildad i dryckeskunskap vid
      Restaurang- och hotellhögskolan i Grythyttan och forskare vid Örebro universitet.
      Drivs av Olav Innovation AB. Ingen koppling till Systembolaget. Vi säljer inte alkohol.</p>
      <p>Uppdaterad {MONTH_SV} {datetime.now().year} — {num_wines} viner från {num_countries} länder.</p>

      <p><a href="https://smakfynd.se">Besök Smakfynd</a> — kräver JavaScript.</p>
    </div>
  </noscript>

  <script>
    const {{ useState, useMemo, useEffect, useRef }} = React;

{js}

    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(React.createElement({comp}));
  </script>
<script>if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js')</script>
<script data-goatcounter="https://smakfynd.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</body>
</html>"""

os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
with open(OUT_PATH, "w") as f:
    f.write(html)
print(f"Built: {OUT_PATH} ({os.path.getsize(OUT_PATH)/1024:.0f} KB)")
print(f"Main component: {comp}")
print(f"Noscript: {len(wines)} wines, JSON-LD: app + {len(wine_ld)} reviews")
