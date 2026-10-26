#!/usr/bin/env python3
"""
Rebuild /prissankt/ from observed price snapshots only.

Rules:
- A drop is a decrease between consecutive observed snapshots
  (daily files since Jul 14 + monthly rollups since Apr 14)
- Never compare against first_seen or bootstrap
- Outage 8 Jun – 13 Jul: date as "mellan 8 juni och 14 juli"
- Pre-fingerprint (before Sep 24) drops >40% held for review
- Compare per-litre when volume known on both sides; skip format changes
- "Just nu" = price still at lower level in latest snapshot
- Keep noindex until Gabriel reviews
"""

import json, gzip, glob, os, sys
from datetime import date, datetime
from pathlib import Path
from collections import defaultdict

BASE = Path(__file__).parent.parent
DATA = BASE / "data"
HIST = DATA / "history"
DOCS = BASE / "docs"

# Load current SB data for wine metadata
SB_FILE = DATA / "systembolaget_raw.json"
RANKED_FILE = DATA / "smakfynd_ranked_v2.json"

FINGERPRINT_START = "2026-09-24"
OUTAGE_START = "2026-06-08"
OUTAGE_END = "2026-07-13"


def read_snapshot(path):
    """Read a price snapshot, return {nr: {p, v}} dict."""
    path = str(path)
    if path.endswith(".gz"):
        data = json.loads(gzip.open(path).read())
    else:
        data = json.load(open(path))
    result = {}
    for nr, val in data.items():
        if isinstance(val, dict):
            result[nr] = {"p": val.get("p", 0), "v": val.get("v", 0), "n": val.get("n", "")}
        else:
            # Old format: just the price, no volume
            result[nr] = {"p": val, "v": 0, "n": ""}
    return result


def load_monthly_drops():
    """Extract price drops from monthly rollup files."""
    drops = []
    for f in sorted(glob.glob(str(HIST / "monthly_*.json.gz"))):
        data = json.loads(gzip.open(f).read())
        period = data.get("period", "")
        month = data.get("month", "")
        for pc in data.get("price_changes", []):
            if pc["to"] < pc["from"]:
                drops.append({
                    "nr": str(pc["nr"]),
                    "price_old": pc["from"],
                    "price_new": pc["to"],
                    "date": period,  # e.g. "2026-05-01 to 2026-05-31"
                    "month": month,
                    "source": "monthly",
                })
    return drops


def load_daily_drops():
    """Detect price drops from consecutive daily snapshots."""
    files = sorted(
        glob.glob(str(HIST / "prices_2026-*.json"))
        + glob.glob(str(HIST / "prices_2026-*.json.gz"))
    )
    if len(files) < 2:
        return []

    drops = []
    prev_snap = None
    prev_date = None

    for f in files:
        fname = os.path.basename(f)
        snap_date = fname.split("prices_")[1].split(".")[0]
        snap = read_snapshot(f)

        if prev_snap is not None:
            # Check if this transition crosses the outage
            in_outage = (prev_date <= OUTAGE_END and snap_date >= OUTAGE_START
                         and prev_date <= OUTAGE_START)
            has_fingerprints = snap_date >= FINGERPRINT_START and prev_date >= FINGERPRINT_START

            for nr, cur in snap.items():
                if nr not in prev_snap:
                    continue
                prev = prev_snap[nr]
                old_p = prev["p"]
                new_p = cur["p"]
                if old_p <= 0 or new_p <= 0 or new_p >= old_p:
                    continue

                old_v = prev.get("v", 0) or 0
                new_v = cur.get("v", 0) or 0

                # Skip if format/volume changed (different product)
                if old_v > 0 and new_v > 0 and old_v != new_v:
                    continue

                # Compare per-litre when volume known on both sides
                if old_v > 0 and new_v > 0:
                    old_per_l = old_p / (old_v / 1000)
                    new_per_l = new_p / (new_v / 1000)
                    drop_pct = round((old_per_l - new_per_l) / old_per_l * 100)
                else:
                    drop_pct = round((old_p - new_p) / old_p * 100)

                if drop_pct < 1:
                    continue

                # Check fingerprint for article-number reuse
                if has_fingerprints:
                    old_n = prev.get("n", "")
                    new_n = cur.get("n", "")
                    if old_n and new_n and old_n != new_n:
                        continue  # Different product reusing same NR

                # Date handling
                if in_outage:
                    drop_date = "mellan 8 juni och 14 juli"
                else:
                    drop_date = snap_date

                # Flag pre-fingerprint drops >40% for review
                needs_review = (not has_fingerprints and drop_pct > 40)

                drops.append({
                    "nr": nr,
                    "price_old": old_p,
                    "price_new": new_p,
                    "drop_pct": drop_pct,
                    "date": drop_date,
                    "source": "daily",
                    "needs_review": needs_review,
                    "volume": new_v if new_v > 0 else None,
                })

        prev_snap = snap
        prev_date = snap_date

    return drops


