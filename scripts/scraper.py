#!/usr/bin/env python3
"""
Smakfynd Data Pipeline
======================
Fetches Systembolaget products, matches against Vivino ratings,
computes value scores, and outputs JSON for the static site.

Usage:
    python scraper.py                  # Full pipeline
    python scraper.py --systembolaget  # Only fetch Systembolaget data
    python scraper.py --vivino         # Only match Vivino (requires existing SB data)
    python scraper.py --score          # Only recompute scores (requires existing matched data)
    python scraper.py --dry-run        # Show what would happen without fetching
"""

import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime, date
from pathlib import Path

import requests
from rapidfuzz import fuzz

# ── Config ──────────────────────────────────────────────────
DATA_DIR = Path(__file__).parent.parent / "data"
CACHE_FILE = DATA_DIR / "vivino_cache.json"
UNTAPPD_CACHE_FILE = DATA_DIR / "untappd_cache.json"
SB_RAW_FILE = DATA_DIR / "systembolaget_raw.json"
MATCHED_FILE = DATA_DIR / "matched_products.json"
SITE_DATA_FILE = DATA_DIR / "site_data.json"
HISTORY_DIR = DATA_DIR / "history"

SB_API_BASE = "https://api-extern.systembolaget.se/sb-api-ecommerce/v1/productsearch/search"
SB_API_KEY = os.environ.get("SB_API_KEY", "cfc702aed3094c86b92d6d4ff7a54c84")

VIVINO_SEARCH_URL = "https://www.vivino.com/api/explore/explore"
VIVINO_RATE_LIMIT = 1.5  # seconds between requests

# Untappd API — register at https://untappd.com/api/ to get your keys
UNTAPPD_CLIENT_ID = os.environ.get("UNTAPPD_CLIENT_ID", "")
UNTAPPD_CLIENT_SECRET = os.environ.get("UNTAPPD_CLIENT_SECRET", "")
UNTAPPD_API_BASE = "https://api.untappd.com/v4"
UNTAPPD_RATE_LIMIT = 1.0  # seconds between requests (API limit: 100/hr)

CATEGORIES_TO_FETCH = [
    ("Vin", "Rött vin"),
    ("Vin", "Vitt vin"),
    ("Vin", "Rosévin"),
    ("Vin", "Mousserande vin"),
    ("Öl", None),
    ("Cider & blanddrycker", None),
]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("smakfynd")


# ═══════════════════════════════════════════════════════════
# STEP 1: Fetch Systembolaget products
# ═══════════════════════════════════════════════════════════

def fetch_systembolaget():
    """Fetch all products from Systembolaget's e-commerce API."""
    headers = {
        "Ocp-Apim-Subscription-Key": SB_API_KEY,
        "User-Agent": "Smakfynd/1.0 (data pipeline)",
    }

    all_products = []
    seen_ids = set()

    for cat1, cat2 in CATEGORIES_TO_FETCH:
        page = 1
        cat_label = f"{cat1} > {cat2}" if cat2 else cat1
        log.info(f"Fetching: {cat_label}")

        while True:
            params = {
                "size": 30,
                "page": page,
                "categoryLevel1": cat1,
                "isInStoreAssortmentSearch": "true",
            }
            if cat2:
                params["categoryLevel2"] = cat2

            try:
                r = requests.get(SB_API_BASE, headers=headers, params=params, timeout=15)
                r.raise_for_status()
                data = r.json()
            except requests.RequestException as e:
                log.error(f"  API error on page {page}: {e}")
                break

            products = data.get("products", [])
            if not products:
                break

            for p in products:
                pid = p.get("productId") or p.get("productNumber")
                if pid and pid not in seen_ids:
                    seen_ids.add(pid)
                    all_products.append(normalize_sb_product(p))

            total = data.get("metadata", {}).get("docCount", 0)
            fetched = page * 30
            log.info(f"  Page {page}: {len(products)} products (total: {min(fetched, total)}/{total})")

            if fetched >= total or len(products) < 30:
                break

            page += 1
            time.sleep(0.3)  # Be nice to the API

    log.info(f"Total unique products: {len(all_products)}")

    # Save raw data
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SB_RAW_FILE.write_text(
        json.dumps(all_products, ensure_ascii=False, indent=2), "utf-8"
    )
    log.info(f"Saved to {SB_RAW_FILE}")
    return all_products


