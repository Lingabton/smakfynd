#!/usr/bin/env python3
"""Build admin dashboard data: stats, data quality, flagged Vivino matches, analytics."""
import json, os, subprocess
from datetime import datetime
from collections import Counter

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE, "data")
DOCS_DIR = os.path.join(BASE, "docs")
ADMIN_DIR = os.path.join(DOCS_DIR, "admin")
os.makedirs(ADMIN_DIR, exist_ok=True)

# Load data sources
ranked = json.load(open(os.path.join(DATA_DIR, "smakfynd_ranked_v2.json"))) if os.path.exists(os.path.join(DATA_DIR, "smakfynd_ranked_v2.json")) else []
wines_file = os.path.join(DOCS_DIR, "wines.json")
wines = json.load(open(wines_file)) if os.path.exists(wines_file) else []
vivino = json.load(open(os.path.join(DATA_DIR, "vivino_cache.json"))) if os.path.exists(os.path.join(DATA_DIR, "vivino_cache.json")) else {}
flagged = json.load(open(os.path.join(DATA_DIR, "vivino_flagged.json"))) if os.path.exists(os.path.join(DATA_DIR, "vivino_flagged.json")) else {}
expert = json.load(open(os.path.join(DATA_DIR, "expert_cache.json"))) if os.path.exists(os.path.join(DATA_DIR, "expert_cache.json")) else {}

# History snapshots
hist_dir = os.path.join(DATA_DIR, "history")
snapshots = sorted([f for f in os.listdir(hist_dir) if f.startswith("prices_")]) if os.path.exists(hist_dir) else []

# --- Wine stats ---
fast = [w for w in wines if w.get("assortment") == "Fast sortiment"]
types = Counter(w.get("type", "?") for w in wines)
countries = Counter(w.get("country", "?") for w in wines)
packages = Counter(w.get("pkg", "?") for w in wines)
scores = [w.get("smakfynd_score", 0) for w in wines if w.get("smakfynd_score")]
prices = [w.get("price", 0) for w in wines if w.get("price")]

# --- Data quality ---
total = len(wines)
missing = {
    "food_pairings": sum(1 for w in wines if not w.get("food_pairings")),
    "expert_score": sum(1 for w in wines if not w.get("expert_score")),
    "crowd_score": sum(1 for w in wines if not w.get("crowd_score")),
    "image_url": sum(1 for w in wines if not w.get("image_url")),
    "grape": sum(1 for w in wines if not w.get("grape")),
    "region": sum(1 for w in wines if not w.get("region")),
}

# --- Vivino stats ---
vivino_with_rating = sum(1 for v in vivino.values() if v.get("vivino_rating", 0) > 0)
vivino_zero = sum(1 for v in vivino.values() if v.get("vivino_rating", 0) == 0)

# --- Price drops ---
drops = [w for w in wines if w.get("price_vs_launch_pct", 0) > 0]

# --- Top wines ---
top = sorted(wines, key=lambda w: -(w.get("smakfynd_score") or 0))[:20]
top_list = [{"name": w.get("name",""), "sub": w.get("sub",""), "score": w.get("smakfynd_score",0),
             "price": w.get("price",0), "country": w.get("country",""), "nr": w.get("nr","")} for w in top]

# --- Score distribution ---
score_bins = Counter()
for s in scores:
    bucket = (s // 10) * 10
    score_bins[bucket] = score_bins.get(bucket, 0) + 1

# --- Build output ---
admin_data = {
    "generated": datetime.now().isoformat(),
    "overview": {
        "total_wines": total,
        "total_ranked": len(ranked),
        "fast_sortiment": len(fast),
        "price_drops": len(drops),
        "snapshots": len(snapshots),
        "latest_snapshot": snapshots[-1] if snapshots else None,
    },
    "scores": {
        "min": min(scores) if scores else 0,
        "max": max(scores) if scores else 0,
        "avg": round(sum(scores) / max(1, len(scores)), 1),
        "median": sorted(scores)[len(scores)//2] if scores else 0,
        "distribution": dict(sorted(score_bins.items())),
    },
    "prices": {
        "min": min(prices) if prices else 0,
        "max": max(prices) if prices else 0,
        "avg": round(sum(prices) / max(1, len(prices))),
        "median": sorted(prices)[len(prices)//2] if prices else 0,
    },
    "types": dict(types.most_common(10)),
    "countries": dict(countries.most_common(15)),
    "data_quality": {k: {"missing": v, "pct": round(v / max(1, total) * 100)} for k, v in missing.items()},
    "vivino": {
        "total_cache": len(vivino),
        "with_rating": vivino_with_rating,
        "zero_rating": vivino_zero,
        "expert_cache": len(expert),
        "flagged": len(flagged),
    },
    "top_wines": top_list,
    "flagged_vivino": [
        {"key": k, "vivino_name": v.get("vivino_name","")[:80], "vivino_rating": v.get("vivino_rating",0),
         "vivino_reviews": v.get("vivino_reviews",0), "match_quality": v.get("match_quality",0),
         "flagged_reason": v.get("flagged_reason","")}
        for k, v in sorted(flagged.items(), key=lambda x: x[1].get("match_quality", 0))
    ],
}

# --- Fetch analytics from CF D1 ---
analytics = {}
try:
    def d1_query(sql):
        r = subprocess.run(
            ["npx", "wrangler", "d1", "execute", "smakfynd-analytics", "--remote", "--json", "--command", sql],
            capture_output=True, text=True, cwd=os.path.join(BASE, "workers", "analytics"), timeout=30
        )
        if r.returncode == 0:
            data = json.loads(r.stdout)
            return data[0].get("results", []) if data else []
        return []

    # Event counts by type
    events_by_type = d1_query("SELECT event, COUNT(*) as n FROM events GROUP BY event ORDER BY n DESC")

    # Recent events
    recent_events = d1_query("SELECT event, wine_nr, data, device, ts FROM events ORDER BY id DESC LIMIT 15")

    # Top searches
    top_searches = d1_query("SELECT query, result_count, COUNT(*) as n FROM searches GROUP BY query ORDER BY n DESC LIMIT 15")

    # AI usage
    ai_stats = d1_query("SELECT COUNT(*) as n, AVG(response_time_ms) as avg_ms FROM ai_logs")

    # Daily event counts (last 14 days)
    daily_events = d1_query("SELECT DATE(ts) as day, COUNT(*) as n FROM events WHERE ts > datetime('now', '-14 days') GROUP BY DATE(ts) ORDER BY day")

    analytics = {
        "events_by_type": events_by_type,
        "recent_events": recent_events,
        "top_searches": top_searches,
        "ai_stats": ai_stats[0] if ai_stats else {},
        "daily_events": daily_events,
        "total_events": sum(e.get("n", 0) for e in events_by_type),
    }
    print(f"  Analytics: {analytics['total_events']} events fetched")
except Exception as e:
    print(f"  Analytics: skipped ({e})")

admin_data["analytics"] = analytics

out_path = os.path.join(ADMIN_DIR, "data.json")
json.dump(admin_data, open(out_path, "w"), ensure_ascii=False)
print(f"Admin data: {os.path.getsize(out_path) / 1024:.0f} KB → {out_path}")
print(f"  {total} wines, {len(flagged)} flagged, {vivino_with_rating} vivino matches")
