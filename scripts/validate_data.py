#!/usr/bin/env python3
"""Validate wines.json schema before deploy. Catches silent data breakage."""

import json, sys, os

REQUIRED_FIELDS = {
    "nr": str,
    "name": str,
    "smakfynd_score": (int, float),
    "price": (int, float),
    "type": str,
}

OPTIONAL_FIELDS = {
    "sub": str, "vol": (int, float), "pkg": str, "country": str, "grape": str,
    "crowd_score": (int, float), "crowd_reviews": (int, float),
    "expert_score": (int, float), "price_score": (int, float),
    "confidence": str, "assortment": str, "image_url": str,
    "organic": bool, "cat3": str, "food_pairings": list,
    "taste_body": (int, float), "taste_sweet": (int, float),
    "taste_fruit": (int, float), "taste_bitter": (int, float),
    "style": str, "region": str, "expert_source": str,
    "launch_price": (int, float), "price_vs_launch_pct": (int, float),
    "is_new": bool,
}

def validate(path):
    wines = json.load(open(path))
    errors = []
    warnings = []

    if not isinstance(wines, list):
        errors.append("Root is not an array")
        return errors, warnings

    if len(wines) < 100:
        errors.append(f"Only {len(wines)} wines — expected 1000+")

    # Track stats
    has_image = has_crowd = has_expert = has_taste = 0

    for i, w in enumerate(wines):
        # Required fields
        for field, expected_type in REQUIRED_FIELDS.items():
            if field not in w:
                errors.append(f"Wine #{i} ({w.get('name','?')}): missing required field '{field}'")
            elif not isinstance(w[field], expected_type if isinstance(expected_type, tuple) else (expected_type,)):
                errors.append(f"Wine #{i} ({w.get('name','?')}): '{field}' is {type(w[field]).__name__}, expected {expected_type}")

        # Score range
        score = w.get('smakfynd_score', 0)
        if score < 1 or score > 99:
            errors.append(f"Wine #{i} ({w.get('name','?')}): score {score} out of range 1-99")

        # Price sanity
        price = w.get('price', 0)
        if price and (price < 10 or price > 50000):
            warnings.append(f"Wine #{i} ({w.get('name','?')}): unusual price {price}")

        # Unknown fields
        all_known = set(REQUIRED_FIELDS) | set(OPTIONAL_FIELDS)
        for key in w:
            if key not in all_known:
                warnings.append(f"Wine #{i}: unknown field '{key}'")

        # Stats
        if w.get('image_url'): has_image += 1
        if w.get('crowd_score'): has_crowd += 1
        if w.get('expert_score'): has_expert += 1
        if w.get('taste_body'): has_taste += 1

    # Coverage checks
    n = len(wines)
    if has_image < n * 0.5:
        warnings.append(f"Low image coverage: {has_image}/{n} ({has_image*100//n}%)")
    if has_crowd < n * 0.8:
        warnings.append(f"Low crowd coverage: {has_crowd}/{n} ({has_crowd*100//n}%)")

    print(f"Validated {n} wines: {has_image} images, {has_crowd} crowd, {has_expert} expert, {has_taste} taste")

    return errors, warnings

if __name__ == "__main__":
    default = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs", "wines.json")
    path = sys.argv[1] if len(sys.argv) > 1 else default
    errors, warnings = validate(path)

    for w in warnings:
        print(f"  WARN: {w}")
    for e in errors:
        print(f"  ERROR: {e}")

    if errors:
        print(f"\n{len(errors)} errors, {len(warnings)} warnings — FAILED")
        sys.exit(1)
    else:
        print(f"\n0 errors, {len(warnings)} warnings — OK")
