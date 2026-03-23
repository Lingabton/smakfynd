#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# SMAKFYND — Weekly Update Script
# Run this once a week to refresh all data and redeploy the site.
# Usage: bash ~/smakfynd/scripts/update.sh
# ═══════════════════════════════════════════════════════════════

set -e
cd ~/smakfynd

echo "═══════════════════════════════════════"
echo "  SMAKFYND — Veckovis uppdatering"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "═══════════════════════════════════════"
echo ""

# Step 1: Fetch from Systembolaget
echo "📦 Steg 1/6: Hämtar produkter från Systembolaget..."
python3 scripts/scraper.py
echo ""

# Step 2: Match with Vivino (takes ~30-60 min)
echo "🍇 Steg 2/6: Matchar med Vivino-betyg..."
echo "   (Detta tar 30-60 minuter, Playwright-fönstret öppnas)"
python3 scripts/vivino_playwright.py
echo ""

# Step 3: Score wines
echo "📊 Steg 3/6: Beräknar Smakfynd-poäng..."
python3 scripts/score_wines_v4.py
echo ""

# Step 4: Save price snapshot
echo "💰 Steg 4/6: Sparar prishistorik..."
DATE=$(date '+%Y%m%d')
mkdir -p data/price_history
python3 -c "
import json, os
raw = json.load(open('data/systembolaget_raw.json'))
prices = {str(p.get('nr','')): p.get('price',0) for p in raw}
out = f'data/price_history/prices_{os.environ.get(\"DATE\", \"unknown\")}.json'
json.dump(prices, open(out, 'w'))
print(f'  Saved {len(prices)} prices to {out}')
"
echo ""

# Step 5: Build site
echo "🔨 Steg 5/6: Bygger sajten..."
python3 scripts/build_slim.py
python3 scripts/deploy_html.py
python3 scripts/build_prissankt.py
echo ""

# Step 6: Deploy
echo "🚀 Steg 6/6: Publicerar..."
cd ~/smakfynd
git add -A docs/
git commit -m "Weekly update $(date '+%Y-%m-%d')" || echo "  Inga ändringar att commita"
git push
echo ""

echo "═══════════════════════════════════════"
echo "  ✅ Klart! Sajten uppdaterad."
echo "  🌐 https://smakfynd.se"
echo "  🏷️ https://smakfynd.se/prissankt/"
echo "═══════════════════════════════════════"
