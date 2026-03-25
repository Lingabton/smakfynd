#!/usr/bin/env python3
"""
Scrape CellarTracker community scores and match to Systembolaget wines.

CellarTracker has ~10M community tasting notes — great for crowd data.
No login required for basic scores.

Usage:
  Test:     python3 scripts/scrape_cellartracker.py --test 10
  Full run: python3 scripts/scrape_cellartracker.py
  Resume:   python3 scripts/scrape_cellartracker.py  (skips cached)
"""

import json, time, re, argparse
from pathlib import Path
from playwright.sync_api import sync_playwright

DATA_DIR = Path(__file__).parent.parent / "data"
SB_FILE = DATA_DIR / "systembolaget_raw.json"
CT_CACHE = DATA_DIR / "cellartracker_cache.json"
RATE_LIMIT = 3  # CT is less aggressive than WS

COUNTRY_MAP = {
    'Italien': 'Italy', 'Frankrike': 'France', 'Spanien': 'Spain',
    'USA': 'USA', 'Tyskland': 'Germany', 'Sydafrika': 'South Africa',
    'Portugal': 'Portugal', 'Chile': 'Chile', 'Australien': 'Australia',
    'Argentina': 'Argentina', 'Nya Zeeland': 'New Zealand',
    'Österrike': 'Austria', 'Grekland': 'Greece', 'Ungern': 'Hungary',
    'Libanon': 'Lebanon', 'Georgien': 'Georgia', 'Rumänien': 'Romania',
}

def load_cache():
    if CT_CACHE.exists():
        return json.load(open(CT_CACHE))
    return {}

def save_cache(cache):
    json.dump(cache, open(CT_CACHE, 'w'), ensure_ascii=False, indent=1)

def build_search_query(wine):
    """Build CT search URL from wine data."""
    name = wine.get('name', '')
    sub = wine.get('sub', '')
    grape = wine.get('grape', '').split(',')[0].strip()
    country = COUNTRY_MAP.get(wine.get('country', ''), '')

    # CT search: producer + wine name works best
    terms = []
    if name:
        terms.append(name)
    if sub and sub.lower() not in name.lower():
        terms.append(sub)

    query = ' '.join(terms)
    # Clean up for URL
    query = re.sub(r'[^\w\s]', '', query).strip()
    query = '+'.join(query.split())

    return f"https://www.cellartracker.com/list.asp?szSearch={query}"

def parse_search_results(text):
    """Parse CT search results page for wine scores."""
    results = []
    lines = text.split('\n')

    for i, line in enumerate(lines):
        line_s = line.strip()

        # CT shows scores as "X.X" (e.g., "89.2" or "91")
        # Look for community score patterns near wine names
        score_m = re.match(r'^(\d{2,3}(?:\.\d)?)\s*$', line_s)
        if not score_m:
            continue

        score = float(score_m.group(1))
        if score < 70 or score > 100:
            continue

        # Look for wine name nearby (within 5 lines above)
        wine_name = None
        num_reviews = None
        for j in range(max(0, i - 8), i):
            prev = lines[j].strip()
            if not prev or len(prev) < 4:
                continue
            # Review count: "123 Notes" or "1,234 Notes"
            rev_m = re.match(r'^([\d,]+)\s+Notes?', prev)
            if rev_m:
                num_reviews = int(rev_m.group(1).replace(',', ''))
                continue
            # Skip UI elements
            if prev in ('Community', 'Score', 'Notes', 'My', 'Price', 'Vintage'):
                continue
            if re.match(r'^\d+$', prev):
                continue
            # Wine name: substantial text
            if len(prev) > 8 and not prev.startswith(('Sort', 'Filter', 'Search', 'Show')):
                wine_name = prev

        if wine_name:
            results.append({
                'name': wine_name,
                'score': score,
                'reviews': num_reviews,
            })

    return results

def parse_wine_page(text):
    """Parse an individual CT wine page for detailed scores."""
    result = {
        'community_score': None,
        'community_reviews': 0,
        'my_score': None,
    }

    # Community score: look for pattern like "90" near "Community"
    # CT format varies, try multiple patterns
    lines = text.split('\n')

    for i, line in enumerate(lines):
        line_s = line.strip()

        # "Community Score" followed by number
        if 'Community' in line_s:
            for j in range(i, min(len(lines), i + 5)):
                score_m = re.search(r'(\d{2,3}(?:\.\d)?)', lines[j].strip())
                if score_m:
                    score = float(score_m.group(1))
                    if 70 <= score <= 100:
                        result['community_score'] = score
                        break

        # Number of notes/reviews
        notes_m = re.search(r'([\d,]+)\s+(?:tasting\s+)?notes?', line_s, re.I)
        if notes_m:
            result['community_reviews'] = int(notes_m.group(1).replace(',', ''))

    return result

