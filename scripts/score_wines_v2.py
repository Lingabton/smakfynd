#!/usr/bin/env python3
"""
Smakfynd Scoring v2 — Fixed
Correctly maps Vivino cache (name|sub|country) and Expert cache (nr)
"""

import json, os, statistics, logging
from pathlib import Path
from datetime import date

DATA_DIR = Path(__file__).parent.parent / "data"
LOG_DIR = Path(__file__).parent.parent / "logs"

def load_data():
    sb = json.load(open(DATA_DIR / "systembolaget_raw.json"))
    vivino = json.load(open(DATA_DIR / "vivino_cache.json")) if (DATA_DIR / "vivino_cache.json").exists() else {}
    expert = json.load(open(DATA_DIR / "expert_cache.json")) if (DATA_DIR / "expert_cache.json").exists() else {}
    print(f"SB: {len(sb)} | Vivino: {len(vivino)} | WE expert: {len(expert)}")
    return sb, vivino, expert

SPAM_MARKERS = ['Gör som miljoner', 'Handla på världens', 'Användarvillkor',
                'Integritetspolicy', 'App Om Kontakt', 'Cookie-inställningar']

# Grape-aware food pairing prediction for wines missing SB tasteSymbols
LIGHT_RED_GRAPES = {'pinot noir', 'gamay', 'grenache', 'garnacha', 'cinsault',
                    'nerello mascalese', 'trousseau', 'poulsard', 'zweigelt', 'blaufränkisch'}
HEAVY_RED_GRAPES = {'cabernet sauvignon', 'syrah', 'shiraz', 'nebbiolo', 'malbec',
                    'tannat', 'mourvèdre', 'monastrell', 'petit verdot', 'aglianico',
                    'sagrantino', 'touriga nacional'}

def predict_food_pairings(wine_type, grape):
    """Predict food pairings from wine type + grape, based on SB data patterns."""
    g = (grape.split(',')[0].strip().lower() if grape else '')
    if wine_type == 'Rött':
        if g in LIGHT_RED_GRAPES:
            return ['Fågel', 'Fläsk', 'Grönsaker']
        else:  # heavy reds + default
            return ['Lamm', 'Nöt', 'Vilt']
    elif wine_type == 'Vitt':
        if g in {'riesling', 'grüner veltliner', 'sauvignon blanc', 'albariño', 'muscadet', 'verdejo'}:
            return ['Fisk', 'Skaldjur', 'Grönsaker']
        elif g in {'chardonnay', 'viognier', 'chenin blanc', 'marsanne', 'roussanne'}:
            return ['Fisk', 'Fågel', 'Grönsaker']
        else:
            return ['Fisk', 'Grönsaker', 'Skaldjur']
    elif wine_type == 'Rosé':
        return ['Sällskapsdryck', 'Grönsaker', 'Fågel', 'Fisk']
    elif wine_type == 'Mousserande':
        return ['Fisk', 'Skaldjur', 'Aperitif']
    return []

def get_vivino(p, vivino_cache):
    """Look up Vivino data using name|sub|country key format."""
    import re
    name = p.get('name', '')
    sub = p.get('sub', '')
    country = p.get('country', '')
    key = f"{name}|{sub}|{country}"
    v = vivino_cache.get(key, {})
    rating = v.get('vivino_rating', 0)
    reviews = v.get('vivino_reviews', 0)
    vname = v.get('vivino_name', '')
    # Reject entries with spam text or too many search results
    if any(m in vname for m in SPAM_MARKERS):
        return None, 0
    m = re.search(r"'\((\d+)\)", vname)
    if m and int(m.group(1)) >= 50:
        return None, 0
    if rating and rating > 0:
        return rating, reviews
    return None, 0

def vivino_to_10(rating, reviews):
    if not rating or rating < 1:
        return None
    raw = (rating - 1) * 2.25 + 0.5
    raw = max(1.0, min(10.0, raw))
    # Bayesian shrinkage: k=30 (less aggressive, trust actual ratings more)
    k = 30
    n = reviews or 0
    adjusted = (n / (n + k)) * raw + (k / (n + k)) * 6.0
    # High-confidence bonus: many reviews = more trustworthy
    if n >= 50000:
        adjusted += 0.3
    elif n >= 10000:
        adjusted += 0.15
    return round(min(10.0, adjusted), 1)

