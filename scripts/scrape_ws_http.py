#!/usr/bin/env python3
"""
Scrape Wine-Searcher critic scores via Playwright browser.
Targets wines that have crowd scores but no expert scores.

Usage:
  python3 scripts/scrape_ws_http.py --test 20
  python3 scripts/scrape_ws_http.py
"""

import json, re, time, argparse
from pathlib import Path
from playwright.sync_api import sync_playwright

DATA_DIR = Path(__file__).parent.parent / "data"
SB_FILE = DATA_DIR / "systembolaget_raw.json"
CACHE_FILE = DATA_DIR / "ws_http_cache.json"
SCORED_FILE = DATA_DIR / "smakfynd_ranked_v2.json"
RATE_LIMIT = 5

def load_cache():
    if CACHE_FILE.exists():
        return json.load(open(CACHE_FILE))
    return {}

def save_cache(cache):
    json.dump(cache, open(CACHE_FILE, 'w'), ensure_ascii=False, indent=1)

def build_queries(name, sub, country, region, grape):
    """Build multiple search queries, most specific first."""
    queries = []
    # 1. Full: name + sub
    full = re.sub(r'[^\w\s]', ' ', f"{name} {sub}".strip()).strip()
    if full:
        queries.append(full)
    # 2. Name + region (e.g. "Bargemone Provence")
    if region:
        short = re.sub(r'[^\w\s]', ' ', f"{name} {region}").strip()
        if short != full:
            queries.append(short)
    # 3. Name + grape (e.g. "Mommessin Gamay")
    first_grape = (grape or '').split(',')[0].strip()
    if first_grape:
        grape_q = re.sub(r'[^\w\s]', ' ', f"{name} {first_grape}").strip()
        if grape_q not in queries:
            queries.append(grape_q)
    # 4. Just name
    just_name = re.sub(r'[^\w\s]', ' ', name).strip()
    if just_name not in queries:
        queries.append(just_name)
    return queries

def try_search(page, query):
    """Try one search query, return HTML or None."""
    url = f"https://www.wine-searcher.com/find/{'+'.join(query.split())}"
    try:
        page.goto(url, timeout=15000)
        page.wait_for_timeout(3000)
        return page.content()
    except:
        return None

