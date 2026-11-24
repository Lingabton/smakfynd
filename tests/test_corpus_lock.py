#!/usr/bin/env python3
"""Tests for corpus_lock.py — the self-healing corpus gate."""

import gzip
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
import corpus_lock  # noqa: E402

LOCKED = 1000


def setup(tmp_path, monkeypatch, current, catalog, baseline=None):
    """Lock of 1000 wines (nr 0..999); `current` = today's scored nrs."""
    (tmp_path / "docs").mkdir()
    (tmp_path / "data" / "history").mkdir(parents=True)
    (tmp_path / "data" / "deploy").mkdir()
    base = baseline if baseline is not None else [str(i) for i in range(LOCKED)]
    lock = {"count": LOCKED, "set_on": "2026-09-15", "reason": "test", "nrs": base, "history": []}
    lock_file = tmp_path / "data" / "deploy" / "corpus_lock.json"
    lock_file.write_text(json.dumps(lock))
    wines = [{"nr": nr} for nr in current] + [{"nr": "u1", "unrated": True}]
    (tmp_path / "docs" / "wines.json").write_text(json.dumps({"meta": {}, "wines": wines}))
    with gzip.open(tmp_path / "data" / "history" / "prices_2026-11-25.json.gz", "wt") as f:
        json.dump(catalog, f)
    monkeypatch.setattr(corpus_lock, "BASE", tmp_path)
    monkeypatch.setattr(corpus_lock, "LOCK_FILE", str(lock_file))
    monkeypatch.setattr(corpus_lock, "REPORT", tmp_path / "data" / "deploy" / "report.txt")
    return lock_file


def in_store(nrs):
    return {nr: {"p": 100, "a": "Fast sortiment"} for nr in nrs}


def run(lock_file, tmp_path):
    assert corpus_lock.main() == 0
    return json.loads(Path(lock_file).read_text()), (tmp_path / "data" / "deploy" / "report.txt").read_text()


def test_within_tolerance_leaves_lock(tmp_path, monkeypatch):
    current = [str(i) for i in range(995)]
    lf = setup(tmp_path, monkeypatch, current, in_store(current))
    lock, report = run(lf, tmp_path)
    assert lock["count"] == LOCKED and report.startswith("OK")


def test_explained_delistings_rebaseline(tmp_path, monkeypatch):
    # 30 wines gone from SB, 10 moved to order-only, 5 new arrivals: 975 scored (-2.5%)
    current = [str(i) for i in range(960)] + [f"new{i}" for i in range(5)] + [str(i) for i in range(990, 1000)]
    catalog = in_store(current)
    catalog.update({str(i): {"p": 100, "a": "Ordervaror"} for i in range(960, 970)})
    lf = setup(tmp_path, monkeypatch, current, catalog)
    lock, report = run(lf, tmp_path)
    assert report.startswith("REBASELINED")
    assert lock["count"] == 975 and len(lock["nrs"]) == 975
    assert lock["history"][-1]["from"] == LOCKED and lock["history"][-1]["auto"] is True
    assert "20 delisted" in report and "10 moved" in report and "0 unexplained" in report


def test_wines_lost_while_still_on_shelf_block(tmp_path, monkeypatch):
    # 30 wines vanish from the ranking but SB still sells them in store: a pipeline bug
    current = [str(i) for i in range(970)]
    lf = setup(tmp_path, monkeypatch, current, in_store([str(i) for i in range(LOCKED)]))
    lock, report = run(lf, tmp_path)
    assert lock["count"] == LOCKED
    assert report.startswith("BLOCKED") and "30 unexplained" in report


def test_large_shift_always_needs_human(tmp_path, monkeypatch):
    current = [str(i) for i in range(900)]
    lf = setup(tmp_path, monkeypatch, current, in_store(current))  # even if fully explained
    lock, report = run(lf, tmp_path)
    assert lock["count"] == LOCKED and "needs a human" in report