def _extract_grape(p):
    """Safely extract grape name from various API formats."""
    g = p.get("grapes")
    if not g:
        return ""
    if isinstance(g, str):
        return g.strip()
    if isinstance(g, list) and len(g) > 0:
        item = g[0]
        if isinstance(item, dict):
            return item.get("name", "")
        if isinstance(item, str):
            return item.strip()
    return ""

def _extract_image(p):
    """Safely extract image URL from various API formats."""
    imgs = p.get("images")
    if not imgs:
        return ""
    if isinstance(imgs, str):
        return imgs
    if isinstance(imgs, list) and len(imgs) > 0:
        item = imgs[0]
        if isinstance(item, dict):
            return item.get("imageUrl", "")
        if isinstance(item, str):
            return item
    return ""

def normalize_sb_product(p):
    """Extract and normalize relevant fields from a Systembolaget product."""
    return {
        "id": p.get("productId") or p.get("productNumber"),
        "nr": str(p.get("productNumber", "")),
        "name": (p.get("productNameBold") or "").strip(),
        "sub": (p.get("productNameThin") or "").strip(),
        "price": p.get("price", 0),
        "vol": p.get("volume", 750),
        "alc": p.get("alcoholPercentage", 0),
        "country": (p.get("country") or "").strip(),
        "region": (p.get("originLevel1") or "").strip(),
        "grape": _extract_grape(p),
        "cat1": (p.get("categoryLevel1") or "").strip(),
        "cat2": (p.get("categoryLevel2") or "").strip(),
        "cat3": (p.get("categoryLevel3") or "").strip(),
        "style": (p.get("taste") or "").strip(),
        "organic": bool(p.get("isOrganic")),
        "assortment": (p.get("assortmentText") or "").strip(),
        "image_url": _extract_image(p),
        "launch_date": (p.get("productLaunchDate") or ""),
        "supplier": (p.get("supplier") or "").strip(),
        "taste_body": p.get("tasteClockBody", 0),
        "taste_sweet": p.get("tasteClockSweetness", 0),
        "taste_bitter": p.get("tasteClockBitter", 0),
        "taste_fruit": p.get("tasteClockFruitacid", 0),
        "food_pairings": [s.strip() for s in (p.get("tasteSymbols") or [])] if isinstance(p.get("tasteSymbols"), list) else [],
    }


# ═══════════════════════════════════════════════════════════
# STEP 2: Match against Vivino
# ═══════════════════════════════════════════════════════════

def load_vivino_cache():
    """Load cached Vivino matches to avoid redundant API calls."""
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text("utf-8"))
    return {}


def save_vivino_cache(cache):
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), "utf-8")


def search_vivino(product_name, country="", grape=""):
    """Search Vivino's internal API for a wine by name.
    
    Returns: {"rating": float, "reviews": int, "vivino_id": str} or None
    """
    # Construct search query: name + country works best
    query = product_name
    if country and country not in query:
        query = f"{query} {country}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                       "AppleWebKit/537.36 (KHTML, like Gecko) "
                       "Chrome/120.0.0.0 Safari/537.36",
    }

    params = {
        "country_code": "SE",
        "currency_code": "SEK",
        "min_rating": "1",
        "order_by": "ratings_count",
        "order": "desc",
        "page": "1",
        "price_range_min": "0",
        "price_range_max": "10000",
    }

    try:
        # Vivino's explore API accepts a query parameter
        r = requests.get(
            f"https://www.vivino.com/api/explore/explore?q={requests.utils.quote(query)}",
            headers=headers,
            params=params,
            timeout=10,
        )
        if r.status_code != 200:
            return None

        data = r.json()
        matches = data.get("explore_vintage", {}).get("matches", [])

        if not matches:
            return None

        # Find best fuzzy match
        best_match = None
        best_score = 0

        for match in matches[:10]:
            vintage = match.get("vintage", {})
            wine = vintage.get("wine", {})
            wine_name = wine.get("name", "")
            winery_name = wine.get("winery", {}).get("name", "")
            full_name = f"{winery_name} {wine_name}".strip()

            # Fuzzy match against our product name
            ratio = fuzz.token_sort_ratio(product_name.lower(), full_name.lower())

            if ratio > best_score and ratio > 55:  # Minimum 55% match
                stats = vintage.get("statistics", {})
                best_score = ratio
                best_match = {
                    "vivino_rating": stats.get("ratings_average", 0),
                    "vivino_reviews": stats.get("ratings_count", 0),
                    "vivino_id": str(wine.get("id", "")),
                    "vivino_name": full_name,
                    "match_score": ratio,
                }

        return best_match

    except Exception as e:
        log.warning(f"Vivino search failed for '{product_name}': {e}")
        return None