def expert_to_10(points):
    if not points or points < 80:
        return None
    # 80→4.0, 86→5.8, 90→7.0, 94→8.2, 97→9.1, 100→10.0
    raw = (points - 80) * 0.3 + 4.0
    return round(max(1.0, min(10.0, raw)), 1)

def compute_price_scores(wines):
    groups = {}
    # Group by type + package for base median
    for w in wines:
        key = (w.get('cat2', ''), w.get('pkg', ''))
        groups.setdefault(key, []).append(w)
    medians = {}
    for key, group in groups.items():
        prices = [w['price'] / (w['vol'] / 1000) for w in group if w.get('vol', 0) > 0 and w.get('price', 0) > 0]
        if prices:
            medians[key] = statistics.median(prices)

    # Price tier medians: compare within price bracket, not across all
    price_tiers = [(0, 100), (100, 200), (200, 400), (400, 9999)]
    tier_medians = {}
    for key, group in groups.items():
        for lo, hi in price_tiers:
            tier_wines = [w for w in group if lo <= (w.get('price', 0) or 0) < hi and w.get('vol', 0) > 0 and w.get('price', 0) > 0]
            tier_prices = [w['price'] / (w['vol'] / 1000) for w in tier_wines]
            if tier_prices:
                tier_medians[(key, lo, hi)] = statistics.median(tier_prices)

    for w in wines:
        key = (w.get('cat2', ''), w.get('pkg', ''))
        vol = w.get('vol', 750)
        price = w.get('price', 0)
        if vol <= 0 or price <= 0:
            w['_price_score'] = None
            continue

        # Blended approach: 60% tier median (fair within prisklass) + 40% category median (rewards low price)
        tier_med = None
        for lo, hi in price_tiers:
            if lo <= price < hi:
                tier_med = tier_medians.get((key, lo, hi))
                break
        cat_median = medians.get(key)
        if not cat_median:
            w['_price_score'] = None
            continue

        liter_price = price / (vol / 1000)
        # Tier score: how good within your price bracket
        tier_ratio = liter_price / (tier_med or cat_median)
        tier_score = max(1.0, min(10.0, 10.5 - tier_ratio * 5.0))
        # Category score: how good vs all wines (rewards absolute cheapness)
        cat_ratio = liter_price / cat_median
        cat_score = max(1.0, min(10.0, 10.5 - cat_ratio * 5.0))
        # Blend: 60% tier + 40% category
        w['_price_score'] = round(max(1.0, min(10.0, tier_score * 0.6 + cat_score * 0.4)), 1)



def smakfynd_score(crowd, expert, price_val, organic=False):
    """Returns (rounded_int, raw_float) or (None, None)."""
    # Determine quality score (weighted blend of crowd + expert)
    if crowd and expert:
        # Bonus when crowd and expert agree (within 1.5 of each other)
        agreement_bonus = 0.3 if abs(crowd - expert) < 1.5 else 0
        quality = (crowd + expert) / 2 + agreement_bonus
    elif crowd:
        quality = crowd
    elif expert:
        # Expert-only: slight penalty (no crowd validation)
        quality = expert * 0.9
    else:
        return None, None

    if not price_val:
        return None, None

    # Quality must meet minimum threshold
    # crowd 6.5/10 or expert 7.0/10 maps to quality ~6.3
    # Below that → score capped at 50
    quality_floor = quality >= 6.3

    # Sustainability bonus: small nudge for organic wines
    if organic:
        quality += 0.2

    # Final blend: quality 75%, price 25%
    raw = quality * 0.75 + price_val * 0.25

    # Map to 25-95 scale using sigmoid curve
    # Centered at raw=6.4 (median), spreads the 5.5-7.5 range across 40-85
    import math
    clamped = max(4.0, min(9.0, raw))
    x = (clamped - 6.4) * 3.0  # steepness
    sig = 1 / (1 + math.exp(-x))
    score_raw = 25 + sig * 70
    score_raw = max(25.0, min(95.0, score_raw))

    # Apply quality floor
    if not quality_floor and score_raw > 50:
        score_raw = 50.0

    return round(score_raw), round(score_raw, 4)

