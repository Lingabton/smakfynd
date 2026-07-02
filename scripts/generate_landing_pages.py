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

def dedup_wines(wines, max_per_producer=2):
    """Remove duplicates and limit per producer. Hide large formats when standard exists."""
    # Step 1: find which wines have standard (750ml) bottles
    standard = set()
    for w in wines:
        if (w.get('vol') or 750) <= 750:
            standard.add((w.get('name','').lower(), (w.get('sub','') or '').lower()))

    # Step 2: dedup + producer limit + format filter
    seen = set()
    producer_count = {}
    result = []
    for w in wines:
        # Skip large format if standard exists
        if (w.get('vol') or 750) > 750:
            key = (w.get('name','').lower(), (w.get('sub','') or '').lower())
            if key in standard:
                continue

        # Skip exact duplicates (same name + sub + price)
        dup_key = (w.get('name',''), w.get('sub',''), w.get('price',0))
        if dup_key in seen:
            continue
        seen.add(dup_key)

        # Limit per producer (name = producer proxy)
        producer = w.get('name','').strip()
        producer_count[producer] = producer_count.get(producer, 0) + 1
        if producer_count[producer] > max_per_producer:
            continue

        result.append(w)
    return result

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
            "intro2": "Rött vin från Systembolaget finns i hundratals varianter — från lätta Pinot Noir till tunga Cabernet Sauvignon. Vår ranking väger samman expertbetyg, crowd-recensioner och pris för att hitta de röda viner som verkligen levererar kvalitet per krona. Listan är populär även bland norrmän som letar gode kjøp på Systembolaget — priserna är ofta lägre än på Vinmonopolet.",
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
            "wines": dedup_wines(sorted([w for w in fast if w.get('type') == 'Rött' and w.get('pkg') == 'Flaska'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-vita-vin",
            "title": f"Bästa vita vinet {YEAR} — Topp 20 vita viner på Systembolaget",
            "meta": f"Bästa vita vinet {YEAR}? Topp 20 vita viner på Systembolaget — Chardonnay, Sauvignon Blanc, Riesling och fler. Rankade efter smak och prisvärde. {DATE_STR}.",
            "h1": f"Bästa vita vinerna på Systembolaget — {DATE_STR}",
            "intro": "Fräscha, fruktiga eller fyllda — här är de vita vinerna som ger mest smak för pengarna.",
            "intro2": "Vita viner på Systembolaget spänner från mineraldrivna Chablis till fylliga, fatlagrade Chardonnay. Vi rankar utifrån Vivino-betyg, expertrecensioner och pris per kvalitet så att du enkelt hittar det bästa vita vinet oavsett budget. Många norrmän hittar sina gode kjøp bland vita viner här — Systembolaget har ofta bredare urval och lägre priser än Vinmonopolet.",
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
            "wines": dedup_wines(sorted([w for w in fast if w.get('type') == 'Vitt' and w.get('pkg') == 'Flaska'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-bubbel",
            "title": f"Bästa bubbel {YEAR} — Topp mousserande, champagne & cava",
            "meta": f"Bästa bubblet {YEAR}? Topp 20 mousserande viner på Systembolaget — cava, prosecco, crémant och champagne. Rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa bubbel {YEAR} — mousserande, champagne & cava",
            "intro": f"Bästa bubblet {YEAR}? Cava, prosecco, crémant eller champagne — här är de mousserande vinerna som ger mest fest för pengarna just nu.",
            "intro2": f"Letar du efter bästa mousserande {YEAR}? Bubbel från Systembolaget inkluderar allt från spansk Cava under hundralappen till prestigefylld champagne. Crémant från Alsace och Loire är ofta de bästa fynden — champagnekvalitet till en bråkdel av priset. Listan uppdateras varje vecka. Også populær blant nordmenn som leter etter beste viner og gode kjøp til fest.",
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
            "wines": dedup_wines(sorted([w for w in fast if w.get('type') == 'Mousserande' and w.get('pkg') == 'Flaska'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-rose",
            "title": f"Årets rosévin {YEAR} — Topp 20 bra rosévin på Systembolaget",
            "meta": f"Årets bästa rosévin {YEAR} — rankade av 50 000+ omdömen. Se topp 20 från Provence, Chile & Österrike. Uppdaterad {DATE_STR}.",
            "h1": f"Bästa rosévin {YEAR} — årets topp 20 på Systembolaget",
            "intro": f"Bästa rosévinet just nu? Årets rosevin {YEAR} rankat efter kvalitet per krona — vi jämför alla roséer på Systembolaget så du slipper gissa.",
            "intro2": f"Rosé är Sveriges snabbast växande vinkategori. Provence dominerar topplistorna, men spanska Garnacha-roséer och italienska alternativ ger ofta bättre prisvärdhet. Oavsett om du söker bästa rosévinet {YEAR}, årets rosevin eller bara ett bra tips — här hittar du det. Listan uppdateras varje vecka.",
            "guide": {
                "title": "Hur väljer man rosé?",
                "points": [
                    "Provence-rosé är benchmark — ljus, torr och elegant. Ofta det bästa valet, men kan vara överprisat.",
                    "Spanska och italienska roséer ger ofta champagnekvalitet till budgetpris. Kolla Garnacha och Primitivo.",
                    "Servera rosé vid 6–8°C — kallare än vitt vin. Perfekt till sommarmat, sallader och grillad fisk.",
                    "Drick rosé ungt — köp årets årgång. Rosé är inte vin som blir bättre med lagring.",
                ]
            },
            "faq_visible": [
                (f"Vilken rosé är bäst i test {YEAR}?", f"Vi rankar alla roséer på Systembolaget efter en kombination av crowd-betyg, expertrecensioner och prisvärde. Bästa rosé just nu hittar du högst upp på den här sidan — listan uppdateras varje vecka."),
                ("Vad är skillnaden på billig och dyr rosé?", "Dyrare Provence-roséer ger ofta mer komplexitet och elegans. Men i prisklassen under 150 kr finns det roséer från Spanien, Italien och Sydafrika som presterar lika bra i blindtester. Pris är inte alltid = kvalitet."),
            ],
            "wines": dedup_wines(sorted([w for w in fast if w.get('type') == 'Rosé' and w.get('pkg') == 'Flaska'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
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
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and (w.get('price', 999) or 999) < 100],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "vin-under-150-kr",
            "title": f"Bästa vin under 150 kr {YEAR} — Topp 20 på Systembolaget",
            "meta": f"Bästa vinerna under 150 kr {YEAR}. Sweet spot för kvalitetsvin — Rioja, Toscana, Rhône till bra pris. Rankade efter smak och prisvärdhet. {DATE_STR}.",
            "h1": f"Bästa vinerna under 150 kr {YEAR}",
            "intro": f"Under 150 kr hittar du Systembolagets bästa fynd. Rioja, Chianti, Rhône — kvalitetsvin utan premiumprislapp. Här är topp 20 just nu.",
            "intro2": "Prisklassen 100–150 kr är sweet spot för vin på Systembolaget. Du får tillgång till komplexa viner från etablerade regioner utan att betala premiumpriser. Vi jämför alla viner i denna prisklass baserat på expertbetyg, crowd-recensioner och prisvärdhet.",
            "guide": {
                "title": "Varför 150 kr är sweet spot",
                "points": [
                    "Under 100 kr dominerar Nya världen. Mellan 100–150 kr öppnas europeiska kvalitetsregioner som Rioja, Toscana och Rhône.",
                    "Spansk Rioja Crianza i detta prissegment ger ofta samma kvalitet som dubbelt så dyr Bordeaux.",
                    "Italienska Montepulciano d'Abruzzo och Nero d'Avola är konsekvent underskattade i denna klass.",
                    "Ekologiska viner under 150 kr har blivit riktigt konkurrenskraftiga — missa inte dem.",
                ]
            },
            "faq_visible": [
                ("Vilken typ av vin ska man välja under 150 kr?", "I denna prisklass fungerar alla typer bra. Röda viner från Spanien och Italien ger ofta mest komplexitet per krona. Vita viner som Sauvignon Blanc och Riesling är säkra kort. Mousserande (Cava, Crémant) ger champagnekänsla till en bråkdel av priset."),
                ("Är dyrare vin alltid bättre?", "Nej. Vår data visar att sambandet mellan pris och kvalitet är starkast under 200 kr. Över det betalar du ofta för varumärke, region eller sällsynthet — inte nödvändigtvis bättre smak."),
            ],
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and (w.get('price', 999) or 999) < 150],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
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
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('taste_body') or 0) >= 7
                           and any(k in (f or '').lower() for k in ['kött', 'grillat', 'nöt', 'lamm', 'biff', 'vilt', 'fläsk']
                                   for f in (w.get('food_pairings') or []))],
                          key=lambda x: -(x.get('smakfynd_score', 0) + (3 if (x.get('taste_body') or 0) >= 9 else 0))))[:20],
        },
        {
            "slug": "vin-till-fisk",
            "title": f"Bästa vinerna till fisk & skaldjur {YEAR} — Systembolaget",
            "meta": f"Vin till fisk och skaldjur? Här är de bästa vita och roséer på Systembolaget. {DATE_STR}.",
            "h1": f"Bästa vinerna till fisk & skaldjur — {DATE_STR}",
            "intro": "Fisk och skaldjur vill ha fräscht, syra och ibland lite mineralitet. Här är de bästa matchningarna.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and any('fisk' in (f or '').lower() or 'skaldjur' in (f or '').lower()
                                   for f in (w.get('food_pairings') or []))],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "vin-till-pasta",
            "title": f"Bästa vinerna till pasta {YEAR} — Systembolaget",
            "meta": f"Vin till pasta? Topp 20 bästa valen på Systembolaget — oavsett sås. {DATE_STR}.",
            "h1": f"Bästa vinerna till pasta — {DATE_STR}",
            "intro": "Pasta och vin hör ihop. Oavsett om det är carbonara, bolognese eller pesto — här hittar du rätt vin.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('type') == 'Rött'
                           and (w.get('taste_body') or 0) >= 5 and (w.get('taste_body') or 0) <= 9
                           and (w.get('price', 0) or 0) <= 200],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-malbec",
            "title": f"Bästa Malbec på Systembolaget {YEAR} — Topp 10 från 78 kr",
            "meta": f"Bästa Malbec Systembolaget {YEAR} — vi har rankat alla. Argentina, Frankrike & Australien. Uppdaterad {DATE_STR}.",
            "h1": f"Bästa Malbec på Systembolaget — {DATE_STR}",
            "intro": "Malbec från Argentina är en favorit bland svenska vindrickare. Här är de som ger mest smak för pengarna.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Rött'
                           and 'malbec' in (w.get('grape', '') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-cabernet-sauvignon",
            "title": f"Bästa Cabernet Sauvignon på Systembolaget {YEAR}",
            "meta": f"Topp Cabernet Sauvignon-viner. Rankade efter kvalitet per krona med crowd-betyg och expertrecensioner. {DATE_STR}.",
            "h1": f"Bästa Cabernet Sauvignon på Systembolaget — {DATE_STR}",
            "intro": "Cabernet Sauvignon — världens mest kända rödvinsdruva. Här är de bästa köpen på Systembolaget.",
            "intro2": "Cabernet Sauvignon från Systembolaget finns i alla prisklasser — från chilenska budgetviner till prestigefyllda Bordeaux-blandningar. Druvan ger strukturerade viner med svarta vinbär, ceder och ofta fatlagring. Perfekt till kötträtter och grillat.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Rött'
                           and 'cabernet sauvignon' in (w.get('grape', '') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "ekologiskt-vin",
            "title": f"Bästa ekologiska vinerna på Systembolaget {YEAR}",
            "meta": f"Topp 20 ekologiska viner. Hållbart och prisvärt — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa ekologiska vinerna — {DATE_STR}",
            "intro": "Ekologiskt och gott behöver inte vara dyrt. Här är de bästa eko-vinerna på Systembolaget.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('organic')],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "vin-till-ost",
            "title": f"Bästa vinerna till ost {YEAR} — Systembolaget",
            "meta": f"Vin till ostbrickan? Här är de bästa matchningarna på Systembolaget. {DATE_STR}.",
            "h1": f"Bästa vinerna till ost — {DATE_STR}",
            "intro": "Ost och vin är en klassisk kombination. Här är vinerna som passar bäst — från mjuk brie till lagrad cheddar.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and any('ost' in (f or '').lower() for f in (w.get('food_pairings') or []))],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },

        # ─── Druvor ───
        {
            "slug": "basta-pinot-noir",
            "title": f"Bästa Pinot Noir på Systembolaget {YEAR}",
            "meta": f"Topp Pinot Noir-viner på Systembolaget. Bourgogne, Nya Zeeland och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Pinot Noir på Systembolaget — {DATE_STR}",
            "intro": "Pinot Noir är elegant, fruktig och mångsidig. Här är de bästa köpen — från Bourgogne till Nya Zeeland.",
            "intro2": "Pinot Noir på Systembolaget sträcker sig från eleganta Bourgogne till fruktdrivna Nya Zeeland-varianter. Druvan är känslig och svårodlad, vilket gör prisvärdhet extra viktig. Vi jämför alla Pinot Noir-viner i fast sortiment baserat på smak och pris.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Rött'
                           and 'pinot noir' in (w.get('grape', '') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-syrah-shiraz",
            "title": f"Bästa Syrah & Shiraz på Systembolaget {YEAR}",
            "meta": f"Topp Syrah- och Shiraz-viner. Kraftfulla och kryddiga — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Syrah & Shiraz på Systembolaget — {DATE_STR}",
            "intro": "Syrah (eller Shiraz) ger kraftfulla viner med peppar och mörka bär. Här är de bästa fynden.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Rött'
                           and ('syrah' in (w.get('grape', '') or '').lower() or 'shiraz' in (w.get('grape', '') or '').lower())],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-riesling",
            "title": f"Bästa Riesling {YEAR} — Topp Riesling på Systembolaget",
            "meta": f"Bästa Riesling {YEAR}? Topp Riesling-viner från Tyskland, Alsace och Australien. Från stentorrt till halvsött — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Riesling på Systembolaget — {DATE_STR}",
            "intro": "Riesling är en av världens mest mångsidiga vita druvor — från stentorrt till sött. Här är de bästa.",
            "intro2": "Riesling på Systembolaget kommer framförallt från Tyskland (Mosel, Pfalz, Rheingau) och Alsace i Frankrike. Druvan uttrycker terroir som få andra — mineralisk, syradriven och med fantastisk lagringspotential. Torr Riesling (Trocken) från Pfalz och Alsace passar utmärkt till asiatisk mat och fisk, medan halvsöt Kabinett från Mosel är perfekt som aperitif.",
            "guide": {
                "title": "Så väljer du rätt Riesling",
                "points": [
                    "Trocken = torrt, Kabinett = halvtorrt/lätt sött, Spätlese = sötare. Kolla etiketten.",
                    "Alsace-Riesling är nästan alltid torr och kraftfull — passar bäst till mat.",
                    "Tysk Riesling under 120 kr ger ofta exceptionell prisvärdhet — en av vinvärldens bästa deals.",
                    "Perfekt till asiatisk mat, fisk, skaldjur och kryddiga rätter. Rieslings syra balanserar allt.",
                ]
            },
            "faq_visible": [
                ("Är Riesling alltid sött?", "Nej! De flesta Riesling-viner på Systembolaget är torra eller halvtorra. Kolla smakprofilen — sötma 1–3 av 12 betyder torrt. Trocken på etiketten garanterar torr stil."),
                ("Vilken Riesling är bäst för nybörjare?", "Börja med en tysk Kabinett — den har lägre alkohol, mild sötma och tydlig fruktighet. Det är ett av vinvärldens mest tillgängliga viner. Vill du ha torrt, prova en Pfalz Trocken."),
            ],
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Vitt'
                           and 'riesling' in (w.get('grape', '') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-tempranillo",
            "title": f"Bästa Tempranillo på Systembolaget {YEAR}",
            "meta": f"Topp Tempranillo-viner. Rioja, Ribera del Duero och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Tempranillo på Systembolaget — {DATE_STR}",
            "intro": "Tempranillo är Spaniens stolthet — fylliga viner med vanilj och körsbär. Här är de bästa köpen.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Rött'
                           and 'tempranillo' in (w.get('grape', '') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-sangiovese",
            "title": f"Bästa Sangiovese & Chianti på Systembolaget {YEAR}",
            "meta": f"Topp Sangiovese-viner — Chianti, Brunello och mer. Rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Sangiovese på Systembolaget — {DATE_STR}",
            "intro": "Sangiovese är druvan bakom Chianti och Brunello di Montalcino. Här är de bästa italienska fynden.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Rött'
                           and 'sangiovese' in (w.get('grape', '') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-chardonnay",
            "title": f"Bästa Chardonnay på Systembolaget {YEAR}",
            "meta": f"Topp Chardonnay-viner. Bourgogne, Australien och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Chardonnay på Systembolaget — {DATE_STR}",
            "intro": "Chardonnay — från fräsch och mineralisk till fyllig och fatlagrad. Här är de bästa köpen.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Vitt'
                           and 'chardonnay' in (w.get('grape', '') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-sauvignon-blanc",
            "title": f"Bästa Sauvignon Blanc på Systembolaget {YEAR}",
            "meta": f"Topp Sauvignon Blanc-viner. Fräscha och aromatiska — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Sauvignon Blanc på Systembolaget — {DATE_STR}",
            "intro": "Sauvignon Blanc är fräsch, syrig och perfekt till sommar och fisk. Här är de bästa fynden.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Vitt'
                           and 'sauvignon blanc' in (w.get('grape', '') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-zinfandel",
            "title": f"Bästa Zinfandel på Systembolaget {YEAR}",
            "meta": f"Topp Zinfandel-viner. Kraftfulla, fruktiga och generösa — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Zinfandel på Systembolaget — {DATE_STR}",
            "intro": "Zinfandel ger generösa, fruktdrivna viner med kryddighet. Här är de bästa köpen.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Rött'
                           and 'zinfandel' in (w.get('grape', '') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
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
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'Italien'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
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
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'Frankrike'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
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
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'Spanien'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-chilenska-vin",
            "title": f"Bästa chilenska vinerna på Systembolaget {YEAR}",
            "meta": f"Topp chilenska viner. Carmenère, Cabernet och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa chilenska vinerna på Systembolaget — {DATE_STR}",
            "intro": "Chile levererar fantastisk kvalitet till låga priser. Här är de bästa chilenska fynden.",
            "intro2": "Chilenska viner dominerar budgetsegmentet på Systembolaget med druvor som Cabernet Sauvignon, Carmenère och Sauvignon Blanc. Vinregionerna sträcker sig från svala Casablanca till varma Maule. Chile är perfekt för dig som vill ha kvalitetsvin utan att betala europapremium.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'Chile'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-sydafrikanska-vin",
            "title": f"Bästa sydafrikanska vinerna på Systembolaget {YEAR}",
            "meta": f"Topp sydafrikanska viner. Pinotage, Chenin Blanc och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa sydafrikanska vinerna på Systembolaget — {DATE_STR}",
            "intro": "Sydafrika är en underskattad vinproducent med fantastisk prisvärdhet. Här är de bästa köpen.",
            "intro2": "Sydafrikanska viner på Systembolaget är ofta bland de mest prisvärda. Pinotage är landets signaturdruva, men Chenin Blanc, Shiraz och Cabernet ger också utmärkt kvalitet. Vinregionen Stellenbosch producerar Sydafrikas mest ansedda viner.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'Sydafrika'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-australiska-vin",
            "title": f"Bästa australiska vinerna på Systembolaget {YEAR}",
            "meta": f"Topp australiska viner. Shiraz, Chardonnay och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa australiska vinerna på Systembolaget — {DATE_STR}",
            "intro": "Australien gör kraftfulla, generösa viner. Här är de bästa fynden på Systembolaget.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'Australien'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-portugisiska-vin",
            "title": f"Bästa portugisiska vinerna på Systembolaget {YEAR}",
            "meta": f"Topp portugisiska viner. Douro, Alentejo och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa portugisiska vinerna på Systembolaget — {DATE_STR}",
            "intro": "Portugal är ett av Europas mest prisvärda vinländer. Här är de bästa köpen.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'Portugal'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },

        # ─── Tillfällen ───
        {
            "slug": "vin-till-dejt",
            "title": f"Bästa vinerna till en dejt {YEAR} — Systembolaget",
            "meta": f"Romantisk middag? Här är vinerna som imponerar utan att kosta skjortan. Rankade efter kvalitet. {DATE_STR}.",
            "h1": f"Bästa vinerna till en dejt — {DATE_STR}",
            "intro": "En dejt förtjänar ett vin som imponerar. Här är vinerna som ger rätt känsla — elegant, omtyckt och prisvärt.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('expert_score') or 0) >= 7 and (w.get('price', 0) or 0) >= 120 and (w.get('price', 0) or 0) <= 300],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "vin-till-julmat",
            "title": f"Bästa vinerna till julmat {YEAR} — Systembolaget",
            "meta": f"Vin till julbordet? Här är de bästa matchningarna till julskinka, Janssons och lax. {DATE_STR}.",
            "h1": f"Bästa vinerna till julmat — {DATE_STR}",
            "intro": "Julbordet har allt — skinka, lax, sill och köttbullar. Här är vinerna som funkar till hela julmenyn.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and any(k in (f or '').lower() for k in ['fläsk', 'skinka', 'kött', 'fisk', 'lamm']
                                   for f in (w.get('food_pairings') or []))
                           and (w.get('smakfynd_score', 0) or 0) >= 70],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "vin-till-kyckling",
            "title": f"Bästa vinerna till kyckling {YEAR} — Systembolaget",
            "meta": f"Vin till kyckling? Här är de bästa matchningarna på Systembolaget. {DATE_STR}.",
            "h1": f"Bästa vinerna till kyckling — {DATE_STR}",
            "intro": "Kyckling är mångsidigt — och det gäller vinvalet också. Här är de bästa alternativen.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and any('fågel' in (f or '').lower() or 'kyckling' in (f or '').lower()
                                   for f in (w.get('food_pairings') or []))],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
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
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and (w.get('price', 999) or 999) < 200],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-premium-vin",
            "title": f"Bästa premiumviner 200–500 kr på Systembolaget {YEAR}",
            "meta": f"Topp premiumviner 200-500 kr. Expertbetyg, crowd-betyg och prisjämförelse. {DATE_STR}.",
            "h1": f"Bästa premiumviner 200–500 kr — {DATE_STR}",
            "intro": "I premiumklassen hittar du viner med riktigt höga betyg. Här är de som ger bäst valuta.",
            "intro2": "Premiumviner mellan 200 och 500 kr på Systembolaget inkluderar lagade Bordeaux, Barolo, topprankade Rhône-viner och exklusiva Nya världen-producenter. Här spelar expertbetyg stor roll — skillnaden mellan bra och fantastiskt syns tydligt i denna prisklass.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('price', 0) or 0) >= 200 and (w.get('price', 0) or 0) <= 500],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "prissankt-vin",
            "title": f"Prissänkta viner på Systembolaget {YEAR}",
            "meta": f"Viner som nyligen sänkts i pris på Systembolaget. Hitta fynden innan de försvinner. {DATE_STR}.",
            "h1": f"Prissänkta viner just nu — {DATE_STR}",
            "intro": "Systembolaget skyltar inte alltid med prissänkningar. Vi håller koll åt dig — här är de bästa fynden.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('price_vs_launch_pct') or 0) > 0],
                          key=lambda x: -(x.get('price_vs_launch_pct', 0) or 0)))[:20],
        },

        # ─── Smakprofiler ───
        {
            "slug": "fylliga-roda-vin",
            "title": f"Bästa fylliga röda vinerna på Systembolaget {YEAR}",
            "meta": f"Topp 20 fylliga röda viner. Kraftfulla, smakrika och generösa — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa fylliga röda vinerna — {DATE_STR}",
            "intro": "Du gillar kraftfulla, fylliga viner? Här är de röda som ger mest smak — med hög kropp och intensitet.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('type') == 'Rött'
                           and (w.get('taste_body') or 0) >= 8],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "latta-vita-vin",
            "title": f"Bästa lätta vita vinerna på Systembolaget {YEAR}",
            "meta": f"Fräscha, lätta vita viner. Perfekta till sommar och fisk — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa lätta vita vinerna — {DATE_STR}",
            "intro": "Fräscht, lätt och syradriven? Här är de vita vinerna som fungerar perfekt som aperitif eller till lättare rätter.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('type') == 'Vitt'
                           and (w.get('taste_body') or 12) <= 5],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },

        # ─── Regioner ───
        {
            "slug": "basta-vin-fran-bordeaux",
            "title": f"Bästa Bordeaux-viner på Systembolaget {YEAR}",
            "meta": f"Topp 20 Bordeaux-viner på Systembolaget. Klassiska blandningar rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Bordeaux-viner på Systembolaget — {DATE_STR}",
            "intro": "Bordeaux är vinvärldens mest ikoniska region — hem för legendariska châteaux och tidlösa blandningar av Cabernet Sauvignon och Merlot.",
            "intro2": "Bordeaux terroir är unikt: havsnära klimat, grus- och lerjordar och sekler av vinkunskap skapar viner med struktur, elegans och lagringspotential. På Systembolaget finns allt från prisvärda Côtes de Bordeaux till exklusiva Saint-Émilion och Médoc. Vi har rankat alla Bordeaux-viner efter kvalitet per krona för att hitta de verkliga fynden.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('region') or '') == 'Bordeaux'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-vin-fran-toscana",
            "title": f"Bästa Toscana-viner på Systembolaget {YEAR}",
            "meta": f"Topp 20 Toscana-viner på Systembolaget. Chianti, Brunello och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Toscana-viner på Systembolaget — {DATE_STR}",
            "intro": "Toscana är hem för Italiens mest älskade viner — från vardaglig Chianti till magnifik Brunello di Montalcino.",
            "intro2": "Toscana levererar viner i alla prisklasser. Chianti Classico DOCG ger pålitlig kvalitet med Sangiovese-druvan i centrum, medan Brunello di Montalcino och Vino Nobile di Montepulciano erbjuder djupare komplexitet. Super Toscans blandar internationella druvor med italiensk finesse. Vi har rankat alla Toscana-viner efter kvalitet per krona.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('region') or '') == 'Toscana'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-vin-fran-rioja",
            "title": f"Bästa Rioja-viner på Systembolaget {YEAR}",
            "meta": f"Topp 20 Rioja-viner på Systembolaget. Crianza, Reserva och Gran Reserva — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Rioja-viner på Systembolaget — {DATE_STR}",
            "intro": "Rioja är Spaniens mest klassiska vinregion — känd för eleganta Tempranillo-viner med vanilj, körsbär och kryddiga toner.",
            "intro2": "Rioja-viner delas in efter lagringstid: Joven (ung), Crianza (1 år i fat), Reserva (3 år totalt) och Gran Reserva (5 år totalt). Tempranillo dominerar, ofta med inslag av Garnacha och Graciano. Crianza ger ofta bäst prisvärdhet, medan Reserva och Gran Reserva erbjuder mer komplexitet och mognad. Vi rankar alla Rioja-viner efter smak och prisvärdhet.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('region') or '') == 'Rioja'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-vin-fran-bourgogne",
            "title": f"Bästa Bourgogne-viner på Systembolaget {YEAR}",
            "meta": f"Topp 20 Bourgogne-viner på Systembolaget. Pinot Noir och Chardonnay — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Bourgogne-viner på Systembolaget — {DATE_STR}",
            "intro": "Bourgogne är Pinot Noirs och Chardonnays hemland — eleganta viner med oöverträffad terroirkänsla.",
            "intro2": "Bourgogne producerar världens mest eftertraktade Pinot Noir (röda) och Chardonnay (vita). Regionen är känd för sitt terroirfokus där varje vingård ger unika karaktärsdrag. Från fräsch Chablis till fyllig Meursault bland vita, och från elegant Beaune till kraftfull Gevrey-Chambertin bland röda — Bourgogne har enorm bredd. Priserna varierar kraftigt, men det finns fynd att göra.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('region') or '') == 'Bourgogne'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-vin-fran-rhonedalen",
            "title": f"Bästa Rhône-viner på Systembolaget {YEAR}",
            "meta": f"Topp 20 Rhône-viner på Systembolaget. Syrah, Grenache och GSM-blandningar — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Rhône-viner på Systembolaget — {DATE_STR}",
            "intro": "Rhônedalen erbjuder kraftfulla, kryddiga viner — från eleganta norra Rhône-Syraher till generösa södra Rhône-blandningar.",
            "intro2": "Rhônedalen delas i norra och södra. Norra Rhône ger koncentrerade Syrah-viner från Côte-Rôtie, Hermitage och Cornas. Södra Rhône domineras av GSM-blandningar (Grenache, Syrah, Mourvèdre) med Châteauneuf-du-Pape som kronjuvel. Côtes du Rhône och Côtes du Rhône Villages erbjuder fantastisk prisvärdhet och är ofta bland Systembolagets bästa köp.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('region') or '') == 'Rhonedalen'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },

        # ─── Fler tillfällen ───
        {
            "slug": "vin-till-brunch",
            "title": f"Bästa vinerna till brunch {YEAR}",
            "meta": f"Vin till brunch? Här är de bästa mousserande, vita och rosévinerna på Systembolaget. {DATE_STR}.",
            "h1": f"Bästa vinerna till brunch — {DATE_STR}",
            "intro": "Brunch och bubbel hör ihop, men även lätta vita och roséer lyfter en söndagsbrunch. Här är de bästa alternativen.",
            "intro2": "Till brunch vill du ha viner som är fräscha, lätta och festliga. Mousserande viner som Cava, Prosecco och Crémant är givna val — de funkar till allt från äggbenedict till frukt. Lätta vita viner och torra roséer kompletterar perfekt om du vill ha något stillsamt. Vi har valt ut de bästa brunchvinerna baserat på smak och prisvärdhet.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('type') == 'Mousserande'
                                or (w.get('type') in ('Vitt', 'Rosé') and (w.get('taste_body') or 12) <= 6))],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "vin-till-lax",
            "title": f"Vin till lax {YEAR} — bästa vinet till ugnsbakad, grillad & gravad lax",
            "meta": f"Vin till lax? Riesling till ugnsbakad, Chardonnay till grillad, Sauvignon Blanc till gravad. Se topp 20 — uppdaterad {DATE_STR}.",
            "h1": f"Bästa vinerna till lax — {DATE_STR}",
            "intro": "Lax är en av Sveriges mest älskade råvaror — och rätt vin gör måltiden komplett. Men olika tillagning kräver olika vin.",
            "intro2_heading": "Vin till lax — tillagning avgör",
            "intro2": "Till lax fungerar vita och roséer bäst. Men tillagningsmetoden är minst lika viktig som fisken: ugnsbakad lax med smör vill ha fylligare vin än gravad lax med hovmästarsås. Nedan guidar vi dig rätt oavsett hur du tillagar din lax.",
            "intro3": "Vi har filtrerat Systembolagets sortiment efter fiskpairing och valt de bästa vita och rosévinerna. Alla viner i listan nedan fungerar till lax generellt — men läs våra tips för den perfekta matchningen.",
            "guide": {
                "title": "Vin till olika laxrätter",
                "points": [
                    "Lax i ugn: Fyllig Chardonnay eller Viognier. Smöret och fettet i ugnsbakad lax kräver ett vin med lite kropp. Fatlagrad Chardonnay från Bourgogne eller Australien är klassikern.",
                    "Grillad lax: Rosé från Provence eller en torr Riesling. Grillsmakerna tål mer struktur — även en lätt Pinot Noir kan fungera här.",
                    "Gravad lax: Fräsch Sauvignon Blanc eller torr Riesling. Syran i vinet balanserar sötman i hovmästarsåsen. Undvik fyllda, fatlagrade viner.",
                    "Ugnsbakad lax med citron och örter: Albariño eller Grüner Veltliner — mineraliska viner som speglar citrusen i rätten.",
                ]
            },
            "faq_visible": [
                ("Vilket vin passar bäst till lax i ugn?", "Ugnsbakad lax med smör och dill vill ha ett vin med lite fylligare kropp — Chardonnay (gärna fatlagrad), Viognier eller en fyllig Côtes du Rhône blanc. Smöret i rätten kräver ett vin som matchar i intensitet."),
                ("Kan man dricka rött vin till lax?", "Generellt nej — rött vins tanniner krockar med fiskfettet och ger metallisk bismak. Undantaget är grillad lax, där en lätt Pinot Noir utan mycket tannin kan fungera bra."),
                ("Vin till gravad lax med hovmästarsås?", "Gravad lax med hovmästarsås har sötma och syra som kräver ett fräscht, syradrivet vin. Torr Riesling från Alsace eller tysk Kabinett är perfekta val. Sauvignon Blanc från Loire fungerar också utmärkt."),
                ("Vilket vin till laxpasta eller laxsoppa?", "Krämiga laxrätter som pasta och soppa vill ha Chardonnay eller Pinot Grigio med lite kropp. Syran skär igenom grädden medan vinets fruktighet kompletterar laxen."),
                ("Ska man välja vitt eller rosé till lax?", "Vitt vin är det säkraste valet. Rosé fungerar utmärkt till grillad lax och lättare laxsallader — välj en torr Provence-rosé. Till gravad lax och lax i ugn är vitt nästan alltid bättre."),
            ],
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') in ('Vitt', 'Rosé')
                           and any('fisk' in (f or '').lower() for f in (w.get('food_pairings') or []))],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "vin-till-tacos",
            "title": f"Bästa vinerna till tacos {YEAR}",
            "meta": f"Vin till tacos? Här är de bästa prisvärda vinerna som passar till tacofredag. {DATE_STR}.",
            "h1": f"Bästa vinerna till tacos — {DATE_STR}",
            "intro": "Tacofredag förtjänar ett gott vin. Fruktiga röda med medelfyllig kropp eller en fräsch rosé funkar perfekt.",
            "intro2": "Till tacos vill du ha avslappnade, fruktiga viner som inte tar över smaken. Medelkroppade röda viner som Malbec, Tempranillo och Garnacha passar utmärkt — de har frukt och krydda som kompletterar tacokryddorna. Rosé är ett annat toppval, särskilt till kyckling- och fisktacos. Vi har valt prisvärda viner under 150 kr som gör fredagstacosen ännu godare.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('price', 999) or 999) <= 150
                           and ((w.get('type') == 'Rött' and (w.get('taste_body') or 0) >= 4 and (w.get('taste_body') or 0) <= 8)
                                or w.get('type') == 'Rosé')],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },

        # ─── Fler regioner ───
        {
            "slug": "basta-vin-fran-champagne",
            "title": f"Bästa Champagne på Systembolaget {YEAR}",
            "meta": f"Topp 20 äkta Champagne-viner på Systembolaget. Rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Champagne på Systembolaget — {DATE_STR}",
            "intro": "Äkta Champagne — inte bara bubbel. Här är de mousserande vinerna från Champagne som verkligen levererar.",
            "intro2": "Bara mousserande vin från Champagne-regionen i Frankrike får kallas Champagne. Till skillnad från Cava, Prosecco och Crémant genomgår äkta Champagne en andra jäsning på flaskan som ger den karaktäristiska finheten, de små bubblorna och den komplexa smaken av brioche och rostad nöt. Priserna är högre, men kvalitetsskillnaden mot andra mousserande viner märks tydligt. Vi har rankat alla äkta Champagne-viner i Systembolagets fasta sortiment efter kvalitet per krona.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('region') or '') == 'Champagne' and w.get('type') == 'Mousserande'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-vin-fran-languedoc",
            "title": f"Bästa Languedoc-viner på Systembolaget {YEAR}",
            "meta": f"Topp 20 Languedoc-viner på Systembolaget. Prisvärda viner från södra Frankrike. {DATE_STR}.",
            "h1": f"Bästa Languedoc-viner på Systembolaget — {DATE_STR}",
            "intro": "Languedoc är södra Frankrikes vinparadis — fantastisk kvalitet till priser som Bordeaux bara kan drömma om.",
            "intro2": "Languedoc-Roussillon är Frankrikes största vinregion och en guldgruva för prisvärda viner. Här odlas Syrah, Grenache, Carignan och Mourvèdre i medelhavsklimat som ger mogna, generösa viner med kryddiga och fruktiga toner. Regionen har genomgått en kvalitetsrevolution de senaste decennierna — dagens Languedoc-viner håller ofta samma nivå som betydligt dyrare Rhône- och Bordeaux-viner. Ett av Systembolagets bäst bevarade vinfynd.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and 'languedoc' in (w.get('region') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-vin-fran-alsace",
            "title": f"Bästa Alsace-viner på Systembolaget {YEAR}",
            "meta": f"Topp 20 Alsace-viner på Systembolaget. Riesling, Gewürztraminer och mer. {DATE_STR}.",
            "h1": f"Bästa Alsace-viner på Systembolaget — {DATE_STR}",
            "intro": "Alsace är Frankrikes vita vinmecka — hem för aromatiska Riesling och Gewürztraminer av världsklass.",
            "intro2": "Alsace i nordöstra Frankrike producerar några av världens bästa vita viner. Riesling ger mineraliska, torra viner med fantastisk lagringspotential, medan Gewürztraminer bjuder på exotiska aromer av lychee, ros och kryddor. Pinot Gris levererar fylliga, runda viner och Crémant d'Alsace är ett av Frankrikes bästa mousserande fynd. Alsace-viner säljs på druva (inte region som i övriga Frankrike), vilket gör det lätt att välja rätt.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('region') or '') == 'Alsace'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-kaliforniska-vin",
            "title": f"Bästa amerikanska & kaliforniska vinerna {YEAR} — Systembolaget",
            "meta": f"Bästa kaliforniska viner {YEAR}? Napa Valley Cabernet, Sonoma Pinot Noir och Oregon. Topp 20 amerikanska viner rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa kaliforniska & amerikanska vinerna — {DATE_STR}",
            "intro": "Kalifornien producerar USA:s mest ikoniska viner — från kraftfulla Napa Cabernets till eleganta Sonoma Pinot Noirs.",
            "intro2": "Kaliforniska viner på Systembolaget representerar det bästa från USA:s största vinstat. Napa Valley är känt för sina kraftfulla, koncentrerade Cabernet Sauvignon-viner, medan Sonoma erbjuder mer eleganta Pinot Noir och Chardonnay. Central Coast har vuxit fram som en spännande region med Rhône-druvor och unika terroir. Kalifornien levererar mogna, fruktdrivna viner med generös smak — perfekt för dig som gillar det nya världen-stilen med rik frukt och ofta fatlagring.",
            "guide": {
                "title": "Hur väljer man kaliforniskt vin?",
                "points": [
                    "Napa Valley Cabernet Sauvignon är Kaliforniens flaggskepp — kraftfullt, koncentrerat och perfekt till grillat kött.",
                    "Sonoma ger elegantare Pinot Noir och Chardonnay till något lägre priser än Napa.",
                    "Zinfandel är Kaliforniens signaturdruva — generös, kryddig och unik för regionen.",
                    "Under 200 kr hittar du bäst kvalitet bland Central Coast-viner och mindre kända producenter.",
                ]
            },
            "faq_visible": [
                ("Är kaliforniskt vin dyrt?", "Det varierar enormt. Napa Valley-viner kostar ofta 200–500 kr på Systembolaget, men kaliforniska viner från Lodi, Central Coast och Sonoma finns redan från 100 kr med bra kvalitet."),
                ("Vad skiljer kaliforniskt vin från europeiskt?", "Kalifornien ger generellt mognare, fruktigare viner med mer generös stil. Europeiska viner tenderar att vara stramare och mer jordiga. Ingen stil är bättre — det handlar om smak."),
            ],
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'USA'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
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
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and (w.get('price', 999) or 999) < 80],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
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
            "wines": dedup_wines(sorted([w for w in fast if w.get('type') == 'Rött' and w.get('pkg') == 'Flaska'
                           and (w.get('taste_fruit') or 0) >= 8],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
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
            "wines": dedup_wines(sorted([w for w in fast if w.get('organic') and w.get('pkg') == 'Flaska'
                           and (w.get('price', 999) or 999) < 150],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
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
            "wines": dedup_wines(sorted([w for w in fast if w.get('type') == 'Vitt' and w.get('pkg') == 'Flaska'
                           and (w.get('taste_sweet') is not None and (w.get('taste_sweet') or 0) <= 3)],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },

        # ─── Nya sidor: seasonal + long-tail ───
        {
            "slug": "vin-under-90-kr",
            "title": f"Bästa vinerna under 90 kr på Systembolaget {YEAR}",
            "meta": f"Topp 20 bästa viner under 90 kr. Prisvärt och gott — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa vinerna under 90 kr — {DATE_STR}",
            "intro": "Du behöver inte spendera mycket för att dricka bra. Här är de bästa vinerna under 90 kr — vardagsfavoriter med hög poäng.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and (w.get('price', 999) or 999) < 90],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "sommarvin",
            "title": f"Bästa sommarvinerna {YEAR} — fräscha och kylda",
            "meta": f"Bästa sommarviner på Systembolaget {YEAR}. Fräscha vita, rosé och bubbel för grillkvällar och picknick. {DATE_STR}.",
            "h1": f"Bästa sommarvinerna {YEAR}",
            "intro": "Sommar = fräscht, kylt och enkelt. Här är de vita, rosé och mousserande vinerna som passar perfekt till grillkvällar, picknick och sena sommarkvällar.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') in ('Vitt', 'Rosé', 'Mousserande')
                           and (w.get('price', 999) or 999) <= 200],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "hostvin",
            "title": f"Bästa höstvinerna {YEAR} — varma och fylliga",
            "meta": f"Bästa höstviner: fylliga röda till mörka kvällar, vilt och gratänger. {DATE_STR}.",
            "h1": f"Bästa höstvinerna {YEAR}",
            "intro": "Hösten kallar på varma, fylliga viner. Här är de röda vinerna som passar perfekt till viltstuvning, svampsås och mörka novemberkvällar.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('type') == 'Rött'
                           and (w.get('taste_body') or 0) >= 7],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "vin-till-pizza",
            "title": f"Bästa vinerna till pizza {YEAR}",
            "meta": f"Vilket vin passar till pizza? Topp 20 bästa vinerna till pizza — från Margherita till pepperoni. {DATE_STR}.",
            "h1": f"Bästa vinerna till pizza — {DATE_STR}",
            "intro": "Pizza och vin är en klassisk kombo. Italienska röda och friska vita — här är de bästa vinerna till pizzakvällen.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('country') == 'Italien' or w.get('grape', '').lower() in ('sangiovese', 'primitivo', 'montepulciano'))
                           and w.get('type') in ('Rött', 'Vitt')],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "vin-till-sushi",
            "title": f"Bästa vinerna till sushi {YEAR}",
            "meta": f"Bästa viner till sushi och japansk mat. Fräscha vita, torr rosé och lätt bubbel. {DATE_STR}.",
            "h1": f"Bästa vinerna till sushi — {DATE_STR}",
            "intro": "Sushi kräver vin med fräschör och precision. Fräscha vita, torra roséer och mousserande — här är de bästa vinerna till sushi.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') in ('Vitt', 'Rosé', 'Mousserande')
                           and (w.get('taste_sweet') is None or (w.get('taste_sweet') or 0) <= 4)],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "vin-till-lamm",
            "title": f"Bästa vinerna till lamm {YEAR}",
            "meta": f"Bästa viner till lamm, grillat lamm och lammkotletter. Kraftiga röda med kryddig karaktär. {DATE_STR}.",
            "h1": f"Bästa vinerna till lamm — {DATE_STR}",
            "intro": "Lamm vill ha vin med struktur och kryddighet. Syrah, Tempranillo och Cabernet Sauvignon — här är de bästa vinerna till lammrätter.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('type') == 'Rött'
                           and (w.get('taste_body') or 0) >= 7
                           and any(g in (w.get('grape') or '').lower() for g in ['syrah', 'shiraz', 'tempranillo', 'cabernet', 'malbec', 'grenache', 'mourvèdre'])],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "vin-till-picknick",
            "title": f"Bästa vinerna till picknick {YEAR}",
            "meta": f"Bästa picknick-viner — lätta, fräscha och enkla att ta med. {DATE_STR}.",
            "h1": f"Bästa vinerna till picknick — {DATE_STR}",
            "intro": "Picknick = lättsamt, fräscht och gärna kylt. Här är de bästa vinerna att ta med i korgen — från roséer till lätta bubbel.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') in ('Rosé', 'Vitt', 'Mousserande')
                           and (w.get('price', 999) or 999) <= 150],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-merlot",
            "title": f"Bästa Merlot-vinerna på Systembolaget {YEAR}",
            "meta": f"Topp 20 bästa Merlot på Systembolaget. Mjuka, fruktiga och eleganta — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Merlot-vinerna — {DATE_STR}",
            "intro": "Merlot är den mjuka, tillgängliga favoriten. Fruktigt, rundt och vänligt — perfekt för den som vill ha ett rött vin utan för mycket tanniner.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Rött'
                           and 'merlot' in (w.get('grape') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-grenache",
            "title": f"Bästa Grenache/Garnacha-vinerna {YEAR}",
            "meta": f"Topp 20 Grenache/Garnacha från Systembolaget. Kryddigt, fruktigt, generöst. {DATE_STR}.",
            "h1": f"Bästa Grenache-vinerna — {DATE_STR}",
            "intro": "Grenache (eller Garnacha) ger generösa, kryddiga röda viner med bärtoner och värme. Populär i Rhônedalen, Spanien och Australien.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Rött'
                           and any(g in (w.get('grape') or '').lower() for g in ['grenache', 'garnacha'])],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-argentinska-vin",
            "title": f"Bästa argentinska vinerna på Systembolaget {YEAR}",
            "meta": f"Topp 20 argentinska viner. Malbec, Torrontés och mer — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa argentinska vinerna — {DATE_STR}",
            "intro": "Argentina = Malbec. Men det finns mer — Torrontés, Cabernet Franc och spännande blandningar. Här är de bästa argentinska vinerna just nu.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('country') == 'Argentina'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-cava",
            "title": f"Cava bäst i test {YEAR} — Topp cava på Systembolaget från 89 kr",
            "meta": f"Cava bäst i test {YEAR} — vi har rankat alla på Systembolaget. Brut, Reserva & ekologiska. Uppdaterad {DATE_STR}.",
            "h1": f"Bästa Cava {YEAR} — topp cava på Systembolaget",
            "intro": f"Bästa cavan {YEAR}? Cava är Spaniens svar på champagne — fräscht, torrt och festligt till en bråkdel av priset. Här är de cava-viner som ger mest bubbel för pengarna.",
            "intro2_heading": f"Cava bäst i test {YEAR}",
            "intro2": f"Cava görs med méthode traditionnelle (samma flaskjäsning som champagne) i Penedès-regionen i Katalonien. Druvorna Macabeo, Xarel·lo och Parellada ger fräscha, citrusdrivna bubblor. De bästa cavorna konkurrerar med champagne till en tredjedel av priset. Reserva och Gran Reserva har lagrats längre och ger mer komplexitet.",
            "intro3": f"I vårt test {YEAR} har vi rankat alla cava-viner på Systembolaget efter kvalitet per krona. Totalt finns cava från 89 till 149 kr.",
            "guide": {
                "title": "Så väljer du rätt Cava",
                "points": [
                    "Cava Brut eller Brut Nature ger torrast och mest matanpassad smak.",
                    "Reserva (minst 15 månader lagring) ger mer komplexitet — ofta värd de extra kronorna.",
                    "Cava under 100 kr kan vara riktigt bra — det är här prisvärdheten lyser starkast.",
                    "Perfekt aperitif, men funkar också utmärkt till tapas, skaldjur och friterad mat.",
                ]
            },
            "faq_visible": [
                ("Vad är skillnaden mellan Cava och Prosecco?", "Cava jäser i flaskan (som champagne) medan Prosecco jäser i tank. Cava ger finare bubblor, mer komplexitet och torrare stil. Prosecco är lättare och fruktigare. Cava ger generellt mer champagnekänsla per krona."),
                ("Kan man dricka Cava till mat?", "Absolut — Cava med hög syra fungerar utmärkt till skaldjur, sushi, tapas och till och med friterad mat. Den höga syran och de fina bubblorna rengör gommen mellan tuggorna."),
                (f"Vilken cava är bäst i test {YEAR}?", f"I vårt test {YEAR} rankar vi alla cava-viner på Systembolaget efter crowd-betyg, expertrecensioner och prisvärde. Se toppen av listan ovan för årets vinnare."),
                ("Vad betyder Brut Nature på en cava?", "Brut Nature är den torraste stilen — inget tillsatt socker alls efter jäsningen. Det ger ren, skarp smak som framhäver druvorna. Perfekt för dig som gillar torrt bubbel och vill undvika extra socker."),
                ("Är cava billigare än champagne?", "Ja, betydligt. På Systembolaget kostar bra cava 89–149 kr medan champagne börjar runt 250 kr. Produktionsmetoden är identisk (méthode traditionnelle) men druvorna och regionen skiljer sig — Penedès i Katalonien istället för Champagne i Frankrike."),
            ],
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Mousserande' and w.get('country') == 'Spanien'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "mousserande-vin-under-150-kr",
            "title": f"Bästa mousserande viner under 150 kr {YEAR}",
            "meta": f"Bubbel under 150 kr — festligt utan att ruinera dig. Rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa mousserande vinerna under 150 kr — {DATE_STR}",
            "intro": "Du behöver inte betala champagne-pris för riktigt bra bubbel. Här är de bästa mousserande vinerna under 150 kr — perfekta för fredagsmys, fest eller bara för att det är onsdag.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Mousserande'
                           and (w.get('price', 999) or 999) < 150],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "vin-till-svamp",
            "title": f"Vin till svamp {YEAR} — svamprisotto, kantareller & tryffel",
            "meta": f"Vin till svamp och svamprisotto — Pinot Noir, Nebbiolo och fyllig Chardonnay. Jordiga röda och eleganta vita. Topp 20 på Systembolaget.",
            "h1": f"Bästa vinerna till svamprätter — {DATE_STR}",
            "intro": "Svamp vill ha vin med jordiga toner och elegans. Pinot Noir, Nebbiolo och fyllda Chardonnay — här är de bästa vinerna till svamprisotto och kantareller.",
            "intro2_heading": "Vin och svamp — en klassisk kombination",
            "intro2": "Svamp är unikt i matlagning: den har umami-djup, jordiga toner och en textur som påminner om kött. Det gör svamprätter till fantastiska vinpartners — men det kräver rätt val. Tanninstarka viner krockar ofta med svampens mjuka textur, medan jordiga och eleganta viner förstärker smaken.",
            "guide": {
                "title": "Vin till olika svamprätter",
                "points": [
                    "Svamprisotto: Pinot Noir från Bourgogne eller Nebbiolo. Vinets jordighet matchar risottots krämighet och svampens umami.",
                    "Stekta kantareller: Chardonnay med fatlagring. Smörstekta kantareller kräver ett vin med fyllig kropp och smörig karaktär.",
                    "Svamppasta med gräddsås: Medelkroppad Barbera eller Sangiovese. Syran skär igenom grädden medan vinets fruktkärna balanserar svampen.",
                    "Tryffel: Barolo eller äldre Pinot Noir. Tryffelns intensiva jordighet kräver ett vin med komplexitet och mognad.",
                ]
            },
            "faq_visible": [
                ("Vilket vin till svamprisotto?", "Pinot Noir från Bourgogne är klassikern — jordiga toner och silkig textur matchar risottots krämighet perfekt. Nebbiolo från Piemonte är ett annat utmärkt val. Välj viner med medelkropp och subtil frukt."),
                ("Rött eller vitt vin till svamp?", "Båda fungerar, men på olika sätt. Rött vin (Pinot Noir, Nebbiolo) matchar svampens jordighet. Vitt vin (fatlagrad Chardonnay) kompletterar smörstekta svampar. Undvik tanninstarka röda — de krockar med svampens mjuka textur."),
                ("Vin till kantareller?", "Kantareller har en delikat, nötig smak. Fatlagrad Chardonnay eller en lätt Pinot Noir är perfekta val. Undvik viner som är för kraftfulla — de dränker kantarellernas subtila smak."),
            ],
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and any(g in (w.get('grape') or '').lower() for g in ['pinot noir', 'nebbiolo', 'barbera', 'chardonnay', 'barolo'])
                           and (w.get('taste_body') or 0) >= 5],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "vin-till-nyar",
            "title": f"Bästa vinerna till nyår {YEAR + 1}",
            "meta": f"Bästa bubbel och vin till nyårsfirandet. Champagne, Cava, Prosecco och mer. {DATE_STR}.",
            "h1": f"Bästa vinerna till nyår",
            "intro": "Nyår kräver bubbel! Här är de bästa mousserande vinerna för att fira in det nya året — från prisvärd Cava till exklusiv Champagne.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('type') == 'Mousserande'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-carmenere",
            "title": f"Bästa Carménère på Systembolaget {YEAR}",
            "meta": f"Topp Carménère — Chiles underskattade druva. Kryddigt och unikt. {DATE_STR}.",
            "h1": f"Bästa Carménère-vinerna — {DATE_STR}",
            "intro": "Carménère — Chiles signaturdruva med kryddiga, gröna och mörka bärtoner. Unik och ofta undervärderad. Här är de bästa köpen.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Rött'
                           and 'carm' in (w.get('grape') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        # ─── Nya SEO-sidor (maj 2026) ───

        # Champagne (bredare än bara under 300 kr)
        {
            "slug": "basta-champagne",
            "title": f"Bästa champagnen {YEAR} — Topp 20 på Systembolaget",
            "meta": f"Bästa champagnen {YEAR}? Från Brut under 300 kr till prestige-cuvéer. Topp 20 champagne rankade efter smak och pris. {DATE_STR}.",
            "h1": f"Bästa champagnen {YEAR} — rankad topplista",
            "intro": f"Bästa champagnen på Systembolaget just nu? Vi har rankat alla champagner — från prisvärda under 300 kr till prestigefyllda hus som Krug och Pol Roger.",
            "intro2": f"Champagne är den ultimata festdrycken, men kvaliteten varierar enormt. Grower-champagne (små producenter) ger ofta bättre prisvärdhet än de stora husen. Blanc de Blancs (100% Chardonnay) är elegant, Blanc de Noirs (Pinot Noir) mer kraftfull. Vi jämför alla champagner på Systembolaget baserat på expert- och crowd-betyg.",
            "guide": {
                "title": "Så väljer du rätt champagne",
                "points": [
                    "Under 300 kr: Beaumont des Crayères och liknande kooperativ ger mest kvalitet.",
                    "300–500 kr: Grower-champagne slår ofta de stora husen. Kolla Palmer & Co och liknande.",
                    "Blanc de Blancs = elegant. Blanc de Noirs = fylligare. Rosé = festligast.",
                    "Servera vid 8°C. Använd inte flöjtglas — ett vanligt vinglas ger bättre arom.",
                ]
            },
            "faq_visible": [
                ("Vilken champagne är bäst för pengarna?", "Grower-champagne och kooperativ som Beaumont des Crayères ger ofta bäst prisvärdhet. De stora husen (Moët, Veuve Clicquot) betalar du delvis för varumärket."),
                ("Vad är skillnaden på Brut och Extra Brut?", "Brut har upp till 12 g/l restsocker, Extra Brut under 6 g/l. Extra Brut är torrare och visar mer av vinets karaktär. De flesta föredrar Brut till festliga tillfällen."),
            ],
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Mousserande' and w.get('region') == 'Champagne'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },

        # Röda boxviner
        {
            "slug": "basta-roda-boxvin",
            "title": f"Bästa röda boxvin {YEAR} — Topp bag-in-box på Systembolaget",
            "meta": f"Bästa röda boxvinet {YEAR}? Topp röda BiB-viner rankade efter kvalitet. Från Tempranillo till Malbec. {DATE_STR}.",
            "h1": f"Bästa röda boxvin {YEAR}",
            "intro": f"Bästa röda boxvinet just nu? Röda bag-in-box har blivit mycket bättre — här är de som faktiskt levererar kvalitet per krona.",
            "intro2": "Sverige är världens största marknad för boxvin, och kvaliteten har exploderat. Röda boxviner från Spanien (Tempranillo, Garnacha) och Sydamerika (Malbec) dominerar topplistorna. Vi rankar alla röda BiB-viner efter smak och pris.",
            "wines": dedup_wines(sorted([w for w in all_wines if w.get('pkg') == 'BiB'
                           and w.get('type') == 'Rött' and w.get('smakfynd_score', 0) > 0
                           and w.get('assortment') in ('Fast sortiment', 'Tillfälligt sortiment')],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },

        # Vita boxviner
        {
            "slug": "basta-vita-boxvin",
            "title": f"Bästa vita boxen {YEAR} — Topp vita boxviner på Systembolaget",
            "meta": f"Bästa vita boxen {YEAR}? Vi har rankat alla vita bag-in-box på Systembolaget. Chardonnay, Sauvignon Blanc och fler — topp vita boxviner just nu. {DATE_STR}.",
            "h1": f"Bästa vita boxen {YEAR} — topp vita boxviner",
            "intro": f"Bästa vita boxvinet just nu? Fräscha, fruktiga och prisvärda — här är de vita bag-in-box som faktiskt imponerar.",
            "intro2": "Vita boxviner har gjort enorma kvalitetssprång. Från fräscha Sauvignon Blanc till runda Chardonnay — rätt val ger dig utmärkt vin till vardags. Vi rankar alla vita BiB-viner på Systembolaget efter kvalitet per krona.",
            "guide": {
                "title": "Så väljer du rätt vit box",
                "points": [
                    "Sauvignon Blanc-boxar ger fräsch, citrusdriven smak — perfekt till fisk och sallad.",
                    "Chardonnay-boxar varierar enormt: kolla om den är fatlagrad (fylligare) eller stålad (fräschare).",
                    "Sydafrikanska och chilenska vita boxar ger ofta bäst prisvärdhet per liter.",
                    "Öppnad box håller 4–6 veckor tack vare vakuumförpackningen — betydligt längre än flaska.",
                ]
            },
            "faq_visible": [
                ("Hur länge håller öppnad vit boxvin?", "En öppnad vit box håller 4–6 veckor i kylskåp. Vakuumförpackningen skyddar vinet från oxidering, till skillnad från en öppnad flaska som håller max en vecka."),
                ("Är vit boxvin sämre än flaskor?", "Inte nödvändigtvis. Samma vin kan finnas i både box och flaska. Boxen ger ofta bättre literpris och håller längre öppnad. Kvaliteten har förbättrats enormt de senaste åren."),
            ],
            "wines": dedup_wines(sorted([w for w in all_wines if w.get('pkg') == 'BiB'
                           and w.get('type') == 'Vitt' and w.get('smakfynd_score', 0) > 0
                           and w.get('assortment') in ('Fast sortiment', 'Tillfälligt sortiment')],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },

        # Alkoholfritt vin (informationssida — data saknas i scoring)
        {
            "slug": "alkoholfritt-vin",
            "title": f"Bästa alkoholfria vin {YEAR} — Guide till Systembolaget",
            "meta": f"Bästa alkoholfritt vin {YEAR}? Guide till de godaste alkoholfria vinerna på Systembolaget. Rött, vitt, rosé och bubbel. {DATE_STR}.",
            "h1": f"Bästa alkoholfria vin {YEAR}",
            "intro": "Alkoholfritt vin har blivit riktigt bra. Här är vår guide till de bästa alkoholfria vinerna på Systembolaget — rött, vitt, rosé och bubbel.",
            "intro2": f"Marknaden för alkoholfritt vin växer explosionsartat. Kvaliteten har förbättrats enormt de senaste åren tack vare bättre avalkoholiseringstekniker. Leitz (Tyskland) och Torres (Spanien) är pionjärer. Vi har ännu inte integrerat alkoholfria viner i vår poängsättning, men guidar dig till de bästa valen baserat på expertrecensioner.",
            "guide": {
                "title": "Så väljer du alkoholfritt vin",
                "points": [
                    "Leitz Eins Zwei Zero Riesling är benchmark — fräsch, fruktig och närmast riktigt vin i smak.",
                    "Torres Natureo (Muscat) och Oddbird (Frankrike) är andra toppval.",
                    "Alkoholfritt bubbel funkar ofta bättre än alkoholfritt rött — kolsyran ger kropp.",
                    "Servera kallt — alkoholfritt vin tappar smak snabbare vid rumstemperatur.",
                ]
            },
            "faq_visible": [
                ("Smakar alkoholfritt vin bra?", "De bästa alkoholfria vinerna (som Leitz Riesling) är genuint goda. Men förväntningarna bör vara realistiska — det smakar annorlunda. Bubbel och vita viner lyckas generellt bättre alkoholfritt än röda."),
                ("Är alkoholfritt vin nyttigt?", "Alkoholfritt vin har ungefär hälften av kalorierna jämfört med vanligt vin och innehåller fortfarande antioxidanter. Det är ett bra alternativ om du vill njuta av vinupplevelsen utan alkohol."),
            ],
            "wines": [],
        },

        # Naturvin
        {
            "slug": "naturvin",
            "title": f"Bästa naturvin {YEAR} — Guide till Systembolaget",
            "meta": f"Bästa naturvinet {YEAR}? Guide till naturviner på Systembolaget — vad det är, hur det smakar och vilka du bör prova. {DATE_STR}.",
            "h1": f"Bästa naturvin {YEAR} — guide & rekommendationer",
            "intro": "Naturvin är vin med minimal påverkan — inga tillsatser, ekologiska druvor, vilda jäster. Här är allt du behöver veta om naturvin på Systembolaget.",
            "intro2": "Naturvin har gått från nisch till mainstream. Systembolaget har en egen naturvinskategori med allt från orangea viner till pétillant naturel (pet-nat). Stilen varierar enormt — från fräscha och fruktiga till funky och jordiga. Vi guidar dig genom utbudet.",
            "guide": {
                "title": "Naturvin — vad är det?",
                "points": [
                    "Ekologiska eller biodynamiska druvor, ofta handplockade.",
                    "Vild jäst (inga tillsatta jästkulturer), minimal svavel.",
                    "Ofta ofiltrerat — kan vara grumligt, det är normalt.",
                    "Orangea viner = vita druvor som macererats med skal, ger färg och tanniner.",
                ]
            },
            "faq_visible": [
                ("Smakar naturvin annorlunda?", "Ja, ofta. Naturvin kan vara mer oförutsägbart — fruktdrivet, jordigt eller funkigt. Börja med ett pet-nat (naturligt mousserande) eller en lättare röd som Gamay om du är nybörjare."),
                ("Är allt ekologiskt vin naturvin?", "Nej. Ekologiskt vin reglerar odlingen men tillåter tillsatser i vinmakningen. Naturvin minimerar ingrepp i hela processen — från druva till flaska."),
            ],
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('organic')
                           and any(g in (w.get('grape') or '').lower() for g in ['gamay', 'cabernet franc', 'chenin', 'grenache', 'cinsault', 'carignan'])],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },

        # Vin för nybörjare
        {
            "slug": "vin-for-nyborjare",
            "title": f"Vin för nybörjare {YEAR} — Var börjar man? Systembolaget-guide",
            "meta": f"Ny på vin? Enkel guide utan pretention. Vilka viner du bör börja med, hur du väljer och vad begreppen betyder. {DATE_STR}.",
            "h1": f"Vin för nybörjare — var börjar man?",
            "intro": "Vet du inte så mycket om vin? Perfekt. Den här guiden hjälper dig välja rätt utan att du behöver kunna ett enda vinord.",
            "intro2": f"Vinvärlden kan kännas överväldigande med hundratals druvor, regioner och uttryck. Men i verkligheten behöver du bara veta tre saker: vad du gillar att äta, hur mycket du vill spendera, och om du föredrar lätt eller fylligt. Vi matchar dig med rätt vin — enkelt och utan pretention.",
            "guide": {
                "title": "Tre steg till rätt vin",
                "points": [
                    "Steg 1: Börja med lättare viner. Rött = Pinot Noir. Vitt = Sauvignon Blanc. Bubbel = Cava.",
                    "Steg 2: Prova dig fram i prisklassen 100–150 kr — det är sweet spot för kvalitet.",
                    "Steg 3: Använd Smakfynds AI-matchare — beskriv vad du ska äta och få personligt vinförslag.",
                    "Bonus: Ekologiskt vin är inte dyrare men ofta mer genomtänkt — bra val för nybörjare.",
                ]
            },
            "faq_visible": [
                ("Jag gillar inte vin — vad ska jag prova?", "Börja med ett sött eller halvtorrt vin — Moscato d'Asti (bubbligt, lätt, fruktigt) eller en Riesling med viss sötma. Många som 'inte gillar vin' har bara provat torra, sträviga röda."),
                ("Vad betyder torrt vin?", "Torrt = inte sött. De flesta röda viner och många vita är torra. Det har inget med hur de känns i munnen att göra — ett torrt vin kan vara fruktigt och lättdrucket."),
                ("Måste jag kunna mycket om vin för att välja rätt?", "Nej. Smakfynd-poängen sammanfattar expertbetyg och prisvärde i en enda siffra. Välj det med högst poäng i din prisklass — klart."),
            ],
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('price', 999) or 999) <= 150
                           and w.get('smakfynd_score', 0) >= 80],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },

        # ─── Presenter ───
        {
            "slug": "vin-present",
            "title": f"Ge vin i present {YEAR} — Bästa vinpresenterna på Systembolaget",
            "meta": f"Ska du ge vin i present? Här är de bästa vinpresenterna per prisklass — från under 150 kr till lyxiga 500+ kr. {DATE_STR}.",
            "h1": f"Vin i present — bästa valen per prisklass {YEAR}",
            "intro": "Vin är en av de mest uppskattade presenterna. Men vilket vin väljer man? Vi har plockat ut de bästa vinpresenterna i tre prisklasser.",
            "intro2": "En bra vinpresent ska vara något mottagaren inte köper själv — lite finare, lite mer spännande. Undvik de allra billigaste vinerna och sikta på 150+ kr för att imponera. Ekologiskt vin är ett plus. Vi har valt viner med höga betyg från både experter och vindrickare.",
            "guide": {
                "title": "Så väljer du vin som present",
                "points": [
                    "Under 200 kr: Imponerande vardagsvin — Barolo, Brunello eller fin Champagne-crémant.",
                    "200–400 kr: Riktiga kvalitetsviner — Châteauneuf-du-Pape, Amarone, grower-champagne.",
                    "400+ kr: Lyxpresent — Barolo, Brunello di Montalcino, fin Burgundy eller champagne.",
                    "Tips: Välj vin med snygg etikett — presentationen är halva upplevelsen.",
                ]
            },
            "faq_visible": [
                ("Hur mycket ska man spendera på vin i present?", "150–300 kr ger en uppskattad present. Under 100 kr kan kännas billigt, och över 500 kr behöver du bara om du vet att mottagaren är vinintresserad."),
                ("Rött eller vitt i present?", "Rött är säkrast om du inte vet mottagarens preferenser. En fyllig Rioja, Barolo eller Bordeaux är alltid uppskattat. Bubbel fungerar också universellt."),
            ],
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('price', 0) or 0) >= 150 and (w.get('price', 0) or 0) <= 500
                           and w.get('smakfynd_score', 0) >= 80],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },

        # ─── Situationsbaserade (kompletterande) ───
        {
            "slug": "vin-till-fredagsmys",
            "title": f"Bästa vinet till fredagsmys {YEAR} — Systembolaget",
            "meta": f"Fredagsmys med vin? Här är de bästa vinerna för en avslappnad fredagskväll — prisvärda och lättdruckna. {DATE_STR}.",
            "h1": f"Bästa vinet till fredagsmys — {DATE_STR}",
            "intro": "Fredagsmysets vin ska vara lättdrucket, okomplicerat och prisvärt. Här är våra favoriter för soffhänget.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('price', 0) or 0) <= 150
                           and w.get('smakfynd_score', 0) >= 75
                           and (w.get('taste_body') or 6) <= 8],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "vin-till-svarforaldrar",
            "title": f"Bästa vinet när svärföräldrarna kommer {YEAR}",
            "meta": f"Ska svärföräldrarna på middag? Välj vin som imponerar utan att vara pretentiöst. Här är de säkra valen. {DATE_STR}.",
            "h1": f"Bästa vinet till middagen med svärföräldrarna",
            "intro": "Ett vin som visar att du har bra smak — utan att det ser ut som du anstränger dig för mycket. Klassiker som aldrig svikar.",
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('price', 0) or 0) >= 150 and (w.get('price', 0) or 0) <= 350
                           and w.get('smakfynd_score', 0) >= 80],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },

        # ─── Norska besökare ───
        {
            "slug": "basta-vin-for-norrman",
            "title": f"Bästa vinköpen på Systembolaget för norrmän {YEAR}",
            "meta": f"Norsk i Sverige? Här är de bästa vinerna på Systembolaget {YEAR}. Billigare och bättre urval än Vinmonopolet. Rankade efter kvalitet per krona.",
            "h1": f"Bästa vinköpen på Systembolaget — för norska besökare",
            "intro": "Svenska Systembolaget har ofta lägre priser och bredare sortiment än Vinmonopolet. Här är vinerna som ger mest valuta, särskilt utvalda för dig som handlar på Systembolaget under Sverigebesöket.",
            "intro2": "Priserna på Systembolaget ligger i genomsnitt 20-40% lägre än Vinmonopolet i samma kvalitetsklass. Dessutom har Systembolaget ett bredare fast sortiment. Vi har rankat alla viner efter kvalitet i förhållande till priset. Passa på att fylla bilen med dessa fynd.",
            "guide": {
                "title": "Tips för norrmän som handlar på Systembolaget",
                "points": [
                    "Röda viner från Chile och Argentina ger extremt bra prisvärdhet på Systembolaget, ofta 30-50% billigare än samma viner i Norge.",
                    "Bag-in-box (lådvin) är betydligt billigare i Sverige. Ta med några lådor hem.",
                    "Systembolaget har öppet till 19:00 vardagar (20:00 i vissa butiker) och till 15:00 på lördagar. Stängt söndagar.",
                    "Ta med legitimation. Åldersgräns 20 år för att handla på Systembolaget.",
                ]
            },
            "faq_visible": [
                ("Hur mycket billigare är Systembolaget jämfört med Vinmonopolet?", "I genomsnitt 20-40% billigare, beroende på vinkategori. Röda viner och lådvin har störst prisskillnad. Champagne och premium-viner kan vara 100-300 kr billigare per flaska."),
                ("Hur mycket vin får man ta med till Norge?", "Kvoten för skattefri införsel är begränsad. Kontrollera aktuella regler på toll.no innan du åker. Du kan ta med mer men betalar avgift."),
            ],
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('smakfynd_score', 0) >= 75],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },

        {
            "slug": "gode-kjop-pa-systembolaget",
            "title": f"Gode kjøp på Systembolaget {YEAR} — for nordmenn",
            "meta": f"Gode vinkjøp på Systembolaget {YEAR}. Billigere og bedre utvalg enn Vinmonopolet. Rangert etter kvalitet per krone.",
            "h1": f"Gode kjøp på Systembolaget — for nordmenn",
            "intro": "Svenske Systembolaget har ofte lavere priser og bredere sortiment enn Vinmonopolet. Her er vinene som gir mest valuta, spesielt utvalgt for deg som handler på Systembolaget under Sverigeturen.",
            "intro2": "Prisene på Systembolaget ligger i gjennomsnitt 20-40% lavere enn Vinmonopolet i samme kvalitetsklasse. I tillegg har Systembolaget et bredere fast sortiment. Vi har rangert alle viner etter kvalitet i forhold til prisen. Pass på å fylle bilen med disse funnene.",
            "guide": {
                "title": "Tips for nordmenn som handler på Systembolaget",
                "points": [
                    "Røde viner fra Chile og Argentina gir ekstremt god prisverdi på Systembolaget, ofte 30-50% billigere enn samme viner i Norge.",
                    "Bag-in-box (pappvin) er betydelig billigere i Sverige. Ta med noen bokser hjem.",
                    "Systembolaget har åpent til 19:00 hverdager (20:00 i noen butikker) og til 15:00 på lørdager. Stengt søndager.",
                    "Ta med legitimasjon. Aldersgrense 20 år for å handle på Systembolaget.",
                ]
            },
            "faq_visible": [
                ("Hvor mye billigere er Systembolaget enn Vinmonopolet?", "I gjennomsnitt 20-40% billigere, avhengig av vinkategori. Røde viner og pappvin har størst prisforskjell. Champagne og premium-viner kan være 100-300 kr billigere per flaske."),
                ("Hvor mye vin kan man ta med til Norge?", "Kvoten for avgiftsfri innførsel er begrenset. Sjekk gjeldende regler på toll.no før du reiser. Du kan ta med mer, men betaler avgift."),
            ],
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska' and w.get('smakfynd_score', 0) >= 75],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },

        # ─── Rosé-kluster (breakout-kategori) ───
        {
            "slug": "basta-rose-under-100-kr",
            "title": f"Bästa rosé under 100 kr {YEAR} — Systembolaget",
            "meta": f"Bästa rosévin under 100 kr på Systembolaget {YEAR}. Fräscha, prisvärda roséer rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa rosé under 100 kr — {DATE_STR}",
            "intro": f"Du behöver inte betala 150 kr för bra rosé. Här är de rosévinerna under hundralappen som faktiskt levererar — fräscha, torra och perfekta till vardagen.",
            "intro2": "De billigaste roséerna på Systembolaget är ofta överraskande bra. Spanien och Sydafrika producerar prisvärda roséer med ren frukt och bra syra. Vi har filtrerat på pris och rankat efter crowd-betyg, expertrecensioner och prisvärde — inte bara lägst pris.",
            "guide": {
                "title": "Rosé under 100 kr — vad ska man tänka på?",
                "points": [
                    "Spanska roséer från Navarra och Rioja ger ofta bäst prisvärdhet under 100 kr.",
                    "Sydafrikanska roséer av Pinotage eller Cinsault är ofta fräscha och fruktigare.",
                    "Undvik rosé som ser för mörk ut i denna prisklass — ljusare färg signalerar oftare torr, elegant stil.",
                    "Kyl ner ordentligt — 6°C är inte för kallt för billig rosé. Det gömmer eventuella svagheter.",
                ]
            },
            "faq_visible": [
                ("Finns det bra rosé under 100 kr?", f"Ja. Flera roséer under hundralappen får över 75 av 100 i Smakfynd-poäng, vilket innebär att de slår betydligt dyrare alternativ i blind provning. De bästa kommer ofta från Spanien och Sydafrika."),
                ("Vad skiljer billig rosé från dyr?", "Främst producent och region. Provence-rosé kostar mer pga varumärke och efterfrågan, inte nödvändigtvis kvalitet. Spanska roséer görs med samma metoder men har lägre marknadspris."),
            ],
            "wines": dedup_wines(sorted([w for w in fast if w.get('type') == 'Rosé' and w.get('pkg') == 'Flaska'
                           and (w.get('price', 999) or 999) < 100],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-provence-rose",
            "title": f"Bästa Provence-rosé på Systembolaget {YEAR}",
            "meta": f"Bästa Provence-rosé {YEAR}. Topp roséer från Provence, Frankrike — ljusa, torra och eleganta. Rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Provence-rosé — {DATE_STR}",
            "intro": "Provence sätter standarden för rosé — ljus, torr, elegant. Men inte alla Provence-roséer är lika bra, och prisskillnaderna är stora. Här är de som faktiskt är värda pengarna.",
            "intro2": "Provence i södra Frankrike producerar världens mest eftertraktade roséer. Druvorna Grenache, Cinsault och Mourvèdre ger den karaktäristiska ljusa färgen och den torra, mineraliska smaken. Men kvaliteten varierar — och priset speglar inte alltid vad som finns i flaskan. Vi rankar efter faktisk kvalitet, inte etikettens status.",
            "guide": {
                "title": "Guide till Provence-rosé",
                "points": [
                    "Appellation spelar roll: Côtes de Provence är störst, Bandol är mest prestigefull, Cassis mest mineralisk.",
                    "Ljusare färg = oftast torrare. De bästa Provence-roséerna har en nästan genomskinlig laxrosa nyans.",
                    "Årgång spelar stor roll — köp senaste eller näst senaste årgången. Rosé är inte gjort för lagring.",
                    "Servera vid 6-8°C. Använd gärna en ishink — rosé värms snabbt i solen.",
                ]
            },
            "faq_visible": [
                ("Är Provence-rosé värt det högre priset?", "Ibland. De bästa Provence-roséerna har en elegans och mineralitet som är svår att matcha. Men under 130 kr hittar du spanska och italienska roséer som kommer mycket nära. Över 150 kr börjar Provence-kvaliteten verkligen skilja sig."),
                ("Vilka druvor används i Provence-rosé?", "Grenache, Cinsault, Mourvèdre och Syrah är de vanligaste. Blandningen varierar — mer Grenache ger frukt, mer Mourvèdre ger struktur, mer Cinsault ger lätthet."),
            ],
            "wines": dedup_wines(sorted([w for w in fast if w.get('type') == 'Rosé' and w.get('pkg') == 'Flaska'
                           and ('provence' in (w.get('region') or '').lower() or 'frankrike' == w.get('country','').lower())],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "rose-till-grillat",
            "title": f"Bästa rosé till grillat {YEAR} — Systembolaget",
            "meta": f"Vilken rosé passar till grillat? Topp 20 roséer till BBQ, grillad kyckling och sommarmat. {DATE_STR}.",
            "h1": f"Bästa rosé till grillat — {DATE_STR}",
            "intro": "Rosé och grillat är en perfekt kombination — syran klipper igenom fett, och kylan balanserar sommarhettan. Här är de bästa roséerna till grillkvällen.",
            "intro2": "De bästa grillroséerna har lite mer kropp och frukt än en standard aperitif-rosé. Tavel från Rhône, mörka Provence-roséer och spanska Garnacha-roséer fungerar alla utmärkt. Nyckeln är att hitta en rosé med tillräcklig kropp för att matcha grillat kött, men tillräcklig syra för att inte bli tung.",
            "guide": {
                "title": "Hur väljer man rosé till grillat?",
                "points": [
                    "Till grillad kyckling och fisk: välj en lättare, torr rosé från Provence eller Loire.",
                    "Till grillat kött och korv: välj en rosé med mer kropp — Tavel, spansk Garnacha eller sydafrikansk Pinotage-rosé.",
                    "Till grillad halloumi och grönsaker: nästan vilken rosé som helst fungerar — välj det du gillar.",
                    "Ha alltid rosén i ishink vid grillen. Den värms snabbt utomhus.",
                ]
            },
            "wines": dedup_wines(sorted([w for w in fast if w.get('type') == 'Rosé' and w.get('pkg') == 'Flaska'
                           and (w.get('taste_body') or 0) >= 4],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },

        # ─── Bubbel-kluster ───
        {
            "slug": "champagne-under-300-kr",
            "title": f"Bästa champagnen under 300 kr {YEAR} — 5 riktiga fynd",
            "meta": f"Bästa champagnen under 300 kr på Systembolaget {YEAR}. Alla rankade — billigaste kostar 249 kr.",
            "h1": f"Bästa champagne under 300 kr — {DATE_STR}",
            "intro": "Riktig champagne behöver inte kosta en förmögenhet. Under 300 kr finns överraskande bra champagner — från små grower-producenter till välkända hus som ger mer än Veuve och Moët.",
            "intro2": "Champagne under 300 kr är en av de mest undervärderade kategorierna på Systembolaget. Många väljer Cava eller Prosecco för att spara pengar, men missar att det finns riktig champagne i samma prisklass. Vi har hittat de champagner som faktiskt levererar — med den komplexitet, finheten och mousset som gör champagne till champagne.",
            "guide": {
                "title": "Champagne under 300 kr — vad ska man leta efter?",
                "points": [
                    "Grower-champagne (RM på etiketten) ger ofta bäst kvalitet per krona. De gör vin från egna druvor, inte inköpta.",
                    "Blanc de Blancs (100% Chardonnay) ger elegans och citrus. Blanc de Noirs (Pinot Noir/Meunier) ger fylligare, fruktigare stil.",
                    "Brut Nature eller Extra Brut har ingen tillsatt socker — renare smak, bättre till mat.",
                    "Årgångschampagne under 300 kr är sällsynt men finns — håll ögonen öppna.",
                ]
            },
            "faq_visible": [
                ("Finns det bra champagne under 300 kr?", "Ja. Flera champagner i denna prisklass får höga betyg från både crowd och experter. Hemligheten är att leta efter mindre kända producenter (grower-champagne) snarare än de stora husen."),
                ("Vad är skillnaden mellan champagne och Cava?", "Champagne kommer bara från Champagne i Frankrike och jäser i flaskan (méthode traditionnelle). Cava använder samma metod men andra druvor och har generellt ett lägre pris. Kvalitetsmässigt kan bra Cava matcha billig champagne, men riktig champagne har en komplexitet som är svår att replikera."),
            ],
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Mousserande'
                           and 'frankrike' == (w.get('country') or '').lower()
                           and ('champagne' in (w.get('region') or '').lower() or 'champagne' in (w.get('cat3') or '').lower())
                           and (w.get('price', 999) or 999) < 300],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-prosecco",
            "title": f"Bästa Prosecco på Systembolaget {YEAR}",
            "meta": f"Bästa Prosecco {YEAR}. Topp Prosecco och Prosecco Superiore DOCG — rankade efter kvalitet per krona. {DATE_STR}.",
            "h1": f"Bästa Prosecco — {DATE_STR}",
            "intro": "Prosecco är Italiens svar på festbubbel — lättare, fruktigare och billigare än champagne. Men kvaliteten varierar enormt. Här är de som faktiskt är värda pengarna.",
            "intro2": "Prosecco delas i två kategorier: vanlig DOC (produceras i ett stort område) och Superiore DOCG (från Conegliano-Valdobbiadene, striktare regler, högre kvalitet). Druvan Glera ger de karaktäristiska tonerna av grönt äpple, päron och blommor. Vi har rankat alla Prosecco på Systembolaget — DOC och DOCG — efter kvalitet per krona.",
            "guide": {
                "title": "Hur väljer man Prosecco?",
                "points": [
                    "Prosecco Superiore DOCG är nästan alltid bättre än vanlig DOC — det är värt de extra kronorna.",
                    "Extra Dry är faktiskt sötare än Brut. Vill du ha torrast möjligt, välj Brut eller Brut Nature.",
                    "Col Fondo-prosecco är naturligt grumlig och har mer karaktär — ett spännande alternativ om du hittar den.",
                    "Drick Prosecco kallt (6-8°C) och ungt. Den är inte gjord för lagring.",
                ]
            },
            "faq_visible": [
                ("Vad är skillnaden mellan Prosecco DOC och DOCG?", "DOCG (Denominazione di Origine Controllata e Garantita) är den högsta kvalitetsnivån. Prosecco DOCG kommer från det begränsade området Conegliano-Valdobbiadene i Veneto och har striktare produktionsregler. DOC-prosecco kan produceras i ett mycket större område."),
                ("Är Prosecco lika bra som champagne?", "Det är olika stilar. Prosecco är lättare, fruktigare och gjord för att drickas ung. Champagne har mer komplexitet, jästighet och åldringskapacitet. Prosecco är perfekt som aperitif, champagne fungerar bättre till mat."),
            ],
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Mousserande'
                           and w.get('country') == 'Italien'],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },
        {
            "slug": "basta-cremant",
            "title": f"Bästa Crémant {YEAR} — Topp 10 champagnealternativ från 99 kr",
            "meta": f"Bästa crémant {YEAR} på Systembolaget — Alsace, Loire & Bourgogne. Från 99 kr. Se hela listan.",
            "h1": f"Bästa Crémant — champagnekvalitet till halva priset",
            "intro": "Crémant är Frankrikes bäst bevarade vinhemlighet — samma metod som champagne, ofta samma druvor, men till halva priset. Här är de bästa Crémant-köpen just nu.",
            "intro2": "Crémant produceras med méthode traditionnelle (samma flaskjäsning som champagne) i flera franska regioner: Alsace, Loire, Bourgogne, Limoux och Jura. Crémant d'Alsace ger ofta bäst prisvärdhet, medan Crémant de Bourgogne kommer närmast champagnestilen. Crémant de Loire är fruktigare och lättare. Alla ger champagneupplevelse utan champagnepriset.",
            "guide": {
                "title": "Guide till Crémant",
                "points": [
                    "Crémant d'Alsace: Ofta Pinot Blanc eller Riesling. Ren, fräsch, citrusdriven. Bäst prisvärdhet.",
                    "Crémant de Bourgogne: Chardonnay och Pinot Noir. Närmast champagne i stil. Lite dyrare men värt det.",
                    "Crémant de Loire: Chenin Blanc. Fruktigare, blommigare, mer lekfull.",
                    "Crémant de Limoux: Frankrikes äldsta mousserande — sedan 1531. Mauzac-druvan ger unik karaktär.",
                ]
            },
            "faq_visible": [
                ("Vad är Crémant?", "Crémant är franskt mousserande vin som görs med samma metod som champagne (flaskjäsning) men utanför Champagne-regionen. Namnet kommer från 'crème' — den krämiga mousset. Det är juridiskt skyddat och har strikta kvalitetskrav."),
                ("Är Crémant lika bra som champagne?", "De bästa Crémant-vinerna kan mäta sig med ingångs-champagne, och slår ofta champagne i samma prisklass. Skillnaden är subtil — champagne har generellt mer komplexitet och jästkaraktär, men Crémant ger 80-90% av upplevelsen till 40-60% av priset."),
            ],
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and w.get('type') == 'Mousserande'
                           and w.get('country') == 'Frankrike'
                           and 'champagne' not in (w.get('region') or '').lower()],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },

        # ─── Boxvin (moved from monthly_seo for full template) ───
        {
            "slug": "basta-boxvin",
            "title": f"Bästa vinboxen {YEAR} — Topp 20 boxvin på Systembolaget",
            "meta": f"Bästa vinboxen {YEAR} — alla bag-in-box rankade. Röda, vita & rosé. Uppdaterad {DATE_STR}.",
            "h1": f"Bästa boxvinet {YEAR} — topp bag-in-box på Systembolaget",
            "intro": f"Vilket boxvin är bäst just nu? Sverige är världens största boxvinmarknad — men kvaliteten varierar enormt. Vi har rankat alla bag-in-box-viner på Systembolaget efter kvalitet per krona.",
            "intro2": f"Bästa boxvinet {YEAR} behöver inte vara dyrt. Box ger ofta bättre literpris än flaska, och de bästa boxvinerna håller riktigt hög kvalitet. En öppnad box håller dessutom 4–6 veckor tack vare vakuumförpackningen. Vi rankar alla BiB-viner — röda, vita och rosé — baserat på crowd-betyg, expertrecensioner och prisvärde.",
            "guide": {
                "title": "Så väljer du rätt boxvin",
                "points": [
                    "Röda boxar: Spansk Tempranillo och argentinsk Malbec dominerar topplistorna. Kolla smakfynd-poängen.",
                    "Vita boxar: Sauvignon Blanc för fräscht, Chardonnay för fylligare. Sydafrikanska boxar ger bra prisvärdhet.",
                    "Rosé-boxar: Perfekt till sommar och grillfester. Välj en med hög syra och låg sötma.",
                    "Öppnad box håller 4–6 veckor i kylskåp — mycket längre än flaska. Perfekt till vardags.",
                ]
            },
            "faq_visible": [
                ("Är boxvin sämre än flaskor?", "Nej. Samma vin kan finnas i både box och flaska. Boxformatet ger ofta bättre literpris och vinet håller längre öppnat. De bästa boxvinerna på Systembolaget har höga betyg från både crowd och experter."),
                ("Hur länge håller öppnat boxvin?", "En öppnad bag-in-box håller 4–6 veckor tack vare vakuumförpackningen som skyddar vinet från luft. En öppnad flaska håller max 3–5 dagar."),
                ("Vilket boxvin passar till grillat?", "Välj en fyllig röd box — spansk Tempranillo eller argentinsk Malbec fungerar utmärkt. Till grillad kyckling och fisk funkar en fräsch vit box eller rosé."),
            ],
            "wines": dedup_wines(sorted([w for w in all_wines if w.get('pkg') == 'BiB'
                           and w.get('smakfynd_score', 0) > 0
                           and w.get('assortment') in ('Fast sortiment', 'Tillfälligt sortiment')],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },

        # ─── Midsommar (moved from monthly_seo for full template) ───
        {
            "slug": "vin-till-midsommar",
            "title": f"Bästa vinerna till midsommar {YEAR} — Topp rosé, bubbel & vitt",
            "meta": f"Vin till midsommar {YEAR}? Bästa rosé, bubbel och vita viner till sill, jordgubbar och midsommarfirande. Topp 20 på Systembolaget. {DATE_STR}.",
            "h1": f"Bästa vinerna till midsommar {YEAR}",
            "intro": f"Midsommar {YEAR} — Sveriges mest älskade sommarfest. Fräscht, festligt och lättdrucket är nyckelorden. Här är de bästa vinerna till midsommarfirandet.",
            "intro2": f"Till den klassiska midsommarmaten — matjessill, gräddfil, jordgubbar, nypotatis och knäckebröd — vill du ha viner med friskhet och hög syra. Undvik tunga röda viner. Satsa på krispigt vitt, elegant rosé eller ett festligt bubbel. De bästa midsommarvinerna är mångsidiga nog att passa till hela buffén, från sillen till desserten.",
            "guide": {
                "title": "Vinerna till midsommarmenyn",
                "points": [
                    "Till matjessill och gravad lax: Torr Riesling, Chablis eller Sauvignon Blanc. Syran balanserar fettigheten.",
                    "Till nypotatis och gräddfil: Fräsch rosé från Provence eller en torr Crémant.",
                    "Till jordgubbar: Mousserande rosé eller en halvtorr Riesling — sötman matchar bäret.",
                    "Helgaranti: En torr, fräsch rosé fungerar till hela midsommarbuffén. Köp en box för enkel servering.",
                ]
            },
            "faq_visible": [
                (f"Vilken rosé passar bäst till midsommar?", "En torr Provence-rosé är det klassiska valet — elegant, fräsch och funkar till allt från sill till jordgubbar. Men spanska och italienska roséer ger ofta lika bra kvalitet till lägre pris."),
                ("Hur mycket vin behöver man till midsommar?", "Räkna med 1 flaska per person för ett längre midsommarfirande. Blanda gärna vita, rosé och bubbel. Ha alltid extra kylda flaskor redo — det går åt mer än man tror i värmen."),
                ("Kan man dricka rött vin till midsommar?", "Det går, men det är inte optimalt. Midsommarmaten (sill, lax, potatis) passar bättre med vita, rosé och bubbel. Om du ändå vill ha rött, välj en lätt, kyld Pinot Noir."),
            ],
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('type') in ('Vitt', 'Rosé', 'Mousserande'))
                           and (w.get('price', 999) or 999) <= 200],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
        },

        # ─── Kräftskiva (moved from monthly_seo for full template) ───
        {
            "slug": "vin-till-kraftskiva",
            "title": f"Bästa vinerna till kräftskiva {YEAR} — Systembolaget",
            "meta": f"Vin till kräftskiva {YEAR}? Bästa vita viner och bubbel till kräftorna. Riesling, Chablis och Sauvignon Blanc. Topp 20 på Systembolaget. {DATE_STR}.",
            "h1": f"Bästa vinerna till kräftskiva {YEAR}",
            "intro": "Kräftskivan kräver vita viner med syra och mineralitet — plus ett festligt bubbel att skåla med. Här är de bästa alternativen på Systembolaget.",
            "intro2": "Till kräftor vill du ha ett torrt, syradrivet vitt vin som lyfter skaldjurssmaken utan att ta över. Riesling, Chablis och Sauvignon Blanc är klassiska val. Undvik ekfatsviner — de tar över kräftornas delikata smak. Ett gott bubbel att starta kvällen med är ett måste.",
            "guide": {
                "title": "Vinerna till kräftskivan",
                "points": [
                    "Till kräftorna: Torr Riesling (tysk Trocken eller Alsace) är det perfekta valet — mineraldrivet och syrarikt.",
                    "Chablis (oekad Chardonnay) är ett annat klassiskt kräftvin — elegant, rent och tillbakalutat.",
                    "Starta kvällen med bubbel: Crémant d'Alsace eller en bra Cava ger festkänsla.",
                    "Undvik tunga vita viner med ekfat. Syra och mineralitet är nyckelorden för kräftor.",
                ]
            },
            "faq_visible": [
                ("Vilken vin är bäst till kräftor?", "Torr Riesling och Chablis är de klassiska valen. Båda har den höga syran och mineraliteten som lyfter kräftornas smak. Sauvignon Blanc från Sancerre eller Nya Zeeland fungerar också utmärkt."),
                ("Kan man dricka rött vin till kräftor?", "Det är ovanligt och inte rekommenderat. Röda viners tanniner krockar med skaldjurssmaken. Om du måste ha rött, välj en lätt Pinot Noir serverad kyld."),
            ],
            "wines": dedup_wines(sorted([w for w in fast if w.get('pkg') == 'Flaska'
                           and (w.get('type') in ('Vitt', 'Mousserande'))],
                          key=lambda x: -x.get('smakfynd_score', 0)))[:20],
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
    price = int(w.get('price', 0))
    country = w.get('country', '')
    grape = w.get('grape', '')
    nr = w.get('nr', '')
    label = score_label(score)
    organic = '<span style="display:inline-block;width:14px;height:14px;vertical-align:middle;margin-left:4px" title="Ekologiskt"><svg viewBox="0 0 16 16"><path d="M8 1c3.5 2 5 5 5 9-2-1-4-1-5.5.5C6 9 4.5 7 3 6c1-2.5 3-4 5-5z" fill="#3d7a4a" opacity="0.7"/></svg></span>' if w.get('organic') else ''
    expert = f" · Expert: {w['expert_score']:.1f}/10" if w.get('expert_score') else ""
    crowd = f"Crowd: {w['crowd_score']:.1f}/10" if w.get('crowd_score') else ""
    meta = f"{country}"
    if grape:
        meta += f" · {grape}"
    style = w.get('style', '')
    style_text = f'<p style="margin:4px 0 0;font-size:12px;color:#7a7060;font-style:italic;line-height:1.4">{style[:100]}{"…" if len(style)>100 else ""}</p>' if style else ''
    drop_pct = w.get('price_vs_launch_pct', 0) or 0
    data_attrs = f' data-score="{score}" data-price="{price}" data-drop="{drop_pct}"' if sortable else ''
    img_url = w.get('image_url', '')
    img_html = f'<img src="{img_url}" alt="{name}" loading="lazy" style="width:44px;height:44px;object-fit:contain;border-radius:8px;background:#faf7f2">' if img_url else f'<div style="width:44px;height:44px;border-radius:8px;background:#f0ebe3;display:flex;align-items:center;justify-content:center;font-size:18px;color:#c5bdb3">🍷</div>'

    return f'''<li style="padding:0;border-bottom:1px solid #e6ddd0"{data_attrs}>
  <a href="https://smakfynd.se/#vin/{nr}" style="display:flex;gap:12px;align-items:flex-start;padding:14px 0;text-decoration:none;color:inherit;transition:background 0.15s" onmouseover="this.style.background='#fdfbf7'" onmouseout="this.style.background='transparent'">
    {img_html}
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:baseline;gap:4px">
        <span style="font-size:12px;color:#9e9588;font-family:Georgia,serif">#{rank}</span>
        <strong style="font-size:16px;font-family:Georgia,serif;color:#1a1510">{name}</strong>{organic}
      </div>
      <div style="font-size:12px;color:#6b6355;margin-top:1px">{sub}</div>
      <div style="font-size:11px;color:#9e9588;margin-top:2px">{meta}</div>
      <div style="font-size:11px;color:#7a7060;margin-top:2px">{crowd}{expert}</div>
      <div style="display:flex;align-items:baseline;gap:8px;margin-top:4px">
        <span style="font-size:18px;font-weight:700;font-family:Georgia,serif;color:#1a1510">{price}\u00A0kr</span>
        {f'<span style="font-size:11px;font-weight:600;color:#c0392b;background:#c0392b10;padding:2px 6px;border-radius:4px">-{drop_pct}%</span>' if drop_pct > 0 else ''}
      </div>
    </div>
    <div style="text-align:center;flex-shrink:0">
      <div style="width:48px;height:48px;border-radius:50%;background:#e8f0e4;border:2px solid #2d6b3f;display:flex;align-items:center;justify-content:center">
        <span style="font-size:18px;font-weight:900;color:#2d6b3f;font-family:Georgia,serif">{score}</span>
      </div>
      <div style="font-size:9px;color:#2d6b3f;margin-top:2px;font-weight:600">{label}</div>
    </div>
  </a>
  <div style="display:flex;gap:12px;padding:0 0 10px 56px;font-size:12px">
    <a href="https://www.systembolaget.se/produkt/vin/{nr}" target="_blank" rel="noopener" style="color:#3a2a1f;text-decoration:none">Systembolaget</a>
    <a href="https://smakfynd.se/#vin/{nr}" style="color:#8b2332;text-decoration:none;font-weight:500">Se poäng & detaljer →</a>
  </div>
</li>'''

def get_cross_links(current_slug, all_pages):
    """Get 5 related landing pages for cross-linking, prioritizing same category."""
    # Tag each page with categories for smarter matching
    tags = {
        'druva': ['basta-malbec', 'basta-merlot', 'basta-cabernet-sauvignon', 'basta-pinot-noir', 'basta-syrah-shiraz', 'basta-riesling', 'basta-tempranillo', 'basta-sangiovese', 'basta-chardonnay', 'basta-sauvignon-blanc', 'basta-zinfandel', 'basta-grenache', 'basta-carmenere'],
        'land': ['basta-italienska-vin', 'basta-franska-vin', 'basta-spanska-vin', 'basta-chilenska-vin', 'basta-sydafrikanska-vin', 'basta-australiska-vin', 'basta-portugisiska-vin', 'basta-argentinska-vin'],
        'region': ['basta-vin-fran-bordeaux', 'basta-vin-fran-toscana', 'basta-vin-fran-rioja', 'basta-vin-fran-bourgogne', 'basta-vin-fran-rhonedalen', 'basta-vin-fran-champagne', 'basta-vin-fran-languedoc', 'basta-vin-fran-alsace', 'basta-kaliforniska-vin'],
        'typ': ['basta-roda-vin', 'basta-vita-vin', 'basta-bubbel', 'basta-rose', 'basta-cava', 'mousserande-vin-under-150-kr', 'basta-rose-under-100-kr', 'basta-provence-rose', 'rose-till-grillat', 'champagne-under-300-kr', 'basta-prosecco', 'basta-cremant'],
        'pris': ['vin-under-80-kr', 'vin-under-90-kr', 'vin-under-100-kr', 'vin-under-150-kr', 'vin-under-200-kr', 'basta-premium-vin', 'prissankt-vin', 'ekologiskt-vin-under-150-kr'],
        'mat': ['vin-till-grillat', 'vin-till-fisk', 'vin-till-pasta', 'vin-till-ost', 'vin-till-dejt', 'vin-till-julmat', 'vin-till-kyckling', 'vin-till-brunch', 'vin-till-lax', 'vin-till-tacos', 'vin-till-pizza', 'vin-till-sushi', 'vin-till-lamm', 'vin-till-picknick', 'vin-till-svamp', 'vin-till-nyar'],
        'smak': ['fylliga-roda-vin', 'latta-vita-vin', 'fruktiga-roda-vin', 'torra-vita-vin'],
        'sasong': ['sommarvin', 'hostvin', 'vin-till-midsommar', 'vin-till-kraftskiva'],
        'boxvin': ['basta-boxvin', 'basta-roda-boxvin', 'basta-vita-boxvin'],
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
        'boxvin': 'Boxvin',
        'sasong': 'Säsong',
    }
    category_slugs = {
        'druva': ['basta-malbec', 'basta-merlot', 'basta-cabernet-sauvignon', 'basta-pinot-noir', 'basta-syrah-shiraz', 'basta-riesling', 'basta-tempranillo', 'basta-sangiovese', 'basta-chardonnay', 'basta-sauvignon-blanc', 'basta-zinfandel', 'basta-grenache', 'basta-carmenere'],
        'land': ['basta-italienska-vin', 'basta-franska-vin', 'basta-spanska-vin', 'basta-chilenska-vin', 'basta-sydafrikanska-vin', 'basta-australiska-vin', 'basta-portugisiska-vin', 'basta-argentinska-vin'],
        'region': ['basta-vin-fran-bordeaux', 'basta-vin-fran-toscana', 'basta-vin-fran-rioja', 'basta-vin-fran-bourgogne', 'basta-vin-fran-rhonedalen', 'basta-vin-fran-champagne', 'basta-vin-fran-languedoc', 'basta-vin-fran-alsace', 'basta-kaliforniska-vin'],
        'typ': ['basta-roda-vin', 'basta-vita-vin', 'basta-bubbel', 'basta-rose', 'basta-cava', 'mousserande-vin-under-150-kr', 'basta-rose-under-100-kr', 'basta-provence-rose', 'rose-till-grillat', 'champagne-under-300-kr', 'basta-prosecco', 'basta-cremant'],
        'pris': ['vin-under-80-kr', 'vin-under-90-kr', 'vin-under-100-kr', 'vin-under-150-kr', 'vin-under-200-kr', 'basta-premium-vin', 'prissankt-vin', 'ekologiskt-vin-under-150-kr'],
        'mat': ['vin-till-grillat', 'vin-till-fisk', 'vin-till-pasta', 'vin-till-ost', 'vin-till-dejt', 'vin-till-julmat', 'vin-till-kyckling', 'vin-till-brunch', 'vin-till-lax', 'vin-till-tacos', 'vin-till-pizza', 'vin-till-sushi', 'vin-till-lamm', 'vin-till-picknick', 'vin-till-svamp', 'vin-till-nyar'],
        'smak': ['fylliga-roda-vin', 'latta-vita-vin', 'fruktiga-roda-vin', 'torra-vita-vin'],
        'sasong': ['sommarvin', 'hostvin', 'vin-till-midsommar', 'vin-till-kraftskiva'],
        'boxvin': ['basta-boxvin', 'basta-roda-boxvin', 'basta-vita-boxvin'],
    }
    slug_to_page = {p['slug']: p for p in (all_pages or []) if p.get('wines')}
    cross_sections = []
    for cat_key in ['typ', 'druva', 'land', 'region', 'pris', 'mat', 'smak', 'boxvin', 'sasong']:
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

    # Intro2 — extended intro paragraph (with optional heading)
    intro2_html = ""
    if page.get('intro2'):
        heading = ""
        if page.get('intro2_heading'):
            heading = f'<h2 style="margin:16px 0 8px;font-size:22px;font-family:\'Newsreader\',Georgia,serif;font-weight:400;color:#1e1710">{page["intro2_heading"]}</h2>\n      '
        intro2_html = f'{heading}<p style="margin:0 0 16px;font-size:15px;color:#4a4238;line-height:1.6">{page["intro2"]}</p>'
        if page.get('intro3'):
            intro2_html += f'\n      <p style="margin:0 0 16px;font-size:15px;color:#4a4238;line-height:1.6">{page["intro3"]}</p>'

    # Guide section — buying advice
    guide_html = ""
    if page.get('guide'):
        guide = page['guide']
        points_html = ''.join(f'<li style="margin-bottom:8px">{p}</li>' for p in guide['points'])
        guide_html = f'''
    <div style="margin-top:32px">
      <h2 style="margin:0 0 12px;font-size:20px;font-family:'Newsreader',Georgia,serif;font-weight:400;color:#1e1710">{guide['title']}</h2>
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
      <h2 style="margin:0 0 12px;font-size:20px;font-family:'Newsreader',Georgia,serif;font-weight:400;color:#1e1710">Vanliga frågor</h2>
      <dl style="margin:0">
        {faq_entries}
      </dl>
    </div>'''

    # Today's date for article meta
    today_iso = datetime.now().strftime('%Y-%m-%d')

    # JSON-LD for the wine list
    items_ld = []
    for i, w in enumerate(page['wines'][:10]):
        nr = w.get('nr', '')
        img_url = w.get('image_url', '') or f"https://smakfynd.se/og-image.svg"
        style_desc = (w.get('style', '') or '')[:200]
        grape = w.get('grape', '')
        country = w.get('country', '')
        desc = style_desc if style_desc else f"{grape} från {country}" if grape else f"Vin från {country}"
        items_ld.append({
            "@type": "ListItem",
            "position": i + 1,
            "item": {
                "@type": "Product",
                "name": f"{w.get('name','')} {w.get('sub','')}".strip(),
                "image": img_url,
                "description": desc,
                "brand": {"@type": "Brand", "name": w.get('name', '')},
                "category": "Wine",
                "offers": {
                    "@type": "Offer",
                    "price": str(w.get('price', 0)),
                    "priceCurrency": "SEK",
                    "availability": "https://schema.org/InStock",
                    "url": f"https://www.systembolaget.se/produkt/vin/{nr}",
                },
                **({"aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": w.get('smakfynd_score', 0),
                    "bestRating": 100,
                    "worstRating": 1,
                    "ratingCount": w.get('crowd_reviews', 1),
                }} if w.get('crowd_reviews', 0) > 0 else {}),
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

  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;background:#f7f3ec;font-family:'Inter',-apple-system,sans-serif;color:#1e1710">
  <div style="max-width:640px;margin:0 auto;padding:24px 20px 60px">

    <header style="margin-bottom:24px">
      <a href="https://smakfynd.se" style="text-decoration:none;display:inline-block;margin-bottom:16px">
        <span style="font-family:Georgia,serif;font-size:22px;color:#7a2332">Smakfynd</span>
      </a>
      <h1 style="margin:0 0 8px;font-size:28px;font-family:'Newsreader',Georgia,serif;font-weight:400;line-height:1.2;color:#1e1710">
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
      <h2 style="margin:0 0 8px;font-size:18px;font-family:'Newsreader',serif;font-weight:400">Så fungerar Smakfynd-poängen</h2>
      <p style="margin:0;font-size:13px;color:#4a4238;line-height:1.6">
        Varje vin bedöms på tre saker: <strong>crowd-betyg</strong> (vad vanliga vindrickare tycker),
        <strong>expertrecensioner</strong> (kritiker som James Suckling, Decanter m.fl.) och
        <strong>prisvärde</strong> (pris jämfört med liknande viner). Hög kvalitet till lågt pris = hög poäng.
      </p>
    </div>

    <div style="margin-top:32px;padding:24px 20px;border-radius:16px;background:linear-gradient(135deg,#fefcf8,#f7f3ec);border:1px solid #e6ddd0">
      <h2 style="margin:0 0 12px;font-size:20px;font-family:'Newsreader',Georgia,serif;font-weight:400;color:#1e1710">Hitta din egen favorit</h2>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;gap:8px;align-items:center">
          <input id="sf-app-search" type="text" placeholder="Sök efter ett vin..."
            style="flex:1;padding:10px 14px;border-radius:10px;border:1px solid #d6cdc0;background:#fff;font-size:13px;color:#1e1710;outline:none;font-family:inherit"
            onkeydown="if(event.key==='Enter'){{sfTrack('app_click_from_landing',{{action:'search',query:this.value}});location.href='https://smakfynd.se/#sok/'+encodeURIComponent(this.value)}}">
          <button onclick="var q=document.getElementById('sf-app-search').value;sfTrack('app_click_from_landing',{{action:'search',query:q}});location.href='https://smakfynd.se/#sok/'+encodeURIComponent(q)"
            style="padding:10px 16px;border-radius:10px;border:none;background:#8b2332;color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;flex-shrink:0">Sök</button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <a href="https://smakfynd.se/#ai" onclick="sfTrack('app_click_from_landing',{{action:'ai'}})"
            style="flex:1;min-width:180px;padding:10px 14px;border-radius:10px;border:1px solid #d6cdc0;background:#fff;text-decoration:none;color:#1e1710;font-size:13px;display:flex;align-items:center;gap:8px;transition:border-color 0.2s"
            onmouseover="this.style.borderColor='#8b2332'" onmouseout="this.style.borderColor='#d6cdc0'">
            <span style="font-size:18px">🍷</span>
            <span><strong style="font-size:13px">AI-vinmatchare</strong><br><span style="font-size:11px;color:#7a7060">Beskriv din middag, få vinförslag</span></span>
          </a>
          <a href="https://smakfynd.se/#sparade" onclick="sfTrack('app_click_from_landing',{{action:'saved'}})"
            style="flex:1;min-width:180px;padding:10px 14px;border-radius:10px;border:1px solid #d6cdc0;background:#fff;text-decoration:none;color:#1e1710;font-size:13px;display:flex;align-items:center;gap:8px;transition:border-color 0.2s"
            onmouseover="this.style.borderColor='#8b2332'" onmouseout="this.style.borderColor='#d6cdc0'">
            <span style="font-size:18px">♡</span>
            <span><strong style="font-size:13px">Spara favoriter</strong><br><span style="font-size:11px;color:#7a7060">Logga in och bygg din vinlista</span></span>
          </a>
        </div>
      </div>
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
<script>
(function(){{
  var A="https://smakfynd-analytics.smakfynd.workers.dev";
  var sid;try{{sid=sessionStorage.getItem("sf_sid");if(!sid){{sid=Math.random().toString(36).slice(2);sessionStorage.setItem("sf_sid",sid)}}}}catch(e){{sid="anon"}}
  var dev=window.innerWidth<768?"mobile":"desktop";
  var pg="/{page['slug']}/";
  window.sfTrack=function(ev,data){{
    try{{fetch(A+"/event",{{method:"POST",headers:{{"Content-Type":"application/json"}},body:JSON.stringify({{session:sid,event:ev,wine_nr:(data&&data.nr)||null,data:data||{{}},page:pg,device:dev,referrer:document.referrer}}),keepalive:true}}).catch(function(){{}})}}catch(e){{}}
  }};
  sfTrack("pageview",{{}});
  document.addEventListener("click",function(e){{
    var a=e.target.closest("a");if(!a)return;
    var h=a.href||"";
    if(h.indexOf("systembolaget.se/produkt")>-1){{var m=h.match(/\\/(\\d+)$/);sfTrack("sb_click_from_landing",{{nr:m?m[1]:null}})}}
    else if(h.indexOf("smakfynd.se/#")>-1){{sfTrack("app_click_from_landing",{{action:"wine_detail",target:h}})}}
  }});
}})();
</script>
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

    # Collect slugs from generated pages
    slugs = set()
    for p in pages:
        slugs.add(p["slug"])
        urls.append(f'''  <url>
    <loc>https://smakfynd.se/{p["slug"]}/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>''')

    # Also include any other landing page directories (from other generators)
    skip = {'integritet', 'tack', 'admin', 'specs', 'sw.js', 'manifest.json'}
    for d in sorted(os.listdir(DOCS)):
        full = os.path.join(DOCS, d)
        if os.path.isdir(full) and d not in slugs and d not in skip and os.path.exists(os.path.join(full, 'index.html')):
            slugs.add(d)
            urls.append(f'''  <url>
    <loc>https://smakfynd.se/{d}/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
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
        if not page['wines'] and page['slug'] not in ('alkoholfritt-vin',):
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
