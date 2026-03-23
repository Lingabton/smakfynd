#!/usr/bin/env python3
"""
SMAKFYND SCORER
Combines Systembolaget products with Vivino ratings to produce
Smakfynd-poäng rankings.

Formula:
  Kvalitet = vivino_rating × (0.55 + 0.45 × min(reviews / 15000, 1.0))
  Relativt_pris = product_price_per_L / category_median_price_per_L
  Smakfynd_poäng = (Kvalitet / Relativt_pris) × 3.5

Output: data/smakfynd_ranked.json
"""
import json, os, statistics

DATA_DIR = os.path.expanduser("~/smakfynd/data")
SB_FILE = os.path.join(DATA_DIR, "systembolaget_raw.json")
CACHE_FILE = os.path.join(DATA_DIR, "vivino_cache.json")
OUTPUT_FILE = os.path.join(DATA_DIR, "smakfynd_ranked.json")

def main():
    products = json.load(open(SB_FILE))
    cache = json.load(open(CACHE_FILE))
    
    print(f"Products: {len(products)}")
    print(f"Cache: {len(cache)} entries, {sum(1 for v in cache.values() if v.get('vivino_rating',0)>0)} with ratings")
    
    # Step 1: Match products to cache
    matched = []
    unmatched = []
    
    for p in products:
        key = f"{p.get('name','')}|{p.get('sub','')}|{p.get('country','')}"
        c = cache.get(key, {})
        rating = c.get('vivino_rating', 0)
        reviews = c.get('vivino_reviews', 0)
        
        if rating > 0:
            p['vivino_rating'] = rating
            p['vivino_reviews'] = reviews if reviews > 0 else 0
            p['vivino_name'] = c.get('vivino_name', '')
            matched.append(p)
        else:
            unmatched.append(p)
    
    print(f"Matched: {len(matched)}, Unmatched: {len(unmatched)}")
    
    # Step 2: Calculate category medians (price per liter)
    categories = {}
    for p in matched:
        cat = p.get('cat1', 'Övrigt')
        if not cat:
            cat = 'Övrigt'
        price = p.get('price', 0)
        vol = p.get('vol', 750)
        if price > 0 and vol > 0:
            ppl = price / (vol / 1000.0)  # price per liter
            p['price_per_l'] = round(ppl, 1)
            categories.setdefault(cat, []).append(ppl)
    
    medians = {}
    for cat, prices in categories.items():
        medians[cat] = statistics.median(prices)
        print(f"  {cat}: median {medians[cat]:.0f} kr/L ({len(prices)} products)")
    
    # Step 3: Calculate Smakfynd-poäng
    scored = []
    for p in matched:
        cat = p.get('cat1', 'Övrigt') or 'Övrigt'
        median = medians.get(cat, 200)
        ppl = p.get('price_per_l', 0)
        
        if ppl <= 0 or median <= 0:
            continue
        
        rating = p['vivino_rating']
        reviews = p.get('vivino_reviews', 0)
        
        # Quality score: rating weighted by review confidence
        quality = rating * (0.55 + 0.45 * min(reviews / 15000.0, 1.0))
        
        # Relative price
        rel_price = ppl / median
        
        # Smakfynd-poäng
        score = (quality / rel_price) * 3.5
        
        p['smakfynd_score'] = round(score, 1)
        p['quality_score'] = round(quality, 2)
        p['relative_price'] = round(rel_price, 2)
        scored.append(p)
    
    print(f"\nScored: {len(scored)} products")
    
    # Step 4: Sort and output
    scored.sort(key=lambda x: -x['smakfynd_score'])
    
    # Category breakdown
    cat_counts = {}
    for p in scored:
        cat = p.get('cat1', '?')
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
    
    print("\nBy category:")
    for cat, count in sorted(cat_counts.items(), key=lambda x: -x[1]):
        top = [p for p in scored if p.get('cat1') == cat][:3]
        print(f"  {cat}: {count} products")
        for t in top:
            print(f"    {t['smakfynd_score']:5.1f}  ★{t['vivino_rating']:.1f}  {t['price']:>4}kr  {t['name'][:35]}")
    
    # Top 30 overall
    print(f"\n{'='*80}")
    print(f" SMAKFYND TOP 30 — Mest smak för pengarna")
    print(f"{'='*80}")
    for i, p in enumerate(scored[:30]):
        cat = p.get('cat1', '?')[:4]
        org = ' ⚘' if p.get('organic') else ''
        print(f"  {i+1:2d}. {p['smakfynd_score']:5.1f}  ★{p['vivino_rating']:.1f}  {p['price']:>4}kr  {p['name'][:35]:35s}  {cat}{org}")
    
    # Save
    output = {
        "generated": __import__('time').strftime("%Y-%m-%d %H:%M"),
        "total_scored": len(scored),
        "categories": {cat: {"count": count, "median_ppl": round(medians.get(cat, 0))} 
                      for cat, count in cat_counts.items()},
        "products": scored,
    }
    json.dump(output, open(OUTPUT_FILE, 'w'), ensure_ascii=False, indent=2)
    print(f"\nSaved {len(scored)} scored products to {OUTPUT_FILE}")
    
    # Also save a slim version for the website
    slim = []
    for p in scored:
        slim.append({
            "nr": p.get("nr", ""),
            "name": p.get("name", ""),
            "sub": p.get("sub", ""),
            "price": p.get("price", 0),
            "vol": p.get("vol", 750),
            "cat1": p.get("cat1", ""),
            "country": p.get("country", ""),
            "grape": p.get("grape", ""),
            "organic": p.get("organic", False),
            "score": p["smakfynd_score"],
            "rating": p["vivino_rating"],
            "reviews": p.get("vivino_reviews", 0),
            "image_url": p.get("image_url", ""),
            "taste_body": p.get("taste_body", ""),
            "taste_fruit": p.get("taste_fruit", ""),
            "food_pairings": p.get("food_pairings", ""),
        })
    
    slim_file = os.path.join(DATA_DIR, "smakfynd_web.json")
    json.dump(slim, open(slim_file, 'w'), ensure_ascii=False)
    print(f"Saved slim web data ({len(slim)} products) to {slim_file}")
    
    # Quick file size check
    size = os.path.getsize(slim_file) / 1024
    print(f"Web JSON size: {size:.0f} KB")

if __name__ == "__main__":
    main()
