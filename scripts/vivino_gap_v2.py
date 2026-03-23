#!/usr/bin/env python3
"""
VIVINO GAP FINDER v2
Uses Vivino search (which works!) to find top wines from Italian regions,
then cross-references against Systembolaget.

Usage:
  python3 vivino_gap_v2.py
  python3 vivino_gap_v2.py --region sicily
"""
import json, os, sys, time, re
from rapidfuzz import fuzz
from playwright.sync_api import sync_playwright

DATA_DIR = os.path.expanduser("~/smakfynd/data")
SB_FILE = os.path.join(DATA_DIR, "systembolaget_raw.json")
OUTPUT_FILE = os.path.join(DATA_DIR, "vivino_gaps.json")

# Search queries that find regional wines on Vivino
SEARCHES = {
    "sicily_nero_davola": "Nero d'Avola Sicily",
    "sicily_nerello": "Nerello Mascalese Sicily",
    "sicily_grillo": "Grillo Sicily",
    "sicily_etna_rosso": "Etna Rosso",
    "sicily_etna_bianco": "Etna Bianco",
    "sicily_catarratto": "Catarratto Sicily",
    "sicily_frappato": "Frappato Sicily",
    "sicily_cerasuolo": "Cerasuolo di Vittoria",
    "puglia_primitivo": "Primitivo Puglia",
    "puglia_negroamaro": "Negroamaro Puglia",
    "abruzzo_montepulciano": "Montepulciano d'Abruzzo organic",
    "tuscany_chianti": "Chianti Classico Riserva",
    "piedmont_barbera": "Barbera d'Asti",
}

def parse_search_text(text):
    """Parse wines from Vivino search page innerText."""
    wines = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]

    # Find start of results
    start = 0
    for i, line in enumerate(lines):
        if line.startswith("Resultat för") or line.startswith("Visar"):
            start = i + 1
            break

    current = {}
    i = start
    while i < len(lines):
        line = lines[i]

        # Rating: "4,3" or "3,8"
        rm = re.match(r'^(\d)[,.](\d)$', line)
        if rm:
            current['rating'] = float(f"{rm.group(1)}.{rm.group(2)}")
            i += 1
            continue

        # Reviews: "134 betyg" or "1 422 betyg"
        rvm = re.match(r'^\(?([\d\s]+)\s*betyg\)?', line)
        if rvm:
            current['reviews'] = int(rvm.group(1).replace(' ', ''))
            i += 1
            continue

        if 'baserat på alla' in line:
            current['reviews'] = -1
            i += 1
            continue

        # Price: "169 kr"
        pm = re.match(r'^([\d\s]+)\s*kr$', line)
        if pm:
            if current.get('winery') and current.get('rating', 0) > 0:
                wines.append(current.copy())
            current = {}
            i += 1
            continue

        # Region: "Puglia, Italien"
        if ',' in line and len(line) < 50:
            parts = [p.strip() for p in line.split(',')]
            if len(parts) >= 2 and all(len(p) < 25 for p in parts):
                current['region'] = line
                i += 1
                continue

        # Skip known UI text
        skip = ['Filteralternativ', 'Sortera', 'Visa mer', 'Lägg till',
                'Levererar till', 'Sverige', 'Språk', 'Svenska', 'Viner',
                'Erbjudanden', 'Passar till', 'Druvor', 'Regioner', 'Premium',
                'Producenter', 'Ny', 'Sök alla viner', 'Läs mer']
        if any(line.startswith(s) for s in skip) or len(line) < 2:
            i += 1
            continue

        # Wine name parts
        if 'winery' not in current:
            current['winery'] = line
        elif 'wine_name' not in current:
            current['wine_name'] = line
        else:
            current['wine_name'] += ' ' + line

        i += 1

    # Last wine
    if current.get('winery') and current.get('rating', 0) > 0:
        wines.append(current)

    return wines

