# CLAUDE.md: Lockin

Dette er prosjektets hovedfil for Claude. Les den før du gjør noe, og følg den. Er noe uklart, eller vil du bryte en regel her, så **spør i stedet for å gjette**.

---

## 1. Hva vi bygger

**Lockin** (arbeidstittel) er en mobilapp for daglige mål og vaner. Hver kveld prater du deg gjennom dagens mål på **under 2 minutter**. Appen husker *hvorfor* du feilet, og lager dagslogger og en ukesrapport med konkrete forslag.

Det som skiller appen fra andre: de registrerer *om* du gjorde noe, mens vi lagrer *hvorfor ikke*. Den grunnen er råstoffet for alle rapportene.

**Kontekst:** Oslo Sprint hackathon. **Kodefrys søndag 8. november 2026 kl. 14:00.** Målet er å være ferdig kl. 12:00. Pitchen er på 2 minutter. Juryen leser commit-historikken.

**Akkurat nå optimaliserer vi for hackathonet.** Det viktigste er:
1. Et rent design som føles ferdig.
2. En backend og et system som virker fra start til slutt.
3. En logg som lagres og vises.

Ikke heng deg opp i små detaljer, men lever aldri noe som ser halvferdig ut.

---

## 2. Produktregler (gjelder alt)

1. **Under 2 minutter om dagen.** Alt som tar lengre tid, er feil.
2. **Én ting per skjerm.** Ingen dashbord, ingen tette lister med statistikk.
3. **AI-en sier lite.** Korte spørsmål, ingen preken, ingen «Flott jobbet! 🎉».
4. **Ingen streaks og ingen straff.** Det er rom for å feile. Vis aldri «du brøt rekka».
5. **Lav terskel.** Smarte standardvalg, så brukeren bekrefter i stedet for å fylle ut.
6. **Ingen AI-slop.** Se designreglene. Kvaliteten i gjennomføringen er hele poenget.

### Flyten

**Oppsett (første gang):** brukeren skriver eller sier hva de vil få til, AI-en lager målkort, brukeren bekrefter og velger kveldstid. *(Innlogging er ikke med i hackathonet. Vi bruker én fast demobruker.)*

**Daglig bruk, fire skjermer:**
1. **Morgen:** dagens mål med tidspunkter. Rent og rolig.
2. **Kveldsgjennomgang** ⭐ *(hjertet og hoveddemoen)*: AI-en viser ett mål om gangen som tekst. Brukeren holder inne en knapp og snakker. Talen gjøres om til tekst, og AI-en tolker svaret som `done` / `partial` / `missed`, pluss en grunn. Til slutt kommer en fri oppsummering av dagen. Det skal også gå an å svare manuelt med knapper.
3. **Dagslogg:** per dato vises målene med status, en kort rapport på 2–3 linjer og én boks «I morgen» med ett forbedringspunkt.
4. **Ukesrapport** *(viktigst)*: mønstre, hvorfor noe feilet og hvorfor noe fungerte, og 1–3 konkrete forslag, gjerne med tidspunkt. For eksempel: «Du dropper trening på onsdager fordi du jobber sent. Flytte til torsdag 07:00?»

**AI-en har ingen stemme.** Alt AI-en sier, vises visuelt. Bare brukeren snakker.

---

## 3. Omfang for hackathonet

**MED:**
- Oppsett av mål, både fra fritekst og med manuell redigering.
- Morgenskjerm, kveldsgjennomgang med tale, dagslogg og ukesrapport.
- Ferdig utfylte demodata (seed) for en hel uke, slik at ukesrapporten har noe å vise.

**JUKSET ELLER UTE (ikke bygg dette uten at teamet ber om det):**
- Innlogging og kontoer. Vi har én demobruker, men `user_id` finnes i datamodellen allerede nå.
- Ekte kobling til Google Kalender. Forslagene vises i ukesrapporten, men skrives ikke til noen kalender.
- Push-varsler, betaling (RevenueCat kommer senere), dark mode-varianter, innstillingssider og animasjonsbiblioteker.
- Supabase, Firebase eller andre ferdige backend-tjenester. **Aldri.**

---

## 4. Teknologi (bestemt)

