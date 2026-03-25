#!/usr/bin/env python3
"""
Scrape Wine-Searcher critic pages for scores, then match to Systembolaget wines.

Strategy: Instead of searching 1500 wines one-by-one, we scrape the critics' own
pages which list wines with scores. Then we fuzzy-match back to SB wines.

Usage:
  First run:  python3 scripts/scrape_winesearcher.py --login   (reuses same Chrome profile)
  Then:       python3 scripts/scrape_ws_critics.py --test 1     (test with 1 critic)
  Full run:   python3 scripts/scrape_ws_critics.py
  Match only: python3 scripts/scrape_ws_critics.py --match-only (skip scraping, just re-match)
"""

import json, time, re, sys, argparse
from pathlib import Path
from playwright.sync_api import sync_playwright

DATA_DIR = Path(__file__).parent.parent / "data"
SB_FILE = DATA_DIR / "systembolaget_raw.json"
CACHE_FILE = DATA_DIR / "winesearcher_cache.json"
CRITICS_RAW = DATA_DIR / "ws_critics_raw.json"
CHROME_PROFILE = str(Path.home() / ".ws-chrome-profile")
RATE_LIMIT = 5

# Major critics with visible scores on WS
# URL: https://www.wine-searcher.com/{slug}?sort=ka&page=N
CRITICS = [
    ("Wine Spectator", "critics-9-wine+spectator"),
    ("Wine Enthusiast", "critics-8-wine+enthusiast"),
    ("James Suckling", "critics-47-james+suckling"),
    ("Decanter", "critics-11-decanter"),
    ("Falstaff", "critics-15-falstaff+magazine"),
    ("Vinous", "critics-6-vinous"),
    ("Guia Penin", "critics-41-guia+penin"),
    ("Gambero Rosso", "critics-39-gambero+rosso"),
]

def load_json(path):
    if path.exists():
        return json.load(open(path))
    return {}

def save_json(data, path):
    json.dump(data, open(path, 'w'), ensure_ascii=False, indent=1)

def wait_captcha(page, timeout=120):
    for i in range(timeout):
        try:
            body = page.inner_text('body')
            if 'Press & Hold' not in body and 'confirm you are' not in body:
                return True
        except:
            pass
        if i == 0:
            print("  CAPTCHA!", end=" ", flush=True)
        time.sleep(1)
    return False

def parse_critics_page(text, critic_name):
    """Parse wine entries from a critics listing page.

    Format per wine (5-6 lines):
      Wine Name, Region, Country
      Vintage (year)
      Popularity (e.g. "1st", "2nd")
      Price (e.g. "8,804 kr")
      (empty line)
      Score / 100
    """
    wines = []
    lines = text.split('\n')

    # Find the table start: after "/ 750ml" header line
    table_start = None
    for i, line in enumerate(lines):
        if '/ 750ml' in line:
            table_start = i + 1
            break

    if table_start is None:
        return wines

    # Find table end: pagination or footer
    table_end = len(lines)
    for i in range(table_start, len(lines)):
        if lines[i].strip() in ('«', 'Only the first', 'Other Critics', 'Related Stories'):
            table_end = i
            break

    # Parse entries: look for score lines and work backwards
    i = table_start
    while i < table_end:
        line_s = lines[i].strip()

        # Look for score pattern: "85 / 100"
        score_m = re.match(r'^(\d{2,3})\s*/\s*100$', line_s)
        if score_m:
            score = int(score_m.group(1))

            # Work backwards to find wine name, vintage, price
            wine_name = None
            vintage = None
            price = None
            for j in range(i - 1, max(table_start - 1, i - 8), -1):
                prev = lines[j].strip()
                if not prev:
                    continue
                # Skip "Wine Label of..." lines
                if prev.startswith('Wine Label of'):
                    continue
                # Vintage: just a year
                if re.match(r'^(19[5-9]\d|20[0-2]\d)$', prev):
                    vintage = int(prev)
                    continue
                # Price: "13 kr" or "8,804 kr"
                price_m = re.match(r'^([\d,]+)\s*kr$', prev)
                if price_m:
                    price = int(price_m.group(1).replace(',', ''))
                    continue
                # Popularity: "1st", "13,292nd", etc
                if re.match(r'^[\d,]+(st|nd|rd|th)$', prev):
                    continue
                # Dash = no score
                if prev == '—':
                    continue
                # Wine name: has comma (name, region, country)
                if len(prev) > 5 and ',' in prev and not prev[0].isdigit():
                    wine_name = prev
                    break

            if wine_name and score >= 70:
                parts = [p.strip() for p in wine_name.split(',')]
                name = parts[0] if parts else wine_name
                region = parts[1] if len(parts) > 1 else ''
                country = parts[-1] if len(parts) > 2 else (parts[1] if len(parts) > 1 else '')

                wines.append({
                    'name': name,
                    'full_name': wine_name,
                    'region': region,
                    'country': country,
                    'score': score,
                    'vintage': vintage,
                    'critic': critic_name,
                })

        i += 1

    return wines