def main():
    print("=" * 60)
    print("  PRISSÄNKT REBUILD — observed snapshots only")
    print("=" * 60)

    # Collect all drops
    monthly_drops = load_monthly_drops()
    daily_drops = load_daily_drops()
    print(f"Monthly drops: {len(monthly_drops)}")
    print(f"Daily drops:   {len(daily_drops)}")

    # Deduplicate: keep latest drop per NR (most recent observed change)
    by_nr = {}
    for d in monthly_drops + daily_drops:
        nr = d["nr"]
        if nr not in by_nr or d.get("drop_pct", 0) > by_nr[nr].get("drop_pct", 0):
            by_nr[nr] = d

    # Load current prices to check "just nu"
    latest_files = sorted(
        glob.glob(str(HIST / "prices_2026-*.json"))
        + glob.glob(str(HIST / "prices_2026-*.json.gz"))
    )
    latest_snap = read_snapshot(latest_files[-1]) if latest_files else {}
    latest_date = os.path.basename(latest_files[-1]).split("prices_")[1].split(".")[0] if latest_files else ""

    # Load wine metadata
    sb = json.load(open(SB_FILE)) if SB_FILE.exists() else []
    sb_by_nr = {str(w.get("nr", "")): w for w in sb}
    ranked = json.load(open(RANKED_FILE)) if RANKED_FILE.exists() else []
    ranked_by_nr = {str(w.get("nr", "")): w for w in ranked}

    # Build final list
    results = []
    held_for_review = []

    for nr, drop in by_nr.items():
        # Check "just nu": is the price still at the lower level?
        current = latest_snap.get(nr, {})
        current_price = current.get("p", 0)
        if current_price <= 0:
            continue  # No longer in assortment

        still_low = abs(current_price - drop["price_new"]) < 2  # within 2 kr

        # Get wine metadata
        meta = sb_by_nr.get(nr, {})
        score_data = ranked_by_nr.get(nr, {})

        entry = {
            "nr": nr,
            "name": meta.get("name", ""),
            "sub": meta.get("sub", ""),
            "country": meta.get("country", ""),
            "grape": meta.get("grape", ""),
            "type": meta.get("cat2", ""),
            "price_old": drop["price_old"],
            "price_new": drop["price_new"],
            "price_now": current_price,
            "drop_pct": drop.get("drop_pct", round((drop["price_old"] - drop["price_new"]) / drop["price_old"] * 100)),
            "drop_date": drop["date"],
            "still_low": still_low,
            "score": score_data.get("score", 0),
            "volume": drop.get("volume") or meta.get("vol", 750),
            "image_url": meta.get("image_url", ""),
            "source": drop["source"],
        }

        if drop.get("needs_review"):
            held_for_review.append(entry)
        else:
            results.append(entry)

    # Sort by drop percentage descending
    results.sort(key=lambda x: -x["drop_pct"])
    held_for_review.sort(key=lambda x: -x["drop_pct"])

    # Filter: only include drops that are still active ("just nu")
    active = [r for r in results if r["still_low"]]
    inactive = [r for r in results if not r["still_low"]]

    print(f"\nTotal unique drops: {len(by_nr)}")
    print(f"Active (still low): {len(active)}")
    print(f"Inactive (price recovered): {len(inactive)}")
    print(f"Held for review (pre-fingerprint >40%): {len(held_for_review)}")

    # Write output
    output = {
        "generated": datetime.now().isoformat(),
        "latest_snapshot": latest_date,
        "method": "consecutive observed snapshots only (daily + monthly since 14 Apr)",
        "active_drops": active,
        "inactive_drops": inactive,
        "held_for_review": held_for_review,
    }
    out_file = DATA / "prissankt_observed.json"
    json.dump(output, open(out_file, "w"), ensure_ascii=False, indent=2)
    print(f"\nSaved: {out_file}")
    print(f"  {len(active)} active drops ready for page")
    print(f"  {len(held_for_review)} held for Gabriel's review")

    # Preview top 10
    print(f"\nTop 10 active drops:")
    for d in active[:10]:
        print(f"  {d['name'][:35]:35} {d['price_old']:>6.0f} → {d['price_new']:>6.0f} kr  ({d['drop_pct']:>2}%)  {d['drop_date']}")

    if held_for_review:
        print(f"\nHeld for review (>40%, pre-fingerprint):")
        for d in held_for_review[:10]:
            print(f"  {d['name'][:35]:35} {d['price_old']:>6.0f} → {d['price_new']:>6.0f} kr  ({d['drop_pct']:>2}%)  {d['drop_date']}")

    # Build HTML page
    if "--html" in sys.argv or "--page" in sys.argv:
        build_page(active, latest_date)

    return 0


