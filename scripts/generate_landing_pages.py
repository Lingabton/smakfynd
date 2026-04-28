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
from pathlib import Path

BASE = str(Path(__file__).parent.parent)
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
            "intro2": "Rött vin från Systembolaget finns i hundratals varianter — från lätta Pinot Noir till tunga Cabernet Sauvignon. Vår ranking väger samman expertbetyg, crowd-recensioner och pris för att hitta de röda viner som verkligen levererar kvalitet per krona.",
            "guide": {
                "title": "Hur väljer man rött vin?",
                "points": [
                    "Matcha vinets kropp med matens intensitet — lätt vin till lättare rätter, fylligt till grillat och vilt.",
                    "Kolla smakbeskrivningen: gillar du fruktigt, välj Nya världen. Föredrar du jordigt, satsa på Europa.",
                    "Under 150 kr hittar du ofta bäst prisvärde bland röda viner från Chile, Argentina och Spanien.",
                    "Servera rött vin vid 16–18°C. Låt det gärna andas i 15 minuter innan servering.",
                ]
            },
            "faq_visible": [
                ("Vilket rött vin är bäst för nybörjare?", "Börja med en medelkroppad Malbec eller Merlot — de är fruktiga, lättdruckna och fungerar till de flesta rätter. Sök efter viner med smakfynd-poäng över 75 i prisklassen 90–130 kr."),
                ("Hur länge håller ett öppnat rött vin?", "Ett öppnat rött vin håller 3–5 dagar i kylen med korken i. Fylligare viner håller längre. Lätta röda som Pinot Noir bör drickas inom 2–3 dagar."),
            ],
            "wines": sorted([w for w in fast if w.get('type') == 'Rött' and w.get('pkg') == 'Flaska'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-vita-vin",
            "title": f"Bästa vita vinerna på Systembolaget {YEAR}",
            "meta": f"Topp 20 bästa vita viner på Systembolaget. Rankade efter smak och prisvärde. Uppdaterad {DATE_STR}.",
            "h1": f"Bästa vita vinerna på Systembolaget — {DATE_STR}",
            "intro": "Fräscha, fruktiga eller fyllda — här är de vita vinerna som ger mest smak för pengarna.",
            "intro2": "Vita viner på Systembolaget spänner från mineraldrivna Chablis till fylliga, fatlagrade Chardonnay. Vi rankar utifrån Vivino-betyg, expertrecensioner och pris per kvalitet så att du enkelt hittar det bästa vita vinet oavsett budget.",
            "guide": {
                "title": "Hur väljer man vitt vin?",
                "points": [
                    "Till fisk och skaldjur — välj fräscha viner med hög syra som Sauvignon Blanc eller Riesling.",
                    "Till kyckling och krämiga såser — prova en fylligare Chardonnay eller Viognier.",
                    "Servera vitt vin vid 8–10°C. Ta ut det ur kylen 10 minuter innan servering.",
                    "Ekologiska vita viner har blivit markant bättre — de kan vara riktiga fynd.",
                ]
            },
            "faq_visible": [
                ("Vilken är den bästa vita druvan för nybörjare?", "Sauvignon Blanc är ett bra val — fräsch, fruktig och lätt att tycka om. Riesling är ett annat utmärkt alternativ med balanserad syra och fruktighet."),
                ("Ska vitt vin alltid serveras kallt?", "Ja, men inte iskallt. 8–10°C är idealt för de flesta vita viner. Riktigt fyllda, fatlagrade vita viner kan serveras lite varmare, runt 10–12°C."),
            ],
            "wines": sorted([w for w in fast if w.get('type') == 'Vitt' and w.get('pkg') == 'Flaska'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-bubbel",
            "title": f"Bästa bubbel {YEAR} — Bästa mousserande på Systembolaget",
            "meta": f"Bästa bubbel {YEAR}. Topp 20 mousserande viner, champagne och cava på Systembolaget — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa bubbel {YEAR} — mousserande, champagne & cava",
            "intro": "Bästa bubbel just nu? Cava, prosecco, crémant eller champagne — här är de mousserande vinerna som ger mest fest för pengarna.",
            "intro2": "Bubbel från Systembolaget inkluderar allt från spansk Cava under hundralappen till prestigefylld champagne. Crémant från Alsace och Loire är ofta de bästa fynden — champagnekvalitet till en bråkdel av priset. Vi jämför betyg och pris åt dig.",
            "guide": {
                "title": "Hur väljer man bubbel?",
                "points": [
                    "Cava och Crémant ger bäst prisvärdhet — ofta lika bra som champagne till halva priset.",
                    "Prosecco är lättare och fruktigare, perfekt som aperitif. Välj Prosecco Superiore DOCG för bäst kvalitet.",
                    "Champagne lönar sig främst i prisklassen 300–400 kr — där finns riktiga kvalitetsfynd.",
                    "Servera bubbel vid 6–8°C. Lägg flaskan i isbad 20 minuter innan servering.",
                ]
            },
            "faq_visible": [
                ("Vad är skillnaden mellan Cava, Prosecco och Champagne?", "Champagne kommer från Champagne i Frankrike och jäser i flaskan. Cava är Spaniens motsvarighet med samma metod men lägre pris. Prosecco jäser i tank och blir lättare och fruktigare."),
                ("Kan man dricka bubbel till mat?", "Absolut! Bubbel med hög syra som Champagne och Crémant passar utmärkt till skaldjur, sushi och lätta förrätter. Även friterad mat funkar förvånansvärt bra."),
            ],
            "wines": sorted([w for w in fast if w.get('type') == 'Mousserande' and w.get('pkg') == 'Flaska'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-rose",
            "title": f"Bästa rosé {YEAR} — Bästa rosévinerna på Systembolaget",
            "meta": f"Bästa rosé {YEAR}. Topp 20 rosévin på Systembolaget — rankade efter kvalitet per krona. Bäst rosé just nu, uppdaterad {DATE_STR}.",
            "h1": f"Bästa rosévinerna {YEAR} — topp 20 på Systembolaget",
            "intro": "Letar du efter bästa rosé {YEAR}? Sommar eller vinter — rosé funkar alltid. Här är de rosévinerna som ger mest smak för pengarna just nu.",
            "intro2": "Roséviner på Systembolaget har exploderat i popularitet. Provence-rosé dominerar, men spanska och italienska roséer erbjuder ofta bättre prisvärdhet. Letar du efter en torr, elegant rosé eller en fruktigare variant? Vår ranking hjälper dig välja rätt.",
            "guide": {
                "title": "Hur väljer man rosé?",
                "points": [
                    "Provence-rosé är benchmark — ljus, torr och elegant. Men kolla priset, de kan vara överprisade.",
                    "Spanska och italienska roséer ger ofta samma kvalitet till lägre pris.",
                    "Servera rosé riktigt kallt, 6–8°C. Perfekt till sommarmat, sallader och grillad fisk.",
                    "Drick rosé ungt — köp årets årgång eller föregående år för bäst smak.",
                ]
            },
            "wines": sorted([w for w in fast if w.get('type') == 'Rosé' and w.get('pkg') == 'Flaska'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "vin-under-100-kr",
            "title": f"Bästa vinerna under 100 kr på Systembolaget {YEAR}",
            "meta": f"Prisvärda viner under 100 kr. Rankade efter kvalitet — inte bara pris. Uppdaterad {DATE_STR}.",
            "h1": f"Bästa vinerna under 100 kr — {DATE_STR}",
            "intro": "Under hundralappen och ändå riktigt bra? Det finns fler än du tror. Här är de bästa budgetvinerna just nu.",
            "intro2": "Billigt vin behöver inte vara dåligt vin. Bland Systembolagets viner under 100 kr hittar du överraskande bra kvalitet, särskilt från Chile, Sydafrika och Spanien. Vi filtrerar bort plonket och visar bara de som faktiskt smakar bra.",
            "guide": {
                "title": "Hur hittar man bra billigt vin?",
                "points": [
                    "Sydamerikanska viner (Chile, Argentina) ger generellt mest kvalitet under 100 kr.",
                    "Spansk Tempranillo och portugisiska viner är ofta undervärderade i denna prisklass.",
                    "Bag-in-box kan ge bättre kvalitet per krona, men vår lista fokuserar på flaskor.",
                    "Undvik att välja enbart efter etikett — kolla betyg och recensioner först.",
                ]
            },
            "faq_visible": [
                ("Finns det bra vin under 100 kr?", "Ja, absolut. Särskilt från Chile, Argentina och Spanien hittar du viner som fått höga crowd-betyg och goda expertrecensioner. Nyckeln är att kolla kvalitetsrankingar istället för att gissa i hyllan."),
                ("Vilket är det bästa billiga röda vinet?", "Det varierar, men chilensk Cabernet Sauvignon och argentinsk Malbec brukar dominera i prisklassen under 100 kr. Kolla vår topplista för det senaste."),
            ],
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and (w.get('price', 999) or 999) < 100],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "vin-under-150-kr",
            "title": f"Bästa vinerna under 150 kr på Systembolaget {YEAR}",
            "meta": f"Topp 20 viner under 150 kr. Kvalitetsrankade med crowd-betyg och expertrecensioner. {DATE_STR}.",
            "h1": f"Bästa vinerna under 150 kr — {DATE_STR}",
            "intro": "I prisklassen 100–150 kr hittar du ofta de bästa fynden. Här är vinerna som ger mest valuta för pengarna.",
            "intro2": "Prisklassen 100–150 kr är sweet spot för vin på Systembolaget. Här möts kvalitet och prisvärdhet — du får tillgång till mer komplexa viner från etablerade regioner som Rioja, Toscana och Rhône utan att behöva betala premiumpriser.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and (w.get('price', 999) or 999) < 150],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "vin-till-grillat",
            "title": f"Bästa vinerna till grillat kött {YEAR} — Systembolaget",
            "meta": f"Vin till grillat? Här är de bästa valen på Systembolaget — rankade efter smak och prisvärde. {DATE_STR}.",
            "h1": f"Bästa vinerna till grillat — {DATE_STR}",
            "intro": "Grillat kött kräver vin med lite kropp och smak. Här är de bästa alternativen — från budget till premium.",
            "intro2": "Vin till grillat kött bör ha fyllig kropp, mogna tanniner och gärna en touch av kryddighet. Argentinsk Malbec, australisk Shiraz och spansk Tempranillo är klassiska grillviner. Vi har filtrerat Systembolagets sortiment efter maträtter och rankat efter kvalitet.",
            "guide": {
                "title": "Hur väljer man vin till grillat?",
                "points": [
                    "Till nötkött och lamm: välj fylliga röda som Malbec, Cabernet Sauvignon eller Shiraz.",
                    "Till grillad kyckling: en medelkroppad röd som Pinot Noir eller en fyllig rosé fungerar utmärkt.",
                    "Till grillad fisk: Sauvignon Blanc eller en torr rosé med mineralkänsla.",
                    "Undvik för lätta eller för tanninstarka viner — de försvinner mot grillade smaker.",
                ]
            },
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
            "intro2": "Cabernet Sauvignon från Systembolaget finns i alla prisklasser — från chilenska budgetviner till prestigefyllda Bordeaux-blandningar. Druvan ger strukturerade viner med svarta vinbär, ceder och ofta fatlagring. Perfekt till kötträtter och grillat.",
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
            "intro2": "Pinot Noir på Systembolaget sträcker sig från eleganta Bourgogne till fruktdrivna Nya Zeeland-varianter. Druvan är känslig och svårodlad, vilket gör prisvärdhet extra viktig. Vi jämför alla Pinot Noir-viner i fast sortiment baserat på smak och pris.",
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
            "intro2": "Italienska viner på Systembolaget omfattar klassiker som Chianti, Barolo, Amarone och Primitivo. Italien är världens största vinproducent med över 500 inhemska druvor. Vi har rankat alla italienska viner efter kvalitet per krona för att hitta de bästa fynden.",
            "guide": {
                "title": "Hur väljer man italienskt vin?",
                "points": [
                    "Chianti Classico (inte bara Chianti) ger genomgående bättre kvalitet — leta efter DOCG-stämpeln.",
                    "Sicilien och Puglia erbjuder fantastiskt prisvärda viner, ofta under 120 kr med höga betyg.",
                    "Barolo och Brunello kräver budget (250 kr+) men kan vara otroliga upplevelser.",
                    "Prova Nero d'Avola och Primitivo för fruktdrivna, generösa viner till bra pris.",
                ]
            },
            "faq_visible": [
                ("Vad är skillnaden mellan Chianti och Chianti Classico?", "Chianti Classico kommer från det ursprungliga, mindre området i Toscana och har strängare kvalitetskrav. Vanlig Chianti kan komma från ett mycket större område med lägre minimikrav. Classico är nästan alltid bättre."),
                ("Vilka italienska viner passar till pasta?", "Till tomatsås: Sangiovese (Chianti) eller Montepulciano d'Abruzzo. Till krämig pasta: en fyllig vit som Vermentino. Till pesto: Vermentino eller en lätt Pinot Grigio."),
            ],
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'Italien'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-franska-vin",
            "title": f"Bästa franska vinerna på Systembolaget {YEAR}",
            "meta": f"Topp 20 franska viner. Bordeaux, Bourgogne, Rhône och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa franska vinerna på Systembolaget — {DATE_STR}",
            "intro": "Frankrike är vinets hemland. Här är de franska viner som ger mest smak för pengarna.",
            "intro2": "Franska viner på Systembolaget täcker allt från Bordeaux och Bourgogne till Rhône och Languedoc. Frankrike sätter standarden för vinvärlden, men priserna varierar enormt. Vår ranking avslöjar vilka franska viner som verkligen är prisvärda.",
            "guide": {
                "title": "Hur väljer man franskt vin?",
                "points": [
                    "Languedoc och Rhône ger bäst prisvärdhet — ofta hälften så dyrt som Bordeaux med lika bra smak.",
                    "Côtes du Rhône är en trygg favorit till 100–150 kr. Välj Villages för ett steg upp.",
                    "Bordeaux under 150 kr är ofta tunna — satsa på 180 kr+ för att få riktigt bra kvalitet.",
                    "Crémant (mousserande) från Alsace eller Loire är Frankrikes bäst bevarade vinhemlighet.",
                ]
            },
            "faq_visible": [
                ("Är fransk vin alltid bäst?", "Nej, men Frankrike har den bredaste kvaliteten. Problemet är att franskt vin ofta är dyrare. I prisklassen under 120 kr får du ofta mer för pengarna från Chile eller Spanien."),
                ("Vad betyder AOC och AOP på franska viner?", "AOC (Appellation d'Origine Contrôlée) och AOP (Appellation d'Origine Protégée) är samma sak — en kvalitetsgaranti som säkerställer att vinet kommer från en specifik region och följer lokala regler för druvor och produktion."),
            ],
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'Frankrike'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-spanska-vin",
            "title": f"Bästa spanska vinerna på Systembolaget {YEAR}",
            "meta": f"Topp 20 spanska viner. Rioja, Ribera del Duero, Priorat och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa spanska vinerna på Systembolaget — {DATE_STR}",
            "intro": "Spanien har fantastisk prisvärdhet. Här är de spanska vinerna som ger mest bang for the buck.",
            "intro2": "Spanska viner är bland de mest prisvärda på Systembolaget. Regioner som Rioja, Ribera del Duero och Priorat levererar världsklass, medan Jumilla och Calatayud erbjuder otroliga budgetfynd. Tempranillo och Garnacha dominerar men det finns mycket mer att upptäcka.",
            "guide": {
                "title": "Hur väljer man spanskt vin?",
                "points": [
                    "Rioja Crianza (lagrat 1 år i fat) ger ofta bäst prisvärde bland spanska viner.",
                    "Ribera del Duero har kraftfullare stil — perfekt till grillat kött.",
                    "Jumilla och Calatayud är underskattade regioner med fantastiska viner under 100 kr.",
                    "Garnacha (Grenache) från Spanien ger generösa, kryddiga viner med bra prisvärde.",
                ]
            },
            "faq_visible": [
                ("Vad betyder Crianza, Reserva och Gran Reserva?", "Crianza har lagrats minst 1 år i fat, Reserva minst 3 år (varav 1 i fat), och Gran Reserva minst 5 år (varav 2 i fat). Längre lagring ger mer komplexitet men inte alltid bättre smak — Crianza är ofta fräschast."),
                ("Vilken spansk vinregion är bäst?", "Rioja är den mest kända och pålitliga. Ribera del Duero ger kraftfullare stil. Priorat är för den som vill ha koncentrerat och komplext. För budgetfynd: kolla Jumilla och Campo de Borja."),
            ],
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'Spanien'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-chilenska-vin",
            "title": f"Bästa chilenska vinerna på Systembolaget {YEAR}",
            "meta": f"Topp chilenska viner. Carmenère, Cabernet och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa chilenska vinerna på Systembolaget — {DATE_STR}",
            "intro": "Chile levererar fantastisk kvalitet till låga priser. Här är de bästa chilenska fynden.",
            "intro2": "Chilenska viner dominerar budgetsegmentet på Systembolaget med druvor som Cabernet Sauvignon, Carmenère och Sauvignon Blanc. Vinregionerna sträcker sig från svala Casablanca till varma Maule. Chile är perfekt för dig som vill ha kvalitetsvin utan att betala europapremium.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'Chile'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-sydafrikanska-vin",
            "title": f"Bästa sydafrikanska vinerna på Systembolaget {YEAR}",
            "meta": f"Topp sydafrikanska viner. Pinotage, Chenin Blanc och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa sydafrikanska vinerna på Systembolaget — {DATE_STR}",
            "intro": "Sydafrika är en underskattad vinproducent med fantastisk prisvärdhet. Här är de bästa köpen.",
            "intro2": "Sydafrikanska viner på Systembolaget är ofta bland de mest prisvärda. Pinotage är landets signaturdruva, men Chenin Blanc, Shiraz och Cabernet ger också utmärkt kvalitet. Vinregionen Stellenbosch producerar Sydafrikas mest ansedda viner.",
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
            "intro2": "Prisklassen under 200 kr ger dig tillgång till de flesta vinregioner i världen. Här hittar du allt från lagrat Rioja till elegant Pinot Noir och kraftfull Shiraz. Majoriteten av Systembolagets bästa köp ligger i just detta prissegment.",
            "guide": {
                "title": "Hur hittar man bra vin under 200 kr?",
                "points": [
                    "Kolla smakfynd-poängen istället för att gissa — viner med 80+ poäng ger nästan alltid bra upplevelse.",
                    "Spanska Rioja Crianza och italienska Montepulciano d'Abruzzo är säkra kort under 150 kr.",
                    "Sydamerikanska viner ger generellt mer smak per krona än europeiska i denna klass.",
                    "Ekologiska viner i denna prisklass har blivit markant bättre de senaste åren.",
                ]
            },
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and (w.get('price', 999) or 999) < 200],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-premium-vin",
            "title": f"Bästa premiumviner 200–500 kr på Systembolaget {YEAR}",
            "meta": f"Topp premiumviner 200-500 kr. Expertbetyg, crowd-betyg och prisjämförelse. {DATE_STR}.",
            "h1": f"Bästa premiumviner 200–500 kr — {DATE_STR}",
            "intro": "I premiumklassen hittar du viner med riktigt höga betyg. Här är de som ger bäst valuta.",
            "intro2": "Premiumviner mellan 200 och 500 kr på Systembolaget inkluderar lagade Bordeaux, Barolo, topprankade Rhône-viner och exklusiva Nya världen-producenter. Här spelar expertbetyg stor roll — skillnaden mellan bra och fantastiskt syns tydligt i denna prisklass.",
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

        # ─── Regioner ───
        {
            "slug": "basta-vin-fran-bordeaux",
            "title": f"Bästa Bordeaux-viner på Systembolaget {YEAR}",
            "meta": f"Topp 20 Bordeaux-viner på Systembolaget. Klassiska blandningar rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Bordeaux-viner på Systembolaget — {DATE_STR}",
            "intro": "Bordeaux är vinvärldens mest ikoniska region — hem för legendariska châteaux och tidlösa blandningar av Cabernet Sauvignon och Merlot.",
            "intro2": "Bordeaux terroir är unikt: havsnära klimat, grus- och lerjordar och sekler av vinkunskap skapar viner med struktur, elegans och lagringspotential. På Systembolaget finns allt från prisvärda Côtes de Bordeaux till exklusiva Saint-Émilion och Médoc. Vi har rankat alla Bordeaux-viner efter kvalitet per krona för att hitta de verkliga fynden.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('region') or '') == 'Bordeaux'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-vin-fran-toscana",
            "title": f"Bästa Toscana-viner på Systembolaget {YEAR}",
            "meta": f"Topp 20 Toscana-viner på Systembolaget. Chianti, Brunello och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Toscana-viner på Systembolaget — {DATE_STR}",
            "intro": "Toscana är hem för Italiens mest älskade viner — från vardaglig Chianti till magnifik Brunello di Montalcino.",
            "intro2": "Toscana levererar viner i alla prisklasser. Chianti Classico DOCG ger pålitlig kvalitet med Sangiovese-druvan i centrum, medan Brunello di Montalcino och Vino Nobile di Montepulciano erbjuder djupare komplexitet. Super Toscans blandar internationella druvor med italiensk finesse. Vi har rankat alla Toscana-viner efter kvalitet per krona.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('region') or '') == 'Toscana'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-vin-fran-rioja",
            "title": f"Bästa Rioja-viner på Systembolaget {YEAR}",
            "meta": f"Topp 20 Rioja-viner på Systembolaget. Crianza, Reserva och Gran Reserva — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Rioja-viner på Systembolaget — {DATE_STR}",
            "intro": "Rioja är Spaniens mest klassiska vinregion — känd för eleganta Tempranillo-viner med vanilj, körsbär och kryddiga toner.",
            "intro2": "Rioja-viner delas in efter lagringstid: Joven (ung), Crianza (1 år i fat), Reserva (3 år totalt) och Gran Reserva (5 år totalt). Tempranillo dominerar, ofta med inslag av Garnacha och Graciano. Crianza ger ofta bäst prisvärdhet, medan Reserva och Gran Reserva erbjuder mer komplexitet och mognad. Vi rankar alla Rioja-viner efter smak och prisvärdhet.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('region') or '') == 'Rioja'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-vin-fran-bourgogne",
            "title": f"Bästa Bourgogne-viner på Systembolaget {YEAR}",
            "meta": f"Topp 20 Bourgogne-viner på Systembolaget. Pinot Noir och Chardonnay — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Bourgogne-viner på Systembolaget — {DATE_STR}",
            "intro": "Bourgogne är Pinot Noirs och Chardonnays hemland — eleganta viner med oöverträffad terroirkänsla.",
            "intro2": "Bourgogne producerar världens mest eftertraktade Pinot Noir (röda) och Chardonnay (vita). Regionen är känd för sitt terroirfokus där varje vingård ger unika karaktärsdrag. Från fräsch Chablis till fyllig Meursault bland vita, och från elegant Beaune till kraftfull Gevrey-Chambertin bland röda — Bourgogne har enorm bredd. Priserna varierar kraftigt, men det finns fynd att göra.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('region') or '') == 'Bourgogne'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-vin-fran-rhonedalen",
            "title": f"Bästa Rhône-viner på Systembolaget {YEAR}",
            "meta": f"Topp 20 Rhône-viner på Systembolaget. Syrah, Grenache och GSM-blandningar — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Rhône-viner på Systembolaget — {DATE_STR}",
            "intro": "Rhônedalen erbjuder kraftfulla, kryddiga viner — från eleganta norra Rhône-Syraher till generösa södra Rhône-blandningar.",
            "intro2": "Rhônedalen delas i norra och södra. Norra Rhône ger koncentrerade Syrah-viner från Côte-Rôtie, Hermitage och Cornas. Södra Rhône domineras av GSM-blandningar (Grenache, Syrah, Mourvèdre) med Châteauneuf-du-Pape som kronjuvel. Côtes du Rhône och Côtes du Rhône Villages erbjuder fantastisk prisvärdhet och är ofta bland Systembolagets bästa köp.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('region') or '') == 'Rhonedalen'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },

        # ─── Fler tillfällen ───
        {
            "slug": "vin-till-brunch",
            "title": f"Bästa vinerna till brunch {YEAR}",
            "meta": f"Vin till brunch? Här är de bästa mousserande, vita och rosévinerna på Systembolaget. {DATE_STR}.",
            "h1": f"Bästa vinerna till brunch — {DATE_STR}",
            "intro": "Brunch och bubbel hör ihop, men även lätta vita och roséer lyfter en söndagsbrunch. Här är de bästa alternativen.",
            "intro2": "Till brunch vill du ha viner som är fräscha, lätta och festliga. Mousserande viner som Cava, Prosecco och Crémant är givna val — de funkar till allt från äggbenedict till frukt. Lätta vita viner och torra roséer kompletterar perfekt om du vill ha något stillsamt. Vi har valt ut de bästa brunchvinerna baserat på smak och prisvärdhet.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('type') == 'Mousserande'
                                or (w.get('type') in ('Vitt', 'Rosé') and (w.get('taste_body') or 12) <= 6))],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "vin-till-lax",
            "title": f"Bästa vinerna till lax {YEAR}",
            "meta": f"Vin till lax? Här är de bästa vita och rosévinerna som matchar lax perfekt. {DATE_STR}.",
            "h1": f"Bästa vinerna till lax — {DATE_STR}",
            "intro": "Lax är en av Sveriges mest älskade råvaror — och rätt vin gör måltiden komplett. Här är de bästa matchningarna.",
            "intro2": "Till lax fungerar vita och roséer bäst. Fräsch Sauvignon Blanc, mineralisk Chablis eller en elegant Chardonnay lyfter både gravad, stekt och ugnsbakad lax. Lättare roséer med god syra passar också utmärkt, särskilt till grillad lax. Vi har filtrerat Systembolagets sortiment efter fiskpairing och valt de bästa vita och rosévinerna.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') in ('Vitt', 'Rosé')
                           and any('fisk' in (f or '').lower() for f in (w.get('food_pairings') or []))],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "vin-till-tacos",
            "title": f"Bästa vinerna till tacos {YEAR}",
            "meta": f"Vin till tacos? Här är de bästa prisvärda vinerna som passar till tacofredag. {DATE_STR}.",
            "h1": f"Bästa vinerna till tacos — {DATE_STR}",
            "intro": "Tacofredag förtjänar ett gott vin. Fruktiga röda med medelfyllig kropp eller en fräsch rosé funkar perfekt.",
            "intro2": "Till tacos vill du ha avslappnade, fruktiga viner som inte tar över smaken. Medelkroppade röda viner som Malbec, Tempranillo och Garnacha passar utmärkt — de har frukt och krydda som kompletterar tacokryddorna. Rosé är ett annat toppval, särskilt till kyckling- och fisktacos. Vi har valt prisvärda viner under 150 kr som gör fredagstacosen ännu godare.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('price', 999) or 999) <= 150
                           and ((w.get('type') == 'Rött' and (w.get('taste_body') or 0) >= 4 and (w.get('taste_body') or 0) <= 8)
                                or w.get('type') == 'Rosé')],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },

        # ─── Fler regioner ───
        {
            "slug": "basta-vin-fran-champagne",
            "title": f"Bästa Champagne på Systembolaget {YEAR}",
            "meta": f"Topp 20 äkta Champagne-viner på Systembolaget. Rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Champagne på Systembolaget — {DATE_STR}",
            "intro": "Äkta Champagne — inte bara bubbel. Här är de mousserande vinerna från Champagne som verkligen levererar.",
            "intro2": "Bara mousserande vin från Champagne-regionen i Frankrike får kallas Champagne. Till skillnad från Cava, Prosecco och Crémant genomgår äkta Champagne en andra jäsning på flaskan som ger den karaktäristiska finheten, de små bubblorna och den komplexa smaken av brioche och rostad nöt. Priserna är högre, men kvalitetsskillnaden mot andra mousserande viner märks tydligt. Vi har rankat alla äkta Champagne-viner i Systembolagets fasta sortiment efter kvalitet per krona.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('region') or '') == 'Champagne' and w.get('type') == 'Mousserande'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-vin-fran-languedoc",
            "title": f"Bästa Languedoc-viner på Systembolaget {YEAR}",
            "meta": f"Topp 20 Languedoc-viner på Systembolaget. Prisvärda viner från södra Frankrike. {DATE_STR}.",
            "h1": f"Bästa Languedoc-viner på Systembolaget — {DATE_STR}",
            "intro": "Languedoc är södra Frankrikes vinparadis — fantastisk kvalitet till priser som Bordeaux bara kan drömma om.",
            "intro2": "Languedoc-Roussillon är Frankrikes största vinregion och en guldgruva för prisvärda viner. Här odlas Syrah, Grenache, Carignan och Mourvèdre i medelhavsklimat som ger mogna, generösa viner med kryddiga och fruktiga toner. Regionen har genomgått en kvalitetsrevolution de senaste decennierna — dagens Languedoc-viner håller ofta samma nivå som betydligt dyrare Rhône- och Bordeaux-viner. Ett av Systembolagets bäst bevarade vinfynd.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and 'languedoc' in (w.get('region') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-vin-fran-alsace",
            "title": f"Bästa Alsace-viner på Systembolaget {YEAR}",
            "meta": f"Topp 20 Alsace-viner på Systembolaget. Riesling, Gewürztraminer och mer. {DATE_STR}.",
            "h1": f"Bästa Alsace-viner på Systembolaget — {DATE_STR}",
            "intro": "Alsace är Frankrikes vita vinmecka — hem för aromatiska Riesling och Gewürztraminer av världsklass.",
            "intro2": "Alsace i nordöstra Frankrike producerar några av världens bästa vita viner. Riesling ger mineraliska, torra viner med fantastisk lagringspotential, medan Gewürztraminer bjuder på exotiska aromer av lychee, ros och kryddor. Pinot Gris levererar fylliga, runda viner och Crémant d'Alsace är ett av Frankrikes bästa mousserande fynd. Alsace-viner säljs på druva (inte region som i övriga Frankrike), vilket gör det lätt att välja rätt.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('region') or '') == 'Alsace'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-kaliforniska-vin",
            "title": f"Bästa kaliforniska vinerna på Systembolaget {YEAR}",
            "meta": f"Topp 20 kaliforniska viner på Systembolaget. Napa Valley, Sonoma och mer. {DATE_STR}.",
            "h1": f"Bästa kaliforniska vinerna på Systembolaget — {DATE_STR}",
            "intro": "Kalifornien producerar USA:s mest ikoniska viner — från kraftfulla Napa Cabernets till eleganta Sonoma Pinot Noirs.",
            "intro2": "Kaliforniska viner på Systembolaget representerar det bästa från USA:s största vinstat. Napa Valley är känt för sina kraftfulla, koncentrerade Cabernet Sauvignon-viner, medan Sonoma erbjuder mer eleganta Pinot Noir och Chardonnay. Central Coast har vuxit fram som en spännande region med Rhône-druvor och unika terroir. Kalifornien levererar mogna, fruktdrivna viner med generös smak — perfekt för dig som gillar det nya världen-stilen med rik frukt och ofta fatlagring.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'USA'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },

        # ─── Fler pris & smakprofiler ───
        {
            "slug": "vin-under-80-kr",
            "title": f"Bästa vinerna under 80 kr på Systembolaget {YEAR}",
            "meta": f"Topp 20 viner under 80 kr på Systembolaget. De billigaste vinerna som faktiskt smakar bra. Uppdaterad {DATE_STR}.",
            "h1": f"Bästa vinerna under 80 kr — {DATE_STR}",
            "intro": "Går det att hitta riktigt bra vin till lägsta möjliga pris? Absolut. Vi har gått igenom alla viner under 80 kr och plockat ut de som faktiskt levererar smak och kvalitet — trots det låga priset.",
            "intro2": "Under 80 kr är urvalet begränsat, men det finns pärlor att hitta. Chilenska och sydafrikanska viner dominerar denna prisklass med fruktiga, lättdruckna alternativ som överraskar. Nyckeln är att inte förvänta sig komplexitet utan att leta efter rena, välgjorda viner med bra frukt. Vår ranking filtrerar bort plonket och visar bara de som verkligen är värda pengarna.",
            "guide": {
                "title": "Hur hittar man bra vin under 80 kr?",
                "points": [
                    "Fokusera på Chile, Sydafrika och Spanien — dessa länder ger mest smak i lägsta prisklassen.",
                    "Undvik komplicerade blandningar — en ren Cabernet Sauvignon eller Merlot ger oftast bäst resultat under 80 kr.",
                    "Drick vinet ungt — billiga viner mår inte bra av lagring.",
                    "Kolla smakfynd-poängen — den avslöjar vilka budgetviner som faktiskt håller måttet.",
                ]
            },
            "faq_visible": [
                ("Finns det drinkbart vin under 80 kr?", "Ja, det finns faktiskt riktigt trevliga viner under 80 kr. Framförallt från Chile och Sydafrika hittar du fruktiga, välgjorda viner som fungerar utmärkt till vardags. Nyckeln är att kolla betyg istället för att gissa."),
                ("Vilket är det bästa billigaste vinet?", "Det varierar, men i prisklassen under 80 kr dominerar chilensk Cabernet Sauvignon och sydafrikansk Chenin Blanc. Kolla vår topplista för det senaste — den uppdateras varje vecka."),
            ],
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and (w.get('price', 999) or 999) < 80],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "fruktiga-roda-vin",
            "title": f"Bästa fruktiga röda vinerna på Systembolaget {YEAR}",
            "meta": f"Topp 20 fruktiga röda viner på Systembolaget. Smakrika och lättdruckna — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa fruktiga röda vinerna — {DATE_STR}",
            "intro": "Gillar du röda viner med tydlig fruktighet? Bärrika, saftiga och generösa — här är de mest fruktdrivna röda vinerna som verkligen levererar smak.",
            "intro2": "Fruktiga röda viner kännetecknas av intensiva smaker av mörka bär, körsbär, plommon och ibland tropiska toner. De är ofta lättdruckna och behöver ingen lång lagring. Druvor som Malbec, Zinfandel, Garnacha och Shiraz ger generellt mest fruktighet. Viner från varmare klimat — som Argentina, Australien och södra Spanien — tenderar att vara mer fruktdrivna än europeiska motsvarigheter. Vi har filtrerat på hög fruktighet i smakprofilen för att hitta de allra mest smakrika.",
            "guide": {
                "title": "Hur väljer man fruktiga röda viner?",
                "points": [
                    "Malbec från Argentina och Shiraz från Australien är två av de mest fruktdrivna druvorna.",
                    "Kolla smakbeskrivningen — ord som 'bärig', 'saftig' och 'generös' signalerar hög fruktighet.",
                    "Nya världen-viner (Chile, Argentina, Australien) är generellt fruktigare än europeiska.",
                    "Servera fruktiga röda viner lite svalare, runt 15–16°C, för att framhäva fruktigheten.",
                ]
            },
            "faq_visible": [
                ("Vilka druvor ger mest fruktiga röda viner?", "Malbec, Zinfandel, Garnacha och Shiraz är de mest fruktdrivna röda druvorna. Primitivo (Italiens version av Zinfandel) ger också mycket frukt. Merlot kan vara fruktig men tenderar att vara mer mjuk och rund."),
                ("Passar fruktiga röda viner till mat?", "Absolut! Fruktiga röda viner är fantastiska till grillat, pizza, tacos och kryddiga rätter. Fruktigheten balanserar starka smaker och gör vinerna väldigt mångsidiga."),
            ],
            "wines": sorted([w for w in fast if w.get('type') == 'Rött' and w.get('pkg') == 'Flaska'
                           and (w.get('taste_fruit') or 0) >= 8],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "ekologiskt-vin-under-150-kr",
            "title": f"Bästa ekologiska vinerna under 150 kr {YEAR}",
            "meta": f"Topp 20 ekologiska viner under 150 kr. Hållbart, prisvärt och gott — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa ekologiska vinerna under 150 kr — {DATE_STR}",
            "intro": "Ekologiskt vin behöver varken kosta mycket eller smaka sämre. Här är de bästa eko-vinerna under 150 kr — prisvärda, hållbara och riktigt goda.",
            "intro2": "Ekologiska viner har utvecklats enormt de senaste åren. Dagens eko-producenter gör viner som inte bara är bra för miljön utan också håller riktigt hög kvalitet. Under 150 kr hittar du ekologiska viner från Spanien, Italien, Chile och Frankrike som alla levererar smak och hållbarhet. Vi har filtrerat på ekologisk certifiering och pris för att hitta de bästa fynden.",
            "guide": {
                "title": "Hur väljer man ekologiskt vin?",
                "points": [
                    "Leta efter EU:s ekologiska märkning (det gröna lövet) — det garanterar att vinet uppfyller ekologiska standarder.",
                    "Spanska och italienska eko-viner ger ofta bäst prisvärdhet under 150 kr.",
                    "Ekologiskt vin innehåller generellt mindre svavel, vilket kan ge renare smak.",
                    "Prova ekologiska viner från Languedoc och Puglia — de är ofta undervärderande fynd.",
                ]
            },
            "faq_visible": [
                ("Smakar ekologiskt vin annorlunda?", "Inte nödvändigtvis, men många upplever att eko-viner har en renare, mer autentisk smak. Lägre svavelhalt kan ge en mer levande fruktkänsla. Kvalitetsskillnaden handlar mer om producenten än om certifieringen."),
                ("Är ekologiskt vin bättre?", "Ekologiskt vin är bättre för miljön tack vare färre kemiska bekämpningsmedel och mer hållbar odling. Smäckmässigt beror det på producenten — men de bästa eko-vinerna håller absolut samma nivå som konventionella viner."),
            ],
            "wines": sorted([w for w in fast if w.get('organic') and w.get('pkg') == 'Flaska'
                           and (w.get('price', 999) or 999) < 150],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "torra-vita-vin",
            "title": f"Bästa torra vita vinerna på Systembolaget {YEAR}",
            "meta": f"Topp 20 torra vita viner på Systembolaget. Fräscha, mineraliska och eleganta — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa torra vita vinerna — {DATE_STR}",
            "intro": "Letar du efter vita viner utan sötma? Torra, fräscha och eleganta — här är de bästa torra vita vinerna med krispig syra och ren smak.",
            "intro2": "Torra vita viner har minimal restsocker och låter druvans karaktär, syran och mineraliteten stå i centrum. Chablis, Sancerre och torra Riesling är klassiska exempel. Sauvignon Blanc från Loire och Nya Zeeland ger fräsch citrus och gröna toner, medan torra Chardonnay från Bourgogne erbjuder mer kropp och komplexitet. Vi har filtrerat på låg sötma i smakprofilen för att hitta de allra torraste och mest eleganta vita vinerna.",
            "guide": {
                "title": "Hur väljer man torrt vitt vin?",
                "points": [
                    "Chablis och Sancerre är nästan alltid stentorra — trygga val om du vill undvika sötma.",
                    "Kolla smakprofilen: sötma 1–3 av 12 innebär ett riktigt torrt vin.",
                    "Sauvignon Blanc, Grüner Veltliner och Albariño ger generellt de torraste vita vinerna.",
                    "Servera torrt vitt vin vid 8–10°C — kylan framhäver fräschheten och syran.",
                ]
            },
            "faq_visible": [
                ("Vad betyder torrt vin?", "Torrt vin har lite eller inget restsocker — under 4 gram per liter. Det innebär att all druvsockret har jäst ut till alkohol. Torrt betyder inte surt eller tråkigt — det betyder att vinet låter frukt, syra och mineralitet tala istället för sötma."),
                ("Vilka vita druvor ger torrast vin?", "Sauvignon Blanc, Chablis (Chardonnay), Muscadet, Grüner Veltliner och Albariño är bland de druvor som oftast ger riktigt torra vita viner. Riesling kan vara torrt men varierar — kolla alltid smakprofilen."),
            ],
            "wines": sorted([w for w in fast if w.get('type') == 'Vitt' and w.get('pkg') == 'Flaska'
                           and (w.get('taste_sweet') is not None and (w.get('taste_sweet') or 0) <= 3)],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },

        # ─── Nya sidor: seasonal + long-tail ───
        {
            "slug": "vin-under-90-kr",
            "title": f"Bästa vinerna under 90 kr på Systembolaget {YEAR}",
            "meta": f"Topp 20 bästa viner under 90 kr. Prisvärt och gott — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa vinerna under 90 kr — {DATE_STR}",
            "intro": "Du behöver inte spendera mycket för att dricka bra. Här är de bästa vinerna under 90 kr — vardagsfavoriter med hög poäng.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and (w.get('price', 999) or 999) < 90],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "sommarvin",
            "title": f"Bästa sommarvinerna {YEAR} — fräscha och kylda",
            "meta": f"Bästa sommarviner på Systembolaget {YEAR}. Fräscha vita, rosé och bubbel för grillkvällar och picknick. {DATE_STR}.",
            "h1": f"Bästa sommarvinerna {YEAR}",
            "intro": "Sommar = fräscht, kylt och enkelt. Här är de vita, rosé och mousserande vinerna som passar perfekt till grillkvällar, picknick och sena sommarkvällar.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') in ('Vitt', 'Rosé', 'Mousserande')
                           and (w.get('price', 999) or 999) <= 200],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "hostvin",
            "title": f"Bästa höstvinerna {YEAR} — varma och fylliga",
            "meta": f"Bästa höstviner: fylliga röda till mörka kvällar, vilt och gratänger. {DATE_STR}.",
            "h1": f"Bästa höstvinerna {YEAR}",
            "intro": "Hösten kallar på varma, fylliga viner. Här är de röda vinerna som passar perfekt till viltstuvning, svampsås och mörka novemberkvällar.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('type') == 'Rött'
                           and (w.get('taste_body') or 0) >= 7],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "vin-till-pizza",
            "title": f"Bästa vinerna till pizza {YEAR}",
            "meta": f"Vilket vin passar till pizza? Topp 20 bästa vinerna till pizza — från Margherita till pepperoni. {DATE_STR}.",
            "h1": f"Bästa vinerna till pizza — {DATE_STR}",
            "intro": "Pizza och vin är en klassisk kombo. Italienska röda och friska vita — här är de bästa vinerna till pizzakvällen.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('country') == 'Italien' or w.get('grape', '').lower() in ('sangiovese', 'primitivo', 'montepulciano'))
                           and w.get('type') in ('Rött', 'Vitt')],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "vin-till-sushi",
            "title": f"Bästa vinerna till sushi {YEAR}",
            "meta": f"Bästa viner till sushi och japansk mat. Fräscha vita, torr rosé och lätt bubbel. {DATE_STR}.",
            "h1": f"Bästa vinerna till sushi — {DATE_STR}",
            "intro": "Sushi kräver vin med fräschör och precision. Fräscha vita, torra roséer och mousserande — här är de bästa vinerna till sushi.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') in ('Vitt', 'Rosé', 'Mousserande')
                           and (w.get('taste_sweet') is None or (w.get('taste_sweet') or 0) <= 4)],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "vin-till-lamm",
            "title": f"Bästa vinerna till lamm {YEAR}",
            "meta": f"Bästa viner till lamm, grillat lamm och lammkotletter. Kraftiga röda med kryddig karaktär. {DATE_STR}.",
            "h1": f"Bästa vinerna till lamm — {DATE_STR}",
            "intro": "Lamm vill ha vin med struktur och kryddighet. Syrah, Tempranillo och Cabernet Sauvignon — här är de bästa vinerna till lammrätter.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('type') == 'Rött'
                           and (w.get('taste_body') or 0) >= 7
                           and any(g in (w.get('grape') or '').lower() for g in ['syrah', 'shiraz', 'tempranillo', 'cabernet', 'malbec', 'grenache', 'mourvèdre'])],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "vin-till-picknick",
            "title": f"Bästa vinerna till picknick {YEAR}",
            "meta": f"Bästa picknick-viner — lätta, fräscha och enkla att ta med. {DATE_STR}.",
            "h1": f"Bästa vinerna till picknick — {DATE_STR}",
            "intro": "Picknick = lättsamt, fräscht och gärna kylt. Här är de bästa vinerna att ta med i korgen — från roséer till lätta bubbel.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') in ('Rosé', 'Vitt', 'Mousserande')
                           and (w.get('price', 999) or 999) <= 150],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-merlot",
            "title": f"Bästa Merlot-vinerna på Systembolaget {YEAR}",
            "meta": f"Topp 20 bästa Merlot på Systembolaget. Mjuka, fruktiga och eleganta — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Merlot-vinerna — {DATE_STR}",
            "intro": "Merlot är den mjuka, tillgängliga favoriten. Fruktigt, rundt och vänligt — perfekt för den som vill ha ett rött vin utan för mycket tanniner.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and 'merlot' in (w.get('grape') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-grenache",
            "title": f"Bästa Grenache/Garnacha-vinerna {YEAR}",
            "meta": f"Topp 20 Grenache/Garnacha från Systembolaget. Kryddigt, fruktigt, generöst. {DATE_STR}.",
            "h1": f"Bästa Grenache-vinerna — {DATE_STR}",
            "intro": "Grenache (eller Garnacha) ger generösa, kryddiga röda viner med bärtoner och värme. Populär i Rhônedalen, Spanien och Australien.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and any(g in (w.get('grape') or '').lower() for g in ['grenache', 'garnacha'])],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-argentinska-vin",
            "title": f"Bästa argentinska vinerna på Systembolaget {YEAR}",
            "meta": f"Topp 20 argentinska viner. Malbec, Torrontés och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa argentinska vinerna — {DATE_STR}",
            "intro": "Argentina = Malbec. Men det finns mer — Torrontés, Cabernet Franc och spännande blandningar. Här är de bästa argentinska vinerna just nu.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'Argentina'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-cava",
            "title": f"Bästa Cava på Systembolaget {YEAR}",
            "meta": f"Topp Cava — prisvärt bubbel från Spanien. Rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Cava — {DATE_STR}",
            "intro": "Cava är Spaniens svar på champagne — till en bråkdel av priset. Fräscht, torrt och festligt. Här är de bästa Cava-köpen.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Mousserande' and w.get('country') == 'Spanien'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "mousserande-vin-under-150-kr",
            "title": f"Bästa mousserande viner under 150 kr {YEAR}",
            "meta": f"Bubbel under 150 kr — festligt utan att ruinera dig. Rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa mousserande vinerna under 150 kr — {DATE_STR}",
            "intro": "Du behöver inte betala champagne-pris för riktigt bra bubbel. Här är de bästa mousserande vinerna under 150 kr — perfekta för fredagsmys, fest eller bara för att det är onsdag.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Mousserande'
                           and (w.get('price', 999) or 999) < 150],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "vin-till-svamp",
            "title": f"Bästa vinerna till svamprisotto och svamprätter {YEAR}",
            "meta": f"Bästa viner till svamp, svamprisotto och tryffel. Jordiga röda och eleganta vita. {DATE_STR}.",
            "h1": f"Bästa vinerna till svamprätter — {DATE_STR}",
            "intro": "Svamp vill ha vin med jordiga toner och elegans. Pinot Noir, Nebbiolo och fyllda Chardonnay — här är de bästa vinerna till svamprisotto och kantareller.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and any(g in (w.get('grape') or '').lower() for g in ['pinot noir', 'nebbiolo', 'barbera', 'chardonnay', 'barolo'])
                           and (w.get('taste_body') or 0) >= 5],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "vin-till-nyar",
            "title": f"Bästa vinerna till nyår {YEAR + 1}",
            "meta": f"Bästa bubbel och vin till nyårsfirandet. Champagne, Cava, Prosecco och mer. {DATE_STR}.",
            "h1": f"Bästa vinerna till nyår",
            "intro": "Nyår kräver bubbel! Här är de bästa mousserande vinerna för att fira in det nya året — från prisvärd Cava till exklusiv Champagne.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('type') == 'Mousserande'],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
        {
            "slug": "basta-carmenere",
            "title": f"Bästa Carménère på Systembolaget {YEAR}",
            "meta": f"Topp Carménère — Chiles underskattade druva. Kryddigt och unikt. {DATE_STR}.",
            "h1": f"Bästa Carménère-vinerna — {DATE_STR}",
            "intro": "Carménère — Chiles signaturdruva med kryddiga, gröna och mörka bärtoner. Unik och ofta undervärderad. Här är de bästa köpen.",
            "wines": sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and 'carm' in (w.get('grape') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0))[:20],
        },
    ]

