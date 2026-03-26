#!/usr/bin/env python3
"""
Generate "Gabriels val" monthly curated wine page.
Edit PICKS below with your personal selections and notes.
"""

import json, os
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(SCRIPT_DIR)
DATA_PATH = os.path.join(BASE, "data", "smakfynd_ranked_v2.json")
DOCS = os.path.join(BASE, "docs")

all_wines = json.load(open(DATA_PATH))
wines_by_nr = {str(w.get('nr','')): w for w in all_wines}

NOW = datetime.now()
MONTH_SV = ['januari','februari','mars','april','maj','juni',
            'juli','augusti','september','oktober','november','december'][NOW.month - 1]
YEAR = NOW.year
SLUG = f"gabriels-val-{MONTH_SV}-{YEAR}"

# ═══════════════════════════════════════════
# REDIGERA HÄR: Gabriels val för aktuell månad
# ═══════════════════════════════════════════
INTRO = f"""Mars bjuder på de sista vintermånaderna men våren börjar skymta.
Jag har valt fem viner som passar både till vardagsmiddagar och helgmys.
Alla finns i fast sortiment på Systembolaget."""

PICKS = [
    {
        "nr": "471101",  # Lavista Malbec Reserve
        "category": "Bästa köp under 100 kr",
        "note": "En Malbec från Argentina som överraskar för priset. Fyllig och fruktig med mörka bär och en hint av vanilj. Fungerar utmärkt till vardagsmiddag — pasta, köttfärssås eller bara med lite ost. 79 kronor och du får vin som smakar som det dubbla.",
    },
    {
        "nr": "7598201",  # Salt & Pepper
        "category": "Bäst till helgens grillning",
        "note": "Cabernet Sauvignon från Frankrike med bra struktur. Passar perfekt till grillat kött eller en rejäl köttgryta. Har fått bra betyg av både crowd och experter — ett tryggt val om du vill imponera utan att spendera för mycket.",
    },
    {
        "nr": "582201",  # Leitz Eins Zwei Dry
        "category": "Underskattat vitt val",
        "note": "Torr Riesling från Tyskland. Fräsch med äpple och citrus. Perfekt till asiatisk mat, fisk eller skaldjur. Jag tror Riesling är en av de mest undervärderade druvorna — de flesta har inte testat en riktigt bra torr variant. Prova den.",
    },
    {
        "nr": "296201",  # Chianti Castelsina
        "category": "Italiano med själ",
        "note": "En Chianti som levererar det den ska — körsbär, lite kryddighet och lagom tanniner. Fungerar till pasta, pizza och italiensk mat generellt. Inget fancy, bara ärligt bra vin till rätt pris.",
    },
    {
        "nr": "219301",  # Let every moment Spark
        "category": "Bubbel utan att slå hål i plånboken",
        "note": "140 000 personer på Vivino har betygsatt den och de flesta gillar den. Under hundralappen för en bubbel som funkar till fredagsmys, fördrink eller bara för att fira att det är fredag. Ingen champagne, men det behöver den inte vara.",
    },
]

def render_pick(pick, wine, i):
    score = wine.get('smakfynd_score', 0)
    price = wine.get('price', 0)
    name = wine.get('name', '')
    sub = wine.get('sub', '')
    country = wine.get('country', '')
    grape = wine.get('grape', '')
    nr = wine.get('nr', '')
    style = wine.get('style', '')

    return f'''
    <div style="padding:24px 20px;border-radius:16px;background:#fefcf8;border:1px solid #e6ddd0;margin-bottom:16px">
      <div style="font-size:10px;font-weight:700;color:#8b2332;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">{pick['category']}</div>
      <div style="display:flex;align-items:flex-start;gap:16px">
        <div style="width:50px;height:50px;border-radius:50%;background:#e8f0e4;border:2px solid #2d6b3f;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-size:20px;font-weight:900;color:#2d6b3f;font-family:Georgia,serif">{score}</span>
        </div>
        <div style="flex:1">
          <h3 style="margin:0;font-size:20px;font-family:'Instrument Serif',Georgia,serif;font-weight:400">{name}</h3>
          <div style="font-size:13px;color:#7a7060;margin-top:2px">{sub} · {country} · {grape}</div>
          <div style="font-size:18px;font-weight:700;font-family:Georgia,serif;margin-top:6px">{price} kr</div>
        </div>
      </div>
      <p style="font-size:14px;color:#4a4238;line-height:1.7;margin:12px 0 0">{pick['note']}</p>
      {f'<p style="font-size:12px;color:#7a7060;font-style:italic;margin:8px 0 0">{style}</p>' if style else ''}
      <div style="margin-top:10px;display:flex;gap:12px">
        <a href="https://www.systembolaget.se/produkt/vin/{nr}" target="_blank" rel="noopener"
           style="font-size:13px;color:#8b2332;text-decoration:none">Köp på Systembolaget →</a>
        <a href="https://smakfynd.se/#vin/{nr}"
           style="font-size:13px;color:#4a4238;text-decoration:none">Se detaljer →</a>
      </div>
    </div>'''

