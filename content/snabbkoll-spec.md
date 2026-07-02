# Smakfynd — Snabbkollen Spec

> Namn: **Snabbkollen**
> Tagline: *"Kolla snabbt — i butik, hemma, eller på restaurang"*

## Vad vi bygger

En snabbsökningsfunktion som låter användaren hitta vad ett specifikt vin har för Smakfynd-poäng — och få bättre alternativ i samma prisklass — på sekunder.

Kontexter: i butiken, hemma, på restaurang, hos någon annan, innan middag.

## Designprincip

Friktion är produktdöd. Smakfynd måste leverera svar inom 3 sekunder.

---

## FAS 1 — Förbättra core-UX

### 1.1 Namn och positionering
- "Stå-i-butiken-läge" → "Snabbkollen"
- Tagline: "Kolla snabbt — i butik, hemma, eller på restaurang"

### 1.2 Prisspann som sekundär kontroll
- Diskret "Prisspann"-knapp ovanför sökrutan
- Klick → expanderbart filter (slider, default 0-500 kr)
- Sparas i localStorage

### 1.3 Bättre sökalgoritm
- Fuzzy-matching (fuse.js) med tolerans för stavfel
- Partiell matchning på flera fält: producent, vinnamn, region, druva
- Artikelnummer-detection (5+ siffror)
- Diakritik-tolerans: "valpolicella" → "Valpolicella"
- Stoppord: "vino", "wine", "doc", "docg"

### 1.4 Resultatvy med alternativ — kärnmekaniken

**Huvudkort:** Vinets namn, producent, land/region, druva, Smakfynd-poäng, pris, prisvärde-indikator

**Tre typer av rekommendationer:**

Typ A — "Bättre i samma prisklass" (1-2 st)
- Samma kategori, pris ±20%, poäng minst +5
- Label: "Liknande, +X poäng"

Typ B — "Samma kvalitet, lägre pris" (1 st)
- Samma kategori, poäng ±3, pris minst 25% lägre
- Label: "Samma kvalitet, X kr billigare"

Typ C — "Värt att gå upp i pris" (0-1 st)
- Samma kategori, pris 30-100% högre, poäng +8
- Bara om sökta vinet < 75 poäng
- Label: "Märkbart bättre för X kr extra"

Om inga alternativ: "Du gjorde rätt val — inget bättre i prisklassen"

### 1.5 Tillgänglighetsmarkering
- availability_score (0-1) per vin
- Brett tillgängligt (≥0.7) / Fråga din butik (0.3-0.7) / Beställningsvara (<0.3)
- Fallback: assortment-fältet som proxy

### 1.6 Senaste sökningar
- 5 senast sökta viner som chips, localStorage
- Klick → samma resultatvy

### 1.7 Ta bort topplista från huvudvy
- Flytta ner eller transformera till "Veckans fynd" (3-5 kuraterade)

### 1.8 Header-knappen
- "Tillbaka till Smakfynd" → "Hela rankingen"

---

## FAS 2 — Streckkodsskanning

### 2.1 Två vägar
- Väg A — Hyllkant (Sb-nr streckkod)
- Väg B — Flaska (EAN-13 → mappa till Sb-nr)

### 2.2 EAN-mappning
- Verifiera SB API för EAN-fält
- Fallback: Open Food Facts API
- Berika wines-tabellen med ean-kolumn

### 2.3 UI
- Stor central knapp: "Skanna streckkod"
- Helsides-kameravy med målvinjett
- Automatisk skanning, ingen knapp
- Haptic feedback vid lyckad skanning
- "Skanna nästa"-knapp på resultatvy

### 2.4 Felhantering
- Streckkod ej i databas → manuell sökning
- Kamera startar inte → permissions-guide
- Timeout 30s → fallback sökning

### 2.5 Bibliotek
- @zxing/library (EAN-13, Code128)
- Alternativ: quagga2, html5-qrcode

---

## FAS 3 — Polering

### 3.1 PWA-installation prompt
### 3.2 Offline-läge (topp 1000 viner cachade)
### 3.3 Snabb-jämförelse-vy (3+ skannade viner sida vid sida)
### 3.4 Butiks-läge (större font, mer kontrast)
### 3.5 AI-vision som tredje fallback (utvärdering)

---

## Edge cases
- Vin ej i databas → producent/region/druva-sökning
- Streckkod igenkänd men ej matchad → visa EAN + manuell sökning
- Offline → cachad data
- Kamera-permission nekad → guide + manuell fallback
- Samma namn/olika årgångar → visa båda
- 50+ resultat → topp 10 + "fler resultat"
- Dubbelskanning → samma resultat, inget extra anrop

## Mätning
- Funnel: sidvisning → sökning → resultat → alternativ klickad
- Skanning success rate
- Tid till svar (median)
- Kontext-fördelning (butik vs hemma)
- Återkomst-frekvens
