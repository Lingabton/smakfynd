#!/usr/bin/env python3
"""
Generate static SEO landing pages for Smakfynd.
Each page targets a specific search query and shows top wines for that category.
Pages are pure HTML — no JavaScript required, fully indexable by Google.

Run: python3 scripts/generate_landing_pages.py
Output: docs/basta-roda-vin/, docs/vin-under-100-kr/, etc.
"""

import json, os
from datetime import datetime

BASE = os.path.expanduser("~/smakfynd")
DATA_PATH = os.path.join(BASE, "data", "smakfynd_ranked_v2.json")
DOCS = os.path.join(BASE, "docs")

# Load all wines
all_wines = json.load(open(DATA_PATH))
fast = [w for w in all_wines if w.get('assortment') == 'Fast sortiment']

NOW = datetime.now()
MONTH_SV = ['januari','februari','mars','april','maj','juni',
            'juli','augusti','september','oktober','november','december'][NOW.month - 1]
YEAR = NOW.year
DATE_STR = f"{MONTH_SV} {YEAR}"

# ─── Landing page definitions ───
# (slug, title, meta_desc, h1, intro, filter_fn)

def make_pages():
    return [
        {
            "slug": "basta-roda-vin",
            "title": f"Bästa röda vinerna på Systembolaget {YEAR}",
            "meta": f"Topp 20 bästa röda viner på Systembolaget just nu. Rankade efter kvalitet per krona — crowd-betyg, expertrecensioner och prisvärde. Uppdaterad {DATE_STR}.",
            "h1": f"Bästa röda vinerna på Systembolaget — {DATE_STR}",
            "intro": "Vi har analyserat tusentals röda viner och rankat dem efter kvalitet i förhållande till pris. Här är de bästa köpen just nu.",
            "wines": sorted([w for w in fast if w.get('type') == 'Rött' and w.get('pkg') == 'Flaska'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-vita-vin",
            "title": f"Bästa vita vinerna på Systembolaget {YEAR}",
            "meta": f"Topp 20 bästa vita viner på Systembolaget. Rankade efter smak och prisvärde. Uppdaterad {DATE_STR}.",
            "h1": f"Bästa vita vinerna på Systembolaget — {DATE_STR}",
            "intro": "Fräscha, fruktiga eller fyllda — här är de vita vinerna som ger mest smak för pengarna.",
            "wines": sorted([w for w in fast if w.get('type') == 'Vitt' and w.get('pkg') == 'Flaska'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-bubbel",
            "title": f"Bästa bubbel & champagne på Systembolaget {YEAR}",
            "meta": f"Topp 20 mousserande viner och champagne på Systembolaget. Rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa bubbel på Systembolaget — {DATE_STR}",
            "intro": "Cava, prosecco, crémant eller champagne? Här är de mousserande vinerna som ger mest fest för pengarna.",
            "wines": sorted([w for w in fast if w.get('type') == 'Mousserande' and w.get('pkg') == 'Flaska'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-rose",
            "title": f"Bästa rosévinerna på Systembolaget {YEAR}",
            "meta": f"Topp 20 roséer på Systembolaget. Rankade efter smak och prisvärde. {DATE_STR}.",
            "h1": f"Bästa rosévinerna på Systembolaget — {DATE_STR}",
            "intro": "Sommar eller vinter — rosé funkar alltid. Här är de som ger mest smak för pengarna.",
            "wines": sorted([w for w in fast if w.get('type') == 'Rosé' and w.get('pkg') == 'Flaska'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "vin-under-100-kr",
            "title": f"Bästa vinerna under 100 kr på Systembolaget {YEAR}",
            "meta": f"Prisvärda viner under 100 kr. Rankade efter kvalitet — inte bara pris. Uppdaterad {DATE_STR}.",
            "h1": f"Bästa vinerna under 100 kr — {DATE_STR}",
            "intro": "Under hundralappen och ändå riktigt bra? Det finns fler än du tror. Här är de bästa budgetvinerna just nu.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and (w.get('price', 999) or 999) < 100],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "vin-under-150-kr",
            "title": f"Bästa vinerna under 150 kr på Systembolaget {YEAR}",
            "meta": f"Topp 20 viner under 150 kr. Kvalitetsrankade med crowd-betyg och expertrecensioner. {DATE_STR}.",
            "h1": f"Bästa vinerna under 150 kr — {DATE_STR}",
            "intro": "I prisklassen 100–150 kr hittar du ofta de bästa fynden. Här är vinerna som ger mest valuta för pengarna.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and (w.get('price', 999) or 999) < 150],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "vin-till-grillat",
            "title": f"Bästa vinerna till grillat kött {YEAR} — Systembolaget",
            "meta": f"Vin till grillat? Här är de bästa valen på Systembolaget — rankade efter smak och prisvärde. {DATE_STR}.",
            "h1": f"Bästa vinerna till grillat — {DATE_STR}",
            "intro": "Grillat kött kräver vin med lite kropp och smak. Här är de bästa alternativen — från budget till premium.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and any('kött' in (f or '').lower() or 'grillat' in (f or '').lower() or 'nöt' in (f or '').lower()
                                   for f in (w.get('food_pairings') or []))],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "vin-till-fisk",
            "title": f"Bästa vinerna till fisk & skaldjur {YEAR} — Systembolaget",
            "meta": f"Vin till fisk och skaldjur? Här är de bästa vita och roséer på Systembolaget. {DATE_STR}.",
            "h1": f"Bästa vinerna till fisk & skaldjur — {DATE_STR}",
            "intro": "Fisk och skaldjur vill ha fräscht, syra och ibland lite mineralitet. Här är de bästa matchningarna.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and any('fisk' in (f or '').lower() or 'skaldjur' in (f or '').lower()
                                   for f in (w.get('food_pairings') or []))],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "vin-till-pasta",
            "title": f"Bästa vinerna till pasta {YEAR} — Systembolaget",
            "meta": f"Vin till pasta? Topp 20 bästa valen på Systembolaget — oavsett sås. {DATE_STR}.",
            "h1": f"Bästa vinerna till pasta — {DATE_STR}",
            "intro": "Pasta och vin hör ihop. Oavsett om det är carbonara, bolognese eller pesto — här hittar du rätt vin.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and any('pasta' in (f or '').lower() for f in (w.get('food_pairings') or []))],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-malbec",
            "title": f"Bästa Malbec på Systembolaget {YEAR}",
            "meta": f"Topp Malbec-viner på Systembolaget. Argentina, Frankrike och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Malbec på Systembolaget — {DATE_STR}",
            "intro": "Malbec från Argentina är en favorit bland svenska vindrickare. Här är de som ger mest smak för pengarna.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and 'malbec' in (w.get('grape', '') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-cabernet-sauvignon",
            "title": f"Bästa Cabernet Sauvignon på Systembolaget {YEAR}",
            "meta": f"Topp Cabernet Sauvignon-viner. Rankade efter kvalitet per krona med crowd-betyg och expertrecensioner. {DATE_STR}.",
            "h1": f"Bästa Cabernet Sauvignon på Systembolaget — {DATE_STR}",
            "intro": "Cabernet Sauvignon — världens mest kända rödvinsdruva. Här är de bästa köpen på Systembolaget.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and 'cabernet sauvignon' in (w.get('grape', '') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "ekologiskt-vin",
            "title": f"Bästa ekologiska vinerna på Systembolaget {YEAR}",
            "meta": f"Topp 20 ekologiska viner. Hållbart och prisvärt — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa ekologiska vinerna — {DATE_STR}",
            "intro": "Ekologiskt och gott behöver inte vara dyrt. Här är de bästa eko-vinerna på Systembolaget.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('organic')],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "vin-till-ost",
            "title": f"Bästa vinerna till ost {YEAR} — Systembolaget",
            "meta": f"Vin till ostbrickan? Här är de bästa matchningarna på Systembolaget. {DATE_STR}.",
            "h1": f"Bästa vinerna till ost — {DATE_STR}",
            "intro": "Ost och vin är en klassisk kombination. Här är vinerna som passar bäst — från mjuk brie till lagrad cheddar.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and any('ost' in (f or '').lower() for f in (w.get('food_pairings') or []))],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
    ]

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
    style = w.get('style', '')
    style_text = f'<p style="margin:4px 0 0;font-size:13px;color:#7a7060;font-style:italic">{style[:120]}{"…" if len(style)>120 else ""}</p>' if style else ''

    return f'''<li style="padding:16px 0;border-bottom:1px solid #e6ddd0">
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <strong style="font-size:17px;font-family:Georgia,serif">{rank}. {name}</strong>
      <span style="color:#7a7060;font-size:14px"> — {sub}</span>{organic}
      <div style="font-size:13px;color:#4a4238;margin-top:2px">{country} · {grape}</div>
      <div style="font-size:13px;color:#7a7060;margin-top:2px">{crowd}{expert}</div>
      {style_text}
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
  </div>
</li>'''

def render_page(page):
    wines_html = '\n'.join(render_wine_row(w, i+1) for i, w in enumerate(page['wines']))
    num_wines = len(page['wines'])

    # JSON-LD for the wine list
    items_ld = []
    for i, w in enumerate(page['wines'][:10]):
        items_ld.append({
            "@type": "ListItem",
            "position": i + 1,
            "item": {
                "@type": "Product",
                "name": f"{w.get('name','')} {w.get('sub','')}".strip(),
                "brand": {"@type": "Brand", "name": w.get('name', '')},
                "category": "Wine",
                "offers": {
                    "@type": "Offer",
                    "price": str(w.get('price', 0)),
                    "priceCurrency": "SEK",
                    "availability": "https://schema.org/InStock",
                    "url": f"https://www.systembolaget.se/produkt/vin/{w.get('nr','')}",
                },
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": w.get('smakfynd_score', 0),
                    "bestRating": 100,
                    "worstRating": 1,
                    "ratingCount": w.get('crowd_reviews', 1),
                },
            }
        })

    ld_json = json.dumps({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": page['title'],
        "description": page['meta'],
        "numberOfItems": num_wines,
        "itemListElement": items_ld,
    }, ensure_ascii=False)

    return f'''<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{page['title']} — Smakfynd</title>
  <meta name="description" content="{page['meta']}">
  <meta name="author" content="Gabriel Linton">
  <meta name="theme-color" content="#7a2332">
  <link rel="canonical" href="https://smakfynd.se/{page['slug']}/">

  <meta property="og:title" content="{page['title']}">
  <meta property="og:description" content="{page['meta']}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://smakfynd.se/{page['slug']}/">
  <meta property="og:image" content="https://smakfynd.se/og-image.png">
  <meta property="og:locale" content="sv_SE">
  <meta property="og:site_name" content="Smakfynd">

  <script type="application/ld+json">{ld_json}</script>

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
      <h1 style="margin:0 0 8px;font-size:28px;font-family:'Instrument Serif',Georgia,serif;font-weight:400;line-height:1.2;color:#1e1710">
        {page['h1']}
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#4a4238;line-height:1.6">{page['intro']}</p>
      <p style="margin:0;font-size:12px;color:#7a7060">
        Uppdaterad {DATE_STR} · Baserat på {len(all_wines)} viner · <a href="https://smakfynd.se" style="color:#8b2332">Utforska alla viner →</a>
      </p>
    </header>

    <ol style="list-style:none;padding:0;margin:0">
{wines_html}
    </ol>

    <div style="margin-top:32px;padding:20px;border-radius:14px;background:#fefcf8;border:1px solid #e6ddd0">
      <h2 style="margin:0 0 8px;font-size:18px;font-family:'Instrument Serif',serif;font-weight:400">Så fungerar Smakfynd-poängen</h2>
      <p style="margin:0;font-size:13px;color:#4a4238;line-height:1.6">
        Varje vin bedöms på tre saker: <strong>crowd-betyg</strong> (vad vanliga vindrickare tycker),
        <strong>expertrecensioner</strong> (kritiker som James Suckling, Decanter m.fl.) och
        <strong>prisvärde</strong> (pris jämfört med liknande viner). Hög kvalitet till lågt pris = hög poäng.
      </p>
    </div>

    <div style="margin-top:24px;text-align:center">
      <a href="https://smakfynd.se" style="display:inline-block;padding:14px 32px;border-radius:14px;background:linear-gradient(145deg,#8b2332,#6b1a27);color:#fff;font-size:15px;font-weight:600;text-decoration:none">
        Utforska alla {len(all_wines)} viner på Smakfynd →
      </a>
    </div>

    <footer style="margin-top:40px;padding-top:20px;border-top:1px solid #e6ddd0;text-align:center;font-size:11px;color:#a89e8e">
      <p>Smakfynd — skapad av Gabriel Linton · Olav Innovation AB</p>
      <p>Oberoende tjänst · Ingen koppling till Systembolaget · Vi säljer inte alkohol</p>
    </footer>
  </div>
<script data-goatcounter="https://smakfynd.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</body>
</html>'''

def update_sitemap(pages):
    today = datetime.now().strftime('%Y-%m-%d')
    urls = [f'''  <url>
    <loc>https://smakfynd.se</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>''']

    for p in pages:
        urls.append(f'''  <url>
    <loc>https://smakfynd.se/{p["slug"]}/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>''')

    sitemap = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(urls)}
</urlset>
'''
    path = os.path.join(DOCS, 'sitemap.xml')
    with open(path, 'w') as f:
        f.write(sitemap)
    print(f"Sitemap: {len(urls)} URLs → {path}")

def main():
    pages = make_pages()
    generated = 0

    for page in pages:
        if not page['wines']:
            print(f"  Skip {page['slug']} (no wines)")
            continue

        # Create directory
        page_dir = os.path.join(DOCS, page['slug'])
        os.makedirs(page_dir, exist_ok=True)

        # Write HTML
        html = render_page(page)
        out_path = os.path.join(page_dir, 'index.html')
        with open(out_path, 'w') as f:
            f.write(html)

        print(f"  {page['slug']}/: {len(page['wines'])} wines ({os.path.getsize(out_path)/1024:.0f} KB)")
        generated += 1

    update_sitemap(pages)
    print(f"\nGenerated {generated} landing pages")

if __name__ == "__main__":
    main()
