#!/usr/bin/env python3
"""
Generate a rich price drop page for Smakfynd.
Shows wines that have been reduced in price with:
- Old price → new price with savings
- Date of price drop
- Smakfynd score + link to wine card
- Sorted by biggest savings

Run: python3 scripts/generate_prissankt.py
Output: docs/prissankt/index.html
"""

import json, os, glob
from datetime import datetime, date
from pathlib import Path

BASE = str(Path(__file__).parent.parent)
DATA_DIR = os.path.join(BASE, "data")
DOCS = os.path.join(BASE, "docs")
HIST_DIR = os.path.join(DATA_DIR, "history")

NOW = datetime.now()
MONTH_SV = ['januari','februari','mars','april','maj','juni',
            'juli','augusti','september','oktober','november','december'][NOW.month - 1]
YEAR = NOW.year
DATE_STR = f"{MONTH_SV} {YEAR}"
TODAY_ISO = NOW.strftime('%Y-%m-%d')

# Load current wine data
all_wines = json.load(open(os.path.join(DATA_DIR, "smakfynd_ranked_v2.json")))
wine_by_nr = {str(w.get('nr','')): w for w in all_wines}

# Load first-seen prices
first_seen_file = os.path.join(HIST_DIR, "first_seen_prices.json")
first_seen = {}
if os.path.exists(first_seen_file):
    first_seen = json.load(open(first_seen_file))

# Load bootstrap price data
bootstrap_file = os.path.join(DATA_DIR, "prissankt_bootstrap.json")
bootstrap = {}
if os.path.exists(bootstrap_file):
    for d in json.load(open(bootstrap_file)):
        bootstrap[str(d['nr'])] = d

# Find all price drops — collect from multiple sources
drops = []
for w in all_wines:
    nr = str(w.get('nr', ''))
    current_price = w.get('price', 0)
    if not current_price or not nr:
        continue

    old_price = None
    drop_date = None

    # Check our own price history FIRST (most reliable)
    if nr in first_seen:
        hist = first_seen[nr]
        first_price = hist.get('price', 0) if isinstance(hist, dict) else hist
        if first_price and first_price > current_price:
            old_price = first_price
            drop_date = hist.get('date', '') if isinstance(hist, dict) else None

    # Use bootstrap if our history confirms OR doesn't contradict
    if not old_price and nr in bootstrap:
        b = bootstrap[nr]
        if b.get('price_now') and abs(b['price_now'] - current_price) < 5:
            bootstrap_old = b.get('price_old')
            if nr in first_seen:
                hist = first_seen[nr]
                our_first = hist.get('price', 0) if isinstance(hist, dict) else hist
                # Skip if our first-seen = current AND bootstrap claims >50% drop (suspicious)
                if our_first and abs(our_first - current_price) < 2 and bootstrap_old and bootstrap_old > current_price * 1.5:
                    pass  # Suspicious: we never saw the higher price
                else:
                    old_price = bootstrap_old
            else:
                old_price = bootstrap_old

    if old_price and old_price > current_price:
        savings = old_price - current_price
        pct = round((savings / old_price) * 100)
        if pct >= 5:  # minimum 5% drop
            drops.append({
                **w,
                'old_price': old_price,
                'savings': savings,
                'drop_pct': pct,
                'drop_date': drop_date,
            })

# Also check daily snapshots for recent drops
snapshot_files = sorted(glob.glob(os.path.join(HIST_DIR, "prices_*.json")))
if len(snapshot_files) >= 2:
    latest = json.load(open(snapshot_files[-1]))
    # Compare with snapshot from 7 days ago (or earliest available)
    compare_idx = max(0, len(snapshot_files) - 8)
    compare = json.load(open(snapshot_files[compare_idx]))
    compare_date = os.path.basename(snapshot_files[compare_idx]).replace('prices_', '').replace('.json', '')

    for nr, old_p in compare.items():
        if nr in latest and latest[nr] < old_p:
            savings = old_p - latest[nr]
            pct = round((savings / old_p) * 100)
            if pct >= 5 and not any(d.get('nr') == nr for d in drops):
                w = wine_by_nr.get(nr, {})
                if w:
                    drops.append({
                        **w,
                        'old_price': old_p,
                        'savings': savings,
                        'drop_pct': pct,
                        'drop_date': compare_date,
                    })