def match_vivino(products):
    """Match all products against Vivino. Uses cache to skip already-matched products."""
    cache = load_vivino_cache()
    matched = []
    new_matches = 0
    cache_hits = 0
    no_match = 0

    for i, p in enumerate(products):
        cache_key = f"{p['name']}|{p['sub']}|{p['country']}"

        if cache_key in cache:
            # Use cached Vivino data
            p.update(cache[cache_key])
            cache_hits += 1
        else:
            # Search Vivino
            search_name = f"{p['name']} {p['sub']}".strip()
            result = search_vivino(search_name, country=p.get("country", ""))

            if result:
                p.update(result)
                cache[cache_key] = result
                new_matches += 1
                log.info(
                    f"  [{i+1}/{len(products)}] ✓ {search_name} → "
                    f"{result['vivino_name']} ({result['vivino_rating']}, "
                    f"{result['vivino_reviews']} reviews, match: {result['match_score']}%)"
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

            # Rate limit
            time.sleep(VIVINO_RATE_LIMIT)

        matched.append(p)

        # Save cache periodically
        if (i + 1) % 50 == 0:
            save_vivino_cache(cache)
            log.info(f"  Progress: {i+1}/{len(products)} "
                     f"(new: {new_matches}, cached: {cache_hits}, no match: {no_match})")

    save_vivino_cache(cache)
    MATCHED_FILE.write_text(json.dumps(matched, ensure_ascii=False, indent=2), "utf-8")

    log.info(f"Matching complete: {new_matches} new, {cache_hits} cached, {no_match} unmatched")
    return matched


# ═══════════════════════════════════════════════════════════
# STEP 2b: Match beer against Untappd
# ═══════════════════════════════════════════════════════════

def load_untappd_cache():
    if UNTAPPD_CACHE_FILE.exists():
        return json.loads(UNTAPPD_CACHE_FILE.read_text("utf-8"))
    return {}

def save_untappd_cache(cache):
    UNTAPPD_CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), "utf-8")


def search_untappd(beer_name, brewery=""):
    """Search Untappd API for a beer by name.

    Requires UNTAPPD_CLIENT_ID and UNTAPPD_CLIENT_SECRET.
    Returns: {"rating": float, "reviews": int, "untappd_id": str, ...} or None
    """
    if not UNTAPPD_CLIENT_ID or not UNTAPPD_CLIENT_SECRET:
        return None

    query = f"{brewery} {beer_name}".strip() if brewery else beer_name

    try:
        r = requests.get(
            f"{UNTAPPD_API_BASE}/search/beer",
            params={
                "q": query,
                "client_id": UNTAPPD_CLIENT_ID,
                "client_secret": UNTAPPD_CLIENT_SECRET,
                "limit": 10,
            },
            timeout=10,
        )
        if r.status_code != 200:
            log.warning(f"  Untappd API returned {r.status_code}")
            return None

        data = r.json()
        beers = data.get("response", {}).get("beers", {}).get("items", [])
        if not beers:
            return None

        # Find best fuzzy match
        best_match = None
        best_score = 0

        for item in beers[:10]:
            beer = item.get("beer", {})
            brewery_info = item.get("brewery", {})
            full_name = f"{brewery_info.get('brewery_name', '')} {beer.get('beer_name', '')}".strip()

            ratio = fuzz.token_sort_ratio(beer_name.lower(), full_name.lower())

            if ratio > best_score and ratio > 50:
                best_score = ratio
                best_match = {
                    "untappd_rating": round(beer.get("rating_score", 0), 2),
                    "untappd_reviews": beer.get("rating_count", 0),
                    "untappd_id": str(beer.get("bid", "")),
                    "untappd_name": full_name,
                    "untappd_style": beer.get("beer_style", ""),
                    "untappd_ibu": beer.get("beer_ibu", 0),
                    "untappd_match_score": ratio,
                }

        return best_match

    except Exception as e:
        log.warning(f"  Untappd search failed for '{beer_name}': {e}")
        return None