def scrape_wine(page, wine):
    """Search CT for a wine and extract score."""
    url = build_search_query(wine)
    page.goto(url)
    time.sleep(RATE_LIMIT)

    # Check if browser is still alive
    try:
        body = page.inner_text('body', timeout=10000)
    except:
        print("  browser lost!", end=" ", flush=True)
        return None

    # Check for CAPTCHA, block, or error pages
    if 'verify' in body.lower() or 'robot' in body.lower():
        print("  BLOCKED!", end=" ", flush=True)
        time.sleep(30)
        return None
    if '404' in body[:200] or 'not found' in body[:500].lower() or 'error' in body[:200].lower():
        return None
    if len(body) < 100:
        return None

    # Check if we landed on a single wine page (direct hit)
    if 'Community Score' in body or 'tasting notes' in body.lower():
        result = parse_wine_page(body)
        if result['community_score']:
            return result

    # Check search results
    results = parse_search_results(body)
    if results:
        # Return best match (first result is usually most relevant)
        best = results[0]
        return {
            'community_score': best['score'],
            'community_reviews': best.get('reviews', 0),
        }

    # Try clicking first result if there are links
    try:
        wine_links = page.query_selector_all('a[href*="wine.asp"]')
        for link in wine_links[:1]:
            href = link.get_attribute('href') or ''
            if 'iWine=' in href:
                link.click()
                time.sleep(RATE_LIMIT)
                body = page.inner_text('body')
                result = parse_wine_page(body)
                if result['community_score']:
                    return result
    except:
        pass

    return None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--test', type=int, default=0, help='Test with N wines')
    parser.add_argument('--offset', type=int, default=0, help='Skip first N wines')
    args = parser.parse_args()

    sb = json.load(open(SB_FILE))
    wines = [p for p in sb if p.get('cat1') == 'Vin' and p.get('assortment') == 'Fast sortiment']
    print(f"Fast sortiment: {len(wines)} viner")

    # Sort by price (most expensive first — more likely to be on CT)
    wines.sort(key=lambda p: -(p.get('price', 0) or 0))
    print(f"Sorted by price (highest first): {wines[0].get('name','')} {wines[0].get('price',0)} kr")

    cache = load_cache()
    print(f"Cache: {len(cache)} entries")

    if args.offset:
        wines = wines[args.offset:]
    if args.test:
        wines = wines[:args.test]
        print(f"Test: {args.test} viner")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=['--disable-blink-features=AutomationControlled'],
        )
        ctx = browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        page = ctx.new_page()

        matched = skipped = no_score = errors = 0

        for i, wine in enumerate(wines):
            nr = str(wine.get('nr', ''))
            if nr in cache and cache[nr].get('community_score') is not None:
                skipped += 1
                continue

            name = wine.get('name', '')
            sub = wine.get('sub', '')
            print(f"[{i+1}/{len(wines)}] {name} {sub[:20]}...", end=" ", flush=True)

            try:
                result = scrape_wine(page, wine)
                if result and result.get('community_score'):
                    cache[nr] = {
                        **result,
                        'sb_name': f"{name} {sub}".strip(),
                        'source': 'cellartracker',
                    }
                    matched += 1
                    print(f"✓ {result['community_score']} ({result.get('community_reviews', '?')} notes)")
                else:
                    cache[nr] = {'community_score': None, 'sb_name': f"{name} {sub}".strip()}
                    no_score += 1
                    print("– no score")
            except Exception as e:
                errors += 1
                print(f"✗ {str(e)[:50]}")

            if (matched + no_score + errors) % 10 == 0 and (matched + no_score + errors) > 0:
                save_cache(cache)

        browser.close()

    save_cache(cache)
    with_scores = sum(1 for v in cache.values() if v.get('community_score'))
    print(f"\n{'='*50}")
    print(f"  Med scores:  {matched} (totalt {with_scores} i cache)")
    print(f"  Utan scores: {no_score}")
    print(f"  Errors:      {errors}")
    print(f"  Skipped:     {skipped}")
    print(f"  Cache:       {len(cache)} entries")
    print(f"  Sparat:      {CT_CACHE}")
    print(f"{'='*50}")

if __name__ == "__main__":
    main()
