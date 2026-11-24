#!/usr/bin/env python3
"""Self-healing corpus lock.

LOCKED_CORPUS_COUNT guards against the pipeline silently losing wines. Pinned
as a constant, it also failed every build once Systembolaget's range slowly
shrank past 1% (Nov 2-25 2026: 23 days with no data deploy).

This automates the RUNBOOK "Corpus drift" procedure. Run it after build_slim.py
and before page generation:

  1. Compare today's scored set (docs/wines.json) with the set at lock time.
  2. Account for every lost wine: a wine that is gone from today's SB catalog,
     or has moved out of the in-store assortments, is a real delisting.
  3. Re-baseline only if the drift is explained. Lost wines still on the
     shelves are a pipeline problem; those keep the gate closed.

Exit code is always 0. When the lock can't move, validate_data.py fails
the build with CORPUS_SHIFT and the reason is in the report below.

Writes:
  data/deploy/corpus_lock.json        the lock (count, scored nrs, history)
  data/deploy/corpus_lock_report.txt  what happened this run (for commit/alerts)
"""
import glob
import json
import os
import subprocess
import sys
from datetime import date
from pathlib import Path

BASE = Path(__file__).parent.parent
sys.path.insert(0, str(BASE / "scripts"))
from constants import IN_STORE, LOCK_FILE, load_wines, read_snapshot  # noqa: E402

REPORT = BASE / "data" / "deploy" / "corpus_lock_report.txt"

TOLERANCE_PCT = 1.0       # drift the validator accepts without a re-baseline
MAX_SHIFT_PCT = 5.0       # bigger moves always need a human
MAX_UNEXPLAINED_PCT = 1.0 # lost-but-still-on-shelf wines allowed per re-baseline


def scored_nrs(wines):
    return {str(w["nr"]) for w in wines if not w.get("unrated")}


def baseline_nrs(lock):
    """Scored set at lock time. Falls back to the committed wines.json."""
    if lock.get("nrs"):
        return set(lock["nrs"])
    try:
        raw = subprocess.run(["git", "show", "HEAD:docs/wines.json"], cwd=BASE,
                             capture_output=True, text=True, check=True).stdout
        data = json.loads(raw)
        return scored_nrs(data["wines"] if isinstance(data, dict) else data)
    except Exception as e:
        print(f"  No baseline set available ({e})")
        return None


def latest_catalog():
    files = sorted(glob.glob(str(BASE / "data" / "history" / "prices_*.json*")))
    if not files:
        return None, None
    path = files[-1]
    return os.path.basename(path).split("_")[1].split(".")[0], read_snapshot(path)


def write_report(lines):
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text("\n".join(lines) + "\n")
    print("\n".join("  " + l for l in lines))


def main():
    lock = json.load(open(LOCK_FILE))
    locked = lock["count"]
    current = scored_nrs(load_wines(str(BASE / "docs" / "wines.json")))
    n = len(current)
    shift = (n - locked) / locked * 100
    print(f"Corpus lock: {n} scored vs locked {locked} ({shift:+.1f}%)")

    if abs(shift) <= TOLERANCE_PCT:
        write_report([f"OK: {n} scored, lock {locked} ({shift:+.1f}%), within {TOLERANCE_PCT}%"])
        return 0

    if abs(shift) > MAX_SHIFT_PCT:
        write_report([f"BLOCKED: {locked} -> {n} ({shift:+.1f}%) exceeds {MAX_SHIFT_PCT}% — needs a human.",
                      "See RUNBOOK.md 'Corpus drift'."])
        return 0

    base = baseline_nrs(lock)
    snap_date, catalog = latest_catalog()
    if base is None or catalog is None:
        write_report([f"BLOCKED: cannot account for {locked} -> {n}: missing baseline set or catalog snapshot."])
        return 0

    lost, gained = base - current, current - base
    delisted = {nr for nr in lost if nr not in catalog}
    moved = {nr for nr in lost - delisted if catalog[nr].get("a") not in IN_STORE}
    unexplained = sorted(lost - delisted - moved)
    budget = locked * MAX_UNEXPLAINED_PCT / 100

    summary = (f"{locked} -> {n}: lost {len(lost)} ({len(delisted)} delisted from SB, "
               f"{len(moved)} moved out of store assortments, {len(unexplained)} unexplained), "
               f"gained {len(gained)}; catalog {snap_date}")

    if len(unexplained) > budget:
        write_report([f"BLOCKED: {summary}",
                      f"{len(unexplained)} lost wines are still on SB shelves (max {budget:.0f}) — "
                      "likely a fetch or scoring problem.",
                      "Sample: " + ", ".join(unexplained[:15])])
        return 0

    today = date.today().isoformat()
    lock["history"].append({"date": today, "from": locked, "to": n, "auto": True, "reason": summary})
    lock.update(count=n, set_on=today, reason=f"auto-rebaseline: {summary}", nrs=sorted(current))
    with open(LOCK_FILE, "w") as f:
        json.dump(lock, f, indent=1, ensure_ascii=False)
        f.write("\n")
    write_report([f"REBASELINED: {summary}"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