def match_untappd(products):
    """Match beer products against Untappd. Uses cache like Vivino."""
    beer_products = [p for p in products if p.get("cat1") == "Öl"]

    if not beer_products:
        log.info("No beer products to match against Untappd")
        return products

    if not UNTAPPD_CLIENT_ID:
        log.warning("No Untappd API keys set — skipping Untappd matching. "
                     "Set UNTAPPD_CLIENT_ID and UNTAPPD_CLIENT_SECRET env vars.")
        log.warning("Beer products will use Vivino ratings (less accurate for beer).")
        return products

    log.info(f"Matching {len(beer_products)} beers against Untappd...")
    cache = load_untappd_cache()
    new_matches = 0
    cache_hits = 0

    for i, p in enumerate(beer_products):
        cache_key = f"{p['name']}|{p['sub']}"

        if cache_key in cache:
            cached = cache[cache_key]
            # Untappd data overwrites Vivino for beer
            if cached.get("untappd_rating", 0) > 0:
                p["vivino_rating"] = cached["untappd_rating"]
                p["vivino_reviews"] = cached["untappd_reviews"]
                p["rating_source"] = "untappd"
            p.update({k: v for k, v in cached.items() if k.startswith("untappd_")})
            cache_hits += 1
        else:
            search_name = f"{p['name']} {p['sub']}".strip()
            result = search_untappd(search_name)

            if result:
                # Use Untappd rating as the primary rating for beer
                p["vivino_rating"] = result["untappd_rating"]
                p["vivino_reviews"] = result["untappd_reviews"]
                p["rating_source"] = "untappd"
                p.update(result)
                cache[cache_key] = result
                new_matches += 1
                log.info(
                    f"  [{i+1}/{len(beer_products)}] ✓ {search_name} → "
                    f"{result['untappd_name']} ({result['untappd_rating']}, "
                    f"{result['untappd_reviews']} checkins)"
                )
            else:
                cache[cache_key] = {"untappd_rating": 0, "untappd_reviews": 0}
                p["rating_source"] = p.get("rating_source", "vivino")

            time.sleep(UNTAPPD_RATE_LIMIT)

        if (i + 1) % 25 == 0:
            save_untappd_cache(cache)

    save_untappd_cache(cache)
    log.info(f"Untappd matching: {new_matches} new, {cache_hits} cached")
    return products


# ═══════════════════════════════════════════════════════════
# STEP 3: Compute scores and generate site data
# ═══════════════════════════════════════════════════════════

def compute_category_medians(products):
    """Compute median price per liter for each category.
    
    Used to normalize prices so that a 89 kr wine is compared against
    other wines, not against 32 kr beers. This makes rankings fair
    within AND across categories.
    """
    from statistics import median

    category_prices = {}
    for p in products:
        cat = categorize(p)
        price = p.get("price", 0)
        vol = p.get("vol", 750)
        if price > 0 and vol > 0:
            ppl = price / (vol / 1000)
            category_prices.setdefault(cat, []).append(ppl)

    medians = {}
    for cat, prices in category_prices.items():
        medians[cat] = median(prices) if prices else 100
        log.info(f"  Category '{cat}': {len(prices)} products, "
                 f"median {medians[cat]:.0f} kr/L")

    return medians


def compute_smakfynd_score(product, category_medians):
    """
    Smakfynd Score — Category-Relative Value
    ==========================================
    
    score = (quality / relative_price) × 10
    
    quality       = vivino_rating × (0.55 + 0.45 × confidence)
    confidence    = min(review_count / 15000, 1.0)
    relative_price = product_price_per_L / category_median_price_per_L
    
    A relative_price of 1.0 means "average priced for its category."
    Below 1.0 = cheaper than average. Above 1.0 = more expensive.
    
    This means:
    - A wine at 89 kr is compared to the median wine price, not to beer
    - A beer at 32 kr is compared to the median beer price, not to wine
    - High rating + below-average price = high score
    - High rating + above-average price = moderate score
    - Low rating + any price = low score
    
    Result is scaled to roughly 1-5 range for easy display.
    """
    rating = product.get("vivino_rating", 0)
    reviews = product.get("vivino_reviews", 0)
    price = product.get("price", 0)
    volume = product.get("vol", 750)
    category = categorize(product)

    if rating == 0 or price == 0 or volume == 0:
        return 0

    # Quality: Vivino rating weighted by review confidence
    confidence = min(reviews / 15000, 1.0)
    quality = rating * (0.55 + 0.45 * confidence)

    # Relative price: how expensive is this vs its category average?
    price_per_liter = price / (volume / 1000)
    cat_median = category_medians.get(category, 100)
    relative_price = price_per_liter / cat_median if cat_median > 0 else 1.0

    # Clamp relative_price to avoid extreme outliers
    relative_price = max(relative_price, 0.2)

    # Score: quality divided by relative price
    # Range roughly 2-25. Above 10 = great value, above 15 = exceptional.
    # A 3.6 wine at median price with max confidence scores ~3.6/1.0 = 3.6
    # Multiply by 3.5 to put top wines in the 10-20 range for nice display.
    score = (quality / relative_price) * 3.5

    return round(score, 2)


