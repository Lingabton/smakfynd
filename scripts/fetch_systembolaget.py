#!/usr/bin/env python3
"""
Fetch all products from Systembolaget's public API.
No credentials needed — uses their e-commerce search endpoint.
Safe to keep in public repo.

Output: data/systembolaget_raw.json
"""

import json, os, time, sys
from datetime import date
from pathlib import Path

BASE = Path(__file__).parent.parent
DATA_DIR = str(BASE / "data")
OUT_FILE = os.path.join(DATA_DIR, "systembolaget_raw.json")
HIST_DIR = os.path.join(DATA_DIR, "history")

API_BASE = "https://api-extern.systembolaget.se/sb-api-ecommerce/v1/productsearch/search"
HEADERS = {
    "ocp-apim-subscription-key": "cfc702aed3094c86b92d6d4ff7a54c84",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
}

CATEGORIES = [
    ("Rött vin", "vin"),
    ("Vitt vin", "vin"),
    ("Rosévin", "vin"),
    ("Mousserande vin", "vin"),
]

# SB moved wine types from categoryLevel1 to categoryLevel2.
# categoryLevel1 is now "Vin" for all wine types.
CAT_LEVEL = "categoryLevel2"

def normalize(p):
    """Extract relevant fields from SB API product."""
    name = (p.get("productNameBold") or "").strip()
    sub = (p.get("productNameThin") or "").strip()
    return {
        "nr": str(p.get("productNumber", "")),
        "name": name,
        "sub": sub,
        "price": p.get("price"),
        "vol": p.get("volume"),
        "alc": p.get("alcoholPercentage"),
        "type": {
            "Rött vin": "Rött", "Vitt vin": "Vitt",
            "Rosévin": "Rosé", "Mousserande vin": "Mousserande",
        }.get(p.get("categoryLevel2", ""), p.get("categoryLevel2", "")),
        "cat1": p.get("categoryLevel1", ""),
        "cat2": p.get("categoryLevel2", ""),
        "cat3": p.get("categoryLevel3", ""),
        "country": p.get("country", ""),
        "region": p.get("originLevel1", ""),
        "grape": ", ".join(p.get("grapes", []) or []),
        "pkg": {
            "Box": "BiB", "Påse": "BiB",
        }.get(p.get("packagingLevel1") or "", "Stor" if (p.get("volume") or 0) > 1500 else "Flaska"),
        "organic": p.get("isOrganic", False),
        "assortment": p.get("assortmentText", ""),
        "taste_body": p.get("tasteClockBody"),
        "taste_sweet": p.get("tasteClockSweetness"),
        "taste_fruit": p.get("tasteClockFruitacid"),
        "taste_bitter": p.get("tasteClockBitter"),
        "food_pairings": [t if isinstance(t, str) else t.get("name", "") for t in (p.get("tasteSymbols") or [])],
        "image_url": (p.get("images", [{}])[0].get("imageUrl", "") + "_400.webp") if p.get("images") else "",
        "vintage": p.get("vintage"),
        "is_out_of_stock": p.get("isCompletelyOutOfStock", False),
        "is_temp_out": p.get("isTemporaryOutOfStock", False),
        "is_regional": p.get("isRegionalRestricted", False),
    }

def fetch_category(cat_name, page_size, requests, delay=0.5):
    """Fetch a single category. Returns (products_dict, expected_total)."""
    products = {}
    page = 1
    expected_total = None
    while True:
        params = {
            CAT_LEVEL: cat_name,
            "size": page_size,
            "page": page,
            "sortBy": "Score",
            "sortDirection": "Descending",
        }
        try:
            r = requests.get(API_BASE, headers=HEADERS, params=params, timeout=30)
            r.raise_for_status()
            data = r.json()
        except Exception as e:
            print(f"    Error page {page}: {e}")
            break

        items = data.get("products", [])
        if not items:
            break

        total = data.get("metadata", {}).get("docCount", 0)
        if expected_total is None and total > 0:
            expected_total = total

        for p in items:
            nr = str(p.get("productNumber", ""))
            if nr and nr not in products:
                products[nr] = normalize(p)

        print(f"    Page {page}: {len(items)} products (cat: {len(products)}/{total})")

        if len(products) >= total or len(items) < page_size:
            break

        page += 1
        time.sleep(delay)

    return products, expected_total or 0


