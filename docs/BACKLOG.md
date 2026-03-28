# Smakfynd Feature Backlog
*Uppdaterad 2026-03-28*

## Att konfigurera (AKUT)
- [x] ~~Deploya workers med CORS-fix~~ (2026-03-28)
- [x] ~~Deploya analytics~~ (2026-03-28)
- [x] ~~Deploya wine-ai~~ (2026-03-28)
- [x] ~~Sätt ADMIN_KEY~~ (2026-03-28)

## UX — låg insats
- [x] ~~Visa kr/liter på alla kort~~ (2026-03-28)
- [x] ~~Minska hero-höjd på mobil~~ (2026-03-28)
- [x] ~~"Tryck på ett vin för att se mer"-hint~~ (redan implementerad)
- [x] ~~CTA på landningssidor → AI-matchern~~ (2026-03-28, 13 sidor)
- [x] ~~Kort: visa situationspassning~~ (2026-03-28)

## Kritiker-data
- [x] ~~Scoring-bonus för konsensus~~ (2026-03-28, 54 stark konsensus, 17 konsensus)
- [x] ~~Spridningsanalys: konsensus vs kontroversiellt vin~~ (2026-03-28, 144 med spread-data)
- [ ] Vikta kritiker olika baserat på tillförlitlighet/korrelation med crowd

## UX — medel insats
- [x] ~~Prisfilter premium: 200-300, 300-500, 500+~~ (2026-03-28)
- [x] ~~Prissegmentering på landningssidor (budget, mellanklass, premium)~~ (2026-03-28)
- [x] ~~Komprimera detaljvyn — tydligare hierarki~~ (2026-03-28)
- [x] ~~Smakprofil: verbal descriptor~~ (2026-03-28)

## Stora features
- [ ] Inloggningssystem (email/Google) — synka sparade viner, e-postutskick, personalisering
- [ ] Streckkods-scanner i butikläge (BarcodeDetector API)
- [ ] Delbar AI-vinlista ("Dela vinlista" för middagsbjudning)
- [ ] "Gabriels val" — månatlig landningssida med handplockade viner + texter
- [ ] Situationsbaserade ingångar: dejt, grillkväll, svärföräldrar, fredagsmys
- [ ] Säsongsinnehåll: sommarvin, kräftskiva, glögg, nyårsbubbel
- [ ] "Vet ingenting om vin"-läge: enkel guide utan pretention
- [ ] Present-sektion: kurerade listor per prisklass

## Data & teknik
- [ ] Fräschare Wine Enthusiast-data (Kaggle är från 2017)
- [ ] Scrapa EAN/streckkoder från SB API (krävs för barcode-scanner)
- [ ] Vinpriser.se deep scrape (594 prissänkta viner)

## Att konfigurera
- [ ] Cloudflare Email Routing: `hej@smakfynd.se` → `gabriel.linton@inn.no` (Dashboard → smakfynd.se → Email → Email Routing)
- [ ] Fyll i organisationsnummer i `/integritet/` (`[ORG-NR]`)
- [ ] Deploya auth worker: `cd workers/auth && npx wrangler d1 create smakfynd-users` → fyll i ID → `npx wrangler d1 execute smakfynd-users --remote --file=schema.sql && npx wrangler deploy`

## Data — rutiner
- [ ] Kör `python3 scripts/scrape_winesearcher.py --retry-errors` efter varje skrapningssession
- [ ] Kör `python3 scripts/find_gaps.py` veckovis
- [ ] Kör `python3 scripts/snapshot_prices.py` veckovis
- [ ] Kör `./build.sh` efter dataupdatering

## Content & distribution
- [ ] Fredags-nyhetsbrev "Veckans fynd" via Substack
- [ ] Substack SEO-artiklar: "bästa röda under 100 kr systembolaget"
- [ ] "Gabriels val" blogpost: "Viner i mars — test"
- [ ] Instagram @smakfynd
- [ ] Reddit/Flashback/Facebook vingrupper

## Klart (session 4 — 2026-03-28)
- [x] Bugg: prisfilter använder nu PRICES-konstanten istället för hårdkodad array
- [x] Bugg: Redaktionens val scrollar till #vin/{nr} istället för att söka
- [x] Bugg: "Gillar du X" har SB ↗-länk till Systembolaget
- [x] Kritiker: individuella scores visas per vin (pipeline end-to-end)
- [x] Kritiker: "N av N kritiker ger 85+" social proof-chip
- [x] UX: eko-antal på filterpill ("Ekologiskt (342)")
- [x] UX: flytande "tillbaka till toppen"-knapp
- [x] UX: fler länder i filter (Argentina, Nya Zeeland, Österrike)
- [x] UX: fler food-keywords (Pasta, Lamm)
- [x] UX: sorteringsval (expert, crowd, pris ↑↓)
- [x] UX: budget-pills i AI-matchern (under 100, 100-200, 200+)
- [x] UX: smakpreferens-filter (Fylligt, Lätt, Fruktigt, Torrt)
- [x] UX: region-filter (Bordeaux, Toscana, Rioja, m.fl.)
- [x] UX: loading skeleton istället för spinner
- [x] Data: validators uppdaterad för critics/num_critics

## Klart (session 3 — 2026-03-25/26)
- [x] Babel borta — pre-transpilera vid build (-1.2 MB)
- [x] AI → Cloudflare Workers AI (gratis Llama 3.1 70B)
- [x] Data separerad: wines.json async, index.html 118 KB
- [x] PWA: manifest.json + service worker
- [x] Hash routing: #rott, #vitt, #vin/nr
- [x] 12 SEO-landningssidor med cross-links + deep-links
- [x] FAQPage JSON-LD schema
- [x] Newsletter-knapp → Substack
- [x] Om-sektionen: akademiska meriter
- [x] Dela-knapp per vin (Web Share API)
- [x] Sparade viner med 6 kategorier (Favoriter, Att testa, etc)
- [x] Buggfixar: React hooks, store mode, död kod
- [x] JSX uppdelad i 14 src/-filer
- [x] JSON Schema-validering av wines.json
- [x] Test-suite: 28 tester (scoring + data)
- [x] GitHub Action: CI på varje push
- [x] Felhantering: retry, offline-meddelande
- [x] CSS-variabler i :root
- [x] Analytics: event tracking, AI-loggning, prishistorik (D1)
- [x] build.sh — en-kommando full pipeline
- [x] WS-skraper: retry-errors, auto-pause vid CAPTCHA
- [x] Gap-analys: find_gaps.py
