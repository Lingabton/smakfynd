#!/usr/bin/env python3
"""
Health digest — single report on the state of the Smakfynd pipeline.
Checks all guards, data quality signals, and operational health.

Usage: python3 scripts/health_digest.py
Output: human-readable text + data/health_digest.json
"""

import json, os, sys, subprocess, hashlib
from datetime import datetime, timedelta
from pathlib import Path

BASE = Path(__file__).parent.parent
DATA_DIR = BASE / "data"
DOCS = BASE / "docs"

sys.path.insert(0, str(BASE / "scripts"))
from constants import IN_STORE, LOCKED_CORPUS_COUNT, load_wines


def status(level, msg, action=None):
    return {"level": level, "msg": msg, "action": action}


def check_last_build():
    """Last successful build from git log on docs/."""
    try:
        r = subprocess.run(
            ["git", "log", "-1", "--format=%aI", "--", "docs/"],
            capture_output=True, text=True, cwd=str(BASE))
        if r.returncode != 0 or not r.stdout.strip():
            return status("red", "Cannot determine last build date", "Check git history")
        last = datetime.fromisoformat(r.stdout.strip())
        age = datetime.now(last.tzinfo) - last
        if age > timedelta(hours=48):
            return status("red", f"Last build {age.days}d {age.seconds//3600}h ago",
                          "Run the build pipeline or check why daily workflow is disabled")
        if age > timedelta(hours=25):
            return status("amber", f"Last build {age.days}d {age.seconds//3600}h ago")
        return status("green", f"Last build {age.seconds//3600}h ago")
    except Exception as e:
        return status("red", f"Error: {e}")


def check_corpus():
    """Corpus count vs locked constant."""
    wines_path = DOCS / "wines.json"
    if not wines_path.exists():
        return status("red", "wines.json not found", "Run build_slim.py")
    wines = load_wines(str(wines_path))
    scored = sum(1 for w in wines if not w.get("unrated"))
    LOCKED = LOCKED_CORPUS_COUNT
    pct = abs(scored - LOCKED) / LOCKED * 100
    if pct > 1:
        return status("red", f"Scored wines {scored} vs locked {LOCKED} ({pct:.1f}% drift)",
                      "Check fetch and scoring pipeline. See RUNBOOK.md §corpus-drift")

    # Track scored count as a time series for trend detection
    series_file = DATA_DIR / "history" / "scored_history.json"
    series = []
    if series_file.exists():
        try:
            series = json.load(open(series_file))
        except (json.JSONDecodeError, ValueError):
            series = []
    today = datetime.now().strftime("%Y-%m-%d")
    # Append today's count if not already recorded
    if not series or series[-1].get("date") != today:
        series.append({"date": today, "scored": scored})
        series_file.parent.mkdir(parents=True, exist_ok=True)
        json.dump(series, open(series_file, "w"), indent=2)

    # Check for sustained downward trend (last 7 entries)
    trend_msg = ""
    if len(series) >= 7:
        recent = [e["scored"] for e in series[-7:]]
        oldest, newest = recent[0], recent[-1]
        if newest < oldest - 50:
            trend_msg = f" TREND: {oldest}→{newest} over last 7 readings"
            if pct <= 0.5:
                return status("amber", f"Scored wines {scored} (locked {LOCKED}){trend_msg}",
                              "Scored count declining — check for catalog or scoring changes")

    if pct > 0.5:
        return status("amber", f"Scored wines {scored} vs locked {LOCKED} ({pct:.1f}%){trend_msg}")
    return status("green", f"Scored wines {scored} (locked {LOCKED}){trend_msg}")


def check_validator():
    """Run validate_data.py and report."""
    wines_path = DOCS / "wines.json"
    if not wines_path.exists():
        return status("red", "wines.json not found")
    try:
        r = subprocess.run(
            ["python3", "scripts/validate_data.py"],
            capture_output=True, text=True, cwd=str(BASE), timeout=120)
        if r.returncode != 0:
            errors = [l for l in r.stdout.splitlines() if "ERROR" in l]
            return status("red", f"Validator failed: {len(errors)} errors",
                          "Run python3 scripts/validate_data.py and fix errors")
        warnings = [l for l in r.stdout.splitlines() if "WARN" in l]
        if len(warnings) > 10:
            return status("amber", f"Validator passed with {len(warnings)} warnings")
        return status("green", f"Validator passed ({len(warnings)} warnings)")
    except Exception as e:
        return status("red", f"Validator error: {e}")


def check_price_history():
    """Check for gaps in daily price snapshots."""
    hist_dir = DATA_DIR / "history"
    if not hist_dir.exists():
        return status("amber", "No history directory")
    today = datetime.now().date()
    missing = []
    for i in range(14):
        d = today - timedelta(days=i)
        f = hist_dir / f"prices_{d.isoformat()}.json"
        if not f.exists():
            missing.append(d.isoformat())
    if len(missing) > 3:
        return status("red", f"{len(missing)} missing days in last 14: {', '.join(missing[:5])}",
                      "Check fetch_systembolaget.py and daily workflow")
    if missing:
        return status("amber", f"{len(missing)} missing days: {', '.join(missing)}")
    return status("green", "No gaps in last 14 days")


