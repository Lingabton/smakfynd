#!/usr/bin/env python3
"""
Patch missing wine images by scraping product pages on systembolaget.se.
The API misses many products, but the web pages always have the correct productId.

Usage:
  python3 scripts/patch_images.py --test 20
  python3 scripts/patch_images.py
"""
import json, re, time, argparse, os
from pathlib import Path

try:
    import requests
except ImportError:
    print("pip install requests")
    exit(1)

DATA_DIR = Path(__file__).parent.parent / "data"
RAW_FILE = DATA_DIR / "systembolaget_raw.json"
CACHE_FILE = DATA_DIR / "image_cache.json"
RATE_LIMIT = 1

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
}

def load_cache():
    if CACHE_FILE.exists():
        return json.load(open(CACHE_FILE))
    return {}

def save_cache(cache):
    json.dump(cache, open(CACHE_FILE, 'w'), ensure_ascii=False, indent=1)

def fetch_image_url(nr):
    """Fetch product page and extract image productId."""
    try:
        r = requests.get(f"https://www.systembolaget.se/produkt/vin/{nr}",
            headers=HEADERS, timeout=10, allow_redirects=True)
        if r.status_code != 200:
            return None
        matches = re.findall(r'product-cdn\.systembolaget\.se/productimages/(\d+)/\1', r.text)
        if matches:
            pid = matches[0]
            return f"https://product-cdn.systembolaget.se/productimages/{pid}/{pid}_400.webp"
    except:
        pass
    return None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--test', type=int, default=0)
    args = parser.parse_args()

    raw = json.load(open(RAW_FILE))
    no_img = [w for w in raw if not w.get('image_url')]
    print(f"Viner utan bild: {len(no_img)}")

    cache = load_cache()
    print(f"Cache: {len(cache)} entries")

    wines = no_img
    if args.test:
        wines = wines[:args.test]

    patched = skipped = failed = 0

    for i, w in enumerate(wines):
        nr = str(w.get('nr', ''))
        if nr in cache:
            skipped += 1
            continue

        print(f"[{i+1}/{len(wines)}] {w.get('name','')}...", end=" ", flush=True)
        url = fetch_image_url(nr)

        if url:
            cache[nr] = url
            patched += 1
            print(f"OK {url.split('/')[-2]}")
        else:
            cache[nr] = ""
            failed += 1
            print("no image")

        if (patched + failed) % 20 == 0:
            save_cache(cache)
        time.sleep(RATE_LIMIT)

    save_cache(cache)

    # Apply to raw data
    applied = 0
    for w in raw:
        nr = str(w.get('nr', ''))
        if not w.get('image_url') and cache.get(nr):
            w['image_url'] = cache[nr]
            applied += 1

    json.dump(raw, open(RAW_FILE, 'w'), ensure_ascii=False)
    print(f"\n{'='*50}")
    print(f"  Patched:  {patched}")
    print(f"  Failed:   {failed}")
    print(f"  Skipped:  {skipped}")
    print(f"  Applied:  {applied} images to raw data")
    print(f"{'='*50}")

if __name__ == "__main__":
    main()
