# Smakfynd SEO & Traffic Backlog

Generated 2026-08-17 from GSC (last 3 months), Plausible (Mar 16–Aug 17), and CF Worker analytics.

## Current State

- **502 clicks / 8,231 impressions** from Google (3 months)
- **3,548 visits** total (Plausible, 5 months)
- **95 landing pages** deployed
- Top referrers: Google 25%, Bing 10%, ChatGPT 8%, DuckDuckGo 7%
- 87% Sweden, 60% mobile

---

## P0 — Investigate & Fix

### 1. June traffic crash (critical)
**Problem:** Impressions dropped from ~2,100/week (W21) to ~45/week (W23-W24) around Jun 5. Two weeks near-zero. Recovery started ~Jun 22 but traffic hasn't returned to May levels (W21: 157 clicks vs W32: 21 clicks).
**Impact:** ~75% of peak traffic still missing.
**Action:**
- Check `git log` around Jun 5 for deploys, robots.txt changes, sitemap edits
- Check Google Search Console for manual actions or coverage issues
- Review if any pages were accidentally noindexed
- Compare indexed page count then vs now (`site:smakfynd.se` in Google)

### 2. Sessions endpoint broken
**Problem:** CF Worker `/sessions` returns all zeros — `total_sessions: 0`, no daily data, no device breakdown.
**Impact:** Admin dashboard Trafik tab is missing bounce rate and session duration data.
**Action:** Debug `smakfynd-analytics` worker session tracking logic.

---

## P1 — High-Impact SEO (Quick Wins)

### 3. Improve CTR on champagne-under-300-kr
**Problem:** 1,937 impressions but only 4.2% CTR at position 9.9. Highest impression page.
**Action:**
- Rewrite title tag — more compelling, include "bäst i test" or "topp 10"
- Add structured data (FAQ, review snippets) for rich results
- Target: push CTR from 4.2% → 8% = +74 clicks/quarter

### 4. Improve CTR on vin-under-100-kr
**Problem:** 1,063 impressions, 3.6% CTR, position 9.7.
**Action:**
- Rewrite title/meta with stronger hook ("Bästa vinerna under 100 kr — Testad & rankad 2026")
- Target: CTR 3.6% → 7% = +36 clicks/quarter

### 5. Push "champagne bäst i test 2026" to page 1
**Problem:** 191 impressions, 1.6% CTR, position 10.9. Just off page 1.
**Action:**
- Page exists (`basta-champagne`), but title likely doesn't target "bäst i test"
- Add "bäst i test" to H1 and title tag
- Add internal links from `champagne-under-300-kr` and `basta-bubbel`
- Target: pos 10.9 → 7 = estimated +15-20 clicks/quarter

### 6. Fix "bästa cava systembolaget" (0 clicks, 33 imp, pos 10.6)
**Problem:** Page `/basta-cava/` exists but doesn't rank for "systembolaget" variant.
**Action:**
- Add "Systembolaget" to title tag and intro paragraph
- Also target "cava bäst i test" (122 imp, pos 9.1) — add "bäst i test" phrasing
- Consolidate the cava query cluster (236 total impressions across variants)

### 7. Capture "prisvärd champagne systembolaget 2026" (89 imp, pos 11.2)
**Problem:** High-intent query, just off page 1.
**Action:**
- Add "prisvärd" angle to `champagne-under-300-kr` page
- Or create dedicated section/page for budget champagne
- Target: break into top 10 = estimated +10-15 clicks/quarter

---

## P2 — New Landing Pages (Proven Demand)

### 8. Create `/basta-rodvin/` redirect or alias
**Problem:** Queries like "bästa rödvin 2026" (11 imp, pos 5.4, 0 clicks), "bästa rödvin" (9 imp, pos 29), "rödvin bäst i test 2026" (3 imp) — your page is `/basta-roda-vin/` but searchers use "rödvin" (one word).
**Action:**
- Ensure title/meta targets both "röda vin" and "rödvin" variants
- Consider redirect from `/basta-rodvin/` → `/basta-roda-vin/`

### 9. Create `/basta-champagne-under-500-kr/`
**Problem:** "champagnen under 500" (10 imp, pos 23), "bästa champagnen under 500" (5 imp, pos 26.4), "bästa champagnen under 1000" (1 imp). You have under-300, but not under-500.
**Action:** Generate page filtering champagne 300-500 kr. Different buyer intent than under-300.

