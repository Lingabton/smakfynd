#!/usr/bin/env python3
"""
Validate Vivino cache matches before they reach scoring.
Runs AFTER scraping, BEFORE score_wines_v2.py.

- Checks fuzzy match quality between SB wine name and Vivino matched name
- Entries with similarity < 80%: moved to flagged queue for manual review
- Entries with spam text: removed entirely
- Approved entries (from admin review): moved back to cache

Usage:
  python3 scripts/validate_vivino.py          # Validate + flag
  python3 scripts/validate_vivino.py --stats  # Show stats only
"""
import json, os, re, sys
from rapidfuzz import fuzz

DATA_DIR = os.path.expanduser("~/smakfynd/data")
CACHE_FILE = os.path.join(DATA_DIR, "vivino_cache.json")
FLAGGED_FILE = os.path.join(DATA_DIR, "vivino_flagged.json")
APPROVED_FILE = os.path.join(DATA_DIR, "vivino_approved.json")
REJECTED_FILE = os.path.join(DATA_DIR, "vivino_rejected.json")

MATCH_THRESHOLD = 80  # minimum fuzzy match % to auto-accept
SPAM_MARKERS = ['Gör som miljoner', 'Handla på världens', 'Användarvillkor',
                'Integritetspolicy', 'App Om Kontakt', 'Cookie-inställningar']

def normalize_name(name):
    """Normalize wine name for comparison."""
    name = name.lower().strip()
    # Remove common suffixes/noise
    name = re.sub(r'\b(n\.v\.|nv|brut|reserve|reserva|organic|grand cru|premier cru)\b', '', name)
    name = re.sub(r'\b\d{4}\b', '', name)  # Remove vintage years
    name = re.sub(r'\s+', ' ', name).strip()
    return name

def match_quality(sb_key, vivino_name):
    """Calculate match quality between SB wine and Vivino result."""
    parts = sb_key.split('|')
    sb_name = parts[0].strip()
    sb_sub = parts[1].strip() if len(parts) > 1 else ''

    sb_full = normalize_name(f"{sb_name} {sb_sub}")
    vn = normalize_name(vivino_name)

    scores = [
        fuzz.token_sort_ratio(sb_full, vn),
        fuzz.partial_ratio(sb_full, vn),
        fuzz.token_set_ratio(sb_full, vn),
    ]
    return max(scores)

def main():
    stats_only = "--stats" in sys.argv

    cache = json.load(open(CACHE_FILE)) if os.path.exists(CACHE_FILE) else {}
    flagged = json.load(open(FLAGGED_FILE)) if os.path.exists(FLAGGED_FILE) else {}
    approved = json.load(open(APPROVED_FILE)) if os.path.exists(APPROVED_FILE) else {}
    rejected = json.load(open(REJECTED_FILE)) if os.path.exists(REJECTED_FILE) else {}

    # Move approved entries back to cache
    restored = 0
    for key, entry in approved.items():
        cache[key] = entry
        restored += 1
    if restored:
        print(f"Restored {restored} approved entries to cache")

    # Validate all cache entries with ratings
    clean = {}
    new_flagged = {}
    removed_spam = 0
    removed_rejected = 0
    auto_accepted = 0
    already_flagged = 0

    for key, v in cache.items():
        vname = v.get('vivino_name', '')
        rating = v.get('vivino_rating', 0)

        # Skip entries without rating
        if not rating or rating <= 0:
            clean[key] = v
            continue

        # Remove spam entries
        if any(m in vname for m in SPAM_MARKERS):
            removed_spam += 1
            continue

        # Remove entries with too many search results
        m = re.search(r"'\((\d+)\)", vname)
        if m and int(m.group(1)) >= 50:
            removed_spam += 1
            continue

        # Skip rejected entries
        if key in rejected:
            removed_rejected += 1
            continue

        # Check fuzzy match quality
        quality = match_quality(key, vname)

        if quality >= MATCH_THRESHOLD:
            clean[key] = v
            auto_accepted += 1
        else:
            # Already flagged? Keep in flagged queue
            if key in flagged:
                new_flagged[key] = flagged[key]
                already_flagged += 1
            else:
                new_flagged[key] = {
                    **v,
                    "sb_key": key,
                    "match_quality": quality,
                    "flagged_reason": f"Low match ({quality}%): '{key.split('|')[0]}' vs '{vname[:60]}'"
                }

    newly_flagged = len(new_flagged) - already_flagged

    print(f"\n{'='*60}")
    print(f"VIVINO VALIDATION REPORT")
    print(f"{'='*60}")
    print(f"Cache entries:      {len(cache)}")
    print(f"Auto-accepted:      {auto_accepted} (≥{MATCH_THRESHOLD}% match)")
    print(f"Flagged for review: {len(new_flagged)} ({newly_flagged} new)")
    print(f"Removed (spam):     {removed_spam}")
    print(f"Removed (rejected): {removed_rejected}")
    print(f"Restored (approved):{restored}")
    print(f"Clean entries:      {len(clean)}")

    if new_flagged:
        print(f"\nTop flagged entries (lowest match):")
        sorted_flagged = sorted(new_flagged.items(), key=lambda x: x[1].get('match_quality', 0))
        for key, v in sorted_flagged[:10]:
            sb_name = key.split('|')[0]
            print(f"  {v.get('match_quality', 0):3.0f}% | {sb_name[:30]:<30} → {v.get('vivino_name', '')[:40]}")
            print(f"       Rating: {v.get('vivino_rating', 0)}, Reviews: {v.get('vivino_reviews', 0)}")

    if not stats_only:
        json.dump(clean, open(CACHE_FILE, 'w'), ensure_ascii=False)
        json.dump(new_flagged, open(FLAGGED_FILE, 'w'), ensure_ascii=False, indent=2)
        # Clear approved file (already merged)
        if restored:
            json.dump({}, open(APPROVED_FILE, 'w'))
        print(f"\nSaved: {len(clean)} clean → vivino_cache.json")
        print(f"Saved: {len(new_flagged)} flagged → vivino_flagged.json")
        if new_flagged:
            print(f"\nReview flagged entries: open docs/admin/vivino-review.html")

if __name__ == "__main__":
    main()