| Del | Valg | Merknad |
|---|---|---|
| App | **Expo (React Native) + TypeScript**, Expo Router | Må kjøre i **Expo Go** på iPhone. Ingen pakker som krever egne native moduler eller utviklerbygg |
| Opptak | `expo-audio` | Fungerer i Expo Go |
| Backend | **Python 3.13 + FastAPI** | Pydantic for validering. Automatisk OpenAPI på `/docs`. Ikke 3.15: mange pakker mangler ferdige versjoner for den |
| Database | **SQLite** via **SQLAlchemy 2.0** | Bytte til PostgreSQL senere skal bare kreve endring av `DATABASE_URL` |
| Tale til tekst | **ElevenLabs Scribe** (kreditter fra hackathonet), **Groq Whisper** som gratis reserve. Ligger bak `services/stt.py` | Norsk. Leverandøren skal kunne byttes |
| AI (tolking og rapporter) | **Claude Haiku 5.5** (`claude-haiku-5-5`) via `anthropic`-SDK-en, med `messages.parse` og Pydantic for strukturert output. Ligger bak `services/ai.py` | Modellen settes med `AI_MODEL` i `.env`. Effort `low` |

Ikke legg til nye avhengigheter uten god grunn. Skriv grunnen i commit-meldingen.

---

## 5. Repostruktur

```
/
├── CLAUDE.md            ← denne filen
├── README.md            ← for juryen og andre mennesker
├── PLAN.md              ← hvem gjør hva og hva som er ferdig (oppdateres hele tiden)
├── DECISIONS.md         ← beslutninger og hvorfor
├── KONTEKST.md          ← bakgrunn fra idéfasen
├── docs/
│   ├── API.md           ← API-AVTALEN mellom app og backend (kilden til sannhet, v1)
│   └── SYNC.md          ← meldinger mellom APP- og BACKEND-agenten
├── mobile/              ← Expo-appen (SDK 58). Les også mobile/AGENTS.md
│   ├── src/
│   │   ├── app/         ← Expo Router-skjermer (hver fil er en skjerm)
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx           (morgen)
│   │   │   ├── onboarding.tsx      (oppsett)
│   │   │   ├── review.tsx          (kveldsgjennomgang)
│   │   │   ├── log/index.tsx       (logg-liste)
│   │   │   ├── log/[date].tsx      (én dag)
│   │   │   └── week.tsx            (ukesrapport)
│   │   ├── components/  ← gjenbrukbare UI-deler (Screen.tsx er grunnlayouten)
│   │   ├── lib/
│   │   │   ├── api.ts   ← ALLE kall til backend går herfra
│   │   │   ├── types.ts ← typer som speiler docs/API.md
│   │   │   └── mock.ts  ← mockdata med samme form som API-et
│   │   └── theme/       ← design-tokens: farger, typografi og avstander
│   ├── assets/
│   └── .env.example     ← kopieres til .env
│                        (importer med @/…, for eksempel `@/theme` og `@/lib/api`)
└── backend/
    ├── app/
    │   ├── main.py      ← FastAPI-app og ruter
    │   ├── config.py    ← innstillinger fra miljøvariabler
    │   ├── db.py        ← engine og session
    │   ├── models.py    ← SQLAlchemy-modeller
    │   ├── schemas.py   ← Pydantic-modeller (speiler docs/API.md)
    │   ├── routers/     ← goals, today, transcribe, reviews, logs, reports
    │   ├── services/    ← stt.py, ai.py, reports.py (logikken ligger her, ikke i rutene)
    │   └── prompts/     ← AI-promptene som egne filer (.md)
    ├── seed.py          ← demouke
    ├── tests/
    ├── requirements.txt
    └── .env.example
```

**Regel:** appen jobber bare i `mobile/`, og backend bare i `backend/`. Endringer i `docs/API.md` krever at **begge** i teamet er enige.

---

## 6. Hvordan delene kobles sammen

