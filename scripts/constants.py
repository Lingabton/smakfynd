# Shared constants for Smakfynd pipeline scripts
import json

# Wines physically available in Systembolaget stores.
# Fast = permanent range, Tillfälligt = seasonal/limited (on shelves in select stores),
# Lokalt & Småskaligt = regional (on shelves locally).
# Ordervaror and Webblanseringar are NOT in-store — order only.
IN_STORE = {"Fast sortiment", "Tillfälligt sortiment", "Lokalt & Småskaligt"}

# The number of scored wines published on the site. This is the number
# shown on every page as "Baserat på N viner" and validated against
# the actual wines.json count. Update only in a commit that states
# old → new values and the reason.
import os as _os

LOCK_FILE = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "..", "data", "deploy", "corpus_lock.json")
# Lives in data/deploy/corpus_lock.json so scripts/corpus_lock.py can re-baseline it
# when drift is fully explained by SB delistings. Manual changes: edit that file,
# and state old -> new and the reason in the commit message.
LOCKED_CORPUS_COUNT = json.load(open(LOCK_FILE))["count"]


def load_wines(path):
    """Load a wines file, accepting both the {meta, wines} envelope and a flat array.

    Returns the wine list (always a list of dicts).
    Works with docs/wines.json (envelope) and data/smakfynd_ranked_v2.json (flat).
    """
    data = json.load(open(path))
    if isinstance(data, dict) and "wines" in data:
        return data["wines"]
    if isinstance(data, list):
        return data
    raise ValueError(f"Unexpected format in {path}: neither list nor {{meta, wines}}")


def read_snapshot(path):
    """Read a daily price snapshot, accepting all formats:
    - Old: {nr: price}  (float), .json
    - New: {nr: {p: price, v: vol, a: assortment, o: oos, t: temp_oos, y: vintage}}, .json or .json.gz

    Returns {nr: {p, v, a, o, t, y}} — always the rich format.
    """
    import gzip as _gzip
    if path.endswith(".gz"):
        with _gzip.open(path, "rt", encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = json.load(open(path))
    result = {}
    for nr, val in data.items():
        if isinstance(val, dict):
            result[nr] = val
        else:
            result[nr] = {"p": val}
    return result


def snapshot_price(row):
    """Extract the price from a snapshot row (old or new format)."""
    if isinstance(row, dict):
        return row.get("p", 0)
    return row  # old format: row is the price directly
