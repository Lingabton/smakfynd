#!/usr/bin/env python3
"""
Find affordable organic Sicilian wines NOT on Systembolaget.
Targets the sweet spot: 3.7+ rating, organic, under ~100 SEK price range.
"""
import json, os, time, re
from rapidfuzz import fuzz
from playwright.sync_api import sync_playwright

DATA_DIR = os.path.expanduser("~/smakfynd/data")
SB_FILE = os.path.join(DATA_DIR, "systembolaget_raw.json")
OUTPUT_FILE = os.path.join(DATA_DIR, "vivino_gaps_budget_organic.json")

SEARCHES = {
    # Organic Sicilian by grape
    "nero_davola_organic": "Nero d'Avola organic Sicily",
    "grillo_organic": "Grillo organic Sicily",
    "catarratto_organic": "Catarratto organic",
    "nerello_organic": "Nerello Mascalese organic",
    "frappato_organic": "Frappato organic Sicily",
    # Budget-friendly Sicilian
    "sicilia_doc": "Sicilia DOC red",
    "terre_siciliane": "Terre Siciliane rosso",
    "sicilia_bianco": "Sicilia DOC white Grillo",
    # Specific affordable producers
    "feudo_montoni": "Feudo Montoni",
    "cos_sicilia": "COS Sicily wine",
    "alessandro_camporeale": "Alessandro di Camporeale",
    "caruso_minini": "Caruso Minini Sicily",
    "cantine_pellegrino": "Pellegrino Sicily wine",
    "tenute_orestiadi": "Orestiadi Sicily",
    "baglio_pianetto": "Baglio di Pianetto",
}

def parse_search_text(text):
    """Parse wines from Vivino search page."""
    wines = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]

    start = 0
    for i, line in enumerate(lines):
        if line.startswith("Resultat för") or line.startswith("Visar"):
            start = i + 1
            break

    current = {}
    i = start
    while i < len(lines):
        line = lines[i]

        rm = re.match(r'^(\d)[,.](\d)$', line)
        if rm:
            current['rating'] = float(f"{rm.group(1)}.{rm.group(2)}")
            i += 1
            continue

        rvm = re.match(r'^\(?([\d\s]+)\s*betyg\)?', line)
        if rvm:
            current['reviews'] = int(rvm.group(1).replace(' ', ''))
            i += 1
            continue

        if 'baserat på alla' in line:
            current['reviews'] = -1
            i += 1
            continue

        pm = re.match(r'^([\d\s]+)\s*kr$', line)
        if pm:
            price = int(pm.group(1).replace(' ', ''))
            current['vivino_price'] = price
            if current.get('winery') and current.get('rating', 0) > 0:
                wines.append(current.copy())
            current = {}
            i += 1
            continue

        if ',' in line and len(line) < 50:
            parts = [p.strip() for p in line.split(',')]
            if len(parts) >= 2 and all(len(p) < 25 for p in parts):
                current['region'] = line
                i += 1
                continue

        skip = ['Filteralternativ', 'Sortera', 'Visa mer', 'Lägg till',
                'Levererar till', 'Sverige', 'Språk', 'Svenska', 'Viner',
                'Erbjudanden', 'Passar till', 'Druvor', 'Regioner', 'Premium',
                'Producenter', 'Ny', 'Sök alla viner', 'Läs mer',
                'Bland de bästa']
        if any(line.startswith(s) for s in skip) or len(line) < 2:
            i += 1
            continue

        if 'winery' not in current:
            current['winery'] = line
        elif 'wine_name' not in current:
            current['wine_name'] = line
        else:
            current['wine_name'] += ' ' + line

        i += 1

    if current.get('winery') and current.get('rating', 0) > 0:
        wines.append(current)

    return wines

def is_on_systembolaget(wine, sb_names):
    winery = wine.get('winery', '').lower()
    wname = wine.get('wine_name', '').lower()
    search = f"{winery} {wname}".strip()

    for sb in sb_names:
        if fuzz.token_set_ratio(search, sb) > 80:
            return True
        # Strict winery match (only if winery name is specific enough)
        if len(winery) > 6 and fuzz.token_sort_ratio(winery, sb) > 85:
            return True
    return False