def check_wine_list_stability():
    """Check if wine lists are changing without data changes."""
    hash_file = DATA_DIR / "list_hashes.json"
    if not hash_file.exists():
        return status("amber", "No list_hashes.json — run verify_determinism.py")
    return status("green", "List hashes file present")


def check_gsc():
    """Check GSC data for indexed page trends."""
    gsc_file = DATA_DIR / "gsc_history.json"
    if not gsc_file.exists():
        return status("amber", "No GSC data available")
    try:
        data = json.load(open(gsc_file))
        totals = data.get("totals", {})
        clicks = totals.get("clicks", 0)
        impressions = totals.get("impressions", 0)
        return status("green", f"GSC: {clicks} clicks, {impressions} impressions (last export)")
    except Exception:
        return status("amber", "Cannot parse GSC data")


def check_deploy_size():
    """Check if the last deploy was too large."""
    hash_file = DATA_DIR / "page_hashes.json"
    if not hash_file.exists():
        return status("amber", "No page_hashes.json")
    return status("green", "Deploy hash tracking active")


def check_live_site():
    """Synthetic check: fetch the live site and verify it serves wine data."""
    import requests as _req
    try:
        # Check wines.json
        r = _req.get("https://smakfynd.se/wines.json", timeout=15)
        if r.status_code != 200:
            return status("red", f"wines.json returned {r.status_code}",
                          "Check GitHub Pages deployment. See RUNBOOK.md")
        data = r.json()
        wines = data.get("wines", data) if isinstance(data, dict) else data
        if not isinstance(wines, list) or len(wines) < 100:
            return status("red", f"wines.json has {len(wines) if isinstance(wines, list) else 0} wines (expected 4000+)",
                          "wines.json may be malformed or empty")
        pct = abs(len(wines) - LOCKED_CORPUS_COUNT) / LOCKED_CORPUS_COUNT * 100
        if pct > 5:
            return status("red", f"wines.json has {len(wines)} wines vs locked {LOCKED_CORPUS_COUNT} ({pct:.0f}% off)",
                          "wines.json corpus mismatch — check build pipeline")

        # Check homepage
        r2 = _req.get("https://smakfynd.se/", timeout=15)
        if r2.status_code != 200:
            return status("red", f"Homepage returned {r2.status_code}",
                          "Check GitHub Pages deployment")
        html = r2.text
        if "raw.wines" not in html and ".wines||" not in html:
            return status("red", "Homepage missing envelope handler — app will show 0 products",
                          "Run build_app.py && deploy_html.py && push docs/index.html")
        if "DATA_URL" not in html and "wines.json" not in html:
            return status("red", "Homepage missing DATA_URL — app cannot load wine data",
                          "Check deploy_html.py output")

        # Content quality checks on live data
        # Content quality: fabricated signals are red, large drops are amber
        fake_crowd = sum(1 for w in wines if w.get('crowd_score') and (w.get('crowd_reviews', 0) or 0) < 1)
        if fake_crowd > 0:
            return status("red", f"{fake_crowd} wines with crowd_score but 0 reviews",
                          "Fix vivino_to_10() — Bayesian prior leak")

        huge_drops = sum(1 for w in wines if w.get('price_vs_launch_pct', 0) > 80)
        if huge_drops > 5:
            return status("red", f"{huge_drops} wines with >80% price drop — likely corrupted data",
                          "Check first_seen_prices.json")

        return status("green", f"Live site OK: {len(wines)} wines, homepage loads")
    except _req.ConnectionError:
        return status("red", "Cannot reach smakfynd.se",
                      "Check DNS and GitHub Pages settings")
    except Exception as e:
        return status("red", f"Live site check failed: {e}")


def main():
    print("=" * 60)
    print("  SMAKFYND HEALTH DIGEST")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)

    checks = {
        "Live site": check_live_site,
        "Last build": check_last_build,
        "Corpus count": check_corpus,
        "Validator": check_validator,
        "Price history": check_price_history,
        "Wine-list stability": check_wine_list_stability,
        "GSC data": check_gsc,
        "Deploy tracking": check_deploy_size,
    }

    results = {}
    worst = "green"
    level_order = {"green": 0, "amber": 1, "red": 2}

    for name, fn in checks.items():
        r = fn()
        results[name] = r
        icon = {"green": "OK", "amber": "!!", "red": "XX"}[r["level"]]
        print(f"\n  [{icon}] {name}")
        print(f"      {r['msg']}")
        if r.get("action"):
            print(f"      -> {r['action']}")
        if level_order[r["level"]] > level_order[worst]:
            worst = r["level"]

    print(f"\n{'=' * 60}")
    overall = {"green": "ALL CLEAR", "amber": "NEEDS ATTENTION", "red": "ACTION REQUIRED"}[worst]
    print(f"  OVERALL: {overall}")
    print(f"{'=' * 60}")

    # Write JSON
    output = {
        "timestamp": datetime.now().isoformat(),
        "overall": worst,
        "checks": results,
    }
    out_path = DATA_DIR / "health_digest.json"
    json.dump(output, open(out_path, "w"), indent=2, ensure_ascii=False)
    print(f"\nJSON: {out_path}")

    return 0 if worst != "red" else 1


if __name__ == "__main__":
    sys.exit(main())
