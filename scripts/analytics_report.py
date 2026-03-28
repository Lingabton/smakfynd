#!/usr/bin/env python3
"""Weekly analytics report for Smakfynd. Run: python3 scripts/analytics_report.py"""

import subprocess, json, sys, os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WORKER_DIR = os.path.join(SCRIPT_DIR, "..", "workers", "analytics")
DB = "smakfynd-analytics"

def query(sql):
    r = subprocess.run(
        ["npx", "wrangler", "d1", "execute", DB, "--remote", "--json", "--command", sql],
        capture_output=True, text=True, cwd=WORKER_DIR
    )
    try:
        # --json outputs clean JSON array, but stderr has wrangler warnings
        data = json.loads(r.stdout)
        return data[0]["results"] if data else []
    except:
        # Fallback: try parsing from mixed output
        try:
            start = r.stdout.index('[')
            data = json.loads(r.stdout[start:])
            return data[0]["results"] if data else []
        except:
            return []

def main():
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 7
    since = f"datetime('now', '-{days} days')"

    print(f"\n{'='*50}")
    print(f"  SMAKFYND ANALYTICS — senaste {days} dagar")
    print(f"{'='*50}\n")

    # Sessions & events
    rows = query(f"SELECT COUNT(DISTINCT session) as sessions, COUNT(*) as events FROM events WHERE ts >= {since}")
    if rows:
        print(f"  Sessioner:  {rows[0]['sessions']}")
        print(f"  Events:     {rows[0]['events']}")

    # Device split
    rows = query(f"SELECT device, COUNT(DISTINCT session) as n FROM events WHERE ts >= {since} GROUP BY device ORDER BY n DESC")
    if rows:
        parts = [f"{r['device']}: {r['n']}" for r in rows]
        print(f"  Enheter:    {', '.join(parts)}")

    # Event breakdown
    print(f"\n  Händelser:")
    rows = query(f"SELECT event, COUNT(*) as n FROM events WHERE ts >= {since} GROUP BY event ORDER BY n DESC")
    for r in rows:
        print(f"    {r['event']:20} {r['n']:>5}")

    # Top wines clicked
    print(f"\n  Mest klickade viner:")
    rows = query(f"""
        SELECT json_extract(data, '$.name') as name, json_extract(data, '$.nr') as nr, COUNT(*) as clicks
        FROM events WHERE event='click' AND ts >= {since}
        GROUP BY nr ORDER BY clicks DESC LIMIT 10
    """)
    for i, r in enumerate(rows):
        print(f"    {i+1:2}. {r.get('name', '?'):30} ({r['clicks']} klick)")

    # SB clicks (purchase intent)
    rows = query(f"SELECT COUNT(*) as n FROM events WHERE event='sb_click' AND ts >= {since}")
    if rows:
        print(f"\n  SB-klick (köpintention): {rows[0]['n']}")

    # Searches
    print(f"\n  Populära sökningar:")
    rows = query(f"SELECT query, COUNT(*) as n FROM searches WHERE ts >= {since} GROUP BY query ORDER BY n DESC LIMIT 10")
    for r in rows:
        print(f"    {r['query']:30} ({r['n']}x)")

    # AI usage
    rows = query(f"SELECT COUNT(*) as n FROM ai_logs WHERE ts >= {since}")
    if rows and rows[0]['n'] > 0:
        print(f"\n  AI-matchningar: {rows[0]['n']}")
        meals = query(f"SELECT meal, COUNT(*) as n FROM ai_logs WHERE ts >= {since} GROUP BY meal ORDER BY n DESC LIMIT 5")
        for r in meals:
            print(f"    {r['meal']:30} ({r['n']}x)")

    # Daily trend
    print(f"\n  Daglig trend:")
    rows = query(f"""
        SELECT date(ts) as day, COUNT(DISTINCT session) as sessions, COUNT(*) as events
        FROM events WHERE ts >= {since}
        GROUP BY day ORDER BY day DESC
    """)
    for r in rows:
        bar = "█" * min(r['sessions'], 40)
        print(f"    {r['day']}  {r['sessions']:>4} sessioner  {r['events']:>5} events  {bar}")

    print()

if __name__ == "__main__":
    main()
