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
            # Add drop date if available
            if nr in price_hist and isinstance(price_hist[nr], dict) and price_hist[nr].get('drop_date'):
                p['drop_date'] = price_hist[nr]['drop_date']
            drops += 1

print(f"Price drops (5%+): {drops}")

# Filter: must have a score, default to "Fast sortiment"
data = [p for p in data if p.get('smakfynd_score') and p.get('smakfynd_score') > 0]
print(f"After score filter: {len(data)} products")

# Hide large-format bottles when standard (750ml) version exists
# e.g. Pol Roger 3L/6L/9L when 750ml is already in the list
standard_wines = set()
for p in data:
    if (p.get('vol') or 750) <= 750:
        key = (p.get('name', '').strip().lower(), (p.get('sub', '') or '').strip().lower())
        standard_wines.add(key)

before_format = len(data)
data = [p for p in data if (p.get('vol') or 750) <= 750
        or (p.get('name', '').strip().lower(), (p.get('sub', '') or '').strip().lower()) not in standard_wines]
format_removed = before_format - len(data)
if format_removed:
    print(f"Large-format filter: removed {format_removed} (standard bottle exists)")

# Deduplicate: keep highest-scored wine when name+sub is identical
seen_keys = {}
deduped = []
for p in sorted(data, key=lambda x: (-x.get('_score_raw', 0), str(x.get('nr', '')))):
    key = (p.get('name', '').strip().lower(), (p.get('sub', '') or '').strip().lower())
    if key not in seen_keys:
        seen_keys[key] = True
        deduped.append(p)
removed = len(data) - len(deduped)
if removed:
    print(f"Deduplication: removed {removed} exact duplicates")
data = deduped
fast = [p for p in data if p.get('assortment') == 'Fast sortiment']
tillfälligt = [p for p in data if p.get('assortment') != 'Fast sortiment']
print(f"Fast sortiment: {len(fast)} | Tillfälligt/övrigt: {len(tillfälligt)}")
# Include all but mark assortment so JSX can filter
print(f"After filter: {len(data)} products")

# Include ALL scored wines — entire Systembolaget sortiment is searchable
slim = sorted(data, key=lambda x: (-x.get('_score_raw', 0), str(x.get('nr', ''))))
fast_count = sum(1 for p in slim if p.get('assortment') == 'Fast sortiment')
other_count = len(slim) - fast_count
print(f"  All wines: {len(slim)} (fast: {fast_count}, övrigt: {other_count})")

# Calculate availability_score
AVAIL_BASE = {
    "Fast sortiment": 1.0,
    "Tillfälligt sortiment": 0.7,
    "Lokalt & Småskaligt": 0.5,
    "Webblanseringar": 0.3,
}
for p in slim:
    base = AVAIL_BASE.get(p.get("assortment", ""), 0.25)
    if p.get("is_out_of_stock"): base *= 0.5
    elif p.get("is_temp_out"): base *= 0.7
    if p.get("is_regional"): base *= 0.9
    p["availability"] = round(base, 2)

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
        "_score_raw": p.get("_score_raw", 0),
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
    # Availability
    if p.get("availability"): m["avail"] = p["availability"]
    # Optional fields — include for all wines that have the data
    if p.get("vintage"): m["vintage"] = p["vintage"]
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
    if p.get("drop_date"): m["drop_date"] = p["drop_date"]
    mini.append(m)

# ── Generate contextual insights ──
# Group by category for comparisons
by_cat = {}
for m in mini:
    cat = m.get("type", "")
    by_cat.setdefault(cat, []).append(m)

# Sort each category by score descending
for cat in by_cat:
    by_cat[cat].sort(key=lambda x: (-x.get("_score_raw", 0), str(x.get("nr", ""))))

# Pre-compute rankings
by_country_cat = {}
for m in mini:
    key = (m.get("country", ""), m.get("type", ""))
    by_country_cat.setdefault(key, []).append(m)
for key in by_country_cat:
    by_country_cat[key].sort(key=lambda x: (-x.get("_score_raw", 0), str(x.get("nr", ""))))

# Reviews ranking
by_reviews = sorted([m for m in mini if m.get("crowd_reviews")], key=lambda x: (-x.get("crowd_reviews", 0), str(x.get("nr", ""))))
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
# NOTE: js_data is built AFTER QA cleaning below
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

# ── Add unscored wines with taste profiles ──
# These wines lack crowd/expert ratings but carry SB taste data
import sys
sys.path.insert(0, str(BASE / "scripts"))
from constants import IN_STORE
from score_wines_v2 import predict_food_pairings

