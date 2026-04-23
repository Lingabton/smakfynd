#!/usr/bin/env python3
"""
Vivino matcher for Systembolaget wines using Playwright.
Searches Vivino for each wine, extracts rating from rendered page text.
Uses visible browser to bypass WAF/bot detection.

Usage:
  python3 vivino_playwright.py                    # Match all wines
  python3 vivino_playwright.py --test 10          # Test with first 10 wines
  python3 vivino_playwright.py --refresh-top 100  # Re-scrape top 100 wines by score
  python3 vivino_playwright.py --refresh-all      # Full cache refresh (monthly)
"""
import json, re, sys, time, os

from playwright.sync_api import sync_playwright
from rapidfuzz import fuzz

# --- Config ---
DATA_DIR = os.path.expanduser("~/smakfynd/data")
SB_FILE = os.path.join(DATA_DIR, "systembolaget_raw.json")
CACHE_FILE = os.path.join(DATA_DIR, "vivino_cache.json")
RATE_LIMIT = 4  # seconds between searches
MATCH_THRESHOLD = 65  # minimum fuzzy match score

def parse_search_results(text, query):
    """Parse wine results from Vivino search page innerText."""
    results = []
    
    # Split on "Resultat för" to get past the header
    parts = text.split("Resultat för")
    if len(parts) < 2:
        return results
    
    content = parts[1]
    
    # Pattern: wine blocks are separated by price lines (e.g. "169 kr")
    # Each block has: Winery\nWine Name Year\nRegion, Country\nRating\n(review info)\nPrice
    lines = [l.strip() for l in content.split('\n') if l.strip()]
    
    i = 0
    current_wine = {}
    
    while i < len(lines):
        line = lines[i]
        
        # Skip the count line like "(6)"
        if re.match(r'^\(\d+\)$', line):
            i += 1
            continue
        
        # Detect rating: a number like "4,0" or "4.1" or "3,8"
        rating_match = re.match(r'^(\d)[,.](\d)$', line)
        if rating_match:
            rating = float(f"{rating_match.group(1)}.{rating_match.group(2)}")
            current_wine['rating'] = rating
            i += 1
            continue
        
        # Detect review count: "(134 betyg)" or "(baserat på alla årgångar)" or "(1422 betyg)"
        review_match = re.match(r'^\((\d[\d\s]*)\s*betyg\)', line)
        if review_match:
            count_str = review_match.group(1).replace(' ', '')
            current_wine['reviews'] = int(count_str)
            i += 1
            continue
        
        if '(baserat på alla årgångar)' in line:
            current_wine['reviews'] = 0  # aggregate rating, unknown count
            i += 1
            continue
        
        # Detect price: "169 kr"
        price_match = re.match(r'^(\d[\d\s]*)\s*kr$', line)
        if price_match:
            # This ends a wine block - save if we have data
            if current_wine.get('name') and current_wine.get('rating'):
                results.append(current_wine.copy())
            current_wine = {}
            i += 1
            continue
        
        # Detect region line: "Puglia, Italien" or "Mendoza, Argentina"
        if ',' in line and len(line) < 60 and not line.startswith('('):
            parts_comma = line.split(',')
            if len(parts_comma) >= 2 and all(len(p.strip()) < 30 for p in parts_comma):
                current_wine['region'] = line
                i += 1
                continue
        
        # Otherwise it's a name line - accumulate
        if 'name' not in current_wine:
            current_wine['name'] = line
        else:
            # Append sub-name (e.g. "Primitivo 2025")
            current_wine['name'] += ' ' + line
        
        i += 1
    
    # Don't forget the last wine if no price followed
    if current_wine.get('name') and current_wine.get('rating'):
        results.append(current_wine.copy())
    
    return results

def find_best_match(sb_name, sb_sub, results):
    """Find the best fuzzy match from Vivino results."""
    search_name = f"{sb_name} {sb_sub}".strip()
    
    best_score = 0
    best_match = None
    
    for r in results:
        vname = r.get('name', '')
        # Try different matching strategies
        scores = [
            fuzz.token_sort_ratio(search_name.lower(), vname.lower()),
            fuzz.partial_ratio(search_name.lower(), vname.lower()),
            fuzz.token_set_ratio(search_name.lower(), vname.lower()),
        ]
        score = max(scores)
        if score > best_score:
            best_score = score
            best_match = r
    
    if best_score >= MATCH_THRESHOLD and best_match:
        return best_match, best_score
    return None, best_score

