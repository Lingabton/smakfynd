# Så rankar vi — Smakfynds metod

## Datakällor

Smakfynd-poängen baseras på tre oberoende datakällor:

1. **Crowd-betyg (Vivino)** — Betyg från hundratusentals privatpersoner. Vi kräver minst 25 recensioner för att inkludera ett vin. Betyget justeras med Bayesian shrinkage för att inte övervärdera viner med få men höga betyg.

2. **Expertrecensioner (Wine Enthusiast)** — Professionella vinkritikers bedömningar på 100-poängsskalan. Omräknade till 10-skala för jämförbarhet.

3. **Prisdata (Systembolaget)** — Dagliga priser från Systembolagets publika API. Prisvärde beräknas relativt kategorimedianen: ett vin som kostar hälften av snittet för sin typ får högt prisvärde.

## Beräkning

```
Smakfynd-poäng = kvalitet × 75% + prisvärde × 25%

Kvalitet = crowd-betyg × vikt + expertbetyg × vikt
    Om båda finns: snittet + bonus vid överensstämmelse
    Om bara ett: det som finns (expertbetyg justerat ×0.9 utan crowd-validering)

Prisvärde = 10.5 - (literpris / kategorimedian) × 5.0
    Blandat: 60% prisjämförelse inom prisklass + 40% absolut
```

Poängen mappas till en 25–95-skala med sigmoid-kurva. Kvalitetsgolv: viner under 6.3 i kvalitetspoäng kapas vid 50/100.

## Vad poängen INTE är

- Inte ett smakbetyg. Ett vin med 90/100 smakar inte bättre än ett med 70/100 — det ger mer kvalitet per krona.
- Inte en absolut kvalitetsmätning. Ett billigt vin med hög poäng kan vara bättre "deal" än ett dyrare med lägre poäng, utan att det billiga vinet objektivt sett är bättre.
- Inte en rekommendation. Dina preferenser (kropp, sötma, druva) styr vilka viner du gillar — poängen säger bara vilka som ger mest för pengarna.

## Täckning

| | Antal | Andel |
|---|---|---|
| Systembolagets sortiment | ~13 190 viner | 100% |
| Betygsatta (har poäng) | 4 362 | 33% |
| Obetygsatta (smakprofil) | 8 828 | 67% |
| Har crowd-betyg (25+ rec.) | 823 | 6% |
| Har expertbetyg | 4 052 | 31% |
| Har bådadera | 513 | 4% |

### Varför bara 33%?

De flesta viner saknar tillräckligt med recensioner. Systembolagets sortiment inkluderar tusentals ordervaror och regionala viner som få recenserat. Vi visar dem ändå — med Systembolagets egen smakprofil (fyllighet, sötma, syra, strävhet) — men utan poäng.

**Vi gissar inte.** Ett vin utan tillräckligt underlag får märkningen "Ej betygsatt" med en smakprofil. Det är ärligare än att fabricera en siffra.

## Konfidensnivåer

| Nivå | Betydelse |
|---|---|
| **Hög** | Både crowd-betyg (25+ recensioner) och expertbetyg — två oberoende signaler |
| **Medel** | En av de två, tydligt över gränsen |
| **Låg** | En av de två, nära gränsen |

## Uppdateringsfrekvens

- Priser: dagligen via Systembolagets API
- Crowd-betyg: veckovis (lokalt, Vivino-matchning)
- Expertbetyg: manuellt, vid nya recensioner
- Listorna: genereras om vid varje prisuppdatering

## Kända begränsningar

1. **Vivino-beroendet.** Crowd-betyg kommer från en enda källa. Om matchningen misslyckas (felstavat namn, förändrat sortiment) kan ett vin tappa sin crowd-komponent.

2. **Expertbetyg är överviktat.** 4 052 av 4 362 betygsatta viner har expertbetyg men bara 823 har crowd. Poängen speglar kritikervärldens syn mer än vanliga drickares.

3. **Prisvärde straffar premium.** En Barolo till 500 kr kan objektivt sett vara fantastisk, men om kategorimedianen är 200 kr får den lågt prisvärde. Det är avsiktligt — sajten riktar sig till den som vill ha mest för pengarna, inte den som söker det bästa oavsett pris.

4. **Ingen personalisering.** Poängen är densamma för alla. Ett vin du älskar kan ha låg poäng, och vice versa. Det gör poängen jämförbar men inte personlig.

---

*[PLACEHOLDER — Gabriel skriver eventuell avslutande text om oberoende]*

Senast uppdaterad: [genereras automatiskt]
