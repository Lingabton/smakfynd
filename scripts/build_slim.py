#!/usr/bin/env python3
"""Build smakfynd site with SLIM data (top products only)."""
import json, os

DATA_DIR = os.path.expanduser("~/smakfynd/data")
SITE_FILE = os.path.expanduser("~/smakfynd/scripts/smakfynd-v7.jsx")
OUTPUT = os.path.expanduser("~/smakfynd/site/smakfynd-v7-slim.jsx")

data = json.load(open(os.path.join(DATA_DIR, "smakfynd_web.json")))
print(f"Total: {len(data)} products")

# Keep top 60 per type+package combo (enough for browsing)
groups = {}
for p in data:
    key = f"{p.get('type','')}|{p.get('pkg','')}"
    groups.setdefault(key, []).append(p)

slim = []
for key, prods in groups.items():
    prods.sort(key=lambda x: -(x.get('score', 0) or 0))
    slim.extend(prods[:60])
    print(f"  {key}: {len(prods)} -> {min(len(prods), 60)}")

# Minimize JSON: remove empty fields, shorten keys
mini = []
for p in slim:
    m = {
        "nr": p.get("nr",""),
        "name": p.get("name",""),
        "sub": p.get("sub",""),
        "price": p.get("price",0),
        "vol": p.get("vol",750),
        "type": p.get("type",""),
        "pkg": p.get("pkg",""),
        "country": p.get("country",""),
        "grape": p.get("grape",""),
        "score": p.get("score",0),
        "rating": p.get("rating",0),
        "reviews": p.get("reviews",0),
        "image_url": (p.get("image_url","") + "_400.png") if p.get("image_url") else "",
    }
    if p.get("organic"): m["organic"] = True
    if p.get("cat3"): m["cat3"] = p["cat3"]
    if p.get("food_pairings"): m["food_pairings"] = p["food_pairings"]
    mini.append(m)

print(f"Slim: {len(mini)} products")

jsx = open(SITE_FILE).read()
js_data = json.dumps(mini, ensure_ascii=False, separators=(',',':'))
jsx = jsx.replace(
    'const SAMPLE_PRODUCTS = []; // Will be replaced by loaded data',
    f'const SAMPLE_PRODUCTS = {js_data};'
)

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
open(OUTPUT, 'w').write(jsx)
size = os.path.getsize(OUTPUT) / 1024
print(f"Built: {OUTPUT} ({size:.0f} KB)")
