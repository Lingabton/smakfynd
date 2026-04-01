#!/usr/bin/env python3
"""
Scrape EAN/GTIN barcodes for Systembolaget wines.
==================================================

Strategy: Systembolaget does NOT expose EAN/GTIN codes anywhere:
  - Not in their ecommerce search API (v1/productsearch)
  - Not in the product detail page HTML or __NEXT_DATA__ JSON
  - Not in any public data feed (the old XML/JSON feeds are gone)
  - The __NEXT_DATA__ product object has 100+ fields but zero barcode fields

This script uses Open Food Facts (OFF) as a fallback source. OFF is a
crowd-sourced database where users scan barcodes. Coverage for Swedish
wines is low (~5-10% of Systembolaget's catalog) but it's the best
freely available source.

Approach:
  1. Load wine data from smakfynd_ranked_v2.json
  2. For each wine, search Open Food Facts by name + brand
  3. If found, extract the EAN code (the 'code' field in OFF)
  4. Save results to data/ean_lookup.json (EAN → nr mapping)
  5. Also save data/ean_progress.json for resumability

Alternative approaches (documented but not implemented):
  - Vivino sometimes has EAN in their internal DB but doesn't expose it
  - Wine-Searcher has EAN for some wines but requires paid API
  - GS1 Sweden has the authoritative registry but requires membership
  - Manual scanning: scan the barcode on the physical bottle

Usage:
    python scripts/scrape_ean.py              # Run full scrape
    python scripts/scrape_ean.py --dry-run    # Show stats without fetching
    python scripts/scrape_ean.py --stats      # Show progress stats
"""

import argparse
import json
import logging
import time
from pathlib import Path

import requests
from rapidfuzz import fuzz

# ── Config ──────────────────────────────────────────────────
DATA_DIR = Path(__file__).parent.parent / "data"
RANKED_FILE = DATA_DIR / "smakfynd_ranked_v2.json"
EAN_LOOKUP_FILE = DATA_DIR / "ean_lookup.json"
EAN_PROGRESS_FILE = DATA_DIR / "ean_progress.json"

OFF_SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl"
RATE_LIMIT = 1.0  # seconds between requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("scrape_ean")

HEADERS = {
    "User-Agent": "Smakfynd EAN Scraper/1.0 (https://smakfynd.se; data pipeline)",
}


# ── Helpers ──────────────────────────────────────────────────

def load_progress():
    """Load progress file to enable resume."""
    if EAN_PROGRESS_FILE.exists():
        return json.loads(EAN_PROGRESS_FILE.read_text("utf-8"))
    return {"checked": {}, "found": {}}


def save_progress(progress):
    EAN_PROGRESS_FILE.write_text(
        json.dumps(progress, ensure_ascii=False, indent=2), "utf-8"
    )


def load_ean_lookup():
    if EAN_LOOKUP_FILE.exists():
        return json.loads(EAN_LOOKUP_FILE.read_text("utf-8"))
    return {}


def save_ean_lookup(lookup):
    EAN_LOOKUP_FILE.write_text(
        json.dumps(lookup, ensure_ascii=False, indent=2), "utf-8"
    )


def search_open_food_facts(product_name, country=""):
    """Search Open Food Facts for a wine by name.

    Returns: {"ean": str, "off_name": str, "off_brands": str} or None
    """
    # Clean up the search query
    query = product_name.strip()

    # Add country to help narrow down
    if country and country not in query:
        query = f"{query} {country}"

    params = {
        "search_terms": query,
        "json": "1",
        "page_size": "5",
        "fields": "code,product_name,brands,stores,countries_tags,categories_tags",
        "action": "process",
    }

    try:
        r = requests.get(
            OFF_SEARCH_URL,
            params=params,
            headers=HEADERS,
            timeout=15,
        )
        if r.status_code != 200:
            log.warning(f"  OFF returned {r.status_code}")
            return None

        data = r.json()
        products = data.get("products", [])

        if not products:
            return None

        # Find best fuzzy match
        best = None
        best_score = 0

        for p in products:
            off_name = p.get("product_name", "")
            off_brands = p.get("brands", "")
            full_name = f"{off_brands} {off_name}".strip()

            if not full_name:
                continue

            ratio = fuzz.token_sort_ratio(
                product_name.lower(), full_name.lower()
            )

            # Check if it's actually wine
            categories = " ".join(p.get("categories_tags", []))
            is_wine = any(
                w in categories.lower()
                for w in ["wine", "vin", "vino", "wein"]
            )

            # Boost score for wine-categorized products
            effective_ratio = ratio + (10 if is_wine else 0)

            if effective_ratio > best_score and ratio > 50:
                code = p.get("code", "")
                if code and len(code) >= 8:  # Valid EAN is 8-13 digits
                    best_score = effective_ratio
                    best = {
                        "ean": code,
                        "off_name": full_name,
                        "off_brands": off_brands,
                        "match_score": ratio,
                    }

        return best

    except Exception as e:
        log.warning(f"  OFF search failed for '{product_name}': {e}")
        return None


