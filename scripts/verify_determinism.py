#!/usr/bin/env python3
"""
Verify pipeline determinism. Run twice from identical (and shuffled) input,
compare wines.json byte-for-byte and per-page article lists.

Usage: python3 scripts/verify_determinism.py
"""

import json, os, hashlib, random, shutil, subprocess, sys, re
from pathlib import Path

BASE = Path(__file__).parent.parent
DATA_DIR = BASE / "data"
DOCS = BASE / "docs"
RAW_FILE = DATA_DIR / "systembolaget_raw.json"
WINES_JSON = DOCS / "wines.json"

PIPELINE = [
    ["python3", "scripts/score_wines_v2.py"],
    ["python3", "scripts/build_slim.py"],
    ["python3", "scripts/generate_landing_pages.py"],
]

def file_hash(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def get_page_articles(slug):
    """Extract article numbers from a landing page."""
    index = DOCS / slug / "index.html"
    if not index.exists():
        return []
    html = index.read_text()
    return re.findall(r'/produkt/vin/(\d+)', html)

def get_all_page_hashes():
    """Get ordered article-number hash per landing page."""
    hashes = {}
    for entry in sorted(DOCS.iterdir()):
        if not entry.is_dir() or entry.name in ("admin", "integritet", "tack", "specs"):
            continue
        articles = get_page_articles(entry.name)
        if articles:
            h = hashlib.sha256("|".join(articles).encode()).hexdigest()[:12]
            hashes[entry.name] = {"articles": len(articles), "hash": h}
    return hashes

def run_pipeline():
    """Run the full scoring + build + landing page pipeline."""
    for cmd in PIPELINE:
        result = subprocess.run(cmd, cwd=str(BASE), capture_output=True, text=True)
        if result.returncode != 0:
            print(f"  FAIL: {' '.join(cmd)}")
            print(result.stderr[-500:] if result.stderr else "no stderr")
            return False
    return True

def main():
    print("=" * 60)
    print("  DETERMINISM VERIFICATION")
    print("=" * 60)

    if not RAW_FILE.exists():
        print("FAIL: data/systembolaget_raw.json not found")
        sys.exit(1)

    raw_data = json.load(open(RAW_FILE))
    print(f"Raw input: {len(raw_data)} products")
    passed = 0
    failed = 0

    # ── Test 1: Two runs from identical input ──
    print("\n--- Test 1: Two runs, identical input ---")
    if not run_pipeline():
        print("FAIL: Pipeline run 1 failed")
        sys.exit(1)
    hash_1 = file_hash(WINES_JSON)
    pages_1 = get_all_page_hashes()

    if not run_pipeline():
        print("FAIL: Pipeline run 2 failed")
        sys.exit(1)
    hash_2 = file_hash(WINES_JSON)
    pages_2 = get_all_page_hashes()

    if hash_1 == hash_2:
        print(f"  PASS: wines.json identical ({hash_1[:16]}...)")
        passed += 1
    else:
        print(f"  FAIL: wines.json differs (run1: {hash_1[:16]}, run2: {hash_2[:16]})")
        failed += 1

    page_diffs = 0
    for slug in sorted(set(pages_1.keys()) | set(pages_2.keys())):
        h1 = pages_1.get(slug, {}).get("hash")
        h2 = pages_2.get(slug, {}).get("hash")
        if h1 != h2:
            page_diffs += 1
            print(f"  FAIL: /{slug}/ article list changed")

    if page_diffs == 0:
        print(f"  PASS: {len(pages_1)} landing pages identical")
        passed += 1
    else:
        print(f"  FAIL: {page_diffs}/{len(pages_1)} landing pages differ")
        failed += 1

    # ── Test 2: Shuffled input ──
    print("\n--- Test 2: Shuffled input ---")
    random.shuffle(raw_data)
    json.dump(raw_data, open(RAW_FILE, "w"), ensure_ascii=False)
    print(f"  Shuffled {len(raw_data)} products")

    if not run_pipeline():
        print("FAIL: Pipeline run 3 (shuffled) failed")
        sys.exit(1)
    hash_3 = file_hash(WINES_JSON)
    pages_3 = get_all_page_hashes()

    if hash_3 == hash_1:
        print(f"  PASS: wines.json identical after shuffle")
        passed += 1
    else:
        print(f"  FAIL: wines.json differs after shuffle")
        failed += 1

    page_diffs_shuffle = 0
    for slug in sorted(set(pages_1.keys()) | set(pages_3.keys())):
        h1 = pages_1.get(slug, {}).get("hash")
        h3 = pages_3.get(slug, {}).get("hash")
        if h1 != h3:
            page_diffs_shuffle += 1

    if page_diffs_shuffle == 0:
        print(f"  PASS: {len(pages_1)} landing pages identical after shuffle")
        passed += 1
    else:
        print(f"  FAIL: {page_diffs_shuffle}/{len(pages_1)} landing pages differ after shuffle")
        failed += 1

    # ── Restore original order ──
    raw_data.sort(key=lambda x: str(x.get("nr", "")))
    json.dump(raw_data, open(RAW_FILE, "w"), ensure_ascii=False)

    # ── Save wine-list hashes ──
    print("\n--- Wine-list hashes ---")
    hashes = get_all_page_hashes()
    hash_file = DATA_DIR / "list_hashes.json"
    json.dump(hashes, open(hash_file, "w"), indent=2, ensure_ascii=False)
    print(f"  Saved {len(hashes)} page hashes to {hash_file}")

    # ── Summary ──
    print(f"\n{'=' * 60}")
    total = passed + failed
    if failed == 0:
        print(f"  ALL {total} CHECKS PASSED")
    else:
        print(f"  {failed}/{total} CHECKS FAILED")
    print(f"{'=' * 60}")
    sys.exit(1 if failed > 0 else 0)

if __name__ == "__main__":
    main()