def main():
    # Parse args
    test_limit = None
    refresh_top = None
    refresh_all = "--refresh-all" in sys.argv
    if "--test" in sys.argv:
        idx = sys.argv.index("--test")
        test_limit = int(sys.argv[idx + 1]) if idx + 1 < len(sys.argv) else 10
    if "--refresh-top" in sys.argv:
        idx = sys.argv.index("--refresh-top")
        refresh_top = int(sys.argv[idx + 1]) if idx + 1 < len(sys.argv) else 100

    # Load products
    products = json.load(open(SB_FILE))
    wines = [p for p in products if p.get('cat1', '') != 'Öl' and p.get('cat1', '') != 'Cider']

    if test_limit:
        wines = wines[:test_limit]

    print(f"Wines to match: {len(wines)}")

    # Load cache
    cache = {}
    if os.path.exists(CACHE_FILE):
        cache = json.load(open(CACHE_FILE))
        good = sum(1 for v in cache.values() if v.get('vivino_rating', 0) > 0)
        print(f"Cache: {len(cache)} entries, {good} with ratings")

    # Build set of keys to force-refresh
    refresh_keys = set()
    if refresh_all:
        print("MODE: Full cache refresh — re-scraping all wines")
        refresh_keys = set(cache.keys())
    elif refresh_top:
        # Load scored data to find top wines by smakfynd_score
        scored_file = os.path.join(DATA_DIR, "smakfynd_ranked_v2.json")
        if os.path.exists(scored_file):
            scored = json.load(open(scored_file))
            top_wines = sorted(scored, key=lambda w: -(w.get('smakfynd_score', 0) or 0))[:refresh_top]
            for w in top_wines:
                key = f"{w.get('name','')}|{w.get('sub','')}|{w.get('country','')}"
                refresh_keys.add(key)
            print(f"MODE: Refreshing top {refresh_top} wines by score ({len(refresh_keys)} keys)")
        else:
            print(f"WARNING: {scored_file} not found — falling back to gap-only mode")

    # Launch browser
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900},
            locale="sv-SE",
        )
        page = context.new_page()

        matched = 0
        skipped = 0
        no_match = 0
        refreshed = 0

        for idx, wine in enumerate(wines):
            key = f"{wine['name']}|{wine.get('sub','')}|{wine.get('country','')}"

            # Skip if cached (unless marked for refresh)
            if key in cache and key not in refresh_keys:
                skipped += 1
                if (idx + 1) % 50 == 0:
                    print(f"  [{idx+1}/{len(wines)}] Progress: {matched} matched, {skipped} cached, {no_match} no match")
                continue

            is_refresh = key in refresh_keys
            if is_refresh:
                refreshed += 1
            
            # Build search query: "name sub" (e.g. "Doppio Passo Primitivo")
            query = f"{wine['name']} {wine.get('sub', '')}".strip()
            
            try:
                url = f"https://www.vivino.com/search/wines?q={query.replace(' ', '+')}"
                page.goto(url, timeout=15000)
                page.wait_for_timeout(3000)  # Wait for content to render
                
                # Get visible text
                text = page.evaluate("() => document.body.innerText")
                
                # Parse results
                results = parse_search_results(text, query)
                
                if results:
                    match, score = find_best_match(wine['name'], wine.get('sub', ''), results)
                    if match:
                        cache[key] = {
                            "vivino_rating": match['rating'],
                            "vivino_reviews": match.get('reviews', 0),
                            "vivino_name": match['name'],
                            "match_score": score,
                        }
                        matched += 1
                        tag = " ↻" if is_refresh else ""
                        print(f"  [{idx+1}/{len(wines)}] ✓{tag} {query[:40]} → {match['name'][:40]} ({match['rating']}, {score:.0f}%)")
                    else:
                        cache[key] = {"vivino_rating": 0, "vivino_reviews": 0}
                        no_match += 1
                else:
                    cache[key] = {"vivino_rating": 0, "vivino_reviews": 0}
                    no_match += 1
                
            except Exception as e:
                print(f"  [{idx+1}/{len(wines)}] ERROR: {query[:40]} - {e}")
                cache[key] = {"vivino_rating": 0, "vivino_reviews": 0}
                no_match += 1
            
            # Save cache every 10 wines
            if (idx + 1) % 10 == 0:
                json.dump(cache, open(CACHE_FILE, 'w'), ensure_ascii=False, indent=2)
                good = sum(1 for v in cache.values() if v.get('vivino_rating', 0) > 0)
                print(f"  [{idx+1}/{len(wines)}] Saved. Total: {good} matches, {no_match} no match")
            
            time.sleep(RATE_LIMIT)
        
        # Final save
        json.dump(cache, open(CACHE_FILE, 'w'), ensure_ascii=False, indent=2)
        good = sum(1 for v in cache.values() if v.get('vivino_rating', 0) > 0)
        print(f"\nDone! {good} matches out of {len(wines)} wines.")
        if refreshed:
            print(f"  Refreshed: {refreshed} wines re-scraped")
        
        browser.close()

if __name__ == "__main__":
    main()