def detect_price_vs_launch(products):
    """Compare current price against the first price we ever observed (launch price).
    
    Uses a persistent 'first seen' price file. On first run, records current
    prices. On subsequent runs, compares against the stored first-seen price
    to show long-term price drops — not just week-over-week changes.
    
    This creates the "wow" factor: "This wine launched at 129 kr — now 89 kr!"
    """
    first_seen_file = HISTORY_DIR / "first_seen_prices.json"

    # Load existing first-seen prices
    if first_seen_file.exists():
        first_seen = json.loads(first_seen_file.read_text("utf-8"))
    else:
        first_seen = {}

    updated = False
    for p in products:
        pid = str(p["id"])
        current = p["price"]

        if pid not in first_seen:
            # First time seeing this product — record its price
            first_seen[pid] = {
                "price": current,
                "date": date.today().isoformat(),
            }
            updated = True
            p["launch_price"] = None  # No comparison on first observation
            p["price_vs_launch_pct"] = 0
        else:
            original = first_seen[pid]["price"]
            if original > current:
                p["launch_price"] = original
                p["price_vs_launch_pct"] = round(
                    ((original - current) / original) * 100
                )
            elif original < current:
                # Price went UP since launch — still interesting data
                p["launch_price"] = original
                p["price_vs_launch_pct"] = -round(
                    ((current - original) / original) * 100
                )
            else:
                p["launch_price"] = None
                p["price_vs_launch_pct"] = 0

    # Save updated first-seen data
    if updated:
        HISTORY_DIR.mkdir(parents=True, exist_ok=True)
        first_seen_file.write_text(
            json.dumps(first_seen, ensure_ascii=False, indent=2), "utf-8"
        )
        log.info(f"  Updated first-seen prices: {len(first_seen)} products tracked")

    drops = [p for p in products if p.get("price_vs_launch_pct", 0) > 0]
    log.info(f"  Price drops vs launch: {len(drops)} products cheaper than launch price")

    return products


def detect_new_products(products):
    """Mark products launched in the last 30 days."""
    today = date.today()
    for p in products:
        launch = p.get("launch_date", "")
        if launch:
            try:
                launch_date = date.fromisoformat(launch[:10])
                p["is_new"] = (today - launch_date).days <= 30
            except (ValueError, TypeError):
                p["is_new"] = False
        else:
            p["is_new"] = False
    return products


def categorize(product):
    """Map Systembolaget categories to Smakfynd display categories."""
    cat1 = product.get("cat1", "")
    cat2 = product.get("cat2", "")

    if "Rött" in cat2:
        return "Rött"
    elif "Vitt" in cat2:
        return "Vitt"
    elif "Rosé" in cat2:
        return "Rosé"
    elif "Mousserande" in cat2 or "Champagne" in cat2:
        return "Mousserande"
    elif cat1 == "Öl":
        return "Öl"
    elif "Cider" in cat1:
        return "Cider"
    else:
        return "Övrigt"


