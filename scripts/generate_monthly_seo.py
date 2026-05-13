#!/usr/bin/env python3
"""
Generate monthly SEO content pages for Smakfynd.
- "Bästa vinerna [month] [year]" - evergreen monthly roundup
- "Nyheter Systembolaget [month] [year]" - new arrivals
- "Billigt och bra vin" - perennial traffic driver
- "Bästa boxvin" - high-volume query

Run: python3 scripts/generate_monthly_seo.py
"""

import json, os
from datetime import datetime
from pathlib import Path

BASE = str(Path(__file__).parent.parent)
DATA_PATH = os.path.join(BASE, "data", "smakfynd_ranked_v2.json")
DOCS = os.path.join(BASE, "docs")

all_wines = json.load(open(DATA_PATH))
fast = [w for w in all_wines if w.get('assortment') == 'Fast sortiment']
bib = [w for w in all_wines if w.get('assortment') == 'Fast sortiment' and w.get('pkg') == 'BiB']

NOW = datetime.now()
MONTH_SV = ['januari','februari','mars','april','maj','juni',
            'juli','augusti','september','oktober','november','december'][NOW.month - 1]
YEAR = NOW.year
DATE_STR = f"{MONTH_SV} {YEAR}"

# Price drop data
_bootstrap_file = os.path.join(BASE, "data", "prissankt_bootstrap.json")
_bootstrap = {}
if os.path.exists(_bootstrap_file):
    for d in json.load(open(_bootstrap_file)):
        _bootstrap[str(d['nr'])] = d
_price_hist_file = os.path.join(BASE, "data", "history", "first_seen_prices.json")
_price_hist = {}
if os.path.exists(_price_hist_file):
    _price_hist = json.load(open(_price_hist_file))

for p in all_wines:
    nr = str(p.get('nr', ''))
    current = p.get('price', 0)
    if not current: continue
    old_price = None
    if nr in _bootstrap:
        b = _bootstrap[nr]
        if b.get('price_now') and abs(b['price_now'] - current) < 5:
            old_price = b.get('price_old')
    if not old_price and nr in _price_hist:
        hist = _price_hist[nr]
        first = hist.get('price', 0) if isinstance(hist, dict) else hist
        if first and first > current: old_price = first
    if old_price and old_price > current:
        drop_pct = round((old_price - current) / old_price * 100)
        if drop_pct >= 5:
            p['price_vs_launch_pct'] = drop_pct

def dedup_wines(wines, max_per_producer=2):
    """Remove duplicates, limit per producer, hide large formats."""
    standard = set()
    for w in wines:
        if (w.get('vol') or 750) <= 750:
            standard.add((w.get('name','').lower(), (w.get('sub','') or '').lower()))
    seen = set()
    producer_count = {}
    result = []
    for w in wines:
        if (w.get('vol') or 750) > 750:
            if (w.get('name','').lower(), (w.get('sub','') or '').lower()) in standard:
                continue
        dup_key = (w.get('name',''), w.get('sub',''), w.get('price',0))
        if dup_key in seen:
            continue
        seen.add(dup_key)
        producer = w.get('name','').strip()
        producer_count[producer] = producer_count.get(producer, 0) + 1
        if producer_count[producer] > max_per_producer:
            continue
        result.append(w)
    return result

def score_label(score):
    if score >= 90: return "Exceptionellt fynd"
    if score >= 80: return "Toppköp"
    if score >= 70: return "Starkt fynd"
    if score >= 60: return "Bra köp"
    return "Okej värde"