def confidence(reviews, has_exp):
    """Evidence confidence: hög = crowd + expert, medel = one strong, låg = one weak."""
    has_crowd = (reviews or 0) >= 25
    if has_crowd and has_exp:
        return "hög"
    # One signal — how strong?
    if has_crowd and (reviews or 0) >= 200:
        return "medel"
    if has_exp:
        return "medel"
    # Crowd with few reviews, or expert near threshold
    return "låg"

def detect_outliers(wines, threshold=5.0):
    """Flag wines with price > threshold × category median. Logs to logs/outliers.log."""
    LOG_DIR.mkdir(exist_ok=True)
    log_file = LOG_DIR / "outliers.log"

    # Build median prices per cat3 (fallback to cat2)
    groups = {}
    for w in wines:
        cat = w.get('cat3') or w.get('cat2', 'Okänd')
        price = w.get('price', 0) or 0
        if price > 0:
            groups.setdefault(cat, []).append(price)
    medians = {cat: statistics.median(prices) for cat, prices in groups.items() if prices}

    outliers = []
    for w in wines:
        cat = w.get('cat3') or w.get('cat2', 'Okänd')
        price = w.get('price', 0) or 0
        median = medians.get(cat)
        if not median or price <= 0:
            continue
        ratio = price / median
        if ratio > threshold:
            outliers.append({
                'nr': w.get('nr', ''),
                'name': f"{w.get('name', '')} {w.get('sub', '')}".strip(),
                'price': price,
                'vol': w.get('vol', 750),
                'category': cat,
                'median': round(median),
                'ratio': round(ratio, 1),
            })

    today = date.today().isoformat()
    with open(log_file, 'a') as f:
        if outliers:
            f.write(f"\n--- {today} ---\n")
            for o in sorted(outliers, key=lambda x: -x['ratio']):
                f.write(f"  {o['nr']:>8}  {o['price']:>8}kr  {o['vol']}ml  "
                        f"median:{o['median']}kr  {o['ratio']}x  {o['name'][:50]}\n")
        else:
            f.write(f"\n--- {today} --- Inga outliers\n")

    return outliers

