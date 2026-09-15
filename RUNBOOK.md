# Smakfynd Runbook

Operational procedures for every failure the health digest can report. Written from actual incidents, September 2026.

---

## Fetch aborts on guard

**Symptom:** `ABORT: [category] returned X/Y (Z%) — below 97% of expected unique.`

**Likely causes:**
1. SB API returning fewer products (assortment change)
2. Network error mid-fetch (transient, retry should handle)
3. API key expired or rate limited

**Diagnostic commands:**
```bash
# Check per-category counts
python3 scripts/fetch_systembolaget.py 2>&1 | grep -E "\[|expected|ABORT"

# Test API directly
curl -s "https://api-extern.systembolaget.se/sb-api-ecommerce/v1/productsearch/search?categoryLevel2=R%C3%B6tt%20vin&size=1" \
  -H "ocp-apim-subscription-key: cfc702aed3094c86b92d6d4ff7a54c84" | python3 -m json.tool | grep docCount
```

**Fix:**
- If assortment genuinely changed: update `EXPECTED_UNIQUE` in `scripts/fetch_systembolaget.py` with new counts and a commit message stating the reason
- If transient: the 3-retry mechanism should handle it. If not, increase timeout
- Override once: `python3 scripts/fetch_systembolaget.py --allow-short-fetch` (use with caution)

**History:** Score sort returned 77% of catalog (5,446 of 7,075) due to unstable pagination. Fixed Sep 2026 by switching to Name sort with two-pass union. See `SESSION-REPORT-2026-09-02.md`.

**Escalate if:** the API returns < 50% consistently, or the subscription key stops working.

---

## Corpus drift

**Symptom:** `[CORPUS_SHIFT] Scored wines X vs locked 4362 (Y% — max 1%)`

**Likely causes:**
1. Fetch returned fewer products (see "Fetch aborts" above)
2. Scoring pipeline changed (Vivino cache updated, expert data added/removed)
3. Publication rule filtering differently (25+ reviews OR expert score)

**Diagnostic commands:**
```bash
python3 scripts/score_wines_v2.py 2>&1 | grep "Scored:"
python3 scripts/build_slim.py 2>&1 | grep "Slim:"
```

**First action: account for the delta, not move the constant.**

```bash
# 1. Check the deltas files for recent catalog changes
cat data/history/deltas_YYYY-MM-DD.json | python3 -m json.tool | head -10

# 2. Check scored_history.json for the trend
cat data/deploy/scored_history.json

# 3. Compare current scored set against the baseline
python3 -c "
import json
old = json.load(open('docs/wines.json'))
old_nrs = {str(w['nr']) for w in (old.get('wines',old) if isinstance(old,dict) else old) if not w.get('unrated')}
ranked = json.load(open('data/smakfynd_ranked_v2.json'))
new_nrs = {str(w['nr']) for w in ranked}
print(f'Lost: {len(old_nrs - new_nrs)}, Gained: {len(new_nrs - old_nrs)}')
"
```

**Fix — in this order:**
1. Account for every wine in the delta (removed from SB catalog / failed scoring / deduped)
2. Check the deltas files: do arrivals and delistings explain the gap?
3. Check the trend: is the count stable at the new level or still declining?
4. **Only then** update `LOCKED_CORPUS_COUNT` in `scripts/constants.py`, with old→new values and the documented cause in the commit message

Moving the constant is the last step. Moving it without accounting is silencing an alarm.

**History:**
- 4,362 set Sep 2: Name sort recovered full catalog
- 4,316 set Sep 15: Sep 1 assortment change removed 94 products over Sep 12-13 (deltas show -56 and -38 delistings), stabilized at 4,315-4,316

**Escalate if:** the count drops more than 10% with no known cause, or declines for 7+ consecutive days without corresponding catalog delistings.

---

## Build fails on validation

**Symptom:** `validate_data.py` exits with errors.

**Likely causes:**
1. Small-format wines on price pages (`[SMALL_FORMAT]`)
2. Norwegian text on Swedish pages (`[NORWEGIAN_IN_SV]`)
3. Schema violations (wrong types, missing fields)
4. `wines.json` shape changed without updating consumers

**Diagnostic commands:**
```bash
python3 scripts/validate_data.py 2>&1 | grep "ERROR"
```