def main():
    print("=== VIVINO GAP FINDER: Affordable Organic Sicily ===\n")

    sb_products = json.load(open(SB_FILE))
    sb_names = [f"{p.get('name','')} {p.get('sub','')}".strip().lower() for p in sb_products]
    print(f"Systembolaget: {len(sb_names)} products loaded")

    all_wines = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900},
            locale="sv-SE",
        )
        page = context.new_page()

        for cat, query in SEARCHES.items():
            print(f"\n--- {cat}: '{query}' ---")
            try:
                url = f"https://www.vivino.com/search/wines?q={query.replace(' ', '+')}"
                page.goto(url, timeout=20000)
                page.wait_for_timeout(3000)

                for _ in range(3):
                    page.evaluate("window.scrollBy(0, 500)")
                    page.wait_for_timeout(600)

                text = page.evaluate("() => document.body.innerText")
                wines = parse_search_text(text)

                for w in wines:
                    w['search_category'] = cat
                all_wines.extend(wines)
                print(f"  {len(wines)} wines found")

            except Exception as e:
                print(f"  Error: {e}")

            time.sleep(2.5)

        browser.close()

    # Deduplicate
    seen = set()
    unique = []
    for w in all_wines:
        key = f"{w.get('winery','')}|{w.get('wine_name','')}"
        if key not in seen:
            seen.add(key)
            unique.append(w)

    print(f"\n{'='*70}")
    print(f"Total unique wines: {len(unique)}")

    # Filter and categorize
    gaps = []
    on_sb = []
    for w in unique:
        if is_on_systembolaget(w, sb_names):
            on_sb.append(w)
        else:
            gaps.append(w)

    # Split gaps into price tiers
    budget = [w for w in gaps if w.get('vivino_price', 999) <= 150 and w.get('rating', 0) >= 3.6]
    mid = [w for w in gaps if 150 < w.get('vivino_price', 0) <= 300 and w.get('rating', 0) >= 3.8]
    premium = [w for w in gaps if w.get('vivino_price', 0) > 300 and w.get('rating', 0) >= 4.0]
    no_price = [w for w in gaps if w.get('vivino_price', 0) == 0 and w.get('rating', 0) >= 3.8]

    budget.sort(key=lambda x: (-x.get('rating', 0), x.get('vivino_price', 999)))
    mid.sort(key=lambda x: (-x.get('rating', 0), x.get('vivino_price', 999)))
    premium.sort(key=lambda x: (-x.get('rating', 0)))

    print(f"Already on Systembolaget: {len(on_sb)}")
    print(f"NOT on Systembolaget: {len(gaps)}")

    print(f"\n{'='*70}")
    print(f" BUDGET GEMS (under 150 kr, 3.6+ rating) — IMPORT THESE")
    print(f"{'='*70}")
    for i, w in enumerate(budget[:20]):
        price = w.get('vivino_price', '?')
        rev = w.get('reviews', 0)
        rev_str = f"{rev:,}" if rev > 0 else "agg"
        name = f"{w.get('winery','')} {w.get('wine_name','')}"
        print(f"  {i+1:2d}. ★{w['rating']:.1f}  {price:>4} kr  ({rev_str:>7s})  {name[:50]}")
        print(f"      {w.get('region','')}  [{w.get('search_category','')}]")

    print(f"\n{'='*70}")
    print(f" MID-RANGE (150-300 kr, 3.8+ rating) — PRESTIGE PICKS")
    print(f"{'='*70}")
    for i, w in enumerate(mid[:15]):
        price = w.get('vivino_price', '?')
        rev = w.get('reviews', 0)
        rev_str = f"{rev:,}" if rev > 0 else "agg"
        name = f"{w.get('winery','')} {w.get('wine_name','')}"
        print(f"  {i+1:2d}. ★{w['rating']:.1f}  {price:>4} kr  ({rev_str:>7s})  {name[:50]}")

    print(f"\n{'='*70}")
    print(f" PREMIUM (300+ kr, 4.0+ rating) — BRAND BUILDERS")
    print(f"{'='*70}")
    for i, w in enumerate(premium[:10]):
        price = w.get('vivino_price', '?')
        name = f"{w.get('winery','')} {w.get('wine_name','')}"
        print(f"  {i+1:2d}. ★{w['rating']:.1f}  {price:>4} kr  {name[:55]}")

    # Save
    result = {
        "scan_date": time.strftime("%Y-%m-%d %H:%M"),
        "total_scanned": len(unique),
        "on_systembolaget": len(on_sb),
        "budget_gems": budget,
        "mid_range": mid,
        "premium": premium,
    }
    json.dump(result, open(OUTPUT_FILE, "w"), ensure_ascii=False, indent=2)
    print(f"\nSaved to {OUTPUT_FILE}")

    # Summary for June trip
    producers = set()
    for w in budget + mid:
        producers.add(w.get('winery', ''))
    print(f"\n{'='*70}")
    print(f" PRODUCERS TO CONTACT FOR JUNE TRIP")
    print(f"{'='*70}")
    for prod in sorted(producers):
        if prod and len(prod) > 2:
            wines_by = [w for w in budget + mid if w.get('winery') == prod]
            ratings = [w['rating'] for w in wines_by]
            print(f"  {prod[:40]:40s}  {len(wines_by)} wines  avg ★{sum(ratings)/len(ratings):.1f}")

if __name__ == "__main__":
    main()
