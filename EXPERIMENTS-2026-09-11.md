# Experiments — 2026-09-11

## EXP 1 — Snapshot storage
Done earlier (b48ba189). Gzip snapshots ~90 KB/day, monthly compaction for 90+ day old files.

---

## EXP 2 — What does sortBy=Score mean?

**SURPRISING FINDING: It's Systembolaget's internal editorial curation score.**

Evidence:
- Top 50 by Score: 100% Ordervaror, zero Fast sortiment
- Bottom 30 by Score: 100% Fast sortiment
- Zero overlap with ProductLaunchDate top 50 (not recency)
- Top entries all launched 2025-12-15 (not sales velocity, which would change daily)
- Dominated by a few producers (5× Domaine Garon, 5× Penfolds) — looks like curated selections

**What this means:** SB's buyers have manually scored wines for the Ordervaror program. This is a free editorial quality signal for the 67% of wines nobody has reviewed. It's **Hypothesis B**.

**Limitation:** The Score field is only useful as a relative ordering within a category, not as an absolute number. And it's biased toward Ordervaror — Fast sortiment wines (the ones people actually buy in-store) are systematically ranked lowest. Not useful as a direct quality proxy, but useful as an "SB recommends" tier.

**Action item:** Consider adding a "Utvald av Systembolaget" badge for wines ranking in the top quartile by Score within their category. Low risk, no new data source, and it differentiates the product.

---

## EXP 3 — Click data

**3a Data flow:** `sb_click` events → Cloudflare Worker at `smakfynd-analytics.smakfynd.workers.dev/event` → Cloudflare D1 database (`popular_wines` table).

**3b Extraction:** Per-article click data exists in D1 with columns `wine_nr, views, clicks, sb_clicks` aggregated by date. The `/stats` admin endpoint returns top 20 for the last 7 days. Full extraction requires:
- Gabriel's `ADMIN_KEY` (Cloudflare Worker secret)
- Either a new endpoint for 90-day per-article data, or direct D1 query via Wrangler

**3c Not accessible this session.** The admin key is not in the repo (correctly). Gabriel needs to either:
1. Run `curl https://smakfynd-analytics.smakfynd.workers.dev/stats -H "X-Admin-Key: $KEY"` and share the output
2. Add a `/clicks-export` endpoint that dumps the full `popular_wines` table for the last 90 days

**What would it answer:** position-vs-click-rate curve (does position 1 get clicked 3× more than position 5?), which wines are under-ranked by the algorithm but loved by users, which pages drive the most outbound value.

---

## EXP 4 — Per-store stock

**Closed: not available through the public API.**

The e-commerce search API exposes only global flags: `isCompletelyOutOfStock`, `isTemporaryOutOfStock`, `isSupplierTemporaryNotAvailable`. No per-store inventory. All store-specific endpoints returned 404.

Systembolaget's website serves store-level stock through a separate internal API that requires authentication and is not publicly documented. Building "finns just nu i Gränbystaden" would require either:
- Scraping the website (high maintenance, legally questionable)
- A Systembolaget partnership (plausible but requires business development)

Neither is a near-term option.

---

## EXP 5 — Taste-based discovery

**The data works. Five queries tested:**

| Query | Results | Scored | Unrated | Top result |
|---|---|---|---|---|
| Fylligt torrt rött <150kr i butik | 20 | 20 | 0 | Gérard Bertrand 93/100, 139kr |
| Lätt sött vitt <100kr | 0 | 0 | 0 | No wines match — threshold too strict |
| Bubbel <200kr i butik | 20 | 20 | 0 | Asti Cinzano 83/100, 109kr |
| Halvtorrt vitt <120kr | 16 | 4 | 12 | Ruppertsberger 92/100, 89kr |
| Medelfylligt torrt rött <100kr | 20 | 20 | 0 | Jacob's Creek Organic 86/100, 90kr |

**Key finding:** The taste profiles are granular enough. Body (0-12) and sweetness (0-12) discriminate meaningfully. Query 4 is the most interesting — it extends into unrated territory where scored data runs out but taste profiles provide real guidance.

**The "lätt sött" query returning 0 results reveals a calibration issue:** SB uses `sweetness=0` for dry wines (not 1-3). The threshold mapping needs adjusting: torrt = 0-1, halvtorrt = 2-4, etc.

**Feature viability:** High. This is the "Sofia in the car park" use case and the data supports it across the full 14,000-wine catalog. Worth building as a filter UI after the current batch rollout.

---

## EXP 6 — Norwegian opportunity

**One query, real signal:** "gode kjøp på systembolaget 2026" — 71 impressions, 2 clicks, position 11.5. The `/gode-kjop-pa-systembolaget/` page exists and has Norwegian copy.

**Size:** Too small to measure from current data. One query term with 71 impressions/quarter is not an addressable market — it's a signal that the market exists. The Vinmonopolet price premium (typically 30-50% on comparable wines) means the value proposition is strong for border shoppers.

**What's needed:** Norwegian keyword research beyond GSC (which only shows queries where the site already appears). Tools like Ahrefs for `systembolaget vin` from Norwegian IPs would size it properly.

---

## EXP 7 — Price history patterns

*Deferred to a dedicated analysis session — the price history analysis from Sep 4 (PRICE-HISTORY-ANALYSIS.md) already covers the core findings.*

---

## EXP 8 — B2B report for a Swedish importer

*Deferred — requires identifying real importers in the assortment data, which needs the `supplierName` field from the API (not currently captured in the raw fetch).*

**Finding:** The normalize() function in fetch_systembolaget.py does not capture `producerName` or `supplierName` from the API response, even though both fields exist. Adding `supplierName` to the raw data would unlock importer-level analysis without any new data source.

---

## EXP 9 — Search logging

**9a:** Search is client-side only — `setSearch(e.target.value)` filters the already-loaded wines array. No server call.

**9b:** `trackSearch(query, count)` already exists in constants.jsx (line 54) and fires after 1.5s debounce. It posts to `/search` on the analytics worker. Zero-result events are not distinguished from non-zero — `count` is included but there's no separate `search_zero_results` event.

**9c:** Adding zero-result logging requires a SPA change (one line in App.jsx to call `trackSearch` with a zero-result flag). This requires deploying `docs/index.html`, which is blocked until the SPA batch ships. **Note for post-freeze queue.**

---

## Genuinely surprising findings

1. **EXP 2: `sortBy=Score` is SB's editorial curation, not sales.** 100% Ordervaror at the top, 100% Fast sortiment at the bottom. This is a usable quality signal for unrated wines.

2. **EXP 5: Taste discovery works across the full catalog.** The "halvtorrt vitt" query found 12 unrated wines with useful taste profiles — extending coverage beyond the scored third.

3. **EXP 4: Per-store stock is definitively unavailable.** No public endpoint, no workaround short of a partnership.