**Fix:**
- Small format: check that price pages use `in_store_std` (vol >= 750)
- Norwegian: check `generate_landing_pages.py` for Norwegian strings in Swedish page intros
- Schema: check `build_slim.py` output format against `REQUIRED_FIELDS` in `validate_data.py`
- Shape: use `load_wines()` from `scripts/constants.py` for all `wines.json` consumers

**History:** 7 small-format and 4 Norwegian errors persisted for weeks because `validate_data.py` was not in the daily CI workflow. Fixed Sep 2026: validation added to `daily-update.yml`.

---

## Wine lists changing with no data change

**Symptom:** Landing pages rewritten every build despite identical input data.

**Likely causes:**
1. Sort not deterministic — tied scores with no tie-breaker
2. Input order affecting output (Python sort not stable across runs)

**Diagnostic commands:**
```bash
python3 scripts/verify_determinism.py
```

**Fix:**
- All sorts must use `(-_score_raw, str(nr))` — the unrounded float score plus article number as tie-breaker
- Never sort on the rounded `smakfynd_score` integer (70 buckets for 4,000 wines)

**History:** 92 pages were rewritten every day for 11 consecutive days (Aug 22–Sep 1). Root cause: `score_wines_v2.py` sorted on rounded integer score. Fixed in Push 4 with `_score_raw`.

---

## Local build differs from CI

**Symptom:** Different `wines.json` or landing pages locally vs in GitHub Actions.

**Likely causes:**
1. Local data files not in git (vivino_cache, expert_cache, winesearcher_cache)
2. Different Python/Node versions
3. `wines.json` envelope format not handled by a consumer

**Diagnostic commands:**
```bash
python3 scripts/build_manifest.py
python3 scripts/build_manifest.py --compare data/deploy/build_manifest.json
```

**Fix:**
- Ensure all `wines.json` consumers use `load_wines()` from `scripts/constants.py`
- Check data caches match between local and CI

**History:** `winesearcher_cache.json` existed locally but not in CI, producing different scores. Removed in Push 4 (Sep 2026).

---

## wines.json shape errors

**Symptom:** Scripts fail with `TypeError` or `KeyError` on `wines.json` load.

**Likely cause:** `wines.json` changed from a flat array to `{meta: {...}, wines: [...]}` envelope (Sep 2026).

**Fix:** Use `load_wines()` from `scripts/constants.py` — it accepts both formats.

**Consumers to check:** `build_admin.py`, `generate_monthly_content.py`, `build_manifest.py`, `validate_data.py`.

---

## Work lost in a branch operation

**Symptom:** Code changes disappeared after `git reset`, `git checkout`, or branch switch.

**Prevention:** Push to a named branch at the end of every session, even unfinished. A branch on origin costs nothing and survives any local operation.

**Recovery:**
```bash
git reflog --all | grep "keyword"
git show <sha> -- path/to/file
git cherry-pick <sha>
```

**History:** Sprint 1 fixes (S1-1 through S1-11) were orphaned by `git reset --hard origin/main`. Recovered from reflog at `9a96beee` and `789acaaa`. `build_manifest.py` was emptied by a checkout, recovered similarly.

---

## Indexed pages drop

**Symptom:** GSC shows fewer indexed pages or falling impressions.

**Likely causes:**
1. `robots.txt` blocking Googlebot (was blocking until Aug 21, 2026)
2. `ratingCount: 0` in structured data causing rich result loss
3. `noindex` tag on thin pages (< 3 wines)
4. Large content changes across many pages at once (churn signal)

**Diagnostic commands:**
```bash
# Check robots.txt
curl -s https://smakfynd.se/robots.txt

# Check noindex on a page
grep "noindex" docs/champagne-under-300-kr/index.html

# Check structured data for ratingCount
grep "ratingCount" docs/basta-bubbel/index.html | head -3
```

**Fix:**
- Deploy content changes in batches of ≤ 5 pages with 48h between
- Spot-check 3 URLs in GSC URL Inspection after each batch
- If indexed status degrades, stop and report

**Escalate if:** more than 10 pages lose indexed status in one week.

---

## Daily workflow disabled

**Symptom:** No daily builds, prices frozen.

**Likely cause:** Intentionally disabled during a batch rollout or while validation errors exist.

**Re-enable:**
```bash
gh workflow enable daily-update.yml
gh workflow run daily-update.yml  # manual trigger to test
```

**Check first:** `python3 scripts/validate_data.py` must pass with zero errors. The validator is now wired into CI and will block builds on any error.
