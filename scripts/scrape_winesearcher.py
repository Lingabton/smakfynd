#!/usr/bin/env python3
"""
Scrape Wine-Searcher Pro for critic scores.
Uses a persistent Chrome profile with your logged-in WS Pro session.

First run:  python3 scripts/scrape_winesearcher.py --login
Then:       python3 scripts/scrape_winesearcher.py --test 10
Full run:   python3 scripts/scrape_winesearcher.py
"""

import json, time, re, sys, argparse
from pathlib import Path
from playwright.sync_api import sync_playwright

DATA_DIR = Path(__file__).parent.parent / "data"
SB_FILE = DATA_DIR / "systembolaget_raw.json"
CACHE_FILE = DATA_DIR / "winesearcher_cache.json"
CHROME_PROFILE = str(Path.home() / ".ws-chrome-profile")
RATE_LIMIT = 8

COUNTRY_MAP = {
    'Italien': 'Italy', 'Frankrike': 'France', 'Spanien': 'Spain',
    'USA': 'US', 'Tyskland': 'Germany', 'Sydafrika': 'South+Africa',
    'Portugal': 'Portugal', 'Chile': 'Chile', 'Australien': 'Australia',
    'Argentina': 'Argentina', 'Nya Zeeland': 'New+Zealand',
    'Österrike': 'Austria', 'Grekland': 'Greece', 'Ungern': 'Hungary',
}

RECOGNIZED_CRITICS = [
    'James Suckling', 'Falstaff', 'Decanter', 'Jancis Robinson',
    'Wine Enthusiast', 'Wine Spectator', 'Robert Parker', 'Wine Advocate',
    'Vinous', 'Tim Atkin', 'Antonio Galloni', 'Vinum Wine Magazine',
    'Gismondi on Wine', 'Owen Bargreen', 'Cameron Douglas',
    'Patricio Tapia', 'Revista Adega', 'Guia Penin',
    'Lisa Perrotti-Brown', 'Neal Martin', 'Luis Gutierrez',
    'Stephan Reinhardt', 'Monica Larner', 'Jeff Leve',
    'Jane Anson', 'Huon Hooke', 'Bob Campbell',
    'Gambero Rosso', 'Gilbert & Gaillard', 'Luca Maroni',
    'Wine & Spirits', 'Halliday Wine Companion',
]

def load_cache():
    if CACHE_FILE.exists():
        return json.load(open(CACHE_FILE))
    return {}

def save_cache(cache):
    json.dump(cache, open(CACHE_FILE, 'w'), ensure_ascii=False, indent=1)

def build_search_queries(wine):
    """Build multiple search queries to try, from specific to broad."""
    name = wine.get('name', '').replace(' ', '+')
    sub = wine.get('sub', '').replace(' ', '+')
    grape = wine.get('grape', '').split(',')[0].strip().replace(' ', '+')
    country = COUNTRY_MAP.get(wine.get('country', ''), '')
    region = wine.get('region', '').replace(' ', '+')

    queries = []
    # Try 1: name + grape + country (most specific)
    queries.append('+'.join(p for p in [name, grape, country] if p))
    # Try 2: name + sub (e.g. "Catena" + "Malbec")
    if sub and sub != grape:
        queries.append('+'.join(p for p in [name, sub] if p))
    # Try 3: just name + country
    queries.append('+'.join(p for p in [name, country] if p))
    # Try 4: just name
    queries.append(name)

    # Deduplicate while preserving order
    seen = set()
    result = []
    for q in queries:
        if q and q not in seen:
            seen.add(q)
            result.append(f"https://www.wine-searcher.com/find/{q}")
    return result

def wait_captcha(page, timeout=120):
    for i in range(timeout):
        try:
            body = page.inner_text('body')
            if 'Press & Hold' not in body and 'confirm you are' not in body:
                return True
        except:
            pass
        if i == 0:
            print("  CAPTCHA — lös den!", flush=True)
        time.sleep(1)
    return False