def fetch_all():
    """Fetch all wine products from SB API with retry and guards."""
    import requests

    allow_short = "--allow-short-fetch" in sys.argv

    all_products = {}
    page_size = 30
    cat_results = {}

    for cat_name, _ in CATEGORIES:
        print(f"  Fetching {cat_name}...")
        products, expected = fetch_category(cat_name, page_size, requests)

        # Retry once with backoff if short
        if expected > 0 and len(products) / expected < 0.98:
            pct = len(products) / expected * 100
            print(f"    Short fetch ({pct:.0f}%), retrying with 2s delay...")
            time.sleep(5)
            products, expected = fetch_category(cat_name, page_size, requests, delay=2.0)

        all_products.update(products)
        cat_results[cat_name] = (len(products), expected)

    # Per-category docCount guard: abort if any category returned <98% of expected
    for cat_name, (fetched, expected) in cat_results.items():
        if expected > 0:
            pct = fetched / expected * 100
            print(f"  {cat_name}: {fetched}/{expected} ({pct:.0f}%)")
            if pct < 98 and not allow_short:
                print(f"\n  ABORT: {cat_name} returned {fetched}/{expected} ({pct:.0f}%) — short fetch detected.")
                print("  Aborting to prevent corpus collapse. Use --allow-short-fetch to override.")
                raise SystemExit(1)

    products = list(all_products.values())
    # Absolute floor: API down or key expired
    if len(products) < 8000 and not allow_short:
        print(f"\n  ABORT: Only {len(products)} products fetched (expected 10000+).")
        print("  API may be down or key expired. Aborting to prevent data loss.")
        raise SystemExit(1)
    return products

def save_price_snapshot(products):
    """Save daily price snapshot for price drop detection."""
    os.makedirs(HIST_DIR, exist_ok=True)
    today = date.today().isoformat()

    prices = {p["nr"]: p["price"] for p in products if p.get("nr") and p.get("price")}

    # Daily snapshot
    snapshot_file = os.path.join(HIST_DIR, f"prices_{today}.json")
    json.dump(prices, open(snapshot_file, "w"))
    print(f"  Price snapshot: {len(prices)} wines → {snapshot_file}")

    # Update first-seen prices
    first_seen_file = os.path.join(HIST_DIR, "first_seen_prices.json")
    first_seen = {}
    if os.path.exists(first_seen_file):
        first_seen = json.load(open(first_seen_file))

    new_count = 0
    drop_count = 0
    for nr, price in prices.items():
        if nr not in first_seen:
            first_seen[nr] = {"price": price, "date": today}
            new_count += 1
        else:
            entry = first_seen[nr]
            old_price = entry.get("price", 0) if isinstance(entry, dict) else entry
            if price < old_price:
                pct = round((old_price - price) / old_price * 100)
                if pct >= 5:
                    first_seen[nr] = {"price": old_price, "date": entry.get("date", today) if isinstance(entry, dict) else today, "drop_date": today, "drop_price": price}
                    drop_count += 1

    json.dump(first_seen, open(first_seen_file, "w"))
    print(f"  First-seen: {len(first_seen)} total, {new_count} new, {drop_count} new drops")

def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    print(f"Fetching Systembolaget products...")

    products = fetch_all()
    print(f"\nTotal: {len(products)} unique products")

    json.dump(products, open(OUT_FILE, "w"), ensure_ascii=False, indent=None)
    print(f"Saved: {OUT_FILE} ({os.path.getsize(OUT_FILE) / 1024:.0f} KB)")

    save_price_snapshot(products)

if __name__ == "__main__":
    main()
