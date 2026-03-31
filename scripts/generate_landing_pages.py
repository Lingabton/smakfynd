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

# Add price drop info (same logic as build_slim.py)
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
    if not current:
        continue
    old_price = None
    if nr in _bootstrap:
        b = _bootstrap[nr]
        if b.get('price_now') and abs(b['price_now'] - current) < 5:
            old_price = b.get('price_old')
    if not old_price and nr in _price_hist:
        hist = _price_hist[nr]
        first = hist.get('price', 0) if isinstance(hist, dict) else hist
        if first and first > current:
            old_price = first
    if old_price and old_price > current:
        drop_pct = round((old_price - current) / old_price * 100)
        if drop_pct >= 5:
            p['price_vs_launch_pct'] = drop_pct

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
                           and any(k in (f or '').lower() for k in ['kött', 'grillat', 'nöt', 'lamm', 'biff', 'vilt', 'fläsk']
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
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('type') == 'Rött'
                           and (w.get('taste_body') or 0) >= 5 and (w.get('taste_body') or 0) <= 9
                           and (w.get('price', 0) or 0) <= 200],
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

        # ─── Druvor ───
        {
            "slug": "basta-pinot-noir",
            "title": f"Bästa Pinot Noir på Systembolaget {YEAR}",
            "meta": f"Topp Pinot Noir-viner på Systembolaget. Bourgogne, Nya Zeeland och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Pinot Noir på Systembolaget — {DATE_STR}",
            "intro": "Pinot Noir är elegant, fruktig och mångsidig. Här är de bästa köpen — från Bourgogne till Nya Zeeland.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and 'pinot noir' in (w.get('grape', '') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-syrah-shiraz",
            "title": f"Bästa Syrah & Shiraz på Systembolaget {YEAR}",
            "meta": f"Topp Syrah- och Shiraz-viner. Kraftfulla och kryddiga — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Syrah & Shiraz på Systembolaget — {DATE_STR}",
            "intro": "Syrah (eller Shiraz) ger kraftfulla viner med peppar och mörka bär. Här är de bästa fynden.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and ('syrah' in (w.get('grape', '') or '').lower() or 'shiraz' in (w.get('grape', '') or '').lower())],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-riesling",
            "title": f"Bästa Riesling på Systembolaget {YEAR}",
            "meta": f"Topp Riesling-viner på Systembolaget. Tyskland, Alsace och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Riesling på Systembolaget — {DATE_STR}",
            "intro": "Riesling är en av världens mest mångsidiga vita druvor — från stentorrt till sött. Här är de bästa.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and 'riesling' in (w.get('grape', '') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-tempranillo",
            "title": f"Bästa Tempranillo på Systembolaget {YEAR}",
            "meta": f"Topp Tempranillo-viner. Rioja, Ribera del Duero och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Tempranillo på Systembolaget — {DATE_STR}",
            "intro": "Tempranillo är Spaniens stolthet — fylliga viner med vanilj och körsbär. Här är de bästa köpen.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and 'tempranillo' in (w.get('grape', '') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-sangiovese",
            "title": f"Bästa Sangiovese & Chianti på Systembolaget {YEAR}",
            "meta": f"Topp Sangiovese-viner — Chianti, Brunello och mer. Rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Sangiovese på Systembolaget — {DATE_STR}",
            "intro": "Sangiovese är druvan bakom Chianti och Brunello di Montalcino. Här är de bästa italienska fynden.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and 'sangiovese' in (w.get('grape', '') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-chardonnay",
            "title": f"Bästa Chardonnay på Systembolaget {YEAR}",
            "meta": f"Topp Chardonnay-viner. Bourgogne, Australien och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Chardonnay på Systembolaget — {DATE_STR}",
            "intro": "Chardonnay — från fräsch och mineralisk till fyllig och fatlagrad. Här är de bästa köpen.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and 'chardonnay' in (w.get('grape', '') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-sauvignon-blanc",
            "title": f"Bästa Sauvignon Blanc på Systembolaget {YEAR}",
            "meta": f"Topp Sauvignon Blanc-viner. Fräscha och aromatiska — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Sauvignon Blanc på Systembolaget — {DATE_STR}",
            "intro": "Sauvignon Blanc är fräsch, syrig och perfekt till sommar och fisk. Här är de bästa fynden.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and 'sauvignon blanc' in (w.get('grape', '') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-zinfandel",
            "title": f"Bästa Zinfandel på Systembolaget {YEAR}",
            "meta": f"Topp Zinfandel-viner. Kraftfulla, fruktiga och generösa — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Zinfandel på Systembolaget — {DATE_STR}",
            "intro": "Zinfandel ger generösa, fruktdrivna viner med kryddighet. Här är de bästa köpen.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and 'zinfandel' in (w.get('grape', '') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },

        # ─── Länder ───
        {
            "slug": "basta-italienska-vin",
            "title": f"Bästa italienska vinerna på Systembolaget {YEAR}",
            "meta": f"Topp 20 italienska viner. Chianti, Barolo, Amarone och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa italienska vinerna på Systembolaget — {DATE_STR}",
            "intro": "Italien producerar fantastiska viner i alla prisklasser. Här är de bästa köpen — från Toscana till Sicilien.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'Italien'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-franska-vin",
            "title": f"Bästa franska vinerna på Systembolaget {YEAR}",
            "meta": f"Topp 20 franska viner. Bordeaux, Bourgogne, Rhône och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa franska vinerna på Systembolaget — {DATE_STR}",
            "intro": "Frankrike är vinets hemland. Här är de franska viner som ger mest smak för pengarna.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'Frankrike'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-spanska-vin",
            "title": f"Bästa spanska vinerna på Systembolaget {YEAR}",
            "meta": f"Topp 20 spanska viner. Rioja, Ribera del Duero, Priorat och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa spanska vinerna på Systembolaget — {DATE_STR}",
            "intro": "Spanien har fantastisk prisvärdhet. Här är de spanska vinerna som ger mest bang for the buck.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'Spanien'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-chilenska-vin",
            "title": f"Bästa chilenska vinerna på Systembolaget {YEAR}",
            "meta": f"Topp chilenska viner. Carmenère, Cabernet och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa chilenska vinerna på Systembolaget — {DATE_STR}",
            "intro": "Chile levererar fantastisk kvalitet till låga priser. Här är de bästa chilenska fynden.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'Chile'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-sydafrikanska-vin",
            "title": f"Bästa sydafrikanska vinerna på Systembolaget {YEAR}",
            "meta": f"Topp sydafrikanska viner. Pinotage, Chenin Blanc och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa sydafrikanska vinerna på Systembolaget — {DATE_STR}",
            "intro": "Sydafrika är en underskattad vinproducent med fantastisk prisvärdhet. Här är de bästa köpen.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'Sydafrika'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-australiska-vin",
            "title": f"Bästa australiska vinerna på Systembolaget {YEAR}",
            "meta": f"Topp australiska viner. Shiraz, Chardonnay och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa australiska vinerna på Systembolaget — {DATE_STR}",
            "intro": "Australien gör kraftfulla, generösa viner. Här är de bästa fynden på Systembolaget.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'Australien'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-portugisiska-vin",
            "title": f"Bästa portugisiska vinerna på Systembolaget {YEAR}",
            "meta": f"Topp portugisiska viner. Douro, Alentejo och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa portugisiska vinerna på Systembolaget — {DATE_STR}",
            "intro": "Portugal är ett av Europas mest prisvärda vinländer. Här är de bästa köpen.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'Portugal'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },

        # ─── Tillfällen ───
        {
            "slug": "vin-till-dejt",
            "title": f"Bästa vinerna till en dejt {YEAR} — Systembolaget",
            "meta": f"Romantisk middag? Här är vinerna som imponerar utan att kosta skjortan. Rankade efter kvalitet. {DATE_STR}.",
            "h1": f"Bästa vinerna till en dejt — {DATE_STR}",
            "intro": "En dejt förtjänar ett vin som imponerar. Här är vinerna som ger rätt känsla — elegant, omtyckt och prisvärt.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('expert_score') or 0) >= 7 and (w.get('price', 0) or 0) >= 120 and (w.get('price', 0) or 0) <= 300],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "vin-till-julmat",
            "title": f"Bästa vinerna till julmat {YEAR} — Systembolaget",
            "meta": f"Vin till julbordet? Här är de bästa matchningarna till julskinka, Janssons och lax. {DATE_STR}.",
            "h1": f"Bästa vinerna till julmat — {DATE_STR}",
            "intro": "Julbordet har allt — skinka, lax, sill och köttbullar. Här är vinerna som funkar till hela julmenyn.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and any(k in (f or '').lower() for k in ['fläsk', 'skinka', 'kött', 'fisk', 'lamm']
                                   for f in (w.get('food_pairings') or []))
                           and (w.get('smakfynd_score', 0) or 0) >= 70],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "vin-till-kyckling",
            "title": f"Bästa vinerna till kyckling {YEAR} — Systembolaget",
            "meta": f"Vin till kyckling? Här är de bästa matchningarna på Systembolaget. {DATE_STR}.",
            "h1": f"Bästa vinerna till kyckling — {DATE_STR}",
            "intro": "Kyckling är mångsidigt — och det gäller vinvalet också. Här är de bästa alternativen.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and any('fågel' in (f or '').lower() or 'kyckling' in (f or '').lower()
                                   for f in (w.get('food_pairings') or []))],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },

        # ─── Pris ───
        {
            "slug": "vin-under-200-kr",
            "title": f"Bästa vinerna under 200 kr på Systembolaget {YEAR}",
            "meta": f"Topp 20 viner under 200 kr. Kvalitetsrankade med crowd-betyg och expertrecensioner. {DATE_STR}.",
            "h1": f"Bästa vinerna under 200 kr — {DATE_STR}",
            "intro": "Under 200 kr finns mängder av fantastiska viner. Här är de som ger mest kvalitet per krona.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and (w.get('price', 999) or 999) < 200],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-premium-vin",
            "title": f"Bästa premiumviner 200–500 kr på Systembolaget {YEAR}",
            "meta": f"Topp premiumviner 200-500 kr. Expertbetyg, crowd-betyg och prisjämförelse. {DATE_STR}.",
            "h1": f"Bästa premiumviner 200–500 kr — {DATE_STR}",
            "intro": "I premiumklassen hittar du viner med riktigt höga betyg. Här är de som ger bäst valuta.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('price', 0) or 0) >= 200 and (w.get('price', 0) or 0) <= 500],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "prissankt-vin",
            "title": f"Prissänkta viner på Systembolaget {YEAR}",
            "meta": f"Viner som nyligen sänkts i pris på Systembolaget. Hitta fynden innan de försvinner. {DATE_STR}.",
            "h1": f"Prissänkta viner just nu — {DATE_STR}",
            "intro": "Systembolaget skyltar inte alltid med prissänkningar. Vi håller koll åt dig — här är de bästa fynden.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('price_vs_launch_pct') or 0) > 0],
                          key=lambda x: -(x.get('price_vs_launch_pct', 0) or 0))[:20],
        },

        # ─── Smakprofiler ───
        {
            "slug": "fylliga-roda-vin",
            "title": f"Bästa fylliga röda vinerna på Systembolaget {YEAR}",
            "meta": f"Topp 20 fylliga röda viner. Kraftfulla, smakrika och generösa — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa fylliga röda vinerna — {DATE_STR}",
            "intro": "Du gillar kraftfulla, fylliga viner? Här är de röda som ger mest smak — med hög kropp och intensitet.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('type') == 'Rött'
                           and (w.get('taste_body') or 0) >= 8],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "latta-vita-vin",
            "title": f"Bästa lätta vita vinerna på Systembolaget {YEAR}",
            "meta": f"Fräscha, lätta vita viner. Perfekta till sommar och fisk — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa lätta vita vinerna — {DATE_STR}",
            "intro": "Fräscht, lätt och syradriven? Här är de vita vinerna som fungerar perfekt som aperitif eller till lättare rätter.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('type') == 'Vitt'
                           and (w.get('taste_body') or 12) <= 5],
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
    <a href="https://smakfynd.se/#vin/{nr}"
       style="font-size:13px;color:#4a4238;text-decoration:none;margin-left:8px">Se detaljer →</a>
  </div>