# ── Main ──────────────────────────────────────────────────

def run_scrape(dry_run=False):
    """Main scrape loop with resume support."""
    if not RANKED_FILE.exists():
        log.error(f"Ranked file not found: {RANKED_FILE}")
        return

    wines = json.loads(RANKED_FILE.read_text("utf-8"))
    log.info(f"Loaded {len(wines)} products from {RANKED_FILE.name}")

    # Filter to only wines (skip beer/cider)
    wine_types = {"Rött", "Vitt", "Rosé", "Mousserande"}
    wines = [w for w in wines if w.get("type", "") in wine_types]
    log.info(f"Filtered to {len(wines)} wine products")

    progress = load_progress()
    ean_lookup = load_ean_lookup()

    checked = progress.get("checked", {})
    found_count = len(progress.get("found", {}))
    new_found = 0
    skipped = 0
    errors = 0

    if dry_run:
        already_checked = sum(1 for w in wines if w.get("nr", "") in checked)
        log.info(f"Already checked: {already_checked}/{len(wines)}")
        log.info(f"EANs found so far: {found_count}")
        log.info(f"Remaining to check: {len(wines) - already_checked}")
        estimated_time = (len(wines) - already_checked) * RATE_LIMIT
        log.info(f"Estimated time: {estimated_time / 60:.0f} minutes")
        return

    for i, wine in enumerate(wines):
        nr = wine.get("nr", "")
        if not nr:
            continue

        # Skip already checked
        if nr in checked:
            skipped += 1
            continue

        search_name = f"{wine.get('name', '')} {wine.get('sub', '')}".strip()
        country = wine.get("country", "")

        log.info(f"[{i+1}/{len(wines)}] Searching: {search_name} ({country})")

        result = search_open_food_facts(search_name, country)

        if result:
            ean = result["ean"]
            ean_lookup[ean] = {
                "nr": nr,
                "sb_name": search_name,
                "off_name": result["off_name"],
                "match_score": result["match_score"],
            }
            progress.setdefault("found", {})[nr] = ean
            new_found += 1
            log.info(
                f"  FOUND: EAN {ean} → {result['off_name']} "
                f"(match: {result['match_score']}%)"
            )
        else:
            log.debug(f"  Not found in OFF")

        checked[nr] = True
        progress["checked"] = checked

        # Save periodically
        if (i + 1) % 25 == 0:
            save_progress(progress)
            save_ean_lookup(ean_lookup)
            total_checked = len(checked)
            total_found = len(progress.get("found", {}))
            log.info(
                f"  Progress: {total_checked} checked, "
                f"{total_found} EANs found ({new_found} new this run)"
            )

        # Rate limit
        time.sleep(RATE_LIMIT)

    # Final save
    save_progress(progress)
    save_ean_lookup(ean_lookup)

    total_found = len(progress.get("found", {}))
    log.info(f"\nDone! Checked {len(checked)} wines total")
    log.info(f"EANs found: {total_found} ({new_found} new this run)")
    log.info(f"Skipped (already checked): {skipped}")
    log.info(f"Hit rate: {total_found / max(len(checked), 1) * 100:.1f}%")


def show_stats():
    """Show current progress stats."""
    progress = load_progress()
    ean_lookup = load_ean_lookup()

    checked = progress.get("checked", {})
    found = progress.get("found", {})

    log.info(f"Products checked: {len(checked)}")
    log.info(f"EANs found: {len(found)}")
    log.info(f"EAN lookup entries: {len(ean_lookup)}")

    if checked:
        log.info(f"Hit rate: {len(found) / len(checked) * 100:.1f}%")

    if found:
        log.info("\nSample EANs found:")
        for nr, ean in list(found.items())[:10]:
            entry = ean_lookup.get(ean, {})
            log.info(f"  {ean} → nr {nr} ({entry.get('sb_name', '?')})")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Scrape EAN/barcode data for Systembolaget wines"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Show what would be done without fetching"
    )
    parser.add_argument(
        "--stats", action="store_true",
        help="Show current progress stats"
    )
    args = parser.parse_args()

    if args.stats:
        show_stats()
    else:
        run_scrape(dry_run=args.dry_run)