# Sort: highest percentage drop first, then by savings amount
drops.sort(key=lambda x: (-x['drop_pct'], -x['savings']))

print(f"Found {len(drops)} price drops (≥5%)")

def score_label(score):
    if score >= 90: return "Exceptionellt fynd"
    if score >= 80: return "Toppköp"
    if score >= 70: return "Starkt fynd"
    if score >= 60: return "Bra köp"
    return "Okej värde"

def render_drop_row(d, rank):
    name = d.get('name', '')
    sub = d.get('sub', '')
    score = d.get('smakfynd_score', 0)
    price = d.get('price', 0)
    old_price = d.get('old_price', 0)
    savings = d.get('savings', 0)
    pct = d.get('drop_pct', 0)
    country = d.get('country', '')
    grape = d.get('grape', '')
    nr = d.get('nr', '')
    label = score_label(score)
    drop_date = d.get('drop_date', '')
    date_str = f' · Sänkt {drop_date}' if drop_date else ''

    return f'''<li style="padding:18px 0;border-bottom:1px solid #e6ddd0">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
    <div style="flex:1">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span style="background:#c44020;color:#fff;font-size:11px;font-weight:800;padding:3px 8px;border-radius:6px">−{pct}%</span>
        <span style="font-size:13px;color:#c44020;font-weight:600">Spara {savings:.0f} kr</span>
      </div>
      <a href="https://smakfynd.se/#vin/{nr}" style="text-decoration:none">
        <strong style="font-size:18px;font-family:'Instrument Serif',Georgia,serif;color:#1e1710">{name}</strong>
        <span style="color:#7a7060;font-size:14px"> — {sub}</span>
      </a>
      <div style="font-size:13px;color:#4a4238;margin-top:3px">{country} · {grape}</div>
      <div style="margin-top:6px;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">
        <span style="font-size:22px;font-weight:700;font-family:'Instrument Serif',Georgia,serif;color:#1e1710">{price:.0f} kr</span>
        <span style="font-size:15px;color:#7a7060;text-decoration:line-through">{old_price:.0f} kr</span>
        <span style="font-size:11px;color:#7a7060">{date_str}</span>
      </div>
      <div style="margin-top:8px;display:flex;gap:10px">
        <a href="https://smakfynd.se/#vin/{nr}" style="font-size:13px;color:#8b2332;text-decoration:none;font-weight:500">Se vinkort →</a>
        <a href="https://www.systembolaget.se/produkt/vin/{nr}" target="_blank" rel="noopener" style="font-size:13px;color:#4a4238;text-decoration:none">Köp på Systembolaget →</a>
      </div>
    </div>
    <div style="text-align:center;flex-shrink:0">
      <div style="width:54px;height:54px;border-radius:50%;background:#e8f0e4;border:2px solid #2d6b3f;display:flex;align-items:center;justify-content:center">
        <span style="font-size:20px;font-weight:900;color:#2d6b3f;font-family:'Instrument Serif',Georgia,serif">{score}</span>
      </div>
      <div style="font-size:10px;color:#2d6b3f;margin-top:2px">{label}</div>
    </div>
  </div>
</li>'''

# Build JSON-LD
items_ld = []
for i, d in enumerate(drops[:10]):
    items_ld.append({
        "@type": "ListItem", "position": i + 1,
        "item": {
            "@type": "Product",
            "name": f"{d.get('name','')} {d.get('sub','')}".strip(),
            "offers": {
                "@type": "Offer", "price": str(d.get('price', 0)), "priceCurrency": "SEK",
                "availability": "https://schema.org/InStock",
                "url": f"https://www.systembolaget.se/produkt/vin/{d.get('nr','')}",
            },
        }
    })

ld_json = json.dumps({"@context": "https://schema.org", "@type": "ItemList",
    "name": f"Prissänkta viner på Systembolaget {YEAR}",
    "numberOfItems": len(drops), "itemListElement": items_ld}, ensure_ascii=False)

