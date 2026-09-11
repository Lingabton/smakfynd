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

# Per-category expected unique product counts. Recorded 2026-09-02 from
# two-pass Name sort (Ascending + Descending union). Near-complete under
# a total-order sort — Name is near-unique so pagination is near-complete.
# Update deliberately when the guard fires on real assortment change.
EXPECTED_UNIQUE = {
    "Rött vin": 7067,
    "Vitt vin": 4446,
    "Rosévin": 572,
    "Mousserande vin": 2300,
}

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

def fetch_pages(cat_name, page_size, requests, sort_by="Name", sort_dir="Ascending", delay=0.5):
    """Paginate one sort pass. Returns (products_dict, docCount, pages)."""
    products = {}
    page = 1
    doc_count = None
    while True:
        params = {
            CAT_LEVEL: cat_name,
            "size": page_size,
            "page": page,
            "sortBy": sort_by,
            "sortDirection": sort_dir,
        }

        # 3 attempts per page with exponential backoff
        data = None
        for attempt in range(3):
            try:
                r = requests.get(API_BASE, headers=HEADERS, params=params, timeout=30)
                r.raise_for_status()
                data = r.json()
                break
            except Exception as e:
                # A 404 past page 1 with high coverage is normal end-of-pagination
                # (happens when total is an exact multiple of page_size)
                is_404 = "404" in str(e)
                coverage = len(products) / doc_count * 100 if doc_count and doc_count > 0 else 0
                if is_404 and page > 1 and coverage >= 98:
                    print(f"    {sort_dir} p{page}: 404 at {coverage:.0f}% coverage — normal end of pagination")
                    data = {"products": []}  # empty → triggers break below
                    break

                backoff = [1, 2, 4][attempt]
                if attempt < 2:
                    print(f"    RETRY {sort_dir} page {page} attempt {attempt+1}: {e} (backoff {backoff}s)")
                    time.sleep(backoff)
                else:
                    print(f"    FATAL {sort_dir} page {page} after 3 attempts: {e}")
                    print(f"    ABORT: {cat_name} {sort_dir} page {page} — persistent failure.")
                    raise SystemExit(1)

        items = data.get("products", [])
        if not items:
            break

        total = data.get("metadata", {}).get("docCount", 0)
        if doc_count is None and total > 0:
            doc_count = total

        before = len(products)
        for p in items:
            nr = str(p.get("productNumber", ""))
            if nr and nr not in products:
                products[nr] = normalize(p)
        new_count = len(products) - before

        if page % 50 == 0 or len(items) < page_size:
            print(f"    {sort_dir} p{page}: {len(items)} returned, {new_count} new (unique: {len(products)})")

        # Stop if we've collected everything or hit a short page
        if len(items) < page_size:
            break
        if doc_count and len(products) >= doc_count:
            print(f"    {sort_dir} p{page}: collected {len(products)} >= docCount {doc_count} — done")
            break

        page += 1
        time.sleep(delay)

    return products, doc_count or 0, page


def fetch_category(cat_name, page_size, requests, delay=0.5):
    """Fetch a category with two Name-sort passes (Asc + Desc) for completeness.

    Name sort provides a near-total order, so pagination is near-complete.
    Two passes (Ascending + Descending) close the residual gap to ~0.02%.
    """
    # Pass 1: Name/Ascending
    products, doc_count, pages_asc = fetch_pages(
        cat_name, page_size, requests, "Name", "Ascending", delay)
    count_asc = len(products)

    # Pass 2: Name/Descending — union with pass 1
    desc_products, _, pages_desc = fetch_pages(
        cat_name, page_size, requests, "Name", "Descending", delay)
    for nr, p in desc_products.items():
        if nr not in products:
            products[nr] = p

    print(f"    [{cat_name}] {len(products)} unique (Asc: {count_asc}, +{len(products)-count_asc} from Desc, docCount: {doc_count})")
    return products, doc_count


def fetch_all():
    """Fetch all wine products from SB API with retry and guards."""
    import requests

    allow_short = "--allow-short-fetch" in sys.argv

    all_products = {}
    page_size = 30
    cat_results = {}

    for cat_name, _ in CATEGORIES:
        print(f"  Fetching {cat_name}...")
        products, doc_count = fetch_category(cat_name, page_size, requests)
        all_products.update(products)
        cat_results[cat_name] = (len(products), doc_count)

    # Guard 1: per-category expected unique counts (catches assortment drift)
    for cat_name, (fetched, _) in cat_results.items():
        expected = EXPECTED_UNIQUE.get(cat_name)
        if expected:
            pct = fetched / expected * 100
            print(f"  {cat_name}: {fetched}/{expected} expected ({pct:.0f}%)")
            if pct < 97 and not allow_short:
                print(f"\n  ABORT: {cat_name} returned {fetched}/{expected} ({pct:.0f}%) — below 97% of expected unique.")
                print("  Use --allow-short-fetch to override.")
                raise SystemExit(1)

    # Guard 2: per-category docCount (catches fetch failure)
    for cat_name, (fetched, doc_count) in cat_results.items():
        if doc_count > 0:
            pct = fetched / doc_count * 100
            print(f"  {cat_name}: {fetched}/{doc_count} docCount ({pct:.0f}%)")
            if pct < 98 and not allow_short:
                print(f"\n  ABORT: {cat_name} returned {fetched}/{doc_count} ({pct:.0f}%) — below 98% of docCount.")
                print("  Use --allow-short-fetch to override.")
                raise SystemExit(1)

    products = list(all_products.values())
    # Absolute floor: API down or key expired
    if len(products) < 8000 and not allow_short:
        print(f"\n  ABORT: Only {len(products)} products fetched (expected 10000+).")
        print("  API may be down or key expired. Aborting to prevent data loss.")
        raise SystemExit(1)
    return products

