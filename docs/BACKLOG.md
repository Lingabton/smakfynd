# Smakfynd Feature Backlog
*Uppdaterad 2026-03-26*

## Buggar
- [ ] Prisfilter-inkonsekvens: PRICES-arrayen vs renderade pills har olika intervall
- [ ] Redaktionens val: klick borde scrolla till kortet, inte söka vinnamnet
- [ ] "Gillar du X"-länkar borde öppna profil i appen, inte bara SB-länk

## UX — låg insats
- [ ] Visa kr/liter på alla kort (spec. BiB/Storpack)
- [ ] Visa "Under 80 kr"-filter (finns i data, dolt i UI)
- [ ] Minska hero-höjd på mobil — kollapsa trust-box som default
- [ ] "Tillbaka till toppen"-knapp
- [ ] "Tryck på ett vin för att se mer"-hint på första kortet
- [ ] Utöka food-matching keywords: lamm, biff, entrecôte, BBQ, marinerat
- [ ] Visa eko-antal på filterpill ("Ekologiskt (342)")
- [ ] Lägg till fler länder i filter: Argentina, Nya Zeeland, Österrike
- [ ] CTA på landningssidor → AI-matchern
- [ ] Kort: visa situationspassning ("Fynd till lamm", "Tryggt middagsvin")

## Kritiker-data
- [ ] Visa individuella kritiker-scores per vin (Suckling: 91, Decanter: 88, Falstaff: 90)
- [ ] Scoring-bonus för konsensus (alla kritiker överens = högre tillit)
- [ ] Visa "7 av 7 kritiker ger 85+" som socialt bevis
- [ ] Spridningsanalys: konsensus vs kontroversiellt vin
- [ ] Vikta kritiker olika baserat på tillförlitlighet/korrelation med crowd

## UX — medel insats
- [ ] Sorteringsval: expert-score, crowd-score, pris
- [ ] Budget-input till AI-matchern (snabbpills: under 100, 100-200, 200+)
- [ ] Smakpreferens-filter (fruktigt, torrt, lätt, fylligt)
- [ ] Visa individuella expert-källor per vin (Suckling: 91, Decanter: 88)
- [ ] Region-filter (Bordeaux, Toscana, Rioja, Barolo)
- [ ] Loading skeleton istället för "Laddar..."
- [ ] Prisfilter premium: 200-300, 300-500, 500+
- [ ] Prissegmentering på landningssidor (budget, mellanklass, premium)
- [ ] Komprimera detaljvyn — tydligare hierarki
- [ ] Smakprofil: verbal descriptor ("fylligt, mörkfruktigt, mjukt")

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

## Att konfigurera (AKUT)
- [ ] Deploya workers med CORS-fix: `cd ~/smakfynd/workers/auth && npx wrangler deploy`
- [ ] Deploya analytics: `cd ~/smakfynd/workers/analytics && npx wrangler deploy`
- [ ] Deploya wine-ai: `cd ~/smakfynd/workers/wine-ai && npx wrangler deploy`
- [ ] Sätt ADMIN_KEY: `cd ~/smakfynd/workers/auth && npx wrangler secret put ADMIN_KEY`

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