def search_wine(page, name, sub, country="", region="", grape=""):
    """Search Wine-Searcher with multiple query strategies."""
    queries = build_queries(name, sub, country, region, grape)

    for i, query in enumerate(queries):
        html = try_search(page, query)
        if not html:
            continue

        if 'verify' in html.lower()[:2000] or 'captcha' in html.lower()[:2000] or 'Press & Hold' in html:
            return {"blocked": True}

        # Extract criticScore from JSON in HTML
        critic_match = re.search(r'"criticScore"\s*:\s*(\d+)', html)
        critic_score = int(critic_match.group(1)) if critic_match else None

        # Extract wine name
        title_match = re.search(r'"wineName"\s*:\s*"([^"]+)"', html)
        ws_name = title_match.group(1) if title_match else None

        # Extract individual critics
        critics = []
        critic_blocks = re.findall(r'"criticName"\s*:\s*"([^"]+)"[^}]*?"criticScore"\s*:\s*(\d+)', html)
        if not critic_blocks:
            critic_blocks = re.findall(r'"criticScore"\s*:\s*(\d+)[^}]*?"criticName"\s*:\s*"([^"]+)"', html)
            critic_blocks = [(n, s) for s, n in critic_blocks]

        seen = set()
        for cname, cscore in critic_blocks:
            score = int(cscore)
            if 70 <= score <= 100 and cname not in seen:
                critics.append({"critic": cname, "score": score})
                seen.add(cname)

        if critic_score or critics:
            tag = f" (q{i+1}/{len(queries)})" if i > 0 else ""
            return {
                "critic_score": critic_score,
                "critics": critics[:6],
                "ws_name": ws_name,
                "num_critics": len(critics),
                "query_used": query,
                "query_attempt": i + 1,
            }

        time.sleep(2)  # Brief pause between query attempts

    return None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--test', type=int, default=0)
    parser.add_argument('--force', action='store_true')
    parser.add_argument('--login', action='store_true', help='Open browser to solve CAPTCHA manually, then exit')
    args = parser.parse_args()

    if args.login:
        chrome_profile = str(Path.home() / ".ws-chrome-profile")
        with sync_playwright() as p:
            browser = p.chromium.launch_persistent_context(
                chrome_profile, headless=False,
                args=['--disable-blink-features=AutomationControlled'],
                viewport={"width": 1280, "height": 900},
            )
            page = browser.new_page()
            page.goto("https://www.wine-searcher.com/find/malbec")
            print("Lös CAPTCHAn i browsern, vänta tills sidan laddar, tryck sedan Enter här...")
            input()
            browser.close()
        print("Klar! Kör nu utan --login.")
        return

    scored = json.load(open(SCORED_FILE))

    needs_expert = [w for w in scored
                    if (not w.get('expert_score') or w['expert_score'] == 0)
                    and w.get('crowd_score', 0) >= 6.5
                    and w.get('assortment') == 'Fast sortiment']
    needs_expert.sort(key=lambda w: -(w.get('crowd_score', 0) or 0))
    print(f"Viner utan expert (crowd >= 6.5): {len(needs_expert)}")

    cache = load_cache()
    print(f"Cache: {len(cache)} entries")

    wines = needs_expert
    if args.test:
        wines = wines[:args.test]

    chrome_profile = str(Path.home() / ".ws-chrome-profile")

    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            chrome_profile,
            headless=False,
            args=['--disable-blink-features=AutomationControlled'],
            viewport={"width": 1280, "height": 900},
        )
        page = browser.new_page()

        matched = skipped = no_score = blocked = 0

        for i, wine in enumerate(wines):
            nr = str(wine.get('nr', ''))
            if nr in cache and not args.force:
                skipped += 1
                continue

            name = wine.get('name', '')
            sub = wine.get('sub', '')
            country = wine.get('country', '')
            region = wine.get('region', '')
            grape = wine.get('grape', '')
            print(f"[{i+1}/{len(wines)}] {name} {sub[:25]}...", end=" ", flush=True)

            result = search_wine(page, name, sub, country, region, grape)

            if result and result.get('blocked'):
                blocked += 1
                print("BLOCKED! Pausing 120s...")
                time.sleep(120)
                continue

            if result and (result.get('critic_score') or result.get('critics')):
                cache[nr] = {**result, 'sb_name': f"{name} {sub}".strip()}
                matched += 1
                cs = ", ".join(f"{c['critic']}:{c['score']}" for c in result.get('critics', [])[:3])
                qa = f" (q{result.get('query_attempt', 1)})" if result.get('query_attempt', 1) > 1 else ""
                print(f"✓{qa} {result.get('critic_score', '?')} [{cs}]")
            else:
                cache[nr] = {'critic_score': None, 'sb_name': f"{name} {sub}".strip()}
                no_score += 1
                print("–")

            if (matched + no_score) % 10 == 0 and (matched + no_score) > 0:
                save_cache(cache)
            time.sleep(RATE_LIMIT)

        browser.close()
    print(f"  Chrome-profil: {chrome_profile}")

    save_cache(cache)
    with_scores = sum(1 for v in cache.values() if v.get('critic_score') or v.get('critics'))
    print(f"\n{'='*50}")
    print(f"  Matchade:   {matched}")
    print(f"  Inga:       {no_score}")
    print(f"  Blockerade: {blocked}")
    print(f"  Skippade:   {skipped}")
    print(f"  Cache:      {with_scores}/{len(cache)} med scores")
    print(f"{'='*50}")

if __name__ == "__main__":
    main()
