#!/usr/bin/env python3
"""
SMAKFYND SCORER v2
Proper category separation, volume-type handling, and deduplication.
"""
import json, os, statistics, time

DATA_DIR = os.path.expanduser("~/smakfynd/data")
SB_FILE = os.path.join(DATA_DIR, "systembolaget_raw.json")
CACHE_FILE = os.path.join(DATA_DIR, "vivino_cache.json")
OUTPUT_FILE = os.path.join(DATA_DIR, "smakfynd_ranked.json")
WEB_FILE = os.path.join(DATA_DIR, "smakfynd_web.json")

def classify(p):
    """Classify product into type and package."""
    cat2 = p.get('cat2', '').lower()
    vol = p.get('vol', 750)
    
    # Wine type
    if 'rött' in cat2:
        wtype = 'Rött'
    elif 'vitt' in cat2:
        wtype = 'Vitt'
    elif 'rosé' in cat2:
        wtype = 'Rosé'
    elif 'mousserande' in cat2:
        wtype = 'Mousserande'
    elif any(x in cat2 for x in ['lager', 'ale', 'porter', 'stout', 'veteöl', 'syrlig', 'öl']):
        wtype = 'Öl'
    elif any(x in cat2 for x in ['cider', 'blanddryck']):
        wtype = 'Cider'
    else:
        wtype = 'Övrigt'
    
    # Package type
    if vol >= 2000:
        pkg = 'BiB'
    elif vol > 750:
        pkg = 'Stor'
    else:
        pkg = 'Flaska'
    
    return wtype, pkg

def score_group(products, group_name):
    """Score a group of products using their own median."""
    prices = [p['price_per_l'] for p in products if p.get('price_per_l', 0) > 0]
    if not prices:
        return products
    
    median = statistics.median(prices)
    
    for p in products:
        ppl = p.get('price_per_l', 0)
        if ppl <= 0:
            p['smakfynd_score'] = 0
            continue
        
        rating = p['vivino_rating']
        reviews = p.get('vivino_reviews', 0)
        quality = rating * (0.55 + 0.45 * min(reviews / 15000.0, 1.0))
        rel_price = ppl / median
        score = (quality / rel_price) * 3.5
        
        p['smakfynd_score'] = round(score, 1)
        p['quality_score'] = round(quality, 2)
        p['relative_price'] = round(rel_price, 2)
    
    return products

def main():
    products = json.load(open(SB_FILE))
    cache = json.load(open(CACHE_FILE))
    
    print(f"Products: {len(products)}")
    print(f"Cache: {len(cache)}")
    
    # Match to Vivino
    matched = []
    for p in products:
        key = f"{p.get('name','')}|{p.get('sub','')}|{p.get('country','')}"
        c = cache.get(key, {})
        rating = c.get('vivino_rating', 0)
        if rating > 0:
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
            matched.append(p)
    
    print(f"Matched: {len(matched)}")
    
    # Score each (wine_type + package) group separately
    groups = {}
    for p in matched:
        key = f"{p['wine_type']}|{p['package']}"
        groups.setdefault(key, []).append(p)
    
    all_scored = []
    print("\nGroups:")
    for key, prods in sorted(groups.items(), key=lambda x: -len(x[1])):
        prices = [p['price_per_l'] for p in prods if p.get('price_per_l', 0) > 0]
        med = statistics.median(prices) if prices else 0
        score_group(prods, key)
        print(f"  {key:25s}: {len(prods):4d} products, median {med:.0f} kr/L")
        all_scored.extend(prods)
    
    # Deduplicate: same name+sub = keep highest scored
    seen = {}
    deduped = []
    for p in sorted(all_scored, key=lambda x: -x.get('smakfynd_score', 0)):
        dedup_key = f"{p.get('name','')}|{p.get('sub','')}|{p.get('wine_type','')}|{p.get('package','')}"
        if dedup_key not in seen:
            seen[dedup_key] = True
            deduped.append(p)
    
    print(f"\nAfter dedup: {len(deduped)} (removed {len(all_scored) - len(deduped)} duplicates)")
    
    # Print top lists
    wine_types = ['Rött', 'Vitt', 'Rosé', 'Mousserande']
    for wt in wine_types:
        bottles = [p for p in deduped if p['wine_type'] == wt and p['package'] == 'Flaska']
        bottles.sort(key=lambda x: -x.get('smakfynd_score', 0))
        
        if not bottles:
            continue
        
        print(f"\n{'='*70}")
        print(f" TOP 10 {wt.upper()} VIN (flaska)")
        print(f"{'='*70}")
        for i, p in enumerate(bottles[:10]):
            org = ' ⚘' if p.get('organic') else ''
            print(f"  {i+1:2d}. {p['smakfynd_score']:5.1f}  ★{p['vivino_rating']:.1f}  {p['price']:>5.0f}kr  {p['name'][:28]:28s} {p.get('sub','')[:18]:18s} {p.get('country','')[:8]}{org}")
    
    # BiB top 5
    bib = [p for p in deduped if p['package'] == 'BiB' and p['wine_type'] in ('Rött', 'Vitt')]
    bib.sort(key=lambda x: -x.get('smakfynd_score', 0))
    if bib:
        print(f"\n{'='*70}")
        print(f" TOP 5 BAG-IN-BOX")
        print(f"{'='*70}")
        for i, p in enumerate(bib[:5]):
            print(f"  {i+1:2d}. {p['smakfynd_score']:5.1f}  ★{p['vivino_rating']:.1f}  {p['price']:>5.0f}kr  {p['name'][:28]:28s} {p.get('sub','')[:18]:18s} {p['wine_type']}")
    
    # Save full ranked JSON
    output = {
        "generated": time.strftime("%Y-%m-%d %H:%M"),
        "total_scored": len(deduped),
        "products": deduped,
    }
    json.dump(output, open(OUTPUT_FILE, 'w'), ensure_ascii=False, indent=2)
    
    # Save slim web JSON
    slim = []
    for p in deduped:
        slim.append({
            "nr": p.get("nr", ""),
            "name": p.get("name", ""),
            "sub": p.get("sub", ""),
            "price": p.get("price", 0),
            "vol": p.get("vol", 750),
            "type": p.get("wine_type", ""),
            "pkg": p.get("package", ""),
            "country": p.get("country", ""),
            "grape": p.get("grape", ""),
            "organic": p.get("organic", False),
            "score": p.get("smakfynd_score", 0),
            "rating": p.get("vivino_rating", 0),
            "reviews": p.get("vivino_reviews", 0),
            "image_url": p.get("image_url", ""),
            "taste_body": p.get("taste_body", ""),
            "taste_fruit": p.get("taste_fruit", ""),
            "food_pairings": p.get("food_pairings", ""),
            "cat3": p.get("cat3", ""),
        })
    
    json.dump(slim, open(WEB_FILE, 'w'), ensure_ascii=False)
    size = os.path.getsize(WEB_FILE) / 1024
    print(f"\nSaved {len(deduped)} products to {OUTPUT_FILE}")
    print(f"Saved web data to {WEB_FILE} ({size:.0f} KB)")

if __name__ == "__main__":
    main()
