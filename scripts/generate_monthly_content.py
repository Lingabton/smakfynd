#!/usr/bin/env python3
"""
Generate monthly content: Gabriels val + Substack article draft.
Picks top wines based on data, generates personal-sounding descriptions.
Run: python3 scripts/generate_monthly_content.py

Creates:
  - scripts/gabriels_val.py (updated PICKS)
  - content/substack-{month}-{year}.md
  - docs/gabriels-val-{month}-{year}/index.html
"""

import json, os, sys
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(SCRIPT_DIR)
DATA_PATH = os.path.join(BASE, "data", "smakfynd_ranked_v2.json")

NOW = datetime.now()
MONTH_SV = ['januari','februari','mars','april','maj','juni',
            'juli','augusti','september','oktober','november','december'][NOW.month - 1]
YEAR = NOW.year

all_wines = json.load(open(DATA_PATH))
fast = [w for w in all_wines if w.get('assortment') == 'Fast sortiment' and w.get('pkg') == 'Flaska']

def pick_wines():
    """Select 5 wines across different categories for Gabriels val."""
    picks = []
    used_nrs = set()

    # 1. Best budget red (under 100kr, highest score)
    budget_reds = sorted(
        [w for w in fast if w.get('type') == 'Rött' and (w.get('price',999)) < 100],
        key=lambda x: -x.get('smakfynd_score', 0)
    )
    if budget_reds:
        w = budget_reds[0]
        picks.append({
            "nr": str(w['nr']), "category": "Bästa köp under 100 kr",
            "auto_note": f"En {w.get('grape','')} från {w.get('country','')} till {w.get('price',0)} kr. "
                        f"Crowd-betyg: {w.get('crowd_score',0)}/10 från {w.get('crowd_reviews',0)} omdömen."
                        + (f" Expert: {w.get('expert_score',0)}/10." if w.get('expert_score') else ""),
        })
        used_nrs.add(str(w['nr']))

    # 2. Best value red (100-200kr, best expert score)
    mid_reds = sorted(
        [w for w in fast if w.get('type') == 'Rött' and 100 <= (w.get('price',0) or 0) < 200
         and str(w.get('nr','')) not in used_nrs and w.get('expert_score')],
        key=lambda x: -((x.get('expert_score') or 0) + (x.get('crowd_score') or 0))
    )
    if mid_reds:
        w = mid_reds[0]
        picks.append({
            "nr": str(w['nr']), "category": "Bäst i mellanklass",
            "auto_note": f"{w.get('grape','')} från {w.get('country','')}, {w.get('region','')}. "
                        f"Experterna ger {w.get('expert_score',0)}/10 och crowd {w.get('crowd_score',0)}/10.",
        })
        used_nrs.add(str(w['nr']))

    # 3. Best white
    whites = sorted(
        [w for w in fast if w.get('type') == 'Vitt' and str(w.get('nr','')) not in used_nrs],
        key=lambda x: -x.get('smakfynd_score', 0)
    )
    if whites:
        w = whites[0]
        picks.append({
            "nr": str(w['nr']), "category": "Bästa vita just nu",
            "auto_note": f"{w.get('grape','')} från {w.get('country','')} till {w.get('price',0)} kr. "
                        + (f"Smakprofil: {w.get('style','')[:80]}." if w.get('style') else ""),
        })
        used_nrs.add(str(w['nr']))

    # 4. Best bubbel
    bubbel = sorted(
        [w for w in fast if w.get('type') == 'Mousserande' and str(w.get('nr','')) not in used_nrs],
        key=lambda x: -x.get('smakfynd_score', 0)
    )
    if bubbel:
        w = bubbel[0]
        picks.append({
            "nr": str(w['nr']), "category": "Bubbel-favorit",
            "auto_note": f"Från {w.get('country','')} till {w.get('price',0)} kr. "
                        f"{w.get('crowd_reviews',0)} har betygsatt den.",
        })
        used_nrs.add(str(w['nr']))

    # 5. Dark horse / surprise pick (highest score among less-known wines)
    surprise = sorted(
        [w for w in fast if str(w.get('nr','')) not in used_nrs
         and (w.get('crowd_reviews',0) or 0) < 5000
         and w.get('smakfynd_score',0) >= 75],
        key=lambda x: -x.get('smakfynd_score', 0)
    )
    if surprise:
        w = surprise[0]
        picks.append({
            "nr": str(w['nr']), "category": "Dold pärla",
            "auto_note": f"{w.get('name','')} {w.get('sub','')} — {w.get('grape','')} från {w.get('country','')}, {w.get('price',0)} kr. "
                        f"Få har hittat den ännu ({w.get('crowd_reviews',0)} omdömen) men poängen talar för sig.",
        })

    return picks

