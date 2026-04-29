#!/usr/bin/env python3
"""Build smakfynd site with v2 data (crowd + expert + price scores)."""
import json, os, math
from pathlib import Path

BASE = Path(__file__).parent.parent
DATA_DIR = str(BASE / "data")
SITE_FILE = str(BASE / "scripts" / "smakfynd-v7.jsx")
OUTPUT = str(BASE / "site" / "smakfynd-v7-slim.jsx")

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
    # Check our own history FIRST (most reliable)
    if nr in price_hist:
        hist = price_hist[nr]
        first = hist.get('price', 0) if isinstance(hist, dict) else hist
        if first and first > current:
            old_price = first

    # Use bootstrap if our history confirms OR doesn't have enough data
    if not old_price and nr in bootstrap:
        b = bootstrap[nr]
        if b.get('price_now') and abs(b['price_now'] - current) < 5:
            bootstrap_old = b.get('price_old')
            if nr in price_hist:
                hist = price_hist[nr]
                our_first = hist.get('price', 0) if isinstance(hist, dict) else hist
                # Skip bootstrap if our first-seen price equals current (never was higher)
                # AND the bootstrap claims a very large drop (likely wrong data)
                if our_first and abs(our_first - current) < 2 and bootstrap_old and bootstrap_old > current * 1.5:
                    old_price = None  # Suspicious: we never saw the higher price
                else:
                    old_price = bootstrap_old
            else:
                old_price = bootstrap_old

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

# Deduplicate: keep highest-scored wine when name+sub is identical
seen_keys = {}
deduped = []
for p in sorted(data, key=lambda x: -(x.get('smakfynd_score', 0))):
    key = (p.get('name', '').strip().lower(), (p.get('sub', '') or '').strip().lower())
    if key not in seen_keys:
        seen_keys[key] = True
        deduped.append(p)
removed = len(data) - len(deduped)
if removed:
    print(f"Deduplication: removed {removed} duplicates")
data = deduped
fast = [p for p in data if p.get('assortment') == 'Fast sortiment']
tillfälligt = [p for p in data if p.get('assortment') != 'Fast sortiment']
print(f"Fast sortiment: {len(fast)} | Tillfälligt/övrigt: {len(tillfälligt)}")
# Include all but mark assortment so JSX can filter
print(f"After filter: {len(data)} products")

# Include ALL scored wines — entire Systembolaget sortiment is searchable
slim = sorted(data, key=lambda x: -(x.get('smakfynd_score', 0)))
fast_count = sum(1 for p in slim if p.get('assortment') == 'Fast sortiment')
other_count = len(slim) - fast_count
print(f"  All wines: {len(slim)} (fast: {fast_count}, övrigt: {other_count})")

# Build JSON — full data for ALL wines (fast + ordervaror treated equally)
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
    # Image URL
    img = p.get("image_url", "")
    if img:
        m["image_url"] = img
    # Optional fields — include for all wines that have the data
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
    if p.get("critics"):
        m["critics"] = [{"c": c["critic"], "s": c["score"]} for c in p["critics"][:6]]
    if p.get("num_critics"): m["num_critics"] = p["num_critics"]
    if p.get("critic_spread") is not None: m["critic_spread"] = p["critic_spread"]
    if p.get("critic_consensus"): m["critic_consensus"] = p["critic_consensus"]
    if p.get("launch_price"): m["launch_price"] = p["launch_price"]
    if p.get("price_vs_launch_pct"): m["price_vs_launch_pct"] = p["price_vs_launch_pct"]
    mini.append(m)

# ── Generate contextual insights ──
# Group by category for comparisons
by_cat = {}
for m in mini:
    cat = m.get("type", "")
    by_cat.setdefault(cat, []).append(m)

# Sort each category by score descending
for cat in by_cat:
    by_cat[cat].sort(key=lambda x: -x.get("smakfynd_score", 0))

# Pre-compute rankings
by_country_cat = {}
for m in mini:
    key = (m.get("country", ""), m.get("type", ""))
    by_country_cat.setdefault(key, []).append(m)
