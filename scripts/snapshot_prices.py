#!/usr/bin/env python3
"""
Save weekly price snapshot for trend tracking.
Run weekly after updating systembolaget_raw.json.

Usage:
  python3 scripts/snapshot_prices.py                # Save locally
  python3 scripts/snapshot_prices.py --upload URL   # Upload to analytics worker
"""

import json, os, argparse
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(SCRIPT_DIR)
DATA = os.path.join(BASE, "data")
HISTORY_DIR = os.path.join(DATA, "price_history")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--upload', type=str, help='Analytics worker URL')
    args = parser.parse_args()

    sb = json.load(open(os.path.join(DATA, "systembolaget_raw.json")))
    wines = [p for p in sb if p.get('cat1') == 'Vin']

    today = datetime.now().strftime('%Y-%m-%d')

    # Save local snapshot
    os.makedirs(HISTORY_DIR, exist_ok=True)
    snapshot = {}
    for w in wines:
        nr = str(w.get('nr', ''))
        if nr and w.get('price'):
            snapshot[nr] = {
                'price': w['price'],
                'name': w.get('name', ''),
                'assortment': w.get('assortment', ''),
            }

    path = os.path.join(HISTORY_DIR, f"prices_{today}.json")
    json.dump(snapshot, open(path, 'w'), ensure_ascii=False)
    print(f"Saved {len(snapshot)} prices to {path}")

    # Upload to analytics worker if URL provided
    if args.upload:
        import urllib.request
        prices = [{'nr': nr, 'price': v['price'], 'assortment': v['assortment']}
                  for nr, v in snapshot.items()]
        payload = json.dumps({'date': today, 'prices': prices}).encode()
        req = urllib.request.Request(
            f"{args.upload}/prices",
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        resp = urllib.request.urlopen(req)
        print(f"Uploaded to analytics: {resp.read().decode()}")

    # Show price changes vs last snapshot
    snapshots = sorted([f for f in os.listdir(HISTORY_DIR) if f.startswith('prices_')])
    if len(snapshots) >= 2:
        prev = json.load(open(os.path.join(HISTORY_DIR, snapshots[-2])))
        changes = 0
        drops = []
        for nr, cur in snapshot.items():
            if nr in prev and prev[nr]['price'] != cur['price']:
                changes += 1
                diff = cur['price'] - prev[nr]['price']
                if diff < -5:
                    drops.append((cur['name'], prev[nr]['price'], cur['price'], diff))
        drops.sort(key=lambda x: x[3])
        print(f"\nPrisändringar sedan {snapshots[-2]}: {changes}")
        if drops:
            print(f"Största prissänkningar:")
            for name, old, new, diff in drops[:10]:
                print(f"  {name[:35]:35s} {old} → {new} ({diff:+.0f} kr)")

if __name__ == "__main__":
    main()