def parse_critic_section(text):
    """Parse critic scores from page text."""
    result = {
        'aggregate_score': None,
        'num_scores': 0,
        'critics': [],
        'user_rating': None,
        'user_count': 0,
        'style': None,
    }

    # Style
    style_m = re.search(r'Style\n(.+)', text)
    if style_m:
        result['style'] = style_m.group(1).strip()

    # User rating from top of page: "4\nfrom 529 User Ratings"
    user_m = re.search(r'(\d(?:\.\d)?)\nfrom\s+(\d[\d,]*)\s+User Ratings?', text)
    if user_m:
        result['user_rating'] = float(user_m.group(1))
        result['user_count'] = int(user_m.group(2).replace(',', ''))

    # Cut to critics section only
    start = text.find('Critics Scores')
    end = text.find('User Ratings (')
    if start < 0:
        return result
    section = text[start:end] if end > start else text[start:]

    # Aggregate: first "N / 100\nN scores" in section
    agg = re.search(r'(\d{2,3})\s*/\s*100\n\s*(\d+)\s*scores?', section)
    if agg:
        result['aggregate_score'] = int(agg.group(1))
        result['num_scores'] = int(agg.group(2))

    # Individual critics
    lines = section.split('\n')
    # Skip past the aggregate/histogram (find first "About" which ends first review)
    first_about = next((i for i, l in enumerate(lines) if 'About ' in l), 0)
    # Actually parse from after histogram — find "0 - 74" line which ends histogram
    hist_end = 0
    for i, l in enumerate(lines):
        if '0 - 74' in l:
            hist_end = i + 2  # skip the count after it
            break

    for i in range(hist_end, len(lines)):
        line_s = lines[i].strip()
        m = re.match(r'^(\d{1,3}(?:\.\d)?)\s*/\s*(100|20)$', line_s)
        if not m:
            continue

        score_raw = float(m.group(1))
        scale = int(m.group(2))

        if i + 1 >= len(lines):
            continue
        critic = lines[i + 1].strip()

        # Skip noise
        if len(critic) < 3 or critic.startswith('About') or 'score' in critic.lower():
            continue

        score_100 = round(score_raw * 5) if scale == 20 else int(score_raw)
        if score_100 < 50 or score_100 > 100:
            continue

        # Vintage
        vintage = None
        if i + 2 < len(lines):
            vm = re.search(r'(\d{4})\s*Vintage', lines[i + 2])
            if vm:
                vintage = int(vm.group(1))

        is_recognized = any(rc.lower() in critic.lower() for rc in RECOGNIZED_CRITICS)

        result['critics'].append({
            'critic': critic,
            'score': score_100,
            'score_raw': f"{m.group(1)}/{m.group(2)}",
            'vintage': vintage,
            'recognized': is_recognized,
        })

    return result

def navigate_to_wine_page(page):
    """From search results, navigate to the first wine's review page."""
    try:
        # Step 1: Click "Products" tab if we're on Prices tab
        products_tab = page.query_selector('text=Products')
        if products_tab:
            products_tab.click()
            time.sleep(3)
            if not wait_captcha(page):
                return False

        # Step 2: Find wine links in products list
        # WS product links look like /find/wine-name/...
        body = page.inner_text('body')

        # Look for clickable wine names — they're usually in card-like elements
        selectors = [
            'a[class*="wine"]',
            'a[class*="name"]',
            'a[href*="/find/"][href*="/"]',  # wine detail links have extra path
        ]
        for sel in selectors:
            links = page.query_selector_all(sel)
            for link in links:
                href = link.get_attribute('href') or ''
                text = (link.inner_text() or '').strip()
                # Skip nav links, short text, and price links
                if len(text) < 3 or 'find more' in text.lower() or 'search' in text.lower():
                    continue
                if '/find/' in href and text:
                    link.click()
                    time.sleep(3)
                    return wait_captcha(page)

        # Fallback: look for any link under a heading-like element
        links = page.query_selector_all('a[href*="/find/"]')
        for link in links:
            href = link.get_attribute('href') or ''
            text = (link.inner_text() or '').strip()
            # Wine detail pages have longer paths
            parts = href.replace('https://www.wine-searcher.com', '').split('/')
            if len(parts) >= 3 and len(text) > 5 and text[0].isupper():
                link.click()
                time.sleep(3)
                return wait_captcha(page)
    except:
        pass
    return False

def parse_products_page(text):
    """Extract scores from Products tab listing."""
    result = {
        'aggregate_score': None,
        'num_scores': 0,
        'critics': [],
        'user_rating': None,
        'user_count': 0,
        'style': None,
        'source': 'products_tab',
    }

    # Products page shows wines with scores like "91 / 100" after each wine name
    lines = text.split('\n')
    scores = []
    for i, line in enumerate(lines):
        m = re.match(r'^\s*(\d{2,3})\s*/\s*100\s*$', line.strip())
        if m:
            score = int(m.group(1))
            if 50 <= score <= 100:
                # Get wine name from a few lines above
                wine_name = ""
                for j in range(max(0, i-3), i):
                    candidate = lines[j].strip()
                    if candidate and len(candidate) > 5 and not candidate.startswith(('Searching', 'Sweden', 'Verified')):
                        wine_name = candidate
                scores.append({'score': score, 'name': wine_name})

    if scores:
        # Use the first/best score as aggregate
        result['aggregate_score'] = scores[0]['score']
        result['num_scores'] = len(scores)
        result['products'] = scores

    return result