def scrape_critic(page, critic_name, url_slug, max_pages=20):
    """Scrape all pages of a critic's wine list."""
    all_wines = []
    base_url = f"https://www.wine-searcher.com/{url_slug}"

    for pg in range(1, max_pages + 1):
        url = f"{base_url}?sort=pa&page={pg}" if pg > 1 else f"{base_url}?sort=pa"
        page.goto(url)
        time.sleep(RATE_LIMIT)

        if not wait_captcha(page):
            print(f"\n  CAPTCHA timeout on page {pg}")
            break

        body = page.inner_text('body')

        # Check if scores are visible (not all locked with "—")
        if pg == 1 and '/ 100' not in body:
            print(f"  No visible scores — skipping critic")
            break

        wines = parse_critics_page(body, critic_name)
        if not wines and pg > 1:
            break

        all_wines.extend(wines)
        print(f"  p{pg}: {len(wines)} wines", end="", flush=True)

        # Stop if this page had no wines (we've gone past the last page)
        if not wines:
            break

        # Check for "Only the first N pages shown" — respect the limit
        if 'Only the first' in body:
            pages_m = re.search(r'Only the first (\d+) pages', body)
            max_avail = int(pages_m.group(1)) if pages_m else 20
            if pg >= max_avail:
                print(f" (last page)", end="")
                break

        # Check for next page: look for » (next arrow) or page number in pagination
        html = page.content()
        has_next = f'page={pg + 1}' in html or '»' in body.split('Only')[0] if 'Only' in body else '»' in body
        if not has_next and pg > 1:
            print(f" (no more pages)", end="")
            break

    return all_wines

