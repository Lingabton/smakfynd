# Tryffelsvinet AB — Supplier Intelligence Report

Generated: 2026-09-11
Source: Systembolaget public API + Smakfynd scoring pipeline
Period: 2026-04-14 to 2026-09-11 (150 days price history)

## Portfolio Summary

- **414 red wine articles** (largest single supplier in Rött vin)
- 143 articles scored by Smakfynd (35% coverage)
- 271 articles unscored (lacking sufficient crowd or expert reviews)
- Price range: 89 kr to 16,000+ kr
- Assortment: predominantly Ordervaror

## Top 10 Performers (by Smakfynd score)

| Nr | Wine | Price | Score | Expert | Category rank |
|---|---|---|---|---|---|
| 9046701 | Pauillac de Latour | 1,099 kr | 86 | 9.1 | Top 2% (400+ kr) |
| 8308306 | Pauillac de Latour (äldre) | 2,399 kr | 84 | 9.1 | Top 3% |
| 7250101 | Tempo d'Angélus | 329 kr | 83 | 7.6 | Top 5% (200-400 kr) |
| 7190101 | Paolo Scavino Langhe | 279 kr | 83 | 8.2 | Top 5% |
| 7844201 | Simonsig Labyrinth | 239 kr | 82 | 7.9 | Top 6% |
| 7926301 | Brunello Pianrosso | 599 kr | 81 | 7.0 | Top 7% |
| 7110702 | Pauillac de Latour | 649 kr | 81 | 9.1 | Top 7% |
| 9023401 | Barolo Riserva Rocche | 2,399 kr | 76 | 8.8 | Top 12% |
| 7829706 | Barolo Riserva Rocche | 4,499 kr | 76 | 8.8 | Top 12% |
| 7188001 | Campo Eliseo | 529 kr | 81 | 8.5 | Top 7% |

## The gap: 271 unscored articles

65% of Tryffelsvinet's portfolio cannot be ranked because the wines lack sufficient crowd reviews or expert scores. These are predominantly:
- Italian fine wines (Barolo, Brunello, Amarone) from small producers
- French prestige cuvées in the 500-5,000 kr range
- Portuguese and Spanish specialties

This is a **data problem, not a quality problem**. Many of these wines are likely excellent — they simply aren't reviewed on the platforms we aggregate.

## Competitive intelligence

[Requires price history cross-reference — available in full report]

Key observations from the Rött vin 200-400 kr segment where Tryffelsvinet competes:
- 772 competing articles in this price band
- Tryffelsvinet's top article (Tempo d'Angélus, 329 kr, score 83) ranks #65 — top 9%
- Paolo Scavino at 279 kr and score 83 ranks similarly

## Smakfynd list appearances

Most Tryffelsvinet articles do not appear on curated list pages because:
1. They are Ordervaror (hidden by the in-store default filter)
2. Most lack the reviews needed for a Smakfynd score

Only the Pauillac de Latour articles and a handful of other scored wines appear on lists like `/basta-vin-fran-bordeaux/` and `/basta-premium-vin/`.

## What this report could not produce

1. **Per-article outbound click volume** — requires Cloudflare D1 admin access
2. **Sell-through or stock data** — not available via public API
3. **Competitor price movements** — requires cross-referencing with price history (available, not computed in this version)
4. **Vintage-level performance** — tracked by article number, not vintage

---

## Cold email

> Hej [namn],
>
> Vi har analyserat Tryffelsvinet:s 414 rödvinsartiklar på Systembolaget. Av dem kan vi bara betygsätta 143 — de övriga 271 saknar tillräckligt med recensionsdata, trots att flera (som era Barolo- och Brunello-producenter) sannolikt hör till sortimentets bästa. Er Pauillac de Latour rankar topp 2% i sin prisklass, men 65% av portföljen är osynlig för den prismedvetna köparen.
>
> Vi bygger verktyg som hjälper importörer förstå var deras viner står — mot konkurrenterna, mot prisförändringarna och mot konsumenternas sökbeteende. Vill du se hela rapporten?
>
> Gabriel Linton, Smakfynd / Olav Innovation AB

## The one surprising insight

**65% of Tryffelsvinet's portfolio is invisible to value-seeking consumers.** Not because the wines are bad, but because the review ecosystem hasn't reached them. A 4,499 kr Barolo Riserva from Rocche dell'Annunziata has no crowd rating — nobody on Vivino has reviewed it enough times. Tryffelsvinet is importing some of the finest Italian and French wines in the Swedish market, and the algorithmic recommendation layer that drives modern wine discovery cannot see them.

This is the gap a supplier-facing product fills: visibility for wines that deserve it but don't get it through the crowd-rating channels.