from constants import read_snapshot as _read_snapshot


def save_price_snapshot(products):
    """Save daily price snapshot with full product metadata."""
    os.makedirs(HIST_DIR, exist_ok=True)
    today = date.today().isoformat()

    # Rich snapshot: price, volume, assortment, stock status, vintage
    snapshot = {}
    for p in products:
        nr = p.get("nr")
        if not nr or not p.get("price"):
            continue
        row = {"p": p["price"]}
        if p.get("vol"): row["v"] = p["vol"]
        if p.get("assortment"): row["a"] = p["assortment"]
        if p.get("is_out_of_stock"): row["o"] = True
        if p.get("is_temp_out"): row["t"] = True
        if p.get("vintage"): row["y"] = p["vintage"]
        snapshot[nr] = row

    snapshot_file = os.path.join(HIST_DIR, f"prices_{today}.json")
    json.dump(snapshot, open(snapshot_file, "w"), separators=(',', ':'))
    print(f"  Snapshot: {len(snapshot)} wines → {snapshot_file}")

    # Update first-seen prices (uses price only, backward compatible)
    first_seen_file = os.path.join(HIST_DIR, "first_seen_prices.json")
    first_seen = {}
    if os.path.exists(first_seen_file):
        first_seen = json.load(open(first_seen_file))

    new_count = 0
    drop_count = 0
    for nr, row in snapshot.items():
        price = row["p"]
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

    # Compute daily deltas against yesterday's snapshot
    yesterday_files = sorted([f for f in os.listdir(HIST_DIR) if f.startswith("prices_") and f < f"prices_{today}"])
    if yesterday_files:
        prev = _read_snapshot(os.path.join(HIST_DIR, yesterday_files[-1]))
        prev_date = yesterday_files[-1].replace("prices_", "").replace(".json", "")
        today_nrs = set(snapshot.keys())
        prev_nrs = set(prev.keys())

        arrivals = today_nrs - prev_nrs
        delistings = prev_nrs - today_nrs
        price_changes = []
        assortment_moves = []
        stock_changes = []

        for nr in today_nrs & prev_nrs:
            t, p = snapshot[nr], prev[nr]
            # Price change
            tp, pp = t["p"], p.get("p", p) if isinstance(p, dict) else p
            if isinstance(pp, dict):
                pp = pp.get("p", 0)
            if tp != pp and pp > 0:
                pct = round((tp - pp) / pp * 100)
                if abs(pct) >= 1:
                    price_changes.append({"nr": nr, "old": pp, "new": tp, "pct": pct})
            # Assortment move
            ta = t.get("a", "")
            pa = p.get("a", "")
            if ta and pa and ta != pa:
                assortment_moves.append({"nr": nr, "from": pa, "to": ta})
            # Stock status change
            t_oos = t.get("o", False) or t.get("t", False)
            p_oos = p.get("o", False) or p.get("t", False)
            if t_oos != p_oos:
                stock_changes.append({"nr": nr, "was_oos": p_oos, "now_oos": t_oos})

        deltas = {
            "date": today,
            "vs": prev_date,
            "arrivals": len(arrivals),
            "delistings": len(delistings),
            "price_changes": len(price_changes),
            "assortment_moves": len(assortment_moves),
            "stock_changes": len(stock_changes),
            "detail": {
                "arrivals": sorted(arrivals)[:50],
                "delistings": sorted(delistings)[:50],
                "price_up": sorted([c for c in price_changes if c["pct"] > 0], key=lambda x: -x["pct"])[:20],
                "price_down": sorted([c for c in price_changes if c["pct"] < 0], key=lambda x: x["pct"])[:20],
                "assortment_moves": assortment_moves[:20],
                "stock_changes": stock_changes[:20],
            },
        }
        delta_file = os.path.join(HIST_DIR, f"deltas_{today}.json")
        json.dump(deltas, open(delta_file, "w"), indent=2, ensure_ascii=False)
        print(f"  Deltas vs {prev_date}: +{len(arrivals)} arrivals, -{len(delistings)} delistings, "
              f"{len(price_changes)} price changes, {len(assortment_moves)} assortment moves, "
              f"{len(stock_changes)} stock changes")
    else:
        print(f"  No previous snapshot — skipping deltas")

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