def generate_substack(picks, wines_by_nr):
    """Generate Substack article markdown."""
    lines = [
        f"# Bästa vinköpen på Systembolaget — {MONTH_SV} {YEAR}",
        "",
        f"*Av Gabriel Linton, grundare av [Smakfynd](https://smakfynd.se)*",
        "",
        f"Varje vecka analyserar vi {len(all_wines)} viner på Systembolaget och rankar dem efter kvalitet per krona. Här är {MONTH_SV}s bästa fynd.",
        "",
    ]

    for pick in picks:
        w = wines_by_nr.get(pick['nr'], {})
        lines.extend([
            f"## {pick['category']}: {w.get('name','')} {w.get('sub','')} — {w.get('price',0)} kr",
            "",
            f"Smakfynd-poäng: **{w.get('smakfynd_score',0)}/100**",
            "",
            f"{pick['auto_note']}",
            "",
            f"[Se detaljer →](https://smakfynd.se/#vin/{pick['nr']})",
            "",
            "---",
            "",
        ])

    lines.extend([
        f"## Gabriels val — {MONTH_SV} {YEAR}",
        "",
        f"Jag har också handplockat 5 viner jag personligen testat och gillar.",
        f"[Läs hela listan →](https://smakfynd.se/gabriels-val-{MONTH_SV}-{YEAR}/)",
        "",
        "---",
        "",
        f"*Smakfynd rankar {len(all_wines)} viner efter kvalitet per krona.*",
        "",
        f"[Besök Smakfynd →](https://smakfynd.se) | [Under 100 kr →](https://smakfynd.se/vin-under-100-kr/)",
    ])

    return '\n'.join(lines)

def main():
    wines_by_nr = {str(w.get('nr','')): w for w in all_wines}
    picks = pick_wines()

    print(f"Gabriels val — {MONTH_SV} {YEAR}")
    print(f"{'='*50}")
    for i, pick in enumerate(picks):
        w = wines_by_nr.get(pick['nr'], {})
        print(f"  {i+1}. [{pick['category']}] {w.get('name','')} {w.get('sub','')} — {w.get('price',0)} kr (score: {w.get('smakfynd_score',0)})")
        print(f"     {pick['auto_note'][:80]}...")
    print()

    # Generate Substack article
    article = generate_substack(picks, wines_by_nr)
    article_path = os.path.join(BASE, "content", f"substack-{MONTH_SV}-{YEAR}.md")
    with open(article_path, 'w') as f:
        f.write(article)
    print(f"Substack draft: {article_path}")

    # Update gabriels_val.py PICKS
    picks_for_gv = []
    for pick in picks:
        w = wines_by_nr.get(pick['nr'], {})
        picks_for_gv.append({
            "nr": pick['nr'],
            "category": pick['category'],
            "note": pick['auto_note'] + " [REDIGERA: Lägg till din personliga kommentar här]",
        })

    # Write picks as JSON for easy review
    review_path = os.path.join(BASE, "content", f"picks-{MONTH_SV}-{YEAR}.json")
    with open(review_path, 'w') as f:
        json.dump({
            "month": MONTH_SV,
            "year": YEAR,
            "picks": picks_for_gv,
            "wines": {p['nr']: {
                "name": wines_by_nr.get(p['nr'],{}).get('name',''),
                "sub": wines_by_nr.get(p['nr'],{}).get('sub',''),
                "price": wines_by_nr.get(p['nr'],{}).get('price',0),
                "score": wines_by_nr.get(p['nr'],{}).get('smakfynd_score',0),
                "country": wines_by_nr.get(p['nr'],{}).get('country',''),
                "grape": wines_by_nr.get(p['nr'],{}).get('grape',''),
            } for p in picks_for_gv},
        }, f, ensure_ascii=False, indent=2)
    print(f"Review file: {review_path}")
    print()
    print("NÄSTA STEG:")
    print("  1. Granska picks i content/picks-*.json")
    print("  2. Redigera personliga noter")
    print("  3. Uppdatera scripts/gabriels_val.py med dina noter")
    print("  4. Kör: python3 scripts/gabriels_val.py")
    print("  5. Publicera Substack-artikeln")

if __name__ == "__main__":
    main()
