#!/usr/bin/env python3
"""
Match Systembolaget wines against Wine Enthusiast 130k dataset.
Saves expert scores to data/expert_cache.json
"""

import json, csv, os, sys
from pathlib import Path
from rapidfuzz import fuzz

DATA_DIR = Path(__file__).parent.parent / "data"
SB_FILE = DATA_DIR / "systembolaget_raw.json"
WE_FILE = DATA_DIR / "winemag-data-130k-v2.csv"
OUT_FILE = DATA_DIR / "expert_cache.json"

# Country name mapping SB → WE
COUNTRY_MAP = {
    'Italien': 'Italy', 'Frankrike': 'France', 'Spanien': 'Spain',
    'USA': 'US', 'Tyskland': 'Germany', 'Sydafrika': 'South Africa',
    'Portugal': 'Portugal', 'Chile': 'Chile', 'Australien': 'Australia',
    'Argentina': 'Argentina', 'Nya Zeeland': 'New Zealand',
    'Österrike': 'Austria', 'Ungern': 'Hungary', 'Grekland': 'Greece',
    'Bulgarien': 'Bulgaria', 'Rumänien': 'Romania', 'Moldavien': 'Moldova',
    'Uruguay': 'Uruguay', 'Israel': 'Israel',
}

def load_we():
    """Load Wine Enthusiast data, indexed by country."""
    we_by_country = {}
    with open(WE_FILE, 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            c = row.get('country', '')
            we_by_country.setdefault(c, []).append(row)
    total = sum(len(v) for v in we_by_country.values())
    print(f"Loaded {total} WE reviews across {len(we_by_country)} countries")
    return we_by_country

def match_wine(sb_wine, candidates):
    """
    Try to match a SB wine against WE candidates from same country.
    Returns (score, we_entry) or (0, None) if no good match.
    """
    name = sb_wine.get('name', '')
    sub = sb_wine.get('sub', '')
    grape = sb_wine.get('grape', '').lower()
    
    best = 0
    best_we = None
    
    # Build search string
    search = f"{name} {sub}".strip().lower()
    name_lower = name.lower()
    
    for we in candidates:
        title = we.get('title', '').lower()
        winery = we.get('winery', '').lower()
        we_variety = we.get('variety', '').lower()
        
        # Strategy 1: Match full SB name against WE title
        r1 = fuzz.token_set_ratio(search, title)
        
        # Strategy 2: Match SB name against WE winery
        r2 = fuzz.token_set_ratio(name_lower, winery)
        
        # Strategy 3: Match SB name against WE winery + variety
        r3 = fuzz.token_set_ratio(search, f"{winery} {we_variety}")
        
        score = max(r1, r2 * 0.85, r3)
        
        # Bonus if grape matches
        if grape and len(grape) > 3 and grape in we_variety:
            score += 8
        
        # Penalty if grape explicitly mismatches
        if grape and we_variety and len(grape) > 3 and len(we_variety) > 3:
            if grape not in we_variety and we_variety not in grape:
                # Only penalize if both have grape info and they don't match
                if r2 > r1 and r2 > r3:  # Only when matched on winery name alone
                    score -= 5
        
        if score > best:
            best = score
            best_we = we
    
    # Stricter threshold
    if best >= 82:
        return best, best_we
    return 0, None

def main():
    print("=" * 60)
    print("  SMAKFYND — Wine Enthusiast Expert Score Matcher")
    print("=" * 60)
    
    # Load existing cache
    cache = {}
    if OUT_FILE.exists():
        cache = json.load(open(OUT_FILE))
        print(f"Existing cache: {len(cache)} entries")
    
    # Load data
    sb = json.load(open(SB_FILE))
    wine_sb = [p for p in sb if p.get('cat1') == 'Vin']
    print(f"SB wines: {len(wine_sb)}")
    
    we_by_country = load_we()
    
    matched = 0
    skipped = 0
    no_match = 0
    no_country = 0
    
    for i, p in enumerate(wine_sb):
        nr = str(p.get('nr', ''))
        
        # Skip if already cached
        if nr in cache:
            skipped += 1
            continue
        
        sb_country = COUNTRY_MAP.get(p.get('country', ''), '')
        if not sb_country:
            no_country += 1
            continue
        
        candidates = we_by_country.get(sb_country, [])
        if not candidates:
            no_country += 1
            continue
        
        score, we_match = match_wine(p, candidates)
        
        if we_match:
            matched += 1
            cache[nr] = {
                'expert_score': int(we_match.get('points', 0)),
                'expert_source': 'Wine Enthusiast',
                'expert_title': we_match.get('title', ''),
                'expert_variety': we_match.get('variety', ''),
                'expert_winery': we_match.get('winery', ''),
                'match_confidence': round(score),
            }
            if matched <= 20 or matched % 100 == 0:
                print(f"  [{matched}] {p['name']} → {we_match['winery'][:25]} | {we_match['points']}pts ({score:.0f}%)")
        else:
            no_match += 1
        
        # Save periodically
        if (matched + no_match) % 500 == 0 and matched > 0:
            json.dump(cache, open(OUT_FILE, 'w'), ensure_ascii=False, indent=1)
            print(f"  ... saved {len(cache)} entries ({i+1}/{len(wine_sb)} processed)")
    
    # Final save
    json.dump(cache, open(OUT_FILE, 'w'), ensure_ascii=False, indent=1)
    
    print()
    print("=" * 60)
    print(f"  Matched:    {matched}")
    print(f"  No match:   {no_match}")
    print(f"  No country: {no_country}")
    print(f"  Skipped:    {skipped} (already cached)")
    print(f"  Total cache: {len(cache)}")
    print(f"  Saved to: {OUT_FILE}")
    print("=" * 60)

if __name__ == "__main__":
    main()