### 10. Create `/basta-bag-in-box/` umbrella page
**Problem:** Scattered "bag in box" queries totaling ~35 impressions: "bästa bag in box" (3 imp, pos 28), "bästa bag in box 2026" (1 imp, pos 7), "bag in box bäst i test" (1 imp, pos 46). Your `/basta-boxvin/` exists but doesn't capture "bag-in-box" phrasing.
**Action:**
- Either redirect `/basta-bag-in-box/` → `/basta-boxvin/`
- Or add "bag-in-box" to boxvin page title/content so it captures both query variants

### 11. Create `/vin-till-gravad-lax/` or expand lax cluster
**Problem:** "Vin till lax" cluster: 37 impressions across 8+ variants (lax i ugn, gravad lax, grillad lax, ugnsbakad lax). You have `/vin-till-lax/` but it ranks position 44-86 for these.
**Action:**
- The page exists but ranks terribly. Rewrite with specific sections for gravad/grillad/ugnsbakad lax
- Add internal links from other food pairing pages
- Add structured data

### 12. Improve `/basta-riesling/` targeting
**Problem:** "bästa riesling systembolaget 2026" (11 imp, pos 7.3, 0 clicks), "bästa riesling 2026" (18 imp, pos 6.9, 1 click). Page exists but isn't converting.
**Action:**
- Review title tag — ensure it includes "Systembolaget 2026"
- Check content quality vs competitors ranking above

---

## P2 — Norwegian Traffic Opportunity

### 13. Optimize Norwegian landing page
**Problem:** 175 impressions from Norwegian queries ("gode kjøp på systembolaget 2026" alone = 144 imp). You have `/basta-vin-for-norrman/` but Norwegian searches are hitting other pages. Norway = 5% of Plausible traffic (170 visits).
**Action:**
- Ensure `/basta-vin-for-norrman/` targets "gode kjøp systembolaget 2026" in title
- Add Norwegian-language meta description
- Internal link from homepage
- Consider `/gode-kjop-pa-systembolaget/` redirect to the Norwegian page (slug exists already — verify content)

---

## P2 — Technical / UX

### 14. Capitalize on ChatGPT referral traffic (8%)
**Problem:** ChatGPT sends 284 visits (8% of all traffic) — third largest referrer. This will likely grow but is fragile (depends on LLM training data).
**Action:**
- Add structured data (JSON-LD) to all pages for better LLM parsing
- Ensure pages have clear, factual intro paragraphs that LLMs can cite
- Monitor this channel monthly

### 15. Mobile UX audit
**Problem:** 60% of Plausible traffic + 72% of GSC clicks are mobile. iOS/Safari dominant (51%).
**Action:**
- Test all landing pages on iPhone Safari
- Check Core Web Vitals on mobile
- Ensure filter/sort UI works well on small screens

### 16. Bing optimization
**Problem:** Bing sends 354 visits (10%) — strong for a Swedish site. But no specific Bing optimization done.
**Action:**
- Submit sitemap to Bing Webmaster Tools if not already done
- Bing favors exact-match titles more than Google — review if title tags align with Bing query patterns

---

## P3 — Content Gaps (Lower Priority)

### 17. "Bästa vinet under 100" (55 imp, pos 18, 0 clicks)
Existing pages: `vin-under-100-kr`. Title mismatch — searchers say "bästa vinet" not "bästa vinerna". Consider adjusting.

### 18. "Bästa champagnen 2026" (15 imp, pos 11.2, 0 clicks)
Page exists (`basta-champagne`) but doesn't rank for the year-qualified query. Ensure 2026 is in title.

### 19. "Vitt vin bäst i test 2026" (13 imp, pos 10.6, 0 clicks)
Page exists (`basta-vita-vin`) but isn't targeting "bäst i test" phrasing. Add to title.

### 20. Food pairing pages ranking poorly
Pages exist for sushi, svamp, lax — but avg position is 40-80. These need content rewrites and internal linking to become competitive. Low impression volume for now, so lower priority than champagne/bubbel optimization.

### 21. "Prissänkta viner" cluster
"Prissänkta viner systembolaget 2026" = 252 imp, 18 clicks, pos 6.2 — your best converting non-bubbel query. You have `/prissankt-vin/` and `/prissankt/`.
**Action:** Ensure this page is updated frequently (daily price drop data), strong internal linking, and title matches the exact query.

---

## Summary: Estimated Impact

| Priority | Items | Est. quarterly click gain |
|----------|-------|--------------------------|
| P0 | Fix June crash root cause | +100-130 (recover to May levels) |
| P1 | CTR improvements + page 1 pushes | +50-80 |
| P2 | New pages + Norwegian + technical | +30-50 |
| P3 | Content gap fixes | +15-25 |
| **Total** | | **+195-285 clicks/quarter** |

Current baseline: ~170 clicks/quarter (post-crash). Full execution could 2-3x organic traffic.
