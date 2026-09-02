# Page Census — 2026-09-02 (post Sprint 1 fixes)

Sorted by GSC impressions (Mar 31 – Jun 30 2026). "Before" = currently deployed on origin/main. "After" = new build with Name sort + Sprint 1 fixes (4,362-wine corpus, small-format exclusion, Norwegian removal, dynamic counts).

## Top traffic pages

| Page | Impressions | Clicks | Before | After | D | Status |
|---|---|---|---|---|---|---|
| /basta-bubbel/ | 2,801 | 264 | 20 | 20 | 0 | stable |
| /basta-rose/ | 1,923 | 95 | 20 | 20 | 0 | stable |
| /basta-vita-vin/ | 1,399 | 85 | 20 | 20 | 0 | stable |
| /basta-boxvin/ | 909 | 38 | 20 | 20 | 0 | stable |
| /champagne-under-300-kr/ | 644 | 23 | 4 | **0** | -4 | **ZERO — needs attention** |
| /vin-under-100-kr/ | 530 | 25 | 20 | 20 | 0 | stable |
| /basta-roda-vin/ | 499 | 43 | 20 | 20 | 0 | stable |
| /basta-cava/ | 483 | 24 | 7 | 7 | 0 | stable |
| /vin-under-150-kr/ | 359 | 21 | 20 | 20 | 0 | stable |
| /basta-malbec/ | 182 | 10 | 17 | 16 | -1 | minor |

## Champagne-under-300 — editorial decision needed

This page went from 4 wines to 0 after the small-format exclusion (S1-1). The 4 wines on the deployed page include 2 at 375ml (Palmer & Co 239kr, Bonnet 255kr). After removing those, only 2 remain — below the MIN_PAGE_WINES=3 threshold.

The page has 644 impressions and 23 clicks. It is now noindex. Options:
1. Relax to include all standard formats >= 375ml on this specific page (champagne half-bottles are a legitimate product)
2. Wait for the full corpus to include more qualifying wines (the Name sort recovery may have added champagnes)
3. Retire the page

Currently: page is written with 0 wines and noindex. It will not appear in search results.

## Pages with large gains (>5 wines)

| Page | Before | After | D |
|---|---|---|---|
| /basta-vin-fran-toscana/ | 3 | 20 | +17 |
| /basta-vin-fran-rioja/ | 3 | 17 | +14 |
| /basta-vin-fran-bordeaux/ | 5 | 16 | +11 |
| /vin-present/ | 8 | 18 | +10 |
| /basta-argentinska-vin/ | 4 | 13 | +9 |
| /basta-australiska-vin/ | 11 | 20 | +9 |
| /vin-till-svarforaldrar/ | 6 | 15 | +9 |
| /basta-portugisiska-vin/ | 8 | 16 | +8 |
| /naturvin/ | 1 | 6 | +5 |

## Pages with losses

| Page | Before | After | D |
|---|---|---|---|
| /champagne-under-300-kr/ | 4 | 0 | -4 (small-format exclusion) |
| /basta-zinfandel/ | 10 | 7 | -3 |
| /basta-grenache/ | 10 | 9 | -1 |
| /basta-malbec/ | 17 | 16 | -1 |

## Summary

- 101 landing pages total
- 71 pages unchanged
- 18 pages gained wines
- 4 pages lost wines (1 to zero)
- 1 page at zero: /champagne-under-300-kr/ (noindex applied)
- No other page dropped below threshold or lost more than half

## Allowlist mechanism ready

`DEPLOY_PAGES` env var limits which pages are written. Proposed batch 1:

```bash
DEPLOY_PAGES="champagne-under-300-kr,vin-under-80-kr,vin-under-90-kr,vin-under-100-kr,basta-rose-under-100-kr" python3 scripts/generate_landing_pages.py
```
