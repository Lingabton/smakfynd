# Post-mortem: Vivino Data Corruption (2026-05-07)

## Vad hände
80% av Vivino-cachen (10 118 av 12 604 entries) innehöll korrupt data som gav felaktiga betyg på smakfynd.se. Mest kritiskt: "Falu Rödvin Grand Vin" (95 kr) matchades mot Château Latour (30 000 kr) och fick artificiellt 4.7/5 betyg → smakfynd-score 94. Vinet rankades #4 på hela sajten.

## Grundorsak
En äldre scraper (`scraper.py`, inte `vivino_playwright.py`) sparade **hela sidtexten** från Vivino-sökresultat som `vivino_name` istället för det parsade vinnamnet. Detta inkluderade:

1. **Cookie-banners och navigationtext** (7 180 entries) — "Gör som miljoner andra...", "Användarvillkor", "App Om Kontakt"
2. **Sökresultat med 50-1000 träffar** (2 938 entries) — scrapern tog betyget från **första** sökresultatet, som ofta var ett helt annat vin. "Grand Vin" matchade Château Latour Grand Vin Pauillac.

`match_score: 100` sparades för alla entries oavsett faktisk matchningskvalitet — värdet kom från scraperns interna logik, inte fuzzy matching.

## Påverkan
- 80 av topp 100 viner hade opålitlig Vivino-data
- Budgetviner med generiska namn ("Grand Vin", "Reserva", "Organic Red") drabbades värst
- Totalt vinkortantal sjönk från ~9 900 till ~5 100 efter rensning

## Vad vi ändrade

**Omedelbart (2026-05-07):**
- Rensade vivino_cache.json: tog bort entries med sidtext eller 50+ sökresultat
- Räknade om alla poäng med `score_wines_v2.py`

**Tre lager av skydd mot återfall:**
1. **vivino_playwright.py** — Cache-cleanup vid start + avvisar matchningar med spam eller hög rating + låg namnlikhet
2. **score_wines_v2.py** — `get_vivino()` avvisar entries med spam-markörer eller 50+ resultat (defense-in-depth)
3. **validate_vivino.py** — Nytt steg i pipelinen: fuzzy-matchvalidering (Levenshtein ≥80%), flaggar misstänkta för manuell review via admin-vy

**Pipeline-ordning nu:** Scrape → Validate → Score → Build

## Lärdomar för andra datakällor
- **Spara aldrig råtext som match-namn** — parsera alltid innan cachning
- **Validera match-kvalitet vid inläsning, inte bara vid skrapning** — data degraderas över tid
- **En `match_score` från scrapern är inte tillförlitlig** — validera med fuzzy match oberoende
- **Sökresultat ≠ exakt matchning** — antalet sökresultat är en varningssignal (1 resultat = troligen rätt, 1000 = troligen fel)