def render_wine_row(w, rank):
    name = w.get('name', '')
    sub = w.get('sub', '')
    score = w.get('smakfynd_score', 0)
    price = w.get('price', 0)
    country = w.get('country', '')
    grape = w.get('grape', '')
    nr = w.get('nr', '')
    label = score_label(score)
    organic = ' 🌿' if w.get('organic') else ''
    expert = f" · Expert: {w['expert_score']:.1f}/10" if w.get('expert_score') else ""
    crowd = f"Crowd: {w['crowd_score']:.1f}/10" if w.get('crowd_score') else ""

    return f'''<li style="padding:16px 0;border-bottom:1px solid #e6ddd0">
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <strong style="font-size:17px;font-family:Georgia,serif">{rank}. {name}</strong>
      <span style="color:#7a7060;font-size:14px"> — {sub}</span>{organic}
      <div style="font-size:13px;color:#4a4238;margin-top:2px">{country} · {grape}</div>
      <div style="font-size:13px;color:#7a7060;margin-top:2px">{crowd}{expert}</div>
    </div>
    <div style="text-align:center;flex-shrink:0;margin-left:16px">
      <div style="width:50px;height:50px;border-radius:50%;background:#e8f0e4;border:2px solid #2d6b3f;display:flex;align-items:center;justify-content:center">
        <span style="font-size:19px;font-weight:900;color:#2d6b3f;font-family:Georgia,serif">{score}</span>
      </div>
      <div style="font-size:10px;color:#2d6b3f;margin-top:2px">{label}</div>
    </div>
  </div>
  <div style="margin-top:6px;display:flex;gap:12px;align-items:baseline">
    <span style="font-size:20px;font-weight:700;font-family:Georgia,serif">{price} kr</span>
    <a href="https://www.systembolaget.se/produkt/vin/{nr}" target="_blank" rel="noopener"
       style="font-size:13px;color:#8b2332;text-decoration:none">Köp på Systembolaget →</a>
    <a href="https://smakfynd.se/#vin/{nr}"
       style="font-size:13px;color:#4a4238;text-decoration:none">Se detaljer →</a>
  </div>
</li>'''

