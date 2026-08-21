#!/usr/bin/env python3
"""
Check for gaps in price history snapshots.
Run daily after price snapshot to detect missed runs.
Exits with code 1 if yesterday's snapshot is missing.
"""

import os, sys, json
from datetime import date, timedelta
from pathlib import Path

HIST_DIR = Path(__file__).parent.parent / "data" / "history"

today = date.today()
yesterday = today - timedelta(days=1)

# Check if yesterday's snapshot exists
yesterday_file = HIST_DIR / f"prices_{yesterday.isoformat()}.json"
today_file = HIST_DIR / f"prices_{today.isoformat()}.json"

if not today_file.exists() and not yesterday_file.exists():
    print(f"ALERT: No price snapshot for {yesterday} or {today}!")
    print(f"Price history gap detected — check if daily update ran.")
    sys.exit(1)

# Report coverage stats
files = sorted(f for f in os.listdir(HIST_DIR) if f.startswith("prices_") and f.endswith(".json"))
dates = [f.replace("prices_", "").replace(".json", "") for f in files]

if len(dates) < 2:
    print(f"Only {len(dates)} snapshots — too few for coverage analysis.")
    sys.exit(0)

first = date.fromisoformat(dates[0])
last = date.fromisoformat(dates[-1])
expected = (last - first).days + 1
coverage = len(dates) / expected * 100

print(f"Price history: {len(dates)} snapshots, {first} to {last}")
print(f"Coverage: {coverage:.1f}% ({len(dates)}/{expected} days)")

# Check recent 7-day streak
recent_ok = True
for i in range(1, 8):
    d = today - timedelta(days=i)
    if d >= first and not (HIST_DIR / f"prices_{d.isoformat()}.json").exists():
        print(f"  Missing: {d}")
        recent_ok = False

if recent_ok:
    print("Last 7 days: all present")
else:
    print("WARNING: Gaps in last 7 days!")
