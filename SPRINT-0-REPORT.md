# Sprint 0 Report — 2026-08-18

Read-only diagnostic. No production changes.

---

## S0-1: Volume Normalisation Audit

### Answer: The value score IS volume-normalised. The page filters are NOT.

**Value computation** (`score_wines_v2.py:140`):
```python
liter_price = price / (vol / 1000)
tier_ratio = liter_price / (tier_med or cat_median)
```
Price score correctly uses liter price. A 200ml piccolo at 179 kr computes as 895 kr/L.

**Page filters** (`generate_landing_pages.py`):
```python
w.get('price', 999) < 100   # absolute price, not normalised
```
The filters use absolute price. A 200ml Moët at 179 kr passes the `< 300 kr` champagne filter even though it's 895 kr/L.

### The 4 flagged article numbers

| Article | Wine | Price | Volume | Liter price | Score |
|---------|------|-------|--------|-------------|-------|
| 768602 | André Clouet Grande Réserve | 219 kr | **375 ml** | 584 kr/L | 46 |
| 737202 | Palmer & Co La Réserve Brut | 239 kr | **375 ml** | 637 kr/L | 28 |
| 747102 | Bonnet Perle Rosée Brut | 255 kr | **375 ml** | 680 kr/L | 26 |
| 751804 | Moët & Chandon Brut Impérial | 179 kr | **200 ml** | 895 kr/L | 25 |

All four are half-bottles or piccolos appearing on the "champagne under 300 kr" page. None are 750ml bottles.

### Volume distribution across all 5,043 ranked wines

| Volume | Count | % |
|--------|-------|---|
| 750 ml | 4,352 | 86.3% |
| 1500 ml | 198 | 3.9% |
| 375 ml | 184 | 3.6% |
| 3000 ml | 122 | 2.4% |
| 1000 ml | 55 | 1.1% |
| Other (<500ml) | 132 | 2.6% |

**691 wines (13.7%) are non-standard volume.**

### Affected entries per price-threshold page

| Page | Total wines | Non-750ml | % affected |
|------|-------------|-----------|------------|
| vin-under-80-kr | 167 | **109** | **65%** |
| vin-under-90-kr | 283 | **131** | **46%** |
| vin-under-100-kr | 497 | **169** | **34%** |
| vin-under-150-kr | 1,132 | 212 | 19% |
| vin-under-200-kr | 1,888 | 262 | 14% |
| champagne-under-300 | 22 champagnes | **16** | **73%** |

**The under-80 and under-90 pages are majority non-750ml wines.** The champagne-under-300 page is 73% half-bottles and piccolos.

### Conclusion

**S1-1 (volume normalisation on page filters) is the top priority.** The core positioning — "best wine at each price point" — is compromised when a 200ml piccolo and a 750ml bottle compete on the same price page. Options:
- A: Filter to 750ml only on price pages
- B: Normalise to 750ml-equivalent price (e.g., 179 kr × 750/200 = 671 kr equiv.)
- C: Show volume prominently and let users decide

**Decision needed: → D-vol**

---

## S0-2: Index Status Audit (Code-Side)

### What I can verify from code:

| Check | Result |
|-------|--------|
| robots.txt | Clean. Allows all, blocks wines.json/sw.js/admin/. Sitemap referenced. |
| Sitemap vs pages | 101 sitemap URLs, 101 actual pages. Only `/integritet/` missing from sitemap (acceptable). |
| Canonical tags | All 10 sampled pages have correct canonical URLs. No self-referencing issues. |
| noindex tags | Only `/admin/` has noindex. Correct. |
| meta robots | Most pages have no explicit meta robots (defaults to index,follow). Monthly/editorial pages have explicit `index, follow`. |
| Manual actions | **Cannot check — requires GSC browser login.** |
| Googlebot crawl logs | **Cannot check — requires Cloudflare dashboard.** |
| URL Inspection | **Cannot check — requires GSC browser login.** |
| Page Indexing report | **Cannot check — requires GSC browser login.** |

### What you need to do manually:

1. Open GSC → Page Indexing → export by reason
2. URL Inspection on 10 URLs (3 top performers, 3 zero-click, 2 occasion, homepage, 1 post-June)
3. Check Manual Actions tab
4. Check Security Issues tab
5. If Cloudflare analytics retained: Googlebot request volume 25 May – 30 Jun

---

## S0-3: Corpus Count Reconciliation

### The four populations

| # | Number | Source | Definition |
|---|--------|--------|------------|
| 1 | **12,538** | `systembolaget_raw.json` | Everything from SB API (all categories, all assortments, all volumes) |
| 2 | **5,043** | `smakfynd_ranked_v2.json` | After scoring pipeline: SB products matched to Vivino/expert, scored, sorted. Includes all volumes and packages. |
| 3 | **3,333** | `docs/wines.json` | After build_slim.py: QA-cleaned, large-format-filtered, deduplicated. This is what users actually see. |
| 4 | **~978** | Fast sortiment subset | When "Bara butikssortiment" toggle is on (default off) |

