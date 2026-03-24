#!/usr/bin/env python3
"""Build smakfynd site with v2 data (crowd + expert + price scores)."""
import json, os

DATA_DIR = os.path.expanduser("~/smakfynd/data")
SITE_FILE = os.path.expanduser("~/smakfynd/scripts/smakfynd-v7.jsx")
OUTPUT = os.path.expanduser("~/smakfynd/site/smakfynd-v7-slim.jsx")

# Read v2 ranked data (with crowd, expert, price scores)
src = os.path.join(DATA_DIR, "smakfynd_ranked_v2.json")
if not os.path.exists(src):
    print("ERROR: smakfynd_ranked_v2.json not found. Run score_wines_v2.py first.")
    exit(1)

data = json.load(open(src))
print(f"Total: {len(data)} scored products")

# Filter: must have a score, default to "Fast sortiment"
data = [p for p in data if p.get('smakfynd_score') and p.get('smakfynd_score') > 0]
print(f"After score filter: {len(data)} products")
fast = [p for p in data if p.get('assortment') == 'Fast sortiment']
tillfälligt = [p for p in data if p.get('assortment') != 'Fast sortiment']
print(f"Fast sortiment: {len(fast)} | Tillfälligt/övrigt: {len(tillfälligt)}")
# Include all but mark assortment so JSX can filter
print(f"After filter: {len(data)} products")

# Keep top 80 per type+package combo
groups = {}
for p in data:
    key = f"{p.get('type','')}|{p.get('pkg','')}"
    groups.setdefault(key, []).append(p)

slim = []
for key, prods in groups.items():
    prods.sort(key=lambda x: -(x.get('smakfynd_score', 0)))
    slim.extend(prods[:80])
    print(f"  {key}: {len(prods)} -> {min(len(prods), 80)}")

# Build minimal JSON with all needed fields
mini = []
for p in slim:
    m = {
        "nr": p.get("nr", ""),
        "name": p.get("name", ""),
        "sub": p.get("sub", ""),
        "price": p.get("price", 0),
        "vol": p.get("vol", 750),
        "type": p.get("type", ""),
        "pkg": p.get("pkg", ""),
        "country": p.get("country", ""),
        "grape": p.get("grape", ""),
        # v2 scores
        "score": p.get("score", 0),  # legacy: smakfynd/10
        "smakfynd_score": p.get("smakfynd_score", 0),
        "crowd_score": p.get("crowd_score"),
        "crowd_rating": p.get("crowd_rating"),
        "crowd_reviews": p.get("crowd_reviews", 0),
        "expert_score": p.get("expert_score"),
        "expert_points": p.get("expert_points"),
        "has_expert": p.get("has_expert", False),
        "price_score": p.get("price_score"),
        "confidence": p.get("confidence", "låg"),
        "assortment": p.get("assortment", ""),
        # Vivino legacy
        "rating": p.get("rating", 0),
        "reviews": p.get("reviews", 0),
        # Image
        "image_url": (p.get("image_url", "") + "_400.png") if p.get("image_url") and not p.get("image_url", "").endswith(".png") else p.get("image_url", ""),
    }
    # Optional fields (only include if they have data)
    if p.get("organic"): m["organic"] = True
    if p.get("cat3"): m["cat3"] = p["cat3"]
    if p.get("food_pairings"): m["food_pairings"] = p["food_pairings"]
    if p.get("taste_body"): m["taste_body"] = p["taste_body"]
    if p.get("taste_sweet") is not None: m["taste_sweet"] = p["taste_sweet"]
    if p.get("taste_fruit"): m["taste_fruit"] = p["taste_fruit"]
    if p.get("taste_bitter") is not None: m["taste_bitter"] = p["taste_bitter"]
    if p.get("style"): m["style"] = p["style"]
    if p.get("region"): m["region"] = p["region"]
    if p.get("expert_source"): m["expert_source"] = p["expert_source"]
    mini.append(m)

# Remove None values to save space
for m in mini:
    for k in list(m.keys()):
        if m[k] is None:
            del m[k]

print(f"Slim: {len(mini)} products")

# Count data coverage
has_crowd = sum(1 for m in mini if m.get('crowd_score'))
has_expert = sum(1 for m in mini if m.get('has_expert'))
has_both = sum(1 for m in mini if m.get('crowd_score') and m.get('has_expert'))
has_taste = sum(1 for m in mini if m.get('taste_body'))
print(f"  Crowd: {has_crowd} | Expert: {has_expert} | Both: {has_both} | Taste: {has_taste}")

# Inject into JSX template
jsx = open(SITE_FILE).read()
js_data = json.dumps(mini, ensure_ascii=False, separators=(',', ':'))
jsx = jsx.replace(
    'const SAMPLE_PRODUCTS = []; // Will be replaced by loaded data',
    f'const SAMPLE_PRODUCTS = {js_data};'
)

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
open(OUTPUT, 'w').write(jsx)
size = os.path.getsize(OUTPUT) / 1024
print(f"Built: {OUTPUT} ({size:.0f} KB)")
