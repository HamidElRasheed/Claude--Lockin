# Lockin

En mobilapp for daglige mål der du **prater deg gjennom dagen på under to minutter** hver kveld. Appen husker *hvorfor* noe ikke ble gjort, og gjør det om til en dagsrapport og en ukesrapport med konkrete forslag.

Laget på **Oslo Sprint, 6.–8. november 2026**, av HamidElRasheed (app) og abala-108 (backend).

## Problemet

Vaneapper registrerer *om* du gjorde noe. De krever mye oppsett, streaks straffer én dårlig dag, og etter noen uker gir de fleste opp. Det som faktisk hjelper deg å endre noe, er å forstå *hvorfor* det ikke ble gjort, og det skriver ingen ned.

## Løsningen

Hver kveld trykker du på mikrofonen og snakker fritt om dagen, én gang. AI-en krysser av alle målene, spør kort om de du ikke nevnte, og gir dagen et poeng fra 1 til 10. Grunnene du sier, blir råstoffet for rapportene.

| Skjerm | Hva den gjør |
|---|---|
| **I dag** | Dagens mål og når kvelden er. «+ Nytt mål» legger til et mål på et par trykk. |
| **Kveld** ⭐ | Snakk én gang om hele dagen → tale til tekst → AI tolker alle mål → spør om de som mangler → dagspoeng 1–10 og hvor fornøyd du er. Knapper finnes alltid som reserve. |
| **Dagene** | Én rad per kveld med dagspoeng. Hver dag har status, grunner, en kort rapport og ett tips til i morgen. |
| **Uka di** | Snitt og dagspoeng per dag mot ukemålet ditt, mønstre og det som holdt i egne bokser, og forslag med «Ja, gjør det» som flytter målet og gir en lenke til Google Kalender. |
| **Fremgang** | Fire uker: uker, ukedager og et varmekart per mål. «Sirkelen» viser vennesirkler (se under). |
| **Mål** | Alle mål og ukemålet, for eksempel «minst 7/10 på 5 av 7 dager». |

**Prinsipper:** under to minutter om dagen, én ting per skjerm, AI-en sier lite, ingen streaks og ingen straff, lav terskel.

### Hva som er ekte og hva som er demo

- **Ekte og koblet til backend:** mål, i dag, tale til tekst, tolkning med AI, dagspoeng, dagslogg, ukesrapport med AI, fremgang, ukemål, forslag til kalender og oppsett fra fritekst.
- **Demo (bare visuelt):** *Sirkelen*, altså vennesirkler med toppliste, sirkel mot sirkel og ukens duell. Din egen rad bruker dine ekte tall, mens vennene og de andre sirklene er demodata merket «Forhåndsvisning». Se `DECISIONS.md` punkt 17.

## Personvern

- **Lyd lagres aldri.** Opptaket blir til tekst og slettes med en gang, både på telefonen og på serveren, også ved feil.
- Bare tekst lagres: mål, grunner, poeng og rapporter. Ingen konto, ingen sporing, ingen reklame.
- Appen forklarer dette i et kort første gang den åpnes, og på siden «Dine data».

## Teknologi

| Del | Valg |
|---|---|
| App | Expo SDK 58 (React Native) + TypeScript, Expo Router, kjører i Expo Go |
| Backend | Python 3.13 + FastAPI + SQLAlchemy (SQLite) |
| Tale til tekst | ElevenLabs Scribe, med Groq Whisper som reserve |
| AI | Claude Haiku 5.5 med strukturert JSON-output |

API-avtalen mellom app og backend ligger i [`docs/API.md`](docs/API.md). Beslutninger og hvorfor står i [`DECISIONS.md`](DECISIONS.md).

## Kom i gang

### Backend

```bash
cd backend
py -3.13 -m venv .venv
.venv\Scripts\activate            # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env              # legg inn ELEVENLABS_API_KEY og ANTHROPIC_API_KEY
python seed.py                    # fire uker med demodata
uvicorn app.main:app --host 0.0.0.0 --port 8000
pytest                            # 58 tester
```

Interaktiv API-dokumentasjon: `http://localhost:8000/docs`.

### App

```bash
cd mobile
npm install
cp .env.example .env
```

I `mobile/.env`:
- `EXPO_PUBLIC_USE_MOCK=true` kjører hele appen på innebygde demodata, uten backend.
- `EXPO_PUBLIC_USE_MOCK=false` og `EXPO_PUBLIC_API_URL=http://<PC-ens IP>:8000` bruker den ekte backenden.

```bash
npx expo start                    # skann QR-koden med Expo Go på iPhonen
npx expo start --tunnel           # hvis nettet blokkerer trafikk mellom enheter
npx tsc --noEmit && npx expo lint
```

## Struktur

```
mobile/   Expo-appen (src/app = skjermer, src/components, src/lib/api.ts, src/theme)
backend/  FastAPI (app/routers, app/services, app/prompts, seed.py, tests)
docs/     API.md (avtalen) og SYNC.md (meldinger mellom app- og backend-agenten)
```
