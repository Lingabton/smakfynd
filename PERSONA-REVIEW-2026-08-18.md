# Smakfynd Persona Review — 2026-08-18

8 non-expert personas walked through the actual code and UI.
Target audience: normal people trying to buy good wine without getting ripped off.

---

## The 8 Personas

| # | Name | Profile | Core need |
|---|------|---------|-----------|
| 1 | Anna | 28, party buyer, iPhone | 4-6 bottles for dinner, 100-200 kr, wants to impress |
| 2 | Erik | 44, box wine dad, Samsung | Reliable everyday red box, under 250 kr |
| 3 | Linnea | 22, complete beginner, iPhone | First wine purchase for a date, 80-130 kr |
| 4 | Mohammed | 35, gift buyer, Android | Wine gift for boss's 50th, 300-500 kr |
| 5 | Karin | 38, home cook, iPad | Wine for grillad lax med citronsmor tonight |
| 6 | Ole | 45, Norwegian tourist, iPhone | Fill the car at Systembolaget, 2000-3000 kr |
| 7 | Sofia | 32, deal hunter, Android | Proof that cheap wine (<100 kr) can be great |
| 8 | Bjorn | 40, in Systembolaget NOW, iPhone | Scan/search wine on shelf, decide in 30 seconds |

---

## P0 — Blockers (Users cannot complete their task)

