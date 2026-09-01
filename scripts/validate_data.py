#!/usr/bin/env python3
"""
Pre-publish validation layer — S1-7
Validates wines.json schema AND landing page data quality.
Failures halt the build with a named report.
"""

import json, sys, os, re
from pathlib import Path
from datetime import date, timedelta
from html.parser import HTMLParser

BASE = Path(__file__).parent.parent
DATA_DIR = BASE / "data"
DOCS = BASE / "docs"

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
    "insight": str, "avail": (int, float), "drop_date": str,
    "vintage": (int, str),
}

# Pages where small formats (<750ml) must be excluded
PRICE_THRESHOLD_SLUGS = {
    "vin-under-80-kr", "vin-under-90-kr", "vin-under-100-kr",
    "vin-under-150-kr", "vin-under-200-kr",
    "champagne-under-300-kr", "champagne-under-500-kr",
    "mousserande-vin-under-150-kr",
    "ekologiskt-vin-under-150-kr",
    "basta-rose-under-100-kr",
    "billigt-och-bra-vin",
}

# Norwegian tokens that must not appear in sv content
NORWEGIAN_TOKENS = [
    "gode kjøp", "også", "leter etter",
    "beste viner", "vinkjøp", "rangert",
    "billigere og bedre", "lavere priser",
]

# Pages that are intentionally Norwegian
NORWEGIAN_PAGES = {"gode-kjop-pa-systembolaget"}

MIN_WINES_PER_PAGE = 3

PRICE_BANDS = {
    "Rött": (30, 50000),
    "Vitt": (30, 50000),
    "Rosé": (30, 20000),
    "Mousserande": (40, 50000),
}
DEFAULT_PRICE_BAND = (20, 100000)


class WineListExtractor(HTMLParser):
    """Extract wine article numbers from a landing page."""
    def __init__(self):
        super().__init__()
        self.articles = []
        self._in_ol = False

    def handle_starttag(self, tag, attrs):
        attrs_d = dict(attrs)
        if tag == "ol" and attrs_d.get("id") == "wine-list":
            self._in_ol = True
        if self._in_ol and tag == "a":
            href = attrs_d.get("href", "")
            m = re.search(r'systembolaget\.se/produkt/vin/(\d+)', href)
            if m:
                self.articles.append(m.group(1))

    def handle_endtag(self, tag):
        if tag == "ol" and self._in_ol:
            self._in_ol = False


def get_page_articles(slug):
    idx = DOCS / slug / "index.html"
    if not idx.exists():
        return []
    html = idx.read_text()
    ext = WineListExtractor()
    ext.feed(html)
    return ext.articles


