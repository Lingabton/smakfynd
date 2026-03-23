#!/usr/bin/env python3
"""
Build the Prissänkt page by merging bootstrap price data with Smakfynd wine data.
Outputs: ~/smakfynd/docs/prissankt/index.html
"""
import json, os, re

DATA_DIR = os.path.expanduser("~/smakfynd/data")
TEMPLATE = os.path.expanduser("~/smakfynd/scripts/prissankt.html")
OUTPUT = os.path.expanduser("~/smakfynd/docs/prissankt/index.html")

# Load data
boot = json.load(open(os.path.join(DATA_DIR, "prissankt_bootstrap.json")))
web = json.load(open(os.path.join(DATA_DIR, "smakfynd_web.json")))
web_nrs = {str(w.get("nr", "")): w for w in web}

# Also load scored data for score_100
try:
    ranked = json.load(open(os.path.join(DATA_DIR, "smakfynd_ranked.json")))
    ranked_nrs = {str(w.get("nr", "")): w for w in ranked}
except:
    ranked_nrs = {}

# Rescale raw score to 1-100
def rescale(raw):
    if raw >= 16: return min(99, 90 + (raw - 16) * 5)
    if raw >= 14: return 75 + (raw - 14) * 7.5
    if raw >= 12: return 60 + (raw - 12) * 7.5
    if raw >= 10: return 42 + (raw - 10) * 9
    if raw >= 8: return 22 + (raw - 8) * 10
    return max(1, raw * 2.75)

# Merge
drops = []
for b in boot:
    nr = b["nr"]
    if nr in web_nrs:
        w = web_nrs[nr]
        raw_score = w.get("score", 0) or 0
        d = {
            "nr": nr,
            "name": w.get("name", ""),
            "sub": w.get("sub", ""),
            "price": w.get("price", 0),
            "price_old": b["price_old"],
            "drop_pct": b["drop_pct"],
            "type": w.get("type", ""),
            "country": w.get("country", ""),
            "grape": w.get("grape", ""),
            "rating": w.get("rating", 0),
            "reviews": w.get("reviews", 0),
            "score_100": round(rescale(raw_score)) if raw_score > 0 else 0,
        }
        # Add image URL with _400.png suffix
        if w.get("image_url"):
            d["image_url"] = w["image_url"] + "_400.png"
        drops.append(d)

# Sort by drop percentage
drops.sort(key=lambda x: -x["drop_pct"])

print(f"Prissänkt wines with full data: {len(drops)}")
if drops:
    print(f"Top drop: {drops[0]['name']} -{drops[0]['drop_pct']}% ({drops[0]['price_old']} -> {drops[0]['price']} kr)")

# Build HTML
html = open(TEMPLATE).read()
js_data = json.dumps(drops, ensure_ascii=False, separators=(",", ":"))
html = html.replace(
    "const PRICE_DROPS = [];",
    f"const PRICE_DROPS = {js_data};"
)

# Write output
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
with open(OUTPUT, "w") as f:
    f.write(html)

size = os.path.getsize(OUTPUT) / 1024
print(f"Built: {OUTPUT} ({size:.0f} KB)")
