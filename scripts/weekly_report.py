#!/usr/bin/env python3
"""
Generate weekly analytics report.
Fetches data from analytics worker and prints summary.
Can be piped to email or saved.

Usage: python3 scripts/weekly_report.py
"""

import json, os, urllib.request
from datetime import datetime

ANALYTICS_URL = "https://smakfynd-analytics.smakfynd.workers.dev"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(SCRIPT_DIR)
DATA_PATH = os.path.join(BASE, "data", "smakfynd_ranked_v2.json")

def fetch_json(url):
    try:
        req = urllib.request.Request(url)
        resp = urllib.request.urlopen(req, timeout=10)
        return json.loads(resp.read())
    except:
        return None

def main():
    now = datetime.now()
    print(f"{'='*50}")
    print(f"SMAKFYND VECKORAPPORT — {now.strftime('%Y-%m-%d')}")
    print(f"{'='*50}\n")

    # Analytics stats
    stats = fetch_json(f"{ANALYTICS_URL}/stats")
    if stats:
        print(f"Events totalt:     {stats.get('total_events', 0)}")
        print(f"Sökningar:         {stats.get('total_searches', 0)}")
        print(f"AI-frågor:         {stats.get('total_ai_queries', 0)}")
        top = stats.get('top_wines_7d', [])
        if top:
            print(f"\nPopuläraste viner (7 dagar):")
            wines = json.load(open(DATA_PATH)) if os.path.exists(DATA_PATH) else []
            wine_names = {str(w.get('nr','')): w.get('name','') for w in wines}
            for w in top[:10]:
                name = wine_names.get(w.get('wine_nr', ''), w.get('wine_nr', ''))
                print(f"  {name[:30]:30s} views={w.get('views',0):>4d} clicks={w.get('clicks',0):>3d} SB={w.get('sb',0):>3d}")
    else:
        print("Kunde inte hämta analytics-data")

    # Top searches
    searches = fetch_json(f"{ANALYTICS_URL}/top-searches")
    if searches and len(searches) > 0:
        print(f"\nVanligaste sökningar (30 dagar):")
        for s in searches[:15]:
            print(f"  \"{s.get('query', '')}\" — {s.get('count', 0)} gånger")

    # AI queries
    ai = fetch_json(f"{ANALYTICS_URL}/ai-queries")
    if ai and len(ai) > 0:
        print(f"\nSenaste AI-frågor:")
        for q in ai[:10]:
            print(f"  \"{q.get('meal', '')}\" → {q.get('mode', '?')} ({q.get('latency_ms', '?')}ms)")

    # Data stats
    print(f"\n{'='*50}")
    print("DATAKVALITET")
    print(f"{'='*50}")
    if os.path.exists(DATA_PATH):
        ranked = json.load(open(DATA_PATH))
        fast = [w for w in ranked if w.get('assortment') == 'Fast sortiment']
        has_expert = sum(1 for w in ranked if w.get('expert_score'))
        print(f"Totalt rankade:    {len(ranked)}")
        print(f"Fast sortiment:    {len(fast)}")
        print(f"Med expert-data:   {has_expert} ({has_expert*100//len(ranked)}%)")

    ws_path = os.path.join(BASE, "data", "winesearcher_cache.json")
    if os.path.exists(ws_path):
        ws = json.load(open(ws_path))
        ws_scores = sum(1 for v in ws.values() if v.get('aggregate_score'))
        ws_errors = sum(1 for v in ws.values() if v.get('_error'))
        print(f"WS cache:          {len(ws)} ({ws_scores} med scores, {ws_errors} errors)")

    print(f"\n{'='*50}")
    print(f"Rapport genererad {now.strftime('%Y-%m-%d %H:%M')}")

if __name__ == "__main__":
    main()