def main():
    picks_html = ""
    for i, pick in enumerate(PICKS):
        wine = wines_by_nr.get(pick['nr'])
        if not wine:
            print(f"  WARN: wine {pick['nr']} not found in data")
            continue
        picks_html += render_pick(pick, wine, i)

    html = f'''<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gabriels val — {MONTH_SV} {YEAR} — Smakfynd</title>
  <meta name="description" content="Gabriel Lintons handplockade viner för {MONTH_SV} {YEAR}. Fem viner testade och rekommenderade — från budget till premium.">
  <meta name="author" content="Gabriel Linton">
  <meta name="theme-color" content="#7a2332">
  <link rel="canonical" href="https://smakfynd.se/{SLUG}/">

  <meta property="og:title" content="Gabriels val — {MONTH_SV} {YEAR}">
  <meta property="og:description" content="Fem handplockade viner för {MONTH_SV}. Testade och rekommenderade av Gabriel Linton.">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://smakfynd.se/{SLUG}/">
  <meta property="og:image" content="https://smakfynd.se/og-image.png">

  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='19' fill='%237a2332'/><text x='20' y='27' text-anchor='middle' font-family='Georgia,serif' font-size='22' fill='%23f5ede3'>S</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;background:#f7f3ec;font-family:'DM Sans',-apple-system,sans-serif;color:#1e1710">
  <div style="max-width:640px;margin:0 auto;padding:24px 20px 60px">

    <header style="margin-bottom:24px">
      <a href="https://smakfynd.se" style="text-decoration:none;display:inline-block;margin-bottom:16px">
        <span style="font-family:Georgia,serif;font-size:22px;color:#7a2332">Smakfynd</span>
      </a>
      <div style="font-size:10px;font-weight:600;color:#8b2332;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:8px">Gabriels val</div>
      <h1 style="margin:0 0 12px;font-size:32px;font-family:'Instrument Serif',Georgia,serif;font-weight:400;line-height:1.2;color:#1e1710">
        {MONTH_SV.capitalize()} {YEAR}
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#4a4238;line-height:1.6">{INTRO}</p>
      <div style="padding:12px 16px;border-radius:12px;background:#fefcf8;border:1px solid #e6ddd0;display:flex;gap:12px;align-items:center">
        <div style="font-size:28px">🍷</div>
        <div>
          <div style="font-size:14px;font-family:'Instrument Serif',serif;color:#1e1710">Gabriel Linton</div>
          <div style="font-size:11px;color:#7a7060">Forskare & grundare av Smakfynd · Dryckeskunskap, Grythyttan</div>
        </div>
      </div>
    </header>

    {picks_html}

    <div style="margin-top:32px;padding:20px;border-radius:14px;background:#fefcf8;border:1px solid #e6ddd0">
      <h2 style="margin:0 0 8px;font-size:16px;font-family:'Instrument Serif',serif;font-weight:400">Om Gabriels val</h2>
      <p style="margin:0;font-size:13px;color:#4a4238;line-height:1.6">
        Varje månad väljer jag ut viner jag personligen testat och gillar. Det är inte bara poäng —
        det handlar om viner jag faktiskt skulle köpa själv. Alla viner finns i Systembolagets fasta sortiment.
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
        <a href="/basta-roda-vin/" style="color:#8b2332;text-decoration:none">Bästa röda</a> ·
        <a href="/basta-vita-vin/" style="color:#8b2332;text-decoration:none">Bästa vita</a> ·
        <a href="/vin-under-100-kr/" style="color:#8b2332;text-decoration:none">Under 100 kr</a> ·
        <a href="/ekologiskt-vin/" style="color:#8b2332;text-decoration:none">Ekologiskt</a> ·
        <a href="/vin-till-grillat/" style="color:#8b2332;text-decoration:none">Till grillat</a>
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

    page_dir = os.path.join(DOCS, SLUG)
    os.makedirs(page_dir, exist_ok=True)
    out = os.path.join(page_dir, "index.html")
    with open(out, 'w') as f:
        f.write(html)
    print(f"Generated: {SLUG}/ ({os.path.getsize(out)/1024:.0f} KB)")
    print(f"Live at: https://smakfynd.se/{SLUG}/")

if __name__ == "__main__":
    main()
