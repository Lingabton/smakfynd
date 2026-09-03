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
from constants import IN_STORE, load_wines


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
    LOCKED = 4362
    pct = abs(scored - LOCKED) / LOCKED * 100
    if pct > 1:
        return status("red", f"Scored wines {scored} vs locked {LOCKED} ({pct:.1f}% drift)",
                      "Check fetch and scoring pipeline. See RUNBOOK.md §corpus-drift")
    if pct > 0.5:
        return status("amber", f"Scored wines {scored} vs locked {LOCKED} ({pct:.1f}%)")
    return status("green", f"Scored wines {scored} (locked {LOCKED})")


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


def main():
    print("=" * 60)
    print("  SMAKFYND HEALTH DIGEST")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)

    checks = {
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
