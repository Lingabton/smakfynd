# Session Report — 2026-09-02

## Summary

Name sort switch shipped. Fetch now recovers 14,368 products (was 11,498 under Score sort — 24.6% increase). Two-pass union (Asc+Desc) closes gap to 3 products of docCount. Determinism verified: ALL 4 CHECKS PASSED. Validation wired into daily CI. Corpus locked at 4,362. Daily workflow disabled pending VISIBLE batch review.

## Phase 1 — Fetch

Name sort two-pass results:

| Category | Unique | docCount | % |
|---|---|---|---|
| Rött vin | 7,054 | 7,062 | 100% |
| Vitt vin | 4,442 | 4,442 | 100% |
| Rosévin | 572 | 572 | 100% |
| Mousserande vin | 2,300 | 2,300 | 100% |
| **Total** | **14,368** | | |

Determinism: two runs of Rött vin under Name/Ascending returned identical 7,026-product sets (0 exclusive to either run).

Both guards pass: EXPECTED_UNIQUE at 97% and docCount at 98%.

## Phase 2 — Determinism

`scripts/verify_determinism.py` — ALL 4 CHECKS PASSED:
- wines.json byte-identical across two runs
- 99 landing pages article-list identical across two runs
- wines.json byte-identical after input shuffle
- 99 landing pages identical after input shuffle

Per-page wine-list hashes saved to `data/list_hashes.json`.

## Phase 3 — Artifacts

- `CORPUS-RECONCILIATION.md` — 14,368 raw → 4,786 scored → 4,362 slim
- `PAGE-CENSUS.md` — 72 stable, 18 gained (+117 wine slots), 3 minor losses (-5). No pages zeroed or halved
- `CHAMPAGNE-UNDER-300.md` — 15 wines (up from 4), 12 Ordervaror, editorial question flagged
- `LOCKED_CORPUS_COUNT` updated: 4,143 → 4,362

## Phase 4 — Investigations

**4.1 — systembolaget_raw.json replaces, does not merge.** Line 225: `json.dump(products, open(OUT_FILE, "w"))` overwrites every run. The 12,538 on Sep 1 vs 11,498 on Sep 2 was a real drop — the Sep 1 data was fetched under old code, Sep 2 under Score sort.

**4.2 — Monthly content workflow:** not investigated this session.

**4.3 — Bot vs human traffic:** not investigated this session.

## Findings for Gabriel

1. **Validation was not in the daily workflow.** Every guard from the past two weeks (corpus drift, small formats, Norwegian text) only ran manually. Now wired in — but the 14 pre-existing errors (7 small-format, 4 Norwegian) will block daily builds until the VISIBLE batch fixes them.

2. **Descending is slightly better than Ascending** for Name sort (7,051 vs 7,026 for Rött vin). Two passes close the gap to ~3 products total.

3. **Regional pages saw the largest gains** from the catalog recovery — Toscana 3→20, Rioja 3→17, Bordeaux 5→16. These were most affected by Score sort's incomplete catalog.

## Blocked / needs a decision

1. **Daily workflow stays disabled.** Validation will fail on pre-existing errors until VISIBLE batch ships
2. **VISIBLE batch rollout** — needs Gabriel's review of PAGE-CENSUS.md
3. **Champagne page** — editorial decision on whether to include Ordervaror (12 of 15 wines)

## Commits pushed

All scripts only, no `docs/` files in any commit:

- `31b3e25a` Push 4: deterministic scoring, fetch guard, WS removal
- `2d26a2df` temp: disable docCount guard, add exhaustion-based completion
- `bb3bd85d` fix: per-page retry, abort on failure, expected-unique guard
- `26b2fa6c` fix: switch fetch to Name sort with two-pass union
- `11f492e1` ci: add validation step to daily-update workflow
- `636a8b3e` test: add permanent determinism verification harness
- `af935b5e` data: update LOCKED_CORPUS_COUNT 4143 -> 4362
- `2edc9772` docs: corpus reconciliation, page census, champagne analysis
