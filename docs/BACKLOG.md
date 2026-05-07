# Smakfynd Feature Backlog
*Uppdaterad 2026-05-07*

## Kvar att göra

### UX — låg insats
- [x] SaveButton: click-outside stänger menyn (2026-05-07)
- [x] Ogiltigt vin-deep-link — visar "Vinet hittades inte" toast (2026-05-07)
- [x] Kamera-nekad i barcode scanner — visar felmeddelande (2026-05-07)
- [x] Sökfältet: synlig X-knapp för att rensa (2026-05-07)
- [x] Fontinkonsistens: alla 75 landing pages nu Newsreader + Inter (2026-05-07)

### Vivino-data
- [ ] Kör vivino_playwright.py --refresh-top 500 (kräver manuell CAPTCHA-lösning)
- [ ] Kör score_wines_v2.py + full rebuild efter lyckad scrape
- [ ] Vikta kritiker olika baserat på tillförlitlighet/korrelation med crowd

### Plattform (pågående)
- [ ] Supabase-integration på huvudsajten (shared auth med quiz)
- [ ] Login/Min profil i headern (magic link)
- [ ] "Spara vin"-funktion (Supabase saved_wines-tabell)
- [ ] Profilsida /profil (email, sparade viner, quiz-länk, premium-placeholder)
- [ ] Sparade-viner-sida /sparade (listvy med sortering)
- [ ] Snabbkollen synligare (CTA i header/hero)
- [ ] AI-vinmatchare som interaktiv input på framsidan

### Stora features
- [ ] Delbar AI-vinlista ("Dela vinlista" för middagsbjudning)
- [ ] "Vet ingenting om vin"-läge: enkel guide utan pretention
- [ ] Present-sektion: kurerade listor per prisklass
- [ ] Situationsbaserade ingångar: dejt, grillkväll, svärföräldrar, fredagsmys

### Data & teknik
- [ ] Fräschare Wine Enthusiast-data (Kaggle är från 2017)
- [ ] 70% av viner saknar food_pairings — begränsar mat-filter
- [ ] 53% saknar expert_score — visa tydligare att data saknas istf tomma staplar
- [ ] 35% saknar image_url — överväg fallback-bilder per kategori
- [ ] 37% har tom grape-sträng — påverkar liknande-viner-matchning

### Att konfigurera
- [ ] Cloudflare Email Routing: `hej@smakfynd.se` → `gabriel.linton@inn.no`
- [ ] Fyll i organisationsnummer i `/integritet/` (`[ORG-NR]`)

### Content & distribution
- [ ] Fredags-nyhetsbrev "Veckans fynd" via Substack
- [ ] Substack SEO-artiklar: "bästa röda under 100 kr systembolaget"
- [ ] Instagram @smakfynd
- [ ] Reddit/Flashback/Facebook vingrupper

---

## Klart (session 2026-05-06/07 — persona-review)
- [x] Prissänkta viner: 0→149 synliga (first_seen_prices backfillad, committad till repo)
- [x] Dagliga prissnapshottar committas till repo (inte bara cache)
- [x] Drop-datum spåras i first_seen_prices.json
- [x] Prissänkt-badge (−X%) på vinkort + genomstruket gammalt pris
- [x] Filterräknare matchar faktiskt synliga resultat (respekterar sortiment/förpackning)
- [x] "Se alla X prissänkta →" länk till /prissankt/ vid aktivt filter
- [x] Cache-busting: wines.json?v=TIMESTAMP vid varje deploy
- [x] Tillgänglighet: ta bort maximum-scale=1.0 (tillåter zoom)
- [x] ARIA live region på filterräknare
- [x] Kompakt FoodMatch + Snabbkollen — vinlistan synlig utan scroll
- [x] Spinner-animation i AI-matchare under laddning
- [x] "Skicka kod igen" med 30s cooldown i login
- [x] Canonical tag på integritetssidan
- [x] Sök ignorerar kategori-filter (söka "riesling" i "Rött" funkar)
- [x] "Försök igen" laddar om data utan full page reload
- [x] Login sync skickar mergad data (inte stale pre-merge state)
- [x] Sparade viner capped till 20 renders (perf)
- [x] "(kommer snart)" borttagen — login finns redan
- [x] Profile: .catch() vid token expiry (undviker evigt "Laddar...")
- [x] CI workflow: ta bort prisdata från fragil cache, committa istället

## Klart (session 5 — 2026-04/05)
- [x] Inloggningssystem: passwordless email + 6-digit code
- [x] Synka sparade viner mellan enheter
- [x] Betygsättning (1-5 stjärnor) per vin
- [x] Prislarm + tillgänglighetslarm
- [x] Källarhantering + provningsanteckningar
- [x] Min sida: dashboard med 5 flikar (Sparade/Betyg/Larm/Källare/Smakprofil)
- [x] Smakprofil härlett från högt betygsatta viner
- [x] Streckkods-scanner (html5-qrcode) + etikett-OCR (AI)
- [x] Crowdsourced EAN-mappning via analytics worker
- [x] Snabbkollen: rekommendationer (bättre i samma pris, billigare med samma kvalitet)
- [x] Veckorapport-worker (Resend, cron måndag 07:00 UTC)
- [x] Daglig uppdatering via GitHub Actions (06:00 UTC)
- [x] 67+ SEO-landningssidor (druva, land, region, pris, mat, smak, säsong)
- [x] Prissänkt-sida med interaktiv sortering
- [x] Sigmoid score rescaling — full 25-95 range
- [x] Blended price scoring — fair across price classes
- [x] Profile dashboard: Min sida

## Klart (session 4 — 2026-03-28)
- [x] Bugg: prisfilter använder nu PRICES-konstanten istället för hårdkodad array
- [x] Bugg: Redaktionens val scrollar till #vin/{nr} istället för att söka
- [x] Bugg: "Gillar du X" har SB-länk till Systembolaget
- [x] Kritiker: individuella scores visas per vin (pipeline end-to-end)
- [x] Kritiker: "N av N kritiker ger 85+" social proof-chip
- [x] UX: eko-antal på filterpill ("Ekologiskt (342)")
- [x] UX: flytande "tillbaka till toppen"-knapp
- [x] UX: fler länder i filter (Argentina, Nya Zeeland, Österrike)
- [x] UX: fler food-keywords (Pasta, Lamm)
- [x] UX: sorteringsval (expert, crowd, pris)
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
- [x] JSX uppdelad i 14 src/-filer
- [x] JSON Schema-validering av wines.json
- [x] Test-suite: 28 tester (scoring + data)
- [x] GitHub Action: CI på varje push
- [x] Felhantering: retry, offline-meddelande
- [x] CSS-variabler i :root
- [x] Analytics: event tracking, AI-loggning
