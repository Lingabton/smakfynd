# Page Census — 2026-09-02 (post in-store default)

"Before" = currently deployed on origin/main. "After" = new build with in-store default + Sprint 1 fixes + alternatives.

## Top traffic pages

| Page | Impressions | Clicks | Before | After | D | Status |
|---|---|---|---|---|---|---|
| /basta-bubbel/ | 2,801 | 264 | 20 | 20 | 0 | stable |
| /basta-rose/ | 1,923 | 95 | 20 | 20 | 0 | stable |
| /basta-vita-vin/ | 1,399 | 85 | 20 | 20 | 0 | stable |
| /basta-boxvin/ | 909 | 38 | 20 | 20 | 0 | stable |
| /champagne-under-300-kr/ | 644 | 23 | 4 | **10** | +6 | alternatives |
| /vin-under-100-kr/ | 530 | 25 | 20 | 20 | 0 | stable |
| /basta-roda-vin/ | 499 | 43 | 20 | 20 | 0 | stable |
| /basta-cava/ | 483 | 24 | 7 | 9 | +2 | gain |
| /vin-under-150-kr/ | 359 | 21 | 20 | 20 | 0 | stable |
| /basta-malbec/ | 182 | 10 | 17 | 20 | +3 | gain |

## Pages under 20 wines (flagged)

| Page | Before | After | Notes |
|---|---|---|---|
| /vin-under-80-kr/ | 20 | **16** | In-store filter + vol exclusion. fix_count handles title |
| /champagne-under-500-kr/ | 16 | **13** | In-store filter removed some Ordervaror |
| /basta-rose-under-100-kr/ | 13 | **10** | In-store + vol filter |
| /basta-carmenere/ | 4 | 4 | Niche grape, stable |
| /basta-provence-rose/ | 9 | 10 | Slight gain |
| /basta-cremant/ | 10 | 11 | Slight gain |
| /naturvin/ | 1 | **14** | Major gain from Tillfälligt sortiment inclusion |

## Pages with losses (3 total)

| Page | Before | After | D | Reason |
|---|---|---|---|---|
| /vin-under-80-kr/ | 20 | 16 | -4 | Small format + in-store filter |
| /champagne-under-500-kr/ | 16 | 13 | -3 | In-store filter |
| /basta-rose-under-100-kr/ | 13 | 10 | -3 | Small format + in-store filter |

## Pages with large gains (32 gained)

The in-store default with Tillfälligt sortiment expanded most pages. Key winners:

| Page | Before | After | D |
|---|---|---|---|
| /basta-vin-fran-rhonedalen/ | 1 | 19 | +18 |
| /basta-vin-fran-toscana/ | 3 | 20 | +17 |
| /basta-vin-fran-rioja/ | 3 | 20 | +17 |
| /naturvin/ | 1 | 14 | +13 |
| /basta-vin-fran-bordeaux/ | 5 | 20 | +15 |

## Summary

- 101 landing pages total
- 66 pages stable
- 32 pages gained wines
- 3 pages lost wines (small format + in-store filtering)
- No page at zero
- champagne-under-300 now has 10 wines via alternatives mechanism (0 primary + 10 alt)

## Allowlist ready

Batch 1 (moved champagne to batch 2 per instructions):
```
vin-under-80-kr,vin-under-90-kr,vin-under-100-kr,basta-rose-under-100-kr
```

Batch 2 (needs Gabriel's champagne intro):
```
champagne-under-300-kr,basta-bubbel,basta-roda-vin,basta-vita-vin,basta-rose
```