for key in by_country_cat:
    by_country_cat[key].sort(key=lambda x: -x.get("smakfynd_score", 0))

# Reviews ranking
by_reviews = sorted([m for m in mini if m.get("crowd_reviews")], key=lambda x: -x.get("crowd_reviews", 0))
top_reviewed_nrs = set(m["nr"] for m in by_reviews[:20])

n_insights = 0
for m in mini:
    if m.get("assortment") != "Fast sortiment":
        continue
    cat = m.get("type", "")
    price = m.get("price", 0)
    crowd = m.get("crowd_score", 0)
    expert = m.get("expert_score", 0)
    score = m.get("smakfynd_score", 0)
    reviews = m.get("crowd_reviews", 0)
    country = m.get("country", "")

    insights = []

    # 1. Price comparison — find expensive wine with similar/lower crowd score
    if crowd and crowd >= 7.0 and price <= 200:
        cat_wines = by_cat.get(cat, [])
        expensive_match = None
        for w in cat_wines:
            if w["nr"] == m["nr"]:
                continue
            wp = w.get("price", 0)
            wc = w.get("crowd_score", 0)
            if wp >= price * 3 and wc and wc <= crowd + 0.3 and wc >= crowd - 0.5 and wp >= 300:
                expensive_match = w
                break
        if expensive_match:
            insights.append(f'Crowd ger {crowd}/10 — jämförbart med {expensive_match["name"]} ({int(expensive_match["price"])} kr)')

    # 2. Category rank in price bracket
    if price < 100:
        bracket = [w for w in by_cat.get(cat, []) if w.get("price", 0) < 100 and w.get("assortment") == "Fast sortiment"]
    elif price < 200:
        bracket = [w for w in by_cat.get(cat, []) if 100 <= w.get("price", 0) < 200 and w.get("assortment") == "Fast sortiment"]
    elif price < 300:
        bracket = [w for w in by_cat.get(cat, []) if 200 <= w.get("price", 0) < 300 and w.get("assortment") == "Fast sortiment"]
    else:
        bracket = []
    if bracket:
        rank = next((i for i, w in enumerate(bracket) if w["nr"] == m["nr"]), None)
        if rank is not None and rank == 0:
            cat_names = {"Rött": "röda", "Vitt": "vita", "Rosé": "rosé", "Mousserande": "bubbel"}
            price_label = "under 100 kr" if price < 100 else "100–200 kr" if price < 200 else "200–300 kr"
            cn = cat_names.get(cat, "viner")
            insights.append(f"Bästa {cn} {price_label}")

    # 3. Country champion
    country_key = (country, cat)
    country_wines = by_country_cat.get(country_key, [])
    fast_country = [w for w in country_wines if w.get("assortment") == "Fast sortiment"]
    if fast_country and fast_country[0]["nr"] == m["nr"] and len(fast_country) >= 3:
        cat_names = {"Rött": "röda", "Vitt": "vita", "Rosé": "rosé", "Mousserande": "bubbel"}
        cn = cat_names.get(cat, "")
        if cn:
            insights.append(f"Bästa {country.lower()}ska {cn} i sortimentet")

    # 4. Top reviewed
    if m["nr"] in top_reviewed_nrs:
        r_str = f"{reviews // 1000}k" if reviews >= 1000 else str(reviews)
        insights.append(f"{r_str} omdömen — bland de mest testade på SB")

    # 5. Expert vs crowd divergence
    if expert and crowd:
        if expert >= crowd + 1.0:
            insights.append("Experterna värderar det högre än crowd")
        elif crowd >= expert + 1.5:
            insights.append("Populärare bland vanliga drickare än hos kritiker")

    if insights:
        m["insight"] = insights[0]  # Keep the most relevant one
        n_insights += 1

print(f"Insights: {n_insights} wines got contextual insights")

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
    if not m.get("name") or len(m["name"]) < 3:
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
WINES_JSON = str(BASE / "docs" / "wines.json")
open(WINES_JSON, 'w').write(js_data)
json_size = os.path.getsize(WINES_JSON) / 1024
print(f"Built: {WINES_JSON} ({json_size:.0f} KB)")