def score_label(score):
    if score >= 90: return "Exceptionellt fynd"
    if score >= 80: return "Toppköp"
    if score >= 70: return "Starkt fynd"
    if score >= 60: return "Bra köp"
    return "Okej värde"

def render_wine_row(w, rank, sortable=False):
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
    drop_pct = w.get('price_vs_launch_pct', 0) or 0
    data_attrs = f' data-score="{score}" data-price="{price}" data-drop="{drop_pct}"' if sortable else ''

    return f'''<li style="padding:16px 0;border-bottom:1px solid #e6ddd0"{data_attrs}>
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
  <div style="margin-top:6px;display:flex;gap:12px;align-items:baseline;flex-wrap:wrap">
    <span style="font-size:20px;font-weight:700;font-family:Georgia,serif">{price} kr</span>
    {f'<span style="font-size:12px;font-weight:600;color:#c0392b;background:#c0392b10;padding:2px 8px;border-radius:6px">-{drop_pct}%</span>' if drop_pct > 0 else ''}
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
        'druva': ['basta-malbec', 'basta-merlot', 'basta-cabernet-sauvignon', 'basta-pinot-noir', 'basta-syrah-shiraz', 'basta-riesling', 'basta-tempranillo', 'basta-sangiovese', 'basta-chardonnay', 'basta-sauvignon-blanc', 'basta-zinfandel', 'basta-grenache', 'basta-carmenere'],
        'land': ['basta-italienska-vin', 'basta-franska-vin', 'basta-spanska-vin', 'basta-chilenska-vin', 'basta-sydafrikanska-vin', 'basta-australiska-vin', 'basta-portugisiska-vin', 'basta-argentinska-vin'],
        'region': ['basta-vin-fran-bordeaux', 'basta-vin-fran-toscana', 'basta-vin-fran-rioja', 'basta-vin-fran-bourgogne', 'basta-vin-fran-rhonedalen', 'basta-vin-fran-champagne', 'basta-vin-fran-languedoc', 'basta-vin-fran-alsace', 'basta-kaliforniska-vin'],
        'typ': ['basta-roda-vin', 'basta-vita-vin', 'basta-bubbel', 'basta-rose', 'basta-cava', 'mousserande-vin-under-150-kr'],
        'pris': ['vin-under-80-kr', 'vin-under-90-kr', 'vin-under-100-kr', 'vin-under-150-kr', 'vin-under-200-kr', 'basta-premium-vin', 'prissankt-vin', 'ekologiskt-vin-under-150-kr'],
        'mat': ['vin-till-grillat', 'vin-till-fisk', 'vin-till-pasta', 'vin-till-ost', 'vin-till-dejt', 'vin-till-julmat', 'vin-till-kyckling', 'vin-till-brunch', 'vin-till-lax', 'vin-till-tacos', 'vin-till-pizza', 'vin-till-sushi', 'vin-till-lamm', 'vin-till-picknick', 'vin-till-svamp', 'vin-till-nyar'],
        'smak': ['fylliga-roda-vin', 'latta-vita-vin', 'fruktiga-roda-vin', 'torra-vita-vin'],
        'sasong': ['sommarvin', 'hostvin'],
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
    is_deals = page['slug'] == 'prissankt-vin'
    wines_html = '\n'.join(render_wine_row(w, i+1, sortable=is_deals) for i, w in enumerate(page['wines']))
    num_wines = len(page['wines'])

    # Quick-nav bar — top 4 related pages shown near the top of the page
    quick_links = get_cross_links(page['slug'], all_pages or [])
    quick_nav_html = ""
    if quick_links:
        links = ' '.join(
            f'<a href="/{p["slug"]}/" style="display:inline-block;padding:6px 12px;border-radius:8px;background:#fefcf8;border:1px solid #e6ddd0;color:#8b2332;font-size:12px;text-decoration:none;white-space:nowrap">{p["title"].split(" — ")[0].split(" på ")[0]}</a>'
            for p in quick_links
        )
        quick_nav_html = f'''
    <nav style="margin-bottom:20px;display:flex;flex-wrap:wrap;gap:6px" aria-label="Relaterade listor">
      {links}
    </nav>'''

    # Cross-links — organized by category showing all related pages
    category_labels = {
        'typ': 'Vintyper',
        'druva': 'Druvor',
        'land': 'Länder',
        'region': 'Regioner',
        'pris': 'Pris',
        'mat': 'Tillfällen & mat',
        'smak': 'Smakprofiler',
    }
    category_slugs = {
        'druva': ['basta-malbec', 'basta-merlot', 'basta-cabernet-sauvignon', 'basta-pinot-noir', 'basta-syrah-shiraz', 'basta-riesling', 'basta-tempranillo', 'basta-sangiovese', 'basta-chardonnay', 'basta-sauvignon-blanc', 'basta-zinfandel', 'basta-grenache', 'basta-carmenere'],
        'land': ['basta-italienska-vin', 'basta-franska-vin', 'basta-spanska-vin', 'basta-chilenska-vin', 'basta-sydafrikanska-vin', 'basta-australiska-vin', 'basta-portugisiska-vin', 'basta-argentinska-vin'],
        'region': ['basta-vin-fran-bordeaux', 'basta-vin-fran-toscana', 'basta-vin-fran-rioja', 'basta-vin-fran-bourgogne', 'basta-vin-fran-rhonedalen', 'basta-vin-fran-champagne', 'basta-vin-fran-languedoc', 'basta-vin-fran-alsace', 'basta-kaliforniska-vin'],
        'typ': ['basta-roda-vin', 'basta-vita-vin', 'basta-bubbel', 'basta-rose', 'basta-cava', 'mousserande-vin-under-150-kr'],
        'pris': ['vin-under-80-kr', 'vin-under-90-kr', 'vin-under-100-kr', 'vin-under-150-kr', 'vin-under-200-kr', 'basta-premium-vin', 'prissankt-vin', 'ekologiskt-vin-under-150-kr'],
        'mat': ['vin-till-grillat', 'vin-till-fisk', 'vin-till-pasta', 'vin-till-ost', 'vin-till-dejt', 'vin-till-julmat', 'vin-till-kyckling', 'vin-till-brunch', 'vin-till-lax', 'vin-till-tacos', 'vin-till-pizza', 'vin-till-sushi', 'vin-till-lamm', 'vin-till-picknick', 'vin-till-svamp', 'vin-till-nyar'],
        'smak': ['fylliga-roda-vin', 'latta-vita-vin', 'fruktiga-roda-vin', 'torra-vita-vin'],
        'sasong': ['sommarvin', 'hostvin'],
    }
    slug_to_page = {p['slug']: p for p in (all_pages or []) if p.get('wines')}
    cross_sections = []
    for cat_key in ['typ', 'druva', 'land', 'region', 'pris', 'mat', 'smak']:
        cat_pages = [slug_to_page[s] for s in category_slugs[cat_key] if s in slug_to_page and s != page['slug']]
        if not cat_pages:
            continue
        links = ' · '.join(
            f'<a href="/{p["slug"]}/" style="color:#8b2332;text-decoration:none">{p["title"].split(" — ")[0].split(" på ")[0]}</a>'
            for p in cat_pages
        )
        cross_sections.append(f'<div style="margin-bottom:10px"><div style="font-size:11px;font-weight:600;color:#7a7060;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">{category_labels[cat_key]}</div><div style="font-size:13px;color:#4a4238;line-height:2">{links}</div></div>')
    cross_html = ""
    if cross_sections:
        cross_html = f'''
    <div style="margin-top:24px;padding:16px 20px;border-radius:14px;background:#fefcf8;border:1px solid #e6ddd0">
      <div style="font-size:14px;font-weight:600;color:#1e1710;margin-bottom:12px">Fler vinlistor</div>
      {''.join(cross_sections)}
    </div>'''

    # Intro2 — extended intro paragraph
    intro2_html = ""
    if page.get('intro2'):
        intro2_html = f'<p style="margin:0 0 16px;font-size:15px;color:#4a4238;line-height:1.6">{page["intro2"]}</p>'

    # Guide section — buying advice
    guide_html = ""
    if page.get('guide'):
        guide = page['guide']
        points_html = ''.join(f'<li style="margin-bottom:8px">{p}</li>' for p in guide['points'])
        guide_html = f'''
    <div style="margin-top:32px">
      <h2 style="margin:0 0 12px;font-size:20px;font-family:'Instrument Serif',Georgia,serif;font-weight:400;color:#1e1710">{guide['title']}</h2>
      <ul style="margin:0;padding:0 0 0 20px;font-size:14px;color:#4a4238;line-height:1.7">
        {points_html}
      </ul>
    </div>'''

    # Visible FAQ section
    faq_visible_html = ""
    if page.get('faq_visible'):
        faq_entries = ''.join(
            f'<dt style="font-weight:600;font-size:15px;color:#1e1710;margin-bottom:4px">{q}</dt>'
            f'<dd style="margin:0 0 16px;font-size:14px;color:#4a4238;line-height:1.6">{a}</dd>'
            for q, a in page['faq_visible']
        )
        faq_visible_html = f'''
    <div style="margin-top:32px">
      <h2 style="margin:0 0 12px;font-size:20px;font-family:'Instrument Serif',Georgia,serif;font-weight:400;color:#1e1710">Vanliga frågor</h2>
      <dl style="margin:0">
        {faq_entries}
      </dl>
    </div>'''

    # Today's date for article meta
    today_iso = datetime.now().strftime('%Y-%m-%d')

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

    # Recipe schema for food pairing pages
    recipe_ld = ""
    if page['slug'].startswith('vin-till-'):
        dish_name = page['h1'].split(' — ')[0].replace('Bästa vinerna till ', '').replace('Bästa vinerna till en ', '')
        top3 = page['wines'][:3]
        wine_names = ', '.join(w.get('name','') for w in top3)
        recipe_data = {
            "@context": "https://schema.org",
            "@type": "Recipe",
            "name": f"Vinmatchning: {dish_name}",
            "description": page['meta'],
            "author": {"@type": "Person", "name": "Gabriel Linton"},
            "datePublished": today_iso,
            "recipeCategory": "Vinmatchning",
            "recipeCuisine": "Swedish",
            "recipeIngredient": [f"{w.get('name','')} ({w.get('price',0)} kr)" for w in top3],
            "recipeInstructions": [
                {"@type": "HowToStep", "text": f"Välj ett av våra toppval: {wine_names}"},
                {"@type": "HowToStep", "text": f"Servera vid rätt temperatur: vitt vin 8-10°C, rött vin 16-18°C"},
                {"@type": "HowToStep", "text": "Öppna vinet 15-30 minuter innan servering för bästa smak"},
            ],
        }
        recipe_ld = f'\n  <script type="application/ld+json">{json.dumps(recipe_data, ensure_ascii=False)}</script>'

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
  <meta property="article:modified_time" content="{today_iso}">

  <script type="application/ld+json">{ld_json}</script>
  <script type="application/ld+json">{breadcrumb_ld}</script>
  <script type="application/ld+json">{faq_ld}</script>{recipe_ld}

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
      {intro2_html}
      <p style="margin:0;font-size:12px;color:#7a7060">
        Uppdaterad {DATE_STR} · Baserat på {len(all_wines)} viner · <a href="https://smakfynd.se" style="color:#8b2332">Utforska alla viner →</a>
      </p>
    </header>

    {quick_nav_html}

    {"" if not is_deals else '''<div style="margin-bottom:16px;display:flex;gap:6px;flex-wrap:wrap">
      <span style="font-size:11px;color:#7a7060;align-self:center;margin-right:4px">Sortera:</span>
      <button onclick="sortWines('drop')" class="sf-sort" data-key="drop" style="padding:6px 12px;border-radius:8px;border:1px solid #8b2332;background:#8b2332;color:#fff;font-size:12px;cursor:pointer;font-family:inherit">Sänkning</button>
      <button onclick="sortWines('price')" class="sf-sort" data-key="price" style="padding:6px 12px;border-radius:8px;border:1px solid #e6ddd0;background:#fefcf8;color:#4a4238;font-size:12px;cursor:pointer;font-family:inherit">Pris</button>
      <button onclick="sortWines('score')" class="sf-sort" data-key="score" style="padding:6px 12px;border-radius:8px;border:1px solid #e6ddd0;background:#fefcf8;color:#4a4238;font-size:12px;cursor:pointer;font-family:inherit">Poäng</button>
    </div>
    <script>
    function sortWines(key) {
      var ol = document.querySelector("ol");
      var items = Array.from(ol.querySelectorAll("li[data-score]"));
      items.sort(function(a, b) {
        var av = parseFloat(a.dataset[key]) || 0;
        var bv = parseFloat(b.dataset[key]) || 0;
        return key === "price" ? av - bv : bv - av;
      });
      items.forEach(function(li, i) {
        var s = li.querySelector("strong");
        if (s) s.textContent = (i + 1) + ". " + s.textContent.replace(/^\\d+\\.\\s*/, "");
        ol.appendChild(li);
      });
      document.querySelectorAll(".sf-sort").forEach(function(btn) {
        var active = btn.dataset.key === key;
        btn.style.background = active ? "#8b2332" : "#fefcf8";
        btn.style.color = active ? "#fff" : "#4a4238";
        btn.style.borderColor = active ? "#8b2332" : "#e6ddd0";
      });
    }
    </script>'''}

    <ol style="list-style:none;padding:0;margin:0" id="wine-list">
{wines_html}
    </ol>

    {cross_html}

    {guide_html}

    {faq_visible_html}

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