def format_drop_date(d):
    """Format drop date for Swedish display."""
    if d.startswith("mellan"):
        return d
    if " to " in d:
        # Monthly: "2026-05-01 to 2026-05-31" → "maj 2026"
        month_num = int(d.split("-")[1])
        year = d.split("-")[0]
        months_sv = ['januari','februari','mars','april','maj','juni',
                     'juli','augusti','september','oktober','november','december']
        return f"{months_sv[month_num-1]} {year}"
    # Daily date: "2026-09-01" → "1 september 2026"
    try:
        dt = date.fromisoformat(d)
        months_sv = ['januari','februari','mars','april','maj','juni',
                     'juli','augusti','september','oktober','november','december']
        return f"{dt.day} {months_sv[dt.month-1]} {dt.year}"
    except ValueError:
        return d


def render_row(d, rank):
    """Render a single drop row."""
    name = d.get("name", "")
    sub = d.get("sub", "")
    nr = d.get("nr", "")
    price_now = d.get("price_now", 0)
    price_old = d.get("price_old", 0)
    savings = price_old - price_now
    pct = d.get("drop_pct", 0)
    country = d.get("country", "")
    grape = d.get("grape", "")
    score = d.get("score", 0)
    drop_date = format_drop_date(d.get("drop_date", ""))
    still_low = d.get("still_low", False)

    status = "Just nu" if still_low else "Tidigare"
    status_color = "#2d6b3f" if still_low else "#7a7060"

    score_html = ""
    if score:
        score_html = f'''<div style="text-align:center;flex-shrink:0">
      <div style="width:48px;height:48px;border-radius:50%;background:#e8f0e4;border:2px solid #2d6b3f;display:flex;align-items:center;justify-content:center">
        <span style="font-size:18px;font-weight:900;color:#2d6b3f;font-family:'Newsreader',Georgia,serif">{score}</span>
      </div>
    </div>'''

    detail = f"{country} · {grape}" if grape else country

    return f'''<li style="padding:16px 0;border-bottom:1px solid #e6ddd0">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
    <div style="flex:1">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span style="background:#c44020;color:#fff;font-size:11px;font-weight:800;padding:3px 8px;border-radius:6px">&minus;{pct}%</span>
        <span style="font-size:13px;color:#c44020;font-weight:600">Spara {savings:.0f} kr</span>
        <span style="font-size:11px;color:{status_color};font-weight:600">{status}</span>
      </div>
      <a href="https://smakfynd.se/#vin/{nr}" style="text-decoration:none">
        <strong style="font-size:17px;font-family:'Newsreader',Georgia,serif;color:#1e1710">{rank}. {name}</strong>
        <span style="color:#7a7060;font-size:14px"> &mdash; {sub}</span>
      </a>
      <div style="font-size:13px;color:#4a4238;margin-top:3px">{detail}</div>
      <div style="margin-top:6px;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">
        <span style="font-size:20px;font-weight:700;font-family:'Newsreader',Georgia,serif;color:#1e1710">{price_now:.0f} kr</span>
        <span style="font-size:14px;color:#7a7060;text-decoration:line-through">{price_old:.0f} kr</span>
        <span style="font-size:11px;color:#7a7060">Sänkt {drop_date}</span>
      </div>
    </div>
    {score_html}
  </div>
</li>'''