0. **Agentene snakker sammen via `docs/SYNC.md`.** Ved start av **hver** oppgave: `git pull origin main` og les de åpne meldingene der. Når du endrer noe den andre siden må vite om, skriv en melding der og push den til `main` med en gang. Se reglene øverst i filen. Ikke be brukeren «bli enig med den andre». Les eller skriv i SYNC.md i stedet.
1. **`docs/API.md` (v1) er avtalen.** Den er låst, og vi bygger mot den. Backend implementerer den, og appen bruker den. Endres den, oppdateres `mobile/src/lib/types.ts` og `backend/app/schemas.py` i samme commit (eller samme PR).
2. **Appen starter med mockdata** (`src/lib/mock.ts`) som har nøyaktig samme form som API-et. Dermed blir ingen blokkert. Bytt til ekte API med `EXPO_PUBLIC_USE_MOCK=false`.
3. **Adressen til backend** settes i `mobile/.env` som `EXPO_PUBLIC_API_URL`.
4. **Mobilen når backend slik:** kjør `uvicorn app.main:app --host 0.0.0.0 --port 8000` og bruk PC-ens IP-adresse på det lokale nettet (samme Wi-Fi). Hvis hackathon-nettet blokkerer trafikk mellom enheter, bruk en tunnel (for eksempel `cloudflared` eller `ngrok`).
5. **Backend sjekkes på `http://localhost:8000/docs`**, der FastAPI lager interaktiv dokumentasjon automatisk.

---

## 7. Kommandoer

**Backend** (fra `backend/`):
```bash
py -3.13 -m venv .venv          # Python 3.13 (installer med `py install 3.13`)
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env            # fyll inn nøkler
python seed.py                  # demouke (når den er laget)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pytest
```

> **Windows: «En programkontrollpolicy har blokkert denne filen».** Smart App Control blokkerer SQLAlchemy sine kompilerte filer. Installer SQLAlchemy som ren Python i stedet (endre aldri sikkerhetsinnstillingene):
> `set DISABLE_SQLALCHEMY_CEXT=1` og deretter `pip install --force-reinstall --no-deps --no-binary sqlalchemy SQLAlchemy==2.1.8`
> I Git Bash: `DISABLE_SQLALCHEMY_CEXT=1 pip install --force-reinstall --no-deps --no-binary sqlalchemy SQLAlchemy==2.1.8`

**App** (fra `mobile/`):
```bash
npm install
cp .env.example .env
npx expo start                  # skann QR-koden med Expo Go på iPhonen
npx tsc --noEmit                # typesjekk
npx expo lint
npx expo install <pakke>        # bruk ALLTID denne i stedet for npm install <pakke>
```

---

## 8. Designregler: «Pust» (mot AI-slop)

Designretningen heter **Pust** (se `DECISIONS.md`). Appen snakker til brukeren i rolige setninger, og brukeren snakker tilbake. Alle verdier ligger i `mobile/src/theme/`, og prototypen ligger på designlerretet i Claude.

- **Appen «snakker» med serif.** Alt appen sier (spørsmål, svar, rapporter) skrives i systemets serif-skrift (`type.voice`, New York på iPhone) med komponenten `Voice`. Brukerens egne ord og resten av grensesnittet bruker systemfonten. Dette er de eneste to skriftene. Maks tre størrelser per skjerm.
- **To stemninger, ikke en mørk modus:** `dawn` (lys og varm: morgen, ukesbrev, oppsett) og `dusk` (dyp blå skumring: kveldsgjennomgang og ferdig-skjermen). Fargene kommer bare fra `palettes` i temaet.
- **Lyskulen (`Orb`) er den eneste pynten.** Den puster sakte og blir større og lysere mens brukeren snakker. Den myke gløden rundt kulen er den eneste gløden i appen. Ingen gradienter andre steder, og ingen lilla «AI-glød».
- **Trykk for å starte og stoppe; ett opptak for hele dagen** i kveldsgjennomgangen, med haptikk (`expo-haptics`) ved start og stopp. Appen krysser av målene den hørte og spør bare om dem som ikke ble nevnt. Det skal alltid gå an å svare med knapper.
- **Ingen straff:** status vises med `StatusMark` (fylt, halv eller tom ring). Aldri rødt, aldri «du brøt rekka».
- **Én ting per skjerm og én primærknapp.** Rolig og ren, med et 8-punkts rutenett (8, 16, 24, 32, 48, 72).
- **Ingen emoji som ikoner**, ingen kort-i-kort og ingen tunge skygger.
- **Tekstene er korte, på norsk** og i et varmt, nøkternt du-språk. AI-en sier lite: «Notert.», «Forstått.», «Sov godt.» Ingen utropstegn.
- **Alle tilstander er designet:** lasting, tom tilstand og feil.
- **Bevegelse** er langsom og myk (pust, ikke sprett), og laget med `Animated` fra React Native, ikke et eget animasjonsbibliotek.

