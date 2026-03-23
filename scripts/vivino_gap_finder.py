#!/usr/bin/env python3
"""
VIVINO GAP FINDER
Finds high-rated wines on Vivino that are NOT sold on Systembolaget.
Perfect for finding import opportunities.

Uses Playwright (visible browser) to browse Vivino's explore pages,
then cross-references against your Systembolaget product database.

Usage:
  python3 vivino_gap_finder.py                    # Full run
  python3 vivino_gap_finder.py --region sicily     # Only Sicily
  python3 vivino_gap_finder.py --type red          # Only red wines
"""
import json, os, sys, time, re
from rapidfuzz import fuzz

# --- Config ---
DATA_DIR = os.path.expanduser("~/smakfynd/data")
SB_FILE = os.path.join(DATA_DIR, "systembolaget_raw.json")
OUTPUT_FILE = os.path.join(DATA_DIR, "vivino_gaps.json")

# Vivino explore URLs for different Italian regions/categories
EXPLORE_URLS = {
    "sicily_red": "https://www.vivino.com/explore?e=eJzLLbI11rNQy83MyclRy0nNTQYAMh4Fhw%3D%3D&min_rating=3.8&order_by=ratings_average&order=desc&wine_type_ids[]=1&country_ids[]=75&region_ids[]=257",
    "sicily_white": "https://www.vivino.com/explore?e=eJzLLbI11rNQy83MyclRy0nNTQYAMh4Fhw%3D%3D&min_rating=3.8&order_by=ratings_average&order=desc&wine_type_ids[]=2&country_ids[]=75&region_ids[]=257",
    "puglia_red": "https://www.vivino.com/explore?min_rating=3.8&order_by=ratings_average&order=desc&wine_type_ids[]=1&country_ids[]=75&region_ids[]=258",
    "tuscany_red": "https://www.vivino.com/explore?min_rating=4.0&order_by=ratings_average&order=desc&wine_type_ids[]=1&country_ids[]=75&region_ids[]=253",
    "piedmont_red": "https://www.vivino.com/explore?min_rating=4.0&order_by=ratings_average&order=desc&wine_type_ids[]=1&country_ids[]=75&region_ids[]=251",
    "abruzzo_red": "https://www.vivino.com/explore?min_rating=3.8&order_by=ratings_average&order=desc&wine_type_ids[]=1&country_ids[]=75&region_ids[]=263",
    "italy_top_red": "https://www.vivino.com/explore?min_rating=4.2&order_by=ratings_count&order=desc&wine_type_ids[]=1&country_ids[]=75",
    "italy_top_white": "https://www.vivino.com/explore?min_rating=4.0&order_by=ratings_count&order=desc&wine_type_ids[]=2&country_ids[]=75",
    "italy_organic_red": "https://www.vivino.com/explore?min_rating=3.8&order_by=ratings_average&order=desc&wine_type_ids[]=1&country_ids[]=75&certified_organic=true",
}

def parse_explore_page(text):
    """Parse wine data from Vivino explore page innerText."""
    wines = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    i = 0
    current = {}
    
    while i < len(lines):
        line = lines[i]
        
        # Rating pattern: "4,3" or "4.3" standalone
        rating_match = re.match(r'^(\d)[,.](\d)$', line)
        if rating_match:
            current['rating'] = float(f"{rating_match.group(1)}.{rating_match.group(2)}")
            i += 1
            continue
        
        # Review count: "1 136 betyg" or "(baserat på alla årgångar)"
        review_match = re.match(r'^([\d\s]+)\s*betyg', line)
        if review_match:
            current['reviews'] = int(review_match.group(1).replace(' ', ''))
            i += 1
            continue
        
        if 'baserat på alla' in line:
            current['reviews'] = -1  # aggregate
            i += 1
            continue
        
        # Price: "169 kr" or "1 299 kr"
        price_match = re.match(r'^([\d\s]+)\s*kr$', line)
        if price_match:
            # End of wine block
            if current.get('winery') and current.get('rating', 0) >= 3.5:
                wines.append(current.copy())
            current = {}
            i += 1
            continue
        
        # Region line: "Puglia, Italien" 
        if ',' in line and len(line) < 50:
            parts = [p.strip() for p in line.split(',')]
            if len(parts) >= 2 and all(len(p) < 25 for p in parts):
                current['region'] = line
                i += 1
                continue
        
        # Skip navigation/filter lines
        skip_words = ['Filteralternativ', 'Vintyp', 'Rött vin', 'Vitt vin', 'Sortera',
                      'Land', 'Druva', 'Mat', 'Pris', 'Betyg', 'Visa mer', 'Lägg till',
                      'Levererar till', 'Sverige', 'Språk', 'Svenska', 'Viner',
                      'Erbjudanden', 'Passar till', 'Druvor', 'Regioner', 'Premium',
                      'Producenter', 'kr/flaska', 'Ekologisk', 'Min betyg', 'Alla betyg',
                      'Visar', 'resultat', 'Föregående', 'Nästa']
        if any(line.startswith(sw) for sw in skip_words) or len(line) < 2:
            i += 1
            continue
        
        # Otherwise: wine name lines
        # First non-skip line after a price = new winery name
        if 'winery' not in current:
            current['winery'] = line
        elif 'wine_name' not in current:
            current['wine_name'] = line
        else:
            # Additional name part (year, sub-designation)
            current['wine_name'] = current.get('wine_name', '') + ' ' + line
        
        i += 1
    
    # Last wine
    if current.get('winery') and current.get('rating', 0) >= 3.5:
        wines.append(current)
    
    return wines