### What drops at each stage

**12,538 → 5,043** (score_wines_v2.py): Non-wine products, beers, spirits, ciders filtered out. Only wine categories scored.

**5,043 → 3,333** (build_slim.py):
- Large format filtered: 31 (standard bottle exists for same wine)
- Dedup: ~301 exact duplicates
- QA (no name/score/price): 1
- **Remaining 1,814 standard 750ml bottles dropped**: These are likely wines that failed the score threshold or assortment filter in build_slim. Need to verify exact filter.

### What the site says

- Homepage: **"5,043 viner"** (from `len(ranked)`)
- Landing pages: **"Baserat på 3,721 viner"** (from `len(wines)` at generation time — different from current 3,333)
- These numbers are inconsistent and neither represents what users can browse (3,333)

### Recommendation

Publish **one number**: the count from `wines.json` (currently 3,333). This is what users can actually filter, search, and browse. Using the scored count (5,043) is misleading when 1,710 of those wines are invisible to users.

---

## S0-4: Data Provenance Audit

### Source table

| Source | Data | How obtained | Volume | Terms/Licensing | Public claim |
|--------|------|-------------|--------|----------------|--------------|
| **Systembolaget** | Product catalog, prices, volumes, assortment | Public API (`api-extern.systembolaget.se`) with hardcoded subscription key | 12,538 products | Public API, no ToS violation apparent. Key is a public demo key. | "Priser från Systembolaget" |
| **Vivino** | Crowd ratings (1-5 scale), review counts | **Playwright browser automation** (headless scraping). Scripts gitignored. Cache committed. | 12,184 cached, 1,527 with ratings | **No API license. Scraped via headless browser.** Vivino ToS likely prohibits automated access. | "Crowd-betyg från Vivino" — explicitly names Vivino |
| **Wine Enthusiast** (Kaggle) | Expert scores (0-100) | **Kaggle dataset** (`expert_cache.json`, 5,107 entries). One-time download, matched by name. | 5,107 wines | Kaggle dataset, likely academic/personal use. WE may have IP claims on scores. | "Expertbetyg" — does not name WE specifically in UI |
| **WineSearcher critics** | Multi-critic scores (Suckling, Decanter, Falstaff, etc.) | **HTTP scraping** (`ws_http_cache.json`, 19 entries). Also `ws_critics_raw.json` with 8 critic lists. | Very limited: 19 wines cached | **Scraped.** WineSearcher is a commercial data provider. | "Suckling, Decanter, Falstaff m.fl." — names individual critics |

### Exposure assessment

| Risk | Source | Exposure |
|------|--------|----------|
| **High** | Vivino | Scraped data, explicitly named on site. Vivino could send C&D. The crowd score is the primary quality signal — losing it would invalidate the product. |
| **Medium** | WineSearcher | Scraped data, very small cache. Individual critic names used in marketing copy. |
| **Medium** | Wine Enthusiast/Kaggle | Kaggle dataset provenance unclear. If WE asserts copyright on scores, the 5,107-entry cache is a liability. |
| **Low** | Systembolaget | Public API, standard use case. No ToS issues apparent. |

### Decision needed: → D11 (board review)

---

## S0-5: Analytics Baseline

**Status: Requires user action.**

I cannot export from Plausible/GoatCounter. You need to:
1. Export last 6 months from GoatCounter (smakfynd.goatcounter.com): sessions, pageviews, bounce, duration, entry/exit pages, device split
2. Export search terms if captured
3. Export outbound click events if tracked
4. Newsletter signup conversions from Supabase: `SELECT COUNT(*) FROM email_subscribers WHERE created_at > '2026-02-18'`

---

## S0-6: Price History Retention Check

### Answer: YES — daily snapshots are retained.

| Metric | Value |
|--------|-------|
| Retention start | 2026-04-14 (127 days ago) |
| Latest snapshot | 2026-08-18 |
| Total snapshots | 78 files |
| Missing days | ~49 (127 days − 78 files) — some gaps |
| Wines tracked | 21,563 (in first_seen_prices.json) |
| Avg snapshot size | 212 KB |
| Total storage | 16.1 MB |
| Growth rate | ~212 KB/day = ~6.2 MB/month |

### Format

Each file is `prices_YYYY-MM-DD.json`: `{ "article_nr": price, ... }`
Plus `first_seen_prices.json`: records launch price per article number.

### Gaps

78 snapshots over 127 days = 61% coverage. Missing days are likely weekends or when the daily cron didn't run. Not append-only — each file is a complete snapshot overwriting the previous day.

### Recommendation

- Fill gaps: the daily action should run 7 days/week
- The format is sound but should add `volume_ml` and `in_assortment` per the Sprint 0 spec
- Growth rate (6.2 MB/month) is sustainable indefinitely
- **No data is being lost currently**, but gaps mean some price changes are undetected
