#!/usr/bin/env python3
"""
Find wines missing data and prioritize for scraping.
Shows exactly which wines need what, sorted by impact.

Usage:
  python3 scripts/find_gaps.py              # Show gaps
  python3 scripts/find_gaps.py --vivino     # List wines missing Vivino
  python3 scripts/find_gaps.py --expert     # List wines missing expert scores
  python3 scripts/find_gaps.py --ws-queue   # Output queue for WS scraper
"""

import json, argparse, os

DATA = os.path.expanduser("~/smakfynd/data")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--vivino', action='store_true')
    parser.add_argument('--expert', action='store_true')
    parser.add_argument('--ws-queue', action='store_true')
    parser.add_argument('--top', type=int, default=50)
    args = parser.parse_args()

    sb = json.load(open(f"{DATA}/systembolaget_raw.json"))
    ranked = json.load(open(f"{DATA}/smakfynd_ranked_v2.json"))
    vivino = json.load(open(f"{DATA}/vivino_cache.json"))
    ws = json.load(open(f"{DATA}/winesearcher_cache.json"))
    expert = json.load(open(f"{DATA}/expert_cache.json"))

    # Build lookup
    ranked_by_nr = {str(w.get('nr','')): w for w in ranked}
    fast = [p for p in sb if p.get('cat1') == 'Vin' and p.get('assortment') == 'Fast sortiment']

    # Wines missing expert (no WS, no WE)
    no_expert = []
    for w in fast:
        nr = str(w.get('nr', ''))
        has_ws = nr in ws and ws[nr].get('aggregate_score')
        has_we = nr in expert
        rw = ranked_by_nr.get(nr, {})
        score = rw.get('smakfynd_score', 0)
        crowd = rw.get('crowd_score', 0)
        reviews = rw.get('crowd_reviews', 0)
        if not has_ws and not has_we:
            no_expert.append({
                'nr': nr, 'name': w.get('name',''), 'sub': w.get('sub',''),
                'score': score, 'crowd': crowd, 'reviews': reviews,
                'price': w.get('price', 0),
            })

    # Wines missing Vivino
    no_vivino = []
    vivino_keys = set(vivino.keys())
    for w in fast:
        key = f"{w.get('name','')}|{w.get('sub','')}|{w.get('country','')}"
        if key not in vivino_keys:
            no_vivino.append({
                'nr': str(w.get('nr','')), 'name': w.get('name',''),
                'sub': w.get('sub',''), 'price': w.get('price', 0),
            })

    # WS scraper queue: fast sortiment wines not in WS cache
    ws_queue = []
    for w in fast:
        nr = str(w.get('nr', ''))
        if nr not in ws:
            rw = ranked_by_nr.get(nr, {})
            ws_queue.append({
                'nr': nr, 'name': w.get('name',''), 'sub': w.get('sub',''),
                'score': rw.get('smakfynd_score', 0),
                'crowd': rw.get('crowd_score', 0),
                'price': w.get('price', 0),
            })

    if not args.vivino and not args.expert and not args.ws_queue:
        # Summary
        print(f"{'='*50}")
        print(f"DATA GAP ANALYSIS — Fast sortiment ({len(fast)} viner)")
        print(f"{'='*50}")
        print(f"")
        print(f"Vivino (crowd):   {len(fast)-len(no_vivino)}/{len(fast)} har data ({len(no_vivino)} saknas)")
        print(f"Expert (WE+WS):   {len(fast)-len(no_expert)}/{len(fast)} har data ({len(no_expert)} saknas)")
        print(f"WS ej skrapade:   {len(ws_queue)}")
        print()

        # Impact: wines that would benefit most from expert data
        # (high crowd score but no expert = big potential improvement)
        no_expert.sort(key=lambda x: -(x['crowd'] or 0))
        print("Top 10 viner som saknar expert (högst crowd-score):")
        for w in no_expert[:10]:
            print(f"  {w['name'][:30]:30s} crowd={w['crowd']:.1f} reviews={w['reviews']:>6d} {w['price']}kr")

        print()
        print(f"Kör: python3 scripts/find_gaps.py --expert  (full lista)")
        print(f"Kör: python3 scripts/find_gaps.py --ws-queue (WS-skraper kö)")

    elif args.vivino:
        print(f"Viner utan Vivino-data ({len(no_vivino)}):")
        for w in no_vivino[:args.top]:
            print(f"  {w['nr']:>8s}  {w['name'][:30]:30s} {w['sub'][:20]:20s} {w['price']}kr")

    elif args.expert:
        no_expert.sort(key=lambda x: -(x['crowd'] or 0))
        print(f"Viner utan expert-data ({len(no_expert)}), sorterat efter crowd-score:")
        for w in no_expert[:args.top]:
            print(f"  {w['nr']:>8s}  {w['name'][:30]:30s} crowd={w['crowd']:.1f} {w['reviews']:>6d} reviews {w['price']}kr")

    elif args.ws_queue:
        ws_queue.sort(key=lambda x: -(x['score'] or 0))
        print(f"WS-skraper kö ({len(ws_queue)} viner, sorterat efter Smakfynd-score):")
        for w in ws_queue[:args.top]:
            print(f"  {w['nr']:>8s}  {w['name'][:30]:30s} score={w['score']} {w['price']}kr")

if __name__ == "__main__":
    main()