### 1. Age gate says 25+ but legal purchase age is 20
**Affects: Linnea (22), all legal buyers aged 20-24**
`src/components/AgeGate.jsx:13` — "riktar sig till personer som fyllt 25 ar" with button "Ja, jag ar over 25."
Linnea is a legal adult who can buy wine at Systembolaget, but the site tells her she's not old enough. She either lies or leaves.
**Fix:** Change to 20 (Systembolaget's actual minimum).

### 2. wines.json (1.7 MB) with no caching makes in-store use broken
**Affects: Bjorn (in-store), all repeat visitors**
On bad store WiFi (500 kbps), wines.json takes ~27 seconds. StoreMode is useless until it loads. No service worker caching means every visit re-downloads.
**Fix:** Add service worker caching for wines.json. Consider a 100 KB "top 500" lite payload for instant first load.

### 3. vin-under-100-kr page lists wines over 100 kr
**Affects: Sofia (deal hunter)**
The page titled "Basta vinet under 100 kr" includes wines at 129, 179, 199 kr. Credibility-destroying for a deal hunter.
**Fix:** Check filter logic in `generate_landing_pages.py` — the wine filter should be `price < 100`, not a different threshold.

---

## P1 — High Friction (Users struggle significantly)

### 4. Box wine toggle buried 4 clicks deep
**Affects: Erik (box wine buyer)**
Package toggle (Flaska/BiB) is inside the advanced filter panel. Erik must: open Filter → find Forpackning → click BiB. Default is "Flaska."
`src/App.jsx:525-537` — inside `showAdvanced` block.
**Fix:** Add BiB/Flaska toggle as top-level pill next to category tabs.

### 5. Score labels frame everything as "deals" — wrong for gifts
**Affects: Mohammed (gift buyer)**
"Exceptionellt fynd", "Toppkop", "Starkt fynd" — the word "fynd" (bargain) implies cheapness. A 450 kr gift wine labeled "Toppkop" sends the wrong signal.
`src/utils.jsx:30-37` — score label definitions.
**Fix:** For wines >200 kr, use "Exceptionellt val" instead of "Exceptionellt fynd."

### 6. "Fylligt rott" taste filter behind 3 clicks
**Affects: Erik, many Swedish wine buyers**
"Fylligt" is the #1 way Swedes describe wine preference. Requires: Filter → Fler filter (details) → Smak → Fylligt.
**Fix:** Add "Fylligt" and "Latt" as quick-filter pills alongside Eco/New/Deals.

### 7. Landing page cooking tips buried BELOW 20-wine list
**Affects: Karin (home cook)**
`docs/vin-till-lax/index.html` — specific advice ("grillad lax: Rose fran Provence") appears after scrolling past all 20 wines.
**Fix:** Move cooking-method sections ABOVE or interleaved with the wine list.

### 8. Norwegian experience breaks at main app boundary
**Affects: Ole (Norwegian tourist)**
Landing page is in Norwegian. Click to main app → Swedish age gate, Swedish hero, Swedish filters. `lang` switches from `nb` to `sv`.
**Fix:** At minimum, add Norwegian text to AgeGate when referrer is Norwegian page.

### 9. `#ai` hash link from landing pages goes nowhere
**Affects: Karin, anyone clicking "AI-vinmatchare" from landing pages**
Landing pages link to `smakfynd.se/#ai` but `parseHash()` in App.jsx doesn't handle `#ai`. User lands on default state (Rott category).
`src/App.jsx:16-23` — catMap has no "ai" entry.
**Fix:** Add `#ai` handler that scrolls to/opens FoodMatch.

### 10. No liter price on wine cards
**Affects: Erik (box wine buyer), Sofia (deal hunter)**
Box wines show total price (279 kr for 3L) but not kr/liter. Critical for comparing box sizes.
`src/components/Card.jsx:99-104`
**Fix:** Show liter price for BiB wines.

---

## P2 — Significant UX Gaps

### 11. No beginner-friendly wine descriptions
**Affects: Linnea, Mohammed**
Taste sliders use "Stram" (austere), grape names like "Shiraz, Cabernet sauvignon" — meaningless to beginners. No plain-language alternative.

### 12. No shopping list / total calculator
**Affects: Anna (buying 4-6 bottles), Ole (buying 10-15 bottles)**
Save feature exists but no running total, no shareable list, no "bring to store" view.

### 13. Category pills scroll off-screen without indicator
**Affects: Erik (Samsung 360px), Linnea**
"Bubbel" is the 5th pill in horizontal scroll. No scroll indicator — users may not know it exists.

### 14. No occasion-based filtering
**Affects: Anna ("dinner party"), Mohammed ("gift"), Linnea ("date")**
Food filters exist (Kott, Fagel, Fisk) but no occasion filter (Fest, Dejt, Present, Vardags).

### 15. Score explanation hidden behind tiny "?" button
**Affects: all non-experts**
The score breakdown popup is the most trust-building content — but hidden behind an 11px button with 1px×6px padding. Tiny tap target.

### 16. Barcode scanning unreliable
**Affects: Bjorn (in-store)**
Scans EAN barcodes from bottles, but wines.json uses Systembolaget article numbers. Bottle EAN ≠ article number. Shelf label scanning might work.

### 17. StoreMode "Battre alternativ" is the killer feature but requires scrolling
**Affects: Bjorn**
Shows higher-scored wines at same price range — exactly what an in-store buyer needs. But it's below the fold in the expanded card view.

---

## What Works Brilliantly

### For all personas:
- **Comparison line** ("Lika bra som viner for 250 kr — du sparar 120 kr") — the single most persuasive element. Sofia goes from skeptic to advocate when she sees this.
- **Landing pages** — well-targeted SEO, clear intros, ranked lists with direct SB links. Erik's conversion: Google → landing page → click SB link → buy. 2 taps.
- **Trust tagline** — "Vi tjanar inget pa vad du koper. Bara arliga rad." Instant credibility.
- **FoodMatch AI** — when it works, it's exactly what Karin needs. Describe meal → get wine. The quick-buttons ("Dejt" for Linnea!) are great.
- **"Oberoende poang — inte sponsrad"** — especially important for Mohammed who can't evaluate wine quality himself.

### Persona-specific wins:
- **Erik**: Box wine landing pages are excellent — clear ranking, direct SB links, 2-tap conversion
- **Sofia**: Comparison line + "Budgetfavorit" pill = proof that cheap wine can be great
- **Mohammed**: vin-present landing page intro directly addresses gift anxiety
- **Karin**: vin-till-lax page validates that cooking method matters (just needs restructuring)
- **Ole**: Norwegian landing page with Vinmonopolet comparison is strong
- **Bjorn**: StoreMode "Battre alternativ" is genuinely useful for in-store decisions

---

## Emotional Journeys Summary

| Persona | Arrives | Browsing | Choosing | Buying |
|---------|---------|----------|----------|--------|
| Anna | Curious | Slightly overwhelmed | Growing confident (comparison line) | Minor frustration (no unified cart) |
| Erik | Relieved (landing page) | Confident on LP, confused in app | Confident on LP | 2-tap on LP, 6-tap in app |
| Linnea | Blocked (age gate 25+) | Overwhelmed (terminology) | Uncertain (picks #1 blindly) | Anxious (SB process unclear) |
| Mohammed | Reassured (gift LP) | Increasingly confident | Hesitant (no "safe bet" badge) | Relieved |
| Karin | Hopeful (LP matches query) | Overwhelmed (20 wines before tips) | Confident if AI works | Actionable if AI gives specific wine |
| Ole | Excited (20-40% savings!) | Pleased but no NOK prices | Can't build shopping list | Bookmarks LP, skips app |
| Sofia | Skeptical | Intrigued (intro copy) | Convinced (comparison line!) | Advocate — shares with friends |
| Bjorn | Hopeful | Waiting... waiting... (1.7 MB) | IF data loads: confident | IF not: gives up, picks random wine |

---

## Top 10 Fixes by Impact (Quick Wins First)

| # | Fix | Personas helped | Effort |
|---|-----|----------------|--------|
| 1 | Change age gate from 25 to 20 | Linnea + all 20-24 yr olds | 1 min |
| 2 | Add `#ai` hash handler to App.jsx | Karin + all LP visitors | 10 min |
| 3 | Fix vin-under-100 to actually filter <100 kr | Sofia | 5 min |
| 4 | Move cooking tips above wine list on food pages | Karin | 30 min |
| 5 | Add BiB/Flaska top-level toggle | Erik | 30 min |
| 6 | Add service worker caching for wines.json | Bjorn + all repeat users | 1-2 hrs |
| 7 | Show liter price on BiB cards | Erik, Sofia | 15 min |
| 8 | Add taste quick-filters (Fylligt/Latt) | Erik | 30 min |
| 9 | Context-aware score labels ("val" > 200 kr) | Mohammed | 15 min |
| 10 | Per-wine Vinmonopolet comparison on Norwegian page | Ole | 2-3 hrs |
