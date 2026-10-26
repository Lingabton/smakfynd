#!/usr/bin/env python3
"""Tests for match_experts.py — verify --sample never writes expert_cache.json."""

import json, os, shutil, subprocess, tempfile
from pathlib import Path

BASE = Path(__file__).parent.parent
SCRIPT = BASE / "scripts" / "match_experts.py"
CACHE = BASE / "data" / "expert_cache.json"
SAMPLE = BASE / "data" / "expert_match_sample.json"


def test_sample_does_not_write_cache():
    """--sample must never modify expert_cache.json."""
    if not CACHE.exists():
        print("SKIP: no expert_cache.json to test against")
        return

    # Record original cache content
    original = CACHE.read_bytes()
    original_mtime = os.path.getmtime(CACHE)

    # Remove sample if it exists
    if SAMPLE.exists():
        SAMPLE.unlink()

    # Run with --rescore --sample
    result = subprocess.run(
        ["python3", str(SCRIPT), "--rescore", "--sample"],
        capture_output=True, text=True, cwd=str(BASE), timeout=600,
    )

    # Cache must be unchanged
    assert CACHE.read_bytes() == original, (
        "expert_cache.json was modified by --sample"
    )
    assert os.path.getmtime(CACHE) == original_mtime, (
        "expert_cache.json mtime changed by --sample"
    )

    # Sample file must exist
    assert SAMPLE.exists(), "expert_match_sample.json was not created"

    sample = json.loads(SAMPLE.read_text())
    assert len(sample) > 0, "sample is empty"
    assert all("correct" in s for s in sample), "sample entries missing 'correct' field"

    print(f"PASS: --sample wrote {len(sample)} sample entries, cache untouched")


if __name__ == "__main__":
    test_sample_does_not_write_cache()