breadcrumb_ld = json.dumps({"@context": "https://schema.org", "@type": "BreadcrumbList",
    "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Smakfynd", "item": "https://smakfynd.se"},
        {"@type": "ListItem", "position": 2, "name": "Prissänkta viner"},
    ]}, ensure_ascii=False)

faq_ld = json.dumps({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
    {"@type": "Question", "name": "Hur hittar Smakfynd prissänkningar?",
     "acceptedAnswer": {"@type": "Answer", "text": "Vi sparar priset varje dag och jämför mot tidigare priser. När ett vin sänks med minst 5% flaggar vi det här. Systembolaget skyltar inte alltid med prissänkningar — vi håller koll åt dig."}},
    {"@type": "Question", "name": "Hur länge gäller prissänkningarna?",
     "acceptedAnswer": {"@type": "Answer", "text": f"Priserna kan ändras när som helst. Listan uppdateras dagligen. Senast uppdaterad {DATE_STR}."}},
]}, ensure_ascii=False)

# Summary stats
total_savings = sum(d['savings'] for d in drops)
avg_pct = round(sum(d['drop_pct'] for d in drops) / max(1, len(drops)))

wines_html = '\n'.join(render_drop_row(d, i+1) for i, d in enumerate(drops))

html = f'''<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prissänkta viner på Systembolaget {YEAR} — Smakfynd</title>
  <meta name="description" content="{len(drops)} viner har sänkts i pris på Systembolaget just nu. Spara upp till {drops[0]['drop_pct'] if drops else 0}%. Uppdaterad {DATE_STR}.">
  <meta name="author" content="Gabriel Linton">
  <meta name="theme-color" content="#7a2332">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <link rel="canonical" href="https://smakfynd.se/prissankt/">
  <meta property="og:title" content="Prissänkta viner på Systembolaget — {len(drops)} fynd just nu">
  <meta property="og:description" content="Systembolaget skyltar inte alltid med prissänkningar. Vi håller koll — {len(drops)} viner sänkta just nu.">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://smakfynd.se/prissankt/">
  <meta property="og:image" content="https://smakfynd.se/og-image.png">
  <meta property="og:locale" content="sv_SE">
  <meta property="og:site_name" content="Smakfynd">
  <meta property="article:modified_time" content="{TODAY_ISO}">
  <script type="application/ld+json">{ld_json}</script>
  <script type="application/ld+json">{breadcrumb_ld}</script>
  <script type="application/ld+json">{faq_ld}</script>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='19' fill='%237a2332'/><text x='20' y='27' text-anchor='middle' font-family='Georgia,serif' font-size='22' fill='%23f5ede3'>S</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;background:#f7f3ec;font-family:'DM Sans',-apple-system,sans-serif;color:#1e1710">
  <div style="max-width:640px;margin:0 auto;padding:24px 20px 60px">

    <header style="margin-bottom:28px">
      <a href="https://smakfynd.se" style="text-decoration:none;display:inline-block;margin-bottom:16px">
        <span style="font-family:Georgia,serif;font-size:22px;color:#7a2332">Smakfynd</span>
      </a>
      <h1 style="margin:0 0 8px;font-size:28px;font-family:'Instrument Serif',Georgia,serif;font-weight:400;line-height:1.2">
        Prissänkta viner på Systembolaget
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#4a4238;line-height:1.6">
        Systembolaget skyltar inte alltid med prissänkningar. Vi jämför priser varje dag och flaggar
        viner som blivit billigare. Här är alla aktuella prissänkningar — sorterade efter störst rabatt.
      </p>

      {f"""
      <div style="display:flex;gap:12px;margin-bottom:16px">
        <div style="flex:1;padding:14px 16px;border-radius:12px;background:#c4402010;text-align:center">
          <div style="font-size:24px;font-weight:700;color:#c44020;font-family:'Instrument Serif',serif">{len(drops)}</div>
          <div style="font-size:11px;color:#c44020;font-weight:500">prissänkta viner</div>
        </div>
        <div style="flex:1;padding:14px 16px;border-radius:12px;background:#c4402010;text-align:center">
          <div style="font-size:24px;font-weight:700;color:#c44020;font-family:'Instrument Serif',serif">−{avg_pct}%</div>
          <div style="font-size:11px;color:#c44020;font-weight:500">snittrabatt</div>
        </div>
        <div style="flex:1;padding:14px 16px;border-radius:12px;background:#c4402010;text-align:center">
          <div style="font-size:24px;font-weight:700;color:#c44020;font-family:'Instrument Serif',serif">−{drops[0]['drop_pct']}%</div>
          <div style="font-size:11px;color:#c44020;font-weight:500">bästa rabatten</div>
        </div>
      </div>
      """ if drops else ""}

      <p style="margin:0;font-size:12px;color:#7a7060">
        Uppdaterad {DATE_STR} · Priser jämförs dagligen · <a href="https://smakfynd.se" style="color:#8b2332">Utforska alla viner →</a>
      </p>
    </header>

    {"<ol style='list-style:none;padding:0;margin:0'>" + wines_html + "</ol>" if drops else "<p style='font-size:15px;color:#7a7060;text-align:center;padding:40px 0'>Inga prissänkningar hittade just nu. Kom tillbaka snart!</p>"}

    <div style="margin-top:32px;padding:20px;border-radius:14px;background:#fefcf8;border:1px solid #e6ddd0">
      <h2 style="margin:0 0 8px;font-size:18px;font-family:'Instrument Serif',serif;font-weight:400">Hur hittar vi prissänkningar?</h2>
      <p style="margin:0;font-size:13px;color:#4a4238;line-height:1.6">
        Vi sparar priset på varje vin varje dag. När ett pris sjunker med minst 5% flaggar vi det här.
        Systembolaget har ingen offentlig lista över prissänkningar — men vi håller koll automatiskt.
        Listan uppdateras dagligen.
      </p>
    </div>

    <div style="margin-top:24px;text-align:center">
      <a href="https://smakfynd.se" style="display:inline-block;padding:14px 32px;border-radius:14px;background:linear-gradient(145deg,#8b2332,#6b1a27);color:#fff;font-size:15px;font-weight:600;text-decoration:none">
        Utforska alla viner på Smakfynd →
      </a>
    </div>

    <div style="margin-top:24px;padding:16px 20px;border-radius:14px;background:#fefcf8;border:1px solid #e6ddd0">
      <div style="font-size:12px;font-weight:600;color:#1e1710;margin-bottom:6px">Se även</div>
      <div style="font-size:13px;color:#4a4238;line-height:2">
        <a href="/vin-under-100-kr/" style="color:#8b2332;text-decoration:none">Under 100 kr</a> ·
        <a href="/vin-under-150-kr/" style="color:#8b2332;text-decoration:none">Under 150 kr</a> ·
        <a href="/basta-roda-vin/" style="color:#8b2332;text-decoration:none">Röda viner</a> ·
        <a href="/basta-vita-vin/" style="color:#8b2332;text-decoration:none">Vita viner</a> ·
        <a href="/ekologiskt-vin/" style="color:#8b2332;text-decoration:none">Ekologiskt</a> ·
        <a href="/billigt-och-bra-vin/" style="color:#8b2332;text-decoration:none">Billigt och bra</a>
      </div>
    </div>

    <footer style="margin-top:40px;padding-top:20px;border-top:1px solid #e6ddd0;text-align:center;font-size:11px;color:#a89e8e">
      <p>Smakfynd — skapad av Gabriel Linton · Olav Innovation AB</p>
      <p>Oberoende tjänst · Ingen koppling till Systembolaget · Vi säljer inte alkohol</p>
    </footer>
  </div>
<script data-goatcounter="https://smakfynd.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</body>
</html>'''

# Write
out_dir = os.path.join(DOCS, "prissankt")
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "index.html")
with open(out_path, 'w') as f:
    f.write(html)
print(f"Built: {out_path} ({os.path.getsize(out_path)/1024:.0f} KB)")
print(f"  {len(drops)} price drops, biggest: −{drops[0]['drop_pct']}% ({drops[0]['name']})" if drops else "  No drops found")