</li>'''

def get_cross_links(current_slug, all_pages):
    """Get 5 related landing pages for cross-linking, prioritizing same category."""
    # Tag each page with categories for smarter matching
    tags = {
        'druva': ['basta-malbec', 'basta-cabernet-sauvignon', 'basta-pinot-noir', 'basta-syrah-shiraz', 'basta-riesling', 'basta-tempranillo', 'basta-sangiovese', 'basta-chardonnay', 'basta-sauvignon-blanc', 'basta-zinfandel'],
        'land': ['basta-italienska-vin', 'basta-franska-vin', 'basta-spanska-vin', 'basta-chilenska-vin', 'basta-sydafrikanska-vin', 'basta-australiska-vin', 'basta-portugisiska-vin'],
        'typ': ['basta-roda-vin', 'basta-vita-vin', 'basta-bubbel', 'basta-rose'],
        'pris': ['vin-under-100-kr', 'vin-under-150-kr', 'vin-under-200-kr', 'basta-premium-vin', 'prissankt-vin'],
        'mat': ['vin-till-grillat', 'vin-till-fisk', 'vin-till-pasta', 'vin-till-ost', 'vin-till-dejt', 'vin-till-julmat', 'vin-till-kyckling'],
        'smak': ['fylliga-roda-vin', 'latta-vita-vin'],
    }
    # Find current page's category
    my_cat = None
    for cat, slugs in tags.items():
        if current_slug in slugs:
            my_cat = cat
            break

    # Prioritize: 2 from same category + 3 from other categories
    same = [p for p in all_pages if p['slug'] != current_slug and p.get('wines') and p['slug'] in tags.get(my_cat, [])]
    other = [p for p in all_pages if p['slug'] != current_slug and p.get('wines') and p['slug'] not in tags.get(my_cat, [])]
    return (same[:2] + other[:3])[:5]

def render_page(page, all_pages=None):
    wines_html = '\n'.join(render_wine_row(w, i+1) for i, w in enumerate(page['wines']))
    num_wines = len(page['wines'])

    # Cross-links
    cross = get_cross_links(page['slug'], all_pages or [])
    cross_html = ""
    if cross:
        cross_links = ' · '.join(f'<a href="/{p["slug"]}/" style="color:#8b2332;text-decoration:none">{p["title"].split(" — ")[0].split(" på ")[0]}</a>' for p in cross)
        cross_html = f'''
    <div style="margin-top:24px;padding:16px 20px;border-radius:14px;background:#fefcf8;border:1px solid #e6ddd0">
      <div style="font-size:12px;font-weight:600;color:#1e1710;margin-bottom:6px">Se även</div>
      <div style="font-size:13px;color:#4a4238;line-height:2">{cross_links}</div>
    </div>'''

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

    # Breadcrumb schema
    breadcrumb_ld = json.dumps({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Smakfynd", "item": "https://smakfynd.se"},
            {"@type": "ListItem", "position": 2, "name": page['title'].split(' — ')[0].split(' på ')[0]},
        ]
    }, ensure_ascii=False)

    # FAQ schema — page-specific questions
    top_wine = page['wines'][0] if page['wines'] else None
    top_name = top_wine.get('name', '') if top_wine else ''
    top_price = top_wine.get('price', 0) if top_wine else 0
    top_score = top_wine.get('smakfynd_score', 0) if top_wine else 0
    slug_title = page['h1'].split(' — ')[0]

    faq_items = [
        {"@type": "Question", "name": f"Vilket är det bästa valet bland {slug_title.lower()}?",
         "acceptedAnswer": {"@type": "Answer", "text": f"Just nu toppar {top_name} med {top_score}/100 i Smakfynd-poäng till {top_price} kr. Poängen baseras på crowd-betyg, expertrecensioner och prisvärde."}},
        {"@type": "Question", "name": "Hur beräknas Smakfynd-poängen?",
         "acceptedAnswer": {"@type": "Answer", "text": "Varje vin bedöms på tre saker: crowd-betyg (vad vanliga vindrickare tycker), expertrecensioner (kritiker som James Suckling, Decanter m.fl.) och prisvärde (pris jämfört med liknande viner). Hög kvalitet till lågt pris = hög poäng."}},
        {"@type": "Question", "name": "Hur ofta uppdateras listan?",
         "acceptedAnswer": {"@type": "Answer", "text": f"Listan uppdateras varje vecka med nya priser och betyg. Senast uppdaterad {DATE_STR}."}},
    ]
    faq_ld = json.dumps({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faq_items}, ensure_ascii=False)

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
  <script type="application/ld+json">{breadcrumb_ld}</script>
  <script type="application/ld+json">{faq_ld}</script>

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

    {cross_html}

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
        html = render_page(page, all_pages=pages)
        out_path = os.path.join(page_dir, 'index.html')
        with open(out_path, 'w') as f:
            f.write(html)

        print(f"  {page['slug']}/: {len(page['wines'])} wines ({os.path.getsize(out_path)/1024:.0f} KB)")
        generated += 1

    update_sitemap(pages)
    print(f"\nGenerated {generated} landing pages")

if __name__ == "__main__":
    main()
