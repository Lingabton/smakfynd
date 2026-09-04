# Price History Analysis — 2026-09-04

Data: 93 daily snapshots, 2026-04-14 to 2026-09-02, 21,470 unique products.

## 1. How often do prices change?

**71% of wines never changed price** in 140 days. Systembolaget pricing is overwhelmingly stable.

| Changes per product | Count | Share |
|---|---|---|
| 0 (never changed) | 15,260 | 71% |
| 1 change | 4,916 | 23% |
| 2 changes | 1,170 | 5.5% |
| 3+ changes | 111 | 0.5% |

Total price change events: 7,718 across 21,470 products. The median wine changes **zero** times.

## 2. Are the drops real?

**Yes — 91% of drops stick.** Only 9% revert within 30 days.

745 drops of >= 5% occurred. Of those:
- **677 permanent** (91%) — the price fell and stayed down
- **68 reverted** (9%) — returned to within 2% of the original price within 30 days
- **21 products cycled** repeatedly (drop + revert 2+ times) — mostly premium Italian wines (Barolo producers)

**The price-drop feature is not misleading.** The data supports showing drops as genuine savings rather than sale-reversion noise.

### Drop depth

| Depth | Count |
|---|---|
| 5-9% | 223 |
| 10-19% | 194 |
| 20-29% | 100 |
| 30%+ | 228 |

The distribution is bimodal: many small adjustments (5-9%) and many large changes (30%+). The large changes are likely sortiment turnover — a new vintage at a different price point, not a discount on the same product.

## 3. Seasonality

| Month | Price changes | % of catalog |
|---|---|---|
| April | 2 | 0.02% |
| May | 181 | 1.56% |
| June | 568 | **4.91%** |
| July | 310 | 2.77% |
| August | 3 | 0.03% |
| September | 2,857 | **19.88%** |

**September is the dominant event.** 20% of the catalog changes on or around September 1 — this is Systembolaget's annual sortiment change (new products, discontinued products, price adjustments). June's 5% aligns with the summer sortiment launch.

April and August are near-zero — pricing is administratively fixed between sortiment cycles.

**Caveat:** 140 days covers one summer. The Christmas run-up (November–December) and January reset are not in this data. The September spike is one observation, not a proven pattern.

## 4. Package format differences

| Format | Drops (5%+) | Average depth | Median depth |
|---|---|---|---|
| Flaska (750ml) | 262 | 21.2% | 11.8% |
| BiB (box) | 5 | 16.7% | 9.1% |
| Unknown/other | 478 | 28.0% | 20.1% |

Box wines almost never change price (only 5 drops in 140 days). This makes sense — BiB is Systembolaget's most price-competitive segment and margins are already thin. The "unknown" category includes products not in the scored corpus and likely contains the September sortiment churn.

## 5. What is publishable

These findings could become content:

1. **"71% av vinerna ändrar aldrig pris"** — counter-intuitive for a consumer who assumes Systembolaget adjusts prices regularly. Newsletter angle.
2. **"91% av prissänkningarna är permanenta"** — trust-building for the prissänkt feature. Suitable for the methodology page.
3. **"September 1 — den dag 20% av sortimentet förändras"** — seasonal content for August, timed to when people should check the new listings.
4. **"Boxvin: billigt och stabilt"** — reinforces the value proposition for BiB, which is under-covered and under-appreciated in Swedish wine writing.

## 6. What is sellable

For suppliers/importers:

1. **Competitor price movements** — which rival wines changed price, when, and by how much. Systembolaget's Leverantörsportal anonymises competitors; this data does not.
2. **Category price trajectory** — is the 100-150 kr red segment getting more or less competitive? Quarterly trend data.
3. **Price positioning** — where a supplier's product sits relative to the median for its category × price band, and whether that position has shifted.
4. **Drop timing** — when competitors discount, and whether those discounts stick or revert (the cycling analysis).
5. **September exposure** — a supplier knowing which competitors are entering or exiting the sortiment on September 1, priced how, is commercially valuable intelligence.

## Caveats

- **140 days is one summer.** Patterns may not hold. The Christmas/New Year cycle is not observed.
- **Sortiment changes conflate with price changes.** A new vintage at a different price looks identical to a price cut on the same wine. Without vintage-level tracking, these are indistinguishable.
- **Ordervaror pricing** may follow different patterns than Fast sortiment. The data doesn't separate them clearly because most Ordervaror are in the "unknown" category.
- **No volume data.** A price drop on a wine that nobody buys is not commercially interesting. We have no sell-through information.
