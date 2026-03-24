# Smakfynd — Data Pipeline

## Snabbstart (kör på din dator)

### 1. Installera dependencies
```bash
pip install requests rapidfuzz
```

### 2. Hämta Systembolaget-data
```bash
python scripts/scraper.py --systembolaget
```
Sparar till `data/systembolaget_raw.json`. Tar ~2-5 minuter (ca 2400 produkter).

### 3. Matcha mot Vivino
```bash
python scripts/scraper.py --vivino
```
Sparar till `data/matched_products.json` + `data/vivino_cache.json`.
**Första gången tar detta 1-3 timmar** (rate limit 1.5s per produkt).
Efterföljande körningar använder cachen och är mycket snabbare.

### 4. (Valfritt) Matcha öl mot Untappd
```bash
export UNTAPPD_CLIENT_ID="din_id"
export UNTAPPD_CLIENT_SECRET="din_secret"
python scripts/scraper.py --untappd
```
Registrera API-nycklar: https://untappd.com/api/

### 5. Beräkna poäng
```bash
python scripts/scraper.py --score
```
Sparar till `data/site_data.json` — detta är filen som sajten läser.

### Kör allt på en gång
```bash
python scripts/scraper.py
```

## Scoring-formeln

```
Smakfynd-poäng = (Kvalitet / Relativt pris) × 3.5

Kvalitet       = vivino_rating × (0.55 + 0.45 × min(reviews / 15000, 1.0))
Relativt pris  = produkt_literpris / kategorins_median_literpris
```

R�tt vin jämförs med rött vin, öl med öl. Högt betyg + billigare än snittet = hög poäng.
