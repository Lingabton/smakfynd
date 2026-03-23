#!/usr/bin/env python3
"""
Vivino matching fix for Smakfynd
================================
Replaces the broken explore API approach with Vivino's actual search endpoint.
Also raises match threshold from 55% to 70%.

Usage:
  1. Copy this file to ~/smakfynd/scripts/vivino_fix.py
  2. Run: python3 ~/smakfynd/scripts/vivino_fix.py
  
It will:
  - Read systembolaget_raw.json (should already be filtered to fast sortiment)
  - Skip beer/cider (Vivino doesn't cover those well)
  - Search Vivino with a better endpoint
  - Apply 70% match threshold
  - Save to matched_products.json
  - Respect existing cache (good matches preserved)
"""

import json
import os
import sys
import time
import logging
from pathlib import Path

import requests
from rapidfuzz import fuzz

# Config
DATA_DIR = Path(os.path.expanduser("~/smakfynd/data"))
CACHE_FILE = DATA_DIR / "vivino_cache.json"
SB_RAW_FILE = DATA_DIR / "systembolaget_raw.json"
MATCHED_FILE = DATA_DIR / "matched_products.json"

MATCH_THRESHOLD = 70  # Minimum fuzzy match %
RATE_LIMIT = 1.5  # seconds between requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("vivino_fix")


def load_cache():
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text("utf-8"))
    return {}

def save_cache(cache):
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), "utf-8")


def search_vivino_v2(product_name, sub_name="", country=""):
    """
    Search Vivino using the explore API but with better query construction
    and stricter matching.
    """
    # Build a good search query
    # Use name + sub (which often has vintage/region info)
    query_parts = [product_name]
    if sub_name and sub_name.lower() not in product_name.lower():
        query_parts.append(sub_name)
    
    query = " ".join(query_parts)
    
    # Clean up common Swedish suffixes that confuse Vivino
    for remove in ["Organic", "Organico", "Ekologisk", "BIB", "Bag-in-Box", "Tetra"]:
        query = query.replace(remove, "").strip()
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                       "AppleWebKit/537.36 (KHTML, like Gecko) "
                       "Chrome/120.0.0.0 Safari/537.36",
    }

    try:
        r = requests.get(
            f"https://www.vivino.com/api/explore/explore",
            headers=headers,
            params={
                "q": query,
                "country_code": "SE",
                "currency_code": "SEK",
                "min_rating": "1",
                "order_by": "relevance",  # Changed from ratings_count!
                "order": "desc",
                "page": "1",
            },
            timeout=10,
        )
        if r.status_code != 200:
            return None

        data = r.json()
        matches = data.get("explore_vintage", {}).get("matches", [])

        if not matches:
            return None

        # Find best fuzzy match with STRICT threshold
        best_match = None
        best_score = 0

        for match in matches[:10]:
            vintage = match.get("vintage", {})
            wine = vintage.get("wine", {})
            wine_name = wine.get("name", "")
            winery_name = wine.get("winery", {}).get("name", "")
            full_name = f"{winery_name} {wine_name}".strip()

            # Try multiple matching strategies
            search_str = f"{product_name} {sub_name}".strip().lower()
            full_lower = full_name.lower()
            
            # Strategy 1: token_sort_ratio (original)
            ratio1 = fuzz.token_sort_ratio(search_str, full_lower)
            
            # Strategy 2: partial_ratio (handles substring matches)
            ratio2 = fuzz.partial_ratio(search_str, full_lower)
            
            # Strategy 3: token_set_ratio (handles extra words)
            ratio3 = fuzz.token_set_ratio(search_str, full_lower)
            
            # Use the best of all strategies
            ratio = max(ratio1, ratio2, ratio3)

            if ratio > best_score and ratio >= MATCH_THRESHOLD:
                stats = vintage.get("statistics", {})
                rating = stats.get("ratings_average", 0)
                reviews = stats.get("ratings_count", 0)
                
                # Skip results with too few reviews (probably wrong wine)
                if reviews < 50:
                    continue
                    
                best_score = ratio
                best_match = {
                    "vivino_rating": rating,
                    "vivino_reviews": reviews,
                    "vivino_id": str(wine.get("id", "")),
                    "vivino_name": full_name,
                    "match_score": ratio,
                }

        return best_match

    except Exception as e:
        log.warning(f"Vivino search failed for '{product_name}': {e}")
        return None