def scrape_wine(page, wine):
    queries = build_search_queries(wine)

    for url in queries:
        page.goto(url)
        time.sleep(RATE_LIMIT)
        if not wait_captcha(page):
            return None

        body = page.inner_text('body')

        # Strategy 1: We landed directly on a wine page (has Reviews tab + Critic Reviews)
        if 'Critic Review' in body or ('User Rating' in body and '/ 100' in body and 'Showing results' not in body):
            # Click Reviews tab
            try:
                page.click('text=Reviews')
                time.sleep(3)
                if not wait_captcha(page):
                    return None
                try:
                    see_more = page.query_selector('text=See more')
                    if see_more:
                        see_more.click()
                        time.sleep(2)
                except: pass
                body = page.inner_text('body')
            except: pass

            result = parse_critic_section(body)
            if result.get('aggregate_score'):
                result['query'] = url
                return result

        # Strategy 2: We're on search results — click Products tab and scrape scores from listing
        if 'Showing results' in body or 'Products' in body:
            try:
                products_tab = page.query_selector('text=Products')
                if products_tab:
                    products_tab.click()
                    time.sleep(3)
                    if not wait_captcha(page):
                        return None
                    body = page.inner_text('body')

                    result = parse_products_page(body)
                    if result.get('aggregate_score'):
                        result['query'] = url
                        return result
            except: pass

        # Strategy 3: Navigate into first wine from Products tab
        if navigate_to_wine_page(page):
            if not wait_captcha(page):
                return None
            try:
                page.click('text=Reviews')
                time.sleep(3)
                wait_captcha(page)
                try:
                    see_more = page.query_selector('text=See more')
                    if see_more:
                        see_more.click()
                        time.sleep(2)
                except: pass
            except: pass

            body = page.inner_text('body')
            result = parse_critic_section(body)
            if result.get('aggregate_score'):
                result['query'] = url
                return result

    # Nothing worked
    return {'aggregate_score': None, 'critics': [], 'query': queries[0] if queries else ''}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--test', type=int, default=0)
    parser.add_argument('--offset', type=int, default=0)
    parser.add_argument('--login', action='store_true', help='Just open browser for login')
    args = parser.parse_args()

    if args.login:
        with sync_playwright() as p:
            browser = p.chromium.launch_persistent_context(
                user_data_dir=CHROME_PROFILE, headless=False,
                args=['--disable-blink-features=AutomationControlled'],
            )
            page = browser.pages[0] if browser.pages else browser.new_page()
            page.goto('https://www.wine-searcher.com/login')
            print("Logga in i browsern. Stäng fönstret när du är klar.")
            try:
                page.wait_for_event('close', timeout=600_000)
            except:
                pass
            try:
                browser.close()
            except:
                pass
        print("Session sparad!")
        return

    sb = json.load(open(SB_FILE))
    wines = [p for p in sb if p.get('cat1') == 'Vin' and p.get('assortment') == 'Fast sortiment']
    print(f"Fast sortiment: {len(wines)} viner")

    # Sort by Smakfynd ranking so top wines get scraped first
    ranked_file = DATA_DIR / "smakfynd_ranked_v2.json"
    if ranked_file.exists():
        ranked = json.load(open(ranked_file))
        rank_order = {str(p.get('nr','')): i for i, p in enumerate(ranked)}
        wines.sort(key=lambda p: rank_order.get(str(p.get('nr','')), 99999))
        print("Sorted by Smakfynd rank (top wines first)")

    cache = load_cache()
    print(f"Cache: {len(cache)} entries")

    if args.offset:
        wines = wines[args.offset:]
    if args.test:
        wines = wines[:args.test]
        print(f"Test: {args.test} viner")

    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            user_data_dir=CHROME_PROFILE, headless=False, slow_mo=200,
            args=['--disable-blink-features=AutomationControlled'],
        )
        page = browser.pages[0] if browser.pages else browser.new_page()

        # Verify login
        page.goto('https://www.wine-searcher.com')
        time.sleep(5)
        wait_captcha(page)
        body = page.inner_text('body')
        if 'Gabriel' not in body and 'PRO' not in body and 'Account' not in body and 'Log Out' not in body:
            print("Inte inloggad! Kör --login först.")
            print(f"  (page snippet: {body[:200]})")
            browser.close()
            return

        print("PRO inloggad!\n")

        matched = skipped = no_score = errors = 0

        for i, wine in enumerate(wines):
            nr = str(wine.get('nr', ''))
            if nr in cache and cache[nr].get('aggregate_score') is not None:
                skipped += 1
                continue

            name = wine.get('name', '')
            print(f"[{i+1}/{len(wines)}] {name[:35]}...", end=" ", flush=True)

            try:
                result = scrape_wine(page, wine)
                if result and result.get('aggregate_score'):
                    rec = [c for c in result.get('critics', []) if c.get('recognized')]
                    cache[nr] = {**result, 'sb_name': name}
                    matched += 1
                    print(f"✓ {result['aggregate_score']}/100 ({len(rec)} recognized critics)")
                elif result:
                    cache[nr] = {**result, 'sb_name': name}
                    no_score += 1
                    print("– no scores")
                else:
                    errors += 1
                    print("✗ error")
            except Exception as e:
                errors += 1
                print(f"✗ {str(e)[:60]}")

            if (matched + no_score + errors) % 10 == 0 and (matched + no_score + errors) > 0:
                save_cache(cache)

        browser.close()

    save_cache(cache)
    with_scores = sum(1 for v in cache.values() if v.get('aggregate_score'))
    print(f"\n{'='*50}")
    print(f"  Med scores:  {matched} (totalt {with_scores} i cache)")
    print(f"  Utan scores: {no_score}")
    print(f"  Errors:      {errors}")
    print(f"  Skipped:     {skipped}")
    print(f"  Cache:       {len(cache)} entries")
    print(f"  Sparat:      {CACHE_FILE}")
    print(f"{'='*50}")

if __name__ == "__main__":
    main()