def load_sb_names(sb_file):
    """Load Systembolaget product names for matching."""
    products = json.load(open(sb_file))
    sb_names = set()
    sb_details = []
    for p in products:
        full = f"{p.get('name','')} {p.get('sub','')}".strip().lower()
        sb_names.add(full)
        sb_details.append({
            'name': p.get('name', ''),
            'sub': p.get('sub', ''),
            'full': full,
            'producer': p.get('name', '').lower(),
        })
    return sb_names, sb_details

def is_on_systembolaget(wine, sb_names, sb_details):
    """Check if a Vivino wine exists on Systembolaget using fuzzy matching."""
    winery = wine.get('winery', '').lower()
    wine_name = wine.get('wine_name', '').lower()
    search = f"{winery} {wine_name}".strip()
    
    # Quick exact-ish check
    for sb in sb_names:
        if fuzz.token_set_ratio(search, sb) > 80:
            return True, sb
    
    # Check by producer name only
    for detail in sb_details:
        if fuzz.partial_ratio(winery, detail['full']) > 85:
            return True, detail['full']
    
    return False, None

def main():
    # Parse args
    region_filter = None
    type_filter = None
    for i, arg in enumerate(sys.argv):
        if arg == '--region' and i + 1 < len(sys.argv):
            region_filter = sys.argv[i + 1].lower()
        if arg == '--type' and i + 1 < len(sys.argv):
            type_filter = sys.argv[i + 1].lower()
    
    # Filter URLs
    urls_to_check = {}
    for key, url in EXPLORE_URLS.items():
        if region_filter and region_filter not in key:
            continue
        if type_filter and type_filter not in key:
            continue
        urls_to_check[key] = url
    
    if not urls_to_check:
        urls_to_check = EXPLORE_URLS
    
    print(f"Categories to scan: {list(urls_to_check.keys())}")
    
    # Load SB data
    print(f"\nLoading Systembolaget data from {SB_FILE}...")
    sb_names, sb_details = load_sb_names(SB_FILE)
    print(f"  {len(sb_names)} products loaded")
    
    # Launch browser
    from playwright.sync_api import sync_playwright
    
    all_vivino_wines = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900},
            locale="sv-SE",
        )
        page = context.new_page()
        
        for category, url in urls_to_check.items():
            print(f"\n=== Scanning: {category} ===")
            
            try:
                page.goto(url, timeout=20000)
                page.wait_for_timeout(4000)
                
                # Scroll to load more wines
                for _ in range(5):
                    page.evaluate("window.scrollBy(0, 800)")
                    page.wait_for_timeout(1000)
                
                # Get text
                text = page.evaluate("() => document.body.innerText")
                
                wines = parse_explore_page(text)
                print(f"  Found {len(wines)} wines on page")
                
                for w in wines:
                    w['category'] = category
                    all_vivino_wines.append(w)
                    
            except Exception as e:
                print(f"  Error: {e}")
            
            time.sleep(3)
        
        browser.close()
    
    # Deduplicate
    seen = set()
    unique = []
    for w in all_vivino_wines:
        key = f"{w.get('winery','')}|{w.get('wine_name','')}"
        if key not in seen:
            seen.add(key)
            unique.append(w)
    
    print(f"\n=== RESULTS ===")
    print(f"Total unique wines found: {len(unique)}")
    
    # Cross-reference with Systembolaget
    gaps = []
    on_sb = []
    
    for w in unique:
        found, match = is_on_systembolaget(w, sb_names, sb_details)
        if found:
            on_sb.append(w)
        else:
            gaps.append(w)
    
    # Sort gaps by rating
    gaps.sort(key=lambda x: (-x.get('rating', 0), -x.get('reviews', 0)))
    
    print(f"\nAlready on Systembolaget: {len(on_sb)}")
    print(f"NOT on Systembolaget (gaps): {len(gaps)}")
    
    print(f"\n{'='*80}")
    print(f" TOP IMPORT OPPORTUNITIES — High Vivino rating, NOT on Systembolaget")
    print(f"{'='*80}")
    
    for i, w in enumerate(gaps[:40]):
        rev_str = f"{w['reviews']:,}" if w.get('reviews', 0) > 0 else "aggregate"
        region = w.get('region', '?')
        cat = w.get('category', '')
        print(f"  {i+1:2d}. ★{w['rating']:.1f}  ({rev_str:>8s} reviews)  {w.get('winery','')[:25]:25s}  {w.get('wine_name','')[:30]:30s}  {region}")
    
    # Save full results
    result = {
        "scan_date": time.strftime("%Y-%m-%d"),
        "total_scanned": len(unique),
        "on_systembolaget": len(on_sb),
        "gaps": len(gaps),
        "opportunities": gaps,
        "already_on_sb": [{"winery": w.get("winery"), "name": w.get("wine_name"), "rating": w.get("rating")} for w in on_sb],
    }
    json.dump(result, open(OUTPUT_FILE, "w"), ensure_ascii=False, indent=2)
    print(f"\nFull results saved to {OUTPUT_FILE}")
    
    # Sicily-specific summary
    sicily_gaps = [w for w in gaps if 'sicil' in w.get('region', '').lower() or 'sicil' in w.get('category', '').lower()]
    if sicily_gaps:
        print(f"\n{'='*80}")
        print(f" SICILY OPPORTUNITIES ({len(sicily_gaps)} wines)")
        print(f"{'='*80}")
        for i, w in enumerate(sicily_gaps[:20]):
            rev_str = f"{w['reviews']:,}" if w.get('reviews', 0) > 0 else "agg"
            print(f"  {i+1:2d}. ★{w['rating']:.1f}  ({rev_str:>8s})  {w.get('winery','')[:25]:25s}  {w.get('wine_name','')[:30]}")

if __name__ == "__main__":
    main()