def validate(path):
    wines = json.load(open(path))
    wines_by_nr = {str(w.get("nr", "")): w for w in wines}
    errors = []
    warnings = []

    if not isinstance(wines, list):
        errors.append("[SCHEMA] Root is not an array")
        return errors, warnings

    if len(wines) < 100:
        errors.append(f"[SCHEMA] Only {len(wines)} wines — expected 1000+")

    has_image = has_crowd = has_expert = has_taste = 0

    for i, w in enumerate(wines):
        for field, expected_type in REQUIRED_FIELDS.items():
            if field not in w:
                errors.append(f"[SCHEMA] {w.get('name','?')} (#{w.get('nr','?')}): missing '{field}'")
            elif not isinstance(w[field], expected_type if isinstance(expected_type, tuple) else (expected_type,)):
                errors.append(f"[SCHEMA] {w.get('name','?')} (#{w.get('nr','?')}): '{field}' wrong type")

        score = w.get('smakfynd_score', 0)
        if score < 1 or score > 99:
            errors.append(f"[SCHEMA] {w.get('name','?')}: score {score} out of range 1-99")

        price = w.get('price', 0)
        wine_type = w.get('type', '')
        lo, hi = PRICE_BANDS.get(wine_type, DEFAULT_PRICE_BAND)
        if price and (price < lo or price > hi):
            warnings.append(f"[PRICE_BAND] {w.get('name','?')}: {price} kr outside [{lo}, {hi}]")

        # Score without rating source
        if score and score > 0:
            if not w.get('crowd_score') and not w.get('expert_score'):
                errors.append(f"[SCORE_NO_SOURCE] {w.get('name','?')} (#{w.get('nr','?')}): score {score} but no source")

        if w.get('image_url'): has_image += 1
        if w.get('crowd_score'): has_crowd += 1
        if w.get('expert_score'): has_expert += 1
        if w.get('taste_body'): has_taste += 1

    n = len(wines)
    if has_image < n * 0.5:
        warnings.append(f"[COVERAGE] Low image: {has_image}/{n} ({has_image*100//n}%)")
    if has_crowd < n * 0.8:
        warnings.append(f"[COVERAGE] Low crowd: {has_crowd}/{n} ({has_crowd*100//n}%)")

    print(f"Validated {n} wines: {has_image} images, {has_crowd} crowd, {has_expert} expert, {has_taste} taste")

    # ── Small format in price-threshold pages ──
    for slug in PRICE_THRESHOLD_SLUGS:
        articles = get_page_articles(slug)
        for nr in articles:
            wine = wines_by_nr.get(nr, {})
            vol = wine.get("vol", 750)
            if vol and vol < 750:
                errors.append(f"[SMALL_FORMAT] /{slug}/: {wine.get('name','?')} ({nr}) is {vol}ml")

    # ── Price change >40% day over day ──
    hist_dir = DATA_DIR / "history"
    today_str = date.today().isoformat()
    yesterday_str = (date.today() - timedelta(days=1)).isoformat()
    today_file = hist_dir / f"prices_{today_str}.json"
    yesterday_file = hist_dir / f"prices_{yesterday_str}.json"
    if today_file.exists() and yesterday_file.exists():
        today_prices = json.load(open(today_file))
        yesterday_prices = json.load(open(yesterday_file))
        spike_count = 0
        for nr, tval in today_prices.items():
            tp = tval["price"] if isinstance(tval, dict) else tval
            if nr in yesterday_prices:
                yval = yesterday_prices[nr]
                yp = yval["price"] if isinstance(yval, dict) else yval
                if yp and tp:
                    change_pct = abs(tp - yp) / yp * 100
                    if change_pct > 40:
                        if spike_count < 10:
                            errors.append(f"[PRICE_SPIKE] Article {nr}: {yp} -> {tp} ({change_pct:.0f}%)")
                        spike_count += 1
        if spike_count > 10:
            errors.append(f"[PRICE_SPIKE] ... and {spike_count - 10} more")

    # ── Missing volume on ranked list entries ──
    for slug in sorted(os.listdir(DOCS)):
        page_dir = DOCS / slug
        if not page_dir.is_dir():
            continue
        articles = get_page_articles(slug)
        for nr in articles:
            wine = wines_by_nr.get(nr)
            if wine is not None and "vol" not in wine:
                errors.append(f"[MISSING_VOLUME] /{slug}/: article {nr}")

    # ── Thin pages ──
    for slug in sorted(os.listdir(DOCS)):
        if slug in ("admin", "integritet", "tack", "specs"):
            continue
        page_dir = DOCS / slug
        if not page_dir.is_dir():
            continue
        articles = get_page_articles(slug)
        if 0 < len(articles) < MIN_WINES_PER_PAGE:
            warnings.append(f"[THIN_PAGE] /{slug}/: only {len(articles)} wines (min {MIN_WINES_PER_PAGE})")

    # ── Corpus count stability (PA-3) ──
    # Primary: anchor to locked constant. The count is a trust claim on every page.
    LOCKED_CORPUS_COUNT = 4143  # Locked Aug 2026
    locked_pct = abs(n - LOCKED_CORPUS_COUNT) / LOCKED_CORPUS_COUNT * 100
    if locked_pct > 1:
        errors.append(f"[CORPUS_SHIFT] Wine count {n} vs locked {LOCKED_CORPUS_COUNT} ({locked_pct:.1f}% — max 1%)")

    # Secondary: run-over-run drift check
    prev_count_file = DATA_DIR / "deploy" / "prev_corpus_count.txt"
    if prev_count_file.exists():
        try:
            prev_count = int(prev_count_file.read_text().strip())
            if prev_count > 0:
                run_pct = abs(n - prev_count) / prev_count * 100
                if run_pct > 1:
                    warnings.append(f"[CORPUS_DRIFT] Run-over-run: {prev_count} -> {n} ({run_pct:.1f}%)")
        except ValueError:
            pass
    prev_count_file.parent.mkdir(parents=True, exist_ok=True)
    prev_count_file.write_text(str(n))

    # ── Duplicate article numbers within a list ──
    for slug in sorted(os.listdir(DOCS)):
        if slug in ("admin", "integritet", "tack", "specs"):
            continue
        page_dir = DOCS / slug
        if not page_dir.is_dir():
            continue
        articles = get_page_articles(slug)
        seen = set()
        for nr in articles:
            if nr in seen:
                errors.append(f"[DUPLICATE] /{slug}/: article {nr} listed twice")
            seen.add(nr)

    # ── Norwegian tokens in sv content ──
    for slug in sorted(os.listdir(DOCS)):
        if slug in NORWEGIAN_PAGES:
            continue
        page_dir = DOCS / slug
        idx = page_dir / "index.html"
        if not page_dir.is_dir() or not idx.exists():
            continue
        html = idx.read_text()
        if 'lang="nb"' in html[:500] or 'lang="no"' in html[:500]:
            continue
        body_start = html.find("<body")
        if body_start == -1:
            continue
        body = html[body_start:]
        for token in NORWEGIAN_TOKENS:
            if token.lower() in body.lower():
                errors.append(f"[NORWEGIAN_IN_SV] /{slug}/: found '{token}'")

    return errors, warnings


if __name__ == "__main__":
    default = str(DOCS / "wines.json")
    path = sys.argv[1] if len(sys.argv) > 1 else default
    errors, warnings = validate(path)

    for w in warnings:
        print(f"  WARN: {w}")
    for e in errors:
        print(f"  ERROR: {e}")

    if errors:
        report_path = DATA_DIR / "deploy" / "validation_report.txt"
        report_path.parent.mkdir(parents=True, exist_ok=True)
        with open(report_path, "w") as f:
            f.write(f"Validation Report — {date.today().isoformat()}\n")
            f.write(f"Errors: {len(errors)}, Warnings: {len(warnings)}\n\n")
            for e in errors:
                f.write(f"ERROR: {e}\n")
            for w in warnings:
                f.write(f"WARN: {w}\n")
        print(f"\n{len(errors)} errors, {len(warnings)} warnings — FAILED")
        print(f"Report: {report_path}")
        sys.exit(1)
    else:
        print(f"\n0 errors, {len(warnings)} warnings — OK")
