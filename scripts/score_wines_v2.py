#!/usr/bin/env python3
"""
Smakfynd Scoring v2 — Fixed
Correctly maps Vivino cache (name|sub|country) and Expert cache (nr)
"""

import json, statistics
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"

def load_data():
    sb = json.load(open(DATA_DIR / "systembolaget_raw.json"))
    vivino = json.load(open(DATA_DIR / "vivino_cache.json")) if (DATA_DIR / "vivino_cache.json").exists() else {}
    expert = json.load(open(DATA_DIR / "expert_cache.json")) if (DATA_DIR / "expert_cache.json").exists() else {}
    ws = json.load(open(DATA_DIR / "winesearcher_cache.json")) if (DATA_DIR / "winesearcher_cache.json").exists() else {}
    ws_scores = {nr: v['aggregate_score'] for nr, v in ws.items() if v.get('aggregate_score')}
    ws_critics = {nr: v.get('critics', []) for nr, v in ws.items() if v.get('aggregate_score')}
    print(f"SB: {len(sb)} | Vivino: {len(vivino)} | WE expert: {len(expert)} | WS critic: {len(ws_scores)}")
    return sb, vivino, expert, ws_scores, ws_critics

def get_vivino(p, vivino_cache):
    """Look up Vivino data using name|sub|country key format."""
    name = p.get('name', '')
    sub = p.get('sub', '')
    country = p.get('country', '')
    key = f"{name}|{sub}|{country}"
    v = vivino_cache.get(key, {})
    rating = v.get('vivino_rating', 0)
    reviews = v.get('vivino_reviews', 0)
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
        key = (w.get('cat2', ''), w.get('_pkg', ''))
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
        key = (w.get('cat2', ''), w.get('_pkg', ''))
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

# Critic reliability weights based on correlation with crowd scores
# Higher weight = more aligned with crowd opinion = more trustworthy for value scoring
CRITIC_WEIGHTS = {
    "Revista Adega": 1.3,           # r=0.70, strong crowd alignment
    "Gismondi on Wine": 1.2,        # r=0.62, good alignment
    "Gilbert & Gaillard": 1.1,      # r=0.50, moderate alignment
    "Wine Enthusiast": 1.0,         # r=0.33, baseline (largest sample)
    "James Suckling": 1.0,          # baseline
    "Falstaff": 1.0,                # baseline
    "Wine Spectator": 1.0,          # baseline
    "Decanter": 0.95,               # slight inverse
    "Decanter World Wine Awards": 0.9,  # r=-0.03, independent
    "Patricio Tapia - Descorchados": 0.85,  # r=-0.15, inverse
    "Gambero Rosso": 0.8,           # r=-0.81, strongly inverse
}

def weighted_expert_score(critics):
    """Calculate weighted expert score from individual critics."""
    recognized = [c for c in critics if c.get('recognized') and c.get('score')]
    if not recognized:
        return None
    # Deduplicate by critic name
    deduped = list({c['critic']: c for c in recognized}.values())
    if not deduped:
        return None
    weighted_sum = 0
    weight_total = 0
    for c in deduped:
        w = CRITIC_WEIGHTS.get(c['critic'], 1.0)
        weighted_sum += c['score'] * w
        weight_total += w
    return weighted_sum / weight_total if weight_total > 0 else None

def critic_consensus(critics):
    """Analyze critic score spread. Returns (bonus, spread, label)."""
    recognized = [c for c in critics if c.get('recognized')]
    if len(recognized) < 3:
        return 0, None, None
    scores = [c['score'] for c in recognized if c.get('score')]
    if len(scores) < 3:
        return 0, None, None
    spread = max(scores) - min(scores)
    avg = sum(scores) / len(scores)
    # Tight consensus (spread <= 4 points) with good scores = bonus
    if spread <= 4 and avg >= 88:
        return 0.4, spread, "stark konsensus"
    elif spread <= 4 and avg >= 85:
        return 0.25, spread, "konsensus"
    elif spread <= 6:
        return 0.1, spread, "enig"
    elif spread >= 12:
        return -0.1, spread, "kontroversiellt"
    return 0, spread, None

def smakfynd_score(crowd, expert, price_val, organic=False, consensus_bonus=0):
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
        return None

    if not price_val:
        return None

    # Quality must meet minimum threshold
    # crowd 6.5/10 or expert 7.0/10 maps to quality ~6.3
    # Below that → score capped at 50
    quality_floor = quality >= 6.3

    # Sustainability bonus: small nudge for organic wines
    if organic:
        quality += 0.2

    # Critic consensus bonus
    if consensus_bonus:
        quality += consensus_bonus

    # Final blend: quality 75%, price 25%
    raw = quality * 0.75 + price_val * 0.25

    # Map to 25-95 scale using sigmoid curve
    # Centered at raw=6.4 (median), spreads the 5.5-7.5 range across 40-85
    import math
    clamped = max(4.0, min(9.0, raw))
    x = (clamped - 6.4) * 3.0  # steepness
    sig = 1 / (1 + math.exp(-x))
    score = round(25 + sig * 70)
    score = max(25, min(95, score))

    # Apply quality floor
    if not quality_floor and score > 50:
        score = 50

    return score

