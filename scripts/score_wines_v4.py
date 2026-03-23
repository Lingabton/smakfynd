#!/usr/bin/env python3
"""
SMAKFYND SCORER v4
- Price bracket scoring: median calculated within each price bracket
- Minimum rating 3.5
- Dampened price exponent 0.6
- Proper category + package separation
- Deduplication
- Includes alc field
"""
import json, os, statistics, time

DATA_DIR = os.path.expanduser("~/smakfynd/data")
SB_FILE = os.path.join(DATA_DIR, "systembolaget_raw.json")
CACHE_FILE = os.path.join(DATA_DIR, "vivino_cache.json")
OUTPUT_FILE = os.path.join(DATA_DIR, "smakfynd_ranked.json")
WEB_FILE = os.path.join(DATA_DIR, "smakfynd_web.json")

PRICE_EXPONENT = 0.6
MIN_RATING = 3.5
PRICE_BRACKETS = [(0, 99), (100, 149), (150, 249), (250, 9999)]

def classify(p):
    cat2 = p.get('cat2', '').lower()
    vol = p.get('vol', 750)
    if 'rött' in cat2: wtype = 'Rött'
    elif 'vitt' in cat2: wtype = 'Vitt'
    elif 'rosé' in cat2: wtype = 'Rosé'
    elif 'mousserande' in cat2: wtype = 'Mousserande'
    elif any(x in cat2 for x in ['lager','ale','porter','stout','veteöl','syrlig','öl']): wtype = 'Öl'
    elif any(x in cat2 for x in ['cider','blanddryck']): wtype = 'Cider'
    else: wtype = 'Övrigt'
    if vol >= 2000: pkg = 'BiB'
    elif vol > 750: pkg = 'Stor'
    else: pkg = 'Flaska'
    return wtype, pkg

def get_bracket(price):
    for lo, hi in PRICE_BRACKETS:
        if lo <= price <= hi:
            return f"{lo}-{hi}"
    return "0-99"

def main():
    products = json.load(open(SB_FILE))
    cache = json.load(open(CACHE_FILE))
    print(f"Products: {len(products)}, Cache: {len(cache)}")
    print(f"Settings: min_rating={MIN_RATING}, price_exponent={PRICE_EXPONENT}")
    
    # Match + filter
    matched = []
    low_rating = 0
    for p in products:
        key = f"{p.get('name','')}|{p.get('sub','')}|{p.get('country','')}"
        c = cache.get(key, {})
        rating = c.get('vivino_rating', 0)
        if rating < MIN_RATING:
            if rating > 0: low_rating += 1
            continue
        p['vivino_rating'] = rating
        p['vivino_reviews'] = c.get('vivino_reviews', 0)
        p['vivino_name'] = c.get('vivino_name', '')
        vol = p.get('vol', 750)
        price = p.get('price', 0)
        if price > 0 and vol > 0:
            p['price_per_l'] = round(price / (vol / 1000.0), 1)
        wtype, pkg = classify(p)
        p['wine_type'] = wtype
        p['package'] = pkg
        p['price_bracket'] = get_bracket(price)
        matched.append(p)
    
    print(f"Matched: {len(matched)} (filtered {low_rating} below {MIN_RATING})")
    
    # Score within PRICE BRACKET + WINE TYPE + PACKAGE groups
    groups = {}
    for p in matched:
        key = f"{p['wine_type']}|{p['package']}|{p['price_bracket']}"
        groups.setdefault(key, []).append(p)
    
    all_scored = []
    print(f"\nScoring {len(groups)} groups:")
    for key, prods in sorted(groups.items(), key=lambda x: -len(x[1])):
        prices = [p['price_per_l'] for p in prods if p.get('price_per_l', 0) > 0]
        if not prices: continue
        median = statistics.median(prices)
        
        for p in prods:
            ppl = p.get('price_per_l', 0)
            if ppl <= 0:
                p['smakfynd_score'] = 0
                continue
            rating = p['vivino_rating']
            reviews = p.get('vivino_reviews', 0)
            quality = rating * (0.55 + 0.45 * min(reviews / 15000.0, 1.0))
            rel_price = (ppl / median) ** PRICE_EXPONENT
            p['smakfynd_score'] = round((quality / rel_price) * 3.5, 1)
            p['quality_score'] = round(quality, 2)
            p['relative_price'] = round(ppl / median, 2)
        
        if len(prods) >= 10:
            print(f"  {key:35s}: {len(prods):4d} products, median {median:.0f} kr/L")
        all_scored.extend(prods)
    
    # Deduplicate
    seen = {}
    deduped = []
    for p in sorted(all_scored, key=lambda x: -x.get('smakfynd_score', 0)):
        dk = f"{p.get('name','')}|{p.get('sub','')}|{p.get('wine_type','')}|{p.get('package','')}"
        if dk not in seen:
            seen[dk] = True
            deduped.append(p)
    
    print(f"\nTotal: {len(deduped)} (deduped {len(all_scored)-len(deduped)})")
    
    # Print top lists per bracket
    for lo, hi in PRICE_BRACKETS:
        label = f"Under {hi+1}" if lo == 0 else f"{lo}-{hi}" if hi < 9999 else f"{lo}+"
        wines = sorted([p for p in deduped if p['package']=='Flaska' 
                       and p['wine_type'] in ('Rött','Vitt','Rosé','Mousserande')
                       and lo <= p.get('price',0) <= hi],
                      key=lambda x: -x.get('smakfynd_score', 0))
        if not wines: continue
        print(f"\n{'='*70}")
        print(f" TOP 8 FYND: {label} kr")
        print(f"{'='*70}")
        for i, p in enumerate(wines[:8]):
            org = ' ⚘' if p.get('organic') else ''
            print(f"  {i+1}. {p['smakfynd_score']:5.1f}  ★{p['vivino_rating']:.1f}  {p['price']:>5.0f}kr  {p['name'][:25]:25s} {p.get('sub','')[:18]:18s} {p['wine_type']}{org}")
    
    # Save
    output = {
        "generated": time.strftime("%Y-%m-%d %H:%M"),
        "settings": {"min_rating": MIN_RATING, "price_exponent": PRICE_EXPONENT,
                     "scoring": "price_bracket_median"},
        "total_scored": len(deduped),
        "products": deduped,
    }
    json.dump(output, open(OUTPUT_FILE, 'w'), ensure_ascii=False, indent=2)
    
    slim = []
    for p in deduped:
        slim.append({
            "nr": p.get("nr",""), "name": p.get("name",""), "sub": p.get("sub",""),
            "price": p.get("price",0), "vol": p.get("vol",750), "alc": p.get("alc",0),
            "type": p.get("wine_type",""), "pkg": p.get("package",""),
            "country": p.get("country",""), "grape": p.get("grape",""),
            "organic": p.get("organic",False),
            "score": p.get("smakfynd_score",0), "rating": p.get("vivino_rating",0),
            "reviews": p.get("vivino_reviews",0),
            "image_url": p.get("image_url",""),
            "food_pairings": p.get("food_pairings",""), "cat3": p.get("cat3",""),
        })
    
    json.dump(slim, open(WEB_FILE, 'w'), ensure_ascii=False)
    size = os.path.getsize(WEB_FILE) / 1024
    print(f"\nSaved {len(deduped)} to {OUTPUT_FILE}")
    print(f"Web data: {WEB_FILE} ({size:.0f} KB)")

if __name__ == "__main__":
    main()
