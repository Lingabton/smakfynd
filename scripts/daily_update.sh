#!/bin/bash
# ══════════════════════════════════════════════════════════
# Smakfynd Daily Data Update
# Runs: SB scrape → Vivino match (gap only) → Score → Build → Deploy
#
# Install cron:
#   crontab -e
#   0 6 * * * /Users/gabriellinton/smakfynd/scripts/daily_update.sh >> /Users/gabriellinton/smakfynd/data/logs/daily.log 2>&1
#
# Manual run:
#   ./scripts/daily_update.sh           # Full update
#   ./scripts/daily_update.sh --sb-only # Only Systembolaget prices
# ══════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")/.."
PROJECT="$PWD"
LOG_DIR="$PROJECT/data/logs"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo ""
echo "═══════════════════════════════════════════"
echo "  Smakfynd update — $TIMESTAMP"
echo "═══════════════════════════════════════════"

# Ensure Python is available
PYTHON=${PYTHON:-python3}
if ! command -v $PYTHON &>/dev/null; then
    echo "ERROR: python3 not found"
    exit 1
fi

# ── Step 1: Fetch Systembolaget data (prices, new products) ──
echo ""
echo "→ Step 1: Fetching Systembolaget data..."
$PYTHON scripts/scraper.py --systembolaget 2>&1 | tail -5
SB_EXIT=$?
if [ $SB_EXIT -ne 0 ]; then
    echo "WARNING: SB scrape failed (exit $SB_EXIT) — continuing with existing data"
fi

# ── Step 2: Save price snapshot to analytics ──
echo ""
echo "→ Step 2: Saving price snapshot..."
$PYTHON -c "
import json, os
from datetime import date
data_file = os.path.expanduser('~/smakfynd/data/systembolaget_raw.json')
hist_dir = os.path.expanduser('~/smakfynd/data/history')
os.makedirs(hist_dir, exist_ok=True)

if os.path.exists(data_file):
    wines = json.load(open(data_file))
    today = date.today().isoformat()

    # Save daily price snapshot
    prices = {str(w.get('nr','')): w.get('price',0) for w in wines if w.get('nr') and w.get('price')}
    snapshot_file = os.path.join(hist_dir, f'prices_{today}.json')
    json.dump(prices, open(snapshot_file, 'w'))
    print(f'  Saved {len(prices)} prices → {snapshot_file}')

    # Update first_seen_prices (for price drop detection)
    first_seen_file = os.path.join(hist_dir, 'first_seen_prices.json')
    first_seen = {}
    if os.path.exists(first_seen_file):
        first_seen = json.load(open(first_seen_file))
    new_count = 0
    for nr, price in prices.items():
        if nr not in first_seen:
            first_seen[nr] = {'price': price, 'date': today}
            new_count += 1
    json.dump(first_seen, open(first_seen_file, 'w'))
    print(f'  First-seen prices: {len(first_seen)} total, {new_count} new')
else:
    print('  No SB data found')
" 2>&1

# ── Step 3: Vivino gap matching (only new/unmatched wines) ──
if [ "$1" != "--sb-only" ]; then
    echo ""
    echo "→ Step 3: Vivino gap matching (new wines only)..."
    # Only run if vivino_playwright.py exists and there are gaps
    if [ -f scripts/vivino_playwright.py ]; then
        GAP_COUNT=$($PYTHON -c "
import json, os
sb = json.load(open(os.path.expanduser('~/smakfynd/data/systembolaget_raw.json')))
cache = {}
cache_file = os.path.expanduser('~/smakfynd/data/vivino_cache.json')
if os.path.exists(cache_file):
    cache = json.load(open(cache_file))
gaps = [w for w in sb if f\"{w.get('name','')}|{w.get('sub','')}|{w.get('country','')}\" not in cache]
print(len(gaps))
" 2>/dev/null)
        if [ "$GAP_COUNT" -gt 0 ] 2>/dev/null; then
            echo "  $GAP_COUNT wines missing Vivino data — matching first 50..."
            $PYTHON scripts/vivino_playwright.py --test 50 2>&1 | tail -5
        else
            echo "  No Vivino gaps — skipping"
        fi
    else
        echo "  vivino_playwright.py not found — skipping"
    fi
fi

# ── Step 4: Score all wines ──
echo ""
echo "→ Step 4: Scoring wines..."
$PYTHON scripts/score_wines_v2.py 2>&1 | tail -5

# ── Step 5: Build site ──
echo ""
echo "→ Step 5: Building site..."
$PYTHON scripts/build_slim.py 2>&1 | tail -3
$PYTHON scripts/deploy_html.py 2>&1 | tail -2

# ── Step 6: Generate landing pages ──
echo ""
echo "→ Step 6: Generating landing pages..."
$PYTHON scripts/generate_landing_pages.py 2>&1 | tail -3
$PYTHON scripts/generate_monthly_seo.py 2>&1 | tail -2

# Update sitemap with monthly pages
$PYTHON -c "
from datetime import datetime
today = datetime.now().strftime('%Y-%m-%d')
sitemap = open('docs/sitemap.xml').read()
month_sv = ['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'][datetime.now().month - 1]
monthly = [f'basta-vin-{month_sv}-{datetime.now().year}', 'billigt-och-bra-vin', 'basta-boxvin', 'vin-till-midsommar', 'vin-till-kraftskiva']
added = 0
for slug in monthly:
    if slug not in sitemap:
        sitemap = sitemap.replace('</urlset>', f'  <url>\n    <loc>https://smakfynd.se/{slug}/</loc>\n    <lastmod>{today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n</urlset>')
        added += 1
if added:
    open('docs/sitemap.xml', 'w').write(sitemap)
    print(f'  Added {added} monthly URLs to sitemap')
" 2>&1

# ── Step 7: Git commit + push ──
echo ""
echo "→ Step 7: Deploying..."
cd "$PROJECT"
if git diff --quiet docs/ site/ 2>/dev/null; then
    echo "  No changes to deploy"
else
    git add docs/ site/
    git commit -m "data: daily price update $(date '+%Y-%m-%d')" --no-verify 2>&1 | tail -1
    git push 2>&1 | tail -1
    echo "  ✓ Deployed!"
fi

# ── Summary ──
echo ""
echo "═══════════════════════════════════════════"
WINE_COUNT=$($PYTHON -c "import json; print(len(json.load(open('data/smakfynd_ranked_v2.json'))))" 2>/dev/null || echo "?")
echo "  ✓ Update complete — $WINE_COUNT wines"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════"
