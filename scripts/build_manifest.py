#!/usr/bin/env python3
"""
Build Manifest — FIX 5a
Emits a manifest of every data input that affects the build output.
Run after build to record what was used. Compare local vs CI to detect divergence.

Usage:
  python3 scripts/build_manifest.py              # Emit manifest
  python3 scripts/build_manifest.py --compare X   # Compare against manifest X
"""

import json, os, sys, hashlib
from pathlib import Path
from datetime import datetime

BASE = Path(__file__).parent.parent
DATA_DIR = BASE / "data"
DOCS = BASE / "docs"

INPUT_FILES = {
    "systembolaget_raw":   DATA_DIR / "systembolaget_raw.json",
    "vivino_cache":        DATA_DIR / "vivino_cache.json",
    "expert_cache":        DATA_DIR / "expert_cache.json",
    "winesearcher_cache":  DATA_DIR / "winesearcher_cache.json",
    "prissankt_bootstrap": DATA_DIR / "prissankt_bootstrap.json",
    "first_seen_prices":   DATA_DIR / "history" / "first_seen_prices.json",
    "scored_output":       DATA_DIR / "smakfynd_ranked_v2.json",
}

OUTPUT_FILES = {
    "wines_json":          DOCS / "wines.json",
}


def file_hash(path):
    if not path.exists():
        return None
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()[:16]


def row_count(path):
    if not path.exists():
        return None
    try:
        data = json.load(open(path))
        if isinstance(data, list):
            return len(data)
        elif isinstance(data, dict):
            return len(data)
        return None
    except Exception:
        return None


def emit_manifest():
    manifest = {
        "timestamp": datetime.now().isoformat(),
        "hostname": os.uname().nodename,
        "inputs": {},
        "outputs": {},
    }

    for name, path in INPUT_FILES.items():
        manifest["inputs"][name] = {
            "path": str(path.relative_to(BASE)),
            "exists": path.exists(),
            "hash": file_hash(path),
            "rows": row_count(path),
            "size_kb": round(path.stat().st_size / 1024) if path.exists() else None,
        }

    for name, path in OUTPUT_FILES.items():
        manifest["outputs"][name] = {
            "path": str(path.relative_to(BASE)),
            "exists": path.exists(),
            "hash": file_hash(path),
            "rows": row_count(path),
            "size_kb": round(path.stat().st_size / 1024) if path.exists() else None,
        }

    return manifest


def print_manifest(m):
    print(f"Build Manifest — {m['timestamp']} on {m['hostname']}")
    print()
    print("INPUTS:")
    for name, info in m["inputs"].items():
        status = f"{info['rows']:>6} rows  {info['size_kb']:>5} KB  {info['hash']}" if info["exists"] else "MISSING"
        print(f"  {name:<22} {status}")
    print()
    print("OUTPUTS:")
    for name, info in m["outputs"].items():
        status = f"{info['rows']:>6} rows  {info['size_kb']:>5} KB  {info['hash']}" if info["exists"] else "MISSING"
        print(f"  {name:<22} {status}")


def compare(local, other_path):
    other = json.load(open(other_path))

    divergences = []

    for section in ("inputs", "outputs"):
        for name in set(list(local[section].keys()) + list(other.get(section, {}).keys())):
            l = local[section].get(name, {})
            o = other.get(section, {}).get(name, {})

            if l.get("exists") != o.get("exists"):
                divergences.append(f"[{section}] {name}: exists={l.get('exists')} vs {o.get('exists')}")
            elif l.get("exists") and o.get("exists"):
                if l.get("hash") != o.get("hash"):
                    divergences.append(
                        f"[{section}] {name}: hash differs "
                        f"({l.get('rows')} rows / {l.get('size_kb')} KB vs "
                        f"{o.get('rows')} rows / {o.get('size_kb')} KB)"
                    )

    output_divergences = [d for d in divergences if d.startswith("[outputs]")]
    input_divergences = [d for d in divergences if d.startswith("[inputs]")]

    if not divergences:
        print("BUILD PARITY: IDENTICAL")
        print(f"  Local:  {local['timestamp']} on {local['hostname']}")
        print(f"  Other:  {other['timestamp']} on {other.get('hostname', '?')}")
        return 0

    print(f"BUILD PARITY: {'FAIL' if output_divergences else 'WARN'} ({len(divergences)} differences)")
    print(f"  Local:  {local['timestamp']} on {local['hostname']}")
    print(f"  Other:  {other['timestamp']} on {other.get('hostname', '?')}")
    print()
    if output_divergences:
        print("OUTPUT DIVERGENCE (different sites would be published):")
        for d in output_divergences:
            print(f"  {d}")
    if input_divergences:
        print("INPUT DIVERGENCE (may or may not affect output):")
        for d in input_divergences:
            print(f"  {d}")

    return 1 if output_divergences else 0


def main():
    manifest = emit_manifest()
    manifest_path = DATA_DIR / "deploy" / "build_manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)

    if len(sys.argv) >= 3 and sys.argv[1] == "--compare":
        print_manifest(manifest)
        print()
        rc = compare(manifest, sys.argv[2])
        sys.exit(rc)
    else:
        print_manifest(manifest)
        json.dump(manifest, open(manifest_path, "w"), indent=2)
        print(f"\nSaved: {manifest_path}")


if __name__ == "__main__":
    main()