def generate_site_data(products):
    """Generate the final JSON file consumed by the React frontend."""

    # Categorize first (needed for median calculation)
    for p in products:
        p["category"] = categorize(p)

    # Compute category medians
    log.info("Computing category medians...")
    category_medians = compute_category_medians(products)

    # Compute category-relative scores
    for p in products:
        p["smakfynd_score"] = compute_smakfynd_score(p, category_medians)

    # Detect price vs launch and new products
    log.info("Checking prices vs launch...")
    products = detect_price_vs_launch(products)
    products = detect_new_products(products)

    # Filter: only products with Vivino data and positive score
    ranked = [p for p in products if p["smakfynd_score"] > 0]
    ranked.sort(key=lambda x: x["smakfynd_score"], reverse=True)

    # Category stats
    categories = {}
    for p in ranked:
        cat = p["category"]
        if cat not in categories:
            categories[cat] = {"count": 0, "avg_score": 0, "top_product": None}
        categories[cat]["count"] += 1
        categories[cat]["avg_score"] += p["smakfynd_score"]

    for cat in categories:
        if categories[cat]["count"] > 0:
            categories[cat]["avg_score"] = round(
                categories[cat]["avg_score"] / categories[cat]["count"], 2
            )
        # Top product per category
        cat_products = [p for p in ranked if p["category"] == cat]
        if cat_products:
            categories[cat]["top_product"] = cat_products[0]["name"]

    # Build site data
    site_data = {
        "generated_at": datetime.now().isoformat(),
        "total_products": len(products),
        "ranked_products": len(ranked),
        "unmatched_products": len(products) - len(ranked),
        "price_drops_vs_launch": len([p for p in ranked if p.get("price_vs_launch_pct", 0) > 0]),
        "new_products": len([p for p in ranked if p.get("is_new")]),
        "category_medians": {k: round(v) for k, v in category_medians.items()},
        "categories": categories,
        "products": ranked,
    }

    # Save site data
    SITE_DATA_FILE.write_text(
        json.dumps(site_data, ensure_ascii=False, indent=2), "utf-8"
    )

    log.info(f"Site data generated: {len(ranked)} ranked products, "
             f"{site_data['price_drops_vs_launch']} cheaper than launch, "
             f"{site_data['new_products']} new")
    log.info(f"Saved to {SITE_DATA_FILE}")

    return site_data


# ═══════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="Smakfynd Data Pipeline")
    parser.add_argument("--systembolaget", action="store_true", help="Only fetch Systembolaget data")
    parser.add_argument("--vivino", action="store_true", help="Only match against Vivino")
    parser.add_argument("--untappd", action="store_true", help="Only match beer against Untappd")
    parser.add_argument("--score", action="store_true", help="Only recompute scores")
    parser.add_argument("--dry-run", action="store_true", help="Show stats without fetching")
    args = parser.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if args.dry_run:
        if SB_RAW_FILE.exists():
            products = json.loads(SB_RAW_FILE.read_text("utf-8"))
            log.info(f"Systembolaget data: {len(products)} products")
        if MATCHED_FILE.exists():
            matched = json.loads(MATCHED_FILE.read_text("utf-8"))
            with_vivino = [p for p in matched if p.get("vivino_rating", 0) > 0]
            log.info(f"Matched data: {len(matched)} products, {len(with_vivino)} with ratings")
        if CACHE_FILE.exists():
            cache = json.loads(CACHE_FILE.read_text("utf-8"))
            log.info(f"Vivino cache: {len(cache)} entries")
        if UNTAPPD_CACHE_FILE.exists():
            cache = json.loads(UNTAPPD_CACHE_FILE.read_text("utf-8"))
            log.info(f"Untappd cache: {len(cache)} entries")
        return

    if args.systembolaget:
        fetch_systembolaget()
        return

    if args.vivino:
        if not SB_RAW_FILE.exists():
            log.error("No Systembolaget data found. Run --systembolaget first.")
            sys.exit(1)
        products = json.loads(SB_RAW_FILE.read_text("utf-8"))
        match_vivino(products)
        return

    if args.untappd:
        if not MATCHED_FILE.exists():
            log.error("No matched data found. Run --vivino first.")
            sys.exit(1)
        products = json.loads(MATCHED_FILE.read_text("utf-8"))
        match_untappd(products)
        MATCHED_FILE.write_text(json.dumps(products, ensure_ascii=False, indent=2), "utf-8")
        return

    if args.score:
        if not MATCHED_FILE.exists():
            log.error("No matched data found. Run full pipeline first.")
            sys.exit(1)
        products = json.loads(MATCHED_FILE.read_text("utf-8"))
        generate_site_data(products)
        return

    # Full pipeline
    log.info("=" * 50)
    log.info("SMAKFYND DATA PIPELINE")
    log.info("=" * 50)

    log.info("\n── Step 1: Fetching Systembolaget products ──")
    products = fetch_systembolaget()

    log.info("\n── Step 2a: Matching wine against Vivino ──")
    products = match_vivino(products)

    log.info("\n── Step 2b: Matching beer against Untappd ──")
    products = match_untappd(products)

    log.info("\n── Step 3: Computing scores & generating site data ──")
    site_data = generate_site_data(products)

    log.info("\n── Done! ──")
    log.info(f"Products ranked: {site_data['ranked_products']}")
    log.info(f"Price drops: {site_data['price_drops_vs_launch']}")
    log.info(f"New products: {site_data['new_products']}")
    log.info(f"Output: {SITE_DATA_FILE}")


if __name__ == "__main__":
    main()