sb_raw_path = os.path.join(DATA_DIR, "systembolaget_raw.json")
if os.path.exists(sb_raw_path):
    sb_raw = json.load(open(sb_raw_path))
    scored_nrs = {m["nr"] for m in mini}
    unscored_count = 0
    for p in sb_raw:
        nr = str(p.get("nr", ""))
        if not nr or nr in scored_nrs:
            continue
        if p.get("cat1") != "Vin":
            continue
        # Must have at least one taste field
        if not any(p.get(f) is not None for f in ["taste_body", "taste_sweet", "taste_fruit", "taste_bitter"]):
            continue

        wine_type = p.get("cat2", "").replace("Rött vin", "Rött").replace("Vitt vin", "Vitt").replace("Rosévin", "Rosé").replace("Mousserande vin", "Mousserande")
        grape = p.get("grape", "")
        food = p.get("food_pairings", [])
        food_predicted = False
        if not food or not any(f for f in food):
            food = predict_food_pairings(wine_type, grape)
            food_predicted = True

        m = {
            "nr": nr,
            "name": (p.get("name", "") or "").strip().rstrip(" —-–"),
            "sub": (p.get("sub", "") or "").strip().rstrip(" —-–"),
            "price": p.get("price", 0),
            "vol": p.get("vol", 750),
            "type": wine_type,
            "pkg": p.get("pkg", "Flaska"),
            "country": p.get("country", ""),
            "grape": grape,
            "smakfynd_score": 0,
            "_score_raw": 0,
            "unrated": True,
            "confidence": "ingen",
            "assortment": p.get("assortment", ""),
        }
        img = p.get("image_url", "")
        if img: m["image_url"] = img
        if p.get("vintage"): m["vintage"] = p["vintage"]
        if p.get("organic"): m["organic"] = True
        if p.get("cat3"): m["cat3"] = p["cat3"]
        if food: m["food_pairings"] = food
        if food_predicted: m["food_predicted"] = True
        if p.get("taste_body") is not None: m["taste_body"] = p["taste_body"]
        if p.get("taste_sweet") is not None: m["taste_sweet"] = p["taste_sweet"]
        if p.get("taste_fruit") is not None: m["taste_fruit"] = p["taste_fruit"]
        if p.get("taste_bitter") is not None: m["taste_bitter"] = p["taste_bitter"]
        if p.get("style"): m["style"] = p["style"]
        if p.get("region"): m["region"] = p["region"]
        mini.append(m)
        unscored_count += 1

    # Apply the same filters to unrated wines: dedup name+sub, hide large format when standard exists
    scored_keys = {(m.get("name","").strip().lower(), (m.get("sub","") or "").strip().lower()) for m in mini if not m.get("unrated")}
    unrated_in = [m for m in mini if m.get("unrated")]
    # Remove name+sub duplicates (keep first by nr sort)
    seen_unrated = set()
    deduped_unrated = []
    for m in sorted(unrated_in, key=lambda x: str(x.get("nr",""))):
        key = (m.get("name","").strip().lower(), (m.get("sub","") or "").strip().lower())
        if key in seen_unrated or key in scored_keys:
            continue
        seen_unrated.add(key)
        deduped_unrated.append(m)
    # Remove small formats (vol < 750) where a standard bottle exists
    standard_keys = {(m.get("name","").strip().lower(), (m.get("sub","") or "").strip().lower())
                     for m in mini if (m.get("vol") or 750) <= 750}
    standard_keys |= {(m.get("name","").strip().lower(), (m.get("sub","") or "").strip().lower())
                      for m in deduped_unrated if (m.get("vol") or 750) <= 750}
    # Keep all >= 750, or < 750 only if no standard exists
    filtered_unrated = [m for m in deduped_unrated if (m.get("vol") or 750) >= 750
                        or (m.get("name","").strip().lower(), (m.get("sub","") or "").strip().lower()) not in standard_keys]

    removed_dedup = len(unrated_in) - len(deduped_unrated)
    removed_format = len(deduped_unrated) - len(filtered_unrated)
    mini = [m for m in mini if not m.get("unrated")] + filtered_unrated

    print(f"Unrated wines: {unscored_count} raw, -{removed_dedup} dedup, -{removed_format} format = {len(filtered_unrated)} kept")
else:
    print("WARN: systembolaget_raw.json not found — no unrated wines added")

# Sort deterministically: scored wines first by _score_raw desc, then unrated by nr
mini.sort(key=lambda x: (-x.get('_score_raw', 0), 0 if x.get('unrated') else -1, str(x.get('nr', ''))))

# Build wines.json with metadata from single source of truth

scored_count = sum(1 for m in mini if not m.get("unrated"))
unrated_count = sum(1 for m in mini if m.get("unrated"))
print(f"Total wines.json: {len(mini)} (scored: {scored_count}, unrated: {unrated_count})")

wines_payload = {
    "meta": {
        "in_store_assortments": sorted(IN_STORE),
        "count": len(mini),
        "scored": scored_count,
        "unrated": unrated_count,
        "built": __import__("datetime").date.today().isoformat(),
    },
    "wines": mini,
}
js_data = json.dumps(wines_payload, ensure_ascii=False, separators=(',', ':'))
WINES_JSON = str(BASE / "docs" / "wines.json")
open(WINES_JSON, 'w').write(js_data)
json_size = os.path.getsize(WINES_JSON) / 1024
print(f"Built: {WINES_JSON} ({json_size:.0f} KB)")

# Validate wines.json is not empty/corrupted
validation = json.loads(open(WINES_JSON).read())
wines_list = validation.get("wines", []) if isinstance(validation, dict) else validation
if not isinstance(wines_list, list) or len(wines_list) < 100:
    print(f"FATAL: wines.json has only {len(wines_list)} wines — aborting!")
    os.remove(WINES_JSON)
    exit(1)
print(f"QA: {len(wines_list)} wines validated")
