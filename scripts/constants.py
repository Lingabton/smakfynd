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
LOCKED_CORPUS_COUNT = 4362  # Sep 2026: Name sort, after dedup


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
