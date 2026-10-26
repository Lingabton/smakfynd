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

def _name_words(s):
    """Extract meaningful words (3+ chars) from a string."""
    import re
    return set(w.lower() for w in re.findall(r'[a-zà-öø-ÿ]{3,}', s.lower()))

def _normalize_producer(s):
    """Extract producer name, lowercased, from SB sub field."""
    import re
    s = s.lower().strip()
    s = re.sub(r'\b(s\.?l\.?|s\.?a\.?|s\.?r\.?l\.?|inc|ltd|gmbh|ab)\b', '', s)
    return s.strip()

def _grape_matches(sb_grape, we_variety):
    """Check if grape/variety matches (either direction substring)."""
    if not sb_grape or not we_variety:
        return False
    sg = sb_grape.lower()
    wv = we_variety.lower()
    return sg in wv or wv in sg

def _region_matches(sb_region, we_province, we_region1):
    """Check if SB region matches WE province or region_1."""
    if not sb_region:
        return False
    sr = sb_region.lower()
    for we_r in [we_province, we_region1]:
        if not we_r:
            continue
        wr = we_r.lower()
        if sr in wr or wr in sr:
            return True
    return False

def match_wine(sb_wine, candidates):
    """
    Match a SB wine against WE candidates from same country.
    Returns (score, we_entry, match_detail) or (0, None, '').

    Hard gates (all must pass):
      1. Country — already filtered by caller
      2. Producer — SB sub must fuzzy-match WE winery (>=70)
      3. Appellation OR grape — SB region matches WE province/region_1,
         OR SB grape matches WE variety
    """
    name = sb_wine.get('name', '')
    sub = sb_wine.get('sub', '')
    grape = sb_wine.get('grape', '').lower()
    region = sb_wine.get('region', '') or ''
    # SB puts producer in sub for some wines (Barolo Monvigliero / Oddero)
    # and in name for others (Gérard Bertrand / Corbières)
    name_normalized = _normalize_producer(name) if name else ''
    sub_normalized = _normalize_producer(sub) if sub else ''

    best = 0
    best_we = None
    best_detail = ''

    search = f"{name} {sub}".strip().lower()

    for we in candidates:
        title = we.get('title', '').lower()
        winery = we.get('winery', '').lower()
        we_variety = we.get('variety', '').lower()
        we_province = we.get('province', '') or ''
        we_region1 = we.get('region_1', '') or ''

        # GATE 1: Producer match — best of fuzz(name, winery) and fuzz(sub, winery)
        if not winery:
            continue
        score_name = fuzz.token_set_ratio(name_normalized, winery) if name_normalized else 0
        score_sub = fuzz.token_set_ratio(sub_normalized, winery) if sub_normalized else 0
        producer_score = max(score_name, score_sub)
        if producer_score < 70:
            continue

        # GATE 2: Appellation-or-grape
        has_grape = _grape_matches(grape, we_variety)
        has_region = _region_matches(region, we_province, we_region1)
        if not has_grape and not has_region:
            continue

        # Both gates passed — compute match quality
        r1 = fuzz.token_set_ratio(search, title)
        r2 = fuzz.token_set_ratio(search, f"{winery} {we_variety}")
        score = max(r1, r2)

        # Bonus for grape+region double match
        if has_grape and has_region:
            score += 5

        detail = f"producer={producer_score} grape={'Y' if has_grape else 'N'} region={'Y' if has_region else 'N'}"

        if score > best:
            best = score
            best_we = we
            best_detail = detail

    if best >= 80:
        return best, best_we, best_detail
    return 0, None, ''

def main():
    import random

    print("=" * 60)
    print("  SMAKFYND — Wine Enthusiast Expert Score Matcher")
    print("  Gates: producer + country + (appellation OR grape)")
    print("=" * 60)

    rescore = "--rescore" in sys.argv
    sample_only = "--sample" in sys.argv

    # Load existing cache
    cache = {}
    if OUT_FILE.exists() and not rescore:
        cache = json.load(open(OUT_FILE))
        print(f"Existing cache: {len(cache)} entries")
    elif rescore:
        print("RESCORE mode — rebuilding cache from scratch")

    # Load data
    sb = json.load(open(SB_FILE))
    wine_sb = [p for p in sb if p.get('cat1') == 'Vin']
    print(f"SB wines: {len(wine_sb)}")

    we_by_country = load_we()

    matched = 0
    skipped = 0
    no_match = 0
    no_country = 0
    all_matches = []

    for i, p in enumerate(wine_sb):
        nr = str(p.get('nr', ''))

        # Skip if already cached (unless rescoring)
        if nr in cache and not rescore:
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

        score, we_match, detail = match_wine(p, candidates)

        if we_match:
            matched += 1
            entry = {
                'expert_score': int(we_match.get('points', 0)),
                'expert_source': 'Wine Enthusiast',
                'expert_title': we_match.get('title', ''),
                'expert_variety': we_match.get('variety', ''),
                'expert_winery': we_match.get('winery', ''),
                'match_confidence': round(score),
                'match_detail': detail,
            }
            cache[nr] = entry
            all_matches.append({
                'nr': nr,
                'sb_name': p.get('name', ''),
                'sb_sub': p.get('sub', ''),
                'sb_country': p.get('country', ''),
                'sb_grape': p.get('grape', ''),
                'sb_region': p.get('region', ''),
                'we_winery': we_match.get('winery', ''),
                'we_title': we_match.get('title', ''),
                'we_variety': we_match.get('variety', ''),
                'we_points': we_match.get('points', ''),
                'score': round(score),
                'detail': detail,
            })
            if matched <= 20 or matched % 100 == 0:
                print(f"  [{matched}] {p['name']} ({p.get('sub','')}) -> {we_match['winery'][:25]} | {we_match['points']}pts ({score:.0f}%) {detail}")
        else:
            no_match += 1

        # Save periodically
        if (matched + no_match) % 500 == 0 and matched > 0:
            json.dump(cache, open(OUT_FILE, 'w'), ensure_ascii=False, indent=1)
            print(f"  ... saved {len(cache)} entries ({i+1}/{len(wine_sb)} processed)")

    # Final save
    if not sample_only:
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

    # Generate 50/50 labelled sample for human review
    if all_matches:
        sample_file = DATA_DIR / "expert_match_sample.json"
        n = min(50, len(all_matches))
        # Sort by confidence: 25 lowest (most likely wrong) + 25 highest (most likely right)
        by_score = sorted(all_matches, key=lambda x: x['score'])
        low = by_score[:n//2]
        high = by_score[-(n//2):]
        sample = low + high
        random.shuffle(sample)
        # Add empty label field for human review
        for s in sample:
            s['correct'] = None  # Gabriel fills in: true/false
        json.dump(sample, open(sample_file, 'w'), ensure_ascii=False, indent=2)
        print(f"\n  50/50 review sample: {sample_file}")
        print(f"  {n//2} lowest-confidence + {n//2} highest-confidence matches")
        print(f"  Open the file and set 'correct' to true or false for each entry")

if __name__ == "__main__":
    main()