def normalize(s):
    """Normalize a wine name for matching."""
    s = s.lower().strip()
    s = re.sub(r'\b(19|20)\d{2}\b', '', s)
    # Remove common non-distinctive words
    s = re.sub(r'[^\w\s]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def word_overlap(a, b):
    """Calculate word overlap ratio between two strings."""
    wa = set(normalize(a).split())
    wb = set(normalize(b).split())
    if not wa or not wb:
        return 0
    # Grape/style words are too generic to count as real matches
    generic = {'de', 'la', 'le', 'du', 'des', 'el', 'los', 'di', 'del', 'il',
               'and', 'the', 'von', 'van', 'wine', 'vin', 'vino', 'wines',
               'estate', 'chateau', 'domaine', 'bodega', 'casa', 'red', 'white',
               'cabernet', 'sauvignon', 'merlot', 'chardonnay', 'pinot', 'noir',
               'blanc', 'shiraz', 'syrah', 'malbec', 'grenache', 'tempranillo',
               'riesling', 'zinfandel', 'rosado', 'tinto', 'branco', 'brut',
               'rose', 'prosecco', 'cava', 'rioja', 'reserva', 'reserve',
               'gran', 'grand', 'viejo', 'crianza', 'organic', 'vintage',
               'vineyards', 'winery', 'cellars', 'vinho', 'verde'}
    wa_clean = wa - generic
    wb_clean = wb - generic
    if not wa_clean or not wb_clean:
        return 0
    overlap = wa_clean & wb_clean
    # Require at least 2 meaningful word matches for longer names
    if len(wa_clean) >= 3 and len(overlap) < 2:
        return 0
    return len(overlap) / min(len(wa_clean), len(wb_clean))

def producer_name(wine_str):
    """Extract likely producer name (first 1-2 distinctive words)."""
    words = normalize(wine_str).split()
    generic = {'de', 'la', 'le', 'du', 'des', 'el', 'los', 'di', 'del', 'il',
               'and', 'the', 'von', 'van', 'chateau', 'domaine', 'bodega', 'casa',
               'bodegas', 'cantine', 'tenuta', 'fattoria', 'vignobles', 'maison'}
    result = []
    for w in words:
        if w not in generic and len(w) > 2:
            result.append(w)
            if len(result) >= 2:
                break
    return set(result)

def match_to_sb(critic_wines, sb_wines):
    """Match critic wines to Systembolaget wines."""
    sb_lookup = []
    for w in sb_wines:
        full = f"{w.get('name', '')} {w.get('sub', '')}".strip()
        sb_lookup.append((full, w))

    matches = {}
    matched_names = []

    for cw in critic_wines:
        best_score = 0
        best_sb = None

        # Get producer words from critic wine
        cw_producer = producer_name(cw['name'])

        for sb_full, sb_wine in sb_lookup:
            # First check: at least one producer word must appear in SB name
            sb_norm = normalize(sb_full)
            if cw_producer and not any(p in sb_norm.split() for p in cw_producer):
                continue

            overlap = word_overlap(cw['full_name'], sb_full)
            overlap2 = word_overlap(cw['name'], sb_full)
            score = max(overlap, overlap2)

            if score > best_score:
                best_score = score
                best_sb = sb_wine

        # Require strong match
        if best_score >= 0.6 and best_sb:
            nr = str(best_sb.get('nr', ''))
            sb_name = f"{best_sb.get('name', '')} {best_sb.get('sub', '')}".strip()

            if nr not in matches:
                matches[nr] = {
                    'aggregate_score': cw['score'],
                    'num_scores': 0,
                    'critics': [],
                    'sb_name': sb_name,
                    'match_confidence': round(best_score, 2),
                    'source': 'critics_page',
                }

            # Add this critic's score
            existing = matches[nr]['critics']
            if not any(c['critic'] == cw['critic'] for c in existing):
                existing.append({
                    'critic': cw['critic'],
                    'score': cw['score'],
                    'vintage': cw.get('vintage'),
                    'recognized': True,
                })
                matches[nr]['num_scores'] = len(existing)
                # Update aggregate to average of all critics
                matches[nr]['aggregate_score'] = round(
                    sum(c['score'] for c in existing) / len(existing)
                )
            matched_names.append(f"  {cw['name'][:40]:40s} → {sb_name[:30]:30s} ({cw['critic']}: {cw['score']})")

    return matches, matched_names

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--test', type=int, default=0, help='Test with N critics only')
    parser.add_argument('--match-only', action='store_true', help='Skip scraping, just re-match')
    parser.add_argument('--max-pages', type=int, default=20, help='Max pages per critic')
    args = parser.parse_args()

    sb = json.load(open(SB_FILE))
    sb_wines = [p for p in sb if p.get('cat1') == 'Vin']
    print(f"SB wines: {len(sb_wines)}")

    critics_raw = load_json(CRITICS_RAW)
    cache = load_json(CACHE_FILE)
    print(f"Existing cache: {len(cache)} entries")
    print(f"Existing critics raw: {sum(len(v) for v in critics_raw.values())} wines from {len(critics_raw)} critics")

    if not args.match_only:
        critics_to_scrape = CRITICS[:args.test] if args.test else CRITICS

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
                print("Inte inloggad! Kor: python3 scripts/scrape_winesearcher.py --login")
                browser.close()
                return

            print("Inloggad!\n")

            for critic_name, url_slug in critics_to_scrape:
                print(f"\n{'='*50}")
                print(f"Scraping: {critic_name}")

                wines = scrape_critic(page, critic_name, url_slug, max_pages=args.max_pages)
                critics_raw[critic_name] = wines
                save_json(critics_raw, CRITICS_RAW)

                print(f"\n  Total: {len(wines)} wines")

            browser.close()

    # Match
    print(f"\n{'='*50}")
    print("Matching to Systembolaget...")
    print(f"{'='*50}")

    all_critic_wines = []
    for critic, wines in critics_raw.items():
        all_critic_wines.extend(wines)
        print(f"  {critic}: {len(wines)} wines")
    print(f"Total critic wines: {len(all_critic_wines)}")

    matches, match_log = match_to_sb(all_critic_wines, sb_wines)
    print(f"\nMatched {len(matches)} SB wines:")
    for line in match_log[:30]:
        print(line)
    if len(match_log) > 30:
        print(f"  ... and {len(match_log) - 30} more")

    # Merge into cache
    new_count = 0
    for nr, data in matches.items():
        if nr not in cache or not cache[nr].get('aggregate_score'):
            cache[nr] = data
            new_count += 1
        else:
            # Merge critics
            existing_critics = cache[nr].get('critics', [])
            for c in data['critics']:
                if not any(ec.get('critic') == c['critic'] for ec in existing_critics):
                    existing_critics.append(c)
            cache[nr]['critics'] = existing_critics
            cache[nr]['num_scores'] = len(existing_critics)

    save_json(cache, CACHE_FILE)

    with_scores = sum(1 for v in cache.values() if v.get('aggregate_score'))
    print(f"\n{'='*50}")
    print(f"  New matches:       {new_count}")
    print(f"  Total with scores: {with_scores}")
    print(f"  Total cache:       {len(cache)} entries")
    print(f"  Saved:             {CACHE_FILE}")
    print(f"{'='*50}")

if __name__ == "__main__":
    main()