def make_page(slug, title, meta, h1, intro, content_html, wines, extra_sections=""):
    wines_html = '\n'.join(render_wine_row(w, i+1) for i, w in enumerate(wines))
    num_wines = len(wines)

    top = wines[0] if wines else None
    top_name = top.get('name', '') if top else ''
    top_score = top.get('smakfynd_score', 0) if top else 0
    top_price = top.get('price', 0) if top else 0

    # JSON-LD
    items_ld = []
    for i, w in enumerate(wines[:10]):
        img = w.get('image_url', '') or 'https://smakfynd.se/og-image.svg'
        grape = w.get('grape', '')
        country = w.get('country', '')
        desc = (w.get('style', '') or '')[:200] or (f"{grape} från {country}" if grape else f"Vin från {country}")
        items_ld.append({
            "@type": "ListItem", "position": i + 1,
            "item": {
                "@type": "Product",
                "name": f"{w.get('name','')} {w.get('sub','')}".strip(),
                "image": img,
                "description": desc,
                "brand": {"@type": "Brand", "name": w.get('name', '')},
                "category": "Wine",
                "offers": {"@type": "Offer", "price": str(w.get('price', 0)), "priceCurrency": "SEK",
                           "availability": "https://schema.org/InStock",
                           "url": f"https://www.systembolaget.se/produkt/vin/{w.get('nr','')}"},
                "aggregateRating": {"@type": "AggregateRating", "ratingValue": w.get('smakfynd_score', 0),
                                    "bestRating": 100, "worstRating": 1, "ratingCount": w.get('crowd_reviews', 1)},
            }
        })

    ld = json.dumps({"@context": "https://schema.org", "@type": "ItemList", "name": title, "numberOfItems": num_wines, "itemListElement": items_ld}, ensure_ascii=False)
    breadcrumb = json.dumps({"@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Smakfynd", "item": "https://smakfynd.se"},
            {"@type": "ListItem", "position": 2, "name": title.split(' — ')[0]},
        ]}, ensure_ascii=False)

    faq = json.dumps({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": f"Vilket vin toppar listan?",
         "acceptedAnswer": {"@type": "Answer", "text": f"Just nu toppar {top_name} med {top_score}/100 i Smakfynd-poäng till {top_price} kr."}},
        {"@type": "Question", "name": "Hur ofta uppdateras listan?",
         "acceptedAnswer": {"@type": "Answer", "text": f"Varje vecka. Senast uppdaterad {DATE_STR}."}},
    ]}, ensure_ascii=False)

    today = datetime.now().strftime('%Y-%m-%d')

    cross_links = ' · '.join([
        '<a href="/basta-roda-vin/" style="color:#8b2332;text-decoration:none">Röda viner</a>',
        '<a href="/basta-vita-vin/" style="color:#8b2332;text-decoration:none">Vita viner</a>',
        '<a href="/vin-under-100-kr/" style="color:#8b2332;text-decoration:none">Under 100 kr</a>',
        '<a href="/basta-bubbel/" style="color:#8b2332;text-decoration:none">Bubbel</a>',
        '<a href="/ekologiskt-vin/" style="color:#8b2332;text-decoration:none">Ekologiskt</a>',
    ])

    html = f'''<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — Smakfynd</title>
  <meta name="description" content="{meta}">
  <meta name="author" content="Gabriel Linton">
  <meta name="theme-color" content="#7a2332">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <link rel="canonical" href="https://smakfynd.se/{slug}/">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{meta}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://smakfynd.se/{slug}/">
  <meta property="og:image" content="https://smakfynd.se/og-image.png">
  <meta property="og:locale" content="sv_SE">
  <meta property="og:site_name" content="Smakfynd">
  <meta property="article:modified_time" content="{today}">
  <script type="application/ld+json">{ld}</script>
  <script type="application/ld+json">{breadcrumb}</script>
  <script type="application/ld+json">{faq}</script>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='19' fill='%237a2332'/><text x='20' y='27' text-anchor='middle' font-family='Georgia,serif' font-size='22' fill='%23f5ede3'>S</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;background:#f7f3ec;font-family:'Inter',-apple-system,sans-serif;color:#1e1710">
  <div style="max-width:640px;margin:0 auto;padding:24px 20px 60px">
    <header style="margin-bottom:24px">
      <a href="https://smakfynd.se" style="text-decoration:none;display:inline-block;margin-bottom:16px">
        <span style="font-family:Georgia,serif;font-size:22px;color:#7a2332">Smakfynd</span>
      </a>
      <h1 style="margin:0 0 8px;font-size:28px;font-family:'Newsreader',Georgia,serif;font-weight:400;line-height:1.2">{h1}</h1>
      <p style="margin:0 0 12px;font-size:15px;color:#4a4238;line-height:1.6">{intro}</p>
      {content_html}
      <p style="margin:12px 0 0;font-size:12px;color:#7a7060">
        Uppdaterad {DATE_STR} · <a href="https://smakfynd.se" style="color:#8b2332">Utforska alla viner →</a>
      </p>
    </header>
    <ol style="list-style:none;padding:0;margin:0">{wines_html}</ol>
    {extra_sections}
    <div style="margin-top:32px;padding:20px;border-radius:14px;background:#fefcf8;border:1px solid #e6ddd0">
      <h2 style="margin:0 0 8px;font-size:18px;font-family:'Newsreader',serif;font-weight:400">Så fungerar Smakfynd-poängen</h2>
      <p style="margin:0;font-size:13px;color:#4a4238;line-height:1.6">
        Varje vin bedöms på tre saker: <strong>crowd-betyg</strong>, <strong>expertrecensioner</strong> och
        <strong>prisvärde</strong>. Hög kvalitet till lågt pris = hög poäng.
      </p>
    </div>
    <div style="margin-top:24px;text-align:center">
      <a href="https://smakfynd.se" style="display:inline-block;padding:14px 32px;border-radius:14px;background:linear-gradient(145deg,#8b2332,#6b1a27);color:#fff;font-size:15px;font-weight:600;text-decoration:none">
        Utforska alla viner på Smakfynd →
      </a>
    </div>
    <div style="margin-top:24px;padding:16px 20px;border-radius:14px;background:#fefcf8;border:1px solid #e6ddd0">
      <div style="font-size:12px;font-weight:600;color:#1e1710;margin-bottom:6px">Se även</div>
      <div style="font-size:13px;color:#4a4238;line-height:2">{cross_links}</div>
    </div>
    <footer style="margin-top:40px;padding-top:20px;border-top:1px solid #e6ddd0;text-align:center;font-size:11px;color:#a89e8e">
      <p>Smakfynd — skapad av Gabriel Linton · Olav Innovation AB</p>
      <p>Oberoende tjänst · Ingen koppling till Systembolaget · Vi säljer inte alkohol</p>
    </footer>
  </div>
  <div id="sf-sub" style="position:fixed;bottom:0;left:0;right:0;background:#1a1510;border-top:2px solid #8b2332;padding:10px 16px;display:flex;align-items:center;gap:10px;justify-content:center;flex-wrap:wrap;z-index:999;font-family:'Inter',-apple-system,sans-serif">
    <span style="color:#e6ddd0;font-size:13px;font-weight:500">Få veckans bästa vinfynd på mejlen</span>
    <input id="sf-sub-email" type="email" placeholder="din@email.se" style="padding:8px 14px;border-radius:8px;border:1px solid #3a3530;background:#2a2520;color:#f5f1ea;font-size:13px;width:200px;outline:none;font-family:inherit">
    <button onclick="sfSubscribe()" id="sf-sub-btn" style="padding:8px 18px;border-radius:8px;border:none;background:#8b2332;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">Prenumerera</button>
    <button onclick="document.getElementById('sf-sub').remove();try{{localStorage.setItem('sf_sub_hide','1')}}catch(e){{}}" style="background:none;border:none;color:#6b6355;font-size:18px;cursor:pointer;padding:0 4px;line-height:1" aria-label="Stäng">✕</button>
  </div>
  <script>
  (function(){{try{{if(localStorage.getItem('sf_sub_hide')){{var el=document.getElementById('sf-sub');if(el)el.remove()}}}}catch(e){{}}}})();
  function sfSubscribe(){{
    var e=document.getElementById('sf-sub-email'),b=document.getElementById('sf-sub-btn'),v=e.value.trim();
    if(!v||!v.includes('@'))return;
    b.textContent='...';b.disabled=true;
    fetch('https://smakfynd-auth.smakfynd.workers.dev/subscribe',{{method:'POST',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{email:v}})}})
    .then(function(){{b.textContent='Tack!';b.style.background='#2d6b3f';e.style.display='none';setTimeout(function(){{var el=document.getElementById('sf-sub');if(el)el.remove();try{{localStorage.setItem('sf_sub_hide','1')}}catch(e){{}}}},2000)}})
    .catch(function(){{b.textContent='Prenumerera';b.disabled=false}});
  }}
  </script>
<script data-goatcounter="https://smakfynd.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</body>
</html>'''

    page_dir = os.path.join(DOCS, slug)
    os.makedirs(page_dir, exist_ok=True)
    with open(os.path.join(page_dir, 'index.html'), 'w') as f:
        f.write(html)
    print(f"  {slug}/: {num_wines} wines ({os.path.getsize(os.path.join(page_dir, 'index.html'))/1024:.0f} KB)")

