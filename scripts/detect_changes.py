#!/usr/bin/env python3
"""
Detect changes in Systembolaget's assortment.
Run after updating systembolaget_raw.json to find:
- New wines added
- Wines removed
- Price changes

Usage: python3 scripts/detect_changes.py
"""

import json, os
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(SCRIPT_DIR)
DATA = os.path.join(BASE, "data")
HISTORY = os.path.join(DATA, "price_history")

def main():
    sb = json.load(open(os.path.join(DATA, "systembolaget_raw.json")))
    current = {str(p.get('nr','')): p for p in sb if p.get('cat1') == 'Vin'}

    # Find latest price snapshot
    if not os.path.exists(HISTORY):
        print("No price history found. Run snapshot_prices.py first.")
        return

    snapshots = sorted([f for f in os.listdir(HISTORY) if f.startswith('prices_')])
    if not snapshots:
        print("No snapshots found.")
        return

    prev = json.load(open(os.path.join(HISTORY, snapshots[-1])))

    # New wines (in current but not in previous)
    new_wines = []
    for nr, wine in current.items():
        if nr not in prev and wine.get('assortment') == 'Fast sortiment':
            new_wines.append(wine)

    # Removed wines
    removed = []
    for nr in prev:
        if nr not in current:
            removed.append({'nr': nr, 'name': prev[nr].get('name', '?')})

    # Price changes
    price_drops = []
    price_raises = []
    for nr, wine in current.items():
        if nr in prev and prev[nr].get('price'):
            old_price = prev[nr]['price']
            new_price = wine.get('price', 0)
            if new_price and old_price:
                diff = new_price - old_price
                pct = diff / old_price * 100
                if diff < -5:
                    price_drops.append({
                        'name': wine.get('name', ''), 'old': old_price,
                        'new': new_price, 'diff': diff, 'pct': pct
                    })
                elif diff > 5:
                    price_raises.append({
                        'name': wine.get('name', ''), 'old': old_price,
                        'new': new_price, 'diff': diff, 'pct': pct
                    })

    print(f"{'='*50}")
    print(f"SORTIMENTSÄNDRINGAR sedan {snapshots[-1]}")
    print(f"{'='*50}\n")

    if new_wines:
        print(f"NYA VINER ({len(new_wines)}):")
        for w in sorted(new_wines, key=lambda x: -(x.get('price',0) or 0))[:20]:
            print(f"  + {w.get('name',''):30s} {w.get('price',0)} kr  {w.get('country','')}")
    else:
        print("Inga nya viner")

    if removed:
        print(f"\nBORTTAGNA ({len(removed)}):")
        for w in removed[:20]:
            print(f"  - {w['name'][:30]:30s} (nr {w['nr']})")

    if price_drops:
        price_drops.sort(key=lambda x: x['diff'])
        print(f"\nPRISSÄNKNINGAR ({len(price_drops)}):")
        for w in price_drops[:15]:
            print(f"  ↓ {w['name'][:30]:30s} {w['old']} → {w['new']} ({w['diff']:+.0f} kr, {w['pct']:+.0f}%)")

    if price_raises:
        print(f"\nPRISHÖJNINGAR ({len(price_raises)}):")
        for w in price_raises[:10]:
            print(f"  ↑ {w['name'][:30]:30s} {w['old']} → {w['new']} ({w['diff']:+.0f} kr)")

    print(f"\nTotalt: {len(current)} viner i sortimentet")

if __name__ == "__main__":
    main()
