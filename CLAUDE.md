# Smakfynd

Oberoende vinrankare för Systembolaget. Rankar ~10 000 viner efter kvalitet per krona.
Olav Innovation AB · Gabriel Linton · smakfynd.se

## Arkitektur

```
Frontend:  React SPA (vanilla JSX, ingen bundler) → GitHub Pages (docs/)
Backend:   4 Cloudflare Workers (auth, analytics, wine-ai, report)
Databas:   Cloudflare D1 (smakfynd-users, smakfynd-analytics)
Data:      Python-pipeline → JSON → statisk deploy
Fonts:     Instrument Serif + DM Sans (Google Fonts)
Analytics: GoatCounter (cookieless) + egen analytics-worker
```

## Byggpipeline

```bash
# Full rebuild (ordning spelar roll):
python3 scripts/fetch_systembolaget.py    # Hämta sortiment från SB API
python3 scripts/score_wines_v2.py         # Poängsätt alla viner
python3 scripts/build_app.py              # Konkatenera JSX-filer
python3 scripts/build_slim.py             # Generera wines.json (frontend-data)
python3 scripts/deploy_html.py            # Babel-transpilera + bygg index.html
python3 scripts/generate_landing_pages.py # 67 statiska SEO-sidor
python3 scripts/generate_monthly_seo.py   # Månadssida + billigt-och-bra etc
python3 scripts/generate_prissankt.py     # Prissänkt-sida
```

## Deploy

```bash
# Frontend (automatiskt via GitHub Pages på push till main):
git push  # → docs/ deployas till smakfynd.se

# Workers (manuellt):
cd workers/auth && npx wrangler deploy
cd workers/analytics && npx wrangler deploy
cd workers/wine-ai && npx wrangler deploy
cd workers/report && npx wrangler deploy
```

## Daglig uppdatering

- **GitHub Actions** (`daily-update.yml`): varje dag 06:00 UTC — hämtar SB-priser, ompoängsätter, bygger, pushar
- **Lokal cron** (`scripts/daily_update.sh`): samma + Vivino-matching (kräver Playwright)
- **Vivino-refresh**: Måndagar topp 100, 1:a varje månad full refresh (bara lokalt)
- **Veckorapport**: Report-worker skickar email varje måndag 07:00 UTC

## Filstruktur

```
src/
  App.jsx                    # Huvudapp, routing, filter, state
  constants.jsx              # DATA_URL, CATS, PRICES, analytics
  theme.jsx                  # Designtokens (t.wine, t.card, etc)
  hooks.jsx                  # useSaved() hook
  components/
    Card.jsx                 # Vinkort (expanderbart, liknande viner)
    ProductImage.jsx         # SB CDN-bilder (productId-baserat, webp)
    ScoreBars.jsx            # Crowd/expert-staplar
    FoodMatch.jsx            # AI-vinmatchare
    NewsletterCTA.jsx        # Email-capture (compact + full)
    WineOfDay.jsx            # Dagens vin (deterministiskt dagligt val)
    StoreMode.jsx            # "I butiken"-läge
    WeeklyPick.jsx           # Veckans fynd
    EditorsPicks.jsx         # Gabriels val
    QuickFilters.jsx         # Snabbfilter-knappar
    LoginModal.jsx + useAuth # Passwordless login + auth hook
    AgeGate.jsx              # Åldersverifiering

workers/
  auth/worker.js             # Login, subscribe, save, sync, unsubscribe, delete
  analytics/worker.js        # Event/search/AI-loggning, rate limiting
  wine-ai/worker.js          # Llama 3.1 70B via CF Workers AI
  report/worker.js           # Veckorapport via Resend

scripts/
  fetch_systembolaget.py     # SB API-scraper (publikt API, ingen nyckel privat)
  score_wines_v2.py          # Crowd + expert + pris → smakfynd_score
  vivino_playwright.py       # Vivino-scraper (gitignored, bara lokalt)
  build_slim.py              # Generera wines.json för frontend
  generate_landing_pages.py  # 67 statiska SEO-sidor
```

## Poängberäkning

```
smakfynd_score = kvalitet × 75% + prisvärde × 25%
kvalitet = crowd (Vivino) × vikt + expert (WineSearcher-kritiker) × vikt
prisvärde = 10.5 - (literpris / kategorimedian) × 5.0
```

Crowd-betyg: Vivino 5-skala → 10-skala med Bayesian shrinkage.
Expert: Snitt av upp till 6 kritiker (Suckling, Decanter, Falstaff, etc).
Konsensusbonus om crowd + expert överens.

## Viktiga beslut

- **Systembolaget har inget affiliate-program** — ingen intäkt per klick
- **Repot är publikt** — vivino_playwright.py ligger i .gitignore
- **Bilder**: SB bytte CDN-format 2026 — använder nu `productId` (inte `productNumber`) + `.webp`
- **wines.json töms ibland vid rebase** — kör alltid `build_slim.py` efter merge-konflikter
- **CSP**: Meta-tag i index.html (GitHub Pages stödjer inte HTTP-headers)
- **Token**: localStorage (inte httpOnly cookie) — workers är på annan subdomain

## Landningssidor (67 st)

Typ, druva, land, region, pris, mat, smak, säsong. Alla med:
- JSON-LD (ItemList, BreadcrumbList, FAQPage)
- Quick-nav + cross-links
- Prissänkt-sidan har interaktiv JS-sortering

## Workers-hemligheter (Cloudflare env vars)

- `ALLOWED_ORIGIN` = https://smakfynd.se
- `RESEND_API_KEY` (auth + report)
- `ADMIN_KEY` (admin-endpoints)
- `REPORT_EMAIL` (veckorapport-mottagare)
- `FROM_EMAIL` (avsändaradress)

## Vanliga kommandon

```bash
# Lokal utveckling
python3 scripts/deploy_html.py && open docs/index.html

# Testa newsletter-endpoint
curl -X POST https://smakfynd-auth.smakfynd.workers.dev/subscribe \
  -H "Content-Type: application/json" -d '{"email":"test@test.se"}'

# Se prenumeranter
curl https://smakfynd-auth.smakfynd.workers.dev/subscribers \
  -H "X-Admin-Key: $ADMIN_KEY"

# Trigga GitHub Pages rebuild
gh api repos/Lingabton/smakfynd/pages/builds -X POST
```
