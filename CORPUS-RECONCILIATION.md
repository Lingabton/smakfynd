# Corpus Reconciliation — 2026-09-02

## Pipeline step-by-step

| Step | Count | Rule | Notes |
|---|---|---|---|
| SB raw fetch (Name sort, 2-pass) | 14,368 | Two-pass Name/Asc + Name/Desc union | Was 11,498 under Score sort (77% of catalog) |
| After cat1=Vin filter | 14,368 | All products are wine (cat1=Vin) | No non-wine products in this fetch |
| After scoring | 4,786 | 25+ crowd reviews OR expert score | Vivino: 1,231 matched, WE expert: 4,411 matched, both: 856 |
| After large-format filter | 4,632 | Remove large/BiB when standard bottle exists | -154 |
| After name+sub deduplication | 4,362 | Keep highest-scored when name+sub identical | -270 |
| **Slim output (wines.json)** | **4,362** | | |

## Why 14,368 raw becomes 4,362 slim

The biggest filter is scoring: 14,368 - 4,786 = **9,582 wines** have neither 25+ Vivino reviews nor a Wine Enthusiast expert score. These are mostly:
- Ordervaror (order-only wines) with no public ratings
- Wines too obscure for Vivino crowd coverage
- New arrivals not yet in the expert cache

The 424 lost in dedup/format filtering are standard cleanup — duplicate names from different vintages and BiB versions where a bottle exists.

## The number the site should publish

**4,362 wines.** This is the count of wines with sufficient evidence to score, after deduplication. It is the number visible to users.

Previous locked constant was 4,143 (set before Name sort recovered the full catalog). The increase is real — 219 additional wines now qualify because the fetch recovered products that Score sort was missing.

## LOCKED_CORPUS_COUNT update

- Old: 4,143
- New: 4,362
- Reason: Name sort recovers full SB catalog (14,368 vs 11,498 under Score sort), increasing scored wines from ~3,500 to 4,786 and slim output from ~3,500 to 4,362
