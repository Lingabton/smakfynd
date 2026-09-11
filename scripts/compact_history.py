#!/usr/bin/env python3
"""
Compact old price snapshots: keep daily files for 90 days, roll up
older months into monthly change summaries.

Run: python3 scripts/compact_history.py
     python3 scripts/compact_history.py --dry-run

Monthly rollups are saved as data/history/monthly_YYYY-MM.json.gz and
contain only changes: price moves, assortment moves, arrivals, delistings.
The daily full snapshots are then deleted — the deltas files already
captured the day-by-day detail.
"""

import json, gzip, os, sys
from datetime import date, timedelta
from pathlib import Path
from collections import defaultdict

BASE = Path(__file__).parent.parent
HIST_DIR = BASE / "data" / "history"
KEEP_DAYS = 90

sys.path.insert(0, str(BASE / "scripts"))
from constants import read_snapshot, snapshot_price


def find_snapshots():
    """Find all daily snapshot files, sorted by date."""
    files = []
    for f in sorted(HIST_DIR.iterdir()):
        if f.name.startswith("prices_") and (f.suffix == ".json" or f.name.endswith(".json.gz")):
            d = f.name.replace("prices_", "").replace(".json.gz", "").replace(".json", "")
            files.append((d, f))
    return files


def compact_month(month_str, snapshot_files):
    """Compact a month's snapshots into a change summary."""
    if len(snapshot_files) < 2:
        return None

    # Load first and last snapshot of the month
    first_date, first_path = snapshot_files[0]
    last_date, last_path = snapshot_files[-1]
    first = read_snapshot(str(first_path))
    last = read_snapshot(str(last_path))

    first_nrs = set(first.keys())
    last_nrs = set(last.keys())

    arrivals = last_nrs - first_nrs
    delistings = first_nrs - last_nrs
    price_changes = []
    assortment_moves = []

    for nr in first_nrs & last_nrs:
        fp = snapshot_price(first[nr])
        lp = snapshot_price(last[nr])
        if fp and lp and fp != lp:
            pct = round((lp - fp) / fp * 100)
            if abs(pct) >= 1:
                price_changes.append({"nr": nr, "from": fp, "to": lp, "pct": pct})

        fa = first[nr].get("a", "")
        la = last[nr].get("a", "")
        if fa and la and fa != la:
            assortment_moves.append({"nr": nr, "from": fa, "to": la})

    return {
        "month": month_str,
        "period": f"{first_date} to {last_date}",
        "snapshots_compacted": len(snapshot_files),
        "products_start": len(first_nrs),
        "products_end": len(last_nrs),
        "arrivals": sorted(arrivals),
        "delistings": sorted(delistings),
        "price_changes": sorted(price_changes, key=lambda x: x["nr"]),
        "assortment_moves": sorted(assortment_moves, key=lambda x: x["nr"]),
    }


def main():
    dry_run = "--dry-run" in sys.argv
    cutoff = (date.today() - timedelta(days=KEEP_DAYS)).isoformat()
    snapshots = find_snapshots()

    print(f"Snapshots: {len(snapshots)} files")
    print(f"Cutoff: {cutoff} ({KEEP_DAYS} days)")

    # Group old snapshots by month
    old_by_month = defaultdict(list)
    keep = []
    for d, path in snapshots:
        if d < cutoff:
            month = d[:7]  # YYYY-MM
            old_by_month[month].append((d, path))
        else:
            keep.append((d, path))

    print(f"Keep (recent): {len(keep)} files")
    print(f"Compact: {sum(len(v) for v in old_by_month.values())} files across {len(old_by_month)} months")

    if not old_by_month:
        print("Nothing to compact.")
        return

    for month in sorted(old_by_month.keys()):
        files = old_by_month[month]
        print(f"\n  {month}: {len(files)} snapshots")

        rollup = compact_month(month, files)
        if not rollup:
            print(f"    Skipped (< 2 snapshots)")
            continue

        out_path = HIST_DIR / f"monthly_{month}.json.gz"
        print(f"    Arrivals: {len(rollup['arrivals'])}, Delistings: {len(rollup['delistings'])}, "
              f"Price changes: {len(rollup['price_changes'])}, Assortment moves: {len(rollup['assortment_moves'])}")

        if dry_run:
            print(f"    DRY RUN: would write {out_path} and delete {len(files)} snapshots")
            continue

        # Write monthly rollup
        with gzip.open(out_path, "wt", encoding="utf-8") as f:
            json.dump(rollup, f, indent=2, ensure_ascii=False)
        print(f"    Written: {out_path} ({os.path.getsize(out_path)/1024:.0f} KB)")

        # Delete compacted daily snapshots
        for d, path in files:
            path.unlink()
            print(f"    Deleted: {path.name}")

        # Also delete corresponding delta files
        for d, _ in files:
            delta = HIST_DIR / f"deltas_{d}.json"
            if delta.exists():
                delta.unlink()

    print(f"\nDone.")


if __name__ == "__main__":
    main()