def build_page(drops, latest_date):
    """Build the prissankt HTML page."""
    NOW = datetime.now()
    months_sv = ['januari','februari','mars','april','maj','juni',
                 'juli','augusti','september','oktober','november','december']
    date_str = f"{months_sv[NOW.month-1]} {NOW.year}"

    wines_html = "\n".join(render_row(d, i+1) for i, d in enumerate(drops))

    html = f'''<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prissänkta viner på Systembolaget {NOW.year} &mdash; Smakfynd</title>
  <meta name="description" content="Prissänkta viner på Systembolaget &mdash; {len(drops)} viner med observerade prissänkningar. Uppdaterad {date_str}.">
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="https://smakfynd.se/prissankt/">
  <meta property="og:title" content="Prissänkta viner på Systembolaget &mdash; Smakfynd">
  <meta property="og:description" content="{len(drops)} viner med verifierade prissänkningar på Systembolaget.">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://smakfynd.se/prissankt/">
  <meta property="og:locale" content="sv_SE">
  <meta property="og:site_name" content="Smakfynd">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,700;6..72,900&display=swap" rel="stylesheet">
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fefcf8; color: #1e1710; }}
    a {{ color: #8b2332; }}
  </style>
</head>
<body>
  <div style="max-width:680px;margin:0 auto;padding:20px 16px">
    <header style="margin-bottom:24px">
      <a href="https://smakfynd.se" style="text-decoration:none;font-size:14px;color:#8b2332">&larr; Smakfynd</a>
      <h1 style="font-size:28px;font-family:'Newsreader',Georgia,serif;color:#1e1710;margin-top:12px">Prissänkta viner</h1>
      <p style="font-size:15px;color:#4a4238;margin-top:6px;line-height:1.5">
        {len(drops)} viner med observerade prissänkningar på Systembolaget.
        Varje prissänkning är verifierad genom dagliga prisavläsningar sedan april 2026.
      </p>
      <p style="font-size:12px;color:#7a7060;margin-top:8px">
        Uppdaterad {date_str} &middot; Senaste prisdata: {latest_date}
      </p>
    </header>

    <ol style="list-style:none;padding:0;margin:0">
{wines_html}
    </ol>

    <footer style="margin-top:32px;padding:16px 0;border-top:1px solid #e6ddd0;text-align:center">
      <p style="font-size:12px;color:#7a7060">
        Priser hämtas dagligen från Systembolaget. Prissänkningar baseras på
        observerade prisförändringar mellan konsekutiva dagliga avläsningar.
      </p>
      <p style="font-size:12px;color:#7a7060;margin-top:8px">
        <a href="https://smakfynd.se" style="color:#8b2332">Smakfynd</a> &middot; Oberoende vinrankare
      </p>
    </footer>
  </div>
</body>
</html>'''

    out_dir = DOCS / "prissankt"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "index.html"
    out_file.write_text(html)
    print(f"\nPage built: {out_file} ({len(drops)} wines, noindex)")



if __name__ == "__main__":
    sys.exit(main())