**Test før du sier at en skjerm er ferdig:** ville dette sett ut som en app fra et ordentlig produktteam? Hvis ikke, er den ikke ferdig.

---

## 9. Kodekonvensjoner

**Generelt**
- Kode, variabler og kommentarer skrives på **engelsk**. Tekster brukeren ser, skrives på **norsk**.
- Små, lesbare filer. Én komponent eller tjeneste per fil.
- Ingen død kode, ingen `console.log` eller `print` til feilsøking i commits, og ingen hemmeligheter i koden.

**TypeScript (mobile/)**
- `strict: true`. Ingen `any`. Typer i `src/lib/types.ts` speiler `docs/API.md`.
- Alle nettverkskall går gjennom `src/lib/api.ts`, aldri `fetch` direkte i skjermene.
- Expo endrer seg fra versjon til versjon. Sjekk dokumentasjonen for SDK 58 før du bruker et Expo-API (se `mobile/AGENTS.md`).
- Stil kommer fra `theme/`. Ingen fargekoder eller tall skrevet rett inn i komponentene.
- Funksjonelle komponenter og hooks. Hold tilstand lokalt så lenge det går, og innfør ikke et eget bibliotek for tilstandshåndtering uten grunn.

**Python (backend/)**
- Typehint overalt. Pydantic-skjemaer for all input og output.
- Rutene er tynne. Logikken ligger i `services/`.
- Feil gis tilbake som `{"error": {"code": "...", "message": "..."}}` med riktig HTTP-statuskode.
- Hemmeligheter leses bare fra miljøvariabler (`config.py`). `.env` skal aldri committes.

---

## 10. AI-regler

- **Promptene ligger i `backend/app/prompts/`** som egne filer, ikke som lange strenger i koden.
- **Svarene fra AI-en er strukturert JSON** som valideres med Pydantic. Hvis valideringen feiler, prøv én gang til og returner deretter en ryddig feil.
- **Tolking av svar** (`done` / `partial` / `missed` og grunn): kort, deterministisk og på norsk. Ved tvil, velg `partial` og ta med det brukeren sa.
- **Dagsrapporten:** 2–3 setninger, pluss ett konkret punkt for i morgen.
- **Ukesrapporten:** bygger bare på det brukeren faktisk har sagt (grunner og oppsummeringer). Den skal aldri finne på noe. Forslagene skal være konkrete og ha tidspunkt der det passer.
- **Tonen:** varm og nøktern. Ingen moralisering og ingen «Fantastisk!».
- Send bare de dataene som trengs til AI-tjenesten.

## 11. Personvern

- **Lyd lagres aldri.** Opptaket transkriberes og slettes med en gang, også når noe feiler.
- Bare tekst lagres: grunner, oppsummeringer og rapporter.
- Ingen personopplysninger i logger eller feilmeldinger.

---

## 12. Git-regler (juryen ser historikken)

- **`main` skal alltid virke.**
- Korte grener: `app/<ting>`, `backend/<ting>`, `docs/<ting>`. Merge til `main` **flere ganger om dagen**.
- **Commit ofte og i små biter**, med beskrivende meldinger, for eksempel `backend: add transcribe endpoint`.
- **Begge i teamet skal committe.**
- Kjør `git pull` før du begynner, og før du pusher.
- Aldri `--force` på `main`. Aldri commit `.env`, `node_modules`, `.venv` eller databasefiler.
- **Oppdater `PLAN.md`** når du blir ferdig med eller begynner på en oppgave.

## 13. Når er noe ferdig?

En oppgave er ferdig når:
1. Den virker på en ekte iPhone i Expo Go (for app) eller i `/docs` og `pytest` (for backend).
2. Den følger API-avtalen, designreglene og kodekonvensjonene.
3. Typesjekk og tester er grønne.
4. Den er committet, pushet og avkrysset i `PLAN.md`.
