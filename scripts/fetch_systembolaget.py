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
            "Flaska": "Flaska", "Bag-in-Box": "BiB",
        }.get(p.get("packaging", ""), "Stor" if (p.get("volume") or 0) > 1500 else "Flaska"),
        "organic": p.get("isOrganic", False),
        "assortment": p.get("assortmentText", ""),
        "taste_body": p.get("tasteClockBody"),
        "taste_sweet": p.get("tasteClockSweetness"),
        "taste_fruit": p.get("tasteClockFruitacid"),
        "taste_bitter": p.get("tasteClockBitter"),
        "food_pairings": [t if isinstance(t, str) else t.get("name", "") for t in (p.get("tasteSymbols") or [])],
        "image_url": f"https://product-cdn.systembolaget.se/productimages/{p.get('productNumber','')}/{p.get('productNumber','')}_400.png",
    }

def fetch_all():
    """Fetch all wine products from SB API."""
    import requests

    all_products = {}
    page_size = 30

    for cat_name, _ in CATEGORIES:
        print(f"  Fetching {cat_name}...")
        page = 1
        cat_count = 0
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

            products = data.get("products", [])
            if not products:
                break

            total = data.get("metadata", {}).get("docCount", 0)

            for p in products:
                nr = str(p.get("productNumber", ""))
                if nr and nr not in all_products:
                    all_products[nr] = normalize(p)
                    cat_count += 1

            print(f"    Page {page}: {len(products)} products (cat: {cat_count}/{total}, all: {len(all_products)})")

            if cat_count >= total or len(products) < page_size:
                break

            page += 1
            time.sleep(0.5)

    return list(all_products.values())

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
    for nr, price in prices.items():
        if nr not in first_seen:
            first_seen[nr] = {"price": price, "date": today}
            new_count += 1

    json.dump(first_seen, open(first_seen_file, "w"))
    print(f"  First-seen: {len(first_seen)} total, {new_count} new")

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
