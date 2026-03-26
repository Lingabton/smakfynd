# Smakfynd Feature Backlog

## Buggar / att fixa (persona-audit 2026-03-25)
- [ ] React hooks-violation: useState inuti render-funktion (Redaktionens val rad 1343, AI freetext rad 751) — extrahera till sub-komponenter
- [ ] Store mode visar bara 1 resultat — ändra .find() till .filter().slice(0,5)
- [ ] Död kod rad 598: `return results` i matchWinesForCourses nås aldrig
- [ ] Prisfilter-inkonsekvens: PRICES-arrayen (rad 17) vs renderade pills (rad 1452) har olika intervall

## Buggar / att fixa (äldre)
- [ ] Verifiera att ALLA SB-länkar fungerar (format: /produkt/vin/nr — fixat i kod men behöver testas bredare)
- [ ] Redaktionens val: klick → söker vinnamnet i listan, men borde scrolla dit och öppna kortet
- [ ] AI-matcharen: Card-kort inuti kraschar ibland? Testa edge cases
- [ ] "Gillar du X"-rekommendationer: ska öppna fullprofil, inte bara SB-länk

## UX/Design (feedback från kompis, runda 3)
- [ ] Komprimera detaljvyn — för mycket scroll för lite ny info
- [ ] Smakprofil: lägg till verbal descriptor ("fylligt, mörkfruktigt, mjukt")
- [ ] Crowd/Expert bars: mer kompakt, tydligare labels
- [ ] Hero: testa snabbingångar direkt ("Bäst till fredagstacos", "Röda under 120kr")
- [ ] Minska luft i hero — snabbare till action
- [ ] "Gillar du X? Testa även" — bygg ut som kärnfunktion (retention)
- [ ] Poängskala: tydligare vad 78 vs 83 betyder i praktiken
- [ ] CTA starkare visuellt — sök/filter/klick bör sticka ut mer
- [ ] Detaljvy: tydligare hierarki (1. Vad är det? 2. Varför bra köp? 3. Smak/mat 4. Alternativ)
- [ ] Kontrast: fortfarande lite blekt på boxar, linjer, smakprofil, etiketter
- [ ] Landflaggor på landningssidor (visuell differentiering)
- [ ] Kort: varje vin borde visa situationspassning ("Fynd till lamm", "Tryggt middagsvin")
- [ ] Minska luft ovanför first action på startsidan

## Persona-audit förbättringar (2026-03-25)
### Låg insats
- [ ] Visa kr/liter på alla kort (spec. BiB/Storpack)
- [ ] Visa "Under 80 kr"-filter (finns i data, dolt i UI)
- [ ] Kryss-länkar mellan landningssidor ("Se även: Bästa vita vin")
- [ ] Deep-links från landningssidor till huvudappen (#vin/nr)
- [ ] Minska hero-höjd på mobil — kollapsa trust-box som default
- [ ] "Tillbaka till toppen"-knapp
- [ ] "Tryck på ett vin för att se mer"-hint på första kortet
- [ ] Flytta font-<link> från komponent till <head>
- [ ] Utöka food-matching keywords: lamm, biff, entrecôte, BBQ, marinerat
- [ ] Visa eko-antal på filterpill ("🌿 Ekologiskt (342)")
- [ ] Lägg till fler länder i filter: Argentina, Nya Zeeland, Österrike
- [ ] CTA på landningssidor → AI-matchern

### Medel insats
- [ ] Sorteringsval: expert-score, crowd-score, pris, smakfynd-score
- [ ] Dela-knapp per vin (Web Share API på mobil)
- [ ] Budget-input till AI-matchern (snabbpills: under 100, 100-200, 200+)
- [ ] Smakpreferens-filter (fruktigt, torrt, lätt, fylligt) i huvudfiltret
- [ ] Visa individuella expert-källor per vin (Suckling: 91, Decanter: 88)
- [ ] Region-filter (Bordeaux, Toscana, Rioja, Barolo)
- [ ] Keyboard-accessibility: focus rings, tab order, aria labels
- [ ] Loading skeleton istället för "⏳ Laddar..."
- [ ] Prisfilter premium: 200-300, 300-500, 500+
- [ ] Prissegmentering på landningssidor (budget, mellanklass, premium)

### Hög insats
- [ ] Inloggningssystem (enkel auth — email/Google) för att samla användardata, spara viner cross-device, e-postutskick
- [ ] Streckkods-scanner i butikläge
- [ ] Delbar AI-vinlista ("Dela vinlista" för middagsbjudning)
- [ ] Årgångsinformation på vinkort
- [ ] Onboarding-guide för förstagångsbesökare
- [ ] Tannin/syra/mineralitet i smakprofil

## Nästa prioritet
- [ ] Fredags-nyhetsbrev "Veckans fynd" via Substack (smakfynd.substack.com)
- [ ] SEO-content: Substack-inlägg som rankar på Google ("bästa röda under 100 kr systembolaget")

## Nya ingångar / features
- [ ] Present-sektion: kurerade listor per prisklass (under 200, 200-300, 300-500, champagne)
- [x] "Stå i butiken"-läge: stort sökfält, snabbsök på namn/nr, visa Smakfynd-poäng + "bättre alternativ i samma prisklass"
- [ ] Streckkods-scanner: scrapa EAN-koder från SB API, använd BarcodeDetector API för scan → Smakfynd-poäng direkt
- [ ] Situationsbaserade ingångar: dejt, grillkväll, svärföräldrar, fredagsmys, picknick
- [ ] Säsongsinnehåll: sommarvin, kräftskiva, glögg, nyårsbubbel, midsommar
- [ ] "Jag gillar X, vad mer?": rekommendationer baserat på liknande vin
- [ ] "Vet ingenting om vin"-läge: enkel guide utan pretention

## Data & teknik
- [ ] Separera data från kod: wines.json separat fil, ladda async (bättre cachning, snabbare builds)
- [ ] Fräschare expertdata: scrapa Wine Enthusiast direkt (Kaggle-data är från 2017)
- [ ] Prishistorik: spara veckovis prissnapshots för att visa prisändringar
- [ ] Vinpriser.se deep scrape: 594 prissänkta viner, kräver paginering/filter-klick (bara 3 i hero laddas)
- [ ] Fler Vivino-matcher (scrapen var på 8516/13414)
- [ ] Wine-Searcher API för aggregerade kritiker-poäng
- [ ] Scrapa EAN/streckkoder från SB API (krävs för barcode-scanner)

## Analytics & SEO
- [ ] Registrera smakfynd.se i Google Search Console + skicka sitemap
- [ ] Koppla GoatCounter dashboard (smakfynd.goatcounter.com) — redan integrerat, kolla data
- [ ] Google Analytics eller Plausible som komplement?

## Content & distribution
- [ ] "Gabriels val" — månatlig landningssida med handplockade viner + texter, länka från huvudsidan (SEO + personligt innehåll)
- [ ] Blogpost-liknande format: "Viner i mars — test och rekommendationer"
- [ ] Instagram @smakfynd
- [ ] Reddit/Flashback/Facebook vingrupper (organisk reach)
- [ ] Substack SEO-artiklar per segment