def main():
    print("=" * 60)
    print("  SMAKFYND SCORING v2")
    print("=" * 60)
    sb, vivino, expert = load_data()
    wines = [p for p in sb if p.get('cat1') == 'Vin']
    print(f"Wines: {len(wines)}")

    for w in wines:
        vol = w.get('vol', 750) or 750
        price = w.get('price', 0) or 0
        pkg = w.get('pkg', '')
        if pkg == 'BiB':
            pass  # Scraper already classified correctly
        elif pkg == 'Stor' or (not pkg and vol > 1500):
            # Distinguish real BiB from large-format bottles:
            # BiB: vol 2000-3000ml, affordable liter price (< 150 kr/L)
            # Stor: expensive bottles (dubbelmagnum, jeroboam, trälåda)
            liter_price = price / (vol / 1000) if vol > 0 and price > 0 else 999
            if vol <= 3000 and liter_price < 150:
                w['pkg'] = 'BiB'
            else:
                w['pkg'] = 'Stor'
        elif not pkg:
            w['pkg'] = 'Flaska'

    compute_price_scores(wines)

    outliers = detect_outliers(wines)
    if outliers:
        print(f"\n  ⚠ OUTLIERS ({len(outliers)} wines with price > 5x category median):")
        for o in sorted(outliers, key=lambda x: -x['ratio'])[:10]:
            print(f"    {o['nr']:>8}  {o['price']:>8}kr  {o['ratio']}x median ({o['median']}kr)  {o['name'][:40]}")
        print(f"    → Full list: logs/outliers.log")

    results = []
    n_crowd = n_expert = n_both = 0

    for p in wines:
        nr = str(p.get('nr', ''))
        v_rating, v_reviews = get_vivino(p, vivino)

        # Expert score from expert_cache only
        we = expert.get(nr, {})
        we_pts = we.get('expert_score')
        e_pts = we_pts
        e_source = we.get('expert_source', 'Wine Enthusiast') if we_pts else ''

        c10 = vivino_to_10(v_rating, v_reviews)
        e10 = expert_to_10(e_pts)
        p10 = p.get('_price_score')

        # Minimum threshold: need 25+ crowd reviews OR expert score
        if (v_reviews or 0) < 25 and not e10:
            continue

        sf, sf_raw = smakfynd_score(c10, e10, p10, organic=p.get('organic', False))
        if sf is None:
            continue

        if c10: n_crowd += 1
        if e10: n_expert += 1
        if c10 and e10: n_both += 1

        wine_type = p.get('cat2', '').replace('Rött vin', 'Rött').replace('Vitt vin', 'Vitt').replace('Rosévin', 'Rosé').replace('Mousserande vin', 'Mousserande')
        grape = p.get('grape', '') or (we.get('expert_variety', '') if we.get('match_confidence', 0) >= 80 else '')

        results.append({
            'nr': nr,
            'name': p.get('name', ''),
            'sub': p.get('sub', ''),
            'price': p.get('price', 0),
            'vol': p.get('vol', 750),
            'alc': p.get('alc', 0),
            'type': wine_type,
            'pkg': p.get('pkg'),
            'country': p.get('country', ''),
            'region': p.get('region', ''),
            'grape': grape,
            'organic': p.get('organic', False),
            'style': p.get('style', ''),
            'cat3': p.get('cat3', ''),
            'image_url': p.get('image_url', ''),
            'food_pairings': p.get('food_pairings', []) or predict_food_pairings(wine_type, grape),
            'assortment': p.get('assortment', ''),
            'taste_body': p.get('taste_body'),
            'taste_sweet': p.get('taste_sweet'),
            'taste_fruit': p.get('taste_fruit'),
            'taste_bitter': p.get('taste_bitter'),
            'crowd_score': c10,
            'crowd_rating': v_rating,
            'crowd_reviews': v_reviews,
            'expert_score': e10,
            'expert_points': e_pts,
            'expert_source': e_source,
            'has_expert': e10 is not None,
            'price_score': p10,
            'smakfynd_score': sf,
            '_score_raw': sf_raw,
            'confidence': confidence(v_reviews, e10 is not None),
            'score': sf / 10,
            'rating': v_rating,
            'reviews': v_reviews,
        })

    results.sort(key=lambda x: (-x['_score_raw'], str(x.get('nr', ''))))
    out = DATA_DIR / "smakfynd_ranked_v2.json"
    tmp = DATA_DIR / "smakfynd_ranked_v2.json.tmp"
    with open(tmp, 'w') as f:
        json.dump(results, f, ensure_ascii=False, indent=1)
    os.replace(tmp, out)

    print(f"\n  Scored:     {len(results)}")
    print(f"  Has crowd:  {n_crowd}")
    print(f"  Has expert: {n_expert}")
    print(f"  Has both:   {n_both}")
    print(f"\n  TOP 15:")
    for i, w in enumerate(results[:15]):
        c = f"C:{w['crowd_score']}" if w['crowd_score'] else "C:--"
        e = f"E:{w['expert_score']}" if w['expert_score'] else "E:--"
        p = f"P:{w['price_score']}" if w['price_score'] else "P:--"
        conf = w['confidence']
        print(f"  {i+1:2}. {w['smakfynd_score']:3}/100  ({w['_score_raw']:.2f})  {c:>7}  {e:>7}  {p:>7}  {w['name'][:28]:28}  {w['price']}kr  [{conf}]")
    print(f"\n  Saved: {out}")

if __name__ == "__main__":
    main()