def is_on_systembolaget(wine, sb_list):
    """Check if wine exists on Systembolaget."""
    winery = wine.get('winery', '').lower()
    wname = wine.get('wine_name', '').lower()
    search = f"{winery} {wname}".strip()

    for sb in sb_list:
        score = fuzz.token_set_ratio(search, sb)
        if score > 78:
            return True, sb
        # Also check just winery name
        if fuzz.partial_ratio(winery, sb) > 88 and len(winery) > 4:
            return True, sb

    return False, None

def main():
    region_filter = None
    for i, arg in enumerate(sys.argv):
        if arg == '--region' and i + 1 < len(sys.argv):
            region_filter = sys.argv[i + 1].lower()

    searches = {k: v for k, v in SEARCHES.items()
                if not region_filter or region_filter in k}

    if not searches:
        searches = SEARCHES

    print(f"Searches to run: {len(searches)}")
    for k, v in searches.items():
        print(f"  {k}: '{v}'")

    # Load SB data
    print(f"\nLoading Systembolaget data...")
    sb_products = json.load(open(SB_FILE))
    sb_names = [f"{p.get('name','')} {p.get('sub','')}".strip().lower() for p in sb_products]
    print(f"  {len(sb_names)} products loaded")

    all_wines = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900},
            locale="sv-SE",
        )
        page = context.new_page()

        for category, query in searches.items():
            print(f"\n=== {category}: '{query}' ===")
            try:
                url = f"https://www.vivino.com/search/wines?q={query.replace(' ', '+')}"
                page.goto(url, timeout=20000)
                page.wait_for_timeout(3000)

                # Scroll to load more
                for _ in range(4):
                    page.evaluate("window.scrollBy(0, 600)")
                    page.wait_for_timeout(800)

                text = page.evaluate("() => document.body.innerText")
                wines = parse_search_text(text)
                print(f"  Found {len(wines)} wines")

                for w in wines:
                    w['search_category'] = category
                    all_wines.append(w)
                    name = f"{w.get('winery','')} {w.get('wine_name','')}"
                    print(f"    {w.get('rating',0):.1f} | {name[:50]} | {w.get('region','')}")

            except Exception as e:
                print(f"  Error: {e}")

            time.sleep(3)

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

    # Cross-reference
    gaps = []
    on_sb = []
    for w in unique:
        found, match = is_on_systembolaget(w, sb_names)
        if found:
            on_sb.append((w, match))
        else:
            gaps.append(w)

    gaps.sort(key=lambda x: (-x.get('rating', 0), -x.get('reviews', 0)))

    print(f"Already on Systembolaget: {len(on_sb)}")
    print(f"NOT on Systembolaget: {len(gaps)}")

    print(f"\n{'='*70}")
    print(f" IMPORT OPPORTUNITIES — NOT on Systembolaget")
    print(f"{'='*70}")
    for i, w in enumerate(gaps[:30]):
        rev = w.get('reviews', 0)
        rev_str = f"{rev:,}" if rev > 0 else "agg"
        name = f"{w.get('winery','')} {w.get('wine_name','')}"
        print(f"  {i+1:2d}. ★{w.get('rating',0):.1f}  ({rev_str:>8s})  {name[:50]:50s}  {w.get('region','')}")

    print(f"\n{'='*70}")
    print(f" ALREADY ON SYSTEMBOLAGET (competitors)")
    print(f"{'='*70}")
    for w, sb_match in on_sb[:15]:
        name = f"{w.get('winery','')} {w.get('wine_name','')}"
        print(f"  ★{w.get('rating',0):.1f}  {name[:45]:45s}  ≈ SB: {sb_match[:40]}")

    # Save
    result = {
        "scan_date": time.strftime("%Y-%m-%d %H:%M"),
        "total_scanned": len(unique),
        "on_systembolaget": len(on_sb),
        "gaps": len(gaps),
        "opportunities": gaps,
        "on_sb": [{"vivino": f"{w.get('winery','')} {w.get('wine_name','')}", "sb_match": m, "rating": w.get("rating",0)} for w, m in on_sb],
    }
    json.dump(result, open(OUTPUT_FILE, "w"), ensure_ascii=False, indent=2)
    print(f"\nSaved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