def main():
    print("Generating monthly SEO pages...")

    # 1. Bästa vinerna [month] [year]
    month_slug = f"basta-vin-{MONTH_SV}-{YEAR}"
    top_monthly = dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'],
                        key=lambda x: -x.get('smakfynd_score', 0)))[:20]
    make_page(
        month_slug,
        f"Bästa vinerna {MONTH_SV} {YEAR} — Systembolaget",
        f"Topp 20 bästa vinerna på Systembolaget just nu. Uppdaterad rankning för {DATE_STR} baserad på crowd-betyg, expertrecensioner och prisvärde.",
        f"Bästa vinerna på Systembolaget — {DATE_STR}",
        f"Varje månad uppdaterar vi vår rankning av alla viner på Systembolaget. Här är de 20 bästa köpen just nu i {DATE_STR} — baserat på crowd-betyg, expertrecensioner och prisvärde.",
        f'<p style="margin:8px 0 0;font-size:14px;color:#4a4238;line-height:1.6">Listan baseras på {len(fast)} viner i fast sortiment och uppdateras varje vecka. Vi väger in betyg från hundratusentals vindrickare, erkända vinkritiker och priset relativt kategorin.</p>',
        top_monthly,
    )

    # 2. Billigt och bra vin
    budget = dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and (w.get('price', 999) or 999) <= 99],
                   key=lambda x: -x.get('smakfynd_score', 0)))[:20]
    make_page(
        "billigt-och-bra-vin",
        f"Billigt och bra vin på Systembolaget {YEAR}",
        f"Bästa billiga vinerna under 100 kr på Systembolaget. Rankade efter kvalitet — inte bara pris. {DATE_STR}.",
        f"Billigt och bra vin på Systembolaget — {DATE_STR}",
        "Det behöver inte kosta mycket för att vara gott. Vi har rankat alla viner under 100 kr efter kvalitet per krona — och hittat överraskande bra fynd.",
        '<p style="margin:8px 0 0;font-size:14px;color:#4a4238;line-height:1.6">Många tror att billigt vin = dåligt vin. Men i verkligheten finns det fantastiska viner under hundralappen. Hemligheten är att titta på betyg och prisvärde — inte bara pris. Här är bevisen.</p>',
        budget,
    )

    # Note: boxvin, midsommar, kraftskiva moved to generate_landing_pages.py for full template

    print(f"\nGenerated monthly SEO pages")

if __name__ == "__main__":
    main()
