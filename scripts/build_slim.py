#!/usr/bin/env python3
"""Build smakfynd site with v2 data (crowd + expert + price scores)."""
import json, os, math

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

# Load price drop data from multiple sources
# 1. Bootstrap data (historical drops from prissankt etc.)
bootstrap_file = os.path.join(DATA_DIR, "prissankt_bootstrap.json")
bootstrap = {}
if os.path.exists(bootstrap_file):
    for d in json.load(open(bootstrap_file)):
        bootstrap[str(d['nr'])] = d

# 2. Our own price history (tracks ongoing changes)
price_hist_file = os.path.join(DATA_DIR, "history", "first_seen_prices.json")
price_hist = {}
if os.path.exists(price_hist_file):
    price_hist = json.load(open(price_hist_file))

print(f"Price sources: {len(bootstrap)} bootstrap, {len(price_hist)} tracked")

# Add price drop info
drops = 0
for p in data:
    nr = str(p.get('nr', ''))
    current = p.get('price', 0)
    if not current:
        continue

    old_price = None
    # Check bootstrap first (historical data)
    if nr in bootstrap:
        b = bootstrap[nr]
        if b.get('price_now') and abs(b['price_now'] - current) < 5:
            # Price still matches the drop price — drop is still active
            old_price = b.get('price_old')

    # Check our own history
    if not old_price and nr in price_hist:
        hist = price_hist[nr]
        first = hist.get('price', 0) if isinstance(hist, dict) else hist
        if first and first > current:
            old_price = first

    if old_price and old_price > current:
        drop_pct = round((old_price - current) / old_price * 100)
        if drop_pct >= 5:
            p['launch_price'] = old_price
            p['price_vs_launch_pct'] = drop_pct
            drops += 1

print(f"Price drops (5%+): {drops}")

# Filter: must have a score, default to "Fast sortiment"
data = [p for p in data if p.get('smakfynd_score') and p.get('smakfynd_score') > 0]
print(f"After score filter: {len(data)} products")
fast = [p for p in data if p.get('assortment') == 'Fast sortiment']
tillfälligt = [p for p in data if p.get('assortment') != 'Fast sortiment']
print(f"Fast sortiment: {len(fast)} | Tillfälligt/övrigt: {len(tillfälligt)}")
# Include all but mark assortment so JSX can filter
print(f"After filter: {len(data)} products")

# Include ALL fast sortiment + top 40 beställning per category
groups = {}
for p in data:
    key = f"{p.get('type','')}|{p.get('pkg','')}"
    groups.setdefault(key, []).append(p)

slim = []
for key, prods in groups.items():
    prods.sort(key=lambda x: -(x.get('smakfynd_score', 0)))
    fast_prods = [p for p in prods if p.get('assortment') == 'Fast sortiment']
    other_prods = [p for p in prods if p.get('assortment') != 'Fast sortiment'][:40]
    combined = fast_prods + other_prods
    slim.extend(combined)
    print(f"  {key}: {len(prods)} -> {len(combined)} (fast: {len(fast_prods)}, övrigt: {len(other_prods)})")

# Build minimal JSON with all needed fields
mini = []
for p in slim:
    m = {
        "nr": p.get("nr", ""),
        "name": (p.get("name", "") or "").strip().rstrip(" —-–"),
        "sub": (p.get("sub", "") or "").strip().rstrip(" —-–"),
        "price": p.get("price", 0),
        "vol": p.get("vol", 750),
        "type": p.get("type", ""),
        "pkg": p.get("pkg", ""),
        "country": p.get("country", ""),
        "grape": p.get("grape", ""),
        "smakfynd_score": p.get("smakfynd_score", 0),
        "crowd_score": p.get("crowd_score"),
        "crowd_reviews": p.get("crowd_reviews", 0),
        "expert_score": p.get("expert_score"),
        "price_score": p.get("price_score"),
        "confidence": p.get("confidence", "låg"),
        "assortment": p.get("assortment", ""),
    }
    # Image URL (uses different ID than product nr — must keep)
    img = p.get("image_url", "")
    if img:
        if not img.endswith(".png"):
            img = img + "_400.png"
        m["image_url"] = img
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
    if p.get("launch_price"): m["launch_price"] = p["launch_price"]
    if p.get("price_vs_launch_pct"): m["price_vs_launch_pct"] = p["price_vs_launch_pct"]
    mini.append(m)

# Remove None values to save space
for m in mini:
    for k in list(m.keys()):
        if m[k] is None:
            del m[k]

print(f"Slim: {len(mini)} products")

# Count data coverage
has_crowd = sum(1 for m in mini if m.get('crowd_score'))
has_expert = sum(1 for m in mini if m.get('expert_score'))
has_both = sum(1 for m in mini if m.get('crowd_score') and m.get('expert_score'))
has_taste = sum(1 for m in mini if m.get('taste_body'))
print(f"  Crowd: {has_crowd} | Expert: {has_expert} | Both: {has_both} | Taste: {has_taste}")

# Inject into JSX template — keep SAMPLE_PRODUCTS empty (data loaded from wines.json)
jsx = open(SITE_FILE).read()
js_data = json.dumps(mini, ensure_ascii=False, separators=(',', ':'))
jsx = jsx.replace(
    'const SAMPLE_PRODUCTS = []; // Will be replaced by loaded data OR fetched from DATA_URL',
    'const SAMPLE_PRODUCTS = []; // Data loaded async from wines.json'
)

# QA: clean data before publishing
cleaned = []
qa_issues = 0
for m in mini:
    # Skip wines with no name
    if not m.get("name") or len(m["name"]) < 2:
        qa_issues += 1
        continue
    # Skip wines with no score
    if not m.get("smakfynd_score"):
        qa_issues += 1
        continue
    # Skip wines with no price
    if not m.get("price"):
        qa_issues += 1
        continue
    # Clean trailing dashes/whitespace in all string fields
    for k in ["name", "sub", "country", "grape"]:
        if m.get(k):
            m[k] = m[k].strip().rstrip(" —-–·")
    # Remove empty string fields
    for k in list(m.keys()):
        if m[k] == "" or m[k] is None:
            del m[k]
    cleaned.append(m)
if qa_issues:
    print(f"QA: removed {qa_issues} incomplete wines")
mini = cleaned

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
open(OUTPUT, 'w').write(jsx)
size = os.path.getsize(OUTPUT) / 1024
print(f"Built: {OUTPUT} ({size:.0f} KB)")

# Also write separate wines.json for async loading
WINES_JSON = os.path.expanduser("~/smakfynd/docs/wines.json")
open(WINES_JSON, 'w').write(js_data)
json_size = os.path.getsize(WINES_JSON) / 1024
print(f"Built: {WINES_JSON} ({json_size:.0f} KB)")