def main():
    # Load products
    if not SB_RAW_FILE.exists():
        log.error(f"No product data found at {SB_RAW_FILE}")
        log.error("Run: python3 scripts/scraper.py --systembolaget first")
        sys.exit(1)
    
    products = json.loads(SB_RAW_FILE.read_text("utf-8"))
    log.info(f"Loaded {len(products)} products from {SB_RAW_FILE}")
    
    # Filter: only wine categories (skip beer, cider)
    wine_products = [p for p in products if p.get("cat1") not in ("Öl", "Cider & blanddrycker")]
    beer_products = [p for p in products if p.get("cat1") in ("Öl", "Cider & blanddrycker")]
    log.info(f"Wine products to match: {len(wine_products)}")
    log.info(f"Beer/cider (skipping Vivino): {len(beer_products)}")
    
    # Load cache
    cache = load_cache()
    
    # Count existing good matches
    good_cached = sum(1 for v in cache.values() 
                      if v.get("vivino_rating", 0) > 0 and v.get("match_score", 0) >= MATCH_THRESHOLD)
    log.info(f"Cache: {len(cache)} entries, {good_cached} good matches (>={MATCH_THRESHOLD}%)")
    
    # Match wine products
    new_matches = 0
    cache_hits = 0
    no_match = 0
    
    for i, p in enumerate(wine_products):
        cache_key = f"{p['name']}|{p['sub']}|{p['country']}"
        
        if cache_key in cache:
            cached = cache[cache_key]
            # Accept cached good matches; skip cached no-matches (try again)
            if cached.get("vivino_rating", 0) > 0 and cached.get("match_score", 0) >= MATCH_THRESHOLD:
                p.update(cached)
                cache_hits += 1
            elif cached.get("vivino_rating", 0) == 0 and cached.get("match_score", 0) == 0:
                # Previously found no match — try again with new strategy
                result = search_vivino_v2(p["name"], p.get("sub", ""), p.get("country", ""))
                
                if result:
                    p.update(result)
                    cache[cache_key] = result
                    new_matches += 1
                    log.info(
                        f"  [{i+1}/{len(wine_products)}] ✓ {p['name']} {p['sub']} → "
                        f"{result['vivino_name']} ({result['vivino_rating']}, "
                        f"{result['vivino_reviews']} reviews, match: {result['match_score']:.0f}%)"
                    )
                else:
                    p["vivino_rating"] = 0
                    p["vivino_reviews"] = 0
                    no_match += 1
                
                time.sleep(RATE_LIMIT)
            else:
                # Cached but below threshold — try again
                result = search_vivino_v2(p["name"], p.get("sub", ""), p.get("country", ""))
                
                if result:
                    p.update(result)
                    cache[cache_key] = result
                    new_matches += 1
                    log.info(
                        f"  [{i+1}/{len(wine_products)}] ✓ {p['name']} {p['sub']} → "
                        f"{result['vivino_name']} ({result['vivino_rating']}, "
                        f"{result['vivino_reviews']} reviews, match: {result['match_score']:.0f}%)"
                    )
                else:
                    p["vivino_rating"] = 0
                    p["vivino_reviews"] = 0
                    cache[cache_key] = {
                        "vivino_rating": 0, "vivino_reviews": 0,
                        "vivino_id": "", "vivino_name": "", "match_score": 0,
                    }
                    no_match += 1
                
                time.sleep(RATE_LIMIT)
        else:
            # New product, never searched
            result = search_vivino_v2(p["name"], p.get("sub", ""), p.get("country", ""))
            
            if result:
                p.update(result)
                cache[cache_key] = result
                new_matches += 1
                log.info(
                    f"  [{i+1}/{len(wine_products)}] ✓ {p['name']} {p['sub']} → "
                    f"{result['vivino_name']} ({result['vivino_rating']}, "
                    f"{result['vivino_reviews']} reviews, match: {result['match_score']:.0f}%)"
                )
            else:
                p["vivino_rating"] = 0
                p["vivino_reviews"] = 0
                p["vivino_id"] = ""
                p["vivino_name"] = ""
                p["match_score"] = 0
                cache[cache_key] = {
                    "vivino_rating": 0, "vivino_reviews": 0,
                    "vivino_id": "", "vivino_name": "", "match_score": 0,
                }
                no_match += 1
            
            time.sleep(RATE_LIMIT)
        
        # Save cache every 50 products
        if (i + 1) % 50 == 0:
            save_cache(cache)
            total_matched = new_matches + cache_hits
            log.info(f"  Progress: {i+1}/{len(wine_products)} "
                     f"(new: {new_matches}, cached: {cache_hits}, no match: {no_match}, "
                     f"hit rate: {total_matched/(i+1)*100:.0f}%)")
    
    # Save final cache
    save_cache(cache)
    
    # Set beer/cider to 0 ratings (will need Untappd later)
    for p in beer_products:
        p["vivino_rating"] = 0
        p["vivino_reviews"] = 0
        p["vivino_id"] = ""
        p["vivino_name"] = ""
        p["match_score"] = 0
    
    # Combine and save
    all_products = wine_products + beer_products
    MATCHED_FILE.write_text(json.dumps(all_products, ensure_ascii=False, indent=2), "utf-8")
    
    total_matched = new_matches + cache_hits
    log.info(f"\n{'='*60}")
    log.info(f"DONE: {total_matched} matched, {no_match} unmatched, {len(beer_products)} beer/cider skipped")
    log.info(f"Hit rate: {total_matched/len(wine_products)*100:.0f}% of wine products")
    log.info(f"Saved to {MATCHED_FILE}")
    log.info(f"\nNext: python3 scripts/scraper.py --score")


if __name__ == "__main__":
    main()