def confidence(reviews, has_exp, conf=0):
    s = 0
    if reviews and reviews >= 5000: s += 2
    elif reviews and reviews >= 500: s += 1
    if has_exp:
        s += 2
        if conf and conf >= 90: s += 1
    return "hög" if s >= 4 else "medel" if s >= 2 else "låg"

def main():
    print("=" * 60)
    print("  SMAKFYND SCORING v2")
    print("=" * 60)
    sb, vivino, expert, ws_scores, ws_critics = load_data()
    wines = [p for p in sb if p.get('cat1') == 'Vin']
    print(f"Wines: {len(wines)}")

    for w in wines:
        vol = w.get('vol', 750)
        w['_pkg'] = 'Flaska' if vol == 750 else ('BiB' if vol >= 2000 else 'Stor')

    compute_price_scores(wines)

    results = []
    n_crowd = n_expert = n_both = n_ws = 0

    for p in wines:
        nr = str(p.get('nr', ''))
        v_rating, v_reviews = get_vivino(p, vivino)

        # Expert score: prefer Wine-Searcher (fresh, aggregated), fall back to WE
        ws_pts = ws_scores.get(nr)
        we = expert.get(nr, {})
        we_pts = we.get('expert_score')
        wine_critics = ws_critics.get(nr, [])

        # Use weighted expert score from individual critics when available
        ws_weighted = weighted_expert_score(wine_critics) if wine_critics else None

        if ws_weighted:
            e_pts = ws_weighted
            e_source = 'Wine-Searcher'
            n_ws += 1
        elif ws_pts:
            e_pts = ws_pts
            e_source = 'Wine-Searcher'
            n_ws += 1
        elif we_pts:
            e_pts = we_pts
            e_source = we.get('expert_source', 'Wine Enthusiast')
        else:
            e_pts = None
            e_source = ''

        c10 = vivino_to_10(v_rating, v_reviews)
        e10 = expert_to_10(e_pts)
        p10 = p.get('_price_score')

        # Minimum threshold: need 25+ crowd reviews OR expert score
        if (v_reviews or 0) < 25 and not e10:
            continue

        # Critic consensus analysis
        c_bonus, c_spread, c_label = critic_consensus(wine_critics)

        sf = smakfynd_score(c10, e10, p10, organic=p.get('organic', False), consensus_bonus=c_bonus)
        if sf is None:
            continue

        if c10: n_crowd += 1
        if e10: n_expert += 1
        if c10 and e10: n_both += 1

        results.append({
            'nr': nr,
            'name': p.get('name', ''),
            'sub': p.get('sub', ''),
            'price': p.get('price', 0),
            'vol': p.get('vol', 750),
            'alc': p.get('alc', 0),
            'type': p.get('cat2', '').replace('Rött vin', 'Rött').replace('Vitt vin', 'Vitt').replace('Rosévin', 'Rosé').replace('Mousserande vin', 'Mousserande'),
            'pkg': p.get('_pkg'),
            'country': p.get('country', ''),
            'region': p.get('region', ''),
            'grape': p.get('grape', ''),
            'organic': p.get('organic', False),
            'style': p.get('style', ''),
            'cat3': p.get('cat3', ''),
            'image_url': p.get('image_url', ''),
            'food_pairings': p.get('food_pairings', []),
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
            'critics': list({c['critic']: c for c in ws_critics.get(nr, []) if c.get('recognized')}.values())[:8],
            'num_critics': len({c['critic']: c for c in ws_critics.get(nr, []) if c.get('recognized')}),
            'critic_spread': c_spread,
            'critic_consensus': c_label,
            'price_score': p10,
            'smakfynd_score': sf,
            'confidence': confidence(v_reviews, e10 is not None, 0),
            'score': sf / 10,
            'rating': v_rating,
            'reviews': v_reviews,
        })

    results.sort(key=lambda x: -x['smakfynd_score'])
    out = DATA_DIR / "smakfynd_ranked_v2.json"
    json.dump(results, open(out, 'w'), ensure_ascii=False, indent=1)

    print(f"\n  Scored:     {len(results)}")
    print(f"  Has crowd:  {n_crowd}")
    print(f"  Has expert: {n_expert} (WS: {n_ws}, WE: {n_expert - n_ws})")
    print(f"  Has both:   {n_both}")
    print(f"\n  TOP 15:")
    for i, w in enumerate(results[:15]):
        c = f"C:{w['crowd_score']}" if w['crowd_score'] else "C:--"
        e = f"E:{w['expert_score']}" if w['expert_score'] else "E:--"
        p = f"P:{w['price_score']}" if w['price_score'] else "P:--"
        conf = w['confidence']
        print(f"  {i+1:2}. {w['smakfynd_score']:3}/100  {c:>7}  {e:>7}  {p:>7}  {w['name'][:28]:28}  {w['price']}kr  [{conf}]")
    print(f"\n  Saved: {out}")

if __name__ == "__main__":
    main()
